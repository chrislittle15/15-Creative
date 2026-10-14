import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { passwordMatches, signRun, verifyRunSignature } from "./auth.ts";
import { readEnv, type Env } from "./config.ts";
import { handleRun, handleStart, handleStatus, type Deps } from "./handlers.ts";
import { isThrottled, recordFailure, remainingToday, takeRun } from "./guard.ts";
import { costOf, type Model, type Usage } from "./model.ts";
import { parseMatchScore, parseMetadata, parseVerdict } from "./parse.ts";
import { evaluatePosting } from "./pipeline.ts";
import { claimRun, createRun, purgeOldRuns } from "./runs.ts";
import { memoryKV } from "./store.ts";

const POSTING = "Operations Manager at Example Co. ".repeat(6);
const PROFILE = "Ten years running operations for small teams. ".repeat(4);
const ID = "11111111-2222-4333-8444-555555555555";
const MEMO = "# Evaluation Memo\n\n## Verdict\n**Verdict:** BUILD\nWorth a call.\n\n**Match Score:** 7/10\n\n**Comp Summary:** $120K-$140K est.\n**Why It Fits:** Ran ops for small teams.\n**Evaluation Summary:** Solid fit.";

function fakeModel(): Model & { calls: Array<{ kind: string; system: string; user: string }> } {
  const calls: Array<{ kind: string; system: string; user: string }> = [];
  const usage: Usage = { inputTokens: 0, outputTokens: 0, cacheWriteTokens: 0, cacheReadTokens: 0, webSearches: 0, calls: 0 };
  const reply = (kind: string, user: string) => {
    usage.inputTokens += 1000;
    usage.outputTokens += 100;
    if (kind === "search") usage.webSearches += 2;
    if (user === POSTING) return "COMPANY: Example Co\nROLE: Operations Manager";
    return kind === "plain" && user.includes("COMPANY RESEARCH") ? MEMO : `${kind} output`;
  };
  return {
    name: "claude-opus-5",
    calls,
    usage: () => ({ ...usage }),
    async plain(system, user) {
      calls.push({ kind: "plain", system, user });
      return reply("plain", user);
    },
    async search(system, user) {
      calls.push({ kind: "search", system, user });
      return reply("search", user);
    },
  };
}

function makeDeps(overrides: Partial<Deps> = {}, envOverrides: Partial<Env> = {}) {
  let clock = Date.UTC(2026, 9, 13, 15, 0, 0);
  const pending: Promise<unknown>[] = [];
  const model = fakeModel();
  const deps: Deps = {
    env: { apiKey: "sk-test", password: "open-sesame", model: "claude-opus-5", dailyLimit: 2, ...envOverrides },
    kv: memoryKV(),
    now: () => clock,
    newId: () => ID,
    sleep: async () => {},
    makeModel: () => model,
    dispatch: async (origin, body, headers) => {
      assert.match(origin, /^https?:\/\//);
      // Stand in for Netlify's background runtime: run the handler after replying.
      pending.push(handleRun(new Request(`${origin}/bg`, { method: "POST", headers, body }), deps));
      return { ok: true, status: 202 };
    },
    ...overrides,
  };
  return { deps, model, settle: () => Promise.all(pending), advance: (ms: number) => (clock += ms) };
}

const startReq = (body: unknown) =>
  new Request("https://15creative.com/job-evaluator/api/start", { method: "POST", body: JSON.stringify(body) });
const statusReq = (id: string, password?: string) =>
  new Request(`https://15creative.com/job-evaluator/api/status?id=${id}`, { headers: password ? { "x-demo-password": password } : {} });

describe("password and signatures", () => {
  it("accepts only the exact password", () => {
    assert.equal(passwordMatches("open-sesame", "open-sesame"), true);
    assert.equal(passwordMatches("open-sesame ", "open-sesame"), false);
    assert.equal(passwordMatches("OPEN-SESAME", "open-sesame"), false);
    assert.equal(passwordMatches("", "open-sesame"), false);
    assert.equal(passwordMatches(undefined, "open-sesame"), false);
    assert.equal(passwordMatches(1234, "open-sesame"), false);
  });

  it("never matches when no password is configured", () => {
    assert.equal(passwordMatches("", undefined), false);
    assert.equal(passwordMatches("anything", ""), false);
  });

  it("verifies a run signature and rejects tampering, expiry and a wrong secret", () => {
    const now = 1_000_000;
    const sig = signRun(ID, now + 60_000, "secret");
    assert.equal(verifyRunSignature(ID, now + 60_000, sig, "secret", now), true);
    assert.equal(verifyRunSignature(ID.replace("1", "2"), now + 60_000, sig, "secret", now), false);
    assert.equal(verifyRunSignature(ID, now + 61_000, sig, "secret", now), false);
    assert.equal(verifyRunSignature(ID, now + 60_000, sig, "other", now), false);
    assert.equal(verifyRunSignature(ID, now - 1, signRun(ID, now - 1, "secret"), "secret", now), false);
    assert.equal(verifyRunSignature(ID, now + 60_000, "abcd", "secret", now), false);
  });
});

describe("guards", () => {
  it("caps runs per UTC day and resets the next day", async () => {
    const kv = memoryKV();
    const day1 = Date.UTC(2026, 9, 13, 12);
    assert.deepEqual(await takeRun(kv, 2, day1), { ok: true, remaining: 1 });
    assert.deepEqual(await takeRun(kv, 2, day1), { ok: true, remaining: 0 });
    assert.deepEqual(await takeRun(kv, 2, day1), { ok: false, remaining: 0 });
    assert.equal(await remainingToday(kv, 2, day1), 0);
    assert.equal(await remainingToday(kv, 2, day1 + 24 * 3600 * 1000), 2);
  });

  it("throttles an address after five wrong attempts in an hour, then clears", async () => {
    const kv = memoryKV();
    const t = Date.UTC(2026, 9, 13, 12, 10);
    for (let i = 0; i < 4; i++) await recordFailure(kv, "abc", t);
    assert.equal(await isThrottled(kv, "abc", t), false);
    await recordFailure(kv, "abc", t);
    assert.equal(await isThrottled(kv, "abc", t), true);
    assert.equal(await isThrottled(kv, "other", t), false);
    assert.equal(await isThrottled(kv, "abc", t + 3600 * 1000), false);
  });

  it("lets a run be claimed exactly once and purges old runs", async () => {
    const kv = memoryKV();
    await createRun(kv, ID, 1000);
    assert.equal(await claimRun(kv, ID, 1001), true);
    assert.equal(await claimRun(kv, ID, 1002), false);
    assert.equal(await claimRun(kv, "missing", 1002), false);
    await purgeOldRuns(kv, 1000 + 25 * 3600 * 1000);
    assert.deepEqual(Object.keys(kv.dump()), []);
  });
});

describe("parsing and cost", () => {
  it("reads score, verdict and metadata from model text", () => {
    assert.equal(parseMatchScore(MEMO), 7);
    assert.equal(parseVerdict(MEMO), "BUILD");
    assert.equal(parseMatchScore("no score here"), null);
    assert.equal(parseVerdict("**Verdict:** MAYBE"), null);
    assert.deepEqual(parseMetadata("COMPANY: Acme\nROLE: Chief of Staff"), { company: "Acme", roleTitle: "Chief of Staff" });
    assert.deepEqual(parseMetadata("garbage"), { company: "Unknown Company", roleTitle: "Unknown Role" });
  });

  it("prices Opus tokens and refuses to guess for unknown models", () => {
    const u: Usage = { inputTokens: 1_000_000, outputTokens: 1_000_000, cacheWriteTokens: 0, cacheReadTokens: 0, webSearches: 0, calls: 2 };
    assert.equal(costOf(u, "claude-opus-5"), 30);
    assert.equal(costOf(u, "some-new-model"), null);
  });

  it("reads limits from the environment with safe defaults", () => {
    assert.equal(readEnv({ JOB_EVALUATOR_DAILY_LIMIT: "25" }).dailyLimit, 25);
    assert.equal(readEnv({ JOB_EVALUATOR_DAILY_LIMIT: "-3" }).dailyLimit, 10);
    assert.equal(readEnv({ JOB_EVALUATOR_DAILY_LIMIT: "lots" }).dailyLimit, 10);
    assert.equal(readEnv({}).model, "claude-opus-5");
  });
});

describe("pipeline", () => {
  it("runs the four stages in order and passes each output to the next", async () => {
    const model = fakeModel();
    const stages: number[] = [];
    const result = await evaluatePosting(model, POSTING, PROFILE, (stage) => void stages.push(stage));

    assert.deepEqual(stages, [0, 1, 2, 3, 4]);
    assert.deepEqual(model.calls.map((c) => c.kind), ["plain", "search", "plain", "search", "plain"]);
    assert.match(model.calls[1].user, /Company: Example Co\nRole being considered: Operations Manager/);
    assert.match(model.calls[2].user, /CANDIDATE PROFILE:/);
    assert.match(model.calls[3].user, /CANDIDATE'S STANDARDS/);
    assert.match(model.calls[4].user, /COMPANY RESEARCH:\n---\nsearch output/);
    assert.match(model.calls[4].user, /FIT ANALYSIS:\n---\nplain output/);
    assert.equal(result.matchScore, 7);
    assert.equal(result.verdict, "BUILD");
    assert.equal(result.compSummary, "$120K-$140K est.");
    assert.equal(result.webSearches, 4);
    assert.equal(result.cost, (5000 / 1e6) * 5 + (500 / 1e6) * 25);
  });
});

describe("start, run and status", () => {
  it("rejects a wrong password, then locks the address out", async () => {
    const { deps } = makeDeps();
    for (let i = 0; i < 5; i++) {
      const res = await handleStart(startReq({ password: "nope", check: true }), "9.9.9.9", deps);
      assert.equal(res.status, 401);
    }
    const locked = await handleStart(startReq({ password: "open-sesame", check: true }), "9.9.9.9", deps);
    assert.equal(locked.status, 429);
    const elsewhere = await handleStart(startReq({ password: "open-sesame", check: true }), "8.8.8.8", deps);
    assert.equal(elsewhere.status, 200);
  });

  it("fails closed when the password or key is not configured", async () => {
    const noPassword = makeDeps({}, { password: undefined });
    assert.equal((await handleStart(startReq({ password: "", check: true }), "1.1.1.1", noPassword.deps)).status, 503);
    const noKey = makeDeps({}, { apiKey: undefined });
    assert.equal((await handleStart(startReq({ password: "open-sesame", check: true }), "1.1.1.1", noKey.deps)).status, 503);
  });

  it("validates inputs without spending a run", async () => {
    const { deps } = makeDeps();
    const send = (body: object) => handleStart(startReq({ password: "open-sesame", ...body }), "1.1.1.1", deps);
    assert.equal((await send({ posting: "short", profile: PROFILE })).status, 400);
    assert.equal((await send({ posting: POSTING, profile: "short" })).status, 400);
    assert.equal((await send({ posting: POSTING })).status, 400);
    assert.equal((await send({ posting: "x".repeat(20_001), profile: PROFILE })).status, 400);
    assert.equal((await handleStart(new Request("https://x.test/", { method: "POST", body: "not json" }), "1.1.1.1", deps)).status, 400);
    assert.equal((await handleStart(new Request("https://x.test/", { method: "GET" }), "1.1.1.1", deps)).status, 405);
    assert.equal((await handleStart(startReq({ password: "open-sesame", check: true }), "1.1.1.1", deps).then((r) => r.json())).remainingToday, 2);
  });

  it("runs a full evaluation and serves progress then the result", async () => {
    const { deps, settle } = makeDeps();
    const started = await handleStart(startReq({ password: "open-sesame", posting: POSTING, profile: PROFILE }), "1.1.1.1", deps);
    assert.equal(started.status, 202);
    assert.deepEqual(await started.json(), { id: ID, remainingToday: 1 });

    await settle();
    assert.equal((await handleStatus(statusReq(ID), "1.1.1.1", deps)).status, 401);
    const done = await handleStatus(statusReq(ID, "open-sesame"), "1.1.1.1", deps);
    assert.equal(done.status, 200);
    const body = await done.json();
    assert.equal(body.status, "done");
    assert.equal(body.result.verdict, "BUILD");
    assert.equal(body.result.company, "Example Co");
  });

  it("enforces the daily limit and refunds a run that never dispatched", async () => {
    const { deps, settle } = makeDeps();
    const run = () => handleStart(startReq({ password: "open-sesame", posting: POSTING, profile: PROFILE }), "1.1.1.1", deps);
    assert.equal((await run()).status, 202);
    assert.equal((await run()).status, 202);
    const third = await run();
    assert.equal(third.status, 429);
    assert.match((await third.json()).error, /limit of 2/);
    await settle();

    const broken = makeDeps({ dispatch: async () => ({ ok: false, status: 500 }) });
    assert.equal((await handleStart(startReq({ password: "open-sesame", posting: POSTING, profile: PROFILE }), "1.1.1.1", broken.deps)).status, 502);
    assert.equal(await remainingToday(broken.deps.kv, 2, broken.deps.now()), 2);
  });

  it("refuses a background call without a valid signature and runs a run only once", async () => {
    const { deps, settle } = makeDeps();
    await createRun(deps.kv, ID, deps.now());
    const body = JSON.stringify({ id: ID, posting: POSTING, profile: PROFILE });
    const call = (headers: Record<string, string>) => handleRun(new Request("https://x.test/bg", { method: "POST", headers, body }), deps);

    assert.equal((await call({})).status, 403);
    assert.equal((await call({ "x-run-exp": String(deps.now() + 1000), "x-run-signature": "00" })).status, 403);

    const exp = deps.now() + 60_000;
    const good = { "x-run-exp": String(exp), "x-run-signature": signRun(ID, exp, "sk-test") };
    assert.equal((await call(good)).status, 200);
    assert.equal((await call(good)).status, 409);
    await settle();
  });

  it("reports a friendly error when the model call fails", async () => {
    const failing = makeDeps({
      makeModel: () => ({
        name: "claude-opus-5",
        usage: () => ({ inputTokens: 0, outputTokens: 0, cacheWriteTokens: 0, cacheReadTokens: 0, webSearches: 0, calls: 0 }),
        plain: async () => {
          throw Object.assign(new Error("Your credit balance is too low"), { status: 400 });
        },
        search: async () => "",
      }),
    });
    const started = await handleStart(startReq({ password: "open-sesame", posting: POSTING, profile: PROFILE }), "1.1.1.1", failing.deps);
    assert.equal(started.status, 202);
    await failing.settle();
    const body = await (await handleStatus(statusReq(ID, "open-sesame"), "1.1.1.1", failing.deps)).json();
    assert.equal(body.status, "error");
    assert.match(body.error, /out of API credits/);
    assert.doesNotMatch(JSON.stringify(body), /credit balance is too low/);
  });

  it("stops serving a memo after the retention window", async () => {
    const { deps, settle, advance } = makeDeps();
    await handleStart(startReq({ password: "open-sesame", posting: POSTING, profile: PROFILE }), "1.1.1.1", deps);
    await settle();
    assert.equal((await handleStatus(statusReq(ID, "open-sesame"), "1.1.1.1", deps)).status, 200);
    advance(25 * 3600 * 1000);
    assert.equal((await handleStatus(statusReq(ID, "open-sesame"), "1.1.1.1", deps)).status, 404);
    assert.equal(await deps.kv.get(`run/${ID}`), null);
  });

  it("rejects malformed run ids and unknown runs", async () => {
    const { deps } = makeDeps();
    assert.equal((await handleStatus(statusReq("../etc/passwd", "open-sesame"), "1.1.1.1", deps)).status, 400);
    assert.equal((await handleStatus(statusReq(ID, "open-sesame"), "1.1.1.1", deps)).status, 404);
  });
});
