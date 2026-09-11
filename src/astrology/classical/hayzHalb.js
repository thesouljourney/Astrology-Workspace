/**
 * Hayz, Halb, and the full traditional sect-condition summary.
 *
 * RULE LOGIC ONLY — consumes already-verified upstream data:
 *   - chartSect, effectiveSect (incl. Mercury's oriental/occidental
 *     phase), isOfSect: Phase 3B (planetaryCondition.js) — not recomputed
 *   - isAboveHorizon, altitudeDegrees: Phase 3B's real geometric horizon
 *     altitude (astronomy-engine Equator()+Horizon()) — NOT house number
 *   - sign: Phase 1 (already-verified placement)
 *
 * HAYZ (per this project's brief, cross-checked during development
 * against multiple traditional sources — e.g. Skyscript's glossary and
 * William Lilly's original "Christian Astrology" formulation — which
 * agree on this exact three-part test):
 *   Diurnal planet:  chart is DAY   AND above horizon AND masculine sign
 *   Nocturnal planet: chart is NIGHT AND below horizon AND feminine sign
 * Each of the three conditions is evaluated and reported independently
 * (chartSectMatches / hemisphereMatches / signGenderMatches), not just
 * the final boolean, so a non-Hayz planet's specific failing condition(s)
 * are always visible.
 *
 * HALB — A NOTED TERMINOLOGY DIFFERENCE, NOT CHOSEN SILENTLY: during
 * development, at least one other reputable source (John Frawley, "The
 * Horary Textbook", as summarized in Skyscript's glossary) uses "Halb"
 * simply as a synonym for the HEMISPHERE condition alone (a diurnal
 * planet above the earth by day, or a nocturnal planet below the earth
 * by night) — under that definition, a planet in full Hayz is *also* in
 * Halb (Hayz is a subset of Halb, not a separate category from it).
 * This project's brief explicitly defines a DIFFERENT, narrower,
 * project-specific "Halb" instead — the intermediate condition where the
 * hemisphere matches but sign gender does NOT, deliberately made mutually
 * exclusive with Hayz. That explicit definition is what is implemented
 * here. This is a real difference from at least one traditional source,
 * disclosed here and in the Phase 3D report rather than hidden.
 *
 * Halb (this project's definition):
 *   chart sect matches effective sect, AND hemisphere matches, AND
 *   sign gender does NOT match (i.e. would-be Hayz minus the gender leg).
 *   By construction, isHayz and isHalb can never both be true (they
 *   differ on the signGenderMatches condition).
 *
 * NO SCORE of any kind is produced anywhere in this module.
 */

import { getSignGender } from "./rules/signGender.js";

/**
 * @param {object} params
 * @param {string} params.sign lowercase sign key
 * @param {"day"|"night"} params.chartSect
 * @param {"diurnal"|"nocturnal"} params.effectiveSect already-verified (Phase 3B; Mercury uses its oriental/occidental result)
 * @param {boolean} params.isOfSect already-verified (Phase 3B)
 * @param {boolean} params.isAboveHorizon already-verified (Phase 3B, real geometric altitude)
 * @param {number} params.altitudeDegrees already-verified (Phase 3B)
 * @returns {object} sectConditionDetail (see module doc comment for shape)
 */
export function computeSectConditionDetail({ sign, chartSect, effectiveSect, isOfSect, isAboveHorizon, altitudeDegrees }) {
  const signGender = getSignGender(sign);

  const hemisphereMatches = effectiveSect === "diurnal" ? isAboveHorizon : !isAboveHorizon;
  const signGenderMatches = effectiveSect === "diurnal" ? signGender === "masculine" : signGender === "feminine";
  const chartSectMatches = isOfSect;

  const isHayz = chartSectMatches && hemisphereMatches && signGenderMatches;
  const isHalb = chartSectMatches && hemisphereMatches && !signGenderMatches;

  let sectConditionLabel;
  if (isHayz) sectConditionLabel = "hayz";
  else if (isHalb) sectConditionLabel = "halb";
  else if (isOfSect) sectConditionLabel = "of_sect_only";
  else sectConditionLabel = "out_of_sect";

  return {
    chartSect,
    effectiveSect,
    isOfSect,
    signGender,
    horizon: { isAboveHorizon, altitudeDegrees },
    hayz: { isHayz, chartSectMatches, hemisphereMatches, signGenderMatches },
    halb: { isHalb },
    sectConditionLabel,
  };
}
