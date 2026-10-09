import type { RawPlace } from './types';

export interface CuisineDef {
  id: string;
  emoji: string;
  /** English term used for a targeted "search a specific cuisine" call. */
  search: string;
  /** Google place types that map to this cuisine. */
  types: string[];
  /** Keyword fallback on name + editorial summary. Trailing "!" = whole word only. */
  keywords: string[];
}

export const CUISINES: CuisineDef[] = [
  { id: 'italian', emoji: '🍝', search: 'Italian', types: ['italian_restaurant'], keywords: ['italian', 'włosk', 'trattoria', 'osteria', 'pasta!', 'ristorante'] },
  { id: 'pizza', emoji: '🍕', search: 'pizza', types: ['pizza_restaurant'], keywords: ['pizz'] },
  { id: 'japanese', emoji: '🍣', search: 'Japanese sushi', types: ['japanese_restaurant', 'sushi_restaurant', 'ramen_restaurant'], keywords: ['sushi', 'ramen', 'japan', 'izakaya', 'udon'] },
  { id: 'chinese', emoji: '🥡', search: 'Chinese', types: ['chinese_restaurant'], keywords: ['chinese', 'chinsk', 'dim sum', 'szechuan', 'wok!'] },
  { id: 'thai', emoji: '🍜', search: 'Thai', types: ['thai_restaurant'], keywords: ['thai', 'tajsk', 'pad thai'] },
  { id: 'vietnamese', emoji: '🍲', search: 'Vietnamese', types: ['vietnamese_restaurant'], keywords: ['vietnam', 'wietnam', 'pho!', 'banh mi', 'bánh mì'] },
  { id: 'indian', emoji: '🍛', search: 'Indian', types: ['indian_restaurant'], keywords: ['indian', 'indyjsk', 'masala', 'tandoori', 'curry'] },
  { id: 'korean', emoji: '🥘', search: 'Korean', types: ['korean_restaurant'], keywords: ['korean', 'koreań', 'kimchi', 'bibimbap'] },
  { id: 'mexican', emoji: '🌮', search: 'Mexican', types: ['mexican_restaurant'], keywords: ['mexic', 'meksyk', 'taco', 'taqueria', 'burrito'] },
  { id: 'burger', emoji: '🍔', search: 'burger', types: ['hamburger_restaurant'], keywords: ['burger'] },
  { id: 'american', emoji: '🥓', search: 'American', types: ['american_restaurant'], keywords: ['american', 'diner!'] },
  { id: 'greek', emoji: '🥙', search: 'Greek', types: ['greek_restaurant'], keywords: ['greek', 'grecki', 'gyros', 'souvlaki'] },
  { id: 'turkish', emoji: '🧆', search: 'Turkish', types: ['turkish_restaurant'], keywords: ['turkish', 'turecki', 'istanbul', 'anatoli'] },
  { id: 'kebab', emoji: '🌯', search: 'kebab', types: [], keywords: ['kebab', 'kebap', 'döner', 'doner', 'shawarma', 'szaszłyk'] },
  { id: 'middle_eastern', emoji: '🥗', search: 'Middle Eastern', types: ['middle_eastern_restaurant', 'lebanese_restaurant', 'afghani_restaurant'], keywords: ['hummus', 'falafel', 'lebanese', 'liba', 'arab', 'israel'] },
  { id: 'mediterranean', emoji: '🫒', search: 'Mediterranean', types: ['mediterranean_restaurant'], keywords: ['mediterran', 'śródziemnomor'] },
  { id: 'french', emoji: '🥐', search: 'French', types: ['french_restaurant'], keywords: ['french', 'francus', 'bistro!', 'brasserie'] },
  { id: 'spanish', emoji: '🥘', search: 'Spanish tapas', types: ['spanish_restaurant'], keywords: ['spanish', 'hiszpań', 'tapas', 'paella'] },
  { id: 'seafood', emoji: '🦐', search: 'seafood', types: ['seafood_restaurant'], keywords: ['seafood', 'owoce morza', 'fish!', 'ryb'] },
  { id: 'steak', emoji: '🥩', search: 'steakhouse', types: ['steak_house'], keywords: ['steak', 'stek'] },
  { id: 'bbq', emoji: '🍖', search: 'barbecue', types: ['barbecue_restaurant'], keywords: ['bbq', 'barbecue', 'grill!', 'smokehouse'] },
  { id: 'vegan', emoji: '🥬', search: 'vegan', types: ['vegan_restaurant', 'vegetarian_restaurant'], keywords: ['vegan', 'wegań', 'vegetarian', 'wegetar', 'plant-based'] },
  { id: 'polish', emoji: '🥟', search: 'Polish', types: [], keywords: ['pierog', 'polish', 'polska', 'polskie', 'polskiej', 'staropolsk', 'mleczny', 'bigos', 'żurek', 'kotlet schabowy'] },
  { id: 'georgian', emoji: '🫓', search: 'Georgian', types: [], keywords: ['georgian', 'gruzi', 'khinkali', 'chinkali', 'hinkali', 'khachapuri', 'chaczapuri', 'tbilisi', 'tbilisi'] },
  { id: 'ukrainian', emoji: '🍲', search: 'Ukrainian', types: [], keywords: ['ukrain', 'varenyk', 'wareniki', 'borsch'] },
];

export const CUISINE_BY_ID: Record<string, CuisineDef> = Object.fromEntries(CUISINES.map((c) => [c.id, c]));
export const UNKNOWN = 'unknown';

const TYPE_TO_CUISINE: Record<string, string> = {};
for (const c of CUISINES) for (const ty of c.types) TYPE_TO_CUISINE[ty] = c.id;

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/ł/g, 'l');
}

function keywordMatches(text: string, kw: string): boolean {
  const exact = kw.endsWith('!');
  const k = normalize(exact ? kw.slice(0, -1) : kw);
  const re = new RegExp(`(^|[^a-z0-9])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${exact ? '($|[^a-z0-9])' : ''}`);
  return re.test(text);
}

/** Google types first (primaryType, then the rest in order), keyword fallback on name + summary, else 'unknown'. */
export function deriveCuisine(p: Pick<RawPlace, 'name' | 'primaryType' | 'types' | 'summary'>): string {
  if (p.primaryType && TYPE_TO_CUISINE[p.primaryType]) return TYPE_TO_CUISINE[p.primaryType];
  for (const ty of p.types) if (TYPE_TO_CUISINE[ty]) return TYPE_TO_CUISINE[ty];
  const text = normalize(`${p.name} ${p.summary ?? ''}`);
  for (const c of CUISINES) if (c.keywords.some((kw) => keywordMatches(text, kw))) return c.id;
  return UNKNOWN;
}
