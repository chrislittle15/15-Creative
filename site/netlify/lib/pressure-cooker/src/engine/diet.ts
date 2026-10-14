// Dietary restrictions, checked in code against a reviewed table. No model involvement,
// and no health claims — this reports what an ingredient contains, never whether a recipe
// is good for someone.
//
// The rule that matters: an ingredient we have not mapped is never called safe. It reports
// "can't confirm, check the label", and a recipe containing one can never be presented as
// passing a restriction.

import { RESTRICTION_TABLE, type Restriction, type RestrictionEntry } from "./diet.data.ts";
import { normalizeKey } from "./parse.ts";

export type { Restriction } from "./diet.data.ts";

/** Table keys normalized the same way recipe text is, so entries stay reachable. */
const TABLE: Record<string, RestrictionEntry> = (() => {
  const out: Record<string, RestrictionEntry> = {};
  for (const [k, v] of Object.entries(RESTRICTION_TABLE)) out[normalizeKey(k)] = v;
  return out;
})();

export const CANNOT_CONFIRM = "can't confirm, check the label";

export type IngredientVerdict =
  | { status: "violates"; restriction: Restriction; note?: string }
  | { status: "unmapped"; message: string }
  | { status: "ok"; note?: string };

export function checkIngredient(normalized: string, restriction: Restriction): IngredientVerdict {
  const entry = TABLE[normalized];
  if (!entry) return { status: "unmapped", message: CANNOT_CONFIRM };
  if (entry.violates.includes(restriction)) {
    return entry.note ? { status: "violates", restriction, note: entry.note } : { status: "violates", restriction };
  }
  return entry.note ? { status: "ok", note: entry.note } : { status: "ok" };
}

export type RecipeVerdict = {
  /** True only when every ingredient is mapped and none violates. Fails closed. */
  passes: boolean;
  /** Ingredients that break a selected restriction. */
  blocked: { normalized: string; restriction: Restriction; note?: string }[];
  /** Ingredients we cannot vouch for. Their presence prevents a pass. */
  unconfirmed: string[];
};

/**
 * Check one recipe against the selected restrictions.
 *
 * A recipe passes only if every ingredient is mapped and none violates. An unmapped
 * ingredient does not fail the recipe loudly, but it does stop it passing, and it is
 * surfaced so the cook can read the label themselves.
 */
export function checkRecipe(ingredients: string[], restrictions: Restriction[]): RecipeVerdict {
  const blocked: RecipeVerdict["blocked"] = [];
  const unconfirmed: string[] = [];

  for (const ing of ingredients) {
    if (!ing) continue;
    const entry = TABLE[ing];
    if (!entry) {
      if (!unconfirmed.includes(ing)) unconfirmed.push(ing);
      continue;
    }
    for (const r of restrictions) {
      if (entry.violates.includes(r)) {
        blocked.push(entry.note ? { normalized: ing, restriction: r, note: entry.note } : { normalized: ing, restriction: r });
      }
    }
  }

  // No restrictions selected means nothing to fail against.
  const passes = restrictions.length === 0 ? true : blocked.length === 0 && unconfirmed.length === 0;
  return { passes, blocked, unconfirmed };
}

/** Keep only recipes that pass. Used as a hard filter before anything is ranked or shown. */
export function filterRecipes<T extends { ingredients: string[] }>(recipes: T[], restrictions: Restriction[]): T[] {
  if (restrictions.length === 0) return recipes;
  return recipes.filter((r) => checkRecipe(r.ingredients, restrictions).passes);
}
