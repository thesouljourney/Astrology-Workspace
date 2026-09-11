/**
 * Traditional sign gender (masculine/feminine), tropical zodiac only.
 *
 * Source/tradition: Ptolemy's assignment — the six fire/air signs are
 * masculine and diurnal in nature, the six earth/water signs are feminine
 * and nocturnal. Cross-checked during development against multiple
 * traditional-astrology references (Skyscript, deVore's "Encyclopedia of
 * Astrology", and others) — fully consistent across sources, no
 * historical disagreement found for this table.
 *
 * Implemented as a direct rule table (not inferred from element at
 * runtime) so the mapping is explicit and independently verifiable.
 */

export const MASCULINE_SIGNS = ["aries", "gemini", "leo", "libra", "sagittarius", "aquarius"];
export const FEMININE_SIGNS = ["taurus", "cancer", "virgo", "scorpio", "capricorn", "pisces"];

/**
 * @param {string} sign lowercase sign key
 * @returns {"masculine"|"feminine"}
 */
export function getSignGender(sign) {
  if (MASCULINE_SIGNS.includes(sign)) return "masculine";
  if (FEMININE_SIGNS.includes(sign)) return "feminine";
  throw new Error(`Unknown sign: "${sign}".`);
}
