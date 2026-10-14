// Turns the catalog YAML into Pattern objects and checks its shape.
// The catalog is the only source of recommendations, tools and savings ranges.

import type { CatalogTool, Effort, FrequencyKey, Pattern, SolutionLevel } from "./types";

interface RawTool { id: string; name: string; url: string; checked: string; owned_if?: string[] }
interface RawPattern {
  id: string; name: string; level: SolutionLevel; shape?: string; trigger?: string;
  required_signals?: string[]; min_frequency?: FrequencyKey; tools?: RawTool[];
  share_percent?: { low: number; high: number; placeholder?: boolean };
  effort: Effort; first_step: string; failure_mode: string; source_note: string; status?: "draft" | "approved";
}

const LEVELS: SolutionLevel[] = ["existing_tool", "automation", "ai_agent", "habit"];
const SIGNALS = ["tool", "volume", "input", "output"];

export function parseCatalog(raw: { patterns: RawPattern[] }): Pattern[] {
  const patterns = raw.patterns.map((p): Pattern => ({
    id: p.id,
    name: p.name,
    level: p.level,
    shape: p.shape,
    trigger: p.trigger,
    minFrequency: p.min_frequency,
    requiredSignals: p.required_signals ?? [],
    tools: (p.tools ?? []).map((t): CatalogTool => ({ id: t.id, name: t.name, url: t.url, checked: String(t.checked), ownedIf: t.owned_if })),
    share: p.share_percent ? { low: p.share_percent.low / 100, high: p.share_percent.high / 100 } : null,
    sharePlaceholder: Boolean(p.share_percent?.placeholder),
    effort: p.effort,
    firstStep: p.first_step,
    failureMode: p.failure_mode,
    sourceNote: p.source_note,
    status: p.status ?? "draft",
  }));
  const problems = validateCatalog(patterns);
  if (problems.length) throw new Error(`Catalog problems:\n- ${problems.join("\n- ")}`);
  return patterns;
}

export function validateCatalog(patterns: Pattern[]): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const p of patterns) {
    if (ids.has(p.id)) problems.push(`Duplicate pattern id ${p.id}`);
    ids.add(p.id);
    if (!LEVELS.includes(p.level)) problems.push(`${p.id}: unknown level ${p.level}`);
    for (const s of p.requiredSignals) if (!SIGNALS.includes(s)) problems.push(`${p.id}: unknown signal ${s}`);
    if (p.share && (p.share.low < 0 || p.share.high > 1 || p.share.low > p.share.high)) problems.push(`${p.id}: share out of range`);
    if (p.level === "habit") {
      if (!p.trigger) problems.push(`${p.id}: habit needs a trigger`);
      if (p.tools.length) problems.push(`${p.id}: habits name no tools`);
    } else {
      if (!p.tools.length) problems.push(`${p.id}: needs at least one tool`);
      if (!p.share) problems.push(`${p.id}: technology patterns need a share range`);
    }
    for (const t of p.tools) {
      if (!/^https:\/\//.test(t.url)) problems.push(`${p.id}/${t.id}: link must be https`);
      if (Number.isNaN(Date.parse(t.checked))) problems.push(`${p.id}/${t.id}: bad check date`);
    }
  }
  const habits = patterns.filter((p) => p.level === "habit").length;
  if (habits > 4) problems.push(`At most 4 working-habit patterns (found ${habits})`);
  return problems;
}

/** Everything that blocks the public launch. Empty means ready. */
export function launchBlockers(patterns: Pattern[]): string[] {
  const out: string[] = [];
  for (const p of patterns) {
    if (p.status !== "approved") out.push(`${p.id}: status is ${p.status}, not approved`);
    if (p.sharePlaceholder) out.push(`${p.id}: savings range is a placeholder`);
    if (/PLACEHOLDER/i.test([p.sourceNote, p.firstStep, p.failureMode, p.shape].join(" "))) out.push(`${p.id}: contains PLACEHOLDER text`);
  }
  return out;
}

/** The pattern tool the visitor already has, judged from their own tool answer. */
export function ownedTool(pattern: Pattern, visitorTool: string | undefined): CatalogTool | undefined {
  const said = (visitorTool ?? "").toLowerCase();
  if (!said.trim()) return undefined;
  const words = said.split(/[^a-z0-9.]+/).filter(Boolean);
  return pattern.tools.find((t) => (t.ownedIf ?? []).some((w) => words.includes(w.toLowerCase()) || said.includes(w.toLowerCase()) && w.length > 3));
}
