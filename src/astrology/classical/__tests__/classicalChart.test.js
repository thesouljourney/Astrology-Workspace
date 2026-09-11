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

describe("Classical chart integration (verification case)", () => {
  const chart = calculateChart(VERIFICATION_INPUT);

  it("chart.classical.meta stores the exact conventions used, permanently", () => {
    expect(chart.classical.meta).toEqual({
      zodiacType: "tropical",
      rulershipSystem: "traditional",
      triplicitySystem: "dorothean",
      termSystem: "egyptian",
      faceSystem: "chaldean",
      speedConvention: "william_lilly",
      hayzHalbConvention: "traditional_halb_base_hayz_full",
      receptionConvention: "traditional_five_positive_dignities",
      receptionQualification: "not_yet_evaluated",
      aspectSystem: "classical_major_five",
      aspectOrbConvention: "lilly_moiety_sum",
      aspectExactnessToleranceDegrees: 0.0003,
      signAspectDoctrine: "whole_sign_separate_fact",
      dexterSinisterStatus: "deferred",
      directPerfectionMethod: "future_ephemeris_event_search",
      directPerfectionEngine: "astronomy-engine",
      directPerfectionSearchHorizonDays: 180,
      directPerfectionExactnessToleranceDegrees: 0.0003,
      signIngressConvention: "requires_historical_rule",
      refranationConvention: "retrograde_prevents_perfection_within_horizon",
    });
  });

  it("sect is determined astronomically (Sun below horizon at 01:44 local -> night)", () => {
    expect(chart.classical.sect).toBe("night");
  });

  it("exactly the seven traditional planets are scored, no more, no less", () => {
    const keys = chart.classical.planets.map((p) => p.planet).sort();
    expect(keys).toEqual(["jupiter", "mars", "mercury", "moon", "saturn", "sun", "venus"]);
  });

  it("every traditional planet's placement matches the already-verified Phase 1 longitude/sign/house exactly", () => {
    for (const cp of chart.classical.planets) {
      const p = chart.planets.find((pl) => pl.key === cp.planet);
      expect(cp.placement.absoluteLongitude).toBe(p.longitude);
      expect(cp.placement.sign).toBe(p.sign.key);
      expect(cp.placement.degreeInSign).toBe(p.degreeInSign);
      expect(cp.placement.house).toBe(p.house);
    }
  });

  it("Venus (verification chart: Scorpio) is correctly in Detriment", () => {
    const venus = chart.classical.planets.find((p) => p.planet === "venus");
    expect(venus.placement.sign).toBe("scorpio");
    expect(venus.dignity.detriment.active).toBe(true);
    expect(venus.dignity.detriment.score).toBe(-5);
  });
});

describe("TEST 20: Modern Western output is unchanged by adding Classical Astrology", () => {
  const chart = calculateChart(VERIFICATION_INPUT);

  it("Phase 1 verification values are unaffected", () => {
    const sun = chart.planets.find((p) => p.key === "sun");
    expect(sun.sign.english).toBe("Scorpio");
    expect(sun.degreeInSign).toBeCloseTo(28.175, 2);
    expect(chart.angles.asc.sign.english).toBe("Virgo");
    expect(chart.angles.mc.sign.english).toBe("Gemini");
  });

  it("Phase 2 chart.points (26-point model) is unaffected", () => {
    expect(chart.points.length).toBe(26);
    const implemented = chart.points.filter((p) => p.absoluteLongitude !== null).length;
    expect(implemented).toBe(20);
    const venus = chart.points.find((p) => p.id === "venus");
    expect(venus.motion.retrograde).toBe(true);
  });
});
