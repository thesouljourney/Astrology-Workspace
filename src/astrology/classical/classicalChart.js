/**
 * Assembles chart.classical on top of an already-computed Phase 1/2 chart.
 * Reuses the verified planet/house/sect data — sect in particular is not
 * recomputed here; it is read from the already-computed Part of Fortune
 * point (which already determines it from the Sun's real astronomical
 * altitude — see partOfFortune.js), so there is exactly one sect
 * computation in the whole codebase, not two.
 */

import { computeEssentialDignity, TRADITIONAL_PLANETS } from "./essentialDignity.js";
import { computePlanetaryCondition } from "./planetaryCondition.js";
import { computeOperationalCondition } from "./accidentalCondition.js";
import { SPEED_CONVENTION } from "./rules/planetarySpeed.js";
import { computeSectConditionDetail } from "./hayzHalb.js";

export const CLASSICAL_META = {
  zodiacType: "tropical",
  rulershipSystem: "traditional",
  triplicitySystem: "dorothean",
  termSystem: "egyptian",
  faceSystem: "chaldean",
  speedConvention: SPEED_CONVENTION,
};

/**
 * @param {object} params
 * @param {object} params.chart a full Phase 1/2 chart, as returned by calculateChart() (minus chart.classical)
 * @param {import("astronomy-engine").AstroTime} params.astroTime
 * @param {number} params.latitude
 * @param {number} params.longitude geographic longitude, east positive
 * @returns {object} { meta, sect, planets: [...] }
 */
export function buildClassicalChart({ chart, astroTime, latitude, longitude }) {
  const partOfFortune = chart.points.find((p) => p.id === "partOfFortune");
  const sect = partOfFortune.meta.sect;
  const sunLongitude = chart.planets.find((pl) => pl.key === "sun").longitude;

  const planets = TRADITIONAL_PLANETS.map((key) => {
    const p = chart.planets.find((pl) => pl.key === key);
    const dignityResult = computeEssentialDignity({
      planetKey: key,
      sign: p.sign.key,
      absoluteLongitude: p.longitude,
      degreeInSign: p.degreeInSign,
      house: p.house,
      sect,
    });

    const condition = computePlanetaryCondition({
      planetKey: key,
      longitude: p.longitude,
      speedDegPerDay: p.speedDegPerDay,
      retrograde: p.retrograde,
      sunLongitude,
      chartSect: sect,
      astroTime,
      latitude,
      longitudeEast: longitude,
    });

    const operationalCondition = computeOperationalCondition({
      planetKey: key,
      house: p.house,
      longitude: p.longitude,
      angles: {
        asc: chart.angles.asc.longitude,
        mc: chart.angles.mc.longitude,
        ic: chart.angles.ic.longitude,
        desc: chart.angles.desc.longitude,
      },
      phase3bCondition: condition,
    });

    const sectConditionDetail = computeSectConditionDetail({
      sign: p.sign.key,
      chartSect: sect,
      effectiveSect: condition.sect.effectiveSect,
      isOfSect: condition.sect.isOfSect,
      isAboveHorizon: condition.horizon.isAboveHorizon,
      altitudeDegrees: condition.horizon.altitude,
    });

    return { ...dignityResult, condition, operationalCondition, sectConditionDetail };
  });

  return {
    meta: CLASSICAL_META,
    sect,
    planets,
  };
}
