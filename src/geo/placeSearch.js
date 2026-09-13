/**
 * Offline Birth Place search — Production UX Refactor, Part 3.
 *
 * Data source: `src/geo/cityIndex.data.json`, a static, MIT-licensed
 * snapshot (see `scripts/generateCityIndex.mjs`) — NOT a runtime
 * geocoding API. It is dynamic-`import()`-ed (see `loadCityIndex()`
 * below) so Vite code-splits it into its own chunk, fetched only when a
 * user actually opens a Birth Place field — never part of the initial
 * app bundle.
 */

let cachedIndex = null;

/** Lazy-loads the local place dataset exactly once per session (cached across calls). */
export async function loadCityIndex() {
  if (cachedIndex) return cachedIndex;
  const mod = await import("./cityIndex.data.json");
  cachedIndex = mod.default ?? mod;
  return cachedIndex;
}

function normalize(s) {
  return String(s ?? "").toLowerCase().trim();
}

/**
 * Ranks and returns place matches for `query` against an already-loaded
 * `cityIndex` (see `loadCityIndex()`). Matches against city, province,
 * and country name; a city-name prefix match ranks above a substring
 * match, then by population (both purely a ranking heuristic — never
 * shown to the user as "the" city, only as the best-guess order of
 * results).
 *
 * @returns {Array<{city, province, country, iso2, lat, lng, timezone, label}>}
 */
export function searchPlaces(query, cityIndex, limit = 8) {
  const q = normalize(query);
  if (q.length < 2 || !Array.isArray(cityIndex)) return [];

  const scored = [];
  for (const entry of cityIndex) {
    const city = normalize(entry.city);
    const province = normalize(entry.province);
    const country = normalize(entry.country);

    let score = -1;
    if (city.startsWith(q)) score = 3;
    else if (city.includes(q)) score = 2;
    else if (province.startsWith(q) || country.startsWith(q)) score = 1;
    else if (province.includes(q) || country.includes(q)) score = 0;

    if (score >= 0) scored.push({ entry, score });
  }

  scored.sort((a, b) => b.score - a.score || (b.entry.pop ?? 0) - (a.entry.pop ?? 0));

  return scored.slice(0, limit).map(({ entry }) => ({
    city: entry.city,
    province: entry.province,
    country: entry.country,
    iso2: entry.iso2,
    lat: entry.lat,
    lng: entry.lng,
    timezone: entry.timezone,
    label: [entry.city, entry.province, entry.country].filter(Boolean).join(", "),
  }));
}
