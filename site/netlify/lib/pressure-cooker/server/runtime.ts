// Production wiring: Netlify Blobs for storage, the Anthropic SDK for the model, global
// fetch for TheMealDB. The API key is read here, on the server, and nowhere else.

import Anthropic from "@anthropic-ai/sdk";
import { getStore } from "@netlify/blobs";
import { readEnv } from "./config.ts";
import type { Deps } from "./handlers.ts";
import type { KV } from "./store.ts";

function blobsKV(): KV {
  const store = getStore({ name: "pressure-cooker", consistency: "strong" });
  return {
    get: async <T>(key: string) => (await store.get(key, { type: "json" })) as T | null,
    set: async (key, value) => {
      await store.setJSON(key, value);
    },
    list: async (prefix) => (await store.list({ prefix })).blobs.map((b) => b.key),
  };
}

export function liveDeps(): Deps {
  const env = readEnv();
  // Each call is bounded well inside the function's own time limit.
  const client = env.apiKey ? new Anthropic({ apiKey: env.apiKey, timeout: 20_000, maxRetries: 1 }) : null;
  return {
    env,
    kv: blobsKV(),
    now: () => Date.now(),
    call: client ? (params) => client.messages.create(params) : null,
    fetcher: (url) => fetch(url, { headers: { "user-agent": "PressureCooker/2.0 (15creative.com demo)" }, signal: AbortSignal.timeout(8_000) }),
  };
}
