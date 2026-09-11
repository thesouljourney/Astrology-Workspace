/**
 * Classical Aspects, Application & Separation — Phase 3F.
 *
 * RULE/GEOMETRY LOGIC ONLY over already-verified Phase 1 longitudes and
 * Phase 3B/3C signed longitude speeds (`speedDegPerDay`) — no new
 * astronomical calculation. `shortestAngularDistance` is reused verbatim
 * from `angleProximity.js` (Phase 3C), not re-implemented.
 *
 * SCOPE: this module computes aspect geometry and relative-motion
 * applying/separating status only. It does NOT judge horary perfection,
 * Translation/Collection of Light, Prohibition, Frustration, Void of
 * Course, or any interpretive outcome — see README for the full list of
 * what is deliberately deferred.
 *
 * FIVE CLASSICAL MAJOR ASPECTS ONLY (Ptolemy's five, cross-checked
 * against renaissanceastrology.com's summary of Ptolemaic aspects and
 * multiple traditional glossaries — no disagreement found on the set
 * itself): conjunction 0 deg, sextile 60 deg, square 90 deg, trine
 * 120 deg, opposition 180 deg. No modern minor aspects (semisextile,
 * semisquare, quincunx, sesquiquadrate, quintile, etc.) are implemented.
 *
 * ORB CONVENTION — a genuine sourced disagreement, resolved by explicit
 * decision, not silently: Lilly's moiety table (Christian Astrology,
 * 1647) materially disagrees with the older Ptolemaic/Porphyry orb
 * table (roughly double Lilly's values for several planets). This was
 * reported to the project owner; the owner selected Lilly's table (see
 * `rules/planetaryMoiety.js`), consistent with this project's existing
 * Lilly-based conventions in Phase 3B/3C. Allowed orb for a pair = sum
 * of the two planets' moieties (the traditional "moiety technique").
 *
 * APPLYING/SEPARATING — determined ONLY from relative motion (signed
 * longitude speed), never from static longitude ordering: a small
 * forward-time numerical probe (see PROBE_DT_DAYS) projects both
 * planets forward, recomputes the wrap-safe distance from the nearest
 * aspect's exact angle, and compares. This correctly and naturally
 * handles direct/direct, direct/retrograde, both-retrograde, the
 * 359/0-degree wraparound, and opposition geometry, without any
 * retrograde special-casing (cross-checked against Skyscript's
 * "applying and separating aspects" forum discussion, which likewise
 * describes application purely in terms of the changing distance to
 * exactitude under each planet's actual motion, retrograde included).
 *
 * EXACT ASPECT — a strict numerical-equality tolerance (EXACT_EPSILON_DEGREES),
 * NOT an interpretive orb. It exists only to treat floating-point-level
 * proximity to the exact geometric angle as "exact" rather than
 * "applying by a vanishingly small amount." See EXACT_EPSILON_DEGREES below.
 *
 * SIGN-BASED VS DEGREE-BASED ASPECT — cross-checked during Phase 3F
 * research (multiple sources, including Kepler College's summary of
 * Hellenistic technique and comparative traditional-astrology articles):
 * whole-sign ("by sign") aspect doctrine predates and differs materially
 * from the later degree-based/Ptolemaic orb doctrine this project's
 * `aspect` field implements. Rather than silently picking one, both are
 * preserved as separate facts on each pair: `aspect` (degree-based, with
 * orb) and `signAspectRelation` (whole-sign, orb-free — conjunction/
 * sextile/square/trine/opposition by sign-distance only, or null for
 * signs in "aversion," i.e. one or five signs apart, which whole-sign
 * doctrine does not treat as an aspect at all).
 *
 * DEXTER/SINISTER — researched (Skyscript's glossary) and found
 * describable, but the geometry (diurnal-motion-relative "casting of
 * rays," tied to which planet is faster/primary) was judged not
 * unambiguous enough for a confident first implementation within this
 * phase's scope. DEFERRED, per the project brief's explicit preference
 * to defer rather than implement under any remaining ambiguity.
 *
 * NO SCORE, no `perfectReception`/`operativeReception` fields, no
 * horary yes/no judgment anywhere in this module.
 */

import { normalizeDegrees } from "../zodiac.js";
import { shortestAngularDistance } from "./angleProximity.js";
import { allowedOrb } from "./rules/planetaryMoiety.js";
import { TRADITIONAL_PLANETS } from "./essentialDignity.js";

export const MAJOR_ASPECTS = [
  { type: "conjunction", angle: 0 },
  { type: "sextile", angle: 60 },
  { type: "square", angle: 90 },
  { type: "trine", angle: 120 },
  { type: "opposition", angle: 180 },
];

/**
 * Strict numerical tolerance for treating an aspect as geometrically
 * "exact" — floating-point-level closeness, not an interpretive orb.
 * ~0.0003 deg is about 1 arcsecond, comfortably above this project's
 * longitude-computation floating-point noise floor and comfortably
 * below any practical orb value.
 */
export const EXACT_EPSILON_DEGREES = 0.0003;

/**
 * Small forward-time probe used only to determine the SIGN of change in
 * distance-from-exact (applying vs separating) — not a real ephemeris
 * step. The probe always measures distance to the SAME exact angle at
 * both the current and future instant (the nearest aspect is never
 * re-selected at the future point), so a 0.01 day (~14.4 minute) step
 * cannot "skip past" or reclassify which aspect is being measured. It is
 * far smaller than the time any real aspect takes to perfect, and large
 * enough that even the slowest realistic relative motion between two
 * different traditional planets (a fraction of a degree/day) produces a
 * change many orders of magnitude above float64 noise (~1e-13 deg at
 * this magnitude) — see EXACT_EPSILON_DEGREES for why no epsilon buffer
 * is used in the applying/separating comparison itself (only in the
 * separate "is the CURRENT position already exact" check).
 */
export const PROBE_DT_DAYS = 0.01;

/**
 * The nearest of the five classical major aspects to a given angular
 * separation, regardless of orb (orb filtering happens in computeAspectPair).
 * @param {number} angularSeparation degrees, [0, 180]
 * @returns {{type:string, exactAngle:number, orbFromExact:number}}
 */
export function findNearestAspect(angularSeparation) {
  let best = null;
  for (const a of MAJOR_ASPECTS) {
    const orbFromExact = Math.abs(angularSeparation - a.angle);
    if (best === null || orbFromExact < best.orbFromExact) {
      best = { type: a.type, exactAngle: a.angle, orbFromExact };
    }
  }
  return best;
}

/**
 * Whole-sign aspect relation between two sign indices (0-11), independent
 * of degree/orb. Signs 1 or 5 apart are "in aversion" under whole-sign
 * doctrine — not an aspect at all — and return null.
 * @param {number} signIndexA
 * @param {number} signIndexB
 * @returns {"conjunction"|"sextile"|"square"|"trine"|"opposition"|null}
 */
export function getSignAspectRelation(signIndexA, signIndexB) {
  const raw = Math.abs(signIndexA - signIndexB) % 12;
  const signDistance = Math.min(raw, 12 - raw); // 0-6
  switch (signDistance) {
    case 0:
      return "conjunction";
    case 2:
      return "sextile";
    case 3:
      return "square";
    case 4:
      return "trine";
    case 6:
      return "opposition";
    default:
      return null; // 1 or 5 signs apart: aversion, no whole-sign aspect
  }
}

/**
 * Relative-motion applying/separating/exact status toward one specific
 * exact aspect angle, via the forward-time probe described above.
 * @param {object} params
 * @param {number} params.lonA
 * @param {number} params.speedA signed deg/day (negative = retrograde)
 * @param {number} params.lonB
 * @param {number} params.speedB signed deg/day (negative = retrograde)
 * @param {number} params.exactAngle
 * @returns {"applying"|"separating"|"exact"}
 */
export function computeAspectMotion({ lonA, speedA, lonB, speedB, exactAngle }) {
  const currentSeparation = shortestAngularDistance(lonA, lonB);
  const currentOrbFromExact = Math.abs(currentSeparation - exactAngle);

  if (currentOrbFromExact <= EXACT_EPSILON_DEGREES) return "exact";

  const futureLonA = normalizeDegrees(lonA + speedA * PROBE_DT_DAYS);
  const futureLonB = normalizeDegrees(lonB + speedB * PROBE_DT_DAYS);
  const futureSeparation = shortestAngularDistance(futureLonA, futureLonB);
  const futureOrbFromExact = Math.abs(futureSeparation - exactAngle);

  // No epsilon buffer here: EXACT_EPSILON_DEGREES governs only whether the
  // CURRENT position is already at the exact angle (checked above), per
  // Part I — "exact" must never be returned merely because the rate of
  // change between the two probe points is small. A genuine exact tie
  // (futureOrbFromExact === currentOrbFromExact) is not reachable in
  // practice for two distinct planets at float64 precision; "separating"
  // is a deterministic, documented tie-break if it ever occurred.
  if (futureOrbFromExact < currentOrbFromExact) return "applying";
  return "separating";
}

/**
 * Full technical aspect pair for two traditional planets. See module doc
 * comment for the meaning of each field.
 * @param {object} params
 * @param {string} params.planetA
 * @param {number} params.lonA
 * @param {number} params.speedA
 * @param {number} params.signIndexA
 * @param {string} params.planetB
 * @param {number} params.lonB
 * @param {number} params.speedB
 * @param {number} params.signIndexB
 * @returns {object}
 */
export function computeAspectPair({ planetA, lonA, speedA, signIndexA, planetB, lonB, speedB, signIndexB }) {
  const angularSeparation = shortestAngularDistance(lonA, lonB);
  const nearest = findNearestAspect(angularSeparation);
  const allowedAspectOrb = allowedOrb(planetA, planetB);
  const isWithinOrb = nearest.orbFromExact <= allowedAspectOrb;

  const motionStatus = isWithinOrb
    ? computeAspectMotion({ lonA, speedA, lonB, speedB, exactAngle: nearest.exactAngle })
    : null;

  const aspect = {
    type: isWithinOrb ? nearest.type : null,
    exactAngle: nearest.exactAngle,
    angularSeparation,
    orbFromExact: nearest.orbFromExact,
    allowedOrb: allowedAspectOrb,
    isWithinOrb,
  };

  const motion = {
    planetASpeed: speedA,
    planetBSpeed: speedB,
    status: motionStatus,
  };

  const perfectionCandidate = {
    isApplying: motionStatus === "applying",
    currentOrb: aspect.orbFromExact,
    relativeMotionSupportsPerfection: motionStatus === "applying" || motionStatus === "exact",
  };

  const signAspectRelation = getSignAspectRelation(signIndexA, signIndexB);

  return { planetA, planetB, aspect, signAspectRelation, motion, perfectionCandidate };
}

/**
 * All 21 unordered pairs among the seven traditional planets.
 * @param {Array<{planet:string, longitude:number, speedDegPerDay:number, signIndex:number}>} placements
 * @returns {Array<object>} 21 pair objects, shape per computeAspectPair()
 */
export function computeAspectMatrix(placements) {
  const byPlanet = Object.fromEntries(placements.map((p) => [p.planet, p]));
  const pairs = [];
  for (let i = 0; i < TRADITIONAL_PLANETS.length; i++) {
    for (let j = i + 1; j < TRADITIONAL_PLANETS.length; j++) {
      const a = byPlanet[TRADITIONAL_PLANETS[i]];
      const b = byPlanet[TRADITIONAL_PLANETS[j]];
      pairs.push(
        computeAspectPair({
          planetA: a.planet,
          lonA: a.longitude,
          speedA: a.speedDegPerDay,
          signIndexA: a.signIndex,
          planetB: b.planet,
          lonB: b.longitude,
          speedB: b.speedDegPerDay,
          signIndexB: b.signIndex,
        }),
      );
    }
  }
  return pairs;
}
