// AI demo apps shown in the AI section of /services. Each card's button goes to `href`; with no `href` it reads "Coming soon". `status` is for our own tracking and is not shown on the page. Set `image` when Chris supplies one.
export type AiApp = {
  name: string;
  summary: string;
  status: "Live" | "Case study" | "In development";
  href?: string;
  image?: string;
};

export const aiApps: AiApp[] = [
  {
    name: "Treasure Hunter",
    summary:
      "Hunts eBay for golf memorabilia and shows the most you can pay at your margin. Code does every price and the model never produces one. In a backtest, 70% of actual sale prices fell inside the comp range (217 of 311 lots).",
    status: "Case study",
    href: "/treasure-hunter/",
    image: "/images/ai/treasure-hunter.jpg",
  },
  {
    name: "Pressure Cooker",
    summary:
      "Tell us what's in your kitchen and it finds real recipes, lets you pick your meals for the week, and builds your shopping list. Code does every count, diet check and package. 146 real recipes, every ingredient priced against a store list.",
    status: "Live",
    href: "/pressure-cooker/",
    image: "/images/ai/pressure-cooker.svg",
  },
  {
    name: "Efficiency Finder",
    summary:
      "A five-minute interview that maps your work week and shows where a tool, an automation, an AI agent or a habit change would save time. The model proposes; code does the hours math. About 5 cents per interview, hard-capped at 15.",
    status: "Live",
    href: "/efficiency-finder/",
    image: "/images/ai/efficiency-finder.svg",
  },
  {
    name: "Job Evaluator",
    summary:
      "Paste a job posting and a four-stage workflow researches the company, scores your fit, benchmarks the pay and writes a pursue-or-pass memo. Code fixes the sequence and reads the score. About $0.97 per evaluation across 10 measured runs. Access by request.",
    status: "Live",
    href: "/job-evaluator/",
    image: "/images/ai/job-evaluator.svg",
  },
];
