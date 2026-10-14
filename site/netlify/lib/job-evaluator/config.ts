// Limits that bound what a visitor can spend. All server-side; the browser never sets them.

export const LIMITS = {
  minChars: 80,
  postingMax: 20_000,
  profileMax: 20_000,
  bodyMax: 120_000,
  dailyRunsDefault: 10,
  failedAttemptsPerHour: 5,
  failedAttemptDelayMs: 500,
  runRetentionMs: 24 * 60 * 60 * 1000,
  signatureTtlMs: 2 * 60 * 1000,
} as const;

export const DEFAULT_MODEL = "claude-opus-5";

// Per-million-token prices. Copied from usage_tracker.py in the job-evaluator repo.
// A model without an entry here reports tokens only, never a guessed cost.
export const PRICING: Record<string, { input: number; output: number; cacheWrite: number; cacheRead: number }> = {
  "claude-opus-5": { input: 5.0, output: 25.0, cacheWrite: 6.25, cacheRead: 0.5 },
};

export type Env = {
  apiKey: string | undefined;
  password: string | undefined;
  model: string;
  dailyLimit: number;
};

export function readEnv(source: Record<string, string | undefined> = process.env): Env {
  const parsed = Number.parseInt(source.JOB_EVALUATOR_DAILY_LIMIT ?? "", 10);
  return {
    apiKey: source.ANTHROPIC_API_KEY || undefined,
    password: source.JOB_EVALUATOR_PASSWORD || undefined,
    model: source.JOB_EVALUATOR_MODEL || DEFAULT_MODEL,
    dailyLimit: Number.isFinite(parsed) && parsed > 0 ? parsed : LIMITS.dailyRunsDefault,
  };
}
