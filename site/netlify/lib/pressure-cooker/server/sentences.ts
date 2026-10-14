// The guard on every sentence a model writes. A sentence is shown to the cook only if it
// contains no number of any kind (no digits, number words or fractions) and makes no
// health claim. Every figure the app displays comes from code, so a model sentence that
// carries one is rejected outright rather than edited.

const NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen",
  "nineteen", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety",
  "hundred", "hundreds", "thousand", "thousands", "million", "millions",
  "dozen", "dozens", "half", "halves", "quarter", "quarters", "third", "thirds",
  "once", "twice", "thrice", "single", "double", "triple", "pair",
  "first", "second", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth",
  "percent", "percentage",
];

const NUMBER_WORD_RE = new RegExp(`\\b(${NUMBER_WORDS.join("|")})\\b`, "i");
const NUMBER_SYMBOL_RE = /[0-9½⅓⅔¼¾⅛⅜⅝⅞%]|[⅐-↏]|[０-９]/;

// SPEC: no health claims. Matching is deliberately broad; a rejected sentence costs only
// the sentence.
const HEALTH_RE = /\b(health\w*|nutriti\w*|calori\w*|low[- ]?(fat|carb|sodium|sugar)|protein[- ]?packed|lean|light(er)?|guilt[- ]?free|superfood\w*|immun\w*|detox\w*|weight|diet(ary)?|wholesome|good for you|heart)\b/i;

export function containsNumber(sentence: string): boolean {
  return NUMBER_SYMBOL_RE.test(sentence) || NUMBER_WORD_RE.test(sentence);
}

export function containsHealthClaim(sentence: string): boolean {
  return HEALTH_RE.test(sentence);
}

/** The sentence if it may be shown, otherwise null. Also caps length and strips markup. */
export function cleanSentence(raw: unknown, maxChars = 160): string | null {
  if (typeof raw !== "string") return null;
  const text = raw.replace(/[<>*_`#]/g, "").replace(/\s+/g, " ").trim();
  if (!text || text.length > maxChars) return null;
  if (containsNumber(text) || containsHealthClaim(text)) return null;
  return text;
}
