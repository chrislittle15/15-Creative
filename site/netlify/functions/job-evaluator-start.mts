import { handleStart } from "../lib/job-evaluator/handlers.ts";
import { liveDeps } from "../lib/job-evaluator/runtime.ts";

export default (req: Request, context: { ip?: string }) => handleStart(req, context.ip, liveDeps());

export const config = { path: "/job-evaluator/api/start" };
