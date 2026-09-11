/**
 * Dorothean triplicity rulers.
 *
 * Source/tradition: Dorotheus of Sidon (1st century CE, "Carmen
 * Astrologicum"), the earliest fully-preserved triplicity scheme and the
 * one this project's Phase 3A brief specifies. Distinct from Ptolemy's
 * later, simpler day/night-only scheme (no participating ruler) and from
 * William Lilly's Renaissance variant (which alters several assignments) —
 * this project uses Dorotheus's specifically, chosen by the project brief,
 * not silently substituted for either alternative.
 *
 * Cross-checked during development against multiple independent
 * traditional-astrology sources for all four elements and all three roles
 * (day/night/participating) — no disagreement found among sources
 * specifically describing the Dorothean scheme (Ptolemy's and Lilly's
 * differing schemes are a separate, known historical variation, not an
 * ambiguity within "Dorothean" itself).
 */

export const SIGN_ELEMENT = {
  aries: "fire", leo: "fire", sagittarius: "fire",
  taurus: "earth", virgo: "earth", capricorn: "earth",
  gemini: "air", libra: "air", aquarius: "air",
  cancer: "water", scorpio: "water", pisces: "water",
};

export const TRIPLICITY_RULERS = {
  fire: { day: "sun", night: "jupiter", participating: "saturn" },
  earth: { day: "venus", night: "moon", participating: "mars" },
  air: { day: "saturn", night: "mercury", participating: "jupiter" },
  water: { day: "venus", night: "mars", participating: "moon" },
};

/**
 * @param {string} sign
 * @param {"day"|"night"} sect
 * @returns {{element:string, dayRuler:string, nightRuler:string, participatingRuler:string, activeRuler:string}}
 */
export function getTriplicityInfo(sign, sect) {
  const element = SIGN_ELEMENT[sign];
  const rulers = TRIPLICITY_RULERS[element];
  const activeRuler = sect === "day" ? rulers.day : rulers.night;
  return {
    element,
    dayRuler: rulers.day,
    nightRuler: rulers.night,
    participatingRuler: rulers.participating,
    activeRuler,
  };
}
