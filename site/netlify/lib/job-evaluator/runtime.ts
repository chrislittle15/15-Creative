import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { getStore } from "@netlify/blobs";
import { readEnv } from "./config.ts";
import type { Deps } from "./handlers.ts";
import { createModel } from "./model.ts";
import type { KV } from "./store.ts";

function blobsKV(): KV {
  const store = getStore({ name: "job-evaluator", consistency: "strong" });
  return {
    get: async <T>(key: string) => (await store.get(key, { type: "json" })) as T | null,
    set: async (key, value) => {
      await store.setJSON(key, value);
    },
    delete: async (key) => {
      await store.delete(key);
    },
    list: async (prefix) => (await store.list({ prefix })).blobs.map((b) => b.key),
  };
}

export function liveDeps(): Deps {
  return {
    env: readEnv(),
    kv: blobsKV(),
    now: () => Date.now(),
    newId: () => randomUUID(),
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    dispatch: async (origin, body, headers) => {
      const res = await fetch(`${origin}/.netlify/functions/job-evaluator-run-background`, { method: "POST", headers, body });
      return { ok: res.ok, status: res.status };
    },
    makeModel: (env) => createModel(new Anthropic({ apiKey: env.apiKey, timeout: 5 * 60 * 1000 }), env.model),
  };
}
