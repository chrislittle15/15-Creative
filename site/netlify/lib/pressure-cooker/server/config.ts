// Limits and prices for the AI steps. All server-side; the browser never sets them.

// SPEC section 8: lowest-cost model for mapping, mid tier for picks and the agent.
export const MODELS = {
  mapping: "claude-haiku-5-5",
  picks: "claude-sonnet-5-5",
  agent: "claude-sonnet-5-5",
} as const;

// Per-million-token prices, from the Anthropic docs (October 2026).
export const PRICING: Record<string, { input: number; output: number; cacheWrite: number; cacheRead: number }> = {
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheWrite: 0.125, cacheRead: 0.01 },
  "claude-sonnet-5-5": { input: 2.0, output: 10.0, cacheWrite: 2.5, cacheRead: 0.2 },
};

// A model missing from the table is priced as the most expensive one we know, so a typo
// can make the cap trip early but never late.
export function priceOf(model: string) {
  const known = PRICING[model];
  if (known) return known;
  return Object.values(PRICING).reduce((a, b) => (b.output > a.output ? b : a));
}

export const DEFAULT_CAPS = {
  /** Total AI spend across every visitor, per UTC day. */
  dailyUsd: 3,
  /** One run of search further. */
  searchUsd: 0.1,
} as const;

export const AGENT_LIMITS = {
  maxSteps: 6,
  maxFetches: 12,
  timeMs: 30_000,
  /** Recipes it may hand back. */
  maxResults: 3,
} as const;

export const INPUT_LIMITS = {
  bodyMax: 20_000,
  itemsMax: 20,
  itemChars: 60,
  mapBatch: 10,
  shortlistMax: 8,
} as const;

export type Env = {
  apiKey: string | undefined;
  dailyUsd: number;
  searchUsd: number;
};

function money(raw: string | undefined, fallback: number): number {
  const n = Number.parseFloat(raw ?? "");
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

// The caps can be lowered from the host's settings without a deploy; the acceptance test
// sets them to $0.01 this way.
export function readEnv(source: Record<string, string | undefined> = process.env): Env {
  return {
    apiKey: source.ANTHROPIC_API_KEY || undefined,
    dailyUsd: money(source.PRESSURE_COOKER_DAILY_CAP_USD, DEFAULT_CAPS.dailyUsd),
    searchUsd: money(source.PRESSURE_COOKER_SEARCH_CAP_USD, DEFAULT_CAPS.searchUsd),
  };
}
