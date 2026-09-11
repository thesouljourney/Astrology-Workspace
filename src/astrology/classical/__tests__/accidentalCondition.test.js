import { describe, it, expect } from "vitest";
import { calculateChart } from "../../ephemeris.js";
import { getHouseClass } from "../rules/angularity.js";
import { shortestAngularDistance, computeAngleProximity } from "../angleProximity.js";
import { computeSpeedCondition } from "../rules/planetarySpeed.js";

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

describe("TEST 1-12: House angularity classification", () => {
  it("TEST 1-4: angular houses", () => {
    expect(getHouseClass(1)).toBe("angular");
    expect(getHouseClass(4)).toBe("angular");
    expect(getHouseClass(7)).toBe("angular");
    expect(getHouseClass(10)).toBe("angular");
  });

  it("TEST 5-8: succedent houses", () => {
    expect(getHouseClass(2)).toBe("succedent");
    expect(getHouseClass(5)).toBe("succedent");
    expect(getHouseClass(8)).toBe("succedent");
    expect(getHouseClass(11)).toBe("succedent");
  });

  it("TEST 9-12: cadent houses", () => {
    expect(getHouseClass(3)).toBe("cadent");
    expect(getHouseClass(6)).toBe("cadent");
    expect(getHouseClass(9)).toBe("cadent");
    expect(getHouseClass(12)).toBe("cadent");
  });
});

describe("TEST 13-14: Angle distance / nearest angle", () => {
  it("TEST 13: 359 deg vs 1 deg wraps correctly -> shortest distance 2 deg", () => {
    expect(shortestAngularDistance(359, 1)).toBeCloseTo(2, 8);
    expect(shortestAngularDistance(1, 359)).toBeCloseTo(2, 8);
  });

  it("TEST 14: nearestAngle selects the closest of ASC/IC/DSC/MC", () => {
    const angles = { asc: 0, mc: 90, ic: 180, desc: 270 };
    const { nearestAngle } = computeAngleProximity(5, angles);
    expect(nearestAngle.angle).toBe("ASC");
    expect(nearestAngle.distanceDegrees).toBeCloseTo(5, 8);
  });

  it("distanceToAngles are always within [0, 180]", () => {
    const angles = { asc: 10, mc: 100, ic: 190, desc: 280 };
    for (const planetLon of [0, 90, 180, 270, 359.999, 0.001]) {
      const { distanceToAngles } = computeAngleProximity(planetLon, angles);
      for (const v of Object.values(distanceToAngles)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(180);
      }
    }
  });
});

describe("TEST 15-18: Phase 3B data reused verbatim, not recalculated", () => {
  const chart = calculateChart(VERIFICATION_INPUT);

  it("TEST 15: motion direction matches Phase 3B / upstream", () => {
    for (const p of chart.classical.planets) {
      expect(p.operationalCondition.motion.direction).toBe(p.condition.motion.direction);
      expect(p.operationalCondition.motion.longitudeSpeed).toBe(p.condition.motion.longitudeSpeed);
    }
  });

  it("TEST 16: solar condition matches Phase 3B", () => {
    for (const p of chart.classical.planets) {
      if (p.condition.solar === null) {
        expect(p.operationalCondition.solar).toBeNull();
      } else {
        expect(p.operationalCondition.solar.status).toBe(p.condition.solar.condition);
        expect(p.operationalCondition.solar.elongationDegrees).toBe(p.condition.solar.elongation);
      }
    }
  });

  it("TEST 17: sect condition matches Phase 3B", () => {
    for (const p of chart.classical.planets) {
      expect(p.operationalCondition.sect.chartSect).toBe(p.condition.chartSect);
      expect(p.operationalCondition.sect.family).toBe(p.condition.sect.family);
      expect(p.operationalCondition.sect.effectiveSect).toBe(p.condition.sect.effectiveSect);
      expect(p.operationalCondition.sect.isOfSect).toBe(p.condition.sect.isOfSect);
      expect(p.operationalCondition.sect.mercuryPhase).toBe(p.condition.sect.mercuryPhase);
    }
  });

  it("TEST 18: horizon altitude/status matches Phase 3B", () => {
    for (const p of chart.classical.planets) {
      expect(p.operationalCondition.horizon.altitudeDegrees).toBe(p.condition.horizon.altitude);
      expect(p.operationalCondition.horizon.hemisphere).toBe(p.condition.horizon.isAboveHorizon ? "above_horizon" : "below_horizon");
    }
  });
});

describe("TEST 19-20: Speed reuse and retrograde/speed separation", () => {
  it("TEST 19: speed condition uses the upstream longitudeSpeed value directly, no recalculation", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    for (const p of chart.classical.planets) {
      expect(p.operationalCondition.speed.longitudeSpeed).toBe(p.condition.motion.longitudeSpeed);
    }
  });

  it("TEST 20: retrograde is not automatically converted into slow", () => {
    // Venus is retrograde in the verification chart but has a documented
    // (non-null) speed status derived purely from magnitude comparison,
    // never from direction.
    const chart = calculateChart(VERIFICATION_INPUT);
    const venus = findClassical(chart, "venus");
    expect(venus.operationalCondition.motion.direction).toBe("retrograde");
    // A synthetic fast retrograde planet must be classified "swift", proving
    // direction never forces the "slow" label.
    const fastRetrograde = computeSpeedCondition("mars", -2.0); // far above Mars's mean
    expect(fastRetrograde.status).toBe("swift");
    const slowDirect = computeSpeedCondition("mars", 0.01); // far below Mars's mean, direct
    expect(slowDirect.status).toBe("slow");
  });
});

describe("TEST 21: No accidental/operational total score exists anywhere", () => {
  it("operationalCondition and its sub-objects contain no score field", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    for (const p of chart.classical.planets) {
      const json = JSON.stringify(p.operationalCondition);
      expect(json).not.toMatch(/score/i);
      expect(p).not.toHaveProperty("accidentalScore");
      expect(p).not.toHaveProperty("operationalScore");
      expect(p).not.toHaveProperty("strengthScore");
      expect(p).not.toHaveProperty("totalClassicalScore");
    }
  });

  it("Phase 3A's totalEssentialScore is untouched and remains the only score", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const venus = findClassical(chart, "venus");
    expect(venus.totalEssentialScore).toBe(-5);
  });
});

describe("Mercury/Venus speed convention (explicit project decision, not silent)", () => {
  it("both use Lilly's shared solar rate (59'08\"/day) per explicit decision", () => {
    const mercury = computeSpeedCondition("mercury", 1.5);
    const venus = computeSpeedCondition("venus", 0.5);
    expect(mercury.referenceMeanSpeed).toBeCloseTo(59 / 60 + 8 / 3600, 6);
    expect(venus.referenceMeanSpeed).toBeCloseTo(59 / 60 + 8 / 3600, 6);
    expect(mercury.status).toBe("swift");
    expect(venus.status).toBe("slow");
  });
});

describe("Housing position reuses the already-verified planet.house exactly", () => {
  it("no independent house recalculation", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    for (const p of chart.classical.planets) {
      const upstream = chart.planets.find((pl) => pl.key === p.planet);
      expect(p.operationalCondition.housePosition.house).toBe(upstream.house);
    }
  });
});
