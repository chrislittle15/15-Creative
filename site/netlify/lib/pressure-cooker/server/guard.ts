// The daily spend cap.
//
// Before each model call the worst case it could cost is reserved against the day's total;
// afterwards the reservation is replaced by what it actually cost. A call that could push
// the day over the cap is never sent. Read-then-write, so two simultaneous requests can
// overshoot by one call's worth — acceptable: the cap bounds spend, it is not a ledger.

import { priceOf } from "./config.ts";
import type { KV } from "./store.ts";

type Spend = { usd: number };

const dayKey = (now: number) => `spend/${new Date(now).toISOString().slice(0, 10)}`;

export async function spentToday(kv: KV, now: number): Promise<number> {
  return (await kv.get<Spend>(dayKey(now)))?.usd ?? 0;
}

export async function reserve(kv: KV, usd: number, capUsd: number, now: number): Promise<boolean> {
  const spent = await spentToday(kv, now);
  if (spent + usd > capUsd) return false;
  await kv.set(dayKey(now), { usd: spent + usd });
  return true;
}

export async function settle(kv: KV, reserved: number, actual: number, now: number): Promise<void> {
  const spent = await spentToday(kv, now);
  await kv.set(dayKey(now), { usd: Math.max(0, spent - reserved + actual) });
}

export type Usage = {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
};

export function costOf(usage: Usage | undefined, model: string): number {
  const p = priceOf(model);
  const u = usage ?? {};
  return (
    ((u.input_tokens ?? 0) / 1e6) * p.input +
    ((u.output_tokens ?? 0) / 1e6) * p.output +
    ((u.cache_creation_input_tokens ?? 0) / 1e6) * p.cacheWrite +
    ((u.cache_read_input_tokens ?? 0) / 1e6) * p.cacheRead
  );
}

/**
 * The most a call can cost: every input token plus every output token it is allowed.
 * Input is estimated from characters at a deliberately pessimistic two per token.
 */
export function worstCase(model: string, promptChars: number, maxTokens: number): number {
  const p = priceOf(model);
  return (Math.ceil(promptChars / 2) / 1e6) * p.input + (maxTokens / 1e6) * p.output;
}
