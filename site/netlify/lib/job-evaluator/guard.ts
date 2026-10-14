import { LIMITS } from "./config.ts";
import type { KV } from "./store.ts";

// Counters are read-then-write, so two simultaneous requests can overshoot a limit by one.
// That is acceptable here: the cap bounds spend, it is not a billing ledger.

type Counter = { count: number };

const dayKey = (now: number) => `cap/${new Date(now).toISOString().slice(0, 10)}`;
const hourKey = (ipHash: string, now: number) => `fail/${new Date(now).toISOString().slice(0, 13)}/${ipHash}`;

async function read(kv: KV, key: string): Promise<number> {
  return (await kv.get<Counter>(key))?.count ?? 0;
}

export async function isThrottled(kv: KV, ipHash: string, now: number): Promise<boolean> {
  return (await read(kv, hourKey(ipHash, now))) >= LIMITS.failedAttemptsPerHour;
}

export async function recordFailure(kv: KV, ipHash: string, now: number): Promise<void> {
  const key = hourKey(ipHash, now);
  await kv.set(key, { count: (await read(kv, key)) + 1 });
}

export async function remainingToday(kv: KV, limit: number, now: number): Promise<number> {
  return Math.max(0, limit - (await read(kv, dayKey(now))));
}

export async function takeRun(kv: KV, limit: number, now: number): Promise<{ ok: boolean; remaining: number }> {
  const key = dayKey(now);
  const used = await read(kv, key);
  if (used >= limit) return { ok: false, remaining: 0 };
  await kv.set(key, { count: used + 1 });
  return { ok: true, remaining: limit - used - 1 };
}

export async function refundRun(kv: KV, now: number): Promise<void> {
  const key = dayKey(now);
  const used = await read(kv, key);
  if (used > 0) await kv.set(key, { count: used - 1 });
}
