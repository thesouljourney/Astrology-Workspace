/**
 * Shortest zodiacal angular distance from a planet to each of the four
 * angles (ASC/IC/DSC/MC). Pure geometry over the already-verified Phase 1
 * angle longitudes (houses.js) — nothing is recalculated.
 *
 * This is METADATA ONLY: it does not promote a succedent/cadent planet to
 * angular, and no "angular orb" is defined or applied anywhere in this
 * module. House classification (angularity.js) and this proximity
 * metadata are deliberately kept as separate, independent facts.
 */

import { normalizeDegrees } from "../zodiac.js";

/**
 * Shortest angular distance between two ecliptic longitudes, in [0, 180].
 * Correctly handles the 0/360 wraparound (e.g. 359 vs 1 -> 2, not 358).
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function shortestAngularDistance(a, b) {
  const diff = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  return Math.min(diff, 360 - diff);
}

/**
 * @param {number} planetLongitude
 * @param {{asc:number, mc:number, ic:number, desc:number}} angles absolute longitudes
 * @returns {{
 *   distanceToAngles: { asc:number, ic:number, dsc:number, mc:number },
 *   nearestAngle: { angle: "ASC"|"IC"|"DSC"|"MC", distanceDegrees: number }
 * }}
 */
export function computeAngleProximity(planetLongitude, angles) {
  const distanceToAngles = {
    asc: shortestAngularDistance(planetLongitude, angles.asc),
    ic: shortestAngularDistance(planetLongitude, angles.ic),
    dsc: shortestAngularDistance(planetLongitude, angles.desc),
    mc: shortestAngularDistance(planetLongitude, angles.mc),
  };

  const entries = [
    { angle: "ASC", distanceDegrees: distanceToAngles.asc },
    { angle: "IC", distanceDegrees: distanceToAngles.ic },
    { angle: "DSC", distanceDegrees: distanceToAngles.dsc },
    { angle: "MC", distanceDegrees: distanceToAngles.mc },
  ];

  const nearestAngle = entries.reduce((best, cur) => (cur.distanceDegrees < best.distanceDegrees ? cur : best));

  return { distanceToAngles, nearestAngle };
}
