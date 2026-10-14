// Same regexes as pipeline.py: the score and verdict are read by code, not trusted from prose.

const SCORE_RE = /\*\*Match Score:\*\*\s*(\d+)\s*\/\s*10/;
const VERDICT_RE = /\*\*Verdict:\*\*\s*(BUILD|PASS)/;
const COMP_SUMMARY_RE = /\*\*Comp Summary:\*\*\s*(.+)/;
const WHY_IT_FITS_RE = /\*\*Why It Fits:\*\*\s*(.+)/;
const EVAL_SUMMARY_RE = /\*\*Evaluation Summary:\*\*\s*(.+)/;

export function parseMatchScore(memo: string): number | null {
  const m = SCORE_RE.exec(memo);
  return m ? Number(m[1]) : null;
}

export function parseVerdict(memo: string): "BUILD" | "PASS" | null {
  const m = VERDICT_RE.exec(memo);
  return m ? (m[1] as "BUILD" | "PASS") : null;
}

export const parseCompSummary = (memo: string): string | null => COMP_SUMMARY_RE.exec(memo)?.[1].trim() ?? null;
export const parseWhyItFits = (memo: string): string | null => WHY_IT_FITS_RE.exec(memo)?.[1].trim() ?? null;
export const parseEvaluationSummary = (memo: string): string | null => EVAL_SUMMARY_RE.exec(memo)?.[1].trim() ?? null;

export function parseMetadata(raw: string): { company: string; roleTitle: string } {
  let company = "Unknown Company";
  let roleTitle = "Unknown Role";
  for (const line of raw.split(/\r?\n/)) {
    const upper = line.toUpperCase();
    if (upper.startsWith("COMPANY:")) company = line.slice(line.indexOf(":") + 1).trim() || company;
    else if (upper.startsWith("ROLE:")) roleTitle = line.slice(line.indexOf(":") + 1).trim() || roleTitle;
  }
  return { company, roleTitle };
}
