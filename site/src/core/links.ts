// Link and date checks for catalog tools. The fetching is passed in, so tests run offline.

import type { Pattern } from "./types";

export interface LinkResult { ok: boolean; status: number; finalUrl?: string; blocked?: boolean; note?: string }

export interface LinkRow {
  patternId: string; toolId: string; url: string; checked: string; status: number; problems: string[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function ageInDays(checked: string, today: Date): number {
  return Math.floor((today.getTime() - Date.parse(checked)) / DAY_MS);
}

export async function checkCatalogLinks(
  catalog: Pattern[],
  fetchStatus: (url: string) => Promise<LinkResult>,
  today: Date,
  maxAgeDays: number,
): Promise<{ rows: LinkRow[]; results: Record<string, LinkResult>; flagged: number }> {
  const urls = [...new Set(catalog.flatMap((p) => p.tools.map((t) => t.url)))];
  const results: Record<string, LinkResult> = {};
  await Promise.all(urls.map(async (u) => { results[u] = await fetchStatus(u); }));
  const rows: LinkRow[] = [];
  for (const p of catalog) {
    for (const t of p.tools) {
      const r = results[t.url];
      const problems: string[] = [];
      if (!r.ok) problems.push(r.note ?? `HTTP ${r.status}`);
      const age = ageInDays(t.checked, today);
      if (Number.isNaN(age)) problems.push("No valid check date");
      else if (age > maxAgeDays) problems.push(`Stale: checked ${age} days ago (limit ${maxAgeDays})`);
      rows.push({ patternId: p.id, toolId: t.id, url: t.url, checked: t.checked, status: r.status, problems });
    }
  }
  return { rows, results, flagged: rows.filter((r) => r.problems.length).length };
}
