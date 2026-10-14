import { seed } from "../../src/server/handlers";
import { handlePost } from "../../src/server/netlify";

export default (req: Request) => handlePost(req, seed);

export const config = { path: "/efficiency-finder/api/seed" };
