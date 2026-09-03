export type PhotoGallery = {
  title: string;
  slug: string;
  folder: string;
  count: number;
  description: string;
};

export const photoGalleries: PhotoGallery[] = [
  {
    title: "Commercial and Fashion",
    slug: "commercial",
    folder: "/photography/commercial",
    count: 21,
    description: "Commercial and fashion photography work.",
  },
  {
    title: "Vintage Sporting and Luxury Automobiles",
    slug: "vintage-cars",
    folder: "/photography/vintage-cars",
    count: 12,
    description: "Coverage from a classic car rally and vintage automobile events.",
  },
  {
    title: "Wedding Photography",
    slug: "weddings",
    folder: "/photography/weddings",
    count: 24,
    description: "Wedding photography coverage.",
  },
];
