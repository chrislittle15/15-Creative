// Wiring for Netlify Functions: real model client, Netlify Blobs counter store, JSON responses.

import { getStore } from "@netlify/blobs";
import config from "../generated/config.json";
import type { Settings } from "../core/settings";
import type { Pattern } from "../core/types";
import { anthropicClient } from "./claude";
import { fakeModel } from "./fake";
import { BadRequest, type Deps } from "./handlers";
import { CapError, capsFrom, Ledger, type KV } from "./ledger";

function blobKV(): KV {
  const store = getStore({ name: "ef-usage", consistency: "strong" });
  return {
    get: (key) => store.get(key, { type: "json" }),
    set: async (key, value) => { await store.setJSON(key, value); },
    list: async (prefix) => (await store.list({ prefix })).blobs.map((b) => b.key),
  };
}

export function deps(): Deps {
  const settings = config.settings as unknown as Settings;
  const results = (config.linkStatus.results ?? {}) as Record<string, { ok: boolean }>;
  return {
    // Development only: canned model when explicitly asked for and no key is present.
    client: process.env.EF_FAKE_MODEL === "1" && !process.env.ANTHROPIC_API_KEY ? fakeModel() : anthropicClient(),
    ledger: new Ledger(blobKV(), settings, capsFrom(settings, process.env)),
    settings,
    catalog: config.catalog as unknown as Pattern[],
    linkOk: new Map(Object.entries(results).map(([u, r]) => [u, r.ok])),
    today: () => new Date(),
    log: (line) => console.log(line),
  };
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

/** Runs a POST handler with size limits and error mapping. Errors never echo request content. */
export async function handlePost(req: Request, fn: (body: unknown, d: Deps) => Promise<unknown>): Promise<Response> {
  if (req.method !== "POST") return json(405, { error: "POST only" });
  const text = await req.text();
  if (text.length > 100_000) return json(413, { error: "Request too large" });
  let body: unknown;
  try { body = JSON.parse(text); } catch { return json(400, { error: "Bad JSON" }); }
  try {
    return json(200, await fn(body, deps()));
  } catch (e) {
    if (e instanceof CapError) return json(429, { error: e.message, code: e.code });
    if (e instanceof BadRequest) return json(400, { error: e.message });
    console.log(`[ef] error ${(e as Error)?.constructor?.name ?? "Error"}`);
    return json(502, { error: "The AI service did not respond as expected. Please try again." });
  }
}

export { json };
