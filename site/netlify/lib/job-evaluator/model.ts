import type Anthropic from "@anthropic-ai/sdk";
import { PRICING } from "./config.ts";

export type Effort = "low" | "medium" | "high";

export type Usage = {
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
  webSearches: number;
  calls: number;
};

export interface Model {
  name: string;
  plain(system: string, user: string, opts?: { maxTokens?: number; effort?: Effort }): Promise<string>;
  search(system: string, user: string, opts?: { maxTokens?: number; maxUses?: number; effort?: Effort }): Promise<string>;
  usage(): Usage;
}

export const totalTokens = (u: Usage) => u.inputTokens + u.outputTokens + u.cacheWriteTokens + u.cacheReadTokens;

// Token cost only. Per-search fees are not included, matching usage_tracker.py in the Python app.
export function costOf(u: Usage, modelName: string): number | null {
  const p = PRICING[modelName];
  if (!p) return null;
  return (
    (u.inputTokens / 1e6) * p.input +
    (u.outputTokens / 1e6) * p.output +
    (u.cacheWriteTokens / 1e6) * p.cacheWrite +
    (u.cacheReadTokens / 1e6) * p.cacheRead
  );
}

function extractText(response: { content: Array<{ type: string; text?: string }> }): string {
  return response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("\n")
    .trim();
}

const MAX_PAUSE_RESUMES = 3;

export function createModel(client: Anthropic, name: string): Model {
  const usage: Usage = { inputTokens: 0, outputTokens: 0, cacheWriteTokens: 0, cacheReadTokens: 0, webSearches: 0, calls: 0 };

  async function send(params: Record<string, unknown>) {
    // output_config and the dated web search tool are newer than the SDK's static types.
    const response = (await client.messages.create(params as never)) as unknown as {
      content: Array<{ type: string; text?: string }>;
      stop_reason: string | null;
      usage?: {
        input_tokens?: number;
        output_tokens?: number;
        cache_creation_input_tokens?: number;
        cache_read_input_tokens?: number;
        server_tool_use?: { web_search_requests?: number };
      };
    };
    const u = response.usage;
    if (u) {
      usage.inputTokens += u.input_tokens ?? 0;
      usage.outputTokens += u.output_tokens ?? 0;
      usage.cacheWriteTokens += u.cache_creation_input_tokens ?? 0;
      usage.cacheReadTokens += u.cache_read_input_tokens ?? 0;
      usage.webSearches += u.server_tool_use?.web_search_requests ?? 0;
      usage.calls += 1;
    }
    return response;
  }

  return {
    name,
    usage: () => ({ ...usage }),

    async plain(system, user, { maxTokens = 8000, effort = "high" } = {}) {
      const response = await send({
        model: name,
        max_tokens: maxTokens,
        system,
        output_config: { effort },
        messages: [{ role: "user", content: user }],
      });
      return extractText(response);
    },

    // Web search runs on Anthropic's side inside one request. A long turn can end with
    // stop_reason "pause_turn"; the client re-sends the conversation so it can continue.
    async search(system, user, { maxTokens = 8000, maxUses = 6, effort = "high" } = {}) {
      const tools = [{ type: "web_search_20260209", name: "web_search", max_uses: maxUses }];
      let messages: unknown[] = [{ role: "user", content: user }];
      let response = await send({ model: name, max_tokens: maxTokens, system, output_config: { effort }, tools, messages });
      for (let i = 0; i < MAX_PAUSE_RESUMES && response.stop_reason === "pause_turn"; i++) {
        messages = [...messages, { role: "assistant", content: response.content }];
        response = await send({ model: name, max_tokens: maxTokens, system, output_config: { effort }, tools, messages });
      }
      return extractText(response);
    },
  };
}
