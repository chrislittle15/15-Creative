import { LIMITS } from "./config.ts";
import type { KV } from "./store.ts";

export type RunResult = {
  company: string;
  roleTitle: string;
  matchScore: number | null;
  verdict: "BUILD" | "PASS" | null;
  compSummary: string | null;
  whyItFits: string | null;
  evaluationSummary: string | null;
  memo: string;
  research: string;
  fit: string;
  compensation: string;
  model: string;
  tokens: number;
  webSearches: number;
  cost: number | null;
};

export type RunRecord = {
  id: string;
  status: "queued" | "running" | "done" | "error";
  stage: number;
  message: string;
  createdAt: number;
  updatedAt: number;
  result?: RunResult;
  error?: string;
};

export const RUN_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const key = (id: string) => `run/${id}`;

export async function createRun(kv: KV, id: string, now: number): Promise<RunRecord> {
  const run: RunRecord = { id, status: "queued", stage: 0, message: "Queued...", createdAt: now, updatedAt: now };
  await kv.set(key(id), run);
  return run;
}

export const getRun = (kv: KV, id: string) => kv.get<RunRecord>(key(id));

export async function updateRun(kv: KV, id: string, patch: Partial<RunRecord>, now: number): Promise<void> {
  const current = await getRun(kv, id);
  if (!current) return;
  await kv.set(key(id), { ...current, ...patch, updatedAt: now });
}

// A run may start only once, so a replayed background request cannot spend twice.
export async function claimRun(kv: KV, id: string, now: number): Promise<boolean> {
  const current = await getRun(kv, id);
  if (!current || current.status !== "queued") return false;
  await kv.set(key(id), { ...current, status: "running", message: "Starting...", updatedAt: now });
  return true;
}

export async function purgeOldRuns(kv: KV, now: number): Promise<void> {
  for (const k of await kv.list("run/")) {
    const run = await kv.get<RunRecord>(k);
    if (!run || now - run.createdAt > LIMITS.runRetentionMs) await kv.delete(k);
  }
}
