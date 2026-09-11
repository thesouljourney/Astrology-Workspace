import { describe, it, expect } from "vitest";
import { calculateChart } from "../../ephemeris.js";
import { shortestAngularDistance } from "../angleProximity.js";
import { TRADITIONAL_PLANETS } from "../essentialDignity.js";
import {
  MAJOR_ASPECTS,
  EXACT_EPSILON_DEGREES,
  findNearestAspect,
  getSignAspectRelation,
  computeAspectMotion,
  computeAspectPair,
  computeAspectMatrix,
} from "../aspects.js";

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

describe("TEST 1-5: Exact aspect detection for each of the five classical major aspects", () => {
  const cases = [
    ["conjunction", 0],
    ["sextile", 60],
    ["square", 90],
    ["trine", 120],
    ["opposition", 180],
  ];

  for (const [type, angle] of cases) {
    it(`exact ${type} (${angle} deg) detected`, () => {
      const pair = computeAspectPair({
        planetA: "venus",
        lonA: 10,
        speedA: 1,
        signIndexA: 0,
        planetB: "mars",
        lonB: 10 + angle,
        speedB: 1,
        signIndexB: 0,
      });
      expect(pair.aspect.type).toBe(type);
      expect(pair.aspect.exactAngle).toBe(angle);
      expect(pair.aspect.orbFromExact).toBeCloseTo(0, 10);
      expect(pair.aspect.isWithinOrb).toBe(true);
    });
  }
});

describe("TEST 6-7: Wraparound geometry", () => {
  it("TEST 6: 359 vs 1 conjunction geometry handled correctly (separation 2, not 358)", () => {
    expect(shortestAngularDistance(359, 1)).toBeCloseTo(2, 8);
    expect(shortestAngularDistance(1, 359)).toBeCloseTo(2, 8);
    const nearest = findNearestAspect(shortestAngularDistance(359, 1));
    expect(nearest.type).toBe("conjunction");
    expect(nearest.orbFromExact).toBeCloseTo(2, 8);
  });

  it("TEST 7: 179 vs 181 boundary-adjacent-to-180 handled correctly, and true opposition-with-wrap geometry works", () => {
    // 179 and 181 are only 2 deg apart (near conjunction) - confirms no
    // off-by-one bug at the 180 boundary.
    expect(shortestAngularDistance(179, 181)).toBeCloseTo(2, 8);
    const nearNearest = findNearestAspect(shortestAngularDistance(179, 181));
    expect(nearNearest.type).toBe("conjunction");

    // A genuine opposition, wrapping across 0/360.
    expect(shortestAngularDistance(350, 170)).toBeCloseTo(180, 8);
    const oppNearest = findNearestAspect(shortestAngularDistance(350, 170));
    expect(oppNearest.type).toBe("opposition");
    expect(oppNearest.orbFromExact).toBeCloseTo(0, 8);
  });
});

describe("TEST 8-10: Orb boundary behavior", () => {
  it("TEST 8: pair outside orb returns no aspect (type null)", () => {
    // Moon(6.25) + Saturn(5) moiety sum = 11.25 deg allowed orb.
    const pair = computeAspectPair({
      planetA: "moon",
      lonA: 0,
      speedA: 1,
      signIndexA: 0,
      planetB: "saturn",
      lonB: 90 + 11.26, // just outside
      speedB: 0,
      signIndexB: 3,
    });
    expect(pair.aspect.isWithinOrb).toBe(false);
    expect(pair.aspect.type).toBeNull();
  });

  it("TEST 9: pair just inside orb returns aspect", () => {
    const pair = computeAspectPair({
      planetA: "moon",
      lonA: 0,
      speedA: 1,
      signIndexA: 0,
      planetB: "saturn",
      lonB: 90 + 11.24, // just inside 11.25 allowed orb
      speedB: 0,
      signIndexB: 3,
    });
    expect(pair.aspect.isWithinOrb).toBe(true);
    expect(pair.aspect.type).toBe("square");
  });

  it("TEST 10: pair exactly on the orb boundary is handled deterministically (inclusive)", () => {
    const pair = computeAspectPair({
      planetA: "moon",
      lonA: 0,
      speedA: 1,
      signIndexA: 0,
      planetB: "saturn",
      lonB: 90 + 11.25, // exactly on the boundary
      speedB: 0,
      signIndexB: 3,
    });
    expect(pair.aspect.orbFromExact).toBeCloseTo(pair.aspect.allowedOrb, 10);
    expect(pair.aspect.isWithinOrb).toBe(true);
  });
});

describe("TEST 11-15: Applying/separating from relative motion, including retrograde", () => {
  it("TEST 11: applying, direct/direct", () => {
    // separation 85 approaching square(90): A ahead and pulling away is separating;
    // here B moves faster toward A, closing the gap toward 90 from below.
    const status = computeAspectMotion({ lonA: 0, speedA: 0.1, lonB: 85, speedB: 2, exactAngle: 90 });
    expect(status).toBe("applying");
  });

  it("TEST 12: separating, direct/direct", () => {
    const status = computeAspectMotion({ lonA: 0, speedA: 0.1, lonB: 95, speedB: 2, exactAngle: 90 });
    expect(status).toBe("separating");
  });

  it("TEST 13: retrograde causes an applying case", () => {
    // B retrograde (moving backward/decreasing longitude) toward A from above 90.
    const status = computeAspectMotion({ lonA: 0, speedA: 0, lonB: 95, speedB: -2, exactAngle: 90 });
    expect(status).toBe("applying");
  });

  it("TEST 14: retrograde causes a separating case", () => {
    // B retrograde, moving further away from the 90 target which is below it.
    const status = computeAspectMotion({ lonA: 0, speedA: 0, lonB: 85, speedB: -2, exactAngle: 90 });
    expect(status).toBe("separating");
  });

  it("TEST 15: both retrograde handled", () => {
    // Both retrograde but B faster backward - closing the gap toward 90.
    const applying = computeAspectMotion({ lonA: 0, speedA: -0.2, lonB: 95, speedB: -2, exactAngle: 90 });
    expect(applying).toBe("applying");
    // Both retrograde, A faster backward - opening the gap further past 90.
    const separating = computeAspectMotion({ lonA: 0, speedA: -2, lonB: 95, speedB: -0.2, exactAngle: 90 });
    expect(separating).toBe("separating");
  });
});

describe("TEST 16: 0 deg crossing does not break applying/separating", () => {
  it("a pair straddling the 0/360 boundary still resolves motion correctly", () => {
    // lonA=358, lonB=2: separation = 4 deg from conjunction. B moving forward
    // faster increases the wrap-safe gap away from exact.
    const separating = computeAspectMotion({ lonA: 358, speedA: 0.1, lonB: 2, speedB: 2, exactAngle: 0 });
    expect(separating).toBe("separating");
    // B moving backward (retrograde) closes the gap toward exact conjunction.
    const applying = computeAspectMotion({ lonA: 358, speedA: 0.1, lonB: 2, speedB: -2, exactAngle: 0 });
    expect(applying).toBe("applying");
  });
});

describe("TEST 17-18: Opposition applying/separating detection", () => {
  it("TEST 17: opposition applying works", () => {
    const status = computeAspectMotion({ lonA: 0, speedA: 0.1, lonB: 175, speedB: 2, exactAngle: 180 });
    expect(status).toBe("applying");
  });

  it("TEST 18: opposition separating works", () => {
    const status = computeAspectMotion({ lonA: 0, speedA: 0.1, lonB: 185, speedB: 2, exactAngle: 180 });
    expect(status).toBe("separating");
  });
});

describe("TEST 19: Exact aspect returns 'exact'", () => {
  it("current position already at the exact angle returns 'exact', not applying/separating", () => {
    const status = computeAspectMotion({ lonA: 0, speedA: 1, lonB: 90, speedB: 0.5, exactAngle: 90 });
    expect(status).toBe("exact");
  });

  it("a currentOrbFromExact just inside EXACT_EPSILON_DEGREES still returns 'exact'", () => {
    const status = computeAspectMotion({
      lonA: 0,
      speedA: 1,
      lonB: 90 + EXACT_EPSILON_DEGREES / 2,
      speedB: 0.5,
      exactAngle: 90,
    });
    expect(status).toBe("exact");
  });
});

describe("TEST 20-21: No naive longitude-order dependency; aspect symmetry", () => {
  it("TEST 20: computeAspectMotion gives the same status regardless of which planet is labeled A/B", () => {
    const forward = computeAspectMotion({ lonA: 0, speedA: 0.1, lonB: 85, speedB: 2, exactAngle: 90 });
    const reversed = computeAspectMotion({ lonA: 85, speedA: 2, lonB: 0, speedB: 0.1, exactAngle: 90 });
    expect(forward).toBe(reversed);
    expect(forward).toBe("applying");
  });

  it("TEST 21: A-B and B-A produce identical aspect geometry", () => {
    const forward = computeAspectPair({
      planetA: "moon",
      lonA: 10,
      speedA: 12,
      signIndexA: 0,
      planetB: "saturn",
      lonB: 100,
      speedB: 0.02,
      signIndexB: 3,
    });
    const reversed = computeAspectPair({
      planetA: "saturn",
      lonA: 100,
      speedA: 0.02,
      signIndexA: 3,
      planetB: "moon",
      lonB: 10,
      speedB: 12,
      signIndexB: 0,
    });
    expect(reversed.aspect).toEqual(forward.aspect);
    expect(reversed.signAspectRelation).toEqual(forward.signAspectRelation);
    expect(reversed.motion.status).toBe(forward.motion.status);
  });
});

describe("TEST 22-23: Scope restrictions", () => {
  it("TEST 22: no modern minor aspects returned - only the five classical major aspects exist", () => {
    expect(MAJOR_ASPECTS.map((a) => a.type).sort()).toEqual(
      ["conjunction", "opposition", "sextile", "square", "trine"].sort(),
    );
    for (let sep = 0; sep <= 180; sep += 1) {
      expect(["conjunction", "sextile", "square", "trine", "opposition"]).toContain(findNearestAspect(sep).type);
    }
  });

  it("TEST 23: only the seven traditional planets are included - matrix has exactly 21 pairs", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    expect(chart.classical.aspects.length).toBe(21);
    for (const pair of chart.classical.aspects) {
      expect(TRADITIONAL_PLANETS).toContain(pair.planetA);
      expect(TRADITIONAL_PLANETS).toContain(pair.planetB);
      expect(pair.planetA).not.toBe(pair.planetB);
    }
    const uniquePairs = new Set(chart.classical.aspects.map((p) => [p.planetA, p.planetB].sort().join("-")));
    expect(uniquePairs.size).toBe(21);
  });
});

describe("TEST 24-25: No score, no perfection judgment", () => {
  it("TEST 24: no overall aspect score exists anywhere", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const json = JSON.stringify(chart.classical.aspects);
    expect(json).not.toMatch(/score/i);
  });

  it("TEST 25: no perfection judgment (willPerfect/horaryOutcome/perfectionJudgment) exists", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    for (const pair of chart.classical.aspects) {
      expect(pair).not.toHaveProperty("willPerfect");
      expect(pair).not.toHaveProperty("horaryOutcome");
      expect(pair).not.toHaveProperty("perfectionJudgment");
      expect(Object.keys(pair.perfectionCandidate).sort()).toEqual(
        ["currentOrb", "isApplying", "relativeMotionSupportsPerfection"].sort(),
      );
    }
    const json = JSON.stringify(chart.classical.aspects);
    expect(json).not.toMatch(/willPerfect|horaryOutcome|perfectionJudgment|guaranteed/i);
  });
});

describe("TEST 26: Reception data unchanged from Phase 3E", () => {
  it("chart.classical.receptionMatrix/mutualReceptions/meta.receptionQualification are untouched by Phase 3F", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    expect(chart.classical.meta.receptionQualification).toBe("not_yet_evaluated");
    expect(chart.classical.meta.receptionConvention).toBe("traditional_five_positive_dignities");

    const mars = findClassical(chart, "mars");
    const venusEntry = mars.reception.receives.find((e) => e.planet === "venus");
    expect(venusEntry.types.slice().sort()).toEqual(["domicile", "face", "term", "triplicity"]);

    const pairs = chart.classical.mutualReceptions.map((m) => [m.planetA, m.planetB].sort().join("-")).sort();
    expect(pairs).toEqual(["jupiter-saturn", "mars-mercury", "mars-sun", "jupiter-mars"].map((s) => s.split("-").sort().join("-")).sort());

    // Aspect pairs reference (not duplicate/recompute) the same reception matrix.
    const marsJupiterAspectPair = chart.classical.aspects.find(
      (p) => [p.planetA, p.planetB].sort().join("-") === "jupiter-mars",
    );
    const matrixEntry = chart.classical.receptionMatrix.find((e) => e.receiver === "jupiter" && e.received === "mars");
    const linked =
      marsJupiterAspectPair.planetA === "jupiter" ? marsJupiterAspectPair.reception.aReceivesB : marsJupiterAspectPair.reception.bReceivesA;
    expect(linked.types).toEqual(matrixEntry.types);
  });
});

describe("TEST 27: Full verification chart output - computed, not pre-assumed - and Phase 1-3E regression", () => {
  it("TEST 27: 21 pairs checked, 9 within orb, 5 applying, 4 separating, 0 exact; Phase 1-3E values unchanged", () => {
    const chart = calculateChart(VERIFICATION_INPUT);

    expect(chart.classical.meta.aspectSystem).toBe("classical_major_five");
    expect(chart.classical.meta.aspectOrbConvention).toBe("lilly_moiety_sum");
    expect(chart.classical.meta.aspectExactnessToleranceDegrees).toBe(EXACT_EPSILON_DEGREES);

    const all = chart.classical.aspects;
    expect(all.length).toBe(21);
    const within = all.filter((p) => p.aspect.isWithinOrb);
    expect(within.length).toBe(9);
    expect(within.filter((p) => p.motion.status === "applying").length).toBe(5);
    expect(within.filter((p) => p.motion.status === "separating").length).toBe(4);
    expect(within.filter((p) => p.motion.status === "exact").length).toBe(0);

    // A specific, unforced result: Sun square Mars, separating.
    const sunMars = all.find((p) => [p.planetA, p.planetB].sort().join("-") === "mars-sun");
    expect(sunMars.aspect.type).toBe("square");
    expect(sunMars.motion.status).toBe("separating");

    // Phase 1
    const sunPlanet = chart.planets.find((p) => p.key === "sun");
    expect(sunPlanet.sign.english).toBe("Scorpio");
    expect(chart.angles.asc.sign.english).toBe("Virgo");
    expect(chart.points.length).toBe(26);

    // Phase 3A
    const venusDignity = findClassical(chart, "venus");
    expect(venusDignity.dignity.detriment.active).toBe(true);
    expect(venusDignity.totalEssentialScore).toBe(-5);

    // Phase 3B
    const jupiter = findClassical(chart, "jupiter");
    expect(jupiter.condition.solar.condition).toBe("combust");

    // Phase 3C
    expect(venusDignity.operationalCondition.housePosition).toEqual({ house: 2, class: "succedent" });
    expect(chart.classical.meta.speedConvention).toBe("william_lilly");

    // Phase 3D
    const venus = findClassical(chart, "venus");
    expect(venus.sectConditionDetail.hayz.isHayz).toBe(true);
    expect(chart.classical.meta.hayzHalbConvention).toBe("traditional_halb_base_hayz_full");

    // Phase 3E
    expect(chart.classical.mutualReceptions.length).toBe(4);
    for (const p of chart.classical.planets) {
      expect(p.dispositor.chain.terminationType).toBe("loop");
    }
  });
});

describe("Whole-sign aspect relation (Part Q) is a separate, orb-free fact", () => {
  it("adjacent signs (1 apart) are in aversion (null), not an aspect", () => {
    expect(getSignAspectRelation(0, 1)).toBeNull();
    expect(getSignAspectRelation(0, 5)).toBeNull();
  });

  it("2/3/4/6 signs apart map to sextile/square/trine/opposition; 0 apart is conjunction", () => {
    expect(getSignAspectRelation(0, 0)).toBe("conjunction");
    expect(getSignAspectRelation(0, 2)).toBe("sextile");
    expect(getSignAspectRelation(0, 3)).toBe("square");
    expect(getSignAspectRelation(0, 4)).toBe("trine");
    expect(getSignAspectRelation(0, 6)).toBe("opposition");
    // Symmetric and wraparound-safe.
    expect(getSignAspectRelation(1, 11)).toBe("sextile");
  });
});
