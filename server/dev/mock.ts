// DEV/TEST ONLY. Replaces the outbound fetch to Google with Warsaw-style fixtures in the real Google
// response shape, so the production code path (google.ts parsing, core.ts limits) is exercised.
// Imported only by server/node.ts when MOCK_GOOGLE=1; never by the Worker.
import { SEARCH_TEXT_URL } from '../google';

const CENTER = { lat: 52.2297, lng: 21.0122 };

// name, primaryType, extra types, rating, count, dLat(km N), dLng(km E), website?, summary?
type Row = [string, string, string[], number, number, number, number, boolean?, string?];
const R: Row[] = [
  ['Trattoria Rosa', 'italian_restaurant', [], 4.7, 820, 0.4, 0.3, true],
  ['Pasta Fresca', 'italian_restaurant', [], 4.6, 210, -1.2, 0.8, true],
  ['Osteria Vecchia', 'italian_restaurant', [], 4.4, 300, 0.9, -0.5, true],
  ['Napoli Slice', 'pizza_restaurant', ['italian_restaurant'], 4.8, 1200, 0.2, -0.9, true],
  ['Piec Neapol', 'pizza_restaurant', [], 4.5, 95, 2.1, 1.4, true],
  ['Pizza Hub', 'pizza_restaurant', [], 4.3, 400, -0.3, 0.2, true],
  ['Sakura Sushi', 'sushi_restaurant', ['japanese_restaurant'], 4.7, 540, 0.7, 0.9, true],
  ['Ramen Ya', 'ramen_restaurant', [], 4.6, 380, -0.8, -0.4, true],
  ['Tokyo Bento', 'japanese_restaurant', [], 4.5, 60, 1.6, -1.1, false],
  ['Bangkok Street', 'thai_restaurant', [], 4.6, 410, -0.5, 1.2, true],
  ['Pad Thai House', 'thai_restaurant', [], 4.5, 45, 3.2, 0.5, true],
  ['Pho Hanoi', 'vietnamese_restaurant', [], 4.8, 900, 1.1, 0.2, true],
  ['Saigon Corner', 'vietnamese_restaurant', [], 4.6, 130, -2.4, -0.6, false],
  ['Masala Magic', 'indian_restaurant', [], 4.7, 670, 0.3, -1.5, true],
  ['Delhi Darbar', 'indian_restaurant', [], 4.5, 88, 2.7, 2.2, true],
  ['Dragon Wok', 'chinese_restaurant', [], 4.5, 150, -1.0, 1.8, true],
  ['Seoul Kitchen', 'korean_restaurant', [], 4.7, 260, 0.6, 2.0, true],
  ['Taqueria Azul', 'mexican_restaurant', [], 4.6, 330, -1.7, -1.3, true],
  ['Burger Lab', 'hamburger_restaurant', [], 4.6, 1500, 0.1, 0.6, true],
  ['Smash House', 'hamburger_restaurant', ['american_restaurant'], 4.5, 700, -2.0, 1.0, true],
  ['Athena Taverna', 'greek_restaurant', [], 4.6, 190, 1.4, -0.8, true],
  ['Istanbul Grill', 'turkish_restaurant', [], 4.5, 240, -0.9, -1.9, true],
  ['Kebab u Alego', 'restaurant', ['meal_takeaway'], 4.6, 1900, 0.5, -0.2, false, 'Fresh döner kebab and falafel.'],
  ['Hummus Bar', 'middle_eastern_restaurant', ['mediterranean_restaurant'], 4.7, 310, -0.2, 1.5, true],
  ['Bistro Lumière', 'french_restaurant', [], 4.6, 175, 1.9, 0.4, true],
  ['Tapas Sol', 'spanish_restaurant', [], 4.5, 120, -1.5, 0.1, true],
  ['Zielona Miska', 'vegan_restaurant', ['vegetarian_restaurant'], 4.8, 460, 0.8, -0.3, true],
  ['Grill House', 'steak_house', [], 4.6, 380, -0.6, 0.7, true],
  ['Morze i Sól', 'seafood_restaurant', [], 4.5, 150, 2.5, -1.8, true],
  ['Pierogarnia Babcia', 'restaurant', [], 4.7, 1100, 0.3, 0.1, true, 'Handmade pierogi and traditional Polish dishes.'],
  ['Bar Mleczny Polonia', 'restaurant', [], 4.5, 2300, -0.4, -0.7, false, 'Classic milk bar with Polish home cooking.'],
  ['Zakopiańska Chata', 'restaurant', [], 4.6, 560, 1.0, 1.3, true, 'Regional Polish cuisine from the mountains.'],
  ['Gruzińska Chinkalnia', 'restaurant', [], 4.8, 420, -0.1, 0.8, true, 'Georgian khinkali and khachapuri.'],
  ['Tbilisi House', 'restaurant', [], 4.6, 140, 3.0, -0.3, true, 'Georgian food and wine.'],
  ['Varenyky & Borscht', 'restaurant', [], 4.6, 330, -1.1, -0.2, true, 'Ukrainian homestyle cooking.'],
  ['Restauracja Pod Lipami', 'restaurant', [], 4.6, 280, 0.9, 1.7, true],
  ['Kuchnia Artystyczna', 'restaurant', [], 4.7, 205, -1.4, 0.6, true],
  ['Café Nowy Świat', 'cafe', [], 4.7, 800, 0.0, 0.0, true],
  ['Złota Piekarnia', 'bakery', [], 4.6, 120, 0.6, -0.6, false],
  ['Hidden Gem 5.0', 'italian_restaurant', [], 5.0, 3, 0.2, 0.2, true],
  ['Good Few Reviews', 'thai_restaurant', [], 4.9, 12, -0.3, 0.3, true],
  ['Far Away Pasta', 'italian_restaurant', [], 4.8, 900, 7.5, 7.5, true],
  ['Mediterraneo', 'mediterranean_restaurant', [], 4.5, 99, 1.7, -1.6, true],
  ['Szaszłyki u Zosi', 'restaurant', [], 4.5, 430, -2.2, 1.5, false, 'Grilled skewers and BBQ.'],
  ['Barbecue Yard', 'barbecue_restaurant', [], 4.6, 260, 2.2, -0.9, true],
];

function periods(i: number) {
  if (i % 17 === 0) return [{ open: { day: 0, hour: 0, minute: 0 } }]; // 24/7
  const out = [];
  for (let d = 0; d < 7; d++) {
    if (i % 9 === 0 && d === 1) continue; // closed Mondays
    out.push({ open: { day: d, hour: 11, minute: 0 }, close: { day: d, hour: i % 5 === 0 ? 23 : 21, minute: 0 } });
  }
  return out;
}

function toGoogle(r: Row, i: number) {
  const [name, primary, extra, rating, count, n, e, hasSite, summary] = r;
  return {
    id: `mock_place_${i}`,
    displayName: { text: name, languageCode: 'pl' },
    formattedAddress: `ul. Przykładowa ${i + 1}, 00-${String(100 + i).padStart(3, '0')} Warszawa`,
    location: { latitude: CENTER.lat + n / 111.32, longitude: CENTER.lng + e / (111.32 * Math.cos((CENTER.lat * Math.PI) / 180)) },
    rating,
    userRatingCount: count,
    primaryType: primary,
    types: [primary, ...extra, 'restaurant', 'food', 'point_of_interest', 'establishment'].filter((v, j, a) => a.indexOf(v) === j),
    ...(hasSite ? { websiteUri: `https://example.com/${i}` } : {}),
    nationalPhoneNumber: `22 555 ${String(1000 + i)}`,
    googleMapsUri: `https://maps.google.com/?cid=${i}`,
    ...(summary ? { editorialSummary: { text: summary } } : {}),
    regularOpeningHours: { periods: periods(i) },
    utcOffsetMinutes: 120,
  };
}

const ALL = R.map(toGoogle);

interface Body {
  textQuery: string;
  minRating?: number;
  pageToken?: string;
  pageSize?: number;
  locationRestriction: { rectangle: { low: { latitude: number; longitude: number }; high: { latitude: number; longitude: number } } };
}

const QUERY_HINTS: Record<string, string[]> = {
  italian: ['italian_restaurant'],
  georgian: ['gruzi', 'georgian', 'tbilisi'],
  polish: ['polish', 'pierog', 'polonia', 'zakopia'],
  pizza: ['pizza_restaurant'],
};

export const mockFetch: typeof fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  const j = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } });

  if (url.hostname === 'maps.googleapis.com') {
    const comp = url.searchParams.get('components') ?? '';
    const pc = comp.match(/postal_code:([^|]+)/)?.[1] ?? '';
    if (/^99/.test(pc)) return j({ status: 'ZERO_RESULTS', results: [] });
    return j({ status: 'OK', results: [{ formatted_address: `${pc} Warszawa, Polska`, geometry: { location: CENTER } }] });
  }

  if (url.href === SEARCH_TEXT_URL) {
    const body = JSON.parse(String(init?.body)) as Body;
    const { low, high } = body.locationRestriction.rectangle;
    const q = body.textQuery.toLowerCase();
    let hits = ALL.filter(
      (p) =>
        p.location.latitude >= low.latitude && p.location.latitude <= high.latitude &&
        p.location.longitude >= low.longitude && p.location.longitude <= high.longitude &&
        (body.minRating == null || p.rating >= body.minRating),
    );
    const hint = Object.entries(QUERY_HINTS).find(([k]) => q.includes(k));
    if (hint) {
      const needles = hint[1];
      hits = hits.filter((p) => needles.some((n) => p.types.includes(n) || p.displayName.text.toLowerCase().includes(n) || (p.editorialSummary?.text ?? '').toLowerCase().includes(n)));
    }
    const offset = body.pageToken ? Number(atob(body.pageToken)) : 0;
    const page = hits.slice(offset, offset + 20);
    const next = offset + 20 < hits.length ? btoa(String(offset + 20)) : undefined;
    return j({ places: page, ...(next ? { nextPageToken: next } : {}) });
  }
  return j({ error: 'unmocked' }, 404);
};
