// Working-habit triggers (SPEC.md section 3). Rules in code only; no model involved.
// Each key matches a habit pattern's `trigger` in the catalog.

import { taskHours } from "./math";
import type { Settings } from "./settings";
import type { Task } from "./types";

export type HabitTrigger = "meeting_gaps" | "written_update" | "email_batches" | "group_similar";

export interface TriggeredHabit {
  trigger: HabitTrigger;
  /** Tasks that set the rule off, shown beside the suggestion. */
  taskIds: string[];
}

export function triggeredHabits(tasks: Task[], statedWeekHours: number, s: Settings): TriggeredHabit[] {
  const out: TriggeredHabit[] = [];
  const h = s.habits;
  const midpoint = (t: Task) => taskHours(t, s).midpoint;

  // Gaps after back-to-back meetings: N or more meeting cards in a row on "Most days".
  const day = tasks.filter((t) => t.screen === "most_days").sort((a, b) => a.order - b.order);
  let run: Task[] = [], longest: Task[] = [];
  for (const t of day) {
    run = t.kind === "meeting" ? [...run, t] : [];
    if (run.length > longest.length) longest = run;
  }
  if (longest.length >= h.meeting_gaps.min_meetings_in_a_row) {
    out.push({ trigger: "meeting_gaps", taskIds: longest.map((t) => t.id) });
  }

  // Replace a status meeting with a written update: meetings above a share of the week.
  const meetings = tasks.filter((t) => t.kind === "meeting");
  const meetingHours = meetings.reduce((sum, t) => sum + midpoint(t), 0);
  if (meetings.length && meetingHours / statedWeekHours > h.written_update.min_meeting_share_of_week) {
    out.push({ trigger: "written_update", taskIds: meetings.map((t) => t.id) });
  }

  // Check email in batches: email work above a set number of hours.
  const email = tasks.filter((t) => t.kind === "email");
  const emailHours = email.reduce((sum, t) => sum + midpoint(t), 0);
  if (email.length && emailHours > h.email_batches.min_email_hours_per_week) {
    out.push({ trigger: "email_batches", taskIds: email.map((t) => t.id) });
  }

  // Group similar tasks: N or more cards using the same tool.
  const byTool = new Map<string, Task[]>();
  for (const t of tasks) {
    const tool = t.tool?.trim().toLowerCase();
    if (tool) byTool.set(tool, [...(byTool.get(tool) ?? []), t]);
  }
  const grouped = [...byTool.values()].filter((g) => g.length >= h.group_similar.min_cards_same_tool);
  if (grouped.length) {
    out.push({ trigger: "group_similar", taskIds: grouped.flat().map((t) => t.id) });
  }

  return out;
}
