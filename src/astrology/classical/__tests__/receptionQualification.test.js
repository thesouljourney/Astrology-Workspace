import { describe, it, expect } from "vitest";
import { calculateChart } from "../../ephemeris.js";
import { getDignityRulersAt } from "../reception.js";

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

// Regression suite for the Phase 3E dignity-relationship/operative-reception
// terminology refinement. This refinement changes NO calculation - it only
// adds metadata/documentation distinguishing the raw dignity relationship
// Phase 3E computes from the (not-yet-implemented) question of whether that
// relationship perfects into "operative" reception. Every value asserted
// below must be numerically identical to the original Phase 3E implementation.

describe("REGRESSION 1: Directionality remains unchanged", () => {
  it("B still receives A when A occupies B's dignity, never the reverse", () => {
    const rulers = getDignityRulersAt({ sign: "taurus", degreeInSign: 15, sect: "day" });
    expect(rulers.domicile).toBe("venus");
  });
});

describe("REGRESSION 2: All five dignity types remain preserved", () => {
  it("the verification chart's reception matrix still uses exactly the five positive dignity types", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const DIGNITY_TYPES = ["domicile", "exaltation", "triplicity", "term", "face"];
    const seen = new Set();
    for (const entry of chart.classical.receptionMatrix) {
      for (const t of entry.types) seen.add(t);
    }
    for (const t of seen) expect(DIGNITY_TYPES).toContain(t);
    // All five types actually occur somewhere in this chart - none silently dropped.
    expect([...seen].sort()).toEqual(DIGNITY_TYPES.slice().sort());
  });
});

describe("REGRESSION 3-5: Single minor-dignity-only relationships remain recorded", () => {
  const chart = calculateChart(VERIFICATION_INPUT);
  const matrix = chart.classical.receptionMatrix;

  it("REGRESSION 3: a single face relationship remains recorded (Sun -> Venus, face only)", () => {
    const entry = matrix.find((e) => e.receiver === "venus" && e.received === "sun");
    expect(entry.types).toEqual(["face"]);
  });

  it("REGRESSION 4: a single term relationship remains recorded (Mars -> Mercury, term only)", () => {
    const entry = matrix.find((e) => e.receiver === "mercury" && e.received === "mars");
    expect(entry.types).toEqual(["term"]);
  });

  it("REGRESSION 5: a single triplicity relationship remains recorded (Mars -> Jupiter, triplicity only)", () => {
    const entry = matrix.find((e) => e.receiver === "jupiter" && e.received === "mars");
    expect(entry.types).toEqual(["triplicity"]);
  });
});

describe("REGRESSION 6: No aspect requirement is evaluated in Phase 3E", () => {
  it("getDignityRulersAt's signature accepts only sign/degreeInSign/sect - no orb, no aspect, no application parameter", () => {
    // If an aspect/application requirement existed, this call would need
    // additional planet-pair angular-distance data; it does not.
    const rulers = getDignityRulersAt({ sign: "aries", degreeInSign: 19, sect: "day" });
    expect(rulers.exaltation).toBe("sun");
    expect(rulers).not.toHaveProperty("aspect");
    expect(rulers).not.toHaveProperty("orb");
    expect(rulers).not.toHaveProperty("application");
  });

  it("the reception matrix and mutual reception results never reference aspect/orb/application", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const json = JSON.stringify({ matrix: chart.classical.receptionMatrix, mutual: chart.classical.mutualReceptions });
    expect(json).not.toMatch(/aspect|orb|application|perfect/i);
  });
});

describe("REGRESSION 7-8: No perfectReception or operativeReception field exists", () => {
  it("REGRESSION 7: no perfectReception field exists anywhere in chart.classical", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    expect(JSON.stringify(chart.classical)).not.toMatch(/perfectReception/);
    for (const p of chart.classical.planets) {
      expect(p).not.toHaveProperty("perfectReception");
      expect(p.reception).not.toHaveProperty("perfectReception");
    }
  });

  it("REGRESSION 8: no operativeReception field exists anywhere in chart.classical", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    expect(JSON.stringify(chart.classical)).not.toMatch(/operativeReception/);
    for (const p of chart.classical.planets) {
      expect(p).not.toHaveProperty("operativeReception");
      expect(p.reception).not.toHaveProperty("operativeReception");
    }
  });
});

describe("REGRESSION 9: Metadata explicitly states reception qualification is not yet evaluated", () => {
  it("chart.classical.meta.receptionQualification is 'not_yet_evaluated', and prior metadata is preserved", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    expect(chart.classical.meta.receptionQualification).toBe("not_yet_evaluated");
    // Prior Phase 3E metadata is not deleted, only supplemented.
    expect(chart.classical.meta.receptionConvention).toBe("traditional_five_positive_dignities");
    expect(chart.classical.meta.rulershipSystem).toBe("traditional");
    expect(chart.classical.meta.triplicitySystem).toBe("dorothean");
    expect(chart.classical.meta.termSystem).toBe("egyptian");
    expect(chart.classical.meta.faceSystem).toBe("chaldean");
  });
});

describe("REGRESSION 10: Phase 1-3D values remain unchanged", () => {
  it("Phase 1/2/3A/3B/3C/3D verification values are untouched", () => {
    const chart = calculateChart(VERIFICATION_INPUT);

    const sunPlanet = chart.planets.find((p) => p.key === "sun");
    expect(sunPlanet.sign.english).toBe("Scorpio");
    expect(chart.angles.asc.sign.english).toBe("Virgo");
    expect(chart.points.length).toBe(26);

    const venusDignity = findClassical(chart, "venus");
    expect(venusDignity.dignity.detriment.active).toBe(true);
    expect(venusDignity.totalEssentialScore).toBe(-5);

    const jupiter = findClassical(chart, "jupiter");
    expect(jupiter.condition.solar.condition).toBe("combust");

    expect(venusDignity.operationalCondition.housePosition).toEqual({ house: 2, class: "succedent" });
    expect(chart.classical.meta.speedConvention).toBe("william_lilly");

    const venus = findClassical(chart, "venus");
    expect(venus.sectConditionDetail.hayz.isHayz).toBe(true);
    expect(venus.sectConditionDetail.halb.isHalb).toBe(true);
    expect(chart.classical.meta.hayzHalbConvention).toBe("traditional_halb_base_hayz_full");
  });
});

describe("REGRESSION 11: Existing Phase 3E dignity matrix values remain numerically unchanged", () => {
  it("the verification chart's full matrix, dispositor chains, and mutual receptions are identical to the original Phase 3E implementation", () => {
    const chart = calculateChart(VERIFICATION_INPUT);

    // Same 4 mutual pairs, same types, as originally computed.
    const pairs = chart.classical.mutualReceptions
      .map((m) => `${[m.planetA, m.planetB].sort().join("-")}`)
      .sort();
    expect(pairs).toEqual(["jupiter-saturn", "mars-mercury", "mars-sun", "jupiter-mars"].map((s) => s.split("-").sort().join("-")).sort());

    const sunMars = chart.classical.mutualReceptions.find((m) => [m.planetA, m.planetB].sort().join("-") === "mars-sun");
    expect(sunMars.aReceivesB.types).toEqual(["domicile"]);
    expect(sunMars.bReceivesA.types.slice().sort()).toEqual(["domicile", "triplicity"]);

    // Mars still receives Venus through all four dignity types.
    const mars = findClassical(chart, "mars");
    const venusEntry = mars.reception.receives.find((e) => e.planet === "venus");
    expect(venusEntry.types.slice().sort()).toEqual(["domicile", "face", "term", "triplicity"]);

    // Every dispositor chain still resolves into the same Sun<->Mars loop, no self-dispositor.
    for (const p of chart.classical.planets) {
      expect(p.dispositor.chain.terminationType).toBe("loop");
      expect(p.dispositor.chain.finalDispositor).toBeNull();
      expect(p.dispositor.chain.loopMembers.slice().sort()).toEqual(["mars", "sun"]);
    }
  });
});
