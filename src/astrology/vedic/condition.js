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
 * DIGNITY OVERLAP / DISPLAY PRECEDENCE (Part F, revised by a pre-lock audit)
 * ====================================================================
 * `isOwnSign`, `isExaltedSign`, `isDebilitatedSign`, `isMoolatrikona`,
 * `isExactExaltationPoint`, and `isExactDebilitationPoint` are stored as
 * fully independent booleans first, and NEVER made mutually exclusive —
 * several real placements make more than one true at once by design
 * (e.g. Mercury anywhere in Virgo is simultaneously its own sign AND its
 * exaltation sign; within Virgo 15-20 it is additionally Moolatrikona;
 * Sun within Leo 0-20 is simultaneously its own sign AND Moolatrikona).
 *
 * PRE-LOCK AUDIT FINDING: the original precedence (Exaltation >
 * Moolatrikona > Own Sign > Debilitation) was borrowed from the
 * classical Shadbala Sthana Bala STRENGTH ordering. Using a STRENGTH
 * ordering to pick a DISPLAY label is a category error: it silently hid
 * Moolatrikona for the two planets whose Moolatrikona sits inside their
 * own exaltation sign (Moon in Taurus, Mercury in Virgo) — for every
 * degree of Taurus and Virgo, `isExaltedSign` is true (a whole-sign,
 * relatively coarse fact), so it always outranked the far more specific
 * `isMoolatrikona` fact, even deep inside Mercury's Moolatrikona sub-zone
 * (e.g. Mercury at 17 Virgo showed only `"exaltation"`, never revealing
 * Moolatrikona in the summary label at all) — confirmed empirically
 * across every combination of Moon/Taurus and Mercury/Virgo degrees, and
 * confirmed NOT to affect the other five planets (whose Moolatrikona
 * sits inside their OWN sign, a fact that already correctly outranked
 * plain own-sign).
 *
 * RESOLUTION — two complementary fixes, so no dignity fact is ever lost:
 *
 * 1. `dignity.dignityLabels`: every applicable categorical dignity label
 *    that is currently true, ALL exposed together (not just one) — e.g.
 *    Mercury at 17 Virgo now reports
 *    `["moolatrikona", "exaltation", "own_sign"]`, not just one of them.
 *    This is the primary transparency mechanism: nothing is ever hidden.
 *
 * 2. `dignity.rashiDignityStatus` remains a single convenience label
 *    (`dignityLabels[0]`), but is now chosen by a SPECIFICITY precedence
 *    (`dignityTables.js`'s `DIGNITY_LABEL_SPECIFICITY_PRECEDENCE`) —
 *    narrowest/most-specific fact first, never by classical strength:
 *
 *      exact exaltation point > Moolatrikona > exaltation (whole sign) >
 *      own sign > exact debilitation point > debilitation (whole sign) >
 *      friend/neutral/enemy sign (relational, only when not own sign)
 *
 *    Under this precedence, Mercury at 17 Virgo now correctly shows
 *    `rashiDignityStatus: "moolatrikona"` (not `"exaltation"`), and the
 *    single exact exaltation/debilitation POINT (a measure-zero instant,
 *    astronomically near-impossible to land on exactly but included for
 *    completeness and for synthetic/boundary tests) outranks even
 *    Moolatrikona, since a single point is more specific than any range.
 *    Debilitation is still ranked above the relational tiers (not at the
 *    very bottom, unlike the Shadbala strength list) for the same
 *    specificity reasoning: a debilitated placement is a far more
 *    specific, notable technical fact than "ruled by an enemy" happening
 *    to also be true of the same placement — both facts remain visible
 *    in `dignityLabels` regardless of which one is `rashiDignityStatus`.
 *
 * This is a DISPLAY-COLLAPSE convenience only — every underlying boolean
 * remains independently correct and inspectable, and `dignityLabels`
 * guarantees no simultaneously-true dignity is ever erased from the
 * record, addressing the audit's core concern directly.
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
  DIGNITY_DISPLAY_POLICY,
  getDebilitation,
  getCombustionThreshold,
} from "./dignityTables.js";

/** Below this many degrees of separation, a placement is treated as sitting exactly on the single exact exaltation/debilitation point - guards against binary floating-point noise (~1e-13 degrees at these magnitudes), far below any real angular measurement. */
const EXACT_POINT_EPSILON_DEGREES = 1e-9;

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

/**
 * Every categorical/relational dignity label currently true, in
 * specificity order (most specific first - see module doc comment for
 * the pre-lock audit that established this order). Never collapses to
 * one value: `dignityLabels[0]` is the display convenience
 * (`rashiDignityStatus`), but every simultaneously-true fact stays
 * listed, so nothing is ever hidden.
 */
function computeDignityLabels({
  isExactExaltationPoint,
  isMoolatrikona,
  isExaltedSign,
  isOwnSign,
  isExactDebilitationPoint,
  isDebilitatedSign,
  naturalRelationshipToSignLord,
}) {
  const labels = [];
  if (isExactExaltationPoint) labels.push("exact_exaltation_point");
  if (isMoolatrikona) labels.push("moolatrikona");
  if (isExaltedSign) labels.push("exaltation");
  if (isOwnSign) labels.push("own_sign");
  if (isExactDebilitationPoint) labels.push("exact_debilitation_point");
  if (isDebilitatedSign) labels.push("debilitation");
  if (naturalRelationshipToSignLord !== "self") {
    labels.push(`${naturalRelationshipToSignLord}_sign`);
  }
  return labels;
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

  const isExactExaltationPoint = distanceFromExactExaltationDegrees < EXACT_POINT_EPSILON_DEGREES;
  const isExactDebilitationPoint = distanceFromExactDebilitationDegrees < EXACT_POINT_EPSILON_DEGREES;

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

  const dignityLabels = computeDignityLabels({
    isExactExaltationPoint,
    isMoolatrikona,
    isExaltedSign,
    isOwnSign,
    isExactDebilitationPoint,
    isDebilitatedSign,
    naturalRelationshipToSignLord,
  });
  const rashiDignityStatus = dignityLabels[0];

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
      isExactExaltationPoint,
      isExactDebilitationPoint,
      exactExaltationLongitudeSidereal,
      exactDebilitationLongitudeSidereal,
      distanceFromExactExaltationDegrees,
      distanceFromExactDebilitationDegrees,
      dignityLabels,
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
      dignityDisplayPolicy: DIGNITY_DISPLAY_POLICY,
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
