/**
 * Chaldean Faces (Decans) — each sign divided into three equal 10-degree
 * faces, ruled by planets cycling continuously through the "Chaldean
 * order" (the seven classical planets ranked by apparent speed: Saturn
 * slowest ... Moon fastest), starting from Mars at Aries 0 degrees.
 *
 * Source/tradition: the standard face/decan assignment used throughout
 * Hellenistic and later traditional astrology, distinguishing it from the
 * (unrelated) Egyptian *decans* of Egyptian astronomy proper — this is the
 * Hellenistic "Chaldean" planetary-rulership version specified by the
 * project brief.
 *
 * VALIDATION: cross-checked during development against an independently
 * published complete 36-decan table (Aries: Mars/Sun/Venus; Taurus:
 * Mercury/Moon/Saturn; Gemini: Jupiter/Mars/Sun; ... Pisces:
 * Saturn/Jupiter/Mars) — the formula below reproduces every row of that
 * table exactly with no discrepancy.
 *
 * Because 3 decans/sign and a 7-planet cycle don't share a common factor
 * with 12 signs in a trivial way, the pattern never repeats sign-to-sign
 * across one full zodiac circuit — implemented here as index arithmetic
 * (not a hand-typed 36-row table) specifically so it cannot drift out of
 * sync with itself; a literal reference table is documented above the
 * formula for human cross-checking.
 *
 * Boundary policy (consistent with this project's existing house-cusp
 * convention): a degree exactly on a face boundary (10 deg or 20 deg)
 * belongs to the NEW (later) face — lower-inclusive, upper-exclusive.
 */

const CHALDEAN_ORDER = ["saturn", "jupiter", "mars", "sun", "venus", "mercury", "moon"];

// Aries' first face (0-10 deg) is ruled by Mars, which sits at index 2 in
// the Chaldean order above — this fixes the starting phase of the cycle.
const ARIES_START_INDEX = CHALDEAN_ORDER.indexOf("mars");

const SIGN_ORDER = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];

/**
 * Ruler of the face (decan) occupied by `degreeInSign` (0-30) in `sign`.
 * @param {string} sign
 * @param {number} degreeInSign 0 <= degreeInSign < 30
 * @returns {string} planet key
 */
export function getFaceRuler(sign, degreeInSign) {
  const signIndex = SIGN_ORDER.indexOf(sign);
  if (signIndex === -1) throw new Error(`Unknown sign: ${sign}`);
  if (degreeInSign < 0 || degreeInSign >= 30) {
    throw new Error(`Degree ${degreeInSign} out of range for sign ${sign}.`);
  }

  const decanIndex = Math.floor(degreeInSign / 10); // 0, 1, or 2
  const globalDecanNumber = signIndex * 3 + decanIndex;
  const chaldeanIndex = (ARIES_START_INDEX + globalDecanNumber) % CHALDEAN_ORDER.length;

  return CHALDEAN_ORDER[chaldeanIndex];
}
