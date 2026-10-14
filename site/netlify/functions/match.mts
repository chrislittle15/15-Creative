import { match } from "../../src/server/handlers";
import { handlePost } from "../../src/server/netlify";

export default (req: Request) => handlePost(req, match);

export const config = { path: "/efficiency-finder/api/match" };
