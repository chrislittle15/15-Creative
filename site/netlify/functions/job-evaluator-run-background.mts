import { handleRun } from "../lib/job-evaluator/handlers.ts";
import { liveDeps } from "../lib/job-evaluator/runtime.ts";

// The "-background" suffix makes Netlify answer 202 immediately and let this run up to 15 minutes.
export default (req: Request) => handleRun(req, liveDeps());
