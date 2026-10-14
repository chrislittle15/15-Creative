import { hashIp, passwordMatches, signRun, verifyRunSignature } from "./auth.ts";
import { LIMITS, type Env } from "./config.ts";
import { isThrottled, recordFailure, refundRun, remainingToday, takeRun } from "./guard.ts";
import type { Model } from "./model.ts";
import { evaluatePosting } from "./pipeline.ts";
import { RUN_ID_RE, claimRun, createRun, getRun, purgeOldRuns, updateRun } from "./runs.ts";
import type { KV } from "./store.ts";

export type Deps = {
  env: Env;
  kv: KV;
  now: () => number;
  newId: () => string;
  sleep: (ms: number) => Promise<void>;
  // Calls the background function (a public URL, so the request is signed).
  dispatch: (origin: string, body: string, headers: Record<string, string>) => Promise<{ ok: boolean; status: number }>;
  makeModel: (env: Env) => Model;
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const notConfigured = (env: Env) => !env.password || !env.apiKey;

// Checks the password, applying the failed-attempt throttle. Returns a Response when the
// request must stop here, or null when the caller is allowed through.
async function authenticate(given: unknown, ip: string | undefined, deps: Deps): Promise<Response | null> {
  const { env, kv, now, sleep } = deps;
  const ipHash = hashIp(ip);
  if (await isThrottled(kv, ipHash, now())) {
    return json(429, { error: "Too many incorrect attempts. Please wait an hour and try again." });
  }
  if (!passwordMatches(given, env.password)) {
    await recordFailure(kv, ipHash, now());
    await sleep(LIMITS.failedAttemptDelayMs);
    return json(401, { error: "That access code isn't right." });
  }
  return null;
}

export async function handleStart(req: Request, ip: string | undefined, deps: Deps): Promise<Response> {
  const { env, kv, now } = deps;
  if (req.method !== "POST") return json(405, { error: "Method not allowed." });
  if (notConfigured(env)) return json(503, { error: "The demo isn't available right now." });

  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > LIMITS.bodyMax) return json(413, { error: "That request is too large." });
  let body: Record<string, unknown>;
  try {
    const text = await req.text();
    if (text.length > LIMITS.bodyMax) return json(413, { error: "That request is too large." });
    body = JSON.parse(text);
  } catch {
    return json(400, { error: "Invalid request." });
  }
  if (!body || typeof body !== "object") return json(400, { error: "Invalid request." });

  const denied = await authenticate(body.password, ip, deps);
  if (denied) return denied;

  if (body.check === true) {
    return json(200, { ok: true, remainingToday: await remainingToday(kv, env.dailyLimit, now()) });
  }

  const { posting, profile } = body;
  if (typeof posting !== "string" || typeof profile !== "string") return json(400, { error: "Add a job posting and a profile." });
  if (posting.trim().length < LIMITS.minChars) return json(400, { error: "The job posting looks too short to evaluate." });
  if (profile.trim().length < LIMITS.minChars) return json(400, { error: "Add a few lines about your background so the fit can be judged." });
  if (posting.length > LIMITS.postingMax) return json(400, { error: `The job posting is over ${LIMITS.postingMax.toLocaleString("en-US")} characters.` });
  if (profile.length > LIMITS.profileMax) return json(400, { error: `The profile is over ${LIMITS.profileMax.toLocaleString("en-US")} characters.` });

  const taken = await takeRun(kv, env.dailyLimit, now());
  if (!taken.ok) {
    return json(429, { error: `The demo has reached today's limit of ${env.dailyLimit} evaluations. It resets daily. Please try again tomorrow, or ask Chris to raise it.` });
  }

  await purgeOldRuns(kv, now()).catch(() => {});
  const id = deps.newId();
  await createRun(kv, id, now());

  const exp = now() + LIMITS.signatureTtlMs;
  const sent = await deps
    .dispatch(new URL(req.url).origin, JSON.stringify({ id, posting, profile }), {
      "content-type": "application/json",
      "x-run-signature": signRun(id, exp, env.apiKey!),
      "x-run-exp": String(exp),
    })
    .catch(() => ({ ok: false, status: 0 }));

  if (!sent.ok) {
    console.error("job-evaluator: background dispatch failed", sent.status);
    await updateRun(kv, id, { status: "error", error: "The demo couldn't start the evaluation. Please try again." }, now());
    await refundRun(kv, now());
    return json(502, { error: "The demo couldn't start the evaluation. Please try again." });
  }
  return json(202, { id, remainingToday: taken.remaining });
}

export async function handleStatus(req: Request, ip: string | undefined, deps: Deps): Promise<Response> {
  const { env, kv } = deps;
  if (req.method !== "GET") return json(405, { error: "Method not allowed." });
  if (notConfigured(env)) return json(503, { error: "The demo isn't available right now." });

  const denied = await authenticate(req.headers.get("x-demo-password"), ip, deps);
  if (denied) return denied;

  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!RUN_ID_RE.test(id)) return json(400, { error: "Invalid run." });
  const run = await getRun(kv, id);
  if (run && deps.now() - run.createdAt > LIMITS.runRetentionMs) {
    await kv.delete(`run/${id}`);
    return json(404, { error: "That evaluation has expired or doesn't exist." });
  }
  if (!run) return json(404, { error: "That evaluation has expired or doesn't exist." });
  const { status, stage, message, result, error } = run;
  return json(200, { status, stage, message, result, error });
}

// Maps an API failure to something a visitor can act on. The real error goes to the logs.
function friendlyError(err: unknown): string {
  const status = (err as { status?: number })?.status;
  const text = String((err as { message?: string })?.message ?? "");
  if (status === 401 || status === 403) return "The demo's AI connection was rejected. Please let Chris know.";
  if (status === 400 && /credit balance/i.test(text)) return "The demo is out of API credits right now. Please let Chris know.";
  if (status === 429) return "The AI service is busy. Please try again in a minute.";
  if (status === 529 || (status && status >= 500)) return "The AI service is having trouble. Please try again shortly.";
  if (/connection|fetch failed|timed? ?out/i.test(text)) return "Couldn't reach the AI service. Please try again.";
  return "Something went wrong while running the evaluation. Please try again.";
}

// The background function body. It runs for up to 15 minutes; Netlify has already
// answered the caller with 202 by the time this does any work.
export async function handleRun(req: Request, deps: Deps): Promise<Response> {
  const { env, kv, now } = deps;
  if (req.method !== "POST" || notConfigured(env)) return json(403, { error: "Forbidden." });

  const exp = Number(req.headers.get("x-run-exp"));
  const signature = req.headers.get("x-run-signature") ?? "";
  let payload: { id?: unknown; posting?: unknown; profile?: unknown };
  try {
    payload = JSON.parse(await req.text());
  } catch {
    return json(400, { error: "Invalid request." });
  }
  const { id, posting, profile } = payload;
  if (typeof id !== "string" || !RUN_ID_RE.test(id) || typeof posting !== "string" || typeof profile !== "string") {
    return json(400, { error: "Invalid request." });
  }
  if (!/^[0-9a-f]+$/i.test(signature) || !verifyRunSignature(id, exp, signature, env.apiKey!, now())) {
    return json(403, { error: "Forbidden." });
  }
  if (posting.length > LIMITS.postingMax || profile.length > LIMITS.profileMax) return json(400, { error: "Invalid request." });
  if (!(await claimRun(kv, id, now()))) return json(409, { error: "Already started." });

  try {
    const result = await evaluatePosting(deps.makeModel(env), posting, profile, async (stage, message) => {
      await updateRun(kv, id, { stage, message }, now());
    });
    await updateRun(kv, id, { status: "done", stage: 5, message: "Done.", result }, now());
  } catch (err) {
    console.error("job-evaluator: run failed", (err as { status?: number })?.status, (err as Error)?.message);
    await updateRun(kv, id, { status: "error", error: friendlyError(err) }, now());
  }
  return json(200, { ok: true });
}
