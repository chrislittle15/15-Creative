// Thin wrapper around the Anthropic SDK, ported from the job pipeline's claude_client.py.
// Every call goes through `call`, which checks the caps first and records real token usage
// after, so the usage page and the caps always agree with what the API reported.

import Anthropic from "@anthropic-ai/sdk";
import type { Ledger } from "./ledger";

/** The one SDK method this app uses. Tests pass a fake with the same shape. */
export interface ModelClient {
  create(params: Anthropic.MessageCreateParamsNonStreaming): Promise<Anthropic.Message>;
}

export function anthropicClient(): ModelClient {
  const client = new Anthropic({ maxRetries: 2, timeout: 60_000 });
  return { create: (params) => client.messages.create(params) };
}

export async function call(
  client: ModelClient,
  ledger: Ledger,
  interviewId: string,
  params: Anthropic.MessageCreateParamsNonStreaming,
): Promise<Anthropic.Message> {
  await ledger.assertCanCall(interviewId);
  const response = await client.create(params);
  await ledger.record(interviewId, params.model, response.usage);
  if (response.stop_reason === "refusal") throw new Error("The model declined this request.");
  return response;
}

export function textOf(response: Anthropic.Message): string {
  return response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n").trim();
}

/** A request whose reply is JSON matching `schema` (structured outputs). */
export async function callJson<T>(
  client: ModelClient,
  ledger: Ledger,
  interviewId: string,
  opts: { model: string; system: string; user: string; schema: Record<string, unknown>; maxTokens: number; effort: "low" | "medium" | "high" },
): Promise<T> {
  const response = await call(client, ledger, interviewId, {
    model: opts.model,
    max_tokens: opts.maxTokens,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
    output_config: { effort: opts.effort, format: { type: "json_schema", schema: opts.schema } },
  } as Anthropic.MessageCreateParamsNonStreaming);
  return JSON.parse(textOf(response)) as T;
}
