// architecture.md §13: Nominatim is called from the frontend for reverse geocoding.
// Browsers don't allow overriding the User-Agent header from `fetch`, but they always send
// a Referer with the page's own URL, which is what Nominatim's usage policy asks for from a
// client-side app. Callers are responsible for the "low request rate" half of that policy —
// see LocationStep.jsx, which debounces and only geocodes once the pin settles.
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

/**
 * @param {number} lat
 * @param {number} lng
 * @param {AbortSignal} [signal]
 * @returns {Promise<string | null>} a short area label (suburb/neighbourhood/road), or null
 *   if nothing usable came back — callers should let the user type `area_name` by hand.
 */
export async function reverseGeocode(lat, lng, signal) {
  const url = `${NOMINATIM_URL}?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
  const res = await fetch(url, { signal, headers: { 'Accept-Language': 'en' } });
  if (!res.ok) throw new Error('Reverse geocode failed');

  const body = await res.json();
  const addr = body.address ?? {};
  return (
    addr.suburb ||
    addr.neighbourhood ||
    addr.road ||
    addr.village ||
    addr.town ||
    addr.city_district ||
    addr.city ||
    body.name ||
    null
  );
}
