// HTTP handlers for /pressure-cooker/api/*. Thin: validate, check caps, call the step,
// shape the reply. Nothing a visitor sends is stored.

import type { PoolRecipeData } from "../src/data/pool.ts";
import { POOL } from "../src/data/pool.ts";
import type { Restriction } from "../src/engine/diet.ts";
import { buildReference } from "../src/engine/list.ts";
import { rankRecipes, resultsAreWeak } from "../src/engine/match.ts";
import { mealIdFromUrl, mealToRecipe, RUNTIME_MAX_UNMAPPED } from "../src/engine/mealdb.ts";
import { normalizeKey } from "../src/engine/parse.ts";
import { searchFurther, type StopReason } from "./agent.ts";
import { mapItems, pickRecipes } from "./ai.ts";
import { AGENT_LIMITS, INPUT_LIMITS, MODELS, type Env } from "./config.ts";
import { spentToday, worstCase } from "./guard.ts";
import { mealdb, SourceStopped, type Fetcher } from "./mealdb.ts";
import { CapReached, meter, type Call } from "./meter.ts";
import { addedRecipes, addToPool } from "./pool.ts";
import type { KV } from "./store.ts";

export type Deps = {
  env: Env;
  kv: KV;
  now: () => number;
  /** Null when no API key is configured; the AI steps then report themselves off. */
  call: Call | null;
  fetcher: Fetcher;
};

const RESTRICTIONS: readonly Restriction[] = ["glutenFree", "dairyFree", "nutFree", "vegetarian"];
const VOCABULARY = Object.keys(buildReference("wholeFoods")).sort();

export const MESSAGES = {
  capped: "The AI steps are off for the rest of today because the daily budget is used up. Everything else still works.",
  notConfigured: "The AI steps aren't switched on right now. Everything else still works.",
  notWeak: "Your results are already good, so there's nothing to search further for.",
  aiError: "The AI step didn't answer this time. Everything else still works.",
  linkOnly: "Only TheMealDB recipe links can be added for now. You can paste the ingredients instead.",
  noData: "That page has no recipe data we can read, so we didn't guess at one.",
  sourceStopped: "TheMealDB isn't answering right now. You can paste the ingredients instead.",
} as const;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const capped = () => json(429, { error: MESSAGES.capped, aiOff: true });

async function readBody(req: Request): Promise<Record<string, unknown> | null> {
  if (Number(req.headers.get("content-length") ?? 0) > INPUT_LIMITS.bodyMax) return null;
  try {
    const text = await req.text();
    if (text.length > INPUT_LIMITS.bodyMax) return null;
    const body = JSON.parse(text);
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

function strings(v: unknown, max: number = INPUT_LIMITS.itemsMax): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((s): s is string => typeof s === "string")
    .map((s) => s.trim().slice(0, INPUT_LIMITS.itemChars))
    .filter(Boolean)
    .slice(0, max);
}

function profileOf(body: Record<string, unknown>) {
  return {
    have: [...new Set(strings(body["have"]).map(normalizeKey))],
    restrictions: strings(body["restrictions"]).filter((r): r is Restriction => RESTRICTIONS.includes(r as Restriction)),
    never: strings(body["never"]).map(normalizeKey),
    pantry: strings(body["pantry"], 60).map(normalizeKey),
    cuisines: strings(body["cuisines"], 12),
  };
}

async function pool(kv: KV): Promise<PoolRecipeData[]> {
  return [...POOL, ...(await addedRecipes(kv))];
}

// The AI steps count as off once the day's remaining budget could not cover even the
// cheapest call, so the app never offers a step it would then refuse.
const CHEAPEST_CALL_USD = worstCase(MODELS.mapping, 8000, 600);

async function aiAvailable(deps: Deps): Promise<boolean> {
  return deps.call !== null && (await spentToday(deps.kv, deps.now())) + CHEAPEST_CALL_USD <= deps.env.dailyUsd;
}

export async function handle(req: Request, deps: Deps): Promise<Response> {
  const route = new URL(req.url).pathname.replace(/^\/pressure-cooker\/api\/?/, "");

  if (req.method === "GET" && route === "pool") {
    return json(200, { recipes: await addedRecipes(deps.kv), aiOn: await aiAvailable(deps) });
  }
  if (req.method !== "POST") return json(405, { error: "Method not allowed." });

  const body = await readBody(req);
  if (!body) return json(400, { error: "Invalid request." });

  switch (route) {
    case "map": return handleMap(body, deps);
    case "picks": return handlePicks(body, deps);
    case "search": return handleSearch(body, deps);
    case "import": return handleImport(body, deps);
    default: return json(404, { error: "Not found." });
  }
}

async function guarded(deps: Deps, run: () => Promise<Response>): Promise<Response> {
  if (!deps.call) return json(503, { error: MESSAGES.notConfigured, aiOff: true });
  if (!(await aiAvailable(deps))) return capped();
  try {
    return await run();
  } catch (err) {
    if (err instanceof CapReached) return capped();
    return json(502, { error: MESSAGES.aiError });
  }
}

function handleMap(body: Record<string, unknown>, deps: Deps): Promise<Response> {
  const items = strings(body["items"], INPUT_LIMITS.mapBatch);
  if (items.length === 0) return Promise.resolve(json(400, { error: "Nothing to map." }));
  return guarded(deps, async () => {
    const m = meter(deps.call!, deps.kv, deps.env, deps.now);
    const mappings = await mapItems(m, items, VOCABULARY);
    return json(200, { mappings });
  });
}

function handlePicks(body: Record<string, unknown>, deps: Deps): Promise<Response> {
  const p = profileOf(body);
  if (p.have.length === 0) return Promise.resolve(json(400, { error: "Add an ingredient first." }));
  return guarded(deps, async () => {
    // Code ranks and filters; the model only chooses among what survives.
    const ranked = rankRecipes(await pool(deps.kv), p.have, p).slice(0, INPUT_LIMITS.shortlistMax);
    if (ranked.length === 0) return json(200, { picks: [] });
    const m = meter(deps.call!, deps.kv, deps.env, deps.now);
    const picks = await pickRecipes(
      m,
      ranked.map((r) => ({ id: r.recipe.id, title: r.recipe.title, cuisine: r.recipe.cuisine, usesItems: r.usesItems, buyItems: r.buyItems })),
      { have: p.have, cuisines: p.cuisines },
    );
    return json(200, { picks });
  });
}

const STOP_TEXT: Record<StopReason, string> = {
  done: "",
  steps: "It reached its step limit.",
  fetches: "It reached its limit on pages fetched.",
  time: "It reached its time limit.",
  cost: "It reached the cost limit for one search.",
  daily: "The daily AI budget ran out partway through.",
  source: "TheMealDB stopped answering.",
  model: "It stopped early.",
};

function handleSearch(body: Record<string, unknown>, deps: Deps): Promise<Response> {
  const p = profileOf(body);
  if (p.have.length === 0) return Promise.resolve(json(400, { error: "Add an ingredient first." }));
  const knownIds = strings(body["knownIds"], 400);

  return guarded(deps, async () => {
    // The weak-results rule is checked here too, so the button can't be forced.
    const current = await pool(deps.kv);
    if (!resultsAreWeak(rankRecipes(current, p.have, p))) return json(409, { error: MESSAGES.notWeak });

    const m = meter(deps.call!, deps.kv, deps.env, deps.now, deps.env.searchUsd);
    const db = mealdb(deps.kv, deps.fetcher, deps.now, AGENT_LIMITS.maxFetches);
    const result = await searchFurther(
      { ...p, knownIds: [...new Set([...knownIds, ...current.map((r) => r.id)])] },
      { meter: m, db, now: deps.now },
    );
    const added = await addToPool(deps.kv, result.checked);

    // Every figure in this message comes from code.
    const n = result.found.length;
    const message = n > 0
      ? `Found ${n} more ${n === 1 ? "recipe" : "recipes"} on TheMealDB${added > 0 ? " and added them to the pool" : ""}.`
      : `Searched TheMealDB but nothing fit your items and settings. ${STOP_TEXT[result.stoppedBy]}`.trim();

    if (result.stoppedBy === "daily" && n === 0) return capped();
    return json(200, {
      recipes: result.found,
      note: result.note,
      message,
      stoppedBy: result.stoppedBy,
      steps: result.steps,
      fetches: result.fetches,
      addedToPool: added,
    });
  });
}

async function handleImport(body: Record<string, unknown>, deps: Deps): Promise<Response> {
  const url = typeof body["url"] === "string" ? body["url"].slice(0, 300) : "";
  const id = mealIdFromUrl(url);
  if (!id) return json(400, { error: MESSAGES.linkOnly });

  let meal;
  try {
    meal = await mealdb(deps.kv, deps.fetcher, deps.now, 1).lookup(id);
  } catch (err) {
    if (err instanceof SourceStopped) return json(503, { error: MESSAGES.sourceStopped });
    throw err;
  }
  if (!meal) return json(404, { error: MESSAGES.noData });

  const converted = mealToRecipe(meal, { maxUnmapped: RUNTIME_MAX_UNMAPPED });
  if (converted.ok) {
    const added = await addToPool(deps.kv, [converted.recipe]);
    return json(200, { recipe: converted.recipe, unmapped: [], addedToPool: added > 0 });
  }
  if (converted.partial && converted.partial.items.length > 0) {
    // Partly priced: the cook keeps it in their browser and confirms the rest.
    return json(200, { recipe: converted.partial, unmapped: converted.unmapped, addedToPool: false });
  }
  return json(422, { error: converted.reason });
}
