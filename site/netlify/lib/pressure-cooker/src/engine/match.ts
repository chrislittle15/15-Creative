// Match counts, ranking, the weak-results rule, and suggested chips.
//
// Every count and every ordering on this path is computed here. The model is allowed to
// choose among what this file has already ranked and filtered, and to write a sentence
// about it, but it never produces one of these numbers.

import { filterRecipes, type Restriction } from "./diet.ts";
import { normalizeKey } from "./parse.ts";
import { BASE_PACKAGES, type Section } from "./packages.data.ts";

export type PoolRecipe = {
  id: string;
  title: string;
  url: string;
  servings: number | null;
  cuisine: string | null;
  /** Normalized ingredient keys. */
  ingredients: string[];
};

export type Profile = {
  restrictions: Restriction[];
  /** Cuisines the household leans towards. Ranking nudge only, never a filter. */
  cuisines?: string[];
  /** Ingredients the household will not eat. A hard filter, like a restriction. */
  never?: string[];
  pantry?: string[];
};

export type Match = {
  recipe: PoolRecipe;
  /** How many of the cook's chosen ingredients this recipe uses. */
  uses: number;
  /** How many further ingredients they would have to buy. */
  buy: number;
  /** Which of their ingredients it uses, for display. */
  usesItems: string[];
  /** Share of the cook's items used, 0 to 1. Drives the weak-results rule. */
  coverage: number;
  /** Pantry staples do not count as "buy" — they probably have them. */
  buyItems: string[];
  /**
   * Near-misses the cook can swap: the recipe wants chicken thigh, they have chicken breast.
   * Never counted in `uses`; shown as a flagged "close match" and still listed under "buy".
   */
  closeItems: { have: string; recipe: string }[];
  /** Ranking score: protein counts for more than a spice. Not shown to the cook. */
  score: number;
};

/** Cuts of the same animal that a cook would reasonably swap. Flagged, never silent. */
const CLOSE_GROUPS: string[][] = [["chicken breast", "chicken thigh"]].map((g) => g.map(normalizeKey));

/** What each kind of ingredient adds to the ranking. The meat is the meal; cumin is not. */
const SECTION_WEIGHT: Record<Section, number> = { Meat: 3, Produce: 1, Dairy: 1, Bakery: 1, Pantry: 0.5, Other: 0.5 };
const CLOSE_FACTOR = 0.6;
const weightOf = (key: string): number => SECTION_WEIGHT[BASE_PACKAGES[key]?.section ?? "Other"];

/** "uses 7 of yours, buy 3" — assembled from counts, never from a model. */
export function matchSentence(m: Match): string {
  return m.uses === 0 ? `close match, buy ${m.buy}` : `uses ${m.uses} of yours, buy ${m.buy}`;
}

export function scoreRecipe(recipe: PoolRecipe, have: string[], pantry: string[] = []): Match {
  const haveSet = new Set(have.map(normalizeKey));
  const pantrySet = new Set(pantry.map(normalizeKey));

  const usesItems = recipe.ingredients.filter((i) => haveSet.has(i));
  const buyItems = recipe.ingredients.filter((i) => !haveSet.has(i) && !pantrySet.has(i));

  const closeItems: { have: string; recipe: string }[] = [];
  for (const ing of recipe.ingredients) {
    if (haveSet.has(ing)) continue;
    const group = CLOSE_GROUPS.find((g) => g.includes(ing));
    const have = group?.find((h) => h !== ing && haveSet.has(h));
    if (have) closeItems.push({ have, recipe: ing });
  }

  const score = usesItems.reduce((sum, i) => sum + weightOf(i), 0)
    + CLOSE_FACTOR * closeItems.reduce((sum, c) => sum + weightOf(c.recipe), 0);

  return {
    recipe,
    uses: usesItems.length,
    buy: buyItems.length,
    usesItems,
    buyItems,
    coverage: haveSet.size === 0 ? 0 : usesItems.length / haveSet.size,
    closeItems,
    score,
  };
}

/**
 * The profile offers broad picks ("Asian", "Mediterranean"); recipes carry one cuisine.
 * A pick matches its own name and the cuisines in its family.
 */
const CUISINE_FAMILIES: Record<string, string[]> = {
  american: ["american", "canadian"],
  asian: ["chinese", "japanese", "thai", "vietnamese", "malaysian", "filipino", "korean", "indian"],
  mediterranean: ["greek", "italian", "spanish", "portuguese", "turkish", "croatian", "syrian", "lebanese", "moroccan", "tunisian", "algerian", "egyptian", "french"],
  mexican: ["mexican"],
};

export function cuisineMatches(picks: string[], cuisine: string | null): boolean {
  const c = (cuisine ?? "").toLowerCase();
  if (!c) return false;
  return picks.some((p) => {
    const pick = p.toLowerCase();
    return pick === c || (CUISINE_FAMILIES[pick] ?? []).includes(c);
  });
}

/**
 * Rank the pool against what the cook has.
 *
 * Restrictions and the "never" list are applied as hard filters first, so nothing that
 * fails them can reach the ranking, let alone the model.
 */
export function rankRecipes(pool: PoolRecipe[], have: string[], profile: Profile = { restrictions: [] }): Match[] {
  const never = new Set((profile.never ?? []).map(normalizeKey));

  const allowed = filterRecipes(pool, profile.restrictions)
    .filter((r) => !r.ingredients.some((i) => never.has(i)));

  const picks = profile.cuisines ?? [];

  const matched = (m: Match) => m.uses + m.closeItems.length;

  const ranked = allowed
    .map((r) => scoreRecipe(r, have, profile.pantry ?? []))
    .filter((m) => matched(m) > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;           // protein-weighted match first
      if (b.uses !== a.uses) return b.uses - a.uses;               // then uses most of yours
      if (a.buy !== b.buy) return a.buy - b.buy;                   // then fewest extras to buy
      const aFav = cuisineMatches(picks, a.recipe.cuisine) ? 1 : 0;
      const bFav = cuisineMatches(picks, b.recipe.cuisine) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;                       // then preferred cuisines
      return a.recipe.title.localeCompare(b.recipe.title);         // stable, not arbitrary
    });

  // A recipe that touches only one of their items is noise once better matches exist.
  const best = ranked.reduce((max, m) => Math.max(max, matched(m)), 0);
  return best >= 2 ? ranked.filter((m) => matched(m) >= 2) : ranked;
}

/**
 * The "results are weak" rule, from SPEC section 6: shown when fewer than 3 pool recipes
 * use at least half the cook's items and pass their dietary settings.
 *
 * The filtering has already happened in rankRecipes, so this only counts coverage.
 */
export const WEAK_MIN_COVERAGE = 0.5;
export const WEAK_MIN_RESULTS = 3;

export function resultsAreWeak(matches: Match[]): boolean {
  return matches.filter((m) => m.coverage >= WEAK_MIN_COVERAGE).length < WEAK_MIN_RESULTS;
}

/**
 * Suggested chips: ingredients that most often appear alongside what the cook has already
 * picked, counted across the pool, with their own picks and pantry removed.
 */
export function suggestChips(
  pool: PoolRecipe[],
  picked: string[],
  opts: { pantry?: string[]; profile?: Profile; limit?: number } = {},
): string[] {
  const pickedSet = new Set(picked.map(normalizeKey));
  const pantrySet = new Set((opts.pantry ?? []).map(normalizeKey));
  const never = new Set((opts.profile?.never ?? []).map(normalizeKey));
  const limit = opts.limit ?? 8;

  const allowed = filterRecipes(pool, opts.profile?.restrictions ?? []);

  const counts = new Map<string, number>();
  for (const r of allowed) {
    // Only learn from recipes that actually relate to what they picked.
    if (pickedSet.size > 0 && !r.ingredients.some((i) => pickedSet.has(i))) continue;
    for (const ing of r.ingredients) {
      if (pickedSet.has(ing) || pantrySet.has(ing) || never.has(ing)) continue;
      counts.set(ing, (counts.get(ing) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => (b[1] !== a[1] ? b[1] - a[1] : a[0].localeCompare(b[0])))
    .slice(0, limit)
    .map(([name]) => name);
}
