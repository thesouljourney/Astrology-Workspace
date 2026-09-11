/**
 * Planetary moiety (half-orb) table — Phase 3F.
 *
 * Source: William Lilly, "Christian Astrology" (1647). During Phase 3F's
 * required reference validation, a genuine, materially different
 * alternative was found — the older Ptolemaic/Porphyry orb table
 * (~2nd-8th century), whose values run roughly double Lilly's for
 * several planets (e.g. Sun ~15 deg vs Lilly's 8.5 deg). This was
 * reported to the project owner as a real sourced disagreement rather
 * than resolved silently; the owner selected Lilly's table, for
 * consistency with this project's existing Lilly-based conventions
 * already locked in Phase 3B (solar condition thresholds:
 * cazimi/combust/under-the-beams) and Phase 3C (traditional mean daily
 * motions, `rules/planetarySpeed.js`).
 *
 * A "moiety" is a planet's individual half-orb. Per the traditional
 * "moiety technique" (attested from Claude Dariot, 16th century, onward,
 * and consistent with Lilly's own usage of the term), the allowed orb
 * for an aspect BETWEEN two planets is the SUM of their two moieties
 * directly — not halved again, and not a single shared value.
 */

export const MOIETY_DEGREES = {
  sun: 8.5,
  moon: 6.25,
  mercury: 3.5,
  venus: 4,
  mars: 3.75,
  jupiter: 6,
  saturn: 5,
};

/** @param {string} planetKey @returns {number} the planet's moiety, in degrees */
export function getMoiety(planetKey) {
  const m = MOIETY_DEGREES[planetKey];
  if (m === undefined) {
    throw new Error(`No moiety defined for "${planetKey}" — Lilly's table covers only the seven traditional planets.`);
  }
  return m;
}

/**
 * Allowed aspect orb between two planets = sum of their moieties
 * (Lilly/Dariot moiety-sum technique).
 * @param {string} planetAKey
 * @param {string} planetBKey
 * @returns {number} degrees
 */
export function allowedOrb(planetAKey, planetBKey) {
  return getMoiety(planetAKey) + getMoiety(planetBKey);
}
