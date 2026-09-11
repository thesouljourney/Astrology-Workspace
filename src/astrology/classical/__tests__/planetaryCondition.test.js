import { describe, it, expect } from "vitest";
import { calculateChart } from "../../ephemeris.js";
import { computeMercuryPhase } from "../mercurySect.js";
import { classifySolarCondition, computeSolarElongation, THRESHOLDS } from "../solarCondition.js";

const BASE_INPUT = {
  birthDate: "1994-11-21",
  latitude: 1.8548,
  longitude: 102.9325,
  utcOffset: "+08:00",
  houseSystem: "placidus",
};

const NIGHT_INPUT = { ...BASE_INPUT, birthTime: "01:44:00" }; // verification chart, Sun below horizon
const DAY_INPUT = { ...BASE_INPUT, birthTime: "13:00:00" }; // same date/place, local noon, Sun above horizon

function findClassical(chart, key) {
  return chart.classical.planets.find((p) => p.planet === key);
}

describe("TEST 1-2: Chart sect from the Sun's actual astronomical horizon status", () => {
  it("TEST 1: Sun above horizon -> day", () => {
    const chart = calculateChart(DAY_INPUT);
    const sun = findClassical(chart, "sun");
    expect(sun.condition.horizon.isAboveHorizon).toBe(true);
    expect(chart.classical.sect).toBe("day");
  });

  it("TEST 2: Sun below horizon -> night", () => {
    const chart = calculateChart(NIGHT_INPUT);
    const sun = findClassical(chart, "sun");
    expect(sun.condition.horizon.isAboveHorizon).toBe(false);
    expect(chart.classical.sect).toBe("night");
  });
});

describe("TEST 3-6: isOfSect for fixed-family planets", () => {
  it("TEST 3: Jupiter in a day chart -> of sect", () => {
    const chart = calculateChart(DAY_INPUT);
    const jupiter = findClassical(chart, "jupiter");
    expect(jupiter.condition.sect.family).toBe("diurnal");
    expect(jupiter.condition.sect.isOfSect).toBe(true);
  });

  it("TEST 4: Jupiter in a night chart -> out of sect", () => {
    const chart = calculateChart(NIGHT_INPUT);
    const jupiter = findClassical(chart, "jupiter");
    expect(jupiter.condition.sect.isOfSect).toBe(false);
  });

  it("TEST 5: Venus in a night chart -> of sect", () => {
    const chart = calculateChart(NIGHT_INPUT);
    const venus = findClassical(chart, "venus");
    expect(venus.condition.sect.family).toBe("nocturnal");
    expect(venus.condition.sect.isOfSect).toBe(true);
  });

  it("TEST 6: Venus in a day chart -> out of sect", () => {
    const chart = calculateChart(DAY_INPUT);
    const venus = findClassical(chart, "venus");
    expect(venus.condition.sect.isOfSect).toBe(false);
  });
});

describe("TEST 7-9: Mercury phase / sect / wraparound (rule-level, no chart needed)", () => {
  it("TEST 7: Mercury oriental (behind the Sun) -> diurnal", () => {
    // Mercury at 10 deg, Sun at 20 deg: Mercury trails the Sun -> oriental
    const r = computeMercuryPhase(10, 20);
    expect(r.mercuryPhase).toBe("oriental");
    expect(r.mercurySect).toBe("diurnal");
  });

  it("TEST 8: Mercury occidental (ahead of the Sun) -> nocturnal", () => {
    // Mercury at 30 deg, Sun at 20 deg: Mercury leads the Sun -> occidental
    const r = computeMercuryPhase(30, 20);
    expect(r.mercuryPhase).toBe("occidental");
    expect(r.mercurySect).toBe("nocturnal");
  });

  it("TEST 9: Mercury wraparound near 0 deg Aries is handled correctly", () => {
    // Sun at 359 deg, Mercury at 2 deg: shortest path is +3 (Mercury is
    // AHEAD of/east of the Sun after wrapping), not the naive -357.
    const ahead = computeMercuryPhase(2, 359);
    expect(ahead.signedElongation).toBeCloseTo(3, 6);
    expect(ahead.mercuryPhase).toBe("occidental");

    // Sun at 2 deg, Mercury at 359 deg: Mercury trails/behind by 3 deg -> oriental.
    const behind = computeMercuryPhase(359, 2);
    expect(behind.signedElongation).toBeCloseTo(-3, 6);
    expect(behind.mercuryPhase).toBe("oriental");
  });
});

describe("TEST 10-16: Solar condition thresholds (exact boundaries)", () => {
  it("TEST 10: 0d10m elongation -> cazimi", () => {
    expect(classifySolarCondition(10 / 60)).toBe("cazimi");
  });
  it("TEST 11: exactly 0d17m -> cazimi (inclusive)", () => {
    expect(classifySolarCondition(THRESHOLDS.cazimiDegrees)).toBe("cazimi");
  });
  it("TEST 12: just beyond 0d17m -> combust", () => {
    expect(classifySolarCondition(THRESHOLDS.cazimiDegrees + 1 / 3600)).toBe("combust");
  });
  it("TEST 13: exactly 8d30m -> combust (inclusive)", () => {
    expect(classifySolarCondition(THRESHOLDS.combustionDegrees)).toBe("combust");
  });
  it("TEST 14: just beyond 8d30m -> under_beams", () => {
    expect(classifySolarCondition(THRESHOLDS.combustionDegrees + 1 / 3600)).toBe("under_beams");
  });
  it("TEST 15: exactly 17d -> under_beams (inclusive)", () => {
    expect(classifySolarCondition(THRESHOLDS.beamsDegrees)).toBe("under_beams");
  });
  it("TEST 16: just beyond 17d -> free", () => {
    expect(classifySolarCondition(THRESHOLDS.beamsDegrees + 1 / 3600)).toBe("free");
  });
});

describe("TEST 17: Solar elongation is always in [0, 180]", () => {
  it("holds across a wide range of synthetic longitude pairs, including wraparound", () => {
    const samples = [
      [0, 0], [0, 180], [10, 350], [359, 1], [1, 359], [180, 0],
      [270, 90], [90, 270], [123.456, 7.89], [0.001, 359.999],
    ];
    for (const [planetLon, sunLon] of samples) {
      const { absoluteSolarElongation } = computeSolarElongation(planetLon, sunLon);
      expect(absoluteSolarElongation).toBeGreaterThanOrEqual(0);
      expect(absoluteSolarElongation).toBeLessThanOrEqual(180);
    }
  });
});

describe("TEST 18: Retrograde/motion state exactly matches upstream Phase 1 data", () => {
  it("condition.motion mirrors chart.planets for every traditional planet", () => {
    const chart = calculateChart(NIGHT_INPUT);
    for (const cp of chart.classical.planets) {
      const p = chart.planets.find((pl) => pl.key === cp.planet);
      expect(cp.condition.motion.longitudeSpeed).toBe(p.speedDegPerDay);
      expect(cp.condition.motion.direction).toBe(p.retrograde ? "retrograde" : "direct");
    }
  });

  it("Venus is retrograde in the verification chart (already-established Phase 1 fact)", () => {
    const chart = calculateChart(NIGHT_INPUT);
    const venus = findClassical(chart, "venus");
    expect(venus.condition.motion.direction).toBe("retrograde");
  });
});

describe("TEST 19: Above/below horizon matches real astronomical altitude", () => {
  it("isAboveHorizon is true iff altitude > 0, for every traditional planet", () => {
    const chart = calculateChart(NIGHT_INPUT);
    for (const cp of chart.classical.planets) {
      expect(cp.condition.horizon.isAboveHorizon).toBe(cp.condition.horizon.altitude > 0);
    }
  });
});

describe("TEST 20: Phase 1-3A data is unchanged by Phase 3B", () => {
  it("Phase 3A essential dignity results are untouched (Venus detriment, verification chart)", () => {
    const chart = calculateChart(NIGHT_INPUT);
    const venus = findClassical(chart, "venus");
    expect(venus.dignity.detriment.active).toBe(true);
    expect(venus.dignity.detriment.score).toBe(-5);
    expect(venus.peregrine).toBe(true);
    expect(venus.immediateDispositor).toBe("mars");
  });

  it("Phase 1/2 chart shape is unaffected", () => {
    const chart = calculateChart(NIGHT_INPUT);
    expect(chart.planets.find((p) => p.key === "sun").sign.english).toBe("Scorpio");
    expect(chart.points.length).toBe(26);
  });
});

describe("Solar condition is not computed for the Sun itself", () => {
  it("Sun's condition.solar is null", () => {
    const chart = calculateChart(NIGHT_INPUT);
    const sun = findClassical(chart, "sun");
    expect(sun.condition.solar).toBeNull();
  });
});
