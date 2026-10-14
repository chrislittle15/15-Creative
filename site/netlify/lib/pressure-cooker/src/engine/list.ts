// Shopping list assembly. Every number here is computed in code; nothing on this path
// comes from a model.

import { BASE_PACKAGES, WHOLE_FOODS_OVERRIDES, type PackageRef, type Section } from "./packages.data.ts";
import { normalizeKey } from "./parse.ts";
import { convert, pluralizeLabel, pluralizeUnit, unitFamily } from "./units.ts";
import { bridge } from "./density.ts";

export const SECTION_ORDER: readonly Section[] = ["Produce", "Meat", "Dairy", "Pantry", "Bakery", "Other"];

export type Store = "wholeFoods" | "generic";

/** Reference keys are normalized on build so a recipe line can always reach them. */
export function buildReference(store: Store = "wholeFoods"): Record<string, PackageRef> {
  const out: Record<string, PackageRef> = {};
  for (const [k, v] of Object.entries(BASE_PACKAGES)) out[normalizeKey(k)] = v;
  if (store === "wholeFoods") {
    for (const [k, v] of Object.entries(WHOLE_FOODS_OVERRIDES)) out[normalizeKey(k)] = v;
  }
  return out;
}

/** One ingredient requirement from one recipe. */
export type Requirement = {
  recipeId: string;
  normalized: string;
  qty: number | null;
  unit: string | null;
  needsReview?: boolean;
};

export type ListLine = {
  normalized: string;
  display: string;
  section: Section;
  /** Null whenever the quantity could not be computed honestly. */
  packages: number | null;
  totalQty: number | null;
  packageUnit: string | null;
  /** Plain-language instruction, or null when it needs a look. */
  instruction: string | null;
  detail: string | null;
  needsReview: boolean;
  reviewReason: string | null;
  /** True when the household's Pantry already lists this. */
  inPantry: boolean;
  recipeIds: string[];
};

export type ShoppingList = {
  /** Things to buy, grouped by store section in aisle order. */
  sections: { section: Section; lines: ListLine[] }[];
  /** "Probably have, check before you go." */
  pantry: ListLine[];
};

// Shopping-list wording: "Buy 3 bags of carrots", "Buy 1 head of garlic", "Buy 1 lemon".
// Names that read as plural once you buy by the bag, bunch or package.
const COUNTABLE = new Set([
  "carrot", "green onion", "mushroom", "chicken breast", "chicken thigh", "pork chop", "sausage",
  "steak", "tortilla", "bagel", "english muffin", "whole chicken",
]);
const IRREGULAR_PLURAL: Record<string, string> = {
  "potato": "potatoes", "sweet potato": "sweet potatoes", "tomato": "tomatoes",
  "jalapeno": "jalapenos", "avocado": "avocados",
};
/** What the shopper would say, where the reference name is a recipe-side name. */
const SHOPPING_NAME: Record<string, string> = { "garlic cloves": "garlic", "canned tomato": "tomatoes", "stock cube": "stock cubes" };
const SHOPPING_LABEL: Record<string, string> = { bulb: "head" };

function pluralNoun(noun: string): string {
  const irregular = IRREGULAR_PLURAL[noun];
  if (irregular) return irregular;
  return /(s|x|z|ch|sh)$/.test(noun) ? `${noun}es` : `${noun}s`;
}

/** The store list's own names ("kidney beans", "molasses"), keyed by the normalized form recipes use. */
const ORIGINAL_NAMES = new Map<string, string>(
  [...Object.keys(BASE_PACKAGES), ...Object.keys(WHOLE_FOODS_OVERRIDES)].map((k) => [normalizeKey(k), k]),
);

export function buyInstruction(key: string, packages: number, packageLabel: string): string {
  const original = ORIGINAL_NAMES.get(key) ?? key;
  const base = SHOPPING_NAME[original] ?? SHOPPING_NAME[key] ?? original;
  const plural = (name: string) => (/s$/.test(name) ? name : pluralNoun(name));
  if (packageLabel === "each") return `Buy ${packages} ${packages === 1 ? base : plural(base)}`;
  if (packageLabel === "dozen") return `Buy ${packages} dozen ${plural(base)}`;
  const unit = pluralizeLabel(SHOPPING_LABEL[packageLabel] ?? packageLabel, packages);
  return `Buy ${packages} ${unit} of ${COUNTABLE.has(original) || COUNTABLE.has(key) ? plural(base) : base}`;
}

export function displayName(normalized: string): string {
  if (!normalized) return "(unknown ingredient)";
  return normalized.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Roll requirements up into one line per ingredient.
 *
 * Quantities are summed across every recipe first and the package count is a single
 * ceiling on that total, so two recipes needing half a package each buy one package,
 * not two.
 */
export function buildList(
  requirements: Requirement[],
  opts: { store?: Store; pantry?: string[]; scales?: Record<string, number> } = {},
): ShoppingList {
  const ref = buildReference(opts.store ?? "wholeFoods");
  const pantry = new Set((opts.pantry ?? []).map(normalizeKey));
  const scales = opts.scales ?? {};

  const grouped = new Map<string, Requirement[]>();
  for (const r of requirements) {
    if (!r.normalized) continue;
    const list = grouped.get(r.normalized) ?? [];
    list.push(r);
    grouped.set(r.normalized, list);
  }

  const lines: ListLine[] = [];

  for (const [key, entries] of grouped) {
    const recipeIds = [...new Set(entries.map((e) => e.recipeId))];
    const inPantry = pantry.has(key);
    const base = {
      normalized: key,
      display: displayName(key),
      inPantry,
      recipeIds,
      totalQty: null as number | null,
      packages: null as number | null,
      packageUnit: null as string | null,
      instruction: null as string | null,
      detail: null as string | null,
    };

    const entry = ref[key];
    if (!entry) {
      // We don't know its package size, but the cook still needs some. Same rule as an
      // unmeasured amount: one of the smallest, flagged so they check the shelf.
      lines.push({
        ...base,
        section: "Other",
        packages: 1,
        instruction: `Buy 1 ${displayName(key)}`,
        needsReview: true,
        reviewReason: "Not in the store list yet — pick the smallest one on the shelf.",
      });
      continue;
    }

    // You cannot buy part of a package, so anything we cannot measure still means buying
    // one. Lines fall back to a single package rather than refusing to answer; the cook
    // keeps the leftover, which is how a store works anyway.
    let total = 0;
    let measured = false;
    let approximate = false;

    for (const e of entries) {
      if (e.qty === null || e.unit === null) {
        approximate = true;
        continue;
      }
      const scaled = e.qty * (scales[e.recipeId] ?? 1);

      const exact = convert(scaled, e.unit, entry.packageUnit);
      if (exact !== null) {
        total += exact;
        measured = true;
        continue;
      }

      // Different families: bridge with a cooking equivalent where one applies.
      const from = unitFamily(e.unit);
      const to = unitFamily(entry.packageUnit);
      const inBase = from === "volume"
        ? (convert(scaled, e.unit, "tsp") ?? scaled)
        : from === "weight" ? (convert(scaled, e.unit, "oz") ?? scaled) : scaled;

      const bridged = bridge(key, scaled, from, to, { volumeTsp: inBase, weightOz: inBase });
      if (bridged !== null) {
        // bridge() returns the package family's base unit, so finish the conversion.
        const finished = to === "weight"
          ? (convert(bridged, "oz", entry.packageUnit) ?? bridged)
          : to === "volume" ? (convert(bridged, "tsp", entry.packageUnit) ?? bridged) : bridged;
        total += finished;
        measured = true;
        approximate = true;
      } else {
        approximate = true;
      }
    }

    const packages = measured ? Math.max(1, Math.ceil(total / entry.packageSize)) : 1;
    const rounded = Math.round(total * 100) / 100;

    // When one unit is one package ("1 ct per each") the working repeats the instruction.
    // When nothing could be measured, there is no working to show.
    let detail: string | null = null;
    if (!measured) {
      detail = "the recipe doesn't give an amount — one is plenty";
    } else if (entry.packageSize !== 1) {
      detail = `recipes need ${approximate ? "about " : ""}${rounded} ${pluralizeUnit(entry.packageUnit, rounded)}` +
        ` · ${entry.packageSize} ${pluralizeUnit(entry.packageUnit, entry.packageSize)} per ${SHOPPING_LABEL[entry.packageLabel] ?? entry.packageLabel}`;
    }

    lines.push({
      ...base,
      section: entry.section,
      totalQty: measured ? rounded : null,
      packages,
      packageUnit: entry.packageUnit,
      instruction: buyInstruction(key, packages, entry.packageLabel),
      detail,
      needsReview: false,
      reviewReason: null,
    });
  }

  const byName = (a: ListLine, b: ListLine) => a.display.localeCompare(b.display);
  const toBuy = lines.filter((l) => !l.inPantry).sort(byName);

  const sections = SECTION_ORDER
    .map((section) => ({ section, lines: toBuy.filter((l) => l.section === section) }))
    .filter((g) => g.lines.length > 0);

  return { sections, pantry: lines.filter((l) => l.inPantry).sort(byName) };
}
