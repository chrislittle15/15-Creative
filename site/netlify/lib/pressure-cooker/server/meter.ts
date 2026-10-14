// Every model call goes through here. It reserves the call's worst-case cost against the
// day's cap (and, for search further, against that run's cap) before sending, and settles
// the real cost afterwards. A call that could break a cap is never sent.

import type { Message, MessageCreateParamsNonStreaming } from "@anthropic-ai/sdk/resources/messages/messages";
import type { Env } from "./config.ts";
import { costOf, reserve, settle, worstCase } from "./guard.ts";
import type { KV } from "./store.ts";

export type Call = (params: MessageCreateParamsNonStreaming) => Promise<Message>;

export class CapReached extends Error {
  readonly which: "daily" | "search";
  constructor(which: "daily" | "search") {
    super(which === "daily" ? "daily cap reached" : "search cap reached");
    this.which = which;
  }
}

export type Meter = {
  send(params: MessageCreateParamsNonStreaming): Promise<Message>;
  spent(): number;
};

export function meter(call: Call, kv: KV, env: Env, now: () => number, runCapUsd?: number): Meter {
  let spent = 0;
  return {
    spent: () => spent,
    async send(params) {
      const worst = worstCase(params.model, JSON.stringify(params).length, params.max_tokens);
      if (runCapUsd !== undefined && spent + worst > runCapUsd) throw new CapReached("search");
      if (!(await reserve(kv, worst, env.dailyUsd, now()))) throw new CapReached("daily");
      let actual = 0;
      try {
        const res = await call(params);
        actual = costOf(res.usage, params.model);
        return res;
      } finally {
        // A failed request is not billed; a successful one settles at its real cost.
        await settle(kv, worst, actual, now());
        spent += actual;
      }
    },
  };
}

export function textOf(res: Message): string {
  return res.content
    .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

/** Parse a structured-output reply. A refusal, truncation or bad JSON is null, never a guess. */
export function jsonOf<T>(res: Message): T | null {
  if (res.stop_reason !== "end_turn") return null;
  try {
    return JSON.parse(textOf(res)) as T;
  } catch {
    return null;
  }
}
