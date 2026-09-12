/**
 * The 12 sidereal Rashis (Jyotish zodiac signs) — Phase 4A.
 *
 * Each Rashi spans exactly 30 degrees of SIDEREAL longitude, in the
 * traditional fixed order (cross-checked against multiple standard
 * Jyotish references — no disagreement found on the set or order
 * itself, unlike the ayanamsha question). This module performs no
 * astronomical calculation; it is a pure lookup over an already-computed
 * sidereal longitude, exactly mirroring how `zodiac.js`'s
 * `getZodiacSign()` works for the tropical signs (Phase 1) — kept as a
 * separate table, never merged with `ZODIAC_SIGNS`, since Rashi names
 * and the sidereal/tropical distinction must never be conflated.
 */

import { normalizeDegrees } from "../zodiac.js";

export const DEGREES_PER_RASHI = 30;

export const RASHIS = [
  { index: 0, key: "aries", name: "Aries" },
  { index: 1, key: "taurus", name: "Taurus" },
  { index: 2, key: "gemini", name: "Gemini" },
  { index: 3, key: "cancer", name: "Cancer" },
  { index: 4, key: "leo", name: "Leo" },
  { index: 5, key: "virgo", name: "Virgo" },
  { index: 6, key: "libra", name: "Libra" },
  { index: 7, key: "scorpio", name: "Scorpio" },
  { index: 8, key: "sagittarius", name: "Sagittarius" },
  { index: 9, key: "capricorn", name: "Capricorn" },
  { index: 10, key: "aquarius", name: "Aquarius" },
  { index: 11, key: "pisces", name: "Pisces" },
];

/**
 * Resolves the Rashi and degree-within-Rashi for a sidereal longitude.
 * @param {number} siderealLongitude 0-360 (normalized internally)
 * @returns {{rashi: object, rashiIndex: number, degreeWithinRashi: number, degreeFormatted: string}}
 */
export function getRashi(siderealLongitude) {
  const longitude = normalizeDegrees(siderealLongitude);
  const rashiIndex = Math.min(11, Math.floor(longitude / DEGREES_PER_RASHI));
  const degreeWithinRashi = longitude - rashiIndex * DEGREES_PER_RASHI;
  return {
    rashi: RASHIS[rashiIndex],
    rashiIndex,
    degreeWithinRashi,
    degreeFormatted: formatDegreeDMS(degreeWithinRashi),
  };
}

/** "02°07'12.3\"" style formatting, matching this project's existing DMS conventions. */
export function formatDegreeDMS(degree) {
  const d = Math.floor(degree);
  const minFull = (degree - d) * 60;
  const m = Math.floor(minFull);
  const s = (minFull - m) * 60;
  return `${String(d).padStart(2, "0")}°${String(m).padStart(2, "0")}'${s.toFixed(1)}"`;
}
