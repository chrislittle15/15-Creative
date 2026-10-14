import { usage } from "../../src/server/handlers";
import { deps, json } from "../../src/server/netlify";

// The usage page's data. EF_USAGE_PAGE=hidden turns it off (404).
export default async () => {
  if (process.env.EF_USAGE_PAGE === "hidden") return json(404, { error: "Not found" });
  return json(200, await usage(deps()));
};

export const config = { path: "/efficiency-finder/api/usage" };
