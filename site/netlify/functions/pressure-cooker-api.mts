import { handle } from "../lib/pressure-cooker/server/handlers.ts";
import { liveDeps } from "../lib/pressure-cooker/server/runtime.ts";

export default (req: Request) => handle(req, liveDeps());

export const config = { path: ["/pressure-cooker/api/*"] };
