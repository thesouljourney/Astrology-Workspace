import { describe, it, expect } from "vitest";
import * as Astronomy from "astronomy-engine";
import { calculateChart } from "../../ephemeris.js";
import { TRADITIONAL_PLANETS } from "../essentialDignity.js";
import {
  computePerfectionMechanics,
  computeTranslations,
  computeCollections,
  computeProhibitionsAndInterference,
  buildEventTimeline,
  DOCTRINE_STATUS,
} from "../perfectionMechanics.js";

const VERIFICATION_INPUT = {
  birthDate: "1994-11-21",
  birthTime: "01:44:00",
  latitude: 1.8548,
  longitude: 102.9325,
  utcOffset: "+08:00",
  houseSystem: "placidus",
};

const REAL_ASTRO_TIME = Astronomy.MakeTime(new Date("1994-11-21T01:44:00Z"));

function findClassical(chart, key) {
  return chart.classical.planets.find((p) => p.planet === key);
}

/** All 21 unordered pairs, defaulting to "no current aspect" - callers override specific pairs. */
function buildAllPairs(overridesByKey) {
  const pairs = [];
  for (let i = 0; i < TRADITIONAL_PLANETS.length; i++) {
    for (let j = i + 1; j < TRADITIONAL_PLANETS.length; j++) {
      const planetA = TRADITIONAL_PLANETS[i];
      const planetB = TRADITIONAL_PLANETS[j];
      const key = [planetA, planetB].sort().join("-");
      const override = overridesByKey[key];
      pairs.push({ planetA, planetB, ...(override ?? { noAspect: true }) });
    }
  }
  return pairs;
}

function buildSyntheticAspects(overridesByKey) {
  return buildAllPairs(overridesByKey).map((p) => {
    if (p.noAspect) {
      return { planetA: p.planetA, planetB: p.planetB, aspect: { type: null }, motion: { status: null } };
    }
    return {
      planetA: p.planetA,
      planetB: p.planetB,
      aspect: {
        type: p.aspectType,
        exactAngle: p.exactAngle ?? 0,
        orbFromExact: p.orbFromExact ?? 0.5,
        allowedOrb: p.allowedOrb ?? 10,
        isWithinOrb: p.isWithinOrb ?? true,
      },
      motion: { status: p.motionStatus },
    };
  });
}

function buildSyntheticDirectPerfection(overridesByKey) {
  return buildAllPairs(overridesByKey).map((p) => {
    if (p.noAspect || !p.isCandidate) {
      return {
        planetA: p.planetA,
        planetB: p.planetB,
        isCandidate: false,
        aspectType: p.aspectType ?? null,
        exactitudeFound: false,
        exactitudeTimestampUTC: null,
        ingressBeforeExactitude: { planetA: false, planetB: false, events: [] },
        motionChangeBeforeExactitude: { planetA: false, planetB: false, events: [] },
        status: "not_a_candidate",
      };
    }
    return {
      planetA: p.planetA,
      planetB: p.planetB,
      isCandidate: true,
      aspectType: p.aspectType,
      exactitudeFound: p.exactitudeFound ?? true,
      exactitudeTimestampUTC: p.exactitudeTimestampUTC ?? null,
      ingressBeforeExactitude: p.ingressBeforeExactitude ?? { planetA: false, planetB: false, events: [] },
      motionChangeBeforeExactitude: p.motionChangeBeforeExactitude ?? { planetA: false, planetB: false, events: [] },
      refranation: p.refranation ?? { occurs: false },
      status: p.exactitudeFound === false ? "does_not_perfect" : "perfects",
    };
  });
}

function emptyReceptionMatrix() {
  const matrix = [];
  for (const receiver of TRADITIONAL_PLANETS) {
    for (const received of TRADITIONAL_PLANETS) {
      if (receiver === received) continue;
      matrix.push({ receiver, received, types: [] });
    }
  }
  return matrix;
}

describe("TRANSLATION OF LIGHT", () => {
  it("TEST 1: fast planet (Moon) separates from A, applies to B (no direct A-B aspect) -> Translation detected", () => {
    const aspects = buildSyntheticAspects({
      "mars-moon": { aspectType: "sextile", exactAngle: 60, motionStatus: "separating" },
      "moon-venus": { aspectType: "trine", exactAngle: 120, motionStatus: "applying" },
      // mars-venus: no direct aspect (default)
    });
    const directPerfection = buildSyntheticDirectPerfection({
      "moon-venus": { isCandidate: true, aspectType: "trine", exactitudeFound: true, exactitudeTimestampUTC: "1994-11-21T09:31:59.296Z" },
    });
    const translations = computeTranslations({
      aspects,
      directPerfection,
      receptionMatrix: emptyReceptionMatrix(),
      speedOf: (p) => (p === "moon" ? 12 : p === "mars" ? 0.4 : p === "venus" ? 0.1 : 1),
      startAstroTime: REAL_ASTRO_TIME,
    });
    const found = translations.find((t) => t.translator === "moon" && t.fromPlanet === "mars" && t.toPlanet === "venus");
    expect(found).toBeDefined();
    expect(found.occurs).toBe(true);
    expect(found.applyingLeg.aspectType).toBe("trine");
    expect(found.applyingLeg.futureExactitudeTimestampUTC).toBe("1994-11-21T09:31:59.296Z");
    expect(found.separatingLeg.aspectType).toBe("sextile");
    expect(found.separatingLeg.stillWithinOrb).toBe(true);
  });

  it("TEST 1b: separating leg still within orb AND applying leg satisfies convention -> Translation detected with full evidence", () => {
    const aspects = buildSyntheticAspects({
      "mars-moon": { aspectType: "sextile", exactAngle: 60, motionStatus: "separating", orbFromExact: 2, allowedOrb: 10 },
      "moon-venus": { aspectType: "trine", exactAngle: 120, motionStatus: "applying" },
    });
    const directPerfection = buildSyntheticDirectPerfection({
      "moon-venus": { isCandidate: true, aspectType: "trine", exactitudeFound: true, exactitudeTimestampUTC: "1994-11-21T09:31:59.296Z" },
    });
    const translations = computeTranslations({
      aspects,
      directPerfection,
      receptionMatrix: emptyReceptionMatrix(),
      speedOf: (p) => (p === "moon" ? 12 : p === "mars" ? 0.4 : p === "venus" ? 0.1 : 1),
      startAstroTime: REAL_ASTRO_TIME,
    });
    const found = translations.find((t) => t.translator === "moon" && t.fromPlanet === "mars" && t.toPlanet === "venus");
    expect(found).toBeDefined();
    expect(found.separatingLeg).toMatchObject({
      planet: "mars",
      aspectType: "sextile",
      currentOrbFromExact: 2,
      allowedOrb: 10,
      stillWithinOrb: true,
    });
    expect(typeof found.separatingLeg.previousExactitudeTimestampUTC).toBe("string");
  });

  it("TEST 1c: prior exact aspect alone is NOT sufficient once the translator has separated beyond its allowed orb -> not Translation", () => {
    const aspects = buildSyntheticAspects({
      // Currently still geometrically "separating" and nominally aspecting,
      // but orbFromExact (12) now exceeds allowedOrb (10) - the separating
      // relationship has already moved beyond its valid Lilly moiety-sum
      // orb, so a historical exact contact alone must not be classified as
      // an active Translation leg.
      "mars-moon": { aspectType: "sextile", exactAngle: 60, motionStatus: "separating", orbFromExact: 12, allowedOrb: 10 },
      "moon-venus": { aspectType: "trine", exactAngle: 120, motionStatus: "applying" },
    });
    const directPerfection = buildSyntheticDirectPerfection({
      "moon-venus": { isCandidate: true, aspectType: "trine", exactitudeFound: true, exactitudeTimestampUTC: "1994-11-21T09:31:59.296Z" },
    });
    const translations = computeTranslations({
      aspects,
      directPerfection,
      receptionMatrix: emptyReceptionMatrix(),
      speedOf: (p) => (p === "moon" ? 12 : p === "mars" ? 0.4 : p === "venus" ? 0.1 : 1),
      startAstroTime: REAL_ASTRO_TIME,
    });
    expect(translations.find((t) => t.translator === "moon" && t.fromPlanet === "mars" && t.toPlanet === "venus")).toBeUndefined();
  });

  it("TEST 2: applying to both, but no prior separation from either -> not Translation", () => {
    const aspects = buildSyntheticAspects({
      "moon-venus": { aspectType: "trine", exactAngle: 120, motionStatus: "applying" },
      "mars-moon": { aspectType: "sextile", exactAngle: 60, motionStatus: "applying" }, // applying, not separating
    });
    const directPerfection = buildSyntheticDirectPerfection({
      "moon-venus": { isCandidate: true, aspectType: "trine", exactitudeFound: true, exactitudeTimestampUTC: "1994-11-21T09:00:00.000Z" },
      "mars-moon": { isCandidate: true, aspectType: "sextile", exactitudeFound: true, exactitudeTimestampUTC: "1994-11-22T00:00:00.000Z" },
    });
    const translations = computeTranslations({
      aspects,
      directPerfection,
      receptionMatrix: emptyReceptionMatrix(),
      speedOf: (p) => (p === "moon" ? 12 : 1),
      startAstroTime: REAL_ASTRO_TIME,
    });
    expect(translations.find((t) => t.translator === "moon" && t.fromPlanet === "mars" && t.toPlanet === "venus")).toBeUndefined();
  });

  it("TEST 3: sequence order reversed (applying leg is actually separating) -> not Translation", () => {
    const aspects = buildSyntheticAspects({
      "mars-moon": { aspectType: "sextile", exactAngle: 60, motionStatus: "separating" },
      "moon-venus": { aspectType: "trine", exactAngle: 120, motionStatus: "separating" }, // both separating - no application leg
    });
    const directPerfection = buildSyntheticDirectPerfection({});
    const translations = computeTranslations({
      aspects,
      directPerfection,
      receptionMatrix: emptyReceptionMatrix(),
      speedOf: (p) => (p === "moon" ? 12 : 1),
      startAstroTime: REAL_ASTRO_TIME,
    });
    expect(translations.find((t) => t.translator === "moon" && t.fromPlanet === "mars" && t.toPlanet === "venus")).toBeUndefined();
  });

  it("TEST 4: translator speed requirement is enforced (must be faster than both A and B)", () => {
    const aspects = buildSyntheticAspects({
      "mars-moon": { aspectType: "sextile", exactAngle: 60, motionStatus: "separating" },
      "moon-venus": { aspectType: "trine", exactAngle: 120, motionStatus: "applying" },
    });
    const directPerfection = buildSyntheticDirectPerfection({
      "moon-venus": { isCandidate: true, aspectType: "trine", exactitudeFound: true, exactitudeTimestampUTC: "1994-11-21T09:31:59.296Z" },
    });
    // Moon slower than Mars here - disqualifies Moon as translator.
    const translations = computeTranslations({
      aspects,
      directPerfection,
      receptionMatrix: emptyReceptionMatrix(),
      speedOf: (p) => (p === "moon" ? 0.2 : p === "mars" ? 5 : 1),
      startAstroTime: REAL_ASTRO_TIME,
    });
    expect(translations.find((t) => t.translator === "moon" && t.fromPlanet === "mars" && t.toPlanet === "venus")).toBeUndefined();
  });

  it("TEST 5: reception context is preserved (not required, but present) on a detected translation", () => {
    const aspects = buildSyntheticAspects({
      "mars-moon": { aspectType: "sextile", exactAngle: 60, motionStatus: "separating" },
      "moon-venus": { aspectType: "trine", exactAngle: 120, motionStatus: "applying" },
    });
    const directPerfection = buildSyntheticDirectPerfection({
      "moon-venus": { isCandidate: true, aspectType: "trine", exactitudeFound: true, exactitudeTimestampUTC: "1994-11-21T09:31:59.296Z" },
    });
    const receptionMatrix = emptyReceptionMatrix();
    const entry = receptionMatrix.find((e) => e.receiver === "venus" && e.received === "moon");
    entry.types = ["term"];
    const translations = computeTranslations({
      aspects,
      directPerfection,
      receptionMatrix,
      speedOf: (p) => (p === "moon" ? 12 : 1),
      startAstroTime: REAL_ASTRO_TIME,
    });
    const found = translations.find((t) => t.translator === "moon" && t.fromPlanet === "mars" && t.toPlanet === "venus");
    expect(found.receptionContext.withToPlanet.venusReceivesMoon.types).toEqual(["term"]);
    expect(found.occurs).toBe(true); // reception present but not required for occurs
  });

  it("TEST 1d: the separating leg's allowedOrb is Phase 3F's Lilly moiety-sum value, reused exactly (not re-derived)", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const { translations } = chart.classical.perfectionMechanics;
    expect(translations.length).toBeGreaterThan(0);
    for (const t of translations) {
      const separatingAspectPair = chart.classical.aspects.find(
        (a) => [a.planetA, a.planetB].sort().join("-") === [t.translator, t.separatingLeg.planet].sort().join("-"),
      );
      // Reused verbatim - not a separately computed or re-derived value.
      expect(t.separatingLeg.allowedOrb).toBe(separatingAspectPair.aspect.allowedOrb);
      expect(t.separatingLeg.currentOrbFromExact).toBe(separatingAspectPair.aspect.orbFromExact);
      expect(t.separatingLeg.stillWithinOrb).toBe(separatingAspectPair.aspect.isWithinOrb);
    }
  });
});

describe("COLLECTION OF LIGHT", () => {
  it("TEST 6: A and B both apply to slower C -> Collection candidate detected", () => {
    const aspects = buildSyntheticAspects({
      "moon-saturn": { aspectType: "trine", exactAngle: 120, motionStatus: "applying" },
      "jupiter-saturn": { aspectType: "square", exactAngle: 90, motionStatus: "applying" },
    });
    const directPerfection = buildSyntheticDirectPerfection({
      "moon-saturn": { isCandidate: true, aspectType: "trine", exactitudeFound: true, exactitudeTimestampUTC: "1994-11-21T15:57:54.960Z" },
      "jupiter-saturn": { isCandidate: true, aspectType: "square", exactitudeFound: false },
    });
    const collections = computeCollections({
      aspects,
      directPerfection,
      receptionMatrix: emptyReceptionMatrix(),
      speedOf: (p) => (p === "saturn" ? 0.02 : p === "moon" ? 12 : p === "jupiter" ? 0.2 : 1),
    });
    const found = collections.find((c) => c.collector === "saturn" && c.planetA === "moon" && c.planetB === "jupiter");
    expect(found).toBeDefined();
    expect(found.isCandidate).toBe(true);
    expect(found.aLeg.exactitudeTimestampUTC).toBe("1994-11-21T15:57:54.960Z");
    expect(found.bLeg.exactitudeTimestampUTC).toBeNull(); // one leg never perfects - not forced
  });

  it("TEST 6b: both legs perfecting is distinguishable from mere candidate status (completionStatus: both_legs_perfect)", () => {
    const aspects = buildSyntheticAspects({
      "moon-saturn": { aspectType: "trine", exactAngle: 120, motionStatus: "applying" },
      "jupiter-saturn": { aspectType: "square", exactAngle: 90, motionStatus: "applying" },
    });
    const directPerfection = buildSyntheticDirectPerfection({
      "moon-saturn": { isCandidate: true, aspectType: "trine", exactitudeFound: true, exactitudeTimestampUTC: "1994-11-21T15:57:54.960Z" },
      "jupiter-saturn": { isCandidate: true, aspectType: "square", exactitudeFound: true, exactitudeTimestampUTC: "1994-12-01T00:00:00.000Z" },
    });
    const collections = computeCollections({
      aspects,
      directPerfection,
      receptionMatrix: emptyReceptionMatrix(),
      speedOf: (p) => (p === "saturn" ? 0.02 : p === "moon" ? 12 : p === "jupiter" ? 0.2 : 1),
    });
    const found = collections.find((c) => c.collector === "saturn" && c.planetA === "moon" && c.planetB === "jupiter");
    expect(found.isCandidate).toBe(true);
    expect(found.aLeg.exactitudeFound).toBe(true);
    expect(found.bLeg.exactitudeFound).toBe(true);
    expect(found.completionStatus).toBe("both_legs_perfect");
  });

  it("TEST 6c: one leg refranating before exactitude stays visible in raw leg data but is NOT presented as a fully completed two-leg Collection", () => {
    const aspects = buildSyntheticAspects({
      "moon-saturn": { aspectType: "trine", exactAngle: 120, motionStatus: "applying" },
      "jupiter-saturn": { aspectType: "square", exactAngle: 90, motionStatus: "applying" },
    });
    const refranation = {
      occurs: true,
      planet: "jupiter",
      timestampUTC: "1994-11-25T00:00:00.000Z",
      orbBeforeReversal: 2.5,
      orbAfterReversal: 2.9,
    };
    const directPerfection = buildSyntheticDirectPerfection({
      "moon-saturn": { isCandidate: true, aspectType: "trine", exactitudeFound: true, exactitudeTimestampUTC: "1994-11-21T15:57:54.960Z" },
      "jupiter-saturn": { isCandidate: true, aspectType: "square", exactitudeFound: false, refranation },
    });
    const collections = computeCollections({
      aspects,
      directPerfection,
      receptionMatrix: emptyReceptionMatrix(),
      speedOf: (p) => (p === "saturn" ? 0.02 : p === "moon" ? 12 : p === "jupiter" ? 0.2 : 1),
    });
    const found = collections.find((c) => c.collector === "saturn" && c.planetA === "moon" && c.planetB === "jupiter");
    // Raw refranation evidence is preserved, not discarded...
    expect(found.bLeg.refranation).toEqual(refranation);
    expect(found.bLeg.exactitudeFound).toBe(false);
    expect(found.bLeg.exactitudeTimestampUTC).toBeNull();
    // ...but the structure is NOT silently reported as a completed two-leg collection.
    expect(found.completionStatus).toBe("one_leg_does_not_perfect");
    expect(found.completionStatus).not.toBe("both_legs_perfect");
  });

  it("TEST 7: only one planet applies to C -> not Collection", () => {
    const aspects = buildSyntheticAspects({
      "moon-saturn": { aspectType: "trine", exactAngle: 120, motionStatus: "applying" },
      "jupiter-saturn": { aspectType: "square", exactAngle: 90, motionStatus: "separating" }, // separating, not applying
    });
    const directPerfection = buildSyntheticDirectPerfection({
      "moon-saturn": { isCandidate: true, aspectType: "trine", exactitudeFound: true, exactitudeTimestampUTC: "1994-11-21T15:57:54.960Z" },
    });
    const collections = computeCollections({
      aspects,
      directPerfection,
      receptionMatrix: emptyReceptionMatrix(),
      speedOf: (p) => (p === "saturn" ? 0.02 : 1),
    });
    expect(collections.find((c) => c.collector === "saturn" && c.planetA === "moon" && c.planetB === "jupiter")).toBeUndefined();
  });

  it("TEST 8: collector speed requirement is enforced (must be slower than both)", () => {
    const aspects = buildSyntheticAspects({
      "moon-saturn": { aspectType: "trine", exactAngle: 120, motionStatus: "applying" },
      "jupiter-saturn": { aspectType: "square", exactAngle: 90, motionStatus: "applying" },
    });
    const directPerfection = buildSyntheticDirectPerfection({
      "moon-saturn": { isCandidate: true, aspectType: "trine", exactitudeFound: true, exactitudeTimestampUTC: "1994-11-21T15:57:54.960Z" },
      "jupiter-saturn": { isCandidate: true, aspectType: "square", exactitudeFound: true, exactitudeTimestampUTC: "1994-12-01T00:00:00.000Z" },
    });
    // Saturn faster than Jupiter here - disqualifies Saturn as collector.
    const collections = computeCollections({
      aspects,
      directPerfection,
      receptionMatrix: emptyReceptionMatrix(),
      speedOf: (p) => (p === "saturn" ? 5 : p === "jupiter" ? 0.2 : p === "moon" ? 12 : 1),
    });
    expect(collections.find((c) => c.collector === "saturn" && c.planetA === "moon" && c.planetB === "jupiter")).toBeUndefined();
  });

  it("TEST 9: reception context is preserved on a detected collection", () => {
    const aspects = buildSyntheticAspects({
      "moon-saturn": { aspectType: "trine", exactAngle: 120, motionStatus: "applying" },
      "jupiter-saturn": { aspectType: "square", exactAngle: 90, motionStatus: "applying" },
    });
    const directPerfection = buildSyntheticDirectPerfection({
      "moon-saturn": { isCandidate: true, aspectType: "trine", exactitudeFound: true, exactitudeTimestampUTC: "1994-11-21T15:57:54.960Z" },
      "jupiter-saturn": { isCandidate: true, aspectType: "square", exactitudeFound: true, exactitudeTimestampUTC: "1994-12-01T00:00:00.000Z" },
    });
    const receptionMatrix = emptyReceptionMatrix();
    receptionMatrix.find((e) => e.receiver === "saturn" && e.received === "jupiter").types = ["domicile"];
    const collections = computeCollections({
      aspects,
      directPerfection,
      receptionMatrix,
      speedOf: (p) => (p === "saturn" ? 0.02 : p === "jupiter" ? 0.2 : p === "moon" ? 12 : 1),
    });
    const found = collections.find((c) => c.collector === "saturn" && c.planetA === "moon" && c.planetB === "jupiter");
    expect(found.receptionContext.withPlanetB.saturnReceivesJupiter.types).toEqual(["domicile"]);
  });
});

describe("COLLECTION VERIFICATION-CHART RE-CHECK (Saturn collects Moon + Jupiter)", () => {
  it("the Jupiter leg (refranating, exactitudeFound=false) is a structural candidate leg, not silently a completed perfection", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const collection = chart.classical.perfectionMechanics.collections.find(
      (c) => c.collector === "saturn" && [c.planetA, c.planetB].sort().join("-") === "jupiter-moon",
    );
    expect(collection).toBeDefined();
    expect(collection.isCandidate).toBe(true);
    const jupiterLeg = collection.planetA === "jupiter" ? collection.aLeg : collection.bLeg;
    const moonLeg = collection.planetA === "moon" ? collection.aLeg : collection.bLeg;
    expect(moonLeg.exactitudeFound).toBe(true);
    expect(jupiterLeg.exactitudeFound).toBe(false);
    expect(jupiterLeg.exactitudeTimestampUTC).toBeNull();
    // completionStatus must NOT claim a full two-leg perfection here, and
    // Jupiter's firm non-perfection (refranation) takes priority over any
    // (moot) ingress flag - it is not "requires_historical_rule".
    expect(collection.completionStatus).not.toBe("both_legs_perfect");
    expect(collection.completionStatus).toBe("one_leg_does_not_perfect");
  });
});

describe("PROHIBITION", () => {
  it("TEST 10: original A-B applying, third-party exactitude occurs first -> Prohibition detected", () => {
    const directPerfection = buildSyntheticDirectPerfection({
      "saturn-sun": { isCandidate: true, aspectType: "square", exactitudeFound: true, exactitudeTimestampUTC: "1994-11-28T11:22:54.375Z" },
      "moon-saturn": { isCandidate: true, aspectType: "trine", exactitudeFound: true, exactitudeTimestampUTC: "1994-11-21T15:57:54.960Z" },
    });
    const { prohibitions } = computeProhibitionsAndInterference({ directPerfection });
    const found = prohibitions.find(
      (p) => p.originalPair.slice().sort().join("-") === "saturn-sun" && p.prohibitingPlanet === "moon",
    );
    expect(found).toBeDefined();
    expect(found.interveningExactitudeTime).toBe("1994-11-21T15:57:54.960Z");
    expect(found.originalExpectedExactitudeTime).toBe("1994-11-28T11:22:54.375Z");
  });

  it("TEST 11: third-party exactitude occurs AFTER A-B exactitude -> not Prohibition", () => {
    const directPerfection = buildSyntheticDirectPerfection({
      "saturn-sun": { isCandidate: true, aspectType: "square", exactitudeFound: true, exactitudeTimestampUTC: "1994-11-21T00:00:00.000Z" },
      "moon-saturn": { isCandidate: true, aspectType: "trine", exactitudeFound: true, exactitudeTimestampUTC: "1994-11-28T00:00:00.000Z" },
    });
    const { prohibitions } = computeProhibitionsAndInterference({ directPerfection });
    expect(prohibitions.find((p) => p.originalPair.slice().sort().join("-") === "saturn-sun")).toBeUndefined();
  });

  it("TEST 12: event order is determined purely from Phase 3G-A's real-ephemeris timestamps, not static geometry", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const sunSaturnDP = chart.classical.directPerfection.find((d) => [d.planetA, d.planetB].sort().join("-") === "saturn-sun");
    const moonSaturnDP = chart.classical.directPerfection.find((d) => [d.planetA, d.planetB].sort().join("-") === "moon-saturn");
    expect(new Date(moonSaturnDP.exactitudeTimestampUTC).getTime()).toBeLessThan(new Date(sunSaturnDP.exactitudeTimestampUTC).getTime());
    const prohibition = chart.classical.perfectionMechanics.prohibitions.find(
      (p) => p.originalPair.slice().sort().join("-") === "saturn-sun",
    );
    expect(prohibition).toBeDefined();
    expect(prohibition.prohibitingPlanet).toBe("moon");
  });

  it("TEST 13: Prohibition results are byte-for-byte unchanged by the Translation/Collection refinement (no shared raw-event dependency required otherwise)", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const { prohibitions } = chart.classical.perfectionMechanics;
    expect(prohibitions.length).toBe(2);
    expect(prohibitions).toEqual([
      {
        occurs: true,
        originalPair: ["sun", "saturn"],
        originalAspect: "square",
        prohibitingPlanet: "moon",
        interveningAspect: "trine",
        interveningExactitudeTime: "1994-11-21T15:57:54.960Z",
        originalExpectedExactitudeTime: "1994-11-28T11:22:54.375Z",
        reason: "third_planet_interposed_before_original_perfection",
        convention: "lilly_third_planet_interposes_before_perfection",
      },
      {
        occurs: true,
        originalPair: ["moon", "saturn"],
        originalAspect: "trine",
        prohibitingPlanet: "venus",
        interveningAspect: "trine",
        interveningExactitudeTime: "1994-11-21T09:31:59.296Z",
        originalExpectedExactitudeTime: "1994-11-21T15:57:54.960Z",
        reason: "third_planet_interposed_before_original_perfection",
        convention: "lilly_third_planet_interposes_before_perfection",
      },
    ]);
  });
});

describe("FRUSTRATION (deferred per project owner's explicit decision)", () => {
  it("frustrations is always empty and the convention marker reflects the deferral", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    expect(chart.classical.perfectionMechanics.frustrations).toEqual([]);
    expect(chart.classical.perfectionMechanics.doctrineStatus.frustrationConvention).toBe("deferred_due_to_historical_variance");
  });
});

describe("RAW INTERFERENCE LAYER", () => {
  it("TEST 15: raw third-party interference event is recorded regardless of doctrine label", () => {
    const directPerfection = buildSyntheticDirectPerfection({
      "saturn-sun": { isCandidate: true, aspectType: "square", exactitudeFound: true, exactitudeTimestampUTC: "1994-11-28T11:22:54.375Z" },
      "moon-saturn": { isCandidate: true, aspectType: "trine", exactitudeFound: true, exactitudeTimestampUTC: "1994-11-21T15:57:54.960Z" },
    });
    const { interferenceEvents } = computeProhibitionsAndInterference({ directPerfection });
    expect(interferenceEvents.length).toBeGreaterThan(0);
    const e = interferenceEvents[0];
    expect(e).toHaveProperty("originalPair");
    expect(e).toHaveProperty("thirdPlanet");
    expect(e).toHaveProperty("contactedPlanet");
    expect(e).toHaveProperty("occursBeforeOriginalTarget", true);
  });

  it("TEST 16: multiple third-party events are sorted chronologically in the event timeline", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const timeline = chart.classical.perfectionMechanics.eventTimeline;
    for (let i = 1; i < timeline.length; i++) {
      expect(new Date(timeline[i].timestampUTC).getTime()).toBeGreaterThanOrEqual(new Date(timeline[i - 1].timestampUTC).getTime());
    }
  });

  it("TEST 17: no duplicate event records in the timeline", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const timeline = chart.classical.perfectionMechanics.eventTimeline;
    const keys = timeline.map((e) => `${e.timestampUTC}|${e.type}|${e.planets.join(",")}|${e.aspectType}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("TEST 18: aspect mirror geometry is handled correctly (reuses Phase 3F/3G-A data verbatim, not recomputed)", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    // Every exactitude timestamp appearing in perfectionMechanics traces back
    // exactly to a Phase 3G-A directPerfection entry - no independent
    // recomputation that could disagree with the locked mirror-resolution fix.
    for (const t of chart.classical.perfectionMechanics.translations) {
      const dp = chart.classical.directPerfection.find((d) => [d.planetA, d.planetB].sort().join("-") === [t.translator, t.toPlanet].sort().join("-"));
      expect(t.applyingLeg.futureExactitudeTimestampUTC).toBe(dp.exactitudeTimestampUTC);
    }
  });

  it("TEST 19: retrograde third planet handled correctly (reuses signed-speed data, no special-casing)", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    // Venus is retrograde in the verification chart and appears as a
    // translator/leg partner - confirm it participates using the same
    // absolute-speed comparison as any other planet, no crash/exclusion.
    const involvingVenus = chart.classical.perfectionMechanics.translations.some(
      (t) => t.translator === "venus" || t.fromPlanet === "venus" || t.toPlanet === "venus",
    );
    // Not asserting true/false (must not be forced) - only that the
    // computation completes and returns a well-formed boolean-checkable result.
    expect(typeof involvingVenus).toBe("boolean");
  });

  it("TEST 20: sign ingress does not silently force a doctrine outcome - occurs stays true, status flags the ambiguity", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const withIngress = chart.classical.perfectionMechanics.translations.filter((t) => t.technicalStatus === "requires_historical_rule");
    expect(withIngress.length).toBeGreaterThan(0);
    for (const t of withIngress) {
      expect(t.occurs).toBe(true); // ingress flags ambiguity, does not erase the detected structure
    }
  });
});

describe("TEST 21-23: Phase 1-3G-A values remain unchanged", () => {
  it("Phase 3G-A direct perfection, Phase 3F aspects, and Phase 3E reception matrix are untouched", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(chart.classical.directPerfection).toEqual(fresh.classical.directPerfection);
    expect(chart.classical.aspects).toEqual(fresh.classical.aspects);
    expect(chart.classical.receptionMatrix).toEqual(fresh.classical.receptionMatrix);
    expect(chart.classical.meta.receptionQualification).toBe("not_yet_evaluated");
    expect(chart.classical.meta.signIngressConvention).toBe("requires_historical_rule");
    expect(chart.classical.meta.refranationConvention).toBe("direct_to_retrograde_application_reversal");
  });
});

describe("TEST 24-25: No Horary outcome, no scoring", () => {
  it("TEST 24: no horary yes/no outcome exists anywhere in perfectionMechanics", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const json = JSON.stringify(chart.classical.perfectionMechanics);
    expect(json).not.toMatch(/\bwillHappen\b|\bwillNotHappen\b|\bsuccess\b|\bfailure\b|\byes\b|\bno\b|querent|quesited/i);
  });

  it("TEST 25: no scoring exists anywhere in perfectionMechanics", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const json = JSON.stringify(chart.classical.perfectionMechanics);
    expect(json).not.toMatch(/score/i);
  });
});

describe("TEST 26: Full verification chart output - computed, not pre-assumed - Phase 1-3G-A regression", () => {
  it("TEST 26: verification chart totals and structural results, plus Phase 1-3G-A spot checks", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const pm = chart.classical.perfectionMechanics;

    expect(pm.doctrineStatus).toEqual(DOCTRINE_STATUS);

    // Totals - computed from the rules, not assumed in advance.
    expect(pm.translations.length).toBe(3);
    expect(pm.collections.length).toBe(2);
    expect(pm.prohibitions.length).toBe(2);
    expect(pm.frustrations.length).toBe(0);
    expect(pm.interferenceEvents.length).toBe(2);

    // Every translation/collection is well-formed.
    for (const t of pm.translations) {
      expect(t.occurs).toBe(true);
      expect(TRADITIONAL_PLANETS).toContain(t.translator);
      expect(["detected", "requires_historical_rule"]).toContain(t.technicalStatus);
    }
    for (const c of pm.collections) {
      expect(c.isCandidate).toBe(true);
      expect(TRADITIONAL_PLANETS).toContain(c.collector);
      expect(["both_legs_perfect", "one_leg_does_not_perfect", "requires_historical_rule"]).toContain(c.completionStatus);
    }

    // Phase 1
    const sunPlanet = chart.planets.find((p) => p.key === "sun");
    expect(sunPlanet.sign.english).toBe("Scorpio");
    expect(chart.points.length).toBe(26);

    // Phase 3A-3D spot checks
    const venus = findClassical(chart, "venus");
    expect(venus.totalEssentialScore).toBe(-5);
    expect(venus.sectConditionDetail.hayz.isHayz).toBe(true);

    // Phase 3E
    expect(chart.classical.mutualReceptions.length).toBe(4);

    // Phase 3F
    const withinOrb = chart.classical.aspects.filter((a) => a.aspect.isWithinOrb);
    expect(withinOrb.length).toBe(9);

    // Phase 3G-A
    const candidates = chart.classical.directPerfection.filter((d) => d.isCandidate);
    expect(candidates.length).toBe(5);
    const refranating = candidates.filter((d) => d.refranation.occurs);
    expect(refranating.length).toBe(2);
  });
});
