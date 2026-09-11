/**
 * Planetary sect family — which planets are inherently "of the day" vs
 * "of the night" sect, independent of the chart's own day/night status.
 *
 * Source/tradition: the standard Hellenistic/traditional sect classification
 * (e.g. Vettius Valens, and preserved through Lilly): the two luminaries
 * and the two benefics/malefics each pair with one sect, Mercury alone is
 * "common to both" and instead follows its solar phase (see
 * mercurySect.js) rather than having a fixed family.
 *
 * NOTE (do not conflate with Hayz): "of sect" here means only that the
 * planet's own sect family matches the chart's sect (day/night). It does
 * NOT additionally require correct hemisphere, masculine/feminine sign, or
 * any other Hayz condition — those are separate, not implemented here.
 */

export const DIURNAL_PLANETS = ["sun", "jupiter", "saturn"];
export const NOCTURNAL_PLANETS = ["moon", "venus", "mars"];

/**
 * @param {string} planetKey
 * @returns {"diurnal"|"nocturnal"|"variable"} "variable" for Mercury only
 */
export function getSectFamily(planetKey) {
  if (DIURNAL_PLANETS.includes(planetKey)) return "diurnal";
  if (NOCTURNAL_PLANETS.includes(planetKey)) return "nocturnal";
  if (planetKey === "mercury") return "variable";
  throw new Error(`No sect family defined for "${planetKey}" (traditional planets only).`);
}

/**
 * Whether a planet with a given (fixed or Mercury-effective) sect family
 * is "of sect" in a chart of the given sect. This is the ONLY test
 * applied — no hemisphere/gender/Hayz condition.
 * @param {"diurnal"|"nocturnal"} effectiveFamily
 * @param {"day"|"night"} chartSect
 * @returns {boolean}
 */
export function isOfSect(effectiveFamily, chartSect) {
  return (effectiveFamily === "diurnal" && chartSect === "day") || (effectiveFamily === "nocturnal" && chartSect === "night");
}
