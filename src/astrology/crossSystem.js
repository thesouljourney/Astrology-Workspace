/**
 * Cross-System Evidence Mapping — Phase 5.
 *
 * THIS IS A NEUTRAL MAPPING LAYER ONLY. It performs ZERO new astronomical
 * or astrological calculation, creates NO new doctrine in any of the
 * three systems, and NEVER merges Modern Western (Phase 1/2A), Classical
 * (Phase 3A-3H), and Vedic (Phase 4A-4F) into one combined framework. It
 * answers exactly four neutral questions:
 *
 *   1. what technical evidence exists in each system
 *   2. where that evidence lives (a stable, resolvable sourcePath)
 *   3. which concepts across systems belong to the same broad "concept
 *      family" (a loose analogy, never an equivalence claim)
 *   4. which concepts must explicitly NOT be collapsed into each other
 *
 * It never claims two systems' evidence is numerically equivalent, never
 * scores anything, and never states whether systems "agree" or
 * "contradict" — those require semantic interpretation this project does
 * not perform (see the project's own core principle: software organizes,
 * the human interprets).
 *
 * ====================================================================
 * EVIDENCE ADDRESSING (Parts T/U)
 * ====================================================================
 * Every mapped item carries a `sourcePath` — a dot-separated path,
 * relative to the top-level `chart` object, that `resolveEvidencePath()`
 * below can walk to the real value. A path segment on an OBJECT is a
 * plain property lookup; a path segment on an ARRAY is resolved by
 * finding the element whose `id`, `key`, `planet`, `pairId`,
 * `bhavaNumber`, or `house` field (tried in that order — every one of
 * these is a REAL identifying field this codebase's own arrays already
 * use, never an invented one) equals that segment. This lets a path like
 * `"vedic.summary.bhavas.10.lord"` resolve against the real
 * array-of-12-objects `chart.vedic.summary.bhavas` by matching
 * `bhavaNumber === 10`, without requiring that structure to be
 * object-keyed. Every `sourcePath` below is verified, by dedicated test,
 * to resolve to a defined value against the locked verification chart —
 * Part T's explicit "do not invent paths that do not exist" is enforced
 * by that test, not merely by code review.
 *
 * DEVIATION FROM THE BRIEF'S ILLUSTRATIVE PREFIX (documented per this
 * project's standing practice of flagging every deviation): the brief's
 * own examples use a `"modernWestern.*"` prefix (e.g.
 * `"modernWestern.sun.position.longitude"`), but no `chart.modernWestern`
 * key exists anywhere in this codebase — Modern Western evidence lives
 * at `chart.points`/`chart.planets`/`chart.angles`/`chart.houseCusps`.
 * Since Part T simultaneously requires that "exact paths must match real
 * schema," this module roots Modern Western sourcePaths at the REAL
 * `"points"` array instead of the illustrative (but non-existent)
 * `"modernWestern"` prefix.
 *
 * ====================================================================
 * NO NEW DOCTRINE (Core Principle)
 * ====================================================================
 * This module takes the already-built `chart` (with `chart.classical`
 * and `chart.vedic` already attached) as read-only input. It never
 * mutates any of it, and returns a `structuredClone()` of its own result
 * — mutating `chart.crossSystem` afterward can never corrupt any locked
 * Phase 1-4F source structure.
 */

export const CROSS_SYSTEM_VERSION = "phase_5_v1";
export const CROSS_SYSTEM_TYPE = "evidence_mapping_layer";
export const CROSS_SYSTEM_INTERPRETATION = "none";
export const CROSS_SYSTEM_COMPARISON_POLICY = "conceptual_mapping_without_equivalence_or_scoring";
export const CROSS_SYSTEM_EQUIVALENCE_POLICY = "identity_convention_coordinateFrame_and_numeric_equivalence_are_separate_dimensions";

const SEVEN_CLASSICAL = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"];
const OUTER_WESTERN_ONLY = ["uranus", "neptune", "pluto"];

/**
 * ====================================================================
 * EQUIVALENCE DIMENSIONS (Pre-lock audit - see README §25.1)
 * ====================================================================
 * A single `numericallyEquivalent` boolean cannot represent everything
 * "equivalence" might mean across two systems. This module always
 * reports FOUR separate, independently-computed dimensions instead of
 * collapsing them into one:
 *
 *   - sameAstronomicalIdentity: the two sides refer to the same
 *     underlying astronomical body/point (e.g. Rahu IS the Moon's
 *     ascending node, the same object North Node refers to).
 *   - sameCalculationConvention: the two sides were computed using the
 *     same underlying method/convention (e.g. both "mean node", not one
 *     "true" and one "mean"). For ordinary planets there is only one
 *     convention in this project (a direct ephemeris read), so this is
 *     trivially true; for lunar nodes it depends on the caller's chosen
 *     Western `nodeType` versus Vedic's fixed "mean" convention.
 *   - sameCoordinateFrame: the two sides' NATIVE displayed longitudes
 *     are expressed in the same zodiac/coordinate frame (tropical vs.
 *     sidereal). This project's Western/Classical output is ALWAYS
 *     tropical and Vedic output is ALWAYS sidereal, so this is always
 *     `false` for any Western/Classical-vs-Vedic pairing today — a live
 *     comparison of `chart.meta.zodiacType`/`chart.vedic.meta.zodiacType`,
 *     not a hard-coded constant, so it stays correct if either side's
 *     architecture ever changes.
 *   - numericallyEquivalent: `true` ONLY when `sameCoordinateFrame` is
 *     `true` AND the two native longitudes agree within
 *     `COORDINATE_TOLERANCE_DEGREES`. Matching calculation convention
 *     alone (e.g. both selecting "mean node") is explicitly NOT
 *     sufficient — a Western Mean Node and Vedic Mean Rahu differ by the
 *     full ayanamsha offset (~23.8° for the locked verification chart)
 *     even though they share the same node-calculation convention. This
 *     was a genuine bug in this module's original implementation
 *     (`numericallyEquivalent: sameConvention`), caught and fixed in
 *     this pre-lock audit — never conflate "same convention" with "same
 *     number." No coordinate conversion is ever performed here merely to
 *     force equivalence; the native values are compared as-is.
 */
const COORDINATE_TOLERANCE_DEGREES = 1e-6;

/** Shortest angular separation between two longitudes, always in [0, 180]. */
function angularDifferenceDegrees(a, b) {
  let diff = Math.abs(a - b) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

/**
 * Computes the four equivalence dimensions for a two-system comparison.
 * @param {object} params
 * @param {boolean} params.sameAstronomicalIdentity
 * @param {boolean} params.sameCalculationConvention
 * @param {boolean} params.sameCoordinateFrame
 * @param {number} [params.longitudeA] required only when sameCoordinateFrame is true
 * @param {number} [params.longitudeB] required only when sameCoordinateFrame is true
 */
function buildEquivalence({ sameAstronomicalIdentity, sameCalculationConvention, sameCoordinateFrame, longitudeA, longitudeB }) {
  const numericallyEquivalent = sameCoordinateFrame && angularDifferenceDegrees(longitudeA, longitudeB) <= COORDINATE_TOLERANCE_DEGREES;
  return { sameAstronomicalIdentity, sameCalculationConvention, sameCoordinateFrame, numericallyEquivalent };
}

/**
 * Resolves a dot-separated path against `chart` — see module doc comment
 * "EVIDENCE ADDRESSING" for the exact array-matching rule. Returns
 * `undefined` (never throws) if any segment cannot be found, so callers
 * (and tests) can distinguish "resolved to a real, possibly falsy value"
 * from "path is broken" by checking `!== undefined`.
 * @param {object} chart
 * @param {string} path
 * @returns {*}
 */
export function resolveEvidencePath(chart, path) {
  const segments = path.split(".");
  let current = chart;
  for (const segment of segments) {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current)) {
      current = current.find(
        (el) =>
          el?.id === segment ||
          el?.key === segment ||
          el?.planet === segment ||
          el?.pairId === segment ||
          (el?.bhavaNumber !== undefined && String(el.bhavaNumber) === segment) ||
          (el?.house !== undefined && String(el.house) === segment),
      );
    } else if (typeof current === "object") {
      current = current[segment];
    } else {
      return undefined;
    }
  }
  return current;
}

function descriptor({ system, category, concept, sourcePath, provenance, implemented, comparableFamily, note }) {
  return { system, category, concept, sourcePath, provenance, implemented, comparableFamily, ...(note ? { note } : {}) };
}

// ======================================================================
// PART B: SYSTEM REGISTRY
// ======================================================================

function buildSystemsRegistry(chart) {
  return {
    modernWestern: {
      available: Array.isArray(chart.points) && chart.points.length > 0,
      zodiacType: chart.meta.zodiacType,
      houseSystem: chart.meta.houseSystem,
      nodeType: chart.meta.nodeType,
      lilithType: chart.meta.lilithType,
      source: "chart.points / chart.planets / chart.angles / chart.houseCusps",
      summaryAvailable: false,
      summarySource: null,
      note: "Phase 2A never built a dedicated aggregation/summary layer like Phase 3H (Classical) or Phase 4F (Vedic) - its evidence is read directly from chart.points/chart.planets/chart.angles/chart.houseCusps.",
      sourcePhases: ["phase_1", "phase_2a"],
    },
    classical: {
      available: !!chart.classical,
      zodiacType: chart.classical.meta.zodiacType,
      source: "chart.classical",
      summaryAvailable: !!chart.classical.summary,
      summarySource: "chart.classical.summary",
      sourcePhases: ["phase_3a", "phase_3b", "phase_3c", "phase_3d", "phase_3e", "phase_3f", "phase_3ga", "phase_3gb", "phase_3h"],
    },
    vedic: {
      available: !!chart.vedic,
      zodiacType: chart.vedic.meta.zodiacType,
      source: "chart.vedic",
      summaryAvailable: !!chart.vedic.summary,
      summarySource: "chart.vedic.summary",
      sourcePhases: ["phase_4a", "phase_4b", "phase_4c", "phase_4d", "phase_4e", "phase_4f"],
    },
  };
}

// ======================================================================
// PART C: EVIDENCE AVAILABILITY MAP
// ======================================================================
//
// Each category's status is derived from a live predicate over the real
// `chart` object wherever the category is a coherent concept for that
// system ("implemented" if the predicate is true, "notImplemented"
// otherwise - a genuine structural check, not a guess). A small,
// explicitly documented set of cells is marked `notApplicable` instead —
// reserved for concepts that are architecturally foreign to that system
// (e.g. Vedic has no "house" in the tropical-cusp sense; it has a
// conceptually different Bhava, tracked under its own category) rather
// than a live check.

const NOT_APPLICABLE = {
  vedic: {
    houses: "Vedic uses Whole-Sign Bhava from the sidereal Lagna, a conceptually different structure - tracked under the 'bhava' category, never conflated with 'houses'.",
    nakshatra: null, // implemented; placeholder never used
  },
  modernWestern: {
    nakshatra: "Nakshatra is a Vedic sidereal-zodiac concept with no tropical Western equivalent in this project.",
    bhava: "Bhava is a Vedic house-structure concept with no tropical Western equivalent in this project.",
  },
  classical: {
    nakshatra: "Nakshatra is a Vedic sidereal-zodiac concept with no traditional Western equivalent in this project.",
    bhava: "Bhava is a Vedic house-structure concept; Classical uses the same tropical house framework as Modern Western instead.",
  },
};

function isNotApplicable(system, category) {
  return !!NOT_APPLICABLE[system]?.[category];
}

function buildEvidenceAvailability(chart) {
  const checks = {
    identity: {
      modernWestern: () => chart.points.every((p) => !!p.id),
      classical: () => chart.classical.planets.length === 7 && chart.classical.planets.every((p) => !!p.planet),
      vedic: () => Object.keys(chart.vedic.grahas).length === 9,
    },
    position: {
      modernWestern: () => chart.points.filter((p) => p.category !== "asteroid").every((p) => typeof p.absoluteLongitude === "number"),
      classical: () => chart.classical.planets.every((p) => typeof p.placement.absoluteLongitude === "number"),
      vedic: () => Object.values(chart.vedic.grahas).every((g) => typeof g.siderealLongitude === "number"),
    },
    zodiac: {
      modernWestern: () => !!chart.meta.zodiacType,
      classical: () => !!chart.classical.meta.zodiacType,
      vedic: () => !!chart.vedic.meta.zodiacType,
    },
    houses: {
      modernWestern: () => Array.isArray(chart.houseCusps) && chart.houseCusps.length === 12,
      classical: () => chart.classical.planets.every((p) => typeof p.placement.house === "number"),
    },
    houseLords: {
      modernWestern: () => typeof chart.houseLords !== "undefined",
      classical: () => typeof chart.classical.houseLords !== "undefined",
      vedic: () => !!chart.vedic.bhava.houseLords && Object.keys(chart.vedic.bhava.houseLords).length === 12,
    },
    angles: {
      modernWestern: () => !!chart.angles?.asc && !!chart.angles?.mc && !!chart.angles?.desc && !!chart.angles?.ic,
      classical: () => typeof chart.classical.angles !== "undefined",
      vedic: () => typeof chart.vedic.mc !== "undefined",
    },
    aspects: {
      modernWestern: () => typeof chart.aspects !== "undefined",
      classical: () => Array.isArray(chart.classical.aspects) && chart.classical.aspects.length === 21,
      vedic: () => typeof chart.vedic.aspects !== "undefined" && typeof chart.vedic.drishti !== "undefined",
    },
    dignity: {
      modernWestern: () => chart.points.some((p) => "dignity" in (p.meta ?? {})),
      classical: () => chart.classical.planets.every((p) => p.dignity && typeof p.dignity.domicile === "object"),
      vedic: () => CLASSICAL_GRAHA_TEST_KEYS.every((k) => !!chart.vedic.condition.planets[k]?.dignity?.dignityLabels),
    },
    sect: {
      modernWestern: () => !!chart.points.find((p) => p.id === "partOfFortune")?.meta?.sect,
      classical: () => !!chart.classical.sect,
      vedic: () => typeof chart.vedic.sect !== "undefined",
    },
    planetaryCondition: {
      modernWestern: () => chart.points.some((p) => "combustion" in (p.meta ?? {})),
      classical: () => chart.classical.planets.every((p) => !!p.condition),
      vedic: () => CLASSICAL_GRAHA_TEST_KEYS.every((k) => chart.vedic.condition.planets[k]?.condition?.combustion !== undefined),
    },
    dispositor: {
      modernWestern: () => typeof chart.dispositor !== "undefined",
      classical: () => chart.classical.planets.every((p) => !!p.dispositor),
      vedic: () => !!chart.vedic.lordship.dispositors,
    },
    reception: {
      modernWestern: () => typeof chart.reception !== "undefined",
      classical: () => Array.isArray(chart.classical.receptionMatrix),
      vedic: () => typeof chart.vedic.reception !== "undefined",
    },
    perfection: {
      modernWestern: () => typeof chart.perfection !== "undefined",
      classical: () => Array.isArray(chart.classical.directPerfection) && !!chart.classical.perfectionMechanics,
      vedic: () => typeof chart.vedic.perfection !== "undefined" && typeof chart.vedic.directPerfection !== "undefined",
    },
    nakshatra: {
      vedic: () => !!chart.vedic.nakshatra && Object.keys(chart.vedic.nakshatra.grahas).length === 9,
    },
    bhava: {
      vedic: () => !!chart.vedic.bhava && chart.vedic.bhava.houses.length === 12,
    },
    lordship: {
      modernWestern: () => typeof chart.lordship !== "undefined",
      classical: () => typeof chart.classical.lordship !== "undefined",
      vedic: () => !!chart.vedic.lordship,
    },
    motion: {
      modernWestern: () => chart.planets.every((p) => typeof p.speedDegPerDay === "number"),
      classical: () => chart.classical.planets.every((p) => !!p.condition.motion),
      vedic: () => Object.values(chart.vedic.grahas).every((g) => !!g.motion),
    },
    nodes: {
      modernWestern: () => !!chart.points.find((p) => p.id === "northNode") && !!chart.points.find((p) => p.id === "southNode"),
      classical: () => chart.classical.planets.some((p) => p.planet === "rahu" || p.planet === "ketu" || p.planet === "northNode"),
      vedic: () => !!chart.vedic.grahas.rahu && !!chart.vedic.grahas.ketu,
    },
    calculatedPoints: {
      modernWestern: () => !!chart.points.find((p) => p.id === "lilith") && !!chart.points.find((p) => p.id === "vertex") && !!chart.points.find((p) => p.id === "eastPoint"),
      classical: () => typeof chart.classical.lilith !== "undefined" && typeof chart.classical.vertex !== "undefined",
      vedic: () => typeof chart.vedic.lilith !== "undefined" && typeof chart.vedic.vertex !== "undefined",
    },
    provenance: {
      modernWestern: () => !!chart.meta,
      classical: () => !!chart.classical.meta,
      vedic: () => !!chart.vedic.meta,
    },
  };

  const availability = {};
  for (const [category, systemChecks] of Object.entries(checks)) {
    availability[category] = {};
    for (const system of ["modernWestern", "classical", "vedic"]) {
      if (isNotApplicable(system, category)) {
        availability[category][system] = { status: "notApplicable", reason: NOT_APPLICABLE[system][category] };
        continue;
      }
      const check = systemChecks[system];
      if (!check) {
        availability[category][system] = { status: "notImplemented" };
        continue;
      }
      availability[category][system] = { status: check(chart) ? "implemented" : "notImplemented" };
    }
  }
  return availability;
}

const CLASSICAL_GRAHA_TEST_KEYS = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];

// ======================================================================
// PART G/H: BODY IDENTITY MAP (+ node convention nuance)
// ======================================================================

function findPoint(chart, id) {
  return chart.points.find((p) => p.id === id);
}
function findClassicalPlanet(chart, key) {
  return chart.classical.planets.find((p) => p.planet === key);
}

function buildSharedPlanetIdentity(chart, key, displayName) {
  const wp = findPoint(chart, key);
  const cp = findClassicalPlanet(chart, key);
  const vg = chart.vedic.grahas[key];
  const vs = chart.vedic.summary.grahas[key];

  // Western vs Vedic is the only pair here whose "equivalence" was ever
  // ambiguous (see module doc comment "EQUIVALENCE DIMENSIONS"). Western
  // and Classical are known LIVE to share the identical tropical value
  // (Classical never recomputes a planet's position - it reads Phase 1's
  // own longitude verbatim), exposed as its own plain fact below rather
  // than folded into the tropical-vs-sidereal dimensions.
  const sameCoordinateFrame = chart.meta.zodiacType === chart.vedic.meta.zodiacType;
  const equivalence = buildEquivalence({
    sameAstronomicalIdentity: true,
    sameCalculationConvention: true, // one ephemeris read, reused verbatim by Classical, sidereal-converted by Vedic - no alternate convention exists for ordinary planets
    sameCoordinateFrame,
    longitudeA: wp.absoluteLongitude,
    longitudeB: vg.siderealLongitude,
  });

  return {
    canonicalBody: displayName,
    astronomicalKey: key,
    presentIn: ["modernWestern", "classical", "vedic"],
    systems: {
      modernWestern: {
        implemented: true,
        sourcePath: `points.${key}.absoluteLongitude`,
        longitude: wp.absoluteLongitude,
        sign: wp.sign.key ?? wp.sign,
        house: wp.house,
        provenance: "phase_2a",
      },
      classical: {
        implemented: true,
        sourcePath: `classical.summary.planets.${key}.position.absoluteLongitude`,
        longitude: chart.classical.summary.planets[key].position.absoluteLongitude,
        sign: chart.classical.summary.planets[key].position.sign,
        house: chart.classical.summary.planets[key].position.house,
        provenance: "phase_3a",
      },
      vedic: {
        implemented: true,
        sourcePath: `vedic.summary.grahas.${key}.position.siderealLongitude`,
        longitude: vg.siderealLongitude,
        sign: vg.rashi,
        bhava: vs.bhava.number,
        provenance: "phase_4a",
      },
    },
    // Describes the Modern-Western-vs-Vedic relationship specifically
    // (tropical vs. sidereal - see module doc comment). Western and
    // Classical's own relationship is the separate, live-checked fact
    // below - never merged into these four dimensions.
    ...equivalence,
    westernAndClassicalShareValue: wp.absoluteLongitude === chart.classical.summary.planets[key].position.absoluteLongitude,
    note: "Same astronomical body observed under three different astrological frameworks. Modern Western and Classical share the identical tropical longitude by direct reuse (see westernAndClassicalShareValue); Vedic's sidereal longitude is never expected to numerically match either, even when the underlying calculation convention is the same.",
  };
}

function buildOuterPlanetIdentity(chart, key, displayName) {
  const wp = findPoint(chart, key);
  return {
    canonicalBody: displayName,
    astronomicalKey: key,
    presentIn: ["modernWestern"],
    systems: {
      modernWestern: {
        implemented: true,
        sourcePath: `points.${key}.absoluteLongitude`,
        longitude: wp.absoluteLongitude,
        sign: wp.sign.key ?? wp.sign,
        house: wp.house,
        provenance: "phase_2a",
      },
      classical: { implemented: false, reason: "Classical astrology in this project scopes to the seven traditional (visible) planets only - never fabricated for the outer/modern planets." },
      vedic: { implemented: false, reason: "Vedic Navagraha does not include the outer/modern planets - never fabricated." },
    },
    sameAstronomicalIdentity: false,
    sameCalculationConvention: false,
    sameCoordinateFrame: false,
    numericallyEquivalent: false,
    note: "Modern-discovery body with no traditional/Vedic counterpart in this project - intentionally not mapped to either system, never approximated. All four equivalence dimensions are false because there is no second-system body to compare to at all, not because a comparison was attempted and failed.",
  };
}

function buildNodeIdentity(chart) {
  const wpNorth = findPoint(chart, "northNode");
  const wpSouth = findPoint(chart, "southNode");
  const westernNodeType = chart.meta.nodeType;
  const vedicNodeType = chart.vedic.meta.vedicNodeType;
  const sameCalculationConvention = westernNodeType === vedicNodeType;
  // Western node longitudes are always tropical; Vedic Rahu/Ketu are
  // always sidereal - live comparison, see module doc comment.
  const sameCoordinateFrame = chart.meta.zodiacType === chart.vedic.meta.zodiacType;

  function equivalenceNote(sameConvention, sameFrame) {
    if (!sameConvention) {
      return `Modern Western is using the ${westernNodeType} node convention while Vedic always uses the mean node - different calculation conventions, and (independently) different coordinate frames, so NOT numerically equivalent.`;
    }
    if (!sameFrame) {
      return `Both systems use the same node convention (${westernNodeType}) for this chart, but Modern Western's longitude is tropical and Vedic's is sidereal - matching calculation convention does NOT imply matching coordinate frame or numeric value; the two longitudes differ by the ayanamsha offset.`;
    }
    return "Both systems use the same node convention and the same coordinate frame for this chart.";
  }

  const ascendingEquivalence = buildEquivalence({
    sameAstronomicalIdentity: true,
    sameCalculationConvention,
    sameCoordinateFrame,
    longitudeA: wpNorth.absoluteLongitude,
    longitudeB: chart.vedic.grahas.rahu.siderealLongitude,
  });
  const descendingEquivalence = buildEquivalence({
    sameAstronomicalIdentity: true,
    sameCalculationConvention,
    sameCoordinateFrame,
    longitudeA: wpSouth.absoluteLongitude,
    longitudeB: chart.vedic.grahas.ketu.siderealLongitude,
  });

  return {
    ascendingNode: {
      concept: "lunar_ascending_node",
      presentIn: ["modernWestern", "vedic"],
      systems: {
        modernWestern: {
          implemented: true,
          label: "North Node",
          convention: westernNodeType,
          sourcePath: "points.northNode.absoluteLongitude",
          longitude: wpNorth.absoluteLongitude,
          sign: wpNorth.sign.key ?? wpNorth.sign,
          provenance: "phase_2a",
        },
        vedic: {
          implemented: true,
          label: "Rahu",
          convention: vedicNodeType,
          sourcePath: "vedic.summary.grahas.rahu.position.siderealLongitude",
          longitude: chart.vedic.grahas.rahu.siderealLongitude,
          sign: chart.vedic.grahas.rahu.rashi,
          provenance: "phase_4a",
        },
      },
      ...ascendingEquivalence,
      note: equivalenceNote(sameCalculationConvention, sameCoordinateFrame),
    },
    descendingNode: {
      concept: "lunar_descending_node",
      presentIn: ["modernWestern", "vedic"],
      systems: {
        modernWestern: {
          implemented: true,
          label: "South Node",
          convention: westernNodeType,
          sourcePath: "points.southNode.absoluteLongitude",
          longitude: wpSouth.absoluteLongitude,
          sign: wpSouth.sign.key ?? wpSouth.sign,
          provenance: "phase_2a",
        },
        vedic: {
          implemented: true,
          label: "Ketu",
          convention: vedicNodeType,
          sourcePath: "vedic.summary.grahas.ketu.position.siderealLongitude",
          longitude: chart.vedic.grahas.ketu.siderealLongitude,
          sign: chart.vedic.grahas.ketu.rashi,
          provenance: "phase_4a",
        },
      },
      ...descendingEquivalence,
      note: equivalenceNote(sameCalculationConvention, sameCoordinateFrame),
    },
  };
}

function buildBodyIdentities(chart) {
  const bodies = {};
  const displayNames = { sun: "Sun", moon: "Moon", mercury: "Mercury", venus: "Venus", mars: "Mars", jupiter: "Jupiter", saturn: "Saturn" };
  for (const key of SEVEN_CLASSICAL) {
    bodies[key] = buildSharedPlanetIdentity(chart, key, displayNames[key]);
  }
  const outerDisplayNames = { uranus: "Uranus", neptune: "Neptune", pluto: "Pluto" };
  for (const key of OUTER_WESTERN_ONLY) {
    bodies[key] = buildOuterPlanetIdentity(chart, key, outerDisplayNames[key]);
  }
  const { ascendingNode, descendingNode } = buildNodeIdentity(chart);
  bodies.northNode_rahu = ascendingNode;
  bodies.southNode_ketu = descendingNode;
  return bodies;
}

// ======================================================================
// PARTS D-M: CONCEPT FAMILIES (descriptor groups)
// ======================================================================

function buildConceptFamilies(chart) {
  const families = [];

  // --- D: SELF / IDENTITY STRUCTURE ---
  families.push({
    family: "self_identity",
    label: "Self / Identity Structure",
    description: "The chart's own 'first point' and its ruling/dispositing structure - NOT a claim that ASC, Lord of 1, and Lagna Lord are the same construct.",
    descriptors: [
      descriptor({ system: "modernWestern", category: "angles", concept: "ascendant", sourcePath: "points.asc.absoluteLongitude", provenance: "phase_2a", implemented: true, comparableFamily: "self_identity" }),
      descriptor({ system: "modernWestern", category: "identity", concept: "sun", sourcePath: "points.sun.absoluteLongitude", provenance: "phase_2a", implemented: true, comparableFamily: "self_identity" }),
      descriptor({ system: "modernWestern", category: "identity", concept: "moon", sourcePath: "points.moon.absoluteLongitude", provenance: "phase_2a", implemented: true, comparableFamily: "self_identity" }),
      descriptor({ system: "modernWestern", category: "houseLords", concept: "chart_ruler", sourcePath: null, provenance: "phase_2a", implemented: false, comparableFamily: "self_identity", note: "No rulership/dignity table exists in Phase 2A - never fabricated." }),
      descriptor({ system: "classical", category: "angles", concept: "ascendant", sourcePath: "points.asc.absoluteLongitude", provenance: "phase_2a", implemented: true, comparableFamily: "self_identity", note: "Classical reuses Phase 1's own Ascendant; it does not compute a second one." }),
      descriptor({ system: "classical", category: "houseLords", concept: "lord_of_1", sourcePath: null, provenance: "phase_3a", implemented: false, comparableFamily: "self_identity", note: "This project's Phase 3A-3H never exposed a dedicated 'ruler of the Ascendant's sign' field - never fabricated." }),
      descriptor({ system: "classical", category: "dignity", concept: "essential_and_accidental_condition", sourcePath: "classical.summary.chartOverview", provenance: "phase_3a", implemented: true, comparableFamily: "self_identity" }),
      descriptor({ system: "classical", category: "sect", concept: "chart_sect", sourcePath: "classical.summary.chartOverview.chartSect", provenance: "phase_3b", implemented: true, comparableFamily: "self_identity" }),
      descriptor({ system: "vedic", category: "position", concept: "lagna", sourcePath: "vedic.summary.chartOverview.lagna", provenance: "phase_4a", implemented: true, comparableFamily: "self_identity" }),
      descriptor({ system: "vedic", category: "houseLords", concept: "lagna_lord", sourcePath: "vedic.summary.lagnaLordNetwork.lagnaLord", provenance: "phase_4e", implemented: true, comparableFamily: "self_identity" }),
      descriptor({ system: "vedic", category: "houseLords", concept: "lagna_lord_bhava", sourcePath: "vedic.summary.lagnaLordNetwork.lagnaLordBhava", provenance: "phase_4e", implemented: true, comparableFamily: "self_identity" }),
      descriptor({ system: "vedic", category: "dignity", concept: "lagna_lord_dignity", sourcePath: "vedic.summary.lagnaLordNetwork.lagnaLordDignity", provenance: "phase_4d", implemented: true, comparableFamily: "self_identity" }),
      descriptor({ system: "vedic", category: "dispositor", concept: "lagna_lord_dispositor_chain", sourcePath: "vedic.summary.lagnaLordNetwork.dispositorChain", provenance: "phase_4e", implemented: true, comparableFamily: "self_identity" }),
    ],
  });

  // --- E: HOUSE STRUCTURE FAMILY ---
  families.push({
    family: "house_structure",
    label: "House Structure",
    description: "All three systems contain some form of 'houses', but westernHouse != vedicBhava - never normalized into one value.",
    descriptors: [
      descriptor({ system: "modernWestern", category: "houses", concept: "placidus_cusps", sourcePath: "houseCusps", provenance: "phase_1", implemented: true, comparableFamily: "house_structure" }),
      descriptor({ system: "modernWestern", category: "houses", concept: "planets_in_houses", sourcePath: "points.sun.house", provenance: "phase_1", implemented: true, comparableFamily: "house_structure" }),
      descriptor({ system: "classical", category: "houses", concept: "same_tropical_cusps", sourcePath: "classical.summary.planets.sun.position.house", provenance: "phase_1", implemented: true, comparableFamily: "house_structure", note: "Classical reuses the same Placidus/tropical house framework as Modern Western - it does not compute a second house system." }),
      descriptor({ system: "classical", category: "houseLords", concept: "house_ruler", sourcePath: null, provenance: "phase_3a", implemented: false, comparableFamily: "house_structure", note: "Never built as a dedicated field - never fabricated." }),
      descriptor({ system: "vedic", category: "bhava", concept: "whole_sign_bhava", sourcePath: "vedic.summary.bhavas.10.rashi", provenance: "phase_4b", implemented: true, comparableFamily: "house_structure", note: "Whole-Sign Bhava from the sidereal Lagna - a categorical, cusp-free structure. westernHouse != vedicBhava." }),
      descriptor({ system: "vedic", category: "houseLords", concept: "bhava_lord", sourcePath: "vedic.summary.bhavas.10.lord", provenance: "phase_4b", implemented: true, comparableFamily: "house_structure" }),
    ],
  });

  // --- F: ZODIAC FRAMEWORK FAMILY ---
  families.push({
    family: "zodiac_framework",
    label: "Zodiac Framework",
    description: "Sign names are NOT expected to match across tropical and sidereal frameworks - a coincidental match (or apparent mismatch) establishes nothing.",
    descriptors: [
      descriptor({ system: "modernWestern", category: "zodiac", concept: "tropical", sourcePath: "meta.zodiacType", provenance: "phase_1", implemented: true, comparableFamily: "zodiac_framework" }),
      descriptor({ system: "classical", category: "zodiac", concept: "tropical", sourcePath: "classical.meta.zodiacType", provenance: "phase_3a", implemented: true, comparableFamily: "zodiac_framework" }),
      descriptor({ system: "vedic", category: "zodiac", concept: "sidereal_lahiri_mean_no_nutation", sourcePath: "vedic.meta.ayanamshaImplementation", provenance: "phase_4a", implemented: true, comparableFamily: "zodiac_framework" }),
    ],
  });

  // --- I: DIGNITY FAMILY ---
  families.push({
    family: "planetary_status_by_sign",
    label: "Planetary Status by Sign (Dignity)",
    description: "Classical essential dignity != Vedic dignity - conceptually comparable, never numerically combined, never reduced to one shared number.",
    descriptors: [
      descriptor({ system: "modernWestern", category: "dignity", concept: "essential_dignity", sourcePath: null, provenance: "phase_2a", implemented: false, comparableFamily: "planetary_status_by_sign", note: "Phase 2A contains no dignity table - never invented." }),
      descriptor({ system: "classical", category: "dignity", concept: "essential_dignity", sourcePath: "classical.summary.planets.sun.essentialDignity", provenance: "phase_3a", implemented: true, comparableFamily: "planetary_status_by_sign" }),
      descriptor({ system: "vedic", category: "dignity", concept: "own_sign_exaltation_debilitation_moolatrikona", sourcePath: "vedic.summary.grahas.sun.dignity", provenance: "phase_4d", implemented: true, comparableFamily: "planetary_status_by_sign" }),
    ],
  });

  // --- J: DISPOSITOR FAMILY ---
  families.push({
    family: "dispositor_structure",
    label: "Dispositor Structure",
    description: "Classical (tropical traditional rulership) and Vedic (sidereal Rashi lordship) dispositors are conceptually related, never assumed identical, and their chains are never merged.",
    descriptors: [
      descriptor({ system: "classical", category: "dispositor", concept: "immediate_and_chain", sourcePath: "classical.summary.planets.sun.dispositor", provenance: "phase_3e", implemented: true, comparableFamily: "dispositor_structure" }),
      descriptor({ system: "vedic", category: "dispositor", concept: "immediate_and_chain", sourcePath: "vedic.summary.grahas.sun.dispositor", provenance: "phase_4e", implemented: true, comparableFamily: "dispositor_structure" }),
      descriptor({ system: "modernWestern", category: "dispositor", concept: "immediate_and_chain", sourcePath: null, provenance: "phase_2a", implemented: false, comparableFamily: "dispositor_structure", note: "Phase 2A has no rulership table - never fabricated." }),
    ],
  });

  // --- K: CONDITION FAMILY ---
  families.push({
    family: "planetary_condition",
    label: "Planetary Condition (Retrograde / Combustion / Motion / Sect)",
    description: "conceptFamily: solar_proximity_condition and motion are shared broad concepts, but Classical combustion thresholds != Vedic combustion thresholds - each system's actual condition value stays separate.",
    descriptors: [
      descriptor({ system: "modernWestern", category: "motion", concept: "retrograde_and_speed", sourcePath: "points.sun.motion", provenance: "phase_1", implemented: true, comparableFamily: "planetary_condition" }),
      descriptor({ system: "modernWestern", category: "planetaryCondition", concept: "combustion", sourcePath: null, provenance: "phase_2a", implemented: false, comparableFamily: "planetary_condition", note: "No combustion doctrine in Phase 2A - never invented." }),
      descriptor({ system: "modernWestern", category: "sect", concept: "day_night_sect", sourcePath: "points.partOfFortune.meta.sect", provenance: "phase_2a", implemented: true, comparableFamily: "planetary_condition" }),
      descriptor({ system: "classical", category: "planetaryCondition", concept: "combustion_and_solar_condition", sourcePath: "classical.summary.planets.sun.planetaryCondition", provenance: "phase_3b", implemented: true, comparableFamily: "planetary_condition" }),
      descriptor({ system: "classical", category: "sect", concept: "day_night_hayz_halb", sourcePath: "classical.summary.planets.sun.sectCondition", provenance: "phase_3d", implemented: true, comparableFamily: "planetary_condition" }),
      descriptor({ system: "classical", category: "motion", concept: "operational_condition", sourcePath: "classical.summary.planets.sun.operationalCondition", provenance: "phase_3c", implemented: true, comparableFamily: "planetary_condition" }),
      descriptor({ system: "vedic", category: "planetaryCondition", concept: "combustion", sourcePath: "vedic.summary.grahas.sun.condition.combustion", provenance: "phase_4d", implemented: true, comparableFamily: "planetary_condition" }),
      descriptor({ system: "vedic", category: "motion", concept: "retrograde", sourcePath: "vedic.summary.grahas.sun.condition.retrograde", provenance: "phase_4d", implemented: true, comparableFamily: "planetary_condition" }),
      descriptor({ system: "vedic", category: "sect", concept: "day_night_sect", sourcePath: null, provenance: "phase_4d", implemented: false, comparableFamily: "planetary_condition", note: "No day/night sect concept implemented for Vedic in this project - never fabricated." }),
    ],
  });

  // --- L: ASPECT FAMILY ---
  families.push({
    family: "aspects",
    label: "Aspects",
    description: "Vedic currently has NO Drishti implementation - never a fabricated Vedic aspect equivalence.",
    descriptors: [
      descriptor({ system: "modernWestern", category: "aspects", concept: "modern_aspect_grid", sourcePath: null, provenance: "phase_2a", implemented: false, comparableFamily: "aspects", note: "No aspect evidence exists in this project's Phase 2A." }),
      descriptor({ system: "classical", category: "aspects", concept: "major_aspects_application_separation", sourcePath: "classical.summary.relationships.sun-saturn.currentAspect", provenance: "phase_3f", implemented: true, comparableFamily: "aspects" }),
      descriptor({ system: "vedic", category: "aspects", concept: "drishti", sourcePath: null, provenance: "phase_4a", implemented: false, comparableFamily: "aspects", note: "vedicAspectStatus: not_implemented - Drishti is not built in this project." }),
    ],
  });

  // --- M: HOUSE-LORD / DOMAIN LORDSHIP FAMILY ---
  families.push({
    family: "domain_lordship",
    label: "Domain Lordship",
    description: "Western house ruler, Classical house ruler, and Vedic Bhava lord are a broad concept family only - tropical vs sidereal, Placidus vs Whole-Sign Bhava, and rulership convention all differ. No universal '10th ruler' field is created.",
    descriptors: [
      descriptor({ system: "modernWestern", category: "houseLords", concept: "tenth_house_ruler", sourcePath: null, provenance: "phase_2a", implemented: false, comparableFamily: "domain_lordship", note: "No rulership table in Phase 2A - never fabricated." }),
      descriptor({ system: "classical", category: "houseLords", concept: "tenth_house_ruler", sourcePath: null, provenance: "phase_3a", implemented: false, comparableFamily: "domain_lordship", note: "Never built as a dedicated field in this project's Classical implementation - never fabricated." }),
      descriptor({ system: "vedic", category: "lordship", concept: "tenth_bhava_lord", sourcePath: "vedic.summary.bhavas.10.lord", provenance: "phase_4b", implemented: true, comparableFamily: "domain_lordship" }),
      descriptor({ system: "vedic", category: "lordship", concept: "house_group_ownership", sourcePath: "vedic.summary.lordship.planets.sun", provenance: "phase_4e", implemented: true, comparableFamily: "domain_lordship" }),
    ],
  });

  // --- Classical-specific (reception, perfection - no Vedic equivalent) ---
  families.push({
    family: "classical_specific",
    label: "Classical-Specific Mechanics",
    description: "Reception and Horary Perfection mechanics exist only in this project's Classical implementation - never given a fabricated Vedic counterpart.",
    descriptors: [
      descriptor({ system: "classical", category: "reception", concept: "mutual_reception", sourcePath: "classical.summary.planets.sun.reception", provenance: "phase_3e", implemented: true, comparableFamily: "classical_specific" }),
      descriptor({ system: "classical", category: "perfection", concept: "direct_perfection_and_mechanics", sourcePath: "classical.summary.planets.sun.directPerfection", provenance: "phase_3ga", implemented: true, comparableFamily: "classical_specific" }),
      descriptor({ system: "vedic", category: "reception", concept: "mutual_reception", sourcePath: null, provenance: "phase_4d", implemented: false, comparableFamily: "classical_specific", note: "Vedic has a DIFFERENT, non-equivalent concept - natural sign relationship (friend/neutral/enemy) - never called 'reception'. See nonEquivalentConcepts." }),
      descriptor({ system: "vedic", category: "perfection", concept: "direct_perfection_and_mechanics", sourcePath: null, provenance: "phase_4a", implemented: false, comparableFamily: "classical_specific", note: "No Horary Perfection structure exists for Vedic in this project." }),
    ],
  });

  // --- Vedic-specific (Nakshatra, Bhava/lordship detail - no Western/Classical equivalent) ---
  families.push({
    family: "vedic_specific",
    label: "Vedic-Specific Structure",
    description: "Nakshatra/Pada and the full Bhava/lordship structural layer exist only in this project's Vedic implementation - notApplicable (not a gap) for Modern Western/Classical.",
    descriptors: [
      descriptor({ system: "vedic", category: "nakshatra", concept: "nakshatra_and_pada", sourcePath: "vedic.summary.grahas.sun.nakshatra", provenance: "phase_4c", implemented: true, comparableFamily: "vedic_specific" }),
      descriptor({ system: "vedic", category: "lordship", concept: "dispositor_loops_and_house_groups", sourcePath: "vedic.summary.lordship.dispositorNetwork", provenance: "phase_4e", implemented: true, comparableFamily: "vedic_specific" }),
    ],
  });

  // --- Western-specific (calculated points, outer planets - no Classical/Vedic equivalent) ---
  families.push({
    family: "western_specific",
    label: "Western-Specific Points",
    description: "Lilith, Part of Fortune, Vertex, East Point, and the outer/modern planets exist only in this project's Modern Western implementation.",
    descriptors: [
      descriptor({ system: "modernWestern", category: "calculatedPoints", concept: "lilith_fortune_vertex_eastpoint", sourcePath: "points.lilith.absoluteLongitude", provenance: "phase_2a", implemented: true, comparableFamily: "western_specific" }),
      descriptor({ system: "modernWestern", category: "identity", concept: "outer_planets", sourcePath: "points.uranus.absoluteLongitude", provenance: "phase_2a", implemented: true, comparableFamily: "western_specific" }),
    ],
  });

  return families;
}

// ======================================================================
// PART N: NON-EQUIVALENT CONCEPT REGISTRY
// ======================================================================

function buildNonEquivalentConcepts() {
  return [
    { conceptA: { system: "modernWestern", label: "Western House (Placidus cusp)" }, conceptB: { system: "vedic", label: "Vedic Bhava (Whole-Sign)" }, reason: "Degree-based cusp system vs. categorical whole-sign membership from the sidereal Lagna - different structural rule entirely, not merely a different zodiac." },
    { conceptA: { system: "classical", label: "Classical Essential Dignity" }, conceptB: { system: "vedic", label: "Vedic Dignity" }, reason: "Different rule tables (domicile/exaltation/triplicity/term/face vs. own-sign/exaltation/debilitation/Moolatrikona) computed against different zodiac frameworks - conceptually comparable, never numerically combined." },
    { conceptA: { system: "classical", label: "Classical Reception" }, conceptB: { system: "vedic", label: "Vedic Sign Relationship" }, reason: "Reception is a dignity-holder relationship between two actual chart placements; Vedic's natural sign relationship (friend/neutral/enemy) is a fixed planet-to-planet table applied to the current sign lord - structurally different mechanisms." },
    { conceptA: { system: "classical", label: "Classical Horary Perfection" }, conceptB: { system: "vedic", label: "Any current Vedic structure" }, reason: "No Vedic timing-mechanics structure exists in this project at all - there is nothing to equate Perfection to." },
    { conceptA: { system: "modernWestern", label: "Western Aspect" }, conceptB: { system: "classical", label: "Classical Horary Perfection" }, reason: "An aspect is a static geometric relationship; Perfection is a future-motion event-search outcome - different question entirely, even within the same tropical framework." },
    { conceptA: { system: "modernWestern", label: "True Node (default)" }, conceptB: { system: "vedic", label: "Mean Rahu" }, reason: "Different node conventions (osculating true node vs. mean node) AND different coordinate frames (tropical vs. sidereal) - not numerically equivalent. Even when Western is explicitly switched to the Mean Node (matching Vedic's convention), the two longitudes still differ by the full ayanamsha offset, since the coordinate frames remain different - matching convention alone never implies matching number." },
    { conceptA: { system: "modernWestern", label: "Placidus 10th House" }, conceptB: { system: "vedic", label: "Whole-Sign 10th Bhava" }, reason: "Different house-division rule entirely (degree-based cusp vs. whole-sign-from-Lagna) - a coincidental sign match establishes nothing." },
    { conceptA: { system: "modernWestern", label: "Modern Chart Ruler" }, conceptB: { system: "vedic", label: "Vedic Lagna Lord" }, reason: "Neither this project's Phase 2A nor its Classical implementation computes a 'chart ruler' field at all - and even if it did, it would be a tropical domicile lookup against a Placidus Ascendant, structurally distinct from the Vedic Lagna Lord's sidereal Whole-Sign lookup." },
    { conceptA: { system: "modernWestern", label: "MC" }, conceptB: { system: "vedic", label: "Vedic 10th Bhava" }, reason: "MC is a specific degree derived from the meridian; the 10th Bhava is the entire sign occupied by the whole-sign house 10 positions from the Lagna - not the same construct, and this project has not built a Vedic MC equivalent at all." },
    { conceptA: { system: "modernWestern", label: "ASC (tropical Ascendant)" }, conceptB: { system: "vedic", label: "Lagna (sidereal Ascendant)" }, reason: "Both are 'the rising point,' but computed in different coordinate frames (tropical vs. sidereal Lahiri) - never the same degree or sign. Classical reuses the identical tropical ASC as Modern Western; Vedic's Lagna is never expected to numerically match either." },
  ];
}

// ======================================================================
// PART O: COMPARISON GROUPS (derived from conceptFamilies)
// ======================================================================

function buildComparisonGroups(conceptFamilies) {
  const groups = {};
  for (const fam of conceptFamilies) {
    const availableIn = { modernWestern: [], classical: [], vedic: [] };
    for (const d of fam.descriptors) {
      if (d.implemented) availableIn[d.system].push(d.concept);
    }
    groups[fam.family] = { label: fam.label, description: fam.description, availableIn };
  }
  return groups;
}

// ======================================================================
// PART L (unresolvedMappings): derived live from evidenceAvailability
// ======================================================================

function buildUnresolvedMappings(evidenceAvailability) {
  const unresolved = [];
  for (const [category, systems] of Object.entries(evidenceAvailability)) {
    for (const [system, info] of Object.entries(systems)) {
      if (info.status === "notImplemented") {
        unresolved.push({ system, category, status: "notImplemented" });
      }
    }
  }
  return unresolved;
}

// ======================================================================
// PART P: TOP-LEVEL PROVENANCE
// ======================================================================

function buildProvenance() {
  return {
    modernWestern: ["phase_1", "phase_2a"],
    classical: ["phase_3a", "phase_3b", "phase_3c", "phase_3d", "phase_3e", "phase_3f", "phase_3ga", "phase_3gb", "phase_3h"],
    vedic: ["phase_4a", "phase_4b", "phase_4c", "phase_4d", "phase_4e", "phase_4f"],
    crossSystem: "phase_5",
    note: "Phase 5 is only the mapping source - it is never the source of the underlying astrology facts themselves.",
  };
}

/**
 * Builds the Phase 5 `chart.crossSystem` structure from an already-fully
 * -built chart (Phase 1/2A + Phase 3A-3H `chart.classical` + Phase 4A-4F
 * `chart.vedic` already attached). Pure mapping/aggregation - no new
 * astronomical calculation, no new astrology rule, no mutation of any
 * input, no cross-system merge.
 *
 * @param {object} params
 * @param {object} params.chart the fully-built chart (post chart.classical/chart.vedic)
 * @returns {object} `chart.crossSystem` (deep-cloned, mutation-isolated from every input)
 */
export function buildCrossSystemEvidence({ chart }) {
  const systems = buildSystemsRegistry(chart);
  const evidenceAvailability = buildEvidenceAvailability(chart);
  const bodyIdentities = buildBodyIdentities(chart);
  const conceptFamilies = buildConceptFamilies(chart);
  const nonEquivalentConcepts = buildNonEquivalentConcepts();
  const comparisonGroups = buildComparisonGroups(conceptFamilies);
  const unresolvedMappings = buildUnresolvedMappings(evidenceAvailability);
  const provenance = buildProvenance();

  const crossSystem = {
    meta: {
      crossSystemVersion: CROSS_SYSTEM_VERSION,
      crossSystemType: CROSS_SYSTEM_TYPE,
      crossSystemInterpretation: CROSS_SYSTEM_INTERPRETATION,
      crossSystemComparisonPolicy: CROSS_SYSTEM_COMPARISON_POLICY,
      crossSystemEquivalencePolicy: CROSS_SYSTEM_EQUIVALENCE_POLICY,
    },
    systems,
    evidenceAvailability,
    bodyIdentities,
    conceptFamilies,
    comparisonGroups,
    nonEquivalentConcepts,
    unresolvedMappings,
    provenance,
  };

  // Mutation isolation (matching Phase 4F's own established pattern):
  // mutating `chart.crossSystem` afterward can never corrupt any locked
  // Phase 1-4F source structure.
  return structuredClone(crossSystem);
}
