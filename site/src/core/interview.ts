// Shapes shared by the browser and the server, plus the drill-down bookkeeping done in code.

import { taskHours } from "./math";
import type { Settings } from "./settings";
import type { Screen, Task, TaskKind } from "./types";

export type Field = "tool" | "volume" | "input" | "output";
export const FIELDS: Field[] = ["tool", "volume", "input", "output"];

export const FIELD_MEANING: Record<Field, string> = {
  tool: "the software or system the work is done in",
  volume: "how much of it there is (items, messages, rows, people, per day or week)",
  input: "how the work arrives or where its information comes from",
  output: "where the finished work goes, or who receives it",
};

export interface SeedCard { id: string; name: string; screen: Screen; kind: TaskKind }
export interface SeedRequest { title: string; industry: string; weekHours: number; jobDescription?: string }
export interface SeedResponse { interviewId: string; cards: SeedCard[]; tools: string[] }

export interface AskedQuestion {
  taskId: string;
  fields: Field[];
  question: string;
  options: string[];
  /** What the visitor tapped or typed. Empty until answered. */
  answer: string;
}

export interface InterviewRequest {
  interviewId: string;
  weekHours: number;
  tasks: Task[];
  history: AskedQuestion[];
  finishNow?: boolean;
}

export type DoneReason = "visitor" | "limit" | "agent" | "budget" | "stalled";

export interface InterviewResponse {
  done: boolean;
  reason?: DoneReason;
  question?: Omit<AskedQuestion, "answer">;
  /** Earlier answers the agent filed under another field: apply these to the task map. */
  recorded: { taskId: string; field: Field; answerNumber: number }[];
  questionsAsked: number;
  maxQuestions: number;
}

export interface MatchRequest { interviewId: string; weekHours: number; tasks: Task[]; history: AskedQuestion[] }

/** Counted tasks with the most hours first (high end, then low end). */
export function tasksByHours(tasks: Task[], s: Settings): Task[] {
  const h = new Map(tasks.map((t) => [t.id, taskHours(t, s)]));
  return tasks
    .filter((t) => h.get(t.id)!.counted)
    .sort((a, b) => h.get(b.id)!.hoursPerWeek!.high - h.get(a.id)!.hoursPerWeek!.high || h.get(b.id)!.hoursPerWeek!.low - h.get(a.id)!.hoursPerWeek!.low);
}

/** Missing fields per task, most hours first. */
export function missingFields(tasks: Task[], s: Settings): { taskId: string; taskName: string; missing: Field[] }[] {
  return tasksByHours(tasks, s)
    .map((t) => ({ taskId: t.id, taskName: t.name, missing: FIELDS.filter((f) => !t.signals[f]?.trim()) }))
    .filter((x) => x.missing.length);
}

/** Finish is allowed once the top tasks by hours have every required field. */
export function topTasksComplete(tasks: Task[], s: Settings): { complete: boolean; gaps: { taskId: string; taskName: string; missing: Field[] }[] } {
  const top = tasksByHours(tasks, s).slice(0, s.agent.top_tasks_required);
  const gaps = top
    .map((t) => ({ taskId: t.id, taskName: t.name, missing: (s.agent.required_fields as Field[]).filter((f) => !t.signals[f]?.trim()) }))
    .filter((g) => g.missing.length);
  return { complete: gaps.length === 0, gaps };
}

/** "Not sure" and similar answers leave the fact missing rather than filling it. */
export function isUnsure(answer: string): boolean {
  return /^\s*(not sure|unsure|don'?t know|do not know|no idea|n\/?a|it depends|not applicable|skip)\b\.?\s*$/i.test(answer);
}

/** Apply the visitor's answers (and the agent's cross-filings) to the task map. Pure. */
export function applyAnswers(tasks: Task[], history: AskedQuestion[], recorded: InterviewResponse["recorded"] = []): Task[] {
  const out = tasks.map((t) => ({ ...t, signals: { ...t.signals } }));
  const byId = new Map(out.map((t) => [t.id, t]));
  for (const q of history) {
    const t = byId.get(q.taskId);
    if (!t || !q.answer.trim() || isUnsure(q.answer)) continue;
    for (const f of q.fields) t.signals[f] = q.answer.trim();
  }
  for (const r of recorded) {
    const t = byId.get(r.taskId);
    const q = history[r.answerNumber - 1];
    if (t && q?.answer.trim() && !isUnsure(q.answer) && !t.signals[r.field]) t.signals[r.field] = q.answer.trim();
  }
  return out;
}
