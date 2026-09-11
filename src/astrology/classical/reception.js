/**
 * Reception — Phase 3E.
 *
 * RULE LOGIC ONLY, reusing the exact locked Phase 3A dignity tables
 * (domicile via rules/rulership.js, exaltation via rules/exaltation.js,
 * Dorothean triplicity via rules/triplicity.js, Egyptian terms via
 * rules/egyptianTerms.js, Chaldean faces via rules/chaldeanFaces.js) and
 * the Phase 3B chart sect. No new dignity table is created anywhere in
 * this module — getExaltationRuler() below only inverts the existing
 * locked EXALTATION table (planet -> sign) into a sign -> planet lookup;
 * it adds no new data.
 *
 * DIRECTION (cross-checked against two independent sources: Wikipedia's
 * "Reception (astrology)" and Kerykeion's traditional-reception
 * reference, both consistent with each other and with William Lilly's
 * traditional usage): if planet A occupies a sign/degree dignified by
 * planet B, B RECEIVES A — never the reverse. "Sun in Libra" -> Venus
 * (Libra's domicile ruler) receives the Sun, not "the Sun receives
 * Venus". Confirmed for all five dignity types, not domicile alone.
 *
 * FIVE DIGNITIES: reception through domicile, exaltation, triplicity,
 * term, and face is treated equally, per both sources above and
 * Skyscript's forum consensus — no disagreement found about which
 * dignities carry reception. One secondary source (astrolearn.com)
 * suggests some authors weight minor-dignity-only (triplicity/term/face)
 * mutual receptions as needing at least two minor dignities active to be
 * considered "valid" in judgment practice. This project's brief
 * explicitly specifies NOT requiring matching or multiple dignity types
 * for reception or mutual reception, so that additional weighting is not
 * applied here — disclosed for transparency in the Phase 3E report, not
 * silently omitted.
 *
 * Self-reception (a planet in its own dignity, e.g. Sun in Leo) is
 * excluded throughout — reception is a relationship between two
 * different planets, and the brief's matrix explicitly excludes self.
 *
 * NO SCORE, NO negative reception (detriment/fall), NO receptionLevel
 * label anywhere in this module, per the project brief (Parts H/I/J).
 */

import { getDispositor } from "./rules/rulership.js";
import { EXALTATION } from "./rules/exaltation.js";
import { getTriplicityInfo } from "./rules/triplicity.js";
import { getTermRuler } from "./rules/egyptianTerms.js";
import { getFaceRuler } from "./rules/chaldeanFaces.js";
import { TRADITIONAL_PLANETS } from "./essentialDignity.js";

/** Planet exalted in `sign`, or null. Pure inversion of the locked EXALTATION table — no new data. */
function getExaltationRuler(sign) {
  const entry = Object.entries(EXALTATION).find(([, info]) => info.sign === sign);
  return entry ? entry[0] : null;
}

/**
 * The ruling planet for a placement (sign + degree + sect), one per
 * dignity type — i.e. "whoever receives an occupant of this exact spot,
 * and through which dignity."
 * @param {object} params
 * @param {string} params.sign
 * @param {number} params.degreeInSign
 * @param {"day"|"night"} params.sect chart sect (Phase 3B, reused verbatim)
 * @returns {{domicile:string|null, exaltation:string|null, triplicity:string|null, term:string, face:string}}
 */
export function getDignityRulersAt({ sign, degreeInSign, sect }) {
  return {
    domicile: getDispositor(sign) ?? null,
    exaltation: getExaltationRuler(sign),
    triplicity: getTriplicityInfo(sign, sect).activeRuler,
    term: getTermRuler(sign, degreeInSign),
    face: getFaceRuler(sign, degreeInSign),
  };
}

/**
 * Builds the full directional reception matrix for the seven traditional
 * planets in one chart — every ordered non-self pair, each with the list
 * of dignity types (possibly empty) through which the receiver receives
 * the received planet.
 *
 * @param {Array<{planet:string, sign:string, degreeInSign:number}>} placements exactly the 7 traditional planets' actual chart placements
 * @param {"day"|"night"} sect chart sect (Phase 3B, reused verbatim)
 * @returns {Array<{receiver:string, received:string, types:string[]}>} 42 entries (7 * 6 ordered non-self pairs)
 */
export function computeReceptionMatrix(placements, sect) {
  const rulersByOccupant = {};
  for (const p of placements) {
    rulersByOccupant[p.planet] = getDignityRulersAt({ sign: p.sign, degreeInSign: p.degreeInSign, sect });
  }

  const matrix = [];
  for (const receiver of TRADITIONAL_PLANETS) {
    for (const received of TRADITIONAL_PLANETS) {
      if (receiver === received) continue;
      const rulers = rulersByOccupant[received];
      const types = Object.entries(rulers)
        .filter(([, rulerPlanet]) => rulerPlanet === receiver)
        .map(([type]) => type);
      matrix.push({ receiver, received, types });
    }
  }
  return matrix;
}

/**
 * Inverse views of the same directional matrix for one planet.
 * receives: planets THIS planet receives (this planet is the receiver).
 * receivedBy: planets that receive THIS planet (this planet is received).
 * @returns {{receives: Array<{planet:string,types:string[]}>, receivedBy: Array<{planet:string,types:string[]}>}}
 */
export function getReceptionForPlanet(matrix, planetKey) {
  const receives = matrix
    .filter((e) => e.receiver === planetKey && e.types.length > 0)
    .map((e) => ({ planet: e.received, types: e.types }));
  const receivedBy = matrix
    .filter((e) => e.received === planetKey && e.types.length > 0)
    .map((e) => ({ planet: e.receiver, types: e.types }));
  return { receives, receivedBy };
}

/**
 * All mutual-reception pairs actually present in the matrix — computed,
 * never assumed. Each unordered pair {A,B} is tested once; A receives B
 * and B receives A may be through the same dignity type or different
 * ones (not required to match, per the project brief).
 * @param {Array<{receiver:string, received:string, types:string[]}>} matrix
 * @returns {Array<{planetA:string, planetB:string, aReceivesB:{types:string[]}, bReceivesA:{types:string[]}, isMutual:true}>}
 */
export function computeMutualReceptions(matrix) {
  const results = [];
  for (let i = 0; i < TRADITIONAL_PLANETS.length; i++) {
    for (let j = i + 1; j < TRADITIONAL_PLANETS.length; j++) {
      const a = TRADITIONAL_PLANETS[i];
      const b = TRADITIONAL_PLANETS[j];
      const aReceivesB = matrix.find((e) => e.receiver === a && e.received === b)?.types ?? [];
      const bReceivesA = matrix.find((e) => e.receiver === b && e.received === a)?.types ?? [];
      if (aReceivesB.length === 0 || bReceivesA.length === 0) continue;
      results.push({
        planetA: a,
        planetB: b,
        aReceivesB: { types: aReceivesB },
        bReceivesA: { types: bReceivesA },
        isMutual: true,
      });
    }
  }
  return results;
}
