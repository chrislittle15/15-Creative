// Usage counters and cost caps. A TypeScript port of the job pipeline's UsageTracker,
// extended to keep its totals in a small key-value store instead of a local JSON file.
//
// What is stored: token counts, dollar cost, question and refusal counts, keyed by UTC day
// and by a random interview ID. No answer text, no titles, no IP addresses, nothing about
// who the visitor is.

import type { Settings } from "../core/settings";

export interface KV {
  get(key: string): Promise<unknown | null>;
  set(key: string, value: unknown): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

export class MemoryKV implements KV {
  data = new Map<string, unknown>();
  async get(key: string) { return structuredClone(this.data.get(key) ?? null); }
  async set(key: string, value: unknown) { this.data.set(key, structuredClone(value)); }
  async list(prefix: string) { return [...this.data.keys()].filter((k) => k.startsWith(prefix)); }
}

/** The usage block every Messages API response carries. */
export interface ApiUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

export interface Totals {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
  cost: number;
}

export interface DayRecord extends Totals {
  interviewsStarted: number;
  interviewsCompleted: number;
  questionsAsked: number;
  finishRefused: number;
  capStops: number;
}

export interface InterviewRecord extends Totals {
  day: string;
  questions: number;
  finishRefused: number;
  completed: boolean;
}

const emptyTotals = (): Totals => ({ calls: 0, inputTokens: 0, outputTokens: 0, cacheWriteTokens: 0, cacheReadTokens: 0, cost: 0 });
const emptyDay = (): DayRecord => ({ ...emptyTotals(), interviewsStarted: 0, interviewsCompleted: 0, questionsAsked: 0, finishRefused: 0, capStops: 0 });

export function costOf(model: string, u: ApiUsage, s: Settings): number {
  const p = s.prices_per_mtok[model];
  if (!p) throw new Error(`No price for model ${model} in settings`);
  return (
    (u.input_tokens * p.input +
      u.output_tokens * p.output +
      (u.cache_creation_input_tokens ?? 0) * p.cache_write +
      (u.cache_read_input_tokens ?? 0) * p.cache_read) / 1_000_000
  );
}

function addUsage(t: Totals, model: string, u: ApiUsage, s: Settings) {
  t.calls += 1;
  t.inputTokens += u.input_tokens;
  t.outputTokens += u.output_tokens;
  t.cacheWriteTokens += u.cache_creation_input_tokens ?? 0;
  t.cacheReadTokens += u.cache_read_input_tokens ?? 0;
  t.cost += costOf(model, u, s);
}

export type CapCode = "daily_cap" | "interview_cap" | "unknown_interview";

export class CapError extends Error {
  constructor(public code: CapCode, message: string) { super(message); }
}

export interface Caps { perInterviewUsd: number; perDayUsd: number }

export function capsFrom(s: Settings, env: Record<string, string | undefined> = {}): Caps {
  const num = (v: string | undefined, d: number) => (v && !Number.isNaN(Number(v)) ? Number(v) : d);
  return {
    perInterviewUsd: num(env.EF_CAP_PER_INTERVIEW_USD, s.caps.per_interview_usd),
    perDayUsd: num(env.EF_CAP_PER_DAY_USD, s.caps.per_day_usd),
  };
}

export const utcDay = (d = new Date()) => d.toISOString().slice(0, 10);

export class Ledger {
  constructor(private kv: KV, private s: Settings, public caps: Caps, private now: () => Date = () => new Date()) {}

  private dayKey(day = utcDay(this.now())) { return `day/${day}`; }
  private ivKey(id: string) { return `interview/${id}`; }

  async day(day = utcDay(this.now())): Promise<DayRecord> {
    return { ...emptyDay(), ...((await this.kv.get(this.dayKey(day))) as DayRecord | null ?? {}) };
  }

  async interview(id: string): Promise<InterviewRecord | null> {
    if (!/^[a-f0-9-]{36}$/.test(id)) return null;
    return (await this.kv.get(this.ivKey(id))) as InterviewRecord | null;
  }

  async startInterview(): Promise<string> {
    const day = await this.day();
    if (day.cost >= this.caps.perDayUsd) throw new CapError("daily_cap", "Today's demo budget is used up.");
    const id = crypto.randomUUID();
    await this.kv.set(this.ivKey(id), { ...emptyTotals(), day: utcDay(this.now()), questions: 0, finishRefused: 0, completed: false } satisfies InterviewRecord);
    day.interviewsStarted += 1;
    await this.kv.set(this.dayKey(), day);
    return id;
  }

  /** Throws CapError when the interview or the day has hit its cap. Call before every model call. */
  async assertCanCall(id: string): Promise<InterviewRecord> {
    const iv = await this.interview(id);
    if (!iv) throw new CapError("unknown_interview", "This interview has expired. Please start again.");
    const day = await this.day();
    if (day.cost >= this.caps.perDayUsd) {
      await this.bump("capStops");
      throw new CapError("daily_cap", "Today's demo budget is used up.");
    }
    if (iv.cost >= this.caps.perInterviewUsd) {
      await this.bump("capStops");
      throw new CapError("interview_cap", "This interview reached its cost limit.");
    }
    return iv;
  }

  async record(id: string, model: string, usage: ApiUsage): Promise<void> {
    const iv = await this.interview(id);
    if (iv) { addUsage(iv, model, usage, this.s); await this.kv.set(this.ivKey(id), iv); }
    const day = await this.day();
    addUsage(day, model, usage, this.s);
    await this.kv.set(this.dayKey(), day);
  }

  async updateInterview(id: string, change: (iv: InterviewRecord) => void): Promise<void> {
    const iv = await this.interview(id);
    if (!iv) return;
    change(iv);
    await this.kv.set(this.ivKey(id), iv);
  }

  async bump(field: "interviewsCompleted" | "questionsAsked" | "finishRefused" | "capStops"): Promise<void> {
    const day = await this.day();
    day[field] += 1;
    await this.kv.set(this.dayKey(), day);
  }

  async recentDays(n = 30): Promise<(DayRecord & { day: string })[]> {
    const keys = (await this.kv.list("day/")).sort().slice(-n);
    const out = [];
    for (const k of keys) out.push({ day: k.slice(4), ...(await this.day(k.slice(4))) });
    return out;
  }
}
