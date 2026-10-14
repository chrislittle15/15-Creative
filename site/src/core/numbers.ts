// Reviewer rule 6 helper: does a model-written sentence contain a number?

import type { Settings } from "./settings";

export function containsNumber(sentence: string, s: Settings): boolean {
  if (/[0-9%]/.test(sentence)) return true;
  // Unicode digits and vulgar fractions (e.g. "½", "٣").
  if (/[\p{Nd}\p{No}]/u.test(sentence)) return true;
  // Set phrases where "one" is a pronoun, not a quantity.
  const plain = sentence.toLowerCase().replace(/\b(each one|no one|one by one|one another)\b/g, " ");
  const words = plain.match(/\p{L}+/gu) ?? [];
  const numberWords = new Set(s.reviewer.number_words.map((w) => w.toLowerCase()));
  return words.some((w) => numberWords.has(w));
}
