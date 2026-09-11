import { describe, it, expect } from "vitest";
import { calculateChart } from "../../ephemeris.js";

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

describe("Speed convention provenance is stored permanently in the calculation output", () => {
  const chart = calculateChart(VERIFICATION_INPUT);

  it("1. Mercury referenceMeanSpeed is 59'08\"/day", () => {
    const mercury = findClassical(chart, "mercury");
    const expected = 59 / 60 + 8 / 3600;
    expect(mercury.operationalCondition.speed.referenceMeanSpeed).toBeCloseTo(expected, 10);
    expect(mercury.operationalCondition.speed.referenceMeanSpeedFormatted).toBe("59′08″/day");
  });

  it("2. Venus referenceMeanSpeed is 59'08\"/day", () => {
    const venus = findClassical(chart, "venus");
    const expected = 59 / 60 + 8 / 3600;
    expect(venus.operationalCondition.speed.referenceMeanSpeed).toBeCloseTo(expected, 10);
    expect(venus.operationalCondition.speed.referenceMeanSpeedFormatted).toBe("59′08″/day");
  });

  it("3. Mercury/Venus speedConvention is william_lilly", () => {
    const mercury = findClassical(chart, "mercury");
    const venus = findClassical(chart, "venus");
    expect(mercury.operationalCondition.speed.speedConvention).toBe("william_lilly");
    expect(venus.operationalCondition.speed.speedConvention).toBe("william_lilly");
  });

  it("3b. every traditional planet's speed block carries speedConvention: william_lilly", () => {
    for (const p of chart.classical.planets) {
      expect(p.operationalCondition.speed.speedConvention).toBe("william_lilly");
    }
  });

  it("4. chart.classical.meta stores the speed convention", () => {
    expect(chart.classical.meta.speedConvention).toBe("william_lilly");
  });

  it("5. Retrograde Venus: direction and speed status remain separate fields", () => {
    const venus = findClassical(chart, "venus");
    expect(venus.operationalCondition.motion.direction).toBe("retrograde");
    expect(venus.operationalCondition.speed.status).toBe("slow");
    // Confirm these live in genuinely separate objects, not derived from one another.
    expect(venus.operationalCondition.motion).not.toHaveProperty("status");
    expect(venus.operationalCondition.speed).not.toHaveProperty("direction");
  });

  it("6a. Sun/Moon/Mars/Jupiter/Saturn reference mean motions are unchanged from Phase 3C", () => {
    const expectedFormatted = {
      sun: "59′08″/day",
      moon: "13°10′36″/day",
      mars: "31′27″/day",
      jupiter: "04′59″/day",
      saturn: "02′01″/day",
    };
    const expectedDecimal = {
      sun: 59 / 60 + 8 / 3600,
      moon: 13 + 10 / 60 + 36 / 3600,
      mars: 31 / 60 + 27 / 3600,
      jupiter: 4 / 60 + 59 / 3600,
      saturn: 2 / 60 + 1 / 3600,
    };
    for (const key of Object.keys(expectedFormatted)) {
      const p = findClassical(chart, key);
      expect(p.operationalCondition.speed.referenceMeanSpeed).toBeCloseTo(expectedDecimal[key], 10);
      expect(p.operationalCondition.speed.referenceMeanSpeedFormatted).toBe(expectedFormatted[key]);
    }
  });

  it("6b. no existing Phase 1-3C verification values changed", () => {
    // Phase 1
    const sunPlanet = chart.planets.find((p) => p.key === "sun");
    expect(sunPlanet.sign.english).toBe("Scorpio");
    expect(sunPlanet.degreeInSign).toBeCloseTo(28.175, 2);
    expect(chart.angles.asc.sign.english).toBe("Virgo");

    // Phase 2
    expect(chart.points.length).toBe(26);

    // Phase 3A
    const venusDignity = findClassical(chart, "venus");
    expect(venusDignity.dignity.detriment.active).toBe(true);
    expect(venusDignity.dignity.detriment.score).toBe(-5);
    expect(venusDignity.totalEssentialScore).toBe(-5);

    // Phase 3B
    const jupiter = findClassical(chart, "jupiter");
    expect(jupiter.condition.solar.condition).toBe("combust");

    // Phase 3C (previously-established, unrelated to this refinement)
    expect(venusDignity.operationalCondition.housePosition).toEqual({ house: 2, class: "succedent" });
    expect(jupiter.operationalCondition.housePosition.class).toBe("cadent");
  });

  it("no operational/accidental score exists anywhere (still true after this refinement)", () => {
    for (const p of chart.classical.planets) {
      expect(JSON.stringify(p.operationalCondition)).not.toMatch(/score/i);
    }
  });
});
