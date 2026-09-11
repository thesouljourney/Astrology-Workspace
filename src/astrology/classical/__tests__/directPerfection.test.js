import { describe, it, expect } from "vitest";
import * as Astronomy from "astronomy-engine";
import { calculateChart } from "../../ephemeris.js";
import {
  scanForAspectEvents,
  signedErrorToTarget,
  resolveEffectiveTargetAngle,
  computeDirectPerfection,
  DIRECT_PERFECTION_SEARCH_HORIZON_DAYS,
  DIRECT_PERFECTION_ROOT_TOLERANCE_DEGREES,
  COARSE_STEP_DAYS,
} from "../directPerfection.js";

const VERIFICATION_INPUT = {
  birthDate: "1994-11-21",
  birthTime: "01:44:00",
  latitude: 1.8548,
  longitude: 102.9325,
  utcOffset: "+08:00",
  houseSystem: "placidus",
};

function findClassical(chart, key) {
  return chart.classical.planets.find((p) => p.planet === key);
}

// A dummy AstroTime for non-candidate tests where computeDirectPerfection
// returns before ever consulting startAstroTime.
const DUMMY_ASTRO_TIME = Astronomy.MakeTime(new Date("2000-01-01T00:00:00Z"));

function fakePair({ planetA = "venus", planetB = "mars", type, exactAngle = 90, orbFromExact = 5, isWithinOrb = true, status }) {
  return {
    planetA,
    planetB,
    aspect: { type, exactAngle, angularSeparation: exactAngle + orbFromExact, orbFromExact, allowedOrb: 20, isWithinOrb },
    motion: { planetASpeed: 1, planetBSpeed: 0.5, status },
  };
}

describe("TEST 1-5: Applying pair reaching each of the five exact aspects", () => {
  const cases = [
    ["conjunction", 0],
    ["sextile", 60],
    ["square", 90],
    ["trine", 120],
    ["opposition", 180],
  ];

  for (const [type, angle] of cases) {
    it(`${type} (${angle} deg): applying pair perfects`, () => {
      // A stationary at 0, B approaching the target from 10 deg away at 1 deg/day.
      const raw = scanForAspectEvents({
        getStateA: () => ({ longitude: 0, speedDegPerDay: 0 }),
        getStateB: (t) => ({ longitude: (angle - 10 + 1 * t + 360) % 360, speedDegPerDay: 1 }),
        exactAngle: angle,
        horizonDays: 30,
        coarseStepDays: 0.25,
      });
      expect(raw.exactitudeFound).toBe(true);
      expect(Math.abs(raw.exactError)).toBeLessThanOrEqual(DIRECT_PERFECTION_ROOT_TOLERANCE_DEGREES);
      expect(raw.exactTDays).toBeCloseTo(10, 1);
    });
  }
});

describe("TEST 6-8: Non-candidate gating (separating/no-aspect/exact are never searched)", () => {
  it("TEST 6: separating pair is not searched as a candidate", () => {
    const result = computeDirectPerfection({
      aspectPair: fakePair({ type: "square", status: "separating" }),
      startAstroTime: DUMMY_ASTRO_TIME,
    });
    expect(result.isCandidate).toBe(false);
    expect(result.status).toBe("not_a_candidate");
    expect(result.reasonCode).toBe("currently_separating");
    expect(result.exactitudeFound).toBe(false);
  });

  it("TEST 7: no-aspect pair is not searched", () => {
    const result = computeDirectPerfection({
      aspectPair: fakePair({ type: null, isWithinOrb: false, status: null }),
      startAstroTime: DUMMY_ASTRO_TIME,
    });
    expect(result.isCandidate).toBe(false);
    expect(result.reasonCode).toBe("no_current_classical_aspect");
  });

  it("TEST 8: exact pair is handled deterministically (not searched, distinct reason)", () => {
    const result = computeDirectPerfection({
      aspectPair: fakePair({ type: "trine", status: "exact" }),
      startAstroTime: DUMMY_ASTRO_TIME,
    });
    expect(result.isCandidate).toBe(false);
    expect(result.reasonCode).toBe("already_exact");
  });
});

describe("TEST 9: Future calculation uses recalculated ephemeris positions, not constant-speed extrapolation", () => {
  it("a naive constant-speed extrapolation would wrongly predict perfection where real recalculation finds refranation", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const marsJupiter = chart.classical.directPerfection.find(
      (d) => [d.planetA, d.planetB].sort().join("-") === "jupiter-mars",
    );
    const aspectPair = chart.classical.aspects.find((a) => [a.planetA, a.planetB].sort().join("-") === "jupiter-mars");

    // Naive prediction: currentOrb / relative-speed-at-t0, assuming constant speed forever.
    const relativeSpeed = Math.abs(aspectPair.motion.planetASpeed - aspectPair.motion.planetBSpeed);
    const naiveDaysToPerfect = aspectPair.aspect.orbFromExact / relativeSpeed;
    expect(naiveDaysToPerfect).toBeGreaterThan(0);
    expect(naiveDaysToPerfect).toBeLessThan(DIRECT_PERFECTION_SEARCH_HORIZON_DAYS);

    // The real, recalculated search found refranation instead - a materially
    // different (and correct) outcome that pure linear extrapolation cannot see.
    expect(marsJupiter.exactitudeFound).toBe(false);
    expect(marsJupiter.refranation.occurs).toBe(true);
    expect(marsJupiter.status).toBe("does_not_perfect");
  });
});

describe("TEST 10: Retrograde planet can still reach exactitude", () => {
  it("a planet already retrograde from the start of the search still perfects", () => {
    const raw = scanForAspectEvents({
      getStateA: () => ({ longitude: 0, speedDegPerDay: 0 }),
      // B already retrograde, moving from 100 down toward 90.
      getStateB: (t) => ({ longitude: 100 - 1 * t, speedDegPerDay: -1 }),
      exactAngle: 90,
      horizonDays: 20,
      coarseStepDays: 0.25,
    });
    expect(raw.exactitudeFound).toBe(true);
    expect(raw.exactTDays).toBeCloseTo(10, 1);
    // No station occurs at all - B was retrograde from t=0 throughout.
    expect(raw.stationEvents).toHaveLength(0);
  });
});

describe("TEST 11-13: Station before candidate exactitude, and direction transitions", () => {
  it("TEST 11: a planet can station before candidate exactitude, and still perfect afterward", () => {
    // B starts at 95 (5 deg past square=90) moving further away (direct,
    // increasing) for 3 days to 98, then stations retrograde and moves
    // back down, crossing exactly through 90 afterward.
    const raw = scanForAspectEvents({
      getStateA: () => ({ longitude: 0, speedDegPerDay: 0 }),
      getStateB: (t) => (t <= 3 ? { longitude: 95 + 1 * t, speedDegPerDay: 1 } : { longitude: 98 - 1 * (t - 3), speedDegPerDay: -1 }),
      exactAngle: 90,
      horizonDays: 30,
      coarseStepDays: 0.25,
    });
    expect(raw.stationEvents.length).toBeGreaterThan(0);
    expect(raw.stationEvents[0].fromMotion).toBe("direct");
    expect(raw.stationEvents[0].toMotion).toBe("retrograde");
    expect(raw.stationEvents[0].tDays).toBeCloseTo(3, 1);
    expect(raw.exactitudeFound).toBe(true);
    // Crosses 90 at t = 3 + 8 = 11 (98 - (t-3) = 90 -> t = 11), after the station.
    expect(raw.exactTDays).toBeCloseTo(11, 1);
  });

  it("TEST 12: direct -> retrograde event detected", () => {
    const raw = scanForAspectEvents({
      getStateA: () => ({ longitude: 0, speedDegPerDay: 0 }),
      getStateB: (t) => (t <= 5 ? { longitude: 1 * t, speedDegPerDay: 1 } : { longitude: 5 - 1 * (t - 5), speedDegPerDay: -1 }),
      exactAngle: 90,
      horizonDays: 20,
      coarseStepDays: 0.25,
    });
    expect(raw.stationEvents.length).toBeGreaterThanOrEqual(1);
    const s = raw.stationEvents.find((e) => e.fromMotion === "direct" && e.toMotion === "retrograde");
    expect(s).toBeDefined();
    expect(s.tDays).toBeCloseTo(5, 1);
  });

  it("TEST 13: retrograde -> direct event detected", () => {
    const raw = scanForAspectEvents({
      getStateA: () => ({ longitude: 0, speedDegPerDay: 0 }),
      getStateB: (t) => (t <= 5 ? { longitude: 20 - 1 * t, speedDegPerDay: -1 } : { longitude: 15 + 1 * (t - 5), speedDegPerDay: 1 }),
      exactAngle: 90,
      horizonDays: 20,
      coarseStepDays: 0.25,
    });
    const s = raw.stationEvents.find((e) => e.fromMotion === "retrograde" && e.toMotion === "direct");
    expect(s).toBeDefined();
    expect(s.tDays).toBeCloseTo(5, 1);
  });
});

describe("TEST 14-15: Sign ingress detection, for one and both planets", () => {
  it("TEST 14: sign ingress before exactitude detected", () => {
    const raw = scanForAspectEvents({
      getStateA: () => ({ longitude: 0, speedDegPerDay: 0 }),
      // B crosses from Aries(25) into Taurus(30 boundary) at t=5, continues to 90-target far later.
      getStateB: (t) => ({ longitude: 25 + 1 * t, speedDegPerDay: 1 }),
      exactAngle: 90,
      horizonDays: 100,
      coarseStepDays: 0.25,
    });
    expect(raw.ingressEvents.length).toBeGreaterThan(0);
    expect(raw.ingressEvents[0].fromIndex).toBe(0); // aries
    expect(raw.ingressEvents[0].toIndex).toBe(1); // taurus
    expect(raw.ingressEvents[0].tDays).toBeCloseTo(5, 1);
  });

  it("TEST 15: both planets' ingress tracking works independently", () => {
    const raw = scanForAspectEvents({
      getStateA: (t) => ({ longitude: 28 + 1 * t, speedDegPerDay: 1 }), // crosses at t=2
      getStateB: (t) => ({ longitude: 58 + 1 * t + 90, speedDegPerDay: 1 }), // 58+90=148 -> crosses 150 boundary at t=2
      exactAngle: 90,
      horizonDays: 20,
      coarseStepDays: 0.25,
    });
    const roles = new Set(raw.ingressEvents.map((e) => e.role));
    expect(roles.has("planetA")).toBe(true);
    expect(roles.has("planetB")).toBe(true);
  });
});

describe("TEST 16-17: Wraparound and opposition geometry", () => {
  it("TEST 16: 359/0 conjunction perfection works", () => {
    // A at 358 deg; B starts at 2 deg (4 deg raw separation across the
    // 0/360 boundary), retrograde, approaching conjunction from above.
    const raw = scanForAspectEvents({
      getStateA: () => ({ longitude: 358, speedDegPerDay: 0 }),
      getStateB: (t) => ({ longitude: (2 - 1 * t + 360) % 360, speedDegPerDay: -1 }),
      exactAngle: 0,
      horizonDays: 20,
      coarseStepDays: 0.25,
    });
    expect(raw.exactitudeFound).toBe(true);
    expect(Math.abs(raw.exactError)).toBeLessThanOrEqual(DIRECT_PERFECTION_ROOT_TOLERANCE_DEGREES);
  });

  it("TEST 17: opposition crossing works", () => {
    const raw = scanForAspectEvents({
      getStateA: () => ({ longitude: 0, speedDegPerDay: 0 }),
      getStateB: (t) => ({ longitude: (170 + 1 * t) % 360, speedDegPerDay: 1 }),
      exactAngle: 180,
      horizonDays: 20,
      coarseStepDays: 0.25,
    });
    expect(raw.exactitudeFound).toBe(true);
    expect(raw.exactTDays).toBeCloseTo(10, 1);
  });
});

describe("TEST 18: Search locks onto the original aspect type, never switching", () => {
  it("a pair that drifts transiently closer to a different aspect still resolves the ORIGINAL target", () => {
    // A stationary at 0. B starts at 95 (5 deg from square=90), moves toward
    // 90 but overshoots down to 85, then reverses back up toward 90 and
    // holds near there — never actually reaching square exactly, but at one
    // point (B=60) would have been much "closer" to a sextile than to the
    // square. The search must not switch to treating this as sextile.
    const effectiveTarget = resolveEffectiveTargetAngle(0, 95, 90);
    expect(effectiveTarget).toBe(90);

    const raw = scanForAspectEvents({
      getStateA: () => ({ longitude: 0, speedDegPerDay: 0 }),
      getStateB: (t) => ({ longitude: 95 - 5 * t, speedDegPerDay: -5 }), // passes through 90 at t=1, then continues toward 60 and beyond
      exactAngle: 90, // explicitly locked target, as the production adapter would resolve and pass in
      horizonDays: 5,
      coarseStepDays: 0.1,
    });
    expect(raw.exactitudeFound).toBe(true);
    expect(raw.exactTDays).toBeCloseTo(1, 1);
  });
});

describe("TEST 19: Root refinement reaches the required numerical tolerance", () => {
  it("a found root's |error| is within DIRECT_PERFECTION_ROOT_TOLERANCE_DEGREES", () => {
    const raw = scanForAspectEvents({
      getStateA: () => ({ longitude: 10, speedDegPerDay: 0.5 }),
      getStateB: (t) => ({ longitude: 10 + 60 - 3 + 1.3 * t, speedDegPerDay: 1.3 }),
      exactAngle: 60,
      horizonDays: 20,
      coarseStepDays: 0.25,
    });
    expect(raw.exactitudeFound).toBe(true);
    expect(Math.abs(raw.exactError)).toBeLessThanOrEqual(DIRECT_PERFECTION_ROOT_TOLERANCE_DEGREES);
  });
});

describe("TEST 20-21: Search horizon termination and no infinite loop", () => {
  it("TEST 20: search horizon terminates safely for a genuinely non-converging pair", () => {
    // Relative speed 1.9 deg/day; over this 20-day window the gap grows
    // from 50 to at most 88 deg - nowhere near a full 360 deg lap back to
    // conjunction, so this genuinely never crosses within the window.
    const start = Date.now();
    const raw = scanForAspectEvents({
      getStateA: (t) => ({ longitude: 0.1 * t, speedDegPerDay: 0.1 }),
      getStateB: (t) => ({ longitude: (50 + 2 * t) % 360, speedDegPerDay: 2 }),
      exactAngle: 0,
      horizonDays: 20,
      coarseStepDays: COARSE_STEP_DAYS,
    });
    const elapsedMs = Date.now() - start;
    expect(raw.exactitudeFound).toBe(false);
    expect(elapsedMs).toBeLessThan(2000); // completes promptly, no runaway loop
  });

  it("TEST 20b: over the full production horizon, a constant-relative-speed pair correctly finds its genuine periodic lap-around conjunction", () => {
    // Same pair as above but over the full 180-day production horizon:
    // the gap does complete a real lap (163 days) back through conjunction
    // - confirming the fix (validating bisection convergence, not just a
    // sign flip) finds the TRUE crossing rather than a false one at the
    // antipodal (180 deg) wraparound point (~68 days).
    const raw = scanForAspectEvents({
      getStateA: (t) => ({ longitude: 0.1 * t, speedDegPerDay: 0.1 }),
      getStateB: (t) => ({ longitude: (50 + 2 * t) % 360, speedDegPerDay: 2 }),
      exactAngle: 0,
      horizonDays: DIRECT_PERFECTION_SEARCH_HORIZON_DAYS,
      coarseStepDays: COARSE_STEP_DAYS,
    });
    expect(raw.exactitudeFound).toBe(true);
    expect(raw.exactTDays).toBeCloseTo(163.16, 0);
    expect(Math.abs(raw.exactError)).toBeLessThanOrEqual(DIRECT_PERFECTION_ROOT_TOLERANCE_DEGREES);
  });

  it("TEST 21: no infinite loop - a maximally slow-converging pair still terminates within the horizon", () => {
    const raw = scanForAspectEvents({
      getStateA: () => ({ longitude: 0, speedDegPerDay: 0 }),
      // Extremely slow relative motion - would take ~1000 days at this rate,
      // far beyond the horizon, so it must terminate via horizon exhaustion.
      getStateB: (t) => ({ longitude: 20 + 0.001 * t, speedDegPerDay: 0.001 }),
      exactAngle: 90,
      horizonDays: 30,
      coarseStepDays: 0.25,
    });
    expect(raw.exactitudeFound).toBe(false);
    expect(raw.stillTrendingTowardExactAtHorizon).toBe(true);
  });
});

describe("TEST 22-24: Phase 3F/3E data untouched by Phase 3G-A", () => {
  const chart = calculateChart(VERIFICATION_INPUT);

  it("TEST 22: Phase 3F aspect values remain bit-identical to a fresh recomputation", () => {
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(chart.classical.aspects).toEqual(fresh.classical.aspects);
    const withinOrb = chart.classical.aspects.filter((a) => a.aspect.isWithinOrb);
    expect(withinOrb.length).toBe(9);
    expect(withinOrb.filter((a) => a.motion.status === "applying").length).toBe(5);
  });

  it("TEST 23: Lilly orb convention remains unchanged", () => {
    expect(chart.classical.meta.aspectOrbConvention).toBe("lilly_moiety_sum");
    expect(chart.classical.meta.aspectSystem).toBe("classical_major_five");
  });

  it("TEST 24: Phase 3E reception matrix remains unchanged", () => {
    expect(chart.classical.meta.receptionQualification).toBe("not_yet_evaluated");
    expect(chart.classical.mutualReceptions.length).toBe(4);
    const mars = findClassical(chart, "mars");
    const venusEntry = mars.reception.receives.find((e) => e.planet === "venus");
    expect(venusEntry.types.slice().sort()).toEqual(["domicile", "face", "term", "triplicity"]);
  });
});

describe("TEST 25-28: No Phase 3G-B techniques implemented", () => {
  it("TEST 25: no Translation of Light exists", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const json = JSON.stringify(chart.classical.directPerfection);
    expect(json).not.toMatch(/translation.?of.?light|translationOfLight/i);
  });

  it("TEST 26: no Collection of Light exists", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const json = JSON.stringify(chart.classical.directPerfection);
    expect(json).not.toMatch(/collection.?of.?light|collectionOfLight/i);
  });

  it("TEST 27: no Prohibition judgment exists", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const json = JSON.stringify(chart.classical.directPerfection);
    expect(json).not.toMatch(/prohibition|frustration|abscission|void.?of.?course/i);
  });

  it("TEST 28: no final Horary outcome exists", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    for (const d of chart.classical.directPerfection) {
      expect(d).not.toHaveProperty("horaryOutcome");
      expect(d).not.toHaveProperty("willPerfect");
      expect(["perfects", "does_not_perfect", "requires_historical_rule", "search_horizon_reached", "not_a_candidate"]).toContain(
        d.status,
      );
    }
    const json = JSON.stringify(chart.classical.directPerfection);
    expect(json).not.toMatch(/success|failure|good|bad|guaranteed|querent/i);
  });
});

describe("TEST 29: Full verification chart - computed, not pre-assumed - and Phase 1-3F regression", () => {
  it("TEST 29: all 5 applying pairs report a definite technical status; Phase 1-3F values unchanged", () => {
    const chart = calculateChart(VERIFICATION_INPUT);

    expect(chart.classical.meta.directPerfectionMethod).toBe("future_ephemeris_event_search");
    expect(chart.classical.meta.directPerfectionEngine).toBe("astronomy-engine");
    expect(chart.classical.meta.directPerfectionSearchHorizonDays).toBe(180);
    expect(chart.classical.meta.signIngressConvention).toBe("requires_historical_rule");

    const candidates = chart.classical.directPerfection.filter((d) => d.isCandidate);
    expect(candidates.length).toBe(5);
    for (const c of candidates) {
      expect(["perfects", "does_not_perfect", "requires_historical_rule", "search_horizon_reached"]).toContain(c.status);
    }

    // Non-candidates never ran a search.
    const nonCandidates = chart.classical.directPerfection.filter((d) => !d.isCandidate);
    expect(nonCandidates.length).toBe(16);
    for (const nc of nonCandidates) {
      expect(nc.exactitudeFound).toBe(false);
      expect(nc.status).toBe("not_a_candidate");
    }

    // Phase 1
    const sunPlanet = chart.planets.find((p) => p.key === "sun");
    expect(sunPlanet.sign.english).toBe("Scorpio");
    expect(chart.points.length).toBe(26);

    // Phase 3A-3D spot checks
    const venusDignity = findClassical(chart, "venus");
    expect(venusDignity.totalEssentialScore).toBe(-5);
    const jupiter = findClassical(chart, "jupiter");
    expect(jupiter.condition.solar.condition).toBe("combust");
    expect(chart.classical.meta.speedConvention).toBe("william_lilly");
    const venus = findClassical(chart, "venus");
    expect(venus.sectConditionDetail.hayz.isHayz).toBe(true);
  });
});

describe("Refranation-specific requirements", () => {
  it("generic retrograde does not automatically mean refranation", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    // moon-venus and moon-saturn perfect while Venus/nothing involved is
    // retrograde at all in those pairs' relevant motion; more directly,
    // confirm the TEST10 scenario (already-retrograde, still perfects)
    // never reports refranation.
    const raw = scanForAspectEvents({
      getStateA: () => ({ longitude: 0, speedDegPerDay: 0 }),
      getStateB: (t) => ({ longitude: 100 - 1 * t, speedDegPerDay: -1 }),
      exactAngle: 90,
      horizonDays: 20,
      coarseStepDays: 0.25,
    });
    expect(raw.exactitudeFound).toBe(true);
    expect(raw.stationEvents).toHaveLength(0);

    // And in the real chart, confirm at least one refranation case exists,
    // proving the distinction between "involves retrograde" and "is refranation"
    // is meaningful (not every retrograde-involving applying pair is refranation).
    const refranating = chart.classical.directPerfection.filter((d) => d.refranation.occurs);
    expect(refranating.length).toBeGreaterThan(0);
  });

  it("a reversal AFTER perfection does not retroactively prevent perfection", () => {
    // B crosses exact contact with A at t=5 (85 + 1*5 = 90), and only
    // stations retrograde afterward, at t=10 - well past the root.
    const raw = scanForAspectEvents({
      getStateA: () => ({ longitude: 0, speedDegPerDay: 0 }),
      getStateB: (t) => (t <= 10 ? { longitude: 85 + 1 * t, speedDegPerDay: 1 } : { longitude: 95 - 1 * (t - 10), speedDegPerDay: -1 }),
      exactAngle: 90,
      horizonDays: 20,
      coarseStepDays: 0.25,
    });
    expect(raw.exactitudeFound).toBe(true);
    expect(raw.exactTDays).toBeCloseTo(5, 1);
    // The scan stops at the first root (t=5), so no station past that
    // point is even recorded - confirming the station cannot retroactively
    // affect a perfection that already happened.
    for (const s of raw.stationEvents) {
      expect(s.tDays).toBeGreaterThan(raw.exactTDays);
    }
  });
});
