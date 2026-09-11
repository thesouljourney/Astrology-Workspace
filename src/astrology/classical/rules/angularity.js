/**
 * House angularity classification — a purely structural grouping of the
 * (already verified, unchanged) house number. No new house-placement
 * logic: this consumes `planet.house` exactly as produced by the locked
 * Phase 1 house engine (houses.js / getHouseForLongitude), including its
 * existing cusp-boundary policy (a planet exactly on a cusp belongs to
 * the house that begins there).
 *
 * Source/tradition: the standard angular/succedent/cadent grouping used
 * throughout traditional astrology — universally agreed, no historical
 * ambiguity to report here.
 *
 * No strength score is assigned at this phase.
 */

export const ANGULAR_HOUSES = [1, 4, 7, 10];
export const SUCCEDENT_HOUSES = [2, 5, 8, 11];
export const CADENT_HOUSES = [3, 6, 9, 12];

/**
 * @param {number} house 1-12, from the already-verified Phase 1 house engine
 * @returns {"angular"|"succedent"|"cadent"}
 */
export function getHouseClass(house) {
  if (ANGULAR_HOUSES.includes(house)) return "angular";
  if (SUCCEDENT_HOUSES.includes(house)) return "succedent";
  if (CADENT_HOUSES.includes(house)) return "cadent";
  throw new Error(`Invalid house number: ${house}. Expected 1-12.`);
}
