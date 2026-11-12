import type { IconName } from "../components/Icon.astro";

export type ExperienceEntry = {
  role: string;
  org: string;
  dates: string;
  summary: string;
  bullets: string[];
  icon: IconName;
};

export const experience: ExperienceEntry[] = [
  {
    icon: "web",
    role: "Business Operations & AI Enablement Consultant",
    org: "AmpWorks / AmpStack.ai",
    dates: "Jun 2026 – Present",
    summary: "AI automation agency and AI agent platform for small and mid-sized businesses.",
    bullets: [
      "Prepare the business analysis that informs leadership strategy meetings, covering pipeline, sales goals and forecasting, competitive analysis, and efficiency and savings opportunities.",
      "Deliver custom AI agents and workflow automations for client businesses, including CRM-connected tools that turn lead data into proposals and invoices, and build business intelligence dashboards and custom applications.",
    ],
  },
  {
    icon: "trending-up",
    role: "Outlet Manager – Venture Development",
    org: "Pebble Beach Resorts",
    dates: "Jan 2023 – Mar 2026",
    summary: "New outlet and merchandise ventures for the $45M+ retail division of a billion-dollar resort.",
    bullets: [
      "Partnered with the senior executive team on quarterly business reviews, annual planning, budgeting, and scorecards; the division beat its FY25 sales budget by 11.5%.",
      "Built pro formas and investment cases for new ventures and presented them to C-suite leadership.",
      "Led cross-functional launches, including the 1919 historic collection integration and the launch plan for the US Open 2027 shop.",
      "Built and launched the division's new ecommerce website on Shopify Plus (migrated from Magento) and owned the full ecommerce product catalog.",
    ],
  },
  {
    icon: "landmark",
    role: "General Manager",
    org: "Golf Links to the Past",
    dates: "Jan 2023 – Jan 2025",
    summary: "Golf memorabilia and fine art business. Joined in 2017; GM from 2023.",
    bullets: [
      "Ran the business end to end, from sourcing, buying, and receiving to merchandising, sales, marketing, and fulfillment, with full P&L ownership.",
      "Hired, trained, and managed the sales team.",
      "Brokered the sale of the retail operation and collection to Pebble Beach, working with legal through the deal.",
    ],
  },
  {
    icon: "layers",
    role: "Director of Operations",
    org: "St. George and Associates / CHDG",
    dates: "Nov 2021 – Nov 2022",
    summary: "Privately held operating group expanding across hospitality, student housing, and grocery.",
    bullets: [
      "Built operations infrastructure, reporting, and executive visibility for a company entering three new industries at once, and created the operational plan for acquiring and building multiple hotels, grocery markets, and a mixed-use innovation campus.",
    ],
  },
  {
    icon: "spark",
    role: "Strategic Consultant (Founder)",
    org: "15 Creative and Consulting",
    dates: "Jan 2008 – Jan 2023",
    summary: "Creative, technology, and consulting practice, run alongside other roles.",
    bullets: [
      "Advised C-suite and ownership teams on operating models, go-to-market strategy, and growth.",
      "Designed the practice's service packages and pricing.",
      "Delivered web, ecommerce, and app builds and full marketing services, and coordinated product shoots and graphic and video ad campaigns.",
    ],
  },
  {
    icon: "bag",
    role: "Ecommerce Operations (Co-Founder)",
    org: "Custom Sweat",
    dates: "2014 – Nov 2022",
    summary:
      "DTC ecommerce business selling custom embroidered sweatbands with a built-in social impact model — 10% of proceeds donated to a nonprofit the customer chose.",
    bullets: [
      "Built the website and all marketing infrastructure from scratch",
      "Ran full DTC operations: acquisition, product configuration, fulfillment",
    ],
  },
  {
    icon: "cap",
    role: "Director of Operations (Co-Founder)",
    org: "REPE Training LLC",
    dates: "Aug 2010 – Jul 2014",
    summary: "Subscription-based online education platform for real estate licensing candidates, built from scratch.",
    bullets: [
      "Designed the platform's UX/UI and workflow with the lead programmer and set the subscription pricing and packages.",
      "Built the sales commission plan, hired and trained the outside sales team, and built partnerships with schools and institutions.",
    ],
  },
  {
    icon: "seo",
    role: "Sr. Marketing Manager",
    org: "Austin Institute of Real Estate",
    dates: "Feb 2009 – Aug 2010",
    summary: "Real estate education and career development school serving the Austin market.",
    bullets: [
      "Owned all internal and external marketing strategy and execution as the sole marketing lead",
      "Ran campaigns across SEO, SEM, email, social media, and paid digital acquisition",
      "Led full website and e-learning platform redesign",
      "Built performance measurement systems that identified highest-performing channels and drove enrollment growth through data-informed investment decisions",
    ],
  },
  {
    icon: "broadcast",
    role: "VP Creative, Founding Team Member",
    org: "Allodic Marketing Inc.",
    dates: "Mar 2004 – Jan 2008",
    summary:
      "Early digital out-of-home and in-store media company bringing programmatic content delivery to retail — 2004, before streaming infrastructure existed as we know it now.",
    bullets: [
      "Co-led commercial and creative work, configured early digital signage software, produced media content, and wrote and negotiated client contracts and managed accounts for retail and restaurant locations.",
      "Served on the board of directors.",
    ],
  },
];
