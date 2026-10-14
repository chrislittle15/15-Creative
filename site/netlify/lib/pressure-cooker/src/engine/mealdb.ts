// Turning one TheMealDB meal into a pool recipe. Shared by the pool build scripts, the
// search further agent and add-by-link, so a recipe found at runtime is checked by exactly
// the same rules as the seed pool.
//
// The publisher's measure text is kept verbatim; quantities come from our own parser.
// Nothing here is read from a model.

import { extractQuantity, extractUnit, normalizeKey } from "./parse.ts";
import { DESCRIPTIVE_COUNT_UNITS } from "./units.ts";
import { isIgnored } from "./aliases.ts";
import { buildReference } from "./list.ts";
import type { PoolItem, PoolRecipeData } from "../data/pool.ts";

export const MEALDB_API = "https://www.themealdb.com/api/json/v1/1";
export const MEALDB_PAGE = "https://www.themealdb.com/meal";

export type RawMeal = Record<string, string | null>;

const REFERENCE = buildReference("wholeFoods");

/** The smallest recipe the pool accepts; fewer lines usually means a garnish or a drink. */
export const MIN_INGREDIENTS = 4;

/** Unlisted ingredients a recipe found at runtime (by the agent or by link) may carry. */
export const RUNTIME_MAX_UNMAPPED = 2;

/** "https://www.themealdb.com/meal/52772-teriyaki-chicken" -> "52772". Anything else -> null. */
export function mealIdFromUrl(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.hostname !== "www.themealdb.com" && url.hostname !== "themealdb.com") return null;
  const m = url.pathname.match(/^\/meal(?:\.php)?\/(\d{4,7})(?:[-/].*)?$/) ?? null;
  if (m?.[1]) return m[1];
  const q = url.searchParams.get("c") ?? url.searchParams.get("i");
  return q && /^\d{4,7}$/.test(q) ? q : null;
}

// TheMealDB mixes country names and adjectives ("United States", "France", "Italian") and
// uses "Unknown" for none. One spelling per cuisine keeps the filters and ranking honest.
const AREA_NAMES: Record<string, string> = {
  "united states": "American", america: "American", france: "French", india: "Indian",
  netherlands: "Dutch", norway: "Norwegian", argentina: "Argentinian", uruguayan: "Uruguayan",
  "saudi arabian": "Saudi Arabian", uk: "British", england: "British",
};

export function cuisineName(area: string | null | undefined): string | null {
  const a = (area ?? "").trim();
  if (!a || a.toLowerCase() === "unknown") return null;
  return AREA_NAMES[a.toLowerCase()] ?? a;
}

/** Pull the 20 ingredient/measure pairs TheMealDB returns as flat numbered fields. */
export function pairsOf(meal: RawMeal): { raw: string; measure: string }[] {
  const out: { raw: string; measure: string }[] = [];
  for (let i = 1; i <= 20; i++) {
    const raw = (meal[`strIngredient${i}`] ?? "").trim();
    const measure = (meal[`strMeasure${i}`] ?? "").trim();
    if (raw) out.push({ raw, measure });
  }
  return out;
}

// Measures that are a direction rather than an amount. They are not failures to parse —
// the recipe genuinely doesn't state a quantity — so they're marked, not flagged as broken.
const TRACE = /^(pinch|dash|handful|to taste|to serve|garnish|for frying|for serving|splash|drizzle|sprinkling|as needed|optional)$/i;

/**
 * "1 1/2 cups" -> {qty: 1.5, unit: "cup"}. A bare "2" means two of the thing, so it
 * becomes a count. "Pinch" stays unquantified and is marked as a trace amount.
 */
export function parseMeasure(measure: string): { qty: number | null; unit: string | null; trace: boolean } {
  const text = measure.trim();
  if (!text) return { qty: null, unit: null, trace: false };
  if (TRACE.test(text)) return { qty: null, unit: null, trace: true };

  const { qty, rest } = extractQuantity(text);
  const { unit } = extractUnit(rest);

  // "2", "1 large", "1 chopped" — a number with no unit is a count of the ingredient.
  if (qty !== null && unit === null) return { qty, unit: "ct", trace: false };

  return { qty, unit, trace: false };
}

/**
 * The pool splits name and measure into separate fields, so "Garlic" + "2 cloves" never
 * reaches the parser's rule that turns "2 cloves of garlic" into garlic cloves. Apply the
 * same rule here so the count-unit entries stay reachable.
 */
export function withCountUnit(normalized: string, unit: string | null): string {
  if (!unit || !(unit in DESCRIPTIVE_COUNT_UNITS)) return normalized;
  const suffix = DESCRIPTIVE_COUNT_UNITS[unit] as string;
  const parts = normalized.split(/\s+/);
  return parts.includes(suffix) || parts.includes(unit) ? normalized : `${normalized} ${suffix}`;
}

export type Converted =
  | { ok: true; recipe: PoolRecipeData }
  | { ok: false; reason: string; unmapped: string[]; partial?: PoolRecipeData };

/**
 * The check every recipe passes before it joins the pool: at least four ingredients on the
 * store list, and no more than `maxUnmapped` that are not. The seed pool used zero. Recipes
 * found at runtime may carry a couple of unlisted ingredients — the list buys one of each
 * and the diet filter refuses to vouch for them — because insisting on zero turned away
 * most of what TheMealDB has. A meal that fails is refused with the reason, never patched up.
 */
export function mealToRecipe(meal: RawMeal, opts: { maxUnmapped?: number } = {}): Converted {
  const maxUnmapped = opts.maxUnmapped ?? 0;
  const id = String(meal["idMeal"] ?? "");
  const title = String(meal["strMeal"] ?? "").trim();
  if (!/^\d+$/.test(id) || !title) return { ok: false, reason: "That page has no recipe data we can read.", unmapped: [] };

  const mapped: PoolItem[] = [];
  const unlisted: PoolItem[] = [];
  const unmapped: string[] = [];

  for (const { raw, measure } of pairsOf(meal)) {
    const key = normalizeKey(raw);
    if (!key || isIgnored(key)) continue;
    const { qty, unit, trace } = parseMeasure(measure);
    const item = { normalized: withCountUnit(key, unit), qty, unit, measure, trace };
    if (REFERENCE[key]) mapped.push(item);
    else if (!unmapped.includes(raw)) {
      unmapped.push(raw);
      unlisted.push(item);
    }
  }

  const build = (items: PoolItem[]): PoolRecipeData => ({
    id,
    title,
    url: `${MEALDB_PAGE}/${id}`,
    cuisine: cuisineName(meal["strArea"]),
    category: meal["strCategory"] || null,
    // TheMealDB does not publish servings. We do not invent one.
    servings: null,
    ingredients: [...new Set(items.map((i) => i.normalized))],
    items,
  });

  if (mapped.length < MIN_INGREDIENTS) {
    return { ok: false, reason: "Too few of that recipe's ingredients are in the store list to build a list from.", unmapped };
  }
  // A recipe with too many unlisted ingredients stays out of the shared pool, but it is
  // handed back whole so a cook who asked for it by link can keep it in their own browser
  // and confirm the unlisted lines.
  if (unmapped.length > maxUnmapped) {
    return { ok: false, reason: `Some ingredients aren't in the store list yet: ${unmapped.join(", ")}.`, unmapped, partial: build([...mapped, ...unlisted]) };
  }
  return { ok: true, recipe: build([...mapped, ...unlisted]) };
}
