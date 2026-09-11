/**
 * Perfection Interference Mechanics — Phase 3G-B.
 *
 * Phase 3G-A answers "do A and B reach exactitude?" This module answers
 * "what happens BEFORE that exactitude?" — Translation of Light,
 * Collection of Light, Prohibition, and a neutral raw third-planet
 * interference layer. It is EVENT-SEQUENCE logic built entirely on top
 * of already-computed Phase 3E/3F/3G-A data (reception matrix, aspect
 * matrix, direct-perfection search results) — no new astronomical
 * calculation is introduced beyond one reuse: Translation's "separation"
 * leg needs a PAST exactitude timestamp, found by re-running Phase
 * 3G-A's own `scanForAspectEvents` with time parameterized backward
 * (see `findPastSeparationExactitude`) — the exact same event-search
 * machinery, not a competing engine, not constant-speed extrapolation.
 *
 * DOES NOT IMPLEMENT: final horary yes/no judgment, Void of Course,
 * house-significator role assignment (querent/quesited/etc.), or any
 * score/weighting. See module-level DOCTRINE_STATUS and the Phase 3G-B
 * report for what was researched, what was implemented, and what was
 * explicitly deferred.
 *
 * ====================================================================
 * TRANSLATION OF LIGHT — cross-checked against Skyscript forum threads,
 * astrologysoftware.com's dictionary, Astrocepheus's knowledge base, and
 * Kerykeion's summary (consistent on the core structure):
 * ====================================================================
 * A third planet C, faster (by absolute angular speed) than BOTH A and
 * B, separates from an aspect with one of them and applies to an aspect
 * with the other — carrying their "light" between two planets that do
 * NOT currently aspect each other directly (translation/collection are
 * specifically the mechanism used when A and B have no direct aspect at
 * all; per multiple sources, "both techniques are employed specifically
 * when the primary significators themselves must not aspect each
 * other"). Reception is NOT required as a hard gate: sources disagree
 * on this point ("while translation and collection can occur without
 * reception, reception helps to secure it... some astrologers do not
 * even consider receptions") — this project resolves that the same way
 * it resolved Phase 3E's reception-qualification question: expose
 * `receptionContext` as informational data, never require it to
 * classify `occurs: true`. No source was found imposing a specific
 * aspect-type restriction (e.g. excluding square/opposition) strong
 * enough to justify excluding them; all five classical major aspects
 * (Phase 3F's set) are accepted for both legs.
 *
 * ====================================================================
 * COLLECTION OF LIGHT — same sources as above:
 * ====================================================================
 * A third planet C, SLOWER (by absolute angular speed) than both A and
 * B, receives applying aspects from both — "collecting" their light.
 * Same non-aspecting-pair precondition and same reception-as-metadata
 * (not-gating) resolution as Translation, for the same sourced reason.
 *
 * ====================================================================
 * PROHIBITION — William Lilly, Christian Astrology (single, clear,
 * internally consistent, role-free definition — no material
 * disagreement found requiring a stop):
 * ====================================================================
 * "Prohibition is when two Planets that signify the effecting or
 * bringing to conclusion anything demanded, are applying to an Aspect;
 * and before they can come to a true Aspect, another Planet interposes
 * either his body or aspect, to that thereby the matter propounded is
 * hindered or retarded." Lilly's definition requires no house-role
 * (querent/quesited) assignment — "the two planets that signify the
 * matter" is read here simply as any currently-applying Phase 3F pair.
 * A third planet C prohibits when C perfects an aspect with A or B
 * BEFORE the original A-B aspect perfects — proven from real future
 * ephemeris (Phase 3G-A's already-computed results), never inferred
 * from static geometry. Lilly explicitly says the matter is "hindered
 * or retarded," not necessarily destroyed — this module reports the
 * structural fact only, no outcome claim.
 *
 * ====================================================================
 * FRUSTRATION — deferred as a distinct doctrine (project owner's
 * explicit decision, not a silent omission):
 * ====================================================================
 * At least one source defines frustration as requiring a distinction
 * between a "significator" (the planet representing the matter) and a
 * "non-significator" — a role assignment this phase does not perform
 * (see Part O of the brief: no querent/quesited/house-role assignment).
 * Multiple other sources state "many writers consider abscission and
 * frustration synonymous" with the same third-planet-interposes
 * structure already implemented above as Prohibition. Rather than
 * silently collapsing frustration into Prohibition under a different
 * name, or silently assigning roles this phase is not supposed to
 * assign, this was reported to the project owner, who chose to defer:
 * `frustrations` is always `[]`, `frustrationConvention:
 * "deferred_due_to_historical_variance"`. The underlying facts remain
 * fully visible via Prohibition and the raw interference layer.
 *
 * ====================================================================
 * ABSCISSION / INTERFERENCE — Part G of the brief's own preferred
 * resolution for exactly this kind of overlapping terminology:
 * ====================================================================
 * Rather than deciding whether "abscission" is a synonym of Prohibition,
 * a distinct doctrine, or a broader family, this module exposes the
 * neutral RAW interference-event layer (`interferenceEvents`) — every
 * third-planet exact aspect involving either member of a currently
 * applying pair that occurs before that pair's own candidate
 * exactitude — as plain structural fact, independent of any doctrine
 * label. Prohibition entries are DERIVED from this same raw layer under
 * Lilly's specific historical rule; the raw layer itself makes no
 * doctrine claim.
 *
 * SIGN INGRESS: reuses Phase 3G-A's already-deferred
 * `signIngressConvention: "requires_historical_rule"` — if a
 * constituent leg of a Translation/Collection/Prohibition candidate
 * itself shows a sign ingress before its own exactitude, this module's
 * `technicalStatus` for that structure is likewise set to
 * `"requires_historical_rule"` rather than silently asserting the
 * doctrine held or failed.
 *
 * NO SCORE, no horary yes/no outcome anywhere in this module.
 */

import { TRADITIONAL_PLANETS } from "./essentialDignity.js";
import { PLANET_BODIES, computeLongitudeAndSpeed } from "../planets.js";
import {
  scanForAspectEvents,
  resolveEffectiveTargetAngle,
  DIRECT_PERFECTION_SEARCH_HORIZON_DAYS,
  COARSE_STEP_DAYS,
} from "./directPerfection.js";

export const DOCTRINE_STATUS = {
  translationConvention: "faster_planet_separates_and_applies_no_direct_aspect_required_reception_informational",
  collectionConvention: "slower_planet_receives_both_applications_no_direct_aspect_required_reception_informational",
  prohibitionConvention: "lilly_third_planet_interposes_before_perfection",
  frustrationConvention: "deferred_due_to_historical_variance",
  interferenceLayer: "raw_event_sequence",
};

function bodyForPlanet(planetKey) {
  return PLANET_BODIES.find((p) => p.key === planetKey).body;
}

function realStateAt(planetKey, startAstroTime, tDays) {
  return computeLongitudeAndSpeed(bodyForPlanet(planetKey), startAstroTime.AddDays(tDays));
}

function findAspectPair(aspects, x, y) {
  return aspects.find((a) => (a.planetA === x && a.planetB === y) || (a.planetA === y && a.planetB === x));
}

function findDirectPerfection(directPerfection, x, y) {
  return directPerfection.find((d) => (d.planetA === x && d.planetB === y) || (d.planetA === y && d.planetB === x));
}

function getReceptionPair(receptionMatrix, x, y) {
  const xReceivesY = receptionMatrix.find((e) => e.receiver === x && e.received === y);
  const yReceivesX = receptionMatrix.find((e) => e.receiver === y && e.received === x);
  return {
    [`${x}Receives${capitalize(y)}`]: { types: xReceivesY.types },
    [`${y}Receives${capitalize(x)}`]: { types: yReceivesX.types },
  };
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Finds when planetA and planetB were last EXACTLY at the given aspect
 * angle in the past, by reusing scanForAspectEvents with time
 * parameterized backward (getState(t) samples calendar time
 * startAstroTime - t days) — the same deterministic event-search
 * machinery Phase 3G-A uses forward, not a new or competing engine.
 */
function findPastSeparationExactitude({ planetA, planetB, exactAngle, startAstroTime }) {
  const state0A = realStateAt(planetA, startAstroTime, 0);
  const state0B = realStateAt(planetB, startAstroTime, 0);
  const effectiveTarget = resolveEffectiveTargetAngle(state0A.longitude, state0B.longitude, exactAngle);

  const raw = scanForAspectEvents({
    getStateA: (t) => realStateAt(planetA, startAstroTime, -t),
    getStateB: (t) => realStateAt(planetB, startAstroTime, -t),
    exactAngle: effectiveTarget,
    horizonDays: DIRECT_PERFECTION_SEARCH_HORIZON_DAYS,
    coarseStepDays: COARSE_STEP_DAYS,
  });

  if (!raw.exactitudeFound) return { found: false, timestampUTC: null, daysAgo: null };
  return {
    found: true,
    timestampUTC: startAstroTime.AddDays(-raw.exactTDays).date.toISOString(),
    daysAgo: raw.exactTDays,
  };
}

/**
 * @param {object} params
 * @param {Array<{planet:string, speedDegPerDay:number}>} params.placements the 7 traditional planets' current speeds
 * @param {Array<object>} params.aspects Phase 3F's 21-pair matrix (read-only)
 * @param {Array<object>} params.directPerfection Phase 3G-A's 21-entry array (read-only)
 * @param {Array<object>} params.receptionMatrix Phase 3E's reception matrix (read-only)
 * @param {import("astronomy-engine").AstroTime} params.startAstroTime
 * @returns {object} perfectionMechanics result, see module doc comment
 */
export function computePerfectionMechanics({ placements, aspects, directPerfection, receptionMatrix, startAstroTime }) {
  const speedOf = (p) => Math.abs(placements.find((x) => x.planet === p).speedDegPerDay);

  const translations = computeTranslations({ aspects, directPerfection, receptionMatrix, speedOf, startAstroTime });
  const collections = computeCollections({ aspects, directPerfection, receptionMatrix, speedOf });
  const { prohibitions, interferenceEvents } = computeProhibitionsAndInterference({ directPerfection });
  const eventTimeline = buildEventTimeline(directPerfection);

  return {
    translations,
    collections,
    prohibitions,
    frustrations: [],
    interferenceEvents,
    eventTimeline,
    doctrineStatus: { ...DOCTRINE_STATUS },
  };
}

export function computeTranslations({ aspects, directPerfection, receptionMatrix, speedOf, startAstroTime }) {
  const results = [];
  const noAspectPairs = [];
  for (let i = 0; i < TRADITIONAL_PLANETS.length; i++) {
    for (let j = i + 1; j < TRADITIONAL_PLANETS.length; j++) {
      const a = TRADITIONAL_PLANETS[i];
      const b = TRADITIONAL_PLANETS[j];
      const pair = findAspectPair(aspects, a, b);
      if (pair.aspect.type === null) noAspectPairs.push([a, b]);
    }
  }

  for (const [a, b] of noAspectPairs) {
    for (const c of TRADITIONAL_PLANETS) {
      if (c === a || c === b) continue;
      if (!(speedOf(c) > speedOf(a) && speedOf(c) > speedOf(b))) continue;

      // Direction 1: C separates from A, applies to B.
      results.push(...buildTranslationCandidates({ translator: c, from: a, to: b, aspects, directPerfection, receptionMatrix, startAstroTime }));
      // Direction 2: C separates from B, applies to A.
      results.push(...buildTranslationCandidates({ translator: c, from: b, to: a, aspects, directPerfection, receptionMatrix, startAstroTime }));
    }
  }
  return results;
}

function buildTranslationCandidates({ translator, from, to, aspects, directPerfection, receptionMatrix, startAstroTime }) {
  const separatingPair = findAspectPair(aspects, translator, from);
  const applyingPair = findAspectPair(aspects, translator, to);
  if (separatingPair.aspect.type === null || separatingPair.motion.status !== "separating") return [];
  if (applyingPair.aspect.type === null || applyingPair.motion.status !== "applying") return [];

  const applyingDP = findDirectPerfection(directPerfection, translator, to);
  const separation = findPastSeparationExactitude({
    planetA: translator,
    planetB: from,
    exactAngle: separatingPair.aspect.exactAngle,
    startAstroTime,
  });

  const ingressOnApplyingLeg = applyingDP.isCandidate
    ? applyingDP.ingressBeforeExactitude.planetA || applyingDP.ingressBeforeExactitude.planetB
    : false;

  return [
    {
      occurs: true,
      translator,
      fromPlanet: from,
      toPlanet: to,
      separatedAspect: separatingPair.aspect.type,
      applyingAspect: applyingPair.aspect.type,
      separationExactitudeTime: separation.timestampUTC,
      applicationExactitudeTime: applyingDP.isCandidate ? applyingDP.exactitudeTimestampUTC : null,
      translatorFasterThanFrom: true,
      translatorFasterThanTo: true,
      receptionContext: {
        withFromPlanet: getReceptionPair(receptionMatrix, translator, from),
        withToPlanet: getReceptionPair(receptionMatrix, translator, to),
      },
      technicalStatus: ingressOnApplyingLeg ? "requires_historical_rule" : "detected",
      convention: DOCTRINE_STATUS.translationConvention,
    },
  ];
}

export function computeCollections({ aspects, directPerfection, receptionMatrix, speedOf }) {
  const results = [];
  for (let i = 0; i < TRADITIONAL_PLANETS.length; i++) {
    for (let j = i + 1; j < TRADITIONAL_PLANETS.length; j++) {
      const a = TRADITIONAL_PLANETS[i];
      const b = TRADITIONAL_PLANETS[j];
      const directPair = findAspectPair(aspects, a, b);
      if (directPair.aspect.type !== null) continue; // collection requires no direct aspect between A and B

      for (const c of TRADITIONAL_PLANETS) {
        if (c === a || c === b) continue;
        if (!(speedOf(c) < speedOf(a) && speedOf(c) < speedOf(b))) continue;

        const aToC = findAspectPair(aspects, a, c);
        const bToC = findAspectPair(aspects, b, c);
        if (aToC.aspect.type === null || aToC.motion.status !== "applying") continue;
        if (bToC.aspect.type === null || bToC.motion.status !== "applying") continue;

        const aDP = findDirectPerfection(directPerfection, a, c);
        const bDP = findDirectPerfection(directPerfection, b, c);
        const ingress =
          (aDP.isCandidate && (aDP.ingressBeforeExactitude.planetA || aDP.ingressBeforeExactitude.planetB)) ||
          (bDP.isCandidate && (bDP.ingressBeforeExactitude.planetA || bDP.ingressBeforeExactitude.planetB));

        results.push({
          occurs: true,
          collector: c,
          planetA: a,
          planetB: b,
          aToCollectorAspect: aToC.aspect.type,
          bToCollectorAspect: bToC.aspect.type,
          aExactitudeTime: aDP.isCandidate ? aDP.exactitudeTimestampUTC : null,
          bExactitudeTime: bDP.isCandidate ? bDP.exactitudeTimestampUTC : null,
          collectorSlowerThanA: true,
          collectorSlowerThanB: true,
          receptionContext: {
            withPlanetA: getReceptionPair(receptionMatrix, c, a),
            withPlanetB: getReceptionPair(receptionMatrix, c, b),
          },
          technicalStatus: ingress ? "requires_historical_rule" : "detected",
          convention: DOCTRINE_STATUS.collectionConvention,
        });
      }
    }
  }
  return results;
}

/**
 * Raw interference layer (Part H) plus Prohibition (Lilly's specific
 * historical rule, derived from the same raw facts) — computed purely
 * by comparing Phase 3G-A's already-found exactitude timestamps; no new
 * ephemeris search.
 */
export function computeProhibitionsAndInterference({ directPerfection }) {
  const applyingWithExactitude = directPerfection.filter((d) => d.isCandidate && d.exactitudeFound);
  const interferenceEvents = [];
  const prohibitions = [];

  for (const original of applyingWithExactitude) {
    const [a, b] = [original.planetA, original.planetB];
    const originalTime = original.exactitudeTimestampUTC;

    for (const member of [a, b]) {
      for (const other of applyingWithExactitude) {
        if (other === original) continue;
        const thirdPlanet = other.planetA === member ? other.planetB : other.planetB === member ? other.planetA : null;
        if (thirdPlanet === null) continue; // `other` does not involve `member` at all
        if (thirdPlanet === a || thirdPlanet === b) continue; // that's the original pair itself, not a third planet
        if (other.exactitudeTimestampUTC >= originalTime) continue; // only earlier events interfere

        const event = {
          originalPair: [a, b],
          thirdPlanet,
          contactedPlanet: member,
          aspectType: other.aspectType,
          exactitudeTimestampUTC: other.exactitudeTimestampUTC,
          occursBeforeOriginalTarget: true,
        };
        interferenceEvents.push(event);

        prohibitions.push({
          occurs: true,
          originalPair: [a, b],
          originalAspect: original.aspectType,
          prohibitingPlanet: thirdPlanet,
          interveningAspect: other.aspectType,
          interveningExactitudeTime: other.exactitudeTimestampUTC,
          originalExpectedExactitudeTime: originalTime,
          reason: "third_planet_interposed_before_original_perfection",
          convention: DOCTRINE_STATUS.prohibitionConvention,
        });
      }
    }
  }

  return { prohibitions, interferenceEvents };
}

/**
 * Deterministic chronological event list, aggregated purely from
 * already-computed Phase 3G-A results (each pair's own exactitude, sign
 * ingresses, and stations) — no new calculation.
 */
export function buildEventTimeline(directPerfection) {
  const events = [];
  for (const d of directPerfection) {
    if (!d.isCandidate) continue;
    if (d.exactitudeFound) {
      events.push({
        timestampUTC: d.exactitudeTimestampUTC,
        type: "exact_aspect",
        planets: [d.planetA, d.planetB],
        aspectType: d.aspectType,
        metadata: { status: d.status },
      });
    }
    for (const e of d.ingressBeforeExactitude.events) {
      events.push({
        timestampUTC: e.timestamp,
        type: "ingress",
        planets: [e.planet],
        aspectType: null,
        metadata: { fromSign: e.fromSign, toSign: e.toSign },
      });
    }
    for (const e of d.motionChangeBeforeExactitude.events) {
      events.push({
        timestampUTC: e.timestamp,
        type: "station",
        planets: [e.planet],
        aspectType: null,
        metadata: { fromMotion: e.fromMotion, toMotion: e.toMotion },
      });
    }
  }
  // De-duplicate identical events (the same ingress/station can be shared
  // by two different original pairs that both involve the same planet).
  const seen = new Set();
  const deduped = [];
  for (const e of events) {
    const key = `${e.timestampUTC}|${e.type}|${e.planets.join(",")}|${e.aspectType}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(e);
  }
  return deduped.sort((x, y) => (x.timestampUTC < y.timestampUTC ? -1 : x.timestampUTC > y.timestampUTC ? 1 : 0));
}
