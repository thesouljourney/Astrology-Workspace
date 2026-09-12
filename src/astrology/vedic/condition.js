/**
 * Vedic planetary dignity & technical condition — Phase 4D.
 *
 * SCOPE: for the seven classical Grahas, this module derives factual,
 * evidence-only dignity/condition fields from data already computed and
 * locked in earlier Vedic phases (Phase 4A's sidereal longitudes/rashi/
 * motion) plus the reference tables researched for this phase
 * (`dignityTables.js` — see that module's doc comment for the full
 * research trail, including the two Moolatrikona points that were
 * genuinely contested across sources and resolved by explicit approval
 * before this code was written). It performs no new astronomical
 * calculation and mutates no Phase 4A/4B/4C object.
 *
 * Deliberately NOT implemented here (see `chart.vedic.meta` for the
 * explicit `"not_implemented"`/`"none"` markers): temporary (Tatkalika)
 * or compound (Panchadha) friendship, Shadbala of any kind, functional
 * benefic/malefic, Yogakaraka, Maraka, Badhaka, Avasthas, any dignity or
 * strength SCORE, and any interpretation text.
 *
 * ====================================================================
 * RAHU/KETU (Part A/L)
 * ====================================================================
 * The seven classical Grahas alone receive full dignity evaluation
 * (own sign / exaltation / debilitation / Moolatrikona / natural
 * friendship / sign relationship / combustion) — none of those concepts
 * has a single, non-disputed traditional definition for the lunar nodes
 * (their "ownership," "exaltation," and "Moolatrikona" are all
 * genuinely disputed across schools, unlike the seven classical Grahas'
 * tables researched for this phase), so none is assigned. Rahu/Ketu
 * still get the factual fields that ARE well-defined for them: current
 * Rashi, degree within it, and retrograde/motion state (reusing Phase
 * 4A's own node-motion convention verbatim, never recomputed here) —
 * exposed in `chart.vedic.condition.nodes`, kept structurally separate
 * from `chart.vedic.condition.planets` so the two are never confused.
 *
 * ====================================================================
 * DIGNITY OVERLAP / DISPLAY PRECEDENCE (Part F)
 * ====================================================================
 * `isOwnSign`, `isExaltedSign`, `isDebilitatedSign`, and `isMoolatrikona`
 * are stored as fully independent booleans first — several real
 * placements make more than one of them true at once by design (e.g.
 * Mercury anywhere in Virgo is simultaneously its own sign AND its
 * exaltation sign; within Virgo 16-20 it is additionally Moolatrikona;
 * Sun within Leo 0-20 is simultaneously its own sign AND Moolatrikona).
 * `rashiDignityStatus` is a single summary label computed only AFTER
 * those booleans, using this explicit, documented precedence for the
 * categorical (non-relational) dignities — Exaltation > Moolatrikona >
 * Own Sign > Debilitation — falling through to the relational
 * classification (friend/neutral/enemy sign, from `signRelationship`)
 * only when none of the four categorical dignities apply. This is a
 * DISPLAY precedence, not the Shadbala Sthana Bala STRENGTH ordering
 * (which places Debilitation at the bottom, as a strength score, not a
 * display-priority list) — seeded by the fact that Debilitation, like
 * the other three, is a fixed property of the sign the planet is in,
 * never something a mere sign-lord relationship should override or be
 * confused with, so it is checked before falling back to the relational
 * tiers. See `dignityTables.js`'s `DIGNITY_STATUS_PRECEDENCE` export for
 * the underlying strength-ordering reference this was derived from.
 */

import { normalizeDegrees } from "../zodiac.js";
import { RASHIS } from "./rashi.js";
import { RASHI_LORDS } from "./rashiLordship.js";
import { GRAHA_DISPLAY_NAME } from "./grahaNames.js";
import {
  DIGNITY_SYSTEM,
  EXALTATION_CONVENTION,
  MOOLATRIKONA_CONVENTION,
  MOOLATRIKONA_BOUNDARY_CONVENTION,
  NATURAL_FRIENDSHIP_CONVENTION,
  COMBUSTION_CONVENTION,
  RAHU_KETU_DIGNITY_STATUS,
  CLASSICAL_GRAHA_KEYS,
  OWN_SIGNS,
  EXALTATION,
  MOOLATRIKONA,
  NATURAL_RELATIONSHIPS,
  getDebilitation,
  getCombustionThreshold,
} from "./dignityTables.js";

export const TEMPORARY_FRIENDSHIP_STATUS = "not_implemented";
export const COMPOUND_FRIENDSHIP_STATUS = "not_implemented";
export const SHADBALA_STATUS = "not_implemented";
export const CONDITION_FUNCTIONAL_LORDSHIP_STATUS = "not_implemented";
export const VEDIC_CONDITION_INTERPRETATION = "none";

function rashiIndexForKey(key) {
  return RASHIS.find((r) => r.key === key).index;
}

/** Shortest angular separation between two longitudes, always in [0, 180]. */
function angularSeparationDegrees(a, b) {
  let diff = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  if (diff > 180) diff = 360 - diff;
  return diff;
}

function signLongitude(rashiKey, degreeWithinSign) {
  return rashiIndexForKey(rashiKey) * 30 + degreeWithinSign;
}

/** Half-open [startDegree, endDegree) membership test, matching this project's Phase 4C boundary policy. */
function isWithinHalfOpenRange(degree, startDegree, endDegree) {
  return degree >= startDegree && degree < endDegree;
}

function computeRashiDignityStatus({ isExaltedSign, isMoolatrikona, isOwnSign, isDebilitatedSign, naturalRelationshipToSignLord }) {
  if (isExaltedSign) return "exaltation";
  if (isMoolatrikona) return "moolatrikona";
  if (isOwnSign) return "own_sign";
  if (isDebilitatedSign) return "debilitation";
  if (naturalRelationshipToSignLord === "friend") return "friend_sign";
  if (naturalRelationshipToSignLord === "neutral") return "neutral_sign";
  return "enemy_sign";
}

/**
 * Builds the full Phase 4D dignity/condition record for one classical Graha.
 * @param {string} planetKey one of CLASSICAL_GRAHA_KEYS
 * @param {object} graha the corresponding `chart.vedic.grahas[planetKey]` (Phase 4A)
 * @param {object} sunGraha `chart.vedic.grahas.sun` (Phase 4A), for solar elongation
 * @returns {object} see module doc comment / README for shape
 */
function buildPlanetCondition(planetKey, graha, sunGraha) {
  const rashiKey = RASHIS[graha.rashiIndex].key;
  const degreeInRashi = graha.degreeWithinRashi;

  const isOwnSign = OWN_SIGNS[planetKey].includes(rashiKey);

  const exaltation = EXALTATION[planetKey];
  const isExaltedSign = rashiKey === exaltation.rashiKey;
  const exactExaltationLongitudeSidereal = signLongitude(exaltation.rashiKey, exaltation.exactDegree);
  const distanceFromExactExaltationDegrees = angularSeparationDegrees(graha.siderealLongitude, exactExaltationLongitudeSidereal);

  const debilitation = getDebilitation(planetKey, RASHIS);
  const isDebilitatedSign = rashiKey === debilitation.rashiKey;
  const exactDebilitationLongitudeSidereal = signLongitude(debilitation.rashiKey, debilitation.exactDegree);
  const distanceFromExactDebilitationDegrees = angularSeparationDegrees(graha.siderealLongitude, exactDebilitationLongitudeSidereal);

  const moolatrikona = MOOLATRIKONA[planetKey];
  const isMoolatrikona = rashiKey === moolatrikona.rashiKey && isWithinHalfOpenRange(degreeInRashi, moolatrikona.startDegree, moolatrikona.endDegree);

  const signLordKey = RASHI_LORDS[rashiKey];
  const naturalRelationshipToSignLord =
    signLordKey === planetKey
      ? "self"
      : NATURAL_RELATIONSHIPS[planetKey].friends.includes(signLordKey)
        ? "friend"
        : NATURAL_RELATIONSHIPS[planetKey].neutrals.includes(signLordKey)
          ? "neutral"
          : "enemy";

  const rashiDignityStatus = computeRashiDignityStatus({ isExaltedSign, isMoolatrikona, isOwnSign, isDebilitatedSign, naturalRelationshipToSignLord });

  const isRetrograde = graha.motion.retrograde;

  const solarElongationDegrees = planetKey === "sun" ? 0 : angularSeparationDegrees(graha.siderealLongitude, sunGraha.siderealLongitude);
  const thresholdDegrees = planetKey === "sun" ? null : getCombustionThreshold(planetKey, isRetrograde);
  const isCombust = planetKey === "sun" ? false : solarElongationDegrees < thresholdDegrees;

  return {
    rashi: graha.rashi,
    degreeInRashi,
    dignity: {
      isOwnSign,
      isExaltedSign,
      isDebilitatedSign,
      isMoolatrikona,
      exactExaltationLongitudeSidereal,
      exactDebilitationLongitudeSidereal,
      distanceFromExactExaltationDegrees,
      distanceFromExactDebilitationDegrees,
      rashiDignityStatus,
    },
    signRelationship: {
      signLord: GRAHA_DISPLAY_NAME[signLordKey],
      naturalRelationshipToSignLord,
    },
    condition: {
      isRetrograde,
      combustion: {
        isCombust,
        solarElongationDegrees,
        thresholdDegrees,
        convention: COMBUSTION_CONVENTION,
      },
    },
  };
}

function buildNodeFactualRecord(graha) {
  return {
    rashi: graha.rashi,
    degreeInRashi: graha.degreeWithinRashi,
    isRetrograde: graha.motion.retrograde,
    dignityConvention: RAHU_KETU_DIGNITY_STATUS,
  };
}

/**
 * Builds the Phase 4D `chart.vedic.condition` structure from
 * already-locked Phase 4A Graha records — no new astronomical
 * calculation, no mutation of `grahas`.
 *
 * @param {object} params
 * @param {object} params.grahas Phase 4A `chart.vedic.grahas`
 * @returns {object} `chart.vedic.condition` (see module doc comment / README for shape)
 */
export function buildVedicCondition({ grahas }) {
  const planets = {};
  for (const key of CLASSICAL_GRAHA_KEYS) {
    planets[key] = buildPlanetCondition(key, grahas[key], grahas.sun);
  }

  const nodes = {
    rahu: buildNodeFactualRecord(grahas.rahu),
    ketu: buildNodeFactualRecord(grahas.ketu),
  };

  return {
    meta: {
      dignitySystem: DIGNITY_SYSTEM,
      exaltationConvention: EXALTATION_CONVENTION,
      moolatrikonaConvention: MOOLATRIKONA_CONVENTION,
      moolatrikonaBoundaryConvention: MOOLATRIKONA_BOUNDARY_CONVENTION,
      naturalFriendshipConvention: NATURAL_FRIENDSHIP_CONVENTION,
      combustionConvention: COMBUSTION_CONVENTION,
      rahuKetuDignity: RAHU_KETU_DIGNITY_STATUS,
      temporaryFriendship: TEMPORARY_FRIENDSHIP_STATUS,
      compoundFriendship: COMPOUND_FRIENDSHIP_STATUS,
      shadbala: SHADBALA_STATUS,
      functionalLordship: CONDITION_FUNCTIONAL_LORDSHIP_STATUS,
      interpretation: VEDIC_CONDITION_INTERPRETATION,
    },
    planets,
    nodes,
  };
}
