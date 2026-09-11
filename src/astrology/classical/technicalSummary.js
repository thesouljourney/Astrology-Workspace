/**
 * Classical Technical Summary & Evidence Layer — Phase 3H.
 *
 * THIS IS AN AGGREGATION / PRESENTATION LAYER ONLY. It performs ZERO new
 * astronomical calculation and ZERO new astrology rule evaluation. Every
 * field below is read (and, where noted, relabeled/regrouped for
 * traceability) from an already-computed, already-locked upstream
 * result: Phase 1 (chart.meta/chart.planets), Phase 3A (essential
 * dignity), Phase 3B (planetary condition), Phase 3C (operational
 * condition), Phase 3D (Hayz/Halb/sect condition), Phase 3E (dispositor
 * chain & reception), Phase 3F (aspects), Phase 3G-A (direct
 * perfection), and Phase 3G-B (perfection mechanics).
 *
 * Phase 3A-3G-B calculate technical evidence. Phase 3H organizes that
 * evidence for inspection/export. It does not reinterpret it:
 *
 *   - NO new dignity/reception/aspect/orb/perfection rule.
 *   - NO new Horary doctrine, house-role, or significator assignment.
 *   - NO combined/total/overall strength score (Phase 3A's own
 *     `totalEssentialScore` is displayed, never combined with anything).
 *   - NO ranking ("strongest planet", "key evidence", etc.).
 *   - NO interpretive good/bad/strong/weak/afflicted/promising label.
 *   - `requires_historical_rule`, `deferred`, `deferred_due_to_historical_variance`,
 *     and `not_yet_evaluated` are always preserved verbatim, never
 *     collapsed into a boolean or a resolved answer.
 *
 * Renames applied ONLY for cross-section naming consistency (never a
 * value change): Phase 3G-A's `status` field is exposed here as
 * `technicalStatus` (matching Phase 3G-B's own field name for the same
 * concept); Phase 3E's `{planet, types}` reception entries are exposed
 * as `{otherPlanet, dignityTypes}` at the planet level for symmetry with
 * the aspect/mechanics evidence entries, which all use `otherPlanet`.
 * Direction is preserved exactly as Phase 3E defines it — see
 * `reception.js`'s doc comment: if B receives A, A occupies B's dignity;
 * this module never reverses that.
 */

import { TRADITIONAL_PLANETS } from "./essentialDignity.js";

export const PROVENANCE = {
  ASTRONOMICAL_FOUNDATION: "phase_1_astronomical_foundation",
  ESSENTIAL_DIGNITY: "phase_3a_essential_dignity",
  PLANETARY_CONDITION: "phase_3b_planetary_condition",
  OPERATIONAL_CONDITION: "phase_3c_operational_condition",
  HAYZ_HALB: "phase_3d_hayz_halb",
  RECEPTION: "phase_3e_reception",
  ASPECTS: "phase_3f_aspects",
  DIRECT_PERFECTION: "phase_3ga_direct_perfection",
  PERFECTION_MECHANICS: "phase_3gb_perfection_mechanics",
};

export const ALL_PROVENANCE_LABELS = Object.values(PROVENANCE);

export const TECHNICAL_SUMMARY_VERSION = "phase_3h_v1";
export const TECHNICAL_SUMMARY_TYPE = "normalized_evidence_layer";
export const TECHNICAL_SUMMARY_INTERPRETATION = "none";

/**
 * Deterministic canonical ordering for any two of the seven traditional
 * planets, matching the exact ordering every upstream Phase 3F/3G-A/3G-B
 * module already uses when it builds its own pair arrays (a nested
 * `for (i) for (j = i+1)` loop over `TRADITIONAL_PLANETS`, never an
 * alphabetical sort). Using that same ordering here — rather than
 * inventing a second one (e.g. alphabetical) — is what makes "A-B" and
 * "B-A" always normalize to one stable pairId, and is the fix for the
 * exact class of mistake this project already made once at the test
 * level in Phase 3G-B (an alphabetically-sorted override key silently
 * failing to match a canonically-ordered pair).
 * @param {string} a
 * @param {string} b
 * @returns {{pairId:string, planetA:string, planetB:string}}
 */
export function canonicalPlanetPair(a, b) {
  const ia = TRADITIONAL_PLANETS.indexOf(a);
  const ib = TRADITIONAL_PLANETS.indexOf(b);
  if (ia === -1 || ib === -1) {
    throw new Error(`canonicalPlanetPair: unknown traditional planet in ("${a}", "${b}")`);
  }
  if (ia === ib) {
    throw new Error(`canonicalPlanetPair: a pair must be two different planets, got "${a}" twice`);
  }
  const [planetA, planetB] = ia < ib ? [a, b] : [b, a];
  return { pairId: `${planetA}-${planetB}`, planetA, planetB };
}

function findAspect(aspects, x, y) {
  return aspects.find((a) => (a.planetA === x && a.planetB === y) || (a.planetA === y && a.planetB === x));
}

function findDirectPerfection(directPerfection, x, y) {
  return directPerfection.find((d) => (d.planetA === x && d.planetB === y) || (d.planetA === y && d.planetB === x));
}

/** Phase 3G-A's `status`/rest, relabeled `technicalStatus` for cross-section naming consistency only — no value changes. */
function normalizeDirectPerfectionEntry(d) {
  return {
    isCandidate: d.isCandidate,
    aspectType: d.aspectType,
    startingOrb: d.startingOrb,
    exactitudeFound: d.exactitudeFound,
    exactitudeTimestampUTC: d.exactitudeTimestampUTC,
    timeToExactitudeDays: d.timeToExactitudeDays,
    technicalStatus: d.status,
    reasonCode: d.reasonCode,
    ingressBeforeExactitude: d.ingressBeforeExactitude,
    motionChangeBeforeExactitude: d.motionChangeBeforeExactitude,
    refranation: d.refranation,
  };
}

/**
 * Builds the seven-entry planet-evidence map (Part D). Reuses
 * `chart.classical.planets` (Phase 3A-3E's already-merged per-planet
 * object), `chart.classical.aspects` (Phase 3F), `chart.classical.directPerfection`
 * (Phase 3G-A), and `chart.classical.perfectionMechanics` (Phase 3G-B)
 * verbatim — no recalculation.
 */
function buildPlanetEvidence({ classicalPlanets, aspects, directPerfection, perfectionMechanics, receptionQualification }) {
  const planets = {};

  for (const p of classicalPlanets) {
    const key = p.planet;

    const position = {
      sign: p.placement.sign,
      absoluteLongitude: p.placement.absoluteLongitude,
      degreeInSign: p.placement.degreeInSign,
      house: p.placement.house,
      motion: { direction: p.condition.motion.direction, longitudeSpeedDegPerDay: p.condition.motion.longitudeSpeed },
      retrograde: p.condition.motion.direction === "retrograde",
      horizon: { altitude: p.condition.horizon.altitude, isAboveHorizon: p.condition.horizon.isAboveHorizon },
    };

    const essentialDignity = {
      domicile: p.dignity.domicile,
      exaltation: p.dignity.exaltation,
      triplicity: p.dignity.triplicity,
      term: p.dignity.term,
      face: p.dignity.face,
      detriment: p.dignity.detriment,
      fall: p.dignity.fall,
      peregrine: p.peregrine,
      immediateDispositor: p.immediateDispositor,
      totalEssentialScore: p.totalEssentialScore,
    };

    const dispositor = {
      immediateDispositor: p.dispositor.immediate.ruledBy,
      dispositorChain: p.dispositor.chain.chain,
      terminationType: p.dispositor.chain.terminationType,
      finalDispositor: p.dispositor.chain.finalDispositor,
      loopMembers: p.dispositor.chain.loopMembers,
    };

    const reception = {
      receives: p.reception.receives.map((e) => ({ otherPlanet: e.planet, dignityTypes: e.types })),
      receivedBy: p.reception.receivedBy.map((e) => ({ otherPlanet: e.planet, dignityTypes: e.types })),
      receptionQualification,
    };

    const planetAspects = aspects
      .filter((a) => (a.planetA === key || a.planetB === key) && a.aspect.isWithinOrb)
      .map((a) => ({
        otherPlanet: a.planetA === key ? a.planetB : a.planetA,
        aspectType: a.aspect.type,
        exactAngle: a.aspect.exactAngle,
        angularSeparation: a.aspect.angularSeparation,
        orbFromExact: a.aspect.orbFromExact,
        allowedOrb: a.aspect.allowedOrb,
        motionStatus: a.motion.status,
        signAspectRelation: a.signAspectRelation,
      }));

    const planetDirectPerfection = directPerfection
      .filter((d) => d.isCandidate && (d.planetA === key || d.planetB === key))
      .map((d) => ({ otherPlanet: d.planetA === key ? d.planetB : d.planetA, ...normalizeDirectPerfectionEntry(d) }));

    const mechanicsInvolvement = {
      translations: perfectionMechanics.translations
        .filter((t) => t.translator === key || t.fromPlanet === key || t.toPlanet === key)
        .map((t) => ({
          role: t.translator === key ? "translator" : t.fromPlanet === key ? "translationFrom" : "translationTo",
          translator: t.translator,
          fromPlanet: t.fromPlanet,
          toPlanet: t.toPlanet,
          technicalStatus: t.technicalStatus,
        })),
      collections: perfectionMechanics.collections
        .filter((c) => c.collector === key || c.planetA === key || c.planetB === key)
        .map((c) => ({
          role: c.collector === key ? "collector" : "collectionParticipant",
          collector: c.collector,
          planetA: c.planetA,
          planetB: c.planetB,
          completionStatus: c.completionStatus,
        })),
      prohibitions: perfectionMechanics.prohibitions
        .filter((pr) => pr.prohibitingPlanet === key || pr.originalPair.includes(key))
        .map((pr) => ({
          role: pr.prohibitingPlanet === key ? "prohibitingPlanet" : "prohibitedPairMember",
          originalPair: pr.originalPair,
          prohibitingPlanet: pr.prohibitingPlanet,
        })),
      interferenceEvents: perfectionMechanics.interferenceEvents
        .filter((e) => e.thirdPlanet === key || e.contactedPlanet === key)
        .map((e) => ({
          role: e.thirdPlanet === key ? "interferingPlanet" : "prohibitedPairMember",
          originalPair: e.originalPair,
          thirdPlanet: e.thirdPlanet,
          contactedPlanet: e.contactedPlanet,
        })),
      // Frustration remains deferred (Phase 3G-B) - no involvement is
      // invented for it; this stays permanently empty.
      frustrations: [],
    };

    const technicalFlags = {
      isRetrograde: position.retrograde,
      isCombust: p.condition.solar?.condition === "combust",
      isUnderBeams: p.condition.solar?.condition === "under_beams",
      isPeregrine: p.peregrine,
      isHayz: p.sectConditionDetail.hayz.isHayz,
      isHalb: p.sectConditionDetail.halb.isHalb,
      isAngular: p.operationalCondition.housePosition.class === "angular",
      hasApplyingAspect: planetAspects.some((a) => a.motionStatus === "applying"),
      hasRefranation: planetDirectPerfection.some((d) => d.refranation?.occurs),
      hasReceptionRelationship: reception.receives.length > 0 || reception.receivedBy.length > 0,
    };

    planets[key] = {
      identity: { planet: key },
      position,
      essentialDignity,
      planetaryCondition: p.condition,
      operationalCondition: p.operationalCondition,
      sectCondition: p.sectConditionDetail,
      dispositor,
      reception,
      aspects: planetAspects,
      directPerfection: planetDirectPerfection,
      mechanicsInvolvement,
      technicalFlags,
      provenance: ALL_PROVENANCE_LABELS,
    };
  }

  return planets;
}

/**
 * Builds all 21 unique unordered relationship records (Part O), each
 * with a stable canonical `pairId` (Part P).
 */
function buildRelationships({ aspects, directPerfection, perfectionMechanics }) {
  const relationships = [];

  for (let i = 0; i < TRADITIONAL_PLANETS.length; i++) {
    for (let j = i + 1; j < TRADITIONAL_PLANETS.length; j++) {
      const { pairId, planetA, planetB } = canonicalPlanetPair(TRADITIONAL_PLANETS[i], TRADITIONAL_PLANETS[j]);

      const aspectPair = findAspect(aspects, planetA, planetB);
      const currentAspect = {
        type: aspectPair.aspect.type,
        exactAngle: aspectPair.aspect.exactAngle,
        angularSeparation: aspectPair.aspect.angularSeparation,
        orbFromExact: aspectPair.aspect.orbFromExact,
        allowedOrb: aspectPair.aspect.allowedOrb,
        isWithinOrb: aspectPair.aspect.isWithinOrb,
        motionStatus: aspectPair.motion.status,
        signAspectRelation: aspectPair.signAspectRelation,
      };

      const reception = {
        aReceivesB: aspectPair.reception.aReceivesB.types,
        bReceivesA: aspectPair.reception.bReceivesA.types,
      };

      const dp = findDirectPerfection(directPerfection, planetA, planetB);
      const directPerfectionEvidence = normalizeDirectPerfectionEntry(dp);

      const interference = perfectionMechanics.interferenceEvents.filter(
        (e) => canonicalPlanetPair(e.originalPair[0], e.originalPair[1]).pairId === pairId,
      );

      const mechanics = {
        translations: perfectionMechanics.translations.filter(
          (t) => canonicalPlanetPair(t.fromPlanet, t.toPlanet).pairId === pairId,
        ),
        collections: perfectionMechanics.collections.filter(
          (c) => canonicalPlanetPair(c.planetA, c.planetB).pairId === pairId,
        ),
        prohibitions: perfectionMechanics.prohibitions.filter(
          (pr) => canonicalPlanetPair(pr.originalPair[0], pr.originalPair[1]).pairId === pairId,
        ),
      };

      relationships.push({
        pairId,
        planetA,
        planetB,
        currentAspect,
        reception,
        directPerfection: directPerfectionEvidence,
        interference,
        mechanics,
        provenance: [
          PROVENANCE.ASPECTS,
          PROVENANCE.RECEPTION,
          PROVENANCE.DIRECT_PERFECTION,
          PROVENANCE.PERFECTION_MECHANICS,
        ],
      });
    }
  }

  return relationships;
}

const UNRESOLVED_MARKER_VALUES = new Set([
  "requires_historical_rule",
  "deferred",
  "deferred_due_to_historical_variance",
  "not_yet_evaluated",
]);

// Topic labels are descriptive summary labels, distinct from the meta
// key names themselves - mapped explicitly so this list is built from
// whatever the metadata CURRENTLY says, not a hard-coded assumption
// about which conventions remain unresolved. A convention that a future
// phase resolves (i.e. its meta value stops being one of the markers
// above) automatically drops out of this list on its own.
const CONVENTION_TOPICS = [
  { topic: "sign_ingress_before_perfection", metaKey: "signIngressConvention" },
  { topic: "reception_qualification", metaKey: "receptionQualification" },
  { topic: "frustration", metaKey: "frustrationConvention" },
  { topic: "dexter_sinister", metaKey: "dexterSinisterStatus" },
  { topic: "refranation", metaKey: "refranationConvention" },
  { topic: "translation", metaKey: "translationConvention" },
  { topic: "collection", metaKey: "collectionConvention" },
  { topic: "prohibition", metaKey: "prohibitionConvention" },
];

function buildUnresolvedConventions(meta) {
  return CONVENTION_TOPICS.filter(({ metaKey }) => UNRESOLVED_MARKER_VALUES.has(meta[metaKey])).map(({ topic, metaKey }) => ({
    topic,
    status: meta[metaKey],
  }));
}

/**
 * @param {object} params
 * @param {object} params.topLevelMeta Phase 1's chart.meta (zodiacType, houseSystem)
 * @param {"day"|"night"} params.sect chart.classical.sect
 * @param {object} params.meta chart.classical.meta (CLASSICAL_META)
 * @param {Array<object>} params.classicalPlanets chart.classical.planets
 * @param {Array<object>} params.aspects chart.classical.aspects (Phase 3F)
 * @param {Array<object>} params.directPerfection chart.classical.directPerfection (Phase 3G-A)
 * @param {object} params.perfectionMechanics chart.classical.perfectionMechanics (Phase 3G-B)
 * @returns {object} chart.classical.summary
 */
export function buildTechnicalSummary({ topLevelMeta, sect, meta, classicalPlanets, aspects, directPerfection, perfectionMechanics }) {
  const chartOverview = {
    zodiacType: topLevelMeta.zodiacType,
    houseSystem: topLevelMeta.houseSystem,
    chartSect: sect,
    rulershipSystem: meta.rulershipSystem,
    triplicitySystem: meta.triplicitySystem,
    termSystem: meta.termSystem,
    faceSystem: meta.faceSystem,
    speedConvention: meta.speedConvention,
    hayzHalbConvention: meta.hayzHalbConvention,
    receptionConvention: meta.receptionConvention,
    receptionQualification: meta.receptionQualification,
    aspectSystem: meta.aspectSystem,
    aspectOrbConvention: meta.aspectOrbConvention,
    directPerfectionMethod: meta.directPerfectionMethod,
    signIngressConvention: meta.signIngressConvention,
    refranationConvention: meta.refranationConvention,
    translationConvention: meta.translationConvention,
    collectionConvention: meta.collectionConvention,
    prohibitionConvention: meta.prohibitionConvention,
    frustrationConvention: meta.frustrationConvention,
    traditionalPlanetsIncluded: [...TRADITIONAL_PLANETS],
    provenance: [PROVENANCE.ASTRONOMICAL_FOUNDATION, ...ALL_PROVENANCE_LABELS],
  };

  const planets = buildPlanetEvidence({
    classicalPlanets,
    aspects,
    directPerfection,
    perfectionMechanics,
    receptionQualification: meta.receptionQualification,
  });

  const relationships = buildRelationships({ aspects, directPerfection, perfectionMechanics });

  const completionStatusCounts = { both_legs_perfect: 0, one_leg_does_not_perfect: 0, requires_historical_rule: 0 };
  for (const c of perfectionMechanics.collections) completionStatusCounts[c.completionStatus]++;

  const mechanics = {
    translationsCount: perfectionMechanics.translations.length,
    collectionsCount: perfectionMechanics.collections.length,
    collectionCompletionStatusCounts: completionStatusCounts,
    prohibitionsCount: perfectionMechanics.prohibitions.length,
    frustrationsCount: perfectionMechanics.frustrations.length,
    interferenceEventsCount: perfectionMechanics.interferenceEvents.length,
    doctrineStatus: { ...perfectionMechanics.doctrineStatus },
    provenance: [PROVENANCE.PERFECTION_MECHANICS],
  };

  const unresolvedConventions = buildUnresolvedConventions(meta);

  return { chartOverview, planets, relationships, mechanics, unresolvedConventions };
}
