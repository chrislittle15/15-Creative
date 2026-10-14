// The reviewer (SPEC.md section 6): seven rule checks in code. A recommendation that
// fails any rule is rejected with every failing reason recorded.

import { savedHours, taskHours } from "./math";
import { containsNumber } from "./numbers";
import type { Settings } from "./settings";
import type { FrequencyKey, Pattern, Range, Recommendation, Task } from "./types";

export type RuleId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Rejection {
  rule: RuleId;
  reason: string;
}

export interface ReviewContext {
  taskMap: Task[];
  /** Every answer the visitor tapped or typed, as shown to them. */
  answers: string[];
  catalog: Pattern[];
  /** Latest link-checker result per URL: true when the link works. */
  linkOk: Map<string, boolean>;
  today: Date;
  settings: Settings;
}

export interface Review {
  recommendation: Recommendation;
  passed: boolean;
  rejections: Rejection[];
}

export const RULE_NAMES: Record<RuleId, string> = {
  1: "Task is in the task map",
  2: "Quoted evidence appears word for word in the visitor's answers",
  3: "Pattern is in the catalog and every required signal was recorded",
  4: "Tool is listed on the pattern, with a working link checked within the limit",
  5: "Hours figures are the ones code computed",
  6: "Model-written sentences contain no numbers",
  7: "A working-habit suggestion carries no hours unless the catalog supplies a share",
};

const FREQUENCY_ORDER: FrequencyKey[] = ["lt_monthly", "monthly", "weekly", "few_week", "daily"];

export function meetsFrequency(actual: FrequencyKey, minimum: FrequencyKey): boolean {
  return FREQUENCY_ORDER.indexOf(actual) >= FREQUENCY_ORDER.indexOf(minimum);
}

/** Same words in the same order; spacing, case, dash style and curly quotes don't matter. */
const normalize = (t: string) =>
  t.normalize("NFKC").replace(/[\u2010-\u2015\u2212]/g, "-").replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, " ").trim().toLowerCase();

const DAY_MS = 24 * 60 * 60 * 1000;

function sameRange(a: Range, b: Range): boolean {
  const eq = (x: number, y: number) => Math.abs(x - y) < 1e-9;
  return eq(a.low, b.low) && eq(a.high, b.high);
}

export function review(rec: Recommendation, ctx: ReviewContext): Review {
  const rejections: Rejection[] = [];
  const reject = (rule: RuleId, reason: string) => rejections.push({ rule, reason });

  // Rule 1
  const task = ctx.taskMap.find((t) => t.id === rec.taskId);
  if (!task) reject(1, `Task "${rec.taskId}" is not in the task map`);

  // Rule 2
  const quote = normalize(rec.evidenceQuote ?? "");
  if (!quote) reject(2, "No quoted evidence");
  else if (!ctx.answers.some((a) => normalize(a).includes(quote))) {
    reject(2, "Quoted evidence does not appear word for word in the visitor's answers");
  }

  // Rule 3
  const pattern = ctx.catalog.find((p) => p.id === rec.patternId);
  if (!pattern) reject(3, `Pattern "${rec.patternId}" is not in the catalog`);
  else if (task) {
    const missing = pattern.requiredSignals.filter((sig) => !task.signals[sig]?.trim());
    if (missing.length) reject(3, `Required signals not recorded: ${missing.join(", ")}`);
    if (pattern.minFrequency && !meetsFrequency(task.frequency, pattern.minFrequency)) {
      reject(3, `Task repeats less often than the pattern needs (${pattern.minFrequency})`);
    }
  }

  // Rule 4
  if (pattern) {
    if (pattern.level === "habit") {
      if (rec.toolId) reject(4, "A working-habit suggestion names a tool");
    } else if (!rec.toolId) {
      reject(4, "No tool named");
    } else {
      const tool = pattern.tools.find((t) => t.id === rec.toolId);
      if (!tool) reject(4, `Tool "${rec.toolId}" is not listed on pattern "${pattern.id}"`);
      else {
        if (ctx.linkOk.get(tool.url) !== true) reject(4, `Tool link is not confirmed working: ${tool.url}`);
        const checked = Date.parse(tool.checked);
        const maxAge = ctx.settings.reviewer.tool_check_max_age_days;
        if (Number.isNaN(checked)) reject(4, `Tool check date is missing or invalid`);
        else if ((ctx.today.getTime() - checked) / DAY_MS > maxAge) {
          reject(4, `Tool was checked more than ${maxAge} days ago (${tool.checked})`);
        }
      }
    }
  }

  // Rules 5 and 7
  if (pattern && task) {
    const isUnbackedHabit = pattern.level === "habit" && !pattern.share;
    const th = taskHours(task, ctx.settings);
    const expected = pattern.share && th.hoursPerWeek ? savedHours(th.hoursPerWeek, pattern.share) : null;
    if (isUnbackedHabit) {
      if (rec.hours) reject(7, "Working-habit suggestion shows hours but the catalog gives no share");
    } else if (!expected) {
      if (rec.hours) reject(5, "Hours shown where code computes none");
    } else if (
      !rec.hours ||
      !sameRange(rec.hours.hoursPerWeek, expected.hoursPerWeek) ||
      !sameRange(rec.hours.share, expected.share) ||
      !sameRange(rec.hours.saved, expected.saved)
    ) {
      reject(5, "Hours figures differ from what code computed");
    }
  }

  // Rule 6
  for (const sentence of rec.modelSentences ?? []) {
    if (containsNumber(sentence, ctx.settings)) reject(6, `Model sentence contains a number: "${sentence}"`);
  }

  return { recommendation: rec, passed: rejections.length === 0, rejections };
}
