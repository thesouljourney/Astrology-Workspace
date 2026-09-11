/**
 * Assembles chart.classical on top of an already-computed Phase 1/2 chart.
 * Reuses the verified planet/house/sect data — sect in particular is not
 * recomputed here; it is read from the already-computed Part of Fortune
 * point (which already determines it from the Sun's real astronomical
 * altitude — see partOfFortune.js), so there is exactly one sect
 * computation in the whole codebase, not two.
 */

import { computeEssentialDignity, TRADITIONAL_PLANETS } from "./essentialDignity.js";

export const CLASSICAL_META = {
  zodiacType: "tropical",
  rulershipSystem: "traditional",
  triplicitySystem: "dorothean",
  termSystem: "egyptian",
  faceSystem: "chaldean",
};

/**
 * @param {object} chart a full Phase 1/2 chart, as returned by calculateChart()
 * @returns {object} { meta, sect, planets: [...] }
 */
export function buildClassicalChart(chart) {
  const partOfFortune = chart.points.find((p) => p.id === "partOfFortune");
  const sect = partOfFortune.meta.sect;

  const planets = TRADITIONAL_PLANETS.map((key) => {
    const p = chart.planets.find((pl) => pl.key === key);
    return computeEssentialDignity({
      planetKey: key,
      sign: p.sign.key,
      absoluteLongitude: p.longitude,
      degreeInSign: p.degreeInSign,
      house: p.house,
      sect,
    });
  });

  return {
    meta: CLASSICAL_META,
    sect,
    planets,
  };
}
