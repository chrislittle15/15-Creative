export type BusinessProject = {
  title: string;
  description: string;
  image: string;
  note?: string;
  noCrop?: boolean;
};

export const businessProjects: BusinessProject[] = [
  {
    title: "Allodic Marketing",
    description:
      "Digital signage, custom media networks, and multimedia creative services for hotel, resort, and retail clients — the business Chris helped found and led creatively as VP Creative.",
    image: "/images/business/allodic.jpg",
  },
  {
    title: "ASAN — Action Sports Advertising Network",
    description:
      "A customizable digital signage network for action sports retailers: store-specific \"TV station\" content highlighting products, promotions, and teams to drive sales and in-store personality.",
    image: "/images/business/asan.jpg",
  },
  {
    title: "Live Event Webcast Production",
    description:
      "Multi-camera coverage of action sports (snowboarding, skateboarding, surfing) with motion graphics, instant replays, and live scoring.",
    image: "/images/business/asan-live.jpg",
  },
  {
    title: "FloValve",
    description: "Ecommerce and brand site for a hydration bottle technology product line.",
    image: "/images/business/flovalve.jpg",
  },
  {
    title: "ChillPill",
    description: "Packaging and brand identity for a stress-relief supplement product.",
    image: "/images/business/chillpill.jpg",
  },
  {
    title: "Nothingonit.com",
    description: "An earlier personal portfolio and resume site for Chris's work.",
    image: "/images/business/frontpage.gif",
    noCrop: true,
  },
];
