// Unit vocabulary and same-family conversion. Ported from v1.
//
// Cross-family conversion (volume <-> weight) is deliberately not attempted: it needs
// per-ingredient density data we do not have. Those cases are reported as unconvertible
// so the caller can say so rather than print a wrong number.

export type Family = "volume" | "weight" | "count";

// Volume, in teaspoons. Metric included because the recipe pool is British and writes
// millilitres; without them "150ml" falls through to the count family and can never be
// converted to a package size.
const VOLUME: Record<string, number> = {
  tsp: 1,
  tbsp: 3,
  "fl oz": 6,
  cup: 48,
  pint: 96,
  quart: 192,
  gallon: 768,
  ml: 0.202884,
  l: 202.884,
};

// Weight, in ounces.
const WEIGHT: Record<string, number> = { oz: 1, lb: 16, g: 0.035274, kg: 35.274 };

export const UNIT_ALIASES: Record<string, string> = {
  tsp: "tsp", tsps: "tsp", teaspoon: "tsp", teaspoons: "tsp",
  tbsp: "tbsp", tbsps: "tbsp", tablespoon: "tbsp", tablespoons: "tbsp",
  // Spellings the recipe pool actually uses.
  tbs: "tbsp", tbls: "tbsp", tblsp: "tbsp", tblsps: "tbsp", tbsps_: "tbsp",
  ml: "ml", mls: "ml", millilitre: "ml", millilitres: "ml", milliliter: "ml", milliliters: "ml",
  l: "l", litre: "l", litres: "l", liter: "l", liters: "l",
  cup: "cup", cups: "cup",
  "fl oz": "fl oz", "fl. oz": "fl oz", "fluid ounce": "fl oz", "fluid ounces": "fl oz", floz: "fl oz",
  pint: "pint", pints: "pint", pt: "pint",
  quart: "quart", quarts: "quart", qt: "quart",
  gallon: "gallon", gallons: "gallon", gal: "gallon",
  oz: "oz", ounce: "oz", ounces: "oz",
  lb: "lb", lbs: "lb", pound: "lb", pounds: "lb",
  g: "g", gram: "g", grams: "g",
  kg: "kg", kilogram: "kg", kilograms: "kg",
  slice: "slice", slices: "slice",
  can: "can", cans: "can",
  box: "box", boxes: "box",
  count: "ct", ct: "ct",
  clove: "clove", cloves: "clove",
  bunch: "bunch", bunches: "bunch",
  package: "package", packages: "package", pkg: "package", pkgs: "package",
};

/** Canonical unit names, longest first so "fl oz" wins over "oz" when matching text. */
export const UNIT_TOKENS: readonly string[] = Object.keys(UNIT_ALIASES).sort((a, b) => b.length - a.length);

/** Count units that name the product itself ("bacon slices"), not just a measure. */
export const DESCRIPTIVE_COUNT_UNITS: Record<string, string> = { slice: "slices", clove: "cloves" };

export function unitFamily(unit: string): Family {
  if (unit in VOLUME) return "volume";
  if (unit in WEIGHT) return "weight";
  return "count";
}

/**
 * Convert within a family. Returns null when the units cannot be reconciled —
 * different families, or two different count units ("clove" to "bunch").
 */
export function convert(qty: number, from: string, to: string): number | null {
  if (from === to) return qty;
  const famFrom = unitFamily(from);
  if (famFrom !== unitFamily(to)) return null;
  if (famFrom === "count") return null;
  const table = famFrom === "volume" ? VOLUME : WEIGHT;
  const fromFactor = table[from];
  const toFactor = table[to];
  if (fromFactor === undefined || toFactor === undefined) return null;
  return (qty * fromFactor) / toFactor;
}

const NO_PLURAL_UNITS = new Set(["oz", "lb", "g", "kg", "fl oz", "tsp", "tbsp", "ct"]);
const NO_PLURAL_LABELS = new Set(["each"]);

export function pluralizeWord(word: string): string {
  if (/(s|x|z|ch|sh)$/i.test(word)) return word + "es";
  if (/[^aeiou]y$/i.test(word)) return word.slice(0, -1) + "ies";
  return word + "s";
}

export function pluralizeUnit(unit: string, qty: number): string {
  if (qty === 1 || !unit || NO_PLURAL_UNITS.has(unit)) return unit;
  return pluralizeWord(unit);
}

export function pluralizeLabel(label: string, qty: number): string {
  if (qty === 1 || !label || NO_PLURAL_LABELS.has(label.toLowerCase())) return label;
  return pluralizeWord(label);
}
