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

export const CLASSICAL_META = {
  zodiacType: "tropical",
  rulershipSystem: "traditional",
  triplicitySystem: "dorothean",
  termSystem: "egyptian",
  faceSystem: "chaldean",
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

    return { ...dignityResult, condition };
  });

  return {
    meta: CLASSICAL_META,
    sect,
    planets,
  };
}
