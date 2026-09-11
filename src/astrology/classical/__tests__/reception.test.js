import { describe, it, expect } from "vitest";
import { calculateChart } from "../../ephemeris.js";
import { TRADITIONAL_PLANETS } from "../essentialDignity.js";
import { getDignityRulersAt, computeReceptionMatrix, getReceptionForPlanet, computeMutualReceptions } from "../reception.js";
import { computeDispositorChain, buildImmediateDispositor } from "../dispositorChain.js";

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

describe("TEST 1-2: Reception directionality", () => {
  it("TEST 1: Mars in Taurus -> Venus receives Mars by domicile", () => {
    const rulers = getDignityRulersAt({ sign: "taurus", degreeInSign: 15, sect: "day" });
    expect(rulers.domicile).toBe("venus");
  });

  it("TEST 2: directionality is not reversed - Mars does not automatically receive Venus back", () => {
    // Mars in Taurus (Venus's domicile); Venus placed in Gemini (nobody's
    // domicile relevant to Mars) - Mars must not show a domicile
    // reception of Venus just because Venus received Mars.
    const placements = [
      { planet: "mars", sign: "taurus", degreeInSign: 15 },
      { planet: "venus", sign: "gemini", degreeInSign: 15 },
      { planet: "sun", sign: "aries", degreeInSign: 1 },
      { planet: "moon", sign: "aries", degreeInSign: 1 },
      { planet: "mercury", sign: "aries", degreeInSign: 1 },
      { planet: "jupiter", sign: "aries", degreeInSign: 1 },
      { planet: "saturn", sign: "aries", degreeInSign: 1 },
    ];
    const matrix = computeReceptionMatrix(placements, "day");
    const venusReceivesMars = matrix.find((e) => e.receiver === "venus" && e.received === "mars");
    const marsReceivesVenus = matrix.find((e) => e.receiver === "mars" && e.received === "venus");
    expect(venusReceivesMars.types).toContain("domicile");
    expect(marsReceivesVenus.types).not.toContain("domicile");
  });
});

describe("TEST 3-6: Reception through each of the five dignity types", () => {
  it("TEST 3: reception through exaltation works (Aries -> Sun, sign-only per Phase 3A convention)", () => {
    const rulers = getDignityRulersAt({ sign: "aries", degreeInSign: 19, sect: "day" });
    expect(rulers.exaltation).toBe("sun");
    // Exaltation is sign-only (metadata degree, not an orb requirement) -
    // any degree within Aries still yields the Sun as exaltation ruler.
    const rulersOtherDegree = getDignityRulersAt({ sign: "aries", degreeInSign: 2, sect: "day" });
    expect(rulersOtherDegree.exaltation).toBe("sun");
  });

  it("TEST 4: reception through triplicity uses the active chart sect", () => {
    // Aries is a fire sign: day ruler = sun, night ruler = jupiter (Dorothean).
    const dayRulers = getDignityRulersAt({ sign: "aries", degreeInSign: 15, sect: "day" });
    const nightRulers = getDignityRulersAt({ sign: "aries", degreeInSign: 15, sect: "night" });
    expect(dayRulers.triplicity).toBe("sun");
    expect(nightRulers.triplicity).toBe("jupiter");
  });

  it("TEST 5: reception through Egyptian term works", () => {
    // Aries terms: 0-6 jupiter, 6-12 venus, 12-20 mercury, 20-25 mars, 25-30 saturn.
    expect(getDignityRulersAt({ sign: "aries", degreeInSign: 3, sect: "day" }).term).toBe("jupiter");
    expect(getDignityRulersAt({ sign: "aries", degreeInSign: 22, sect: "day" }).term).toBe("mars");
  });

  it("TEST 6: reception through Chaldean face works", () => {
    // Aries decan 0 (0-10 deg) is ruled by Mars.
    expect(getDignityRulersAt({ sign: "aries", degreeInSign: 5, sect: "day" }).face).toBe("mars");
  });
});

describe("TEST 7-8: Multiple simultaneous reception, no duplicates", () => {
  it("TEST 7: multiple simultaneous reception types are preserved (verification chart: Mars receives Venus by 4 dignities)", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const mars = findClassical(chart, "mars");
    const venusEntry = mars.reception.receives.find((e) => e.planet === "venus");
    expect(venusEntry).toBeDefined();
    expect(venusEntry.types.sort()).toEqual(["domicile", "face", "term", "triplicity"]);
  });

  it("TEST 8: no duplicated reception types anywhere in the verification chart's matrix", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    for (const entry of chart.classical.receptionMatrix) {
      expect(new Set(entry.types).size).toBe(entry.types.length);
    }
  });
});

describe("TEST 9-11: Mutual reception aggregation logic", () => {
  it("TEST 9: mutual reception by the same dignity works", () => {
    const matrix = [
      { receiver: "venus", received: "mars", types: ["domicile"] },
      { receiver: "mars", received: "venus", types: ["domicile"] },
    ];
    const mutual = computeMutualReceptions(matrix);
    expect(mutual).toHaveLength(1);
    expect(mutual[0]).toMatchObject({
      planetA: "venus",
      planetB: "mars",
      aReceivesB: { types: ["domicile"] },
      bReceivesA: { types: ["domicile"] },
      isMutual: true,
    });
  });

  it("TEST 10: mutual reception by different dignities works (not required to match)", () => {
    // TRADITIONAL_PLANETS order places venus before saturn, so planetA=venus, planetB=saturn.
    const matrix = [
      { receiver: "venus", received: "saturn", types: ["term"] },
      { receiver: "saturn", received: "venus", types: ["exaltation"] },
    ];
    const mutual = computeMutualReceptions(matrix);
    expect(mutual).toHaveLength(1);
    expect(mutual[0]).toMatchObject({ planetA: "venus", planetB: "saturn" });
    expect(mutual[0].aReceivesB.types).toEqual(["term"]);
    expect(mutual[0].bReceivesA.types).toEqual(["exaltation"]);
    expect(mutual[0].isMutual).toBe(true);
  });

  it("TEST 11: one-way reception is not mutual reception", () => {
    const matrix = [{ receiver: "venus", received: "mars", types: ["domicile"] }];
    const mutual = computeMutualReceptions(matrix);
    expect(mutual).toHaveLength(0);
  });
});

describe("TEST 12-15: Immediate dispositor uses traditional rulership only", () => {
  it("TEST 12: ruledBy is always one of the seven traditional planets, never Pluto/Uranus/Neptune", () => {
    const allSigns = [
      "aries", "taurus", "gemini", "cancer", "leo", "virgo",
      "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
    ];
    for (const sign of allSigns) {
      const result = buildImmediateDispositor({ planetKey: "venus", sign });
      expect(TRADITIONAL_PLANETS).toContain(result.ruledBy);
      expect(result.dignityType).toBe("domicile");
    }
  });

  it("TEST 13: Scorpio dispositor = Mars", () => {
    expect(buildImmediateDispositor({ planetKey: "venus", sign: "scorpio" }).ruledBy).toBe("mars");
  });

  it("TEST 14: Aquarius dispositor = Saturn", () => {
    expect(buildImmediateDispositor({ planetKey: "venus", sign: "aquarius" }).ruledBy).toBe("saturn");
  });

  it("TEST 15: Pisces dispositor = Jupiter", () => {
    expect(buildImmediateDispositor({ planetKey: "venus", sign: "pisces" }).ruledBy).toBe("jupiter");
  });
});

describe("TEST 16-19: Dispositor chain traversal, loop detection, self-dispositor", () => {
  it("TEST 16: dispositor chain terminates correctly at self-dispositor", () => {
    // mars(Taurus) -> venus -> venus(Virgo) -> mercury -> mercury(Gemini) -> self
    const signByPlanet = { mars: "taurus", venus: "virgo", mercury: "gemini" };
    const result = computeDispositorChain("mars", signByPlanet);
    expect(result.chain).toEqual(["mars", "venus", "mercury"]);
    expect(result.terminationType).toBe("self_dispositor");
    expect(result.finalDispositor).toBe("mercury");
    expect(result.loopMembers).toEqual([]);
  });

  it("TEST 17: loop detection prevents infinite recursion (returns promptly for a 2-cycle)", () => {
    const signByPlanet = { mars: "taurus", venus: "aries" }; // mars->venus->mars
    const result = computeDispositorChain("mars", signByPlanet);
    expect(result.chain).toEqual(["mars", "venus"]);
    expect(result.terminationType).toBe("loop");
  });

  it("TEST 18: loop returns finalDispositor = null", () => {
    const signByPlanet = { mars: "taurus", venus: "aries" };
    const result = computeDispositorChain("mars", signByPlanet);
    expect(result.finalDispositor).toBeNull();
    expect(result.loopMembers).toEqual(["mars", "venus"]);
  });

  it("TEST 19: self-dispositor handled correctly for a single-step case", () => {
    const result = computeDispositorChain("sun", { sun: "leo" });
    expect(result.chain).toEqual(["sun"]);
    expect(result.terminationType).toBe("self_dispositor");
    expect(result.finalDispositor).toBe("sun");
  });
});

describe("TEST 20: Mercury follows the exact same reception rules as every other planet", () => {
  it("Mercury in Taurus is received by Venus by domicile, identically to Mars in TEST 1 - no oriental/occidental special-casing", () => {
    const rulers = getDignityRulersAt({ sign: "taurus", degreeInSign: 15, sect: "day" });
    expect(rulers.domicile).toBe("venus");
    // getDignityRulersAt's signature has no sect-family/mercuryPhase parameter at all,
    // so there is no code path through which Mercury could be special-cased.
    const placements = [
      { planet: "mercury", sign: "taurus", degreeInSign: 15 },
      { planet: "venus", sign: "gemini", degreeInSign: 1 },
      { planet: "sun", sign: "gemini", degreeInSign: 1 },
      { planet: "moon", sign: "gemini", degreeInSign: 1 },
      { planet: "mars", sign: "gemini", degreeInSign: 1 },
      { planet: "jupiter", sign: "gemini", degreeInSign: 1 },
      { planet: "saturn", sign: "gemini", degreeInSign: 1 },
    ];
    const matrix = computeReceptionMatrix(placements, "day");
    const venusReceivesMercury = matrix.find((e) => e.receiver === "venus" && e.received === "mercury");
    expect(venusReceivesMercury.types).toContain("domicile");
  });
});

describe("TEST 21-22: Reception matrix completeness and receives/receivedBy inversion", () => {
  const chart = calculateChart(VERIFICATION_INPUT);

  it("TEST 21: reception matrix contains all 42 ordered non-self planet pairs", () => {
    const matrix = chart.classical.receptionMatrix;
    expect(matrix.length).toBe(42);
    for (const entry of matrix) {
      expect(entry.receiver).not.toBe(entry.received);
      expect(TRADITIONAL_PLANETS).toContain(entry.receiver);
      expect(TRADITIONAL_PLANETS).toContain(entry.received);
    }
    const pairKeys = new Set(matrix.map((e) => `${e.receiver}->${e.received}`));
    expect(pairKeys.size).toBe(42);
  });

  it("TEST 22: receives and receivedBy are exact inverses of the same matrix", () => {
    const matrix = chart.classical.receptionMatrix;
    for (const entry of matrix.filter((e) => e.types.length > 0)) {
      const receiverView = getReceptionForPlanet(matrix, entry.receiver);
      const receivedView = getReceptionForPlanet(matrix, entry.received);
      expect(receiverView.receives).toContainEqual({ planet: entry.received, types: entry.types });
      expect(receivedView.receivedBy).toContainEqual({ planet: entry.receiver, types: entry.types });
    }
    // And per-planet chart output matches getReceptionForPlanet exactly.
    for (const p of chart.classical.planets) {
      expect(p.reception).toEqual(getReceptionForPlanet(matrix, p.planet));
    }
  });
});

describe("TEST 23-24: No score, no negative reception", () => {
  it("TEST 23: no receptionScore/relationshipStrengthScore/mutualReceptionScore exists anywhere", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    for (const p of chart.classical.planets) {
      expect(JSON.stringify(p.reception)).not.toMatch(/score/i);
      expect(JSON.stringify(p.dispositor)).not.toMatch(/score/i);
      expect(p).not.toHaveProperty("receptionScore");
      expect(p).not.toHaveProperty("relationshipStrengthScore");
    }
    expect(JSON.stringify(chart.classical.mutualReceptions)).not.toMatch(/score/i);
    expect(chart.classical).not.toHaveProperty("mutualReceptionScore");
  });

  it("TEST 24: no negative reception (detriment/fall/rejects/enmity) is implemented", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const DIGNITY_TYPES = ["domicile", "exaltation", "triplicity", "term", "face"];
    for (const entry of chart.classical.receptionMatrix) {
      for (const t of entry.types) {
        expect(DIGNITY_TYPES).toContain(t);
      }
    }
    const fullJson = JSON.stringify({ matrix: chart.classical.receptionMatrix, mutual: chart.classical.mutualReceptions });
    expect(fullJson).not.toMatch(/detriment|fall|reject|dislike|enmity/i);
  });
});

describe("TEST 25: Full verification chart output - computed, not pre-assumed - and Phase 1-3D regression", () => {
  it("TEST 25: seven-planet dispositor/reception report and complete mutual-reception list, plus Phase 1-3D values unchanged", () => {
    const chart = calculateChart(VERIFICATION_INPUT);

    // Metadata
    expect(chart.classical.meta.receptionConvention).toBe("traditional_five_positive_dignities");
    expect(chart.classical.meta.rulershipSystem).toBe("traditional");
    expect(chart.classical.meta.triplicitySystem).toBe("dorothean");
    expect(chart.classical.meta.termSystem).toBe("egyptian");
    expect(chart.classical.meta.faceSystem).toBe("chaldean");

    // Every planet's immediate dispositor, traced from its actual sign -
    // none is in its own domicile in this chart, so no planet self-disposits.
    const expectedImmediate = {
      sun: "mars", // Scorpio
      moon: "mercury", // Gemini
      mercury: "mars", // Scorpio
      venus: "mars", // Scorpio
      mars: "sun", // Leo
      jupiter: "mars", // Scorpio
      saturn: "jupiter", // Pisces
    };
    for (const [planet, ruledBy] of Object.entries(expectedImmediate)) {
      const p = findClassical(chart, planet);
      expect(p.dispositor.immediate.ruledBy).toBe(ruledBy);
      expect(p.dispositor.chain.terminationType).toBe("loop");
      expect(p.dispositor.chain.finalDispositor).toBeNull();
      // Every chain resolves into the same core Sun<->Mars mutual-domicile loop.
      expect(p.dispositor.chain.loopMembers.sort()).toEqual(["mars", "sun"]);
    }

    // Complete mutual-reception list - computed, not assumed in advance.
    const mutual = chart.classical.mutualReceptions;
    const pairs = mutual.map((m) => [m.planetA, m.planetB].sort().join("-")).sort();
    expect(pairs).toEqual(["jupiter-saturn", "mars-mercury", "mars-sun", "jupiter-mars"].map((s) => s.split("-").sort().join("-")).sort());

    const sunMars = mutual.find((m) => [m.planetA, m.planetB].sort().join("-") === "mars-sun");
    expect(sunMars.aReceivesB.types).toContain("domicile");
    expect(sunMars.bReceivesA.types).toEqual(expect.arrayContaining(["domicile", "triplicity"]));

    // Phase 1
    const sunPlanet = chart.planets.find((p) => p.key === "sun");
    expect(sunPlanet.sign.english).toBe("Scorpio");
    expect(chart.angles.asc.sign.english).toBe("Virgo");

    // Phase 2
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
    expect(venus.sectConditionDetail.halb.isHalb).toBe(true);
    expect(chart.classical.meta.hayzHalbConvention).toBe("traditional_halb_base_hayz_full");
  });
});
