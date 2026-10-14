// Settings shape, plus a Node loader for tests and scripts.
// The browser build will import the same YAML through the bundler.

import type { DurationKey, Effort, FrequencyKey } from "./types";

export interface Settings {
  durations: Record<DurationKey, { label: string; low: number; high: number }>;
  frequencies: Record<FrequencyKey, { label: string; low: number; high: number; counted: boolean }>;
  default_week_hours: number;
  rounding: {
    hours_per_week: { decimals: number; decimals_below_one: number };
    hours_saved: { decimals: number };
    week_covered_percent: { decimals: number };
  };
  effort_order: Effort[];
  habits: {
    meeting_gaps: { min_meetings_in_a_row: number };
    written_update: { min_meeting_share_of_week: number };
    email_batches: { min_email_hours_per_week: number };
    group_similar: { min_cards_same_tool: number };
  };
  reviewer: { tool_check_max_age_days: number; number_words: string[] };
  agent: {
    max_questions: number;
    min_tap_answers: number;
    max_tap_answers: number;
    required_fields: string[];
    top_tasks_required: number;
  };
  caps: { per_interview_usd: number; per_day_usd: number };
  job_description_max_chars: number;
  models: { seed: string; sample_answers: string; agent: string; match: string };
  prices_per_mtok: Record<string, { input: number; output: number; cache_write: number; cache_read: number }>;
  seed: { cards_per_screen_max: number; title_max_chars: number; industry_max_chars: number };
}

export async function loadSettings(path = new URL("../../config/settings.yaml", import.meta.url)): Promise<Settings> {
  const { readFile } = await import("node:fs/promises");
  const { parse } = await import("yaml");
  return parse(await readFile(path, "utf8")) as Settings;
}
