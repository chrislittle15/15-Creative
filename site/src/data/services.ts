export type Service = {
  title: string;
  description: string;
  icon: "web" | "mobile" | "seo" | "video" | "consulting" | "photography";
  features: string[];
  image?: string;
  imageAlt?: string;
  imagePortrait?: boolean;
  video?: string;
  featured?: boolean;
};

export const services: Service[] = [
  {
    title: "Website Development",
    description:
      "Custom websites and web applications, designed and built end-to-end — from a marketing site to a full ecommerce platform.",
    icon: "web",
    features: [
      "Custom design & development",
      "Ecommerce platform builds",
      "Mobile-responsive, fast-loading sites",
      "Ongoing maintenance & support",
    ],
    image: "/images/web/3-custom.jpg",
    imageAlt: "Custom Sweat ecommerce site, built and run by Chris",
    featured: true,
  },
  {
    title: "Video Production",
    description:
      "End-to-end video production — concept, shoot, and edit — for brand films, product promos, and event coverage.",
    icon: "video",
    features: [
      "Concept & creative direction",
      "On-location & studio production",
      "Motion graphics & editing",
      "Event & commercial coverage",
    ],
    video: "/videos/quail.mp4",
    imageAlt: "Still from the Quail Rally DVD production",
    featured: true,
  },
  {
    title: "Photography",
    description:
      "Commercial, fashion, event, and wedding photography — from concept and art direction through final retouched images.",
    icon: "photography",
    features: [
      "Commercial & fashion shoots",
      "Wedding & event coverage",
      "Art direction & styling",
      "Full retouching & delivery",
    ],
    image: "/photography/commercial/01.jpg",
    imageAlt: "Commercial photography sample",
    featured: true,
  },
  {
    title: "SEO & Marketing",
    description:
      "A full-stack marketing approach — SEO, paid search, email, and social — built around what actually drives traffic and revenue.",
    icon: "seo",
    features: ["Search engine optimization (SEO)", "Paid search & social (SEM/PPC)", "Email marketing", "Social media strategy"],
  },
  {
    title: "Business Consulting",
    description:
      "Operator-led consulting for founders and executive teams — the systems, processes, and GTM strategy behind building a company from zero.",
    icon: "consulting",
    features: [
      "Operating model & systems design",
      "GTM strategy",
      "Team training & independence planning",
      "AI workflow automation",
    ],
    image: "/images/site/profile2.jpg",
    imageAlt: "Chris Little",
    imagePortrait: true,
    featured: true,
  },
  {
    title: "Mobile App Development",
    description: "Mobile applications for iOS and Android, built for real business use cases.",
    icon: "mobile",
    features: ["iOS & Android development", "UX/UI design", "App store submission & launch support"],
  },
];
