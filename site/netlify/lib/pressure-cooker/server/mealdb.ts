// Polite access to TheMealDB's JSON API: every response is cached and never fetched again,
// a run has a fetch budget, and a 403 or 429 stops all fetching for the rest of the day.

import { MEALDB_API, type RawMeal } from "../src/engine/mealdb.ts";
import type { KV } from "./store.ts";

export type Fetcher = (url: string) => Promise<{ status: number; ok: boolean; json(): Promise<unknown> }>;

export class SourceStopped extends Error {}

const blockedKey = (now: number) => `source/blocked/${new Date(now).toISOString().slice(0, 10)}`;

export type MealDB = {
  byIngredient(ingredient: string): Promise<{ id: string; title: string }[]>;
  byName(query: string): Promise<{ id: string; title: string }[]>;
  lookup(id: string): Promise<RawMeal | null>;
  fetches(): number;
};

export function mealdb(kv: KV, fetcher: Fetcher, now: () => number, maxFetches = Infinity): MealDB {
  let fetches = 0;

  async function get(path: string): Promise<{ meals: RawMeal[] | null }> {
    const cacheKey = `http/${path}`;
    const cached = await kv.get<{ meals: RawMeal[] | null }>(cacheKey);
    if (cached) return cached;

    if (await kv.get(blockedKey(now()))) throw new SourceStopped("TheMealDB asked us to stop for today.");
    if (fetches >= maxFetches) throw new SourceStopped("Fetch limit for this search reached.");
    fetches++;

    const res = await fetcher(`${MEALDB_API}/${path}`);
    if (res.status === 403 || res.status === 429) {
      await kv.set(blockedKey(now()), { status: res.status });
      throw new SourceStopped("TheMealDB asked us to stop for today.");
    }
    if (!res.ok) throw new SourceStopped(`TheMealDB answered ${res.status}.`);
    const body = (await res.json()) as { meals?: unknown };
    const meals = Array.isArray(body?.meals) ? (body.meals as RawMeal[]) : null;
    await kv.set(cacheKey, { meals });
    return { meals };
  }

  const brief = (meals: RawMeal[] | null) =>
    (meals ?? []).map((m) => ({ id: String(m["idMeal"]), title: String(m["strMeal"]) })).filter((m) => /^\d+$/.test(m.id));

  const clean = (s: string) => s.toLowerCase().replace(/[^a-z\s-]/g, "").trim().slice(0, 40);

  return {
    fetches: () => fetches,
    async byIngredient(ingredient) {
      const q = clean(ingredient).replace(/\s+/g, "_");
      return q ? brief((await get(`filter.php?i=${encodeURIComponent(q)}`)).meals) : [];
    },
    async byName(query) {
      const q = clean(query);
      return q ? brief((await get(`search.php?s=${encodeURIComponent(q)}`)).meals) : [];
    },
    async lookup(id) {
      if (!/^\d{4,7}$/.test(id)) return null;
      return (await get(`lookup.php?i=${id}`)).meals?.[0] ?? null;
    },
  };
}
