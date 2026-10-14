// Sample team rollup (SPEC.md section 8). Grouped across members by pattern ID, in code.

import { rank, totalSaved } from "./math";
import type { Report } from "./report";
import type { Settings } from "./settings";
import type { Effort, Range, SolutionLevel } from "./types";

export interface RollupRow {
  patternId: string;
  patternName: string;
  level: SolutionLevel;
  effort: Effort;
  people: string[];
  tasks: { person: string; taskName: string; saved: Range }[];
  saved: Range;
  /** For ranking: same shape as an opportunity. */
  taskName: string;
}

export interface Rollup {
  team: string;
  members: { person: string; saved: Range; opportunities: number }[];
  rows: RollupRow[];
  shared: RollupRow[];
  total: Range;
}

export function buildRollup(team: string, members: { person: string; report: Report }[], s: Settings): Rollup {
  const byPattern = new Map<string, RollupRow>();
  for (const m of members) {
    for (const o of m.report.opportunities) {
      const row = byPattern.get(o.patternId) ?? {
        patternId: o.patternId, patternName: o.patternName, level: o.level, effort: o.effort,
        people: [], tasks: [], saved: { low: 0, high: 0 }, taskName: o.patternName,
      };
      if (!row.people.includes(m.person)) row.people.push(m.person);
      row.tasks.push({ person: m.person, taskName: o.taskName, saved: o.saved });
      row.saved = { low: row.saved.low + o.saved.low, high: row.saved.high + o.saved.high };
      byPattern.set(o.patternId, row);
    }
  }
  const rows = rank([...byPattern.values()], s);
  return {
    team,
    members: members.map((m) => ({ person: m.person, saved: m.report.summary.saved, opportunities: m.report.opportunities.length })),
    rows,
    shared: rows.filter((r) => r.people.length > 1),
    total: totalSaved(rows),
  };
}
