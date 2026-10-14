// Request handlers behind the four functions. Each takes plain input and its dependencies,
// so tests run them with a fake model and an in-memory store.
//
// Nothing here stores or logs answer text. Logs carry counts and random interview IDs only.

import type Anthropic from "@anthropic-ai/sdk";
import {
  applyAnswers, FIELD_MEANING, isUnsure, FIELDS, missingFields, tasksByHours, topTasksComplete,
  type AskedQuestion, type Field, type InterviewRequest, type InterviewResponse,
  type MatchRequest, type SeedCard, type SeedRequest, type SeedResponse,
} from "../core/interview";
import { containsNumber } from "../core/numbers";
import { formatHoursPerWeek, formatRange, taskHours } from "../core/math";
import { buildReport, visitorAnswers, type Proposal, type Report } from "../core/report";
import type { Settings } from "../core/settings";
import type { Pattern, Task } from "../core/types";
import { call, callJson, type ModelClient } from "./claude";
import type { Ledger } from "./ledger";
import { ADVICE_PATTERN, AGENT_SYSTEM, AGENT_TOOLS, MATCH_SCHEMA, MATCH_SYSTEM, SEED_SCHEMA, SEED_SYSTEM } from "./prompts";

export interface Deps {
  client: ModelClient;
  ledger: Ledger;
  settings: Settings;
  catalog: Pattern[];
  linkOk: Map<string, boolean>;
  today: () => Date;
  log: (line: string) => void;
}

export class BadRequest extends Error {}

// ---------- input checks ----------

const str = (v: unknown, max: number, name: string): string => {
  if (typeof v !== "string") throw new BadRequest(`${name} is required`);
  return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
};

const weekHoursOf = (v: unknown): number => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 5 || n > 100) throw new BadRequest("Hours per week must be between 5 and 100");
  return n;
};

const DURATIONS = ["15m", "30m", "1h", "2h", "3h_plus"];
const FREQUENCIES = ["daily", "few_week", "weekly", "monthly", "lt_monthly"];

export function cleanTasks(v: unknown): Task[] {
  if (!Array.isArray(v) || v.length === 0 || v.length > 40) throw new BadRequest("Tick at least one task");
  return v.map((t: any, i): Task => {
    if (!DURATIONS.includes(t?.duration) || !FREQUENCIES.includes(t?.frequency)) throw new BadRequest("Each task needs a duration and frequency");
    const signals: Record<string, string> = {};
    for (const f of FIELDS) if (typeof t.signals?.[f] === "string" && t.signals[f].trim()) signals[f] = str(t.signals[f], 300, f);
    return {
      id: str(t.id, 20, "task id").replace(/[^a-z0-9_-]/gi, "") || `t${i}`,
      name: str(t.name, 80, "task name"),
      screen: ["most_days", "weekly", "monthly"].includes(t.screen) ? t.screen : "weekly",
      order: Number.isFinite(t.order) ? t.order : i,
      duration: t.duration,
      frequency: t.frequency,
      tool: typeof t.tool === "string" ? str(t.tool, 60, "tool") || undefined : undefined,
      kind: ["meeting", "email", "other"].includes(t.kind) ? t.kind : "other",
      signals,
    };
  });
}

export function cleanHistory(v: unknown, tasks: Task[]): AskedQuestion[] {
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.length > 12) throw new BadRequest("Bad interview history");
  const ids = new Set(tasks.map((t) => t.id));
  return v.filter((q: any) => ids.has(q?.taskId)).map((q: any) => ({
    taskId: q.taskId,
    fields: (Array.isArray(q.fields) ? q.fields : []).filter((f: string) => FIELDS.includes(f as Field)).slice(0, 2),
    question: str(q.question ?? "", 300, "question"),
    options: (Array.isArray(q.options) ? q.options : []).slice(0, 5).map((o: unknown) => str(o, 100, "option")),
    answer: str(q.answer ?? "", 300, "answer"),
  }));
}

// ---------- seed ----------

export async function seed(body: any, d: Deps): Promise<SeedResponse> {
  const s = d.settings;
  const req: SeedRequest = {
    title: str(body?.title, s.seed.title_max_chars, "Job title"),
    industry: str(body?.industry, s.seed.industry_max_chars, "Industry"),
    weekHours: weekHoursOf(body?.weekHours ?? s.default_week_hours),
    jobDescription: typeof body?.jobDescription === "string" ? str(body.jobDescription, s.job_description_max_chars, "Job description") : "",
  };
  if (!req.title || !req.industry) throw new BadRequest("Job title and industry are required");

  const interviewId = await d.ledger.startInterview();
  const jd = req.jobDescription
    ? `\n<job_description>\n${req.jobDescription.replace(/<\/?job_description>/gi, "")}\n</job_description>`
    : "\n(No job description given.)";
  const out = await callJson<{ cards: { name: string; screen: SeedCard["screen"]; kind: SeedCard["kind"] }[]; likely_tools: string[] }>(
    d.client, d.ledger, interviewId,
    {
      model: s.models.seed, system: SEED_SYSTEM, maxTokens: 4000, effort: "low", schema: SEED_SCHEMA,
      user: `Job title: ${req.title}\nIndustry: ${req.industry}${jd}`,
    },
  );

  // Code filters the draft: no numbers, no duplicates, a cap per screen.
  const seen = new Set<string>();
  const counts: Record<string, number> = {};
  const cards: SeedCard[] = [];
  for (const c of out.cards ?? []) {
    const name = String(c.name ?? "").trim().slice(0, 60);
    const key = name.toLowerCase();
    if (!name || seen.has(key) || containsNumber(name, s)) continue;
    if ((counts[c.screen] = (counts[c.screen] ?? 0) + 1) > s.seed.cards_per_screen_max) continue;
    seen.add(key);
    cards.push({ id: `c${cards.length + 1}`, name, screen: c.screen, kind: c.kind });
  }
  const tools = [...new Set((out.likely_tools ?? []).map((t) => String(t).trim().slice(0, 40)).filter(Boolean))].slice(0, 8);
  d.log(`[ef] seed interview=${interviewId} cards=${cards.length} tools=${tools.length} jd=${req.jobDescription ? "yes" : "no"}`);
  return { interviewId, cards, tools };
}

// ---------- drill-down agent ----------

function stateMessage(tasks: Task[], history: AskedQuestion[], weekHours: number, asked: number, s: Settings): string {
  const ranked = tasksByHours(tasks, s);
  const lines = ranked.map((t) => {
    const h = taskHours(t, s).hoursPerWeek!;
    const facts = FIELDS.map((f) => `${f}: ${t.signals[f] ? `<answer>${t.signals[f]}</answer>` : "(missing)"}`).join("; ");
    return `[${t.id}] "${t.name}" (${formatRange(h, (n) => formatHoursPerWeek(n, s))} h/week) — ${facts}`;
  });
  const qa = history.map((q, i) => `#${i + 1} about ${q.taskId} (${q.fields.join(", ")}): ${q.question}\n   <answer>${q.answer}</answer>`);
  return [
    `Stated work week: ${weekHours} hours. Questions asked so far: ${asked} of ${s.agent.max_questions}.`,
    `Tasks, most hours first:`,
    ...lines,
    qa.length ? `\nEarlier questions and answers:\n${qa.join("\n")}` : "\nNo questions asked yet.",
  ].join("\n");
}

export function checkQuestion(input: any, tasks: Task[], history: AskedQuestion[], s: Settings): string | null {
  if (!tasks.some((t) => t.id === input?.task_id)) return `Unknown task_id. Use one of: ${tasks.map((t) => t.id).join(", ")}.`;
  const fields: string[] = Array.isArray(input.fields) ? input.fields : [];
  if (fields.length < 1 || fields.length > 2 || fields.some((f) => !FIELDS.includes(f as Field))) return "fields must list one or two of tool, volume, input, output.";
  const q = String(input.question ?? "").trim();
  if (!q || q.length > 220 || !q.endsWith("?")) return "The question must be one short sentence ending with a question mark.";
  const options: string[] = Array.isArray(input.options) ? input.options.map((o: unknown) => String(o).trim()).filter(Boolean) : [];
  if (options.length < s.agent.min_tap_answers || options.length > s.agent.max_tap_answers) return `Give between ${s.agent.min_tap_answers} and ${s.agent.max_tap_answers} tap answers.`;
  if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) return "Tap answers must all be different.";
  if (options.some((o) => o.length > 80)) return "Keep each tap answer short.";
  if (options.some((o) => /^other\b/i.test(o))) return "Do not add an Other option; the app adds free text.";
  if (ADVICE_PATTERN.test(q) || options.some((o) => ADVICE_PATTERN.test(o))) return "That reads as advice. Ask only for facts about the work.";
  if (history.some((h) => h.question.toLowerCase() === q.toLowerCase())) return "You already asked that question.";
  return null;
}

export async function interview(body: any, d: Deps): Promise<InterviewResponse> {
  const s = d.settings;
  const interviewId = str(body?.interviewId, 40, "interviewId");
  const weekHours = weekHoursOf(body?.weekHours);
  const baseTasks = cleanTasks(body?.tasks);
  const history = cleanHistory(body?.history, baseTasks);
  let tasks = applyAnswers(baseTasks, history);
  const iv = await d.ledger.interview(interviewId);
  if (!iv) throw new BadRequest("This interview has expired. Please start again.");

  // The store's count wins, so a browser cannot reset its question budget.
  const asked = Math.max(history.length, iv.questions);
  const max = s.agent.max_questions;
  const recorded: InterviewResponse["recorded"] = [];
  const done = (reason: InterviewResponse["reason"]): InterviewResponse => {
    d.log(`[ef] interview=${interviewId} done reason=${reason} questions=${asked}`);
    return { done: true, reason, recorded, questionsAsked: asked, maxQuestions: max };
  };

  if (body?.finishNow === true) return done("visitor");
  if (asked >= max) return done("limit");
  // Keep budget for matching: stop asking once most of the interview's budget is spent.
  if (iv.cost >= d.ledger.caps.perInterviewUsd * 0.7) return done("budget");

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: stateMessage(tasks, history, weekHours, asked, s) }];
  for (let turn = 0; turn < 6; turn++) {
    const response = await call(d.client, d.ledger, interviewId, {
      model: s.models.agent,
      max_tokens: 2000,
      system: AGENT_SYSTEM,
      tools: AGENT_TOOLS as unknown as Anthropic.Tool[],
      tool_choice: { type: "auto", disable_parallel_tool_use: true },
      output_config: { effort: "low" },
      messages,
    } as Anthropic.MessageCreateParamsNonStreaming);
    messages.push({ role: "assistant", content: response.content });
    const use = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (!use) {
      messages.push({ role: "user", content: "Please continue by calling a tool: ask_question, record_answer, get_missing_fields or finish." });
      continue;
    }
    const input = use.input as any;
    const reply = (content: string, isError = false) =>
      messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: use.id, content, is_error: isError }] });

    if (use.name === "get_missing_fields") {
      const missing = missingFields(tasks, s).map((m) => ({ task_id: m.taskId, task: m.taskName, missing: m.missing }));
      const top = topTasksComplete(tasks, s);
      reply(JSON.stringify({ missing, top_tasks_complete: top.complete, field_meanings: FIELD_MEANING }));
    } else if (use.name === "record_answer") {
      const n = Number(input.answer_number);
      const ok = tasks.some((t) => t.id === input.task_id) && FIELDS.includes(input.field) && Number.isInteger(n) && history[n - 1]?.answer;
      if (!ok) reply("Could not record: check task_id, field and answer_number.", true);
      else {
        recorded.push({ taskId: input.task_id, field: input.field, answerNumber: n });
        tasks = applyAnswers(baseTasks, history, recorded);
        reply("Recorded.");
      }
    } else if (use.name === "finish") {
      const top = topTasksComplete(tasks, s);
      if (top.complete) return done("agent");
      await d.ledger.bump("finishRefused");
      await d.ledger.updateInterview(interviewId, (r) => { r.finishRefused += 1; });
      d.log(`[ef] interview=${interviewId} finish refused questions=${asked} gaps=${top.gaps.length}`);
      reply(`Refused: the top tasks still have missing facts: ${top.gaps.map((g) => `${g.taskId} (${g.missing.join(", ")})`).join("; ")}. Ask about them.`, true);
    } else if (use.name === "ask_question") {
      const problem = checkQuestion(input, tasks, history, s);
      if (problem) { reply(problem, true); continue; }
      await d.ledger.updateInterview(interviewId, (r) => { r.questions = Math.max(r.questions, asked) + 1; });
      await d.ledger.bump("questionsAsked");
      d.log(`[ef] interview=${interviewId} question=${asked + 1}`);
      return {
        done: false,
        question: {
          taskId: input.task_id,
          fields: input.fields,
          question: String(input.question).trim(),
          options: input.options.map((o: unknown) => String(o).trim()).filter(Boolean),
        },
        recorded,
        questionsAsked: asked + 1,
        maxQuestions: max,
      };
    } else {
      reply("Unknown tool.", true);
    }
  }
  return done("stalled");
}

// ---------- matching and report ----------

export async function match(body: any, d: Deps): Promise<Report> {
  const s = d.settings;
  const req: MatchRequest = {
    interviewId: str(body?.interviewId, 40, "interviewId"),
    weekHours: weekHoursOf(body?.weekHours),
    tasks: cleanTasks(body?.tasks),
    history: [],
  };
  req.history = cleanHistory(body?.history, req.tasks);
  const tasks = applyAnswers(req.tasks, req.history);
  const answers = visitorAnswers(tasks, req.history);

  const tech = d.catalog.filter((p) => p.level !== "habit");
  const catalogText = tech.map((p) =>
    `- ${p.id}: ${p.name}. Shape: ${p.shape} Tools: ${p.tools.map((t) => `${t.id} (${t.name})`).join(", ")}`).join("\n");
  const counted = tasksByHours(tasks, s);
  const taskText = counted.map((t) => {
    const words = [t.tool, ...req.history.filter((q) => q.taskId === t.id && !isUnsure(q.answer)).map((q) => q.answer), ...Object.values(t.signals)]
      .filter(Boolean);
    return `[${t.id}] "${t.name}" (${s.frequencies[t.frequency].label.toLowerCase()})\n<visitor>${[...new Set(words)].join(" | ") || "(no answers)"}</visitor>`;
  }).join("\n");

  let proposals: Proposal[] = [];
  if (counted.length) {
    const out = await callJson<{ matches: { task_id: string; pattern_id: string | null; tool_id: string | null; evidence_quote: string; why: string }[] }>(
      d.client, d.ledger, req.interviewId,
      {
        model: s.models.match, system: MATCH_SYSTEM, maxTokens: 6000, effort: "medium", schema: MATCH_SCHEMA,
        user: `Catalog of technology patterns:\n${catalogText}\n\nTasks:\n${taskText}`,
      },
    );
    proposals = (out.matches ?? []).map((m) => ({
      taskId: m.task_id, patternId: m.pattern_id || null, toolId: m.tool_id || null,
      evidenceQuote: String(m.evidence_quote ?? "").slice(0, 300), why: String(m.why ?? "").slice(0, 400),
    }));
  }

  const report = buildReport({ tasks, weekHours: req.weekHours, answers, proposals, catalog: d.catalog, linkOk: d.linkOk, today: d.today(), settings: s });
  await d.ledger.updateInterview(req.interviewId, (r) => { r.completed = true; });
  await d.ledger.bump("interviewsCompleted");
  d.log(`[ef] match interview=${req.interviewId} proposals=${report.checked.proposals} passed=${report.checked.passed} rejected=${report.checked.rejected.length}`);
  return report;
}

// ---------- usage ----------

export async function usage(d: Deps) {
  const days = await d.ledger.recentDays(30);
  const totals = days.reduce(
    (t, x) => ({
      interviewsStarted: t.interviewsStarted + x.interviewsStarted,
      interviewsCompleted: t.interviewsCompleted + x.interviewsCompleted,
      inputTokens: t.inputTokens + x.inputTokens + x.cacheWriteTokens + x.cacheReadTokens,
      outputTokens: t.outputTokens + x.outputTokens,
      cost: t.cost + x.cost,
      calls: t.calls + x.calls,
    }),
    { interviewsStarted: 0, interviewsCompleted: 0, inputTokens: 0, outputTokens: 0, cost: 0, calls: 0 },
  );
  const today = await d.ledger.day();
  return {
    days,
    totals: { ...totals, costPerInterview: totals.interviewsStarted ? totals.cost / totals.interviewsStarted : 0 },
    caps: d.ledger.caps,
    today: { cost: today.cost, capReached: today.cost >= d.ledger.caps.perDayUsd },
  };
}
