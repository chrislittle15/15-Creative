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
    icon: "trending-up",
    role: "Venture Development",
    org: "Pebble Beach Resorts",
    dates: "Jan 2023 – Present",
    summary:
      "New outlet and merchandise roll outs within a billion-dollar retail enterprise. Brought in as a specialist to evaluate new ventures and integrate them into the existing business — the role was built around him.",
    bullets: [
      "Supported day-to-day operations of the retail division while leading new venture development, product category integration, and platform modernization",
      "Led the Magento-to-Shopify Plus platform migration: architecture redesign, workflow automation, cross-functional adoption",
      "Pro forma development and financial planning alongside senior leadership",
      "New venture activations: US Open 2027 shop, Sunday Red, The Art of Speed, and integration of the 1919 historic collection",
      "Managed integration of the Golf Links to the Past memorabilia collection into Pebble Beach retail, including historical Archives representation",
      "Built AI workflow automation proposals and trained staff on using existing tools more efficiently",
      "Inventory oversight across 20+ retail locations",
      "Division exceeded FY25 budget by 11.5%",
    ],
  },
  {
    icon: "landmark",
    role: "General Manager",
    org: "Golf Links to the Past",
    dates: "Jan 2023 – Jan 2025",
    summary: "Globally recognized luxury golf memorabilia and fine art business.",
    bullets: [
      "Held full P&L ownership of the business, responsible for sales, merchandising, replenishments, and customer relationships, managing a team of 7 and reporting to both Golf Links ownership and Pebble Beach leadership",
      "Built the sales pipeline; handled high-value negotiations and closures with collectors and institutional buyers",
      "Personally designed, negotiated, and brokered the partnership that brought the Golf Links collection into Pebble Beach's retail network, working both sides of the transaction",
      "Owned sourcing, procurement, and storage for a high-value, low-volume specialty collection; managed relationships with collectors, auction houses, artists, and golf historians",
    ],
  },
  {
    icon: "spark",
    role: "Strategic Consultant (Founder)",
    org: "15 Creative and Consulting",
    dates: "Jan 2008 – Jan 2023",
    summary: "Independent creative, technology, and consulting practice.",
    bullets: [
      "Website development, ecommerce platforms, and application builds alongside creative services and GTM strategy",
      "Full marketing stack: SEO, SEM, email, social, paid digital",
      "Directed designers, developers, videographers, and content specialists across concurrent client engagements",
      "Advised ownership and C-suite teams on operating model design and commercial growth, training teams to operate independently before moving on",
    ],
  },
  {
    icon: "layers",
    role: "Director of Operations",
    org: "St. George and Associates / CHDG",
    dates: "Nov 2021 – Nov 2022",
    summary: "Multi-vertical expansion across hospitality, student housing, and grocery.",
    bullets: [
      "Built operational infrastructure and GTM frameworks across distributed teams during rapid multi-vertical growth",
      "Created the operational plan for acquisition and ground-up construction across multiple markets/delis, hotels, an educational campus, and a property management network",
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
    summary: "SaaS-adjacent online education platform for real estate licensing exam prep, built from scratch.",
    bullets: [
      "Owned product architecture and content delivery workflows",
      "Built the commission plan, hired and trained the sales team",
      "Designed the institutional outreach strategy behind school and institution partnerships",
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
      "Founding commercial and creative leader; configured software on early streaming/digital signage platforms",
      "Produced commercial media content, installed servers and display equipment in retail locations, managed enterprise client relationships",
    ],
  },
];
