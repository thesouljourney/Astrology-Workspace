/**
 * Egyptian Terms (Bounds) — the five-planet, unequal-degree subdivision of
 * each sign, NOT the later Ptolemaic revision (a distinct, differently
 * degreed table also sometimes loosely called "terms" in modern software —
 * this project deliberately implements the older Egyptian/Hellenistic
 * table, as the project brief specifies).
 *
 * Source/tradition: the table preserved through Vettius Valens, Firmicus
 * Maternus, Paulus Alexandrinus, and reproduced as "the Egyptian bounds" —
 * the standard used by most Hellenistic astrologers and the default in
 * most modern traditional-astrology software (contrasted with the
 * Ptolemaic variant, which reassigns several segment widths/rulers).
 *
 * VALIDATION (performed during development, documented per project rule —
 * "do not rely on an AI-generated table from memory"):
 * Cross-checked against multiple independent traditional-astrology
 * references (including a cited per-planet total-degree breakdown:
 * Saturn 57 deg, Jupiter 79 deg, Mars 66 deg, Venus 82 deg, Mercury 76 deg
 * across the full zodiac, summing to 360). This table was verified to:
 *   1. Sum to exactly 30 degrees for all twelve signs individually, and
 *   2. Match that independently-cited per-planet total-degree breakdown
 *      exactly, for all five planets.
 * Both checks passed with no discrepancy, which is strong internal
 * corroboration that this is the standard Egyptian (not Ptolemaic) table.
 *
 * Each sign's bounds cover exactly [0, 30) with no gaps and no overlaps.
 * Boundary policy (consistent with this project's existing house-cusp
 * convention in houses.js): a degree exactly on a bound's start belongs to
 * the NEW (later) bound — lower-inclusive, upper-exclusive.
 */

export const EGYPTIAN_TERMS = {
  aries: [
    { from: 0, to: 6, ruler: "jupiter" },
    { from: 6, to: 12, ruler: "venus" },
    { from: 12, to: 20, ruler: "mercury" },
    { from: 20, to: 25, ruler: "mars" },
    { from: 25, to: 30, ruler: "saturn" },
  ],
  taurus: [
    { from: 0, to: 8, ruler: "venus" },
    { from: 8, to: 14, ruler: "mercury" },
    { from: 14, to: 22, ruler: "jupiter" },
    { from: 22, to: 27, ruler: "saturn" },
    { from: 27, to: 30, ruler: "mars" },
  ],
  gemini: [
    { from: 0, to: 6, ruler: "mercury" },
    { from: 6, to: 12, ruler: "jupiter" },
    { from: 12, to: 17, ruler: "venus" },
    { from: 17, to: 24, ruler: "mars" },
    { from: 24, to: 30, ruler: "saturn" },
  ],
  cancer: [
    { from: 0, to: 7, ruler: "mars" },
    { from: 7, to: 13, ruler: "venus" },
    { from: 13, to: 19, ruler: "mercury" },
    { from: 19, to: 26, ruler: "jupiter" },
    { from: 26, to: 30, ruler: "saturn" },
  ],
  leo: [
    { from: 0, to: 6, ruler: "jupiter" },
    { from: 6, to: 11, ruler: "venus" },
    { from: 11, to: 18, ruler: "saturn" },
    { from: 18, to: 24, ruler: "mercury" },
    { from: 24, to: 30, ruler: "mars" },
  ],
  virgo: [
    { from: 0, to: 7, ruler: "mercury" },
    { from: 7, to: 17, ruler: "venus" },
    { from: 17, to: 21, ruler: "jupiter" },
    { from: 21, to: 28, ruler: "mars" },
    { from: 28, to: 30, ruler: "saturn" },
  ],
  libra: [
    { from: 0, to: 6, ruler: "saturn" },
    { from: 6, to: 14, ruler: "mercury" },
    { from: 14, to: 21, ruler: "jupiter" },
    { from: 21, to: 28, ruler: "venus" },
    { from: 28, to: 30, ruler: "mars" },
  ],
  scorpio: [
    { from: 0, to: 7, ruler: "mars" },
    { from: 7, to: 11, ruler: "venus" },
    { from: 11, to: 19, ruler: "mercury" },
    { from: 19, to: 24, ruler: "jupiter" },
    { from: 24, to: 30, ruler: "saturn" },
  ],
  sagittarius: [
    { from: 0, to: 12, ruler: "jupiter" },
    { from: 12, to: 17, ruler: "venus" },
    { from: 17, to: 21, ruler: "mercury" },
    { from: 21, to: 26, ruler: "saturn" },
    { from: 26, to: 30, ruler: "mars" },
  ],
  capricorn: [
    { from: 0, to: 7, ruler: "mercury" },
    { from: 7, to: 14, ruler: "jupiter" },
    { from: 14, to: 22, ruler: "venus" },
    { from: 22, to: 26, ruler: "saturn" },
    { from: 26, to: 30, ruler: "mars" },
  ],
  aquarius: [
    { from: 0, to: 7, ruler: "mercury" },
    { from: 7, to: 13, ruler: "venus" },
    { from: 13, to: 20, ruler: "jupiter" },
    { from: 20, to: 25, ruler: "mars" },
    { from: 25, to: 30, ruler: "saturn" },
  ],
  pisces: [
    { from: 0, to: 12, ruler: "venus" },
    { from: 12, to: 16, ruler: "jupiter" },
    { from: 16, to: 19, ruler: "mercury" },
    { from: 19, to: 28, ruler: "mars" },
    { from: 28, to: 30, ruler: "saturn" },
  ],
};

/**
 * Ruler of the Egyptian term/bound occupied by `degreeInSign` (0-30) in `sign`.
 * Lower-inclusive, upper-exclusive at each bound (see module doc comment).
 * @param {string} sign
 * @param {number} degreeInSign 0 <= degreeInSign < 30
 * @returns {string} planet key
 */
export function getTermRuler(sign, degreeInSign) {
  const bounds = EGYPTIAN_TERMS[sign];
  if (!bounds) throw new Error(`Unknown sign: ${sign}`);

  for (const bound of bounds) {
    if (degreeInSign >= bound.from && degreeInSign < bound.to) {
      return bound.ruler;
    }
  }

  // degreeInSign === 30 exactly would fall through (belongs to the next
  // sign's 0 deg bound, not this sign) — not expected from valid input.
  throw new Error(`Degree ${degreeInSign} out of range for sign ${sign}.`);
}
