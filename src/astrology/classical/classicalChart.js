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
import { computeDispositorChain, buildImmediateDispositor } from "./dispositorChain.js";
import { computeReceptionMatrix, getReceptionForPlanet, computeMutualReceptions } from "./reception.js";

export const CLASSICAL_META = {
  zodiacType: "tropical",
  rulershipSystem: "traditional",
  triplicitySystem: "dorothean",
  termSystem: "egyptian",
  faceSystem: "chaldean",
  speedConvention: SPEED_CONVENTION,
  // Halb = proper sect/hemisphere condition; Hayz = Halb + proper sign
  // gender. Hayz therefore implies Halb (not mutually exclusive) — see
  // the doc comment in hayzHalb.js for the sourced variance disclosure.
  hayzHalbConvention: "traditional_halb_base_hayz_full",
  // Reception through the five positive essential dignities only
  // (domicile/exaltation/triplicity/term/face) — see reception.js.
  receptionConvention: "traditional_five_positive_dignities",
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

  // Actual chart placements of the seven traditional planets, reused for
  // both the dispositor-chain traversal and the reception matrix — no
  // planet position is looked up a second time independently.
  const signByPlanet = {};
  const placements = TRADITIONAL_PLANETS.map((key) => {
    const p = chart.planets.find((pl) => pl.key === key);
    signByPlanet[key] = p.sign.key;
    return { planet: key, sign: p.sign.key, degreeInSign: p.degreeInSign };
  });
  const receptionMatrix = computeReceptionMatrix(placements, sect);
  const mutualReceptions = computeMutualReceptions(receptionMatrix);

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

    const dispositor = {
      immediate: buildImmediateDispositor({ planetKey: key, sign: p.sign.key }),
      chain: computeDispositorChain(key, signByPlanet),
    };

    const reception = getReceptionForPlanet(receptionMatrix, key);

    return { ...dignityResult, condition, operationalCondition, sectConditionDetail, dispositor, reception };
  });

  return {
    meta: CLASSICAL_META,
    sect,
    planets,
    receptionMatrix,
    mutualReceptions,
  };
}
