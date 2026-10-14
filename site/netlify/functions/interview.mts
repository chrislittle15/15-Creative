import { interview } from "../../src/server/handlers";
import { handlePost } from "../../src/server/netlify";

export default (req: Request) => handlePost(req, interview);

export const config = { path: "/efficiency-finder/api/interview" };
