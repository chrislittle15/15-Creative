// Bridging volume, weight and count.
//
// Recipes measure by volume ("2 cups flour", "1 tsp cumin"); stores sell by weight. Without
// a bridge the engine can only say "check the amount", which it did on half of all lines.
// These are published cooking equivalents, applied in code — no model is involved, and
// nothing here is read from a recipe.
//
// Accuracy is deliberately approximate. The output is a package count, and a package count
// is a step function: being 15% out on grams almost never changes how many bags you buy.

/** Ounces per cup, by store ingredient name. */
const OZ_PER_CUP: Record<string, number> = {
  flour: 4.25,
  "bread flour": 4.25,
  "whole wheat flour": 4.5,
  "almond flour": 3.4,
  "self rising flour": 4.25,
  cornmeal: 4.8,
  cornstarch: 4.2,
  sugar: 7,
  "brown sugar": 7.5,
  "powdered sugar": 4,
  oats: 3.2,
  rice: 6.5,
  "brown rice": 6.9,
  quinoa: 6.1,
  lentils: 6.8,
  "black bean": 6.1,
  "kidney bean": 6.3,
  chickpeas: 6,
  butter: 8,
  "cheddar cheese": 4,
  "mozzarella cheese": 4,
  "parmesan cheese": 3.5,
  "feta cheese": 5.3,
  breadcrumb: 3.5,
  panko: 1.8,
  "cocoa powder": 3,
  "chocolate chip": 6,
  raisins: 5.8,
  walnuts: 4.2,
  pecans: 3.9,
  almonds: 5.1,
  peanuts: 5.2,
  honey: 12,
  "maple syrup": 11,
  "peanut butter": 9.5,
  "almond butter": 9.5,
  salt: 10,
  "sea salt": 9,
};

/**
 * Ounces per cup for anything not listed. Most liquids sit near 8 and most dry goods
 * near 5; spices and herbs are measured in teaspoons where the absolute error is tiny.
 */
const DEFAULT_OZ_PER_CUP = 6;

/** Typical weight of one item, for produce a recipe weighs but a store sells singly. */
const OZ_PER_ITEM: Record<string, number> = {
  onion: 5.3,
  "red onion": 5.3,
  shallot: 1.4,
  potato: 7.5,
  "sweet potato": 6,
  tomato: 5,
  lemon: 3.5,
  lime: 2.4,
  apple: 6.4,
  banana: 4.2,
  orange: 5.5,
  avocado: 6,
  "bell pepper": 4.2,
  jalapeno: 0.5,
  "chili pepper": 0.5,
  "scotch bonnet": 0.3,
  cucumber: 10.6,
  zucchini: 7,
  eggplant: 16,
  leek: 3.5,
  carrot: 2.2,
  egg: 1.8,
  garlic: 2,
  "garlic cloves": 0.18,
  ginger: 1,
  corn: 6.2,
};

const CUPS = 48; // teaspoons per cup, matching the volume table's base unit

/**
 * Convert across families using a cooking equivalent, when one exists for this ingredient.
 * Returns null when there is no sensible bridge, leaving the caller to decide.
 *
 * `volumeTsp` and `weightOz` are the amounts already reduced to each family's base unit.
 */
export function bridge(
  ingredient: string,
  qty: number,
  fromFamily: "volume" | "weight" | "count",
  toFamily: "volume" | "weight" | "count",
  opts: { volumeTsp?: number; weightOz?: number } = {},
): number | null {
  const ozPerCup = OZ_PER_CUP[ingredient] ?? DEFAULT_OZ_PER_CUP;
  const ozPerItem = OZ_PER_ITEM[ingredient];

  // volume -> weight
  if (fromFamily === "volume" && toFamily === "weight") {
    const tsp = opts.volumeTsp ?? qty;
    return (tsp / CUPS) * ozPerCup;
  }

  // weight -> volume
  if (fromFamily === "weight" && toFamily === "volume") {
    const oz = opts.weightOz ?? qty;
    return (oz / ozPerCup) * CUPS;
  }

  // weight -> count, and count -> weight, for things sold by the item
  if (ozPerItem) {
    if (fromFamily === "weight" && toFamily === "count") return (opts.weightOz ?? qty) / ozPerItem;
    if (fromFamily === "count" && toFamily === "weight") return qty * ozPerItem;
    if (fromFamily === "volume" && toFamily === "count") {
      return (((opts.volumeTsp ?? qty) / CUPS) * ozPerCup) / ozPerItem;
    }
  }

  return null;
}

export function hasBridge(ingredient: string, fromFamily: string, toFamily: string): boolean {
  if (fromFamily === toFamily) return false;
  if ((fromFamily === "volume" && toFamily === "weight") || (fromFamily === "weight" && toFamily === "volume")) return true;
  return Boolean(OZ_PER_ITEM[ingredient]);
}
