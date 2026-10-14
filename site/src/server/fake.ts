// DEVELOPMENT ONLY. A canned stand-in for the model so the screens can be exercised without an
// API key. Active only when EF_FAKE_MODEL=1 and no ANTHROPIC_API_KEY is set (see netlify.ts).
// Production never sets EF_FAKE_MODEL, and a real key always wins (HOSTING.md, launch plan).

import type Anthropic from "@anthropic-ai/sdk";
import type { ModelClient } from "./claude";

const usage = { input_tokens: 1200, output_tokens: 300, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 };
const msg = (content: unknown[], stop: string): Anthropic.Message =>
  ({ id: "fake", type: "message", role: "assistant", model: "fake", stop_reason: stop, stop_sequence: null, content, usage } as unknown as Anthropic.Message);

export function fakeModel(): ModelClient {
  return {
    async create(p) {
      await new Promise((r) => setTimeout(r, 700));
      const system = String(p.system ?? "");
      if (system.startsWith("You draft likely task cards")) {
        const cards = [
          ["Triage the inbox", "most_days", "email"], ["Morning stand-up", "most_days", "meeting"], ["Answer vendor questions", "most_days", "other"],
          ["Update the open-orders tracker", "most_days", "other"], ["Back-to-back supplier calls", "most_days", "meeting"], ["Walk the sales floor", "most_days", "other"],
          ["Build the weekly sales report", "weekly", "other"], ["Plan reorders", "weekly", "other"], ["Team meeting", "weekly", "meeting"], ["Chase late shipments", "weekly", "other"],
          ["Reconcile vendor invoices", "monthly", "other"], ["Month-end inventory review", "monthly", "other"], ["Seasonal line review", "monthly", "meeting"],
        ].map(([name, screen, kind]) => ({ name, screen, kind }));
        return msg([{ type: "text", text: JSON.stringify({ cards, likely_tools: ["Excel", "Outlook", "Teams", "NetSuite", "Shopify"] }) }], "end_turn");
      }
      if (system.startsWith("You are the drill-down interviewer")) {
        // Ask about the first missing field among the top three tasks; finish when none remain.
        const state = String((p.messages[0] as { content: string }).content);
        const lines = [...state.matchAll(/^\[(\w+)\] "([^"]+)"[^\n]*$/gm)].slice(0, 3);
        const turn = p.messages.length;
        const options: Record<string, string[]> = {
          input: ["Exports from a system", "Emails from people", "I type it from paper or screens", "A shared spreadsheet"],
          output: ["Emailed to my manager", "Posted in a shared folder", "Entered into another system", "Presented in a meeting"],
          volume: ["A handful of items", "Dozens of items", "Hundreds of rows", "It varies a lot"],
          tool: ["Excel", "Outlook", "Our ordering system", "Paper and phone"],
        };
        const wording: Record<string, string> = {
          input: "Where does the information for %s come from?", output: "Where does the finished work for %s go?",
          volume: "Roughly how much is there each time you %s?", tool: "What do you mainly use for %s?",
        };
        for (const [line, id, name] of lines) {
          const field = ["tool", "volume", "input", "output"].find((f) => line.includes(`${f}: (missing)`));
          if (field) {
            const label = name.charAt(0).toLowerCase() + name.slice(1);
            return msg([{ type: "tool_use", id: `fake_${turn}`, name: "ask_question", input: { task_id: id, fields: [field], question: wording[field].replace("%s", label), options: options[field] } }], "tool_use");
          }
        }
        return msg([{ type: "tool_use", id: `fake_${turn}`, name: "finish", input: {} }], "tool_use");
      }
      if (system.startsWith("You match tasks")) {
        const user = String((p.messages[0] as { content: string }).content);
        const tasks = [...user.matchAll(/\[(\w+)\] "([^"]+)"[^\n]*\n<visitor>([^<]*)<\/visitor>/g)];
        const matches = tasks.map(([, id, name, words]) => {
          const w = `${name} ${words}`.toLowerCase();
          const first = words === "(no answers)" ? "" : words.split(" | ")[0];
          if (w.includes("report")) return { task_id: id, pattern_id: "recurring-report", tool_id: "excel-power-query", evidence_quote: first, why: "The report is rebuilt from the same sources each cycle." };
          if (w.includes("inbox") || w.includes("email")) return { task_id: id, pattern_id: "inbox-triage", tool_id: "m365-copilot", evidence_quote: first, why: "Much of the inbox is sorting and routine replies." };
          if (w.includes("reconcile")) return { task_id: id, pattern_id: "reconciling-lists", tool_id: "excel-xlookup", evidence_quote: first, why: "Two sets of records are compared line by line." };
          if (w.includes("chase")) return { task_id: id, pattern_id: "chasing-status", tool_id: "power-automate-approvals", evidence_quote: first, why: "Time goes to asking others for updates." };
          return { task_id: id, pattern_id: null, tool_id: null, evidence_quote: "", why: "" };
        });
        return msg([{ type: "text", text: JSON.stringify({ matches }) }], "end_turn");
      }
      throw new Error("fake model: unknown request");
    },
  };
}
