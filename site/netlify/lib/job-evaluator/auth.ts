import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Hash both sides first so the comparison is constant-time regardless of length.
export function passwordMatches(input: unknown, expected: string | undefined): boolean {
  if (!expected || typeof input !== "string") return false;
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

// The start function calls the background function over HTTP, and that URL is public.
// This signature proves a request came from the start function, using the API key as the
// HMAC secret so no extra environment variable is needed.
export function signRun(runId: string, exp: number, secret: string): string {
  return createHmac("sha256", secret).update(`${runId}.${exp}`).digest("hex");
}

export function verifyRunSignature(runId: string, exp: number, signature: string, secret: string, now: number): boolean {
  if (!Number.isFinite(exp) || exp < now) return false;
  const expected = Buffer.from(signRun(runId, exp, secret), "hex");
  const given = Buffer.from(signature, "hex");
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function hashIp(ip: string | undefined): string {
  return createHash("sha256")
    .update(ip || "unknown")
    .digest("hex")
    .slice(0, 16);
}
