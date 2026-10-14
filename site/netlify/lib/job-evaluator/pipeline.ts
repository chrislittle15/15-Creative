import { COMPENSATION_SYSTEM, FIT_SYSTEM, METADATA_SYSTEM, RECOMMENDATION_SYSTEM, RESEARCH_SYSTEM } from "./prompts.ts";
import { parseCompSummary, parseEvaluationSummary, parseMatchScore, parseMetadata, parseVerdict, parseWhyItFits } from "./parse.ts";
import { costOf, totalTokens, type Model } from "./model.ts";
import type { RunResult } from "./runs.ts";

export type Progress = (stage: number, message: string) => Promise<void> | void;

// The fixed sequence from pipeline.evaluate_posting() in the Python app. The model does the
// work inside each step; the order, inputs and parsing are decided here, not by the model.
export async function evaluatePosting(model: Model, posting: string, profile: string, progress: Progress): Promise<RunResult> {
  await progress(0, "Identifying company and role from posting...");
  const raw = await model.plain(METADATA_SYSTEM, posting, { maxTokens: 100, effort: "low" });
  const { company, roleTitle } = parseMetadata(raw);

  await progress(1, `Researching ${company}: legitimacy, funding, news, sentiment...`);
  const research = await model.search(
    RESEARCH_SYSTEM,
    `Company: ${company}\nRole being considered: ${roleTitle}\n\nFull job posting for context (location, seniority, team, etc.):\n---\n${posting}\n---\n\nResearch this company and produce the brief described in your instructions.`,
  );

  await progress(2, "Scoring genuine skill overlap and gaps...");
  const fit = await model.plain(
    FIT_SYSTEM,
    `CANDIDATE PROFILE:\n---\n${profile}\n---\n\nJOB POSTING:\n---\n${posting}\n---\n\nAssess fit per your instructions.`,
  );

  await progress(3, "Researching likely pay and checking your floor...");
  const compensation = await model.search(
    COMPENSATION_SYSTEM,
    `JOB POSTING:\n---\n${posting}\n---\n\nCANDIDATE'S STANDARDS (look for stated salary/comp floor here):\n---\n${profile}\n---\n\nResearch and assess compensation per your instructions.`,
  );

  await progress(4, "Synthesizing the final memo...");
  const memo = await model.plain(
    RECOMMENDATION_SYSTEM,
    `Company: ${company}\nRole: ${roleTitle}\n\nCOMPANY RESEARCH:\n---\n${research}\n---\n\nFIT ANALYSIS:\n---\n${fit}\n---\n\nCOMPENSATION ASSESSMENT:\n---\n${compensation}\n---\n\nSynthesize these into the final decision memo per your instructions.`,
  );

  const usage = model.usage();
  return {
    company,
    roleTitle,
    matchScore: parseMatchScore(memo),
    verdict: parseVerdict(memo),
    compSummary: parseCompSummary(memo),
    whyItFits: parseWhyItFits(memo),
    evaluationSummary: parseEvaluationSummary(memo),
    memo,
    research,
    fit,
    compensation,
    model: model.name,
    tokens: totalTokens(usage),
    webSearches: usage.webSearches,
    cost: costOf(usage, model.name),
  };
}
