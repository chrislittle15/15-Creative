// Savings math (SPEC.md section 4). Every hours figure the visitor sees comes from here.

import type { Settings } from "./settings";
import type { Effort, Range, SavedHours, Task, TaskHours } from "./types";

/** Hours per week for one task: duration × frequency, low and high. */
export function taskHours(task: Task, s: Settings): TaskHours {
  const d = s.durations[task.duration];
  const f = s.frequencies[task.frequency];
  if (!d || !f) throw new Error(`Unknown duration or frequency on task ${task.id}`);
  if (!f.counted) return { taskId: task.id, counted: false, hoursPerWeek: null, midpoint: 0 };
  const hoursPerWeek = { low: d.low * f.low, high: d.high * f.high };
  return { taskId: task.id, counted: true, hoursPerWeek, midpoint: (hoursPerWeek.low + hoursPerWeek.high) / 2 };
}

/** Hours saved per week: low hours × low share, high hours × high share. */
export function savedHours(hoursPerWeek: Range, share: Range): SavedHours {
  if (share.low < 0 || share.high > 1 || share.low > share.high) {
    throw new Error("Share must be fractions with 0 <= low <= high <= 1");
  }
  return {
    hoursPerWeek,
    share,
    saved: { low: hoursPerWeek.low * share.low, high: hoursPerWeek.high * share.high },
  };
}

export interface WeekSummary {
  sumLow: number;
  sumHigh: number;
  sumMidpoint: number;
  /** Sum of midpoint hours ÷ stated hours per week, as a fraction. */
  weekCovered: number;
  /** True when the sum of high hours exceeds the stated week: the visitor is asked to adjust. */
  overWeek: boolean;
}

export function weekSummary(hours: TaskHours[], statedWeekHours: number): WeekSummary {
  if (!(statedWeekHours > 0)) throw new Error("Stated week must be more than zero hours");
  let sumLow = 0, sumHigh = 0, sumMidpoint = 0;
  for (const h of hours) {
    if (!h.hoursPerWeek) continue;
    sumLow += h.hoursPerWeek.low;
    sumHigh += h.hoursPerWeek.high;
    sumMidpoint += h.midpoint;
  }
  return { sumLow, sumHigh, sumMidpoint, weekCovered: sumMidpoint / statedWeekHours, overWeek: sumHigh > statedWeekHours };
}

/** Total hours saved across recommendations, low and high. */
export function totalSaved(items: { saved: Range }[]): Range {
  return items.reduce((t, i) => ({ low: t.low + i.saved.low, high: t.high + i.saved.high }), { low: 0, high: 0 });
}

export interface Rankable {
  taskName: string;
  effort: Effort;
  saved: Range;
}

/** Highest high-end saved first; ties go to lower effort, then higher low-end saved, then name A to Z. */
export function rank<T extends Rankable>(items: T[], s: Settings): T[] {
  const effortIndex = (e: Effort) => s.effort_order.indexOf(e);
  return [...items].sort(
    (a, b) =>
      b.saved.high - a.saved.high ||
      effortIndex(a.effort) - effortIndex(b.effort) ||
      b.saved.low - a.saved.low ||
      a.taskName.localeCompare(b.taskName),
  );
}

// ---- Display formatting. Rounds only for the screen. ----

function fixed(n: number, decimals: number): string {
  // Round half away from zero on a decimal basis, avoiding binary float surprises like 0.35 -> 0.3.
  const factor = 10 ** decimals;
  return (Math.round((n + Number.EPSILON) * factor) / factor).toFixed(decimals);
}

export function formatHoursPerWeek(n: number, s: Settings): string {
  const r = s.rounding.hours_per_week;
  return fixed(n, Math.abs(n) < 1 && n !== 0 ? r.decimals_below_one : r.decimals);
}

export function formatHoursSaved(n: number, s: Settings): string {
  return fixed(n, s.rounding.hours_saved.decimals);
}

export function formatPercent(fraction: number, s: Settings): string {
  return `${fixed(fraction * 100, s.rounding.week_covered_percent.decimals)}%`;
}

/** "2.0 to 4.0", or a single figure when low and high round the same. */
export function formatRange(r: Range, fmt: (n: number) => string): string {
  const lo = fmt(r.low), hi = fmt(r.high);
  return lo === hi ? lo : `${lo} to ${hi}`;
}
