/**
 * Accidental / operational condition — Phase 3C.
 *
 * "How much practical ability does the planet have to act?"
 *
 * This is a rule layer over already-verified upstream data only:
 *   - house / longitude: Phase 1 (houses.js, planets.js) — unchanged
 *   - angles (ASC/MC/IC/DSC): Phase 1 (houses.js) — unchanged
 *   - motion, solar condition, sect condition, horizon: Phase 3B
 *     (planetaryCondition.js) — reused verbatim, never recalculated
 *
 * Deliberately produces NO combined score (no accidentalScore,
 * operationalScore, strengthScore, totalClassicalScore) — Phase 3A's
 * essential dignity score is untouched and remains the only score in the
 * codebase. The human astrologer combines these technical facts; this
 * module does not.
 */

import { getHouseClass } from "./rules/angularity.js";
import { computeAngleProximity } from "./angleProximity.js";
import { computeSpeedCondition } from "./rules/planetarySpeed.js";

/**
 * @param {object} params
 * @param {string} params.planetKey
 * @param {number} params.house already-verified Phase 1 house number (1-12)
 * @param {number} params.longitude planet's absolute ecliptic longitude
 * @param {{asc:number, mc:number, ic:number, desc:number}} params.angles Phase 1 angle longitudes
 * @param {object} params.phase3bCondition the `condition` object already computed in Phase 3B
 * @returns {object} operationalCondition (see module doc / README for shape)
 */
export function computeOperationalCondition({ planetKey, house, longitude, angles, phase3bCondition }) {
  const housePosition = { house, class: getHouseClass(house) };

  const { distanceToAngles, nearestAngle } = computeAngleProximity(longitude, angles);
  const angleProximity = { ...distanceToAngles, nearestAngle };

  const motion = {
    direction: phase3bCondition.motion.direction,
    longitudeSpeed: phase3bCondition.motion.longitudeSpeed,
  };

  const speed = computeSpeedCondition(planetKey, phase3bCondition.motion.longitudeSpeed);

  const solar = phase3bCondition.solar
    ? { status: phase3bCondition.solar.condition, elongationDegrees: phase3bCondition.solar.elongation }
    : null;

  const sect = {
    chartSect: phase3bCondition.chartSect,
    family: phase3bCondition.sect.family,
    mercuryPhase: phase3bCondition.sect.mercuryPhase,
    effectiveSect: phase3bCondition.sect.effectiveSect,
    isOfSect: phase3bCondition.sect.isOfSect,
  };

  const horizon = {
    altitudeDegrees: phase3bCondition.horizon.altitude,
    hemisphere: phase3bCondition.horizon.isAboveHorizon ? "above_horizon" : "below_horizon",
  };

  return { housePosition, angleProximity, motion, speed, solar, sect, horizon };
}
