export interface DeliveryLink {
  id: 'wolt' | 'pyszne' | 'glovo' | 'ubereats';
  label: string;
  url: string;
}

/**
 * None of these services documents a public "search by restaurant name" URL that works without a delivery
 * address (Pyszne.pl and Glovo have none, Wolt's and Uber Eats' formats are undocumented/city-specific),
 * so every button opens a plain web search for the restaurant on that service. Uncertain format => fallback.
 */
export function deliveryLinks(name: string, locality: string): DeliveryLink[] {
  const q = (service: string) => `https://www.google.com/search?q=${encodeURIComponent(`${name} ${service} ${locality}`.trim())}`;
  return [
    { id: 'wolt', label: 'Wolt', url: q('Wolt') },
    { id: 'pyszne', label: 'Pyszne.pl', url: q('Pyszne.pl') },
    { id: 'glovo', label: 'Glovo', url: q('Glovo') },
    { id: 'ubereats', label: 'Uber Eats', url: q('Uber Eats') },
  ];
}

export function mapsUrl(p: { name: string; google_place_id: string; maps_uri?: string }): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name)}&query_place_id=${encodeURIComponent(p.google_place_id)}`;
}

export function telUrl(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}
