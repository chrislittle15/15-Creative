export type VideoProject = {
  title: string;
  slug: string;
  description: string;
  video: string | null;
  thumb: string;
  stills?: string[];
  note?: string;
};

export const videoProjects: VideoProject[] = [
  {
    title: "Quail Rally DVD",
    slug: "quail-rally",
    description:
      "Commemorative video for a classic car event: highlight footage, animated photo slideshow, participant listings, blooper reel, and sponsor recognition.",
    video: "/videos/quail.mp4",
    thumb: "/images/video-thumbs/quail.png",
    stills: ["/images/video-thumbs/CS_Qrally.jpg", "/images/video-thumbs/CS_qrallyback.jpg", "/images/video-thumbs/cs_quailweb.jpg"],
  },
  {
    title: "Ben Doyle Tribute Video",
    slug: "ben-doyle-tribute",
    description: "Commemorative video for a renowned golf instructor.",
    video: "/videos/ben.mov",
    thumb: "/images/video-thumbs/ben.png",
    stills: ["/images/video-thumbs/ben.jpg"],
  },
  {
    title: "Aqua-vi Boardshort Promo",
    slug: "aqua-vi-boardshort-promo",
    description:
      "Product promo video for Aqua-VI Trading Co.: on-site production, set design, video/photo editing, and motion graphics.",
    video: "/videos/aqua.mov",
    thumb: "/images/video-thumbs/aqua.png",
    stills: ["/images/video-thumbs/aqua.jpg"],
  },
  {
    title: "LOW Clothing Surf/Lifestyle Branding",
    slug: "low-clothing",
    description:
      "7-day production in Baja California: lifestyle content for a surf team, shot on Canon/Panasonic with underwater housings.",
    video: "/videos/low.mov",
    thumb: "/images/video-thumbs/low.png",
    stills: ["/images/video-thumbs/low.jpg"],
  },
  {
    title: "Invincible — Consumer Reports Creative Challenge",
    slug: "invincible",
    description:
      "A submission to a Consumer Reports creative challenge, using a pop-culture creative angle to spotlight a social issue. Winner of the competition.",
    video: "/videos/invincible.mov",
    thumb: "/images/video-thumbs/invincible.png",
  },
  {
    title: "Pedi — Reality TV Pilot",
    slug: "pedi",
    description:
      "Pilot episode for a reality TV series pitch, spotlighting the pedicab scene in Austin, Texas.",
    video: "/videos/pedi.mov",
    thumb: "/images/video-thumbs/pedi.png",
  },
  {
    title: "High End Production Reel",
    slug: "mavis-reel",
    description: "A high-end production reel, courtesy of creative partner Mavis Media.",
    video: "/videos/mavis.mov",
    thumb: "/images/video-thumbs/mavis.png",
  },
  {
    title: "Motion Graphic Reel",
    slug: "ravel-reel",
    description: "A motion graphics reel from creative partner Ravel Creative.",
    video: "/videos/ravel.mp4",
    thumb: "/images/video-thumbs/ravel.png",
  },
  {
    title: "CashOne Commercial",
    slug: "cashone-commercial",
    description: "Commercial spot for Cash 1, a cash-advance lender.",
    video: "/videos/cashone.mp4",
    thumb: "/images/video-thumbs/cashone.png",
  },
  {
    title: "RVCA Branding Commercial",
    slug: "rvca-branding",
    description: "Branding commercial for RVCA.",
    video: "/videos/rvca.mov",
    thumb: "/images/video-thumbs/rvca.png",
  },
  {
    title: "2D Motion Graphics",
    slug: "2d-motion-graphics",
    description: "Motion graphics promo for Xanadu Surf Designs — \"This Is Life.\"",
    video: "/videos/surf2005.mov",
    thumb: "/images/video-thumbs/surf2005.png",
  },
  {
    title: "Boost Mobile Kiosk Ad",
    slug: "boost-mobile-kiosk",
    description:
      "In-store interactive kiosk and video content for Boost Mobile, delivered through the ASAN digital signage network in Sun Diego Boardshop locations.",
    video: "/videos/boost.mov",
    thumb: "/images/video-thumbs/boost.png",
  },
  {
    title: "Allodic Marketing Spot",
    slug: "allodic-marketing-spot",
    description: "Promotional spot for Allodic Marketing's digital signage platform — \"the future of advertising.\"",
    video: "/videos/allodic.mov",
    thumb: "/images/video-thumbs/allodic.png",
  },
];
