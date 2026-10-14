// Ingredient aliases and the ignore list.
//
// The recipe pool is British, the store list is American, so most of the gap is
// vocabulary rather than missing products: "spring onions" are green onions, "plain
// flour" is all-purpose, "caster sugar" is sugar. SPEC section 10 anticipated this.
//
// Keys and values here are written the way `normalizeName` leaves text (lowercased,
// singularized), so the lookup happens after normalization, not before.

/** Variant name -> the name used in the store list. */
export const INGREDIENT_ALIASES: Record<string, string> = {
  // --- British to American ---
  "spring onion": "green onion",
  scallion: "green onion",
  "plain flour": "flour",
  "all purpose flour": "flour",
  "self raising flour": "flour",
  "strong white bread flour": "bread flour",
  "wholemeal flour": "whole wheat flour",
  "caster sugar": "sugar",
  "granulated sugar": "sugar",
  "icing sugar": "powdered sugar",
  "double cream": "heavy cream",
  "single cream": "heavy cream",
  "soured cream": "sour cream",
  "natural yogurt": "yogurt",
  yoghurt: "yogurt",
  "natural yoghurt": "yogurt",
  "plain yoghurt": "yogurt",
  "plain yogurt": "yogurt",
  "strained yoghurt": "greek yogurt",
  "greek yoghurt": "greek yogurt",
  "corn flour": "cornstarch",
  "tomato puree": "tomato paste",
  aubergine: "eggplant",
  courgette: "zucchini",
  rocket: "lettuce",
  coriander: "cilantro",
  "fresh coriander": "cilantro",
  "mince": "ground beef",
  "beef mince": "ground beef",
  "minced beef": "ground beef",
  "pork mince": "ground pork",
  prawn: "shrimp",
  "king prawn": "shrimp",
  "bicarbonate of soda": "baking soda",
  "mixed spice": "allspice",
  "plain chocolate": "chocolate chip",
  "dark chocolate": "chocolate chip",
  "digestive biscuit": "breadcrumb",

  // --- Stocks and broths ---
  "chicken stock": "chicken broth",
  "beef stock": "beef broth",
  "vegetable stock": "vegetable broth",
  "chicken stock cube": "chicken broth",
  "beef stock cube": "beef broth",
  "vegetable stock cube": "vegetable broth",

  // --- Peppers ---
  "red pepper": "bell pepper",
  "green pepper": "bell pepper",
  "yellow pepper": "bell pepper",
  "red bell pepper": "bell pepper",
  "green bell pepper": "bell pepper",

  // --- Oils ---
  oil: "vegetable oil",
  "sunflower oil": "vegetable oil",
  "rapeseed oil": "vegetable oil",
  "canola oil": "vegetable oil",
  "extra virgin olive oil": "olive oil",
  "sesame seed oil": "sesame oil",

  // --- Spices written long-form ---
  "ground cumin": "cumin",
  "ground cinnamon": "cinnamon",
  "ground coriander": "coriander seed",
  "ground ginger": "ginger",
  "ground nutmeg": "nutmeg",
  "ground turmeric": "turmeric",
  "ground black pepper": "black pepper",
  "freshly ground black pepper": "black pepper",
  "black peppercorn": "black pepper",
  "kosher salt": "salt",

  // --- Produce and dairy shorthand ---
  "garlic clove": "garlic cloves",
  "lemon juice": "lemon",
  "lime juice": "lime",
  "lemon zest": "lemon",
  "lemon rind": "lemon",
  "egg yolk": "egg",
  "egg white": "egg",
  "eggs": "egg",
  mozzarella: "mozzarella cheese",
  cheddar: "cheddar cheese",
  parmesan: "parmesan cheese",
  "parmigiano reggiano": "parmesan cheese",
  feta: "feta cheese",
  "chestnut mushroom": "mushroom",
  "baby spinach": "spinach",
  "tinned tomato": "canned tomato",
  "chopped tomato": "canned tomato",
  "plum tomato": "canned tomato",
  "passata": "tomato sauce",

  // --- Second pass, from what the pool actually asked for ---
  "red chilli": "chili pepper",
  "green chilli": "chili pepper",
  chilli: "chili pepper",
  "chilli powder": "chili powder",
  "red chile": "chili pepper",
  "red wine vinegar": "vinegar",
  "white wine vinegar": "vinegar",
  "rice vinegar": "vinegar",
  "cider vinegar": "vinegar",
  "creme fraiche": "sour cream",
  "cinnamon stick": "cinnamon",
  "basil leaf": "basil",
  "muscovado sugar": "brown sugar",
  "demerara sugar": "brown sugar",
  "soft brown sugar": "brown sugar",
  "dried oregano": "oregano",
  "dried thyme": "thyme",
  "dried basil": "basil",
  "dried parsley": "parsley",
  "dried dill": "dill",
  "sweetcorn": "corn",
  "basmati rice": "rice",
  "jasmine rice": "rice",
  "long grain rice": "rice",
  "arborio rice": "rice",
  "wholegrain rice": "brown rice",
  "spaghetti": "pasta",
  "penne": "pasta",
  "linguine": "pasta",
  "tagliatelle": "pasta",
  "macaroni": "pasta",
  "fusilli": "pasta",
  "noodle": "pasta",
  "rice noodle": "pasta",

  // --- Meat shorthand ---
  beef: "steak",
  chicken: "chicken breast",
  "chicken breasts": "chicken breast",
  "chicken thighs": "chicken thigh",
  "boneless skinless chicken breast": "chicken breast",
  pork: "pork chop",
  "streaky bacon": "bacon",
  "smoked bacon": "bacon",
};

/**
 * Things a recipe lists but nobody buys for it. Dropping them stops the shopping list
 * reading as if tap water were a grocery item, and stops them counting against match
 * coverage.
 */
export const IGNORED_INGREDIENTS: ReadonlySet<string> = new Set([
  "water",
  "cold water",
  "warm water",
  "boiling water",
  "hot water",
  "ice",
  "ice cube",
  "to serve",
  "garnish",
  "to taste",
]);

export function applyAlias(normalized: string): string {
  return INGREDIENT_ALIASES[normalized] ?? normalized;
}

export function isIgnored(normalized: string): boolean {
  return IGNORED_INGREDIENTS.has(normalized);
}
