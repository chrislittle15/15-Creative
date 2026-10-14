// Rule-based ingredient line parser. No model involvement: quantity, unit and name are
// extracted by regex and a lookup table, and a line we cannot read confidently is flagged
// rather than guessed at.

import { DESCRIPTORS, CONTAINER_WORDS } from "./packages.data.ts";
import { UNIT_ALIASES, UNIT_TOKENS, DESCRIPTIVE_COUNT_UNITS } from "./units.ts";
import { applyAlias } from "./aliases.ts";

export type ParsedLine = {
  /** The line exactly as given. */
  raw: string;
  /** Ingredient text after quantity, unit and packaging words are removed. */
  text: string;
  /** Lowercased name used to join against the package reference. */
  normalized: string;
  qty: number | null;
  unit: string | null;
  /** True when quantity or unit could not be read confidently. Never silently dropped. */
  needsReview: boolean;
};

// Only these "-ves" plurals come from an "-f" stem. A blanket rule would turn
// olives into "olif" and chives into "chif", which a shopper would actually see.
const F_STEM_PLURALS = ["leaves", "loaves", "halves", "knives", "shelves", "calves", "wolves"];

const FRACTIONS: Record<string, number> = {
  "½": 0.5, "⅓": 1 / 3, "⅔": 2 / 3, "¼": 0.25, "¾": 0.75,
  "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875,
};

// Lookahead, not a consumed group, so a quantity glued to its unit ("8oz") still splits.
const BOUNDARY = "(?=\\s|[a-zA-Z]|$)";
const FRAC_CHARS = "½⅓⅔¼¾⅛⅜⅝⅞";

type QtyResult = { qty: number | null; rest: string };

export function extractQuantity(line: string): QtyResult {
  const s = line.trim();

  // "2-3 cloves garlic" — take the upper bound so a list never under-buys.
  const range = s.match(new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*[-–—]\\s*(\\d+(?:\\.\\d+)?)${BOUNDARY}`));
  if (range?.[2]) return { qty: parseFloat(range[2]), rest: s.slice(range[0].length).trim() };

  const mixedUnicode = s.match(new RegExp(`^(\\d+)\\s*([${FRAC_CHARS}])${BOUNDARY}`));
  if (mixedUnicode?.[1] && mixedUnicode[2]) {
    return { qty: parseInt(mixedUnicode[1], 10) + (FRACTIONS[mixedUnicode[2]] ?? 0), rest: s.slice(mixedUnicode[0].length).trim() };
  }

  const unicodeFrac = s.match(new RegExp(`^([${FRAC_CHARS}])${BOUNDARY}`));
  if (unicodeFrac?.[1]) return { qty: FRACTIONS[unicodeFrac[1]] ?? null, rest: s.slice(unicodeFrac[0].length).trim() };

  const mixed = s.match(new RegExp(`^(\\d+)\\s+(\\d+)\\/(\\d+)${BOUNDARY}`));
  if (mixed?.[1] && mixed[2] && mixed[3]) {
    return { qty: parseInt(mixed[1], 10) + parseInt(mixed[2], 10) / parseInt(mixed[3], 10), rest: s.slice(mixed[0].length).trim() };
  }

  const frac = s.match(new RegExp(`^(\\d+)\\/(\\d+)${BOUNDARY}`));
  if (frac?.[1] && frac[2]) return { qty: parseInt(frac[1], 10) / parseInt(frac[2], 10), rest: s.slice(frac[0].length).trim() };

  const dec = s.match(new RegExp(`^(\\d+(?:\\.\\d+)?)${BOUNDARY}`));
  if (dec?.[1]) return { qty: parseFloat(dec[1]), rest: s.slice(dec[0].length).trim() };

  return { qty: null, rest: s };
}

export function extractUnit(str: string): { unit: string | null; rest: string } {
  const s = str.trim();
  for (const token of UNIT_TOKENS) {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const m = s.toLowerCase().match(new RegExp(`^${escaped}\\.?(\\s+|$)`, "i"));
    if (m) return { unit: UNIT_ALIASES[token] ?? null, rest: s.slice(m[0].length).trim() };
  }
  return { unit: null, rest: s };
}

/** Lowercase, drop parentheticals, trailing clauses, descriptors and packaging words, singularize. */
export function normalizeName(raw: string): string {
  let name = raw.toLowerCase();
  name = name.replace(/\([^)]*\)/g, " ");
  name = name.replace(/[,;].*$/, "");
  name = name.replace(/-/g, " ");

  const words = name.split(/\s+/).filter(Boolean)
    .filter((w) => !DESCRIPTORS.includes(w) && !CONTAINER_WORDS.includes(w));

  name = words.join(" ").replace(/[^a-z\s]/g, "").replace(/\s+/g, " ").trim();

  if (name.length > 3) {
    if (name.endsWith("oes")) name = name.slice(0, -2);
    else if (name.endsWith("ies")) name = name.slice(0, -3) + "y";
    else if (F_STEM_PLURALS.some((w) => name.endsWith(w))) name = name.slice(0, -3) + "f";
    else if (name.endsWith("ses")) name = name.slice(0, -2);
    else if (name.endsWith("s") && !name.endsWith("ss") && !name.endsWith("us")) name = name.slice(0, -1);
  }
  // A variant name ("spring onion", "plain flour") resolves to the store's name here, so
  // every later lookup — package math, diet table, matching — sees one canonical spelling.
  return applyAlias(name.trim());
}

/**
 * Reference keys must be spelled the way a recipe line normalizes, or the entry is
 * unreachable. "black beans" in a recipe becomes "black bean", so the key is run through
 * the same pipeline. Names ending in a descriptive count unit keep their plural, because
 * the parser appends it.
 */
export function normalizeKey(key: string): string {
  const words = key.split(/\s+/);
  const last = words[words.length - 1];
  const isCountPlural = Object.values(DESCRIPTIVE_COUNT_UNITS).includes(last ?? "");
  if (isCountPlural && words.length > 1) {
    return `${normalizeName(words.slice(0, -1).join(" "))} ${last}`.trim();
  }
  return normalizeName(key) || key;
}

export function parseLine(line: string): ParsedLine | null {
  const original = line.trim();
  if (!original) return null;

  // "1 (14.5 oz) can diced tomatoes" — the aside would otherwise hide the unit.
  const forParsing = original.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim() || original;

  const { qty, rest } = extractQuantity(forParsing);
  const unitResult = extractUnit(rest);

  // Drop the connector and packaging words a unit leaves behind ("6 slices of bacon").
  let text = unitResult.rest
    .replace(/^(box|boxes|can|cans|bag|bags|jar|jars|bottle|bottles|carton|cartons|package|packages|pkg|pkgs|container|containers)\b\s*/i, "")
    .replace(/^(of the|of)\b\s*/i, "")
    .trim();

  // "2 onions" names an amount even though it names no unit: two of the thing. Treat a
  // bare number as a count rather than calling the line unreadable.
  const unit = unitResult.unit ?? (qty !== null ? "ct" : null);

  const needsReview = qty === null || unit === null || text === "";
  if (text === "") text = original;

  let normalized = normalizeName(text);
  if (unit && unit in DESCRIPTIVE_COUNT_UNITS) {
    const suffix = DESCRIPTIVE_COUNT_UNITS[unit] as string;
    const parts = normalized.split(/\s+/);
    if (!parts.includes(suffix) && !parts.includes(unit)) normalized = `${normalized} ${suffix}`.trim();
  }

  return { raw: original, text, normalized, qty, unit, needsReview };
}

/** Parse a pasted block. Blank lines and "Recipe 1:" style group labels are skipped. */
export function parseBlock(text: string): ParsedLine[] {
  const out: ParsedLine[] = [];
  for (const line of text.split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^recipe\s*\d*\s*:?$/i.test(trimmed)) continue;
    const parsed = parseLine(trimmed);
    if (parsed) out.push(parsed);
  }
  return out;
}
