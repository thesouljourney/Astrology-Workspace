/**
 * Classical essential dignity engine — Phase 3A.
 *
 * This is a RULE LAYER only. It consumes the already-verified Tropical
 * planetary longitudes/signs/houses produced by the Phase 1/2 astronomical
 * data layer (src/astrology/planets.js, houses.js, ephemeris.js) and
 * applies traditional dignity/debility rules on top. No astronomical
 * calculation happens here, and nothing here re-derives a longitude, a
 * house, or a sect determination that already exists upstream.
 *
 * Applies ONLY to the seven traditional planets (Sun, Moon, Mercury,
 * Venus, Mars, Jupiter, Saturn) — never to Uranus/Neptune/Pluto,
 * asteroids, or any Phase 2 calculated point.
 *
 * Dignities are evaluated independently (they stack, they are not
 * mutually exclusive if/else branches): a planet can simultaneously be in
 * Detriment and have Term dignity, for example.
 */

import { isDomicile, isDetriment, getDispositor } from "./rules/rulership.js";
import { isExalted, isFall, EXALTATION, getFall } from "./rules/exaltation.js";
import { getTriplicityInfo } from "./rules/triplicity.js";
import { getTermRuler } from "./rules/egyptianTerms.js";
import { getFaceRuler } from "./rules/chaldeanFaces.js";

export const TRADITIONAL_PLANETS = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"];

export const SCORES = {
  domicile: 5,
  exaltation: 4,
  triplicity: 3,
  term: 2,
  face: 1,
  detriment: -5,
  fall: -4,
};

/**
 * Computes the full essential dignity result for one traditional planet.
 *
 * @param {object} params
 * @param {string} params.planetKey one of TRADITIONAL_PLANETS
 * @param {string} params.sign lowercase sign key (e.g. "scorpio")
 * @param {number} params.absoluteLongitude
 * @param {number} params.degreeInSign 0 <= degreeInSign < 30
 * @param {number|null} params.house
 * @param {"day"|"night"} params.sect
 * @returns {object} structured dignity result (see module usage / README for shape)
 */
export function computeEssentialDignity({ planetKey, sign, absoluteLongitude, degreeInSign, house, sect }) {
  if (!TRADITIONAL_PLANETS.includes(planetKey)) {
    throw new Error(`Essential dignity only applies to the seven traditional planets. Received: "${planetKey}".`);
  }

  // --- Domicile ---
  const domicileActive = isDomicile(planetKey, sign);
  const domicile = { active: domicileActive, score: domicileActive ? SCORES.domicile : 0 };

  // --- Exaltation (sign-only for Phase 3A; the exaltation degree is
  // metadata, never an orb requirement, per the project brief) ---
  const exaltationActive = isExalted(planetKey, sign);
  const exInfo = EXALTATION[planetKey];
  const exaltation = {
    active: exaltationActive,
    score: exaltationActive ? SCORES.exaltation : 0,
    exaltationSign: exInfo?.sign ?? null,
    exaltationDegree: exInfo?.degree ?? null,
  };

  // --- Triplicity (sect-dependent; only the active sect ruler scores) ---
  const triInfo = getTriplicityInfo(sign, sect);
  const triplicityActive = triInfo.activeRuler === planetKey;
  const triplicity = {
    active: triplicityActive,
    score: triplicityActive ? SCORES.triplicity : 0,
    element: triInfo.element,
    sect,
    dayRuler: triInfo.dayRuler,
    nightRuler: triInfo.nightRuler,
    participatingRuler: triInfo.participatingRuler,
    activeRuler: triInfo.activeRuler,
  };

  // --- Term (Egyptian bounds) ---
  const termRulerName = getTermRuler(sign, degreeInSign);
  const termActive = termRulerName === planetKey;
  const term = { ruler: termRulerName, active: termActive, score: termActive ? SCORES.term : 0 };

  // --- Face (Chaldean decan) ---
  const faceRulerName = getFaceRuler(sign, degreeInSign);
  const faceActive = faceRulerName === planetKey;
  const face = { ruler: faceRulerName, active: faceActive, score: faceActive ? SCORES.face : 0 };

  // --- Detriment ---
  const detrimentActive = isDetriment(planetKey, sign);
  const detriment = { active: detrimentActive, score: detrimentActive ? SCORES.detriment : 0 };

  // --- Fall ---
  const fallActive = isFall(planetKey, sign);
  const fallInfo = getFall(planetKey);
  const fall = {
    active: fallActive,
    score: fallActive ? SCORES.fall : 0,
    fallSign: fallInfo?.sign ?? null,
    fallDegree: fallInfo?.degree ?? null,
  };

  // --- Peregrine: none of the five POSITIVE dignities active.
  // Detriment/Fall never determine this on their own. ---
  const peregrine = !(domicileActive || exaltationActive || triplicityActive || termActive || faceActive);

  const totalEssentialScore =
    domicile.score + exaltation.score + triplicity.score + term.score + face.score + detriment.score + fall.score;

  return {
    planet: planetKey,
    placement: { sign, absoluteLongitude, degreeInSign, house },
    dignity: { domicile, exaltation, triplicity, term, face, detriment, fall },
    peregrine,
    immediateDispositor: getDispositor(sign),
    totalEssentialScore,
  };
}
