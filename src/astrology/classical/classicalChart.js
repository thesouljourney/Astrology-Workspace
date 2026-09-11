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
import { computeAspectMatrix, EXACT_EPSILON_DEGREES } from "./aspects.js";
import {
  computeDirectPerfection,
  DIRECT_PERFECTION_SEARCH_HORIZON_DAYS,
  DIRECT_PERFECTION_ROOT_TOLERANCE_DEGREES,
} from "./directPerfection.js";

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
  // IMPORTANT: this is a raw directional DIGNITY-HOLDER relationship
  // (A occupies a sign/degree dignified by B -> B hosts/receives A),
  // not a judgment that the relationship is a complete or "operative"
  // reception. Historical authors disagree on whether any single
  // dignity relationship alone qualifies as full reception, or whether
  // it additionally requires an aspect/application between the two
  // planets, and/or domicile-or-exaltation specifically, and/or two
  // simultaneous minor dignities (see README §14 and reception.js's doc
  // comment). That qualification question is deliberately NOT decided
  // here — it depends on aspect/application data this project has not
  // yet implemented (a future phase). "not_yet_evaluated" is not a
  // placeholder for a later default; it means Phase 3E takes no
  // position on it at all.
  receptionQualification: "not_yet_evaluated",
  // Five classical major aspects only (conjunction/sextile/square/trine/
  // opposition) — see aspects.js.
  aspectSystem: "classical_major_five",
  // Allowed orb per pair = sum of Lilly's planetary moieties (Christian
  // Astrology, 1647) — chosen over the materially wider Ptolemaic/
  // Porphyry orb table after a sourced disagreement was reported to the
  // project owner; see rules/planetaryMoiety.js and the Phase 3F report.
  aspectOrbConvention: "lilly_moiety_sum",
  // Strict floating-point-level tolerance for "exact", NOT an
  // interpretive orb — see aspects.js's EXACT_EPSILON_DEGREES.
  aspectExactnessToleranceDegrees: EXACT_EPSILON_DEGREES,
  // Whole-sign aspect relation (aspects[].signAspectRelation) is a
  // separate, orb-free fact from the degree-based aspect — the two
  // traditions materially differ historically and neither is treated as
  // silently overriding the other; see aspects.js.
  signAspectDoctrine: "whole_sign_separate_fact",
  // Researched but deferred: the dexter/sinister distinction was judged
  // not unambiguous enough for a confident first implementation.
  dexterSinisterStatus: "deferred",
  // Phase 3G-A: does an applying aspect (Phase 3F) actually reach exact
  // geometric contact in the future? Future positions are genuinely
  // recalculated via astronomy-engine (never extrapolated from a
  // constant current speed) — see directPerfection.js.
  directPerfectionMethod: "future_ephemeris_event_search",
  directPerfectionEngine: "astronomy-engine",
  // A software safety limit (engineering choice), NOT a historical
  // astrology doctrine — kept deliberately separate from the
  // conventions above; see directPerfection.js for the reasoning.
  directPerfectionSearchHorizonDays: DIRECT_PERFECTION_SEARCH_HORIZON_DAYS,
  // Reused directly from Phase 3F's EXACT_EPSILON_DEGREES for
  // consistency — distinct from the Lilly aspect orb (Phase 3F) and
  // from timestamp precision (a derived quantity, not a separate
  // chosen value); see directPerfection.js.
  directPerfectionExactnessToleranceDegrees: DIRECT_PERFECTION_ROOT_TOLERANCE_DEGREES,
  // A genuine sourced disagreement (Goldstein-Jacobson requires
  // perfection before sign change; March-McEvers does not; Lilly's own
  // position is nuanced, with a separate "evasion" exception) was
  // reported to the project owner, who chose to defer rather than pick
  // a side: when a sign ingress is detected before geometric
  // exactitude, status is "requires_historical_rule", not a forced
  // perfects/does_not_perfect judgment. See directPerfection.js and
  // README.
  signIngressConvention: "requires_historical_rule",
  // Refranation (an applying significator turning retrograde before the
  // aspect can perfect, such that it never reaches exactitude) follows
  // the definition corroborated by Astrodienst's Astrowiki and
  // astrologysoftware.com's dictionary — NOT merely "any retrograde
  // event." See directPerfection.js.
  refranationConvention: "retrograde_prevents_perfection_within_horizon",
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
  // the dispositor-chain traversal, the reception matrix, and the aspect
  // matrix alike — no planet position/speed is looked up a second time
  // independently.
  const signByPlanet = {};
  const placements = TRADITIONAL_PLANETS.map((key) => {
    const p = chart.planets.find((pl) => pl.key === key);
    signByPlanet[key] = p.sign.key;
    return {
      planet: key,
      sign: p.sign.key,
      degreeInSign: p.degreeInSign,
      longitude: p.longitude,
      speedDegPerDay: p.speedDegPerDay,
      signIndex: p.sign.index,
    };
  });
  const receptionMatrix = computeReceptionMatrix(placements, sect);
  const mutualReceptions = computeMutualReceptions(receptionMatrix);

  // Aspect pairs cross-reference Phase 3E's already-computed reception
  // matrix as read-only linked metadata (Part R) — reception itself is
  // not recomputed or modified here.
  const aspects = computeAspectMatrix(placements).map((pair) => {
    const aReceivesB = receptionMatrix.find((e) => e.receiver === pair.planetA && e.received === pair.planetB);
    const bReceivesA = receptionMatrix.find((e) => e.receiver === pair.planetB && e.received === pair.planetA);
    return {
      ...pair,
      reception: {
        aReceivesB: { types: aReceivesB.types },
        bReceivesA: { types: bReceivesA.types },
      },
    };
  });

  // Phase 3G-A: future-motion validation for every Phase 3F pair. Only
  // pairs Phase 3F found "applying" run the real event search; all
  // others get an immediate, cheap non-candidate result (Part M) —
  // Phase 3F's own aspect/motion data is read-only input here, never
  // recalculated or altered.
  const directPerfection = aspects.map((pair) => computeDirectPerfection({ aspectPair: pair, startAstroTime: astroTime }));

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
    aspects,
    directPerfection,
  };
}
