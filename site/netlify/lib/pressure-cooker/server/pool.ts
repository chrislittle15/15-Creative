// Recipes added to the shared pool at runtime, by the agent or by link. Only recipes that
// pass the same check as the seed pool are stored, and only the fields the seed pool keeps.

import type { PoolRecipeData } from "../src/data/pool.ts";
import { POOL } from "../src/data/pool.ts";
import type { KV } from "./store.ts";

const KEY = "pool/added";
const MAX_ADDED = 500;
const SEED_IDS = new Set(POOL.map((r) => r.id));

export async function addedRecipes(kv: KV): Promise<PoolRecipeData[]> {
  return (await kv.get<PoolRecipeData[]>(KEY)) ?? [];
}

/** Adds what is new; returns how many were. */
export async function addToPool(kv: KV, recipes: PoolRecipeData[]): Promise<number> {
  const current = await addedRecipes(kv);
  const known = new Set([...SEED_IDS, ...current.map((r) => r.id)]);
  const fresh = recipes.filter((r) => !known.has(r.id));
  if (fresh.length === 0 || current.length >= MAX_ADDED) return 0;
  await kv.set(KEY, [...current, ...fresh].slice(0, MAX_ADDED));
  return fresh.length;
}

export function isKnown(id: string, added: PoolRecipeData[]): PoolRecipeData | null {
  return POOL.find((r) => r.id === id) ?? added.find((r) => r.id === id) ?? null;
}
