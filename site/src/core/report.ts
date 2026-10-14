// Builds the report from the task map and the model's proposed matches.
// Code decides everything here: routing, hours, ranking and the reviewer verdicts.
// The only model text that reaches the report is the evidence quote (checked word for word
// against the visitor's answers) and one "why" sentence per match (checked for numbers).

import { ownedTool } from "./catalog";
import { triggeredHabits } from "./habits";
import { isUnsure } from "./interview";
import { rank, savedHours, taskHours, totalSaved, weekSummary } from "./math";
import { meetsFrequency, review, RULE_NAMES, type Rejection, type RuleId } from "./reviewer";
import type { Settings } from "./settings";
import type { Effort, Pattern, Range, Recommendation, SolutionLevel, Task } from "./types";

/** What the matching model proposes for one task. */
export interface Proposal {
  taskId: string;
  patternId: string | null;
  toolId: string | null;
  evidenceQuote: string;
  why: string;
}

export interface MathBreakdown {
  durationLabel: string;
  duration: Range;
  frequencyLabel: string;
  frequency: Range;
  hoursPerWeek: Range;
  share: Range;
  sharePlaceholder: boolean;
  saved: Range;
}

export interface Opportunity {
  rank: number;
  taskId: string;
  taskName: string;
  quote: string;
  why: string;
  patternId: string;
  patternName: string;
  level: SolutionLevel;
  tool: { id: string; name: string; url: string; checked: string; owned: boolean };
  math: MathBreakdown;
  saved: Range;
  effort: Effort;
  firstStep: string;
  failureMode: string;
}

export interface HabitSuggestion {
  patternId: string;
  name: string;
  becauseTasks: string[];
  firstStep: string;
  failureMode: string;
  effort: Effort;
  saved: Range | null;
}

export interface Report {
  version: 1;
  weekHours: number;
  summary: { weekCovered: number; mapped: Range; saved: Range; tasksMapped: number };
  opportunities: Opportunity[];
  habits: HabitSuggestion[];
  noFit: { taskName: string }[];
  thin: { taskName: string; patternName: string; missing: string[] }[];
  notCounted: { taskName: string }[];
  checked: {
    proposals: number;
    passed: number;
    heldForDetail: number;
    rejected: { taskName: string; patternName: string; reasons: Rejection[] }[];
    rules: { id: RuleId; name: string; failures: number }[];
  };
  catalogDraft: boolean;
}

export interface BuildInput {
  tasks: Task[];
  weekHours: number;
  /** Everything the visitor tapped or typed, including ticked card names and tool answers. */
  answers: string[];
  proposals: Proposal[];
  catalog: Pattern[];
  linkOk: Map<string, boolean>;
  today: Date;
  settings: Settings;
}

export function buildReport(input: BuildInput): Report {
  const { tasks, catalog, settings: s } = input;
  const ctx = { taskMap: tasks, answers: input.answers, catalog, linkOk: input.linkOk, today: input.today, settings: s };
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const proposalFor = new Map(input.proposals.map((p) => [p.taskId, p]));

  const noFit: Report["noFit"] = [];
  const thin: Report["thin"] = [];
  const notCounted: Report["notCounted"] = [];
  const rejected: Report["checked"]["rejected"] = [];
  const passed: Omit<Opportunity, "rank">[] = [];
  const ruleFailures = new Map<RuleId, number>();
  let proposals = 0;

  for (const task of tasks) {
    const th = taskHours(task, s);
    if (!th.counted) { notCounted.push({ taskName: task.name }); continue; }
    const prop = proposalFor.get(task.id);
    const pattern = prop?.patternId ? byId.get(prop.patternId) : undefined;
    if (!prop || !prop.patternId) { noFit.push({ taskName: task.name }); continue; }
    if (pattern?.level === "habit") { noFit.push({ taskName: task.name }); continue; } // habits come only from code rules
    proposals++;

    if (pattern) {
      const missing = pattern.requiredSignals.filter((sig) => !task.signals[sig]?.trim());
      const freqOk = !pattern.minFrequency || meetsFrequency(task.frequency, pattern.minFrequency);
      if (missing.length || !freqOk) {
        if (missing.length) thin.push({ taskName: task.name, patternName: pattern.name, missing });
        else noFit.push({ taskName: task.name }); // repeats too rarely for this pattern
        continue;
      }
    }

    // Owned tool first: if the visitor already uses one of the pattern's tools, code picks it.
    const owned = pattern ? ownedTool(pattern, task.signals.tool ?? task.tool) : undefined;
    // Then the model's pick if it is on the pattern, else the pattern's first listed tool.
    const modelPick = pattern?.tools.some((t) => t.id === prop.toolId) ? prop.toolId! : undefined;
    const toolId = owned?.id ?? modelPick ?? pattern?.tools[0]?.id ?? prop.toolId ?? undefined;
    const expected = pattern?.share ? savedHours(th.hoursPerWeek!, pattern.share) : null;
    const rec: Recommendation = {
      taskId: task.id, patternId: prop.patternId, toolId,
      evidenceQuote: prop.evidenceQuote, modelSentences: prop.why ? [prop.why] : [], hours: expected,
    };
    const verdict = review(rec, ctx);
    if (!verdict.passed || !pattern || !expected) {
      for (const r of verdict.rejections) ruleFailures.set(r.rule, (ruleFailures.get(r.rule) ?? 0) + 1);
      rejected.push({ taskName: task.name, patternName: pattern?.name ?? prop.patternId, reasons: verdict.rejections });
      continue;
    }
    const tool = pattern.tools.find((t) => t.id === toolId)!;
    const d = s.durations[task.duration], f = s.frequencies[task.frequency];
    passed.push({
      taskId: task.id, taskName: task.name, quote: prop.evidenceQuote.trim(), why: prop.why,
      patternId: pattern.id, patternName: pattern.name, level: pattern.level,
      tool: { id: tool.id, name: tool.name, url: tool.url, checked: tool.checked, owned: Boolean(owned) },
      math: {
        durationLabel: d.label, duration: { low: d.low, high: d.high },
        frequencyLabel: f.label, frequency: { low: f.low, high: f.high },
        hoursPerWeek: expected.hoursPerWeek, share: expected.share,
        sharePlaceholder: Boolean(pattern.sharePlaceholder), saved: expected.saved,
      },
      saved: expected.saved, effort: pattern.effort, firstStep: pattern.firstStep, failureMode: pattern.failureMode,
    });
  }

  const ranked = rank(passed, s).map((o, i) => ({ ...o, rank: i + 1 }));

  // Working habits: suggested only by code rules, outside the ranking.
  const habits: HabitSuggestion[] = [];
  for (const h of triggeredHabits(tasks, input.weekHours, s)) {
    const pattern = catalog.find((p) => p.level === "habit" && p.trigger === h.trigger);
    if (!pattern) continue;
    const first = tasks.find((t) => t.id === h.taskIds[0])!;
    const th = taskHours(first, s);
    const hours = pattern.share && th.hoursPerWeek ? savedHours(th.hoursPerWeek, pattern.share) : null;
    // Habits are triggered by code from the ticked cards themselves, so the card name is the evidence.
    const verdict = review({ taskId: first.id, patternId: pattern.id, evidenceQuote: first.name, modelSentences: [], hours },
      { ...ctx, answers: [...ctx.answers, ...tasks.map((t) => t.name)] });
    if (!verdict.passed) {
      rejected.push({ taskName: first.name, patternName: pattern.name, reasons: verdict.rejections });
      continue;
    }
    habits.push({
      patternId: pattern.id, name: pattern.name, effort: pattern.effort,
      becauseTasks: h.trigger === "group_similar" ? groupByTool(h.taskIds.map((id) => tasks.find((t) => t.id === id)!)) : h.taskIds.map((id) => tasks.find((t) => t.id === id)!.name),
      firstStep: pattern.firstStep, failureMode: pattern.failureMode, saved: hours?.saved ?? null,
    });
  }

  const week = weekSummary(tasks.map((t) => taskHours(t, s)), input.weekHours);
  return {
    version: 1,
    weekHours: input.weekHours,
    summary: {
      weekCovered: week.weekCovered,
      mapped: { low: week.sumLow, high: week.sumHigh },
      saved: totalSaved(ranked),
      tasksMapped: tasks.length,
    },
    opportunities: ranked,
    habits,
    noFit, thin, notCounted,
    checked: {
      proposals,
      passed: ranked.length,
      heldForDetail: thin.length,
      rejected,
      rules: (Object.keys(RULE_NAMES).map(Number) as RuleId[]).map((id) => ({ id, name: RULE_NAMES[id], failures: ruleFailures.get(id) ?? 0 })),
    },
    catalogDraft: catalog.some((p) => p.status !== "approved" || p.sharePlaceholder),
  };
}

/**
 * The visitor's own words: answers they tapped or typed and their tool answers. Card names are
 * left out: a model drafted them, so a card name alone is not evidence for a match.
 */
export function visitorAnswers(tasks: Task[], answered: { answer: string }[]): string[] {
  const out = answered.map((a) => a.answer).filter((a) => !isUnsure(a));
  for (const t of tasks) {
    if (t.tool) out.push(t.tool);
    out.push(...Object.values(t.signals));
  }
  return out.filter((x) => x && x.trim());
}

/** "Excel: Build the report, Reconcile invoices" lines for the group-similar habit. */
function groupByTool(ts: Task[]): string[] {
  const groups = new Map<string, Task[]>();
  for (const t of ts) {
    const key = (t.tool ?? "").trim().toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }
  return [...groups.values()].map((g) => `${g[0].tool!.trim()}: ${g.map((t) => t.name).join(", ")}`);
}
