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
 * CONVENTION: hayzHalbConvention = "traditional_halb_base_hayz_full"
 * (see CLASSICAL_META in classicalChart.js). Historical authors vary in
 * their exact definitions of Halb — some (e.g. John Frawley, "The Horary
 * Textbook", as summarized in Skyscript's glossary) use it as a synonym
 * for the sect/hemisphere condition alone, with Hayz as a fuller
 * condition built on top of it (Hayz implies Halb). Others treat Halb as
 * a separate, narrower intermediate category disjoint from Hayz. This
 * project follows the former (base/full) convention as of this revision:
 *
 *   HALB = the planet is in its proper sect/hemisphere condition:
 *     chart sect matches the planet's effective sect, AND the planet is
 *     on the correct side of the horizon for that sect (diurnal: above
 *     horizon by day; nocturnal: below horizon by night).
 *
 *   HAYZ = Halb PLUS the proper sign-gender condition:
 *     diurnal planet in a masculine sign, or nocturnal planet in a
 *     feminine sign.
 *
 * Because Hayz is Halb plus one additional condition, isHayz === true
 * implies isHalb === true (Hayz is a subset of Halb, not disjoint from
 * it) — they are NOT forced mutually exclusive. A separate, mutually
 * exclusive `sectConditionLabel` ("hayz" | "halb_only" | "of_sect_only" |
 * "out_of_sect") is provided for display purposes so the UI never shows
 * confusing duplication: "halb_only" means Halb is true but Hayz is not
 * (the sign-gender leg failed).
 *
 * Each of the three underlying legs (chartSectMatches / hemisphereMatches
 * / signGenderMatches) is still reported independently, not just the
 * final booleans, so a planet's specific failing condition(s) are always
 * visible.
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

  const isHalb = chartSectMatches && hemisphereMatches;
  const isHayz = isHalb && signGenderMatches;

  let sectConditionLabel;
  if (isHayz) sectConditionLabel = "hayz";
  else if (isHalb) sectConditionLabel = "halb_only";
  else if (isOfSect) sectConditionLabel = "of_sect_only";
  else sectConditionLabel = "out_of_sect";

  return {
    chartSect,
    effectiveSect,
    isOfSect,
    signGender,
    horizon: { isAboveHorizon, altitudeDegrees },
    hayz: { isHayz, chartSectMatches, hemisphereMatches, signGenderMatches },
    halb: { isHalb, chartSectMatches, hemisphereMatches },
    sectConditionLabel,
  };
}
