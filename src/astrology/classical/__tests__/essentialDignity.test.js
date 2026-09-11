import { describe, it, expect } from "vitest";
import { computeEssentialDignity, SCORES } from "../essentialDignity.js";
import { getDispositor } from "../rules/rulership.js";

// Rule-level tests: synthetic placements, independent of any natal chart.
function dignity(planetKey, sign, degreeInSign = 15, sect = "day") {
  return computeEssentialDignity({
    planetKey,
    sign,
    absoluteLongitude: 0,
    degreeInSign,
    house: 1,
    sect,
  });
}

describe("Domicile / Exaltation / Detriment / Fall (TEST 1-8)", () => {
  it("TEST 1: Sun in Leo -> Domicile +5", () => {
    const r = dignity("sun", "leo");
    expect(r.dignity.domicile.active).toBe(true);
    expect(r.dignity.domicile.score).toBe(5);
  });

  it("TEST 2: Sun in Aries -> Exaltation +4", () => {
    const r = dignity("sun", "aries");
    expect(r.dignity.exaltation.active).toBe(true);
    expect(r.dignity.exaltation.score).toBe(4);
  });

  it("TEST 3: Sun in Aquarius -> Detriment -5", () => {
    const r = dignity("sun", "aquarius");
    expect(r.dignity.detriment.active).toBe(true);
    expect(r.dignity.detriment.score).toBe(-5);
  });

  it("TEST 4: Sun in Libra -> Fall -4", () => {
    const r = dignity("sun", "libra");
    expect(r.dignity.fall.active).toBe(true);
    expect(r.dignity.fall.score).toBe(-4);
  });

  it("TEST 5: Venus in Taurus -> Domicile +5", () => {
    const r = dignity("venus", "taurus");
    expect(r.dignity.domicile.active).toBe(true);
    expect(r.dignity.domicile.score).toBe(5);
  });

  it("TEST 6: Venus in Scorpio -> Detriment -5", () => {
    const r = dignity("venus", "scorpio");
    expect(r.dignity.detriment.active).toBe(true);
    expect(r.dignity.detriment.score).toBe(-5);
  });

  it("TEST 7: Mars in Capricorn -> Exaltation +4", () => {
    const r = dignity("mars", "capricorn");
    expect(r.dignity.exaltation.active).toBe(true);
    expect(r.dignity.exaltation.score).toBe(4);
  });

  it("TEST 8: Saturn in Aries -> Fall -4", () => {
    const r = dignity("saturn", "aries");
    expect(r.dignity.fall.active).toBe(true);
    expect(r.dignity.fall.score).toBe(-4);
  });
});

describe("TEST 9: Traditional rulership / immediate dispositor", () => {
  it("Scorpio dispositor = Mars", () => {
    expect(getDispositor("scorpio")).toBe("mars");
  });
  it("Aquarius dispositor = Saturn", () => {
    expect(getDispositor("aquarius")).toBe("saturn");
  });
  it("Pisces dispositor = Jupiter", () => {
    expect(getDispositor("pisces")).toBe("jupiter");
  });
});

describe("TEST 14-15: Triplicity sect-dependence and participating ruler", () => {
  it("TEST 14: Fire sign triplicity ruler changes between day and night charts", () => {
    const dayChart = dignity("sun", "aries", 15, "day");
    const nightChart = dignity("jupiter", "aries", 15, "night");
    expect(dayChart.dignity.triplicity.activeRuler).toBe("sun");
    expect(dayChart.dignity.triplicity.active).toBe(true);
    expect(nightChart.dignity.triplicity.activeRuler).toBe("jupiter");
    expect(nightChart.dignity.triplicity.active).toBe(true);

    // Sun is not the fire ruler at night; Jupiter is not the fire ruler by day.
    const sunAtNight = dignity("sun", "aries", 15, "night");
    expect(sunAtNight.dignity.triplicity.active).toBe(false);
  });

  it("TEST 15: Participating ruler is stored but does not automatically receive +3", () => {
    // Saturn is fire's participating ruler, but the active ruler by day is the Sun.
    const r = dignity("saturn", "aries", 15, "day");
    expect(r.dignity.triplicity.participatingRuler).toBe("saturn");
    expect(r.dignity.triplicity.active).toBe(false);
    expect(r.dignity.triplicity.score).toBe(0);
  });
});

describe("TEST 16: Multiple dignity stacking", () => {
  it("Mercury at 3 deg Virgo has Domicile + Exaltation + Term simultaneously", () => {
    const r = dignity("mercury", "virgo", 3, "day");
    expect(r.dignity.domicile.active).toBe(true);
    expect(r.dignity.exaltation.active).toBe(true);
    expect(r.dignity.term.active).toBe(true); // Virgo 0-7 deg term ruler is Mercury
    expect(r.totalEssentialScore).toBe(SCORES.domicile + SCORES.exaltation + SCORES.term);
  });
});

describe("TEST 17-18: Peregrine detection", () => {
  it("TEST 17: Sun at 5 deg Scorpio has no positive dignity -> peregrine", () => {
    const r = dignity("sun", "scorpio", 5, "day");
    expect(r.dignity.domicile.active).toBe(false);
    expect(r.dignity.exaltation.active).toBe(false);
    expect(r.dignity.triplicity.active).toBe(false);
    expect(r.dignity.term.active).toBe(false); // Sun/Moon never rule Egyptian terms
    expect(r.dignity.face.active).toBe(false); // Scorpio 0-10 deg face ruler is Mars, not Sun
    expect(r.peregrine).toBe(true);
  });

  it("TEST 18: Mars at 28 deg Taurus is in Detriment AND has Term dignity -> not peregrine", () => {
    const r = dignity("mars", "taurus", 28, "day");
    expect(r.dignity.detriment.active).toBe(true);
    expect(r.dignity.term.ruler).toBe("mars");
    expect(r.dignity.term.active).toBe(true);
    expect(r.peregrine).toBe(false);
  });
});

describe("TEST 19: Total score equals the sum of all active dignity/debility scores", () => {
  it("holds across a range of synthetic placements", () => {
    const cases = [
      ["mercury", "virgo", 3],
      ["mars", "taurus", 28],
      ["sun", "scorpio", 5],
      ["venus", "scorpio", 2.5],
      ["saturn", "pisces", 5],
      ["jupiter", "cancer", 15],
    ];
    for (const [planetKey, sign, degreeInSign] of cases) {
      const r = dignity(planetKey, sign, degreeInSign, "night");
      const manualSum = Object.values(r.dignity).reduce((sum, d) => sum + d.score, 0);
      expect(r.totalEssentialScore).toBe(manualSum);
    }
  });
});

describe("Rejects non-traditional bodies", () => {
  it("throws for Uranus", () => {
    expect(() => dignity("uranus", "aquarius")).toThrow();
  });
});
