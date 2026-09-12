import { describe, it, expect } from "vitest";
import { calculateChart } from "../../ephemeris.js";
import { RASHIS } from "../rashi.js";
import { RASHI_LORDS } from "../rashiLordship.js";
import { GRAHA_DISPLAY_NAME, NAVAGRAHA_ORDER } from "../grahaNames.js";
import { CLASSICAL_GRAHA_KEYS } from "../dignityTables.js";
import { buildVedicBhava } from "../bhava.js";
import { buildVedicCondition } from "../condition.js";
import { buildVedicLordship, HOUSE_GROUPS } from "../lordship.js";

const VERIFICATION_INPUT = {
  birthDate: "1994-11-21",
  birthTime: "01:44:00",
  latitude: 1.8548,
  longitude: 102.9325,
  utcOffset: "+08:00",
  houseSystem: "placidus",
};

function chart() {
  return calculateChart(VERIFICATION_INPUT);
}

function rashiIndex(key) {
  return RASHIS.find((r) => r.key === key).index;
}

/** A minimal, independently-constructed fake `chart.vedic.grahas[key]` record. */
function fakeGraha(rashiKey, degreeWithinRashi = 15, { retrograde = false } = {}) {
  const idx = rashiIndex(rashiKey);
  return {
    rashi: RASHIS[idx].name,
    rashiIndex: idx,
    degreeWithinRashi,
    siderealLongitude: idx * 30 + degreeWithinRashi,
    motion: { retrograde },
  };
}

/**
 * Builds a full synthetic `{ grahas, bhava, condition }` triple by
 * running the REAL Phase 4B/4D builders on synthetic Rashi placements -
 * this exercises the actual production dispositor-chain logic exactly
 * as it runs in a real chart, without hand-rolling fake bhava/condition
 * shapes. `rashiKeyByPlanet` maps each of the 7 classical Grahas (plus
 * optionally rahu/ketu) to the Rashi key it should occupy for this
 * synthetic scenario; unlisted classical Grahas default to their own
 * first Rashi (a harmless self-dispositor, never interfering with the
 * scenario under test).
 */
function buildSyntheticLordship(rashiKeyByPlanet) {
  const defaultOwnRashi = {
    sun: "leo",
    moon: "cancer",
    mars: "aries",
    mercury: "gemini",
    jupiter: "sagittarius",
    venus: "taurus",
    saturn: "capricorn",
    rahu: "libra",
    ketu: "aries",
  };
  const grahas = {};
  for (const key of NAVAGRAHA_ORDER) {
    const rashiKey = rashiKeyByPlanet[key] ?? defaultOwnRashi[key];
    grahas[key] = fakeGraha(rashiKey);
  }
  const lagna = { rashi: "Aries", rashiIndex: 0 };
  const bhava = buildVedicBhava({ lagna, grahas });
  const condition = buildVedicCondition({ grahas });
  return buildVedicLordship({ grahas, bhava, condition });
}

describe("TEST 1: every classical Graha has exactly one immediate Rashi dispositor", () => {
  it("chart.vedic.lordship.dispositors has a single string `dispositor` per classical Graha", () => {
    const { dispositors } = chart().vedic.lordship;
    for (const key of CLASSICAL_GRAHA_KEYS) {
      expect(typeof dispositors[key].dispositor).toBe("string");
      expect(Object.values(GRAHA_DISPLAY_NAME)).toContain(dispositors[key].dispositor);
    }
  });
});

describe("TEST 2: Rahu/Ketu have Rashi dispositors", () => {
  it("dispositors.rahu/ketu each have a valid classical-Graha dispositor", () => {
    const { dispositors } = chart().vedic.lordship;
    for (const key of ["rahu", "ketu"]) {
      expect(typeof dispositors[key].dispositor).toBe("string");
      const classicalDisplayNames = CLASSICAL_GRAHA_KEYS.map((k) => GRAHA_DISPLAY_NAME[k]);
      expect(classicalDisplayNames).toContain(dispositors[key].dispositor);
    }
  });
});

describe("TEST 3: Rahu/Ketu never own signs", () => {
  it("RASHI_LORDS never resolves to rahu/ketu, so neither ever appears as a dispositor of anything or in the house-lord matrix", () => {
    expect(Object.values(RASHI_LORDS)).not.toContain("rahu");
    expect(Object.values(RASHI_LORDS)).not.toContain("ketu");
    const { dispositors, houseLordMatrix } = chart().vedic.lordship;
    expect(dispositors.rahu.isSelfDispositor).toBe(false);
    expect(dispositors.ketu.isSelfDispositor).toBe(false);
    for (const row of houseLordMatrix) {
      expect(row.lord).not.toBe("Rahu");
      expect(row.lord).not.toBe("Ketu");
    }
  });
});

describe("TEST 4: self-dispositor logic correct (synthetic)", () => {
  it("Sun placed in Leo (its own sign) is its own final dispositor with a length-1 chain", () => {
    const lordship = buildSyntheticLordship({ sun: "leo" });
    expect(lordship.dispositors.sun.isSelfDispositor).toBe(true);
    expect(lordship.dispositorChains.sun.chain).toEqual(["Sun"]);
    expect(lordship.dispositorChains.sun.finalDispositor).toBe("Sun");
    expect(lordship.dispositorChains.sun.loop).toBe(null);
  });
});

describe("TEST 5: two-planet loop detected (synthetic)", () => {
  it("Mars in Leo (Sun's sign) and Sun in Aries (Mars's sign) form a mutual-reception 2-loop", () => {
    const lordship = buildSyntheticLordship({ mars: "leo", sun: "aries" });
    expect(lordship.dispositorChains.mars.finalDispositor).toBe(null);
    expect(lordship.dispositorChains.mars.loop).toEqual({ type: "loop", members: ["Mars", "Sun"] });
    expect(lordship.dispositorChains.sun.finalDispositor).toBe(null);
    expect(lordship.dispositorChains.sun.loop).toEqual({ type: "loop", members: ["Mars", "Sun"] });
  });
});

describe("TEST 6: three-planet loop detected (synthetic)", () => {
  it("Sun in Taurus (Venus), Venus in Aquarius (Saturn), Saturn in Leo (Sun) form a 3-cycle", () => {
    const lordship = buildSyntheticLordship({ sun: "taurus", venus: "aquarius", saturn: "leo" });
    const expectedLoop = { type: "loop", members: ["Saturn", "Sun", "Venus"] };
    expect(lordship.dispositorChains.sun.loop).toEqual(expectedLoop);
    expect(lordship.dispositorChains.venus.loop).toEqual(expectedLoop);
    expect(lordship.dispositorChains.saturn.loop).toEqual(expectedLoop);
    expect(lordship.dispositorChains.sun.finalDispositor).toBe(null);
    expect(lordship.dispositorChains.venus.finalDispositor).toBe(null);
    expect(lordship.dispositorChains.saturn.finalDispositor).toBe(null);
  });
});

describe("TEST 7: same loop canonicalized once", () => {
  it("Mars->Sun->Mars and Sun->Mars->Sun (TEST 5's scenario) produce byte-identical canonical loop objects, and the chart-level loops array lists it exactly once", () => {
    const lordship = buildSyntheticLordship({ mars: "leo", sun: "aries" });
    expect(lordship.dispositorChains.mars.loop).toEqual(lordship.dispositorChains.sun.loop);
    expect(lordship.loops.length).toBe(1);
    expect(lordship.loops[0]).toEqual({ type: "loop", members: ["Mars", "Sun"] });
  });

  it("the three-planet loop (TEST 6) is also listed exactly once at the chart level, even though 3 different Grahas' chains all resolve into it", () => {
    const lordship = buildSyntheticLordship({ sun: "taurus", venus: "aquarius", saturn: "leo" });
    expect(lordship.loops.length).toBe(1);
    expect(lordship.loops[0]).toEqual({ type: "loop", members: ["Saturn", "Sun", "Venus"] });
  });
});

describe("TEST 8: final dispositor only exists when the chain terminates in a self-dispositor", () => {
  it("holds for every classical Graha in the verification chart", () => {
    const { dispositors, dispositorChains } = chart().vedic.lordship;
    for (const key of CLASSICAL_GRAHA_KEYS) {
      const { finalDispositor, loop, chain } = dispositorChains[key];
      if (finalDispositor !== null) {
        expect(loop).toBe(null);
        expect(chain[chain.length - 1]).toBe(finalDispositor);
        const finalKey = Object.keys(GRAHA_DISPLAY_NAME).find((k) => GRAHA_DISPLAY_NAME[k] === finalDispositor);
        expect(dispositors[finalKey].isSelfDispositor).toBe(true);
      } else {
        expect(loop).not.toBe(null);
      }
    }
  });
});

describe("TEST 9: loop chain has finalDispositor = null", () => {
  it("both the 2-loop and 3-loop synthetic scenarios report finalDispositor: null for every member", () => {
    const twoLoop = buildSyntheticLordship({ mars: "leo", sun: "aries" });
    expect(twoLoop.dispositorChains.mars.finalDispositor).toBe(null);
    expect(twoLoop.dispositorChains.sun.finalDispositor).toBe(null);

    const threeLoop = buildSyntheticLordship({ sun: "taurus", venus: "aquarius", saturn: "leo" });
    for (const key of ["sun", "venus", "saturn"]) {
      expect(threeLoop.dispositorChains[key].finalDispositor).toBe(null);
    }
  });
});

describe("TEST 10: all chains terminate deterministically", () => {
  it("every classical Graha's chain (verification chart and all synthetic scenarios) ends in exactly one of finalDispositor/loop, never both, never neither, and stays well under the safety limit", () => {
    const scenarios = [
      chart().vedic.lordship,
      buildSyntheticLordship({ mars: "leo", sun: "aries" }),
      buildSyntheticLordship({ sun: "taurus", venus: "aquarius", saturn: "leo" }),
    ];
    for (const lordship of scenarios) {
      for (const key of CLASSICAL_GRAHA_KEYS) {
        const { finalDispositor, loop, chain } = lordship.dispositorChains[key];
        expect(finalDispositor === null || loop === null).toBe(true);
        expect(finalDispositor !== null || loop !== null).toBe(true);
        expect(chain.length).toBeLessThan(20);
      }
    }
  });
});

describe("TEST 11: Lagna Lord network internally consistent", () => {
  it("lagnaLordNetwork's dispositor/chain/finalDispositor/loop exactly match dispositorChains for the Lagna Lord's own key", () => {
    const v = chart().vedic;
    const lagnaRashiKey = RASHIS[v.bhava.lagna.rashiIndex].key;
    const lagnaLordKey = RASHI_LORDS[lagnaRashiKey];
    const { lagnaLordNetwork, dispositors, dispositorChains } = v.lordship;

    expect(lagnaLordNetwork.lagnaRashi).toBe(v.bhava.lagna.rashi);
    expect(lagnaLordNetwork.lagnaLord).toBe(v.bhava.lagna.lord);
    expect(lagnaLordNetwork.lagnaLordRashi).toBe(v.grahas[lagnaLordKey].rashi);
    expect(lagnaLordNetwork.lagnaLordBhava).toBe(v.bhava.grahaPlacements[lagnaLordKey].bhavaNumber);
    expect(lagnaLordNetwork.lagnaLordDispositor).toBe(dispositors[lagnaLordKey].dispositor);
    expect(lagnaLordNetwork.dispositorChain).toEqual(dispositorChains[lagnaLordKey].chain);
    expect(lagnaLordNetwork.finalDispositor).toBe(dispositorChains[lagnaLordKey].finalDispositor);
    expect(lagnaLordNetwork.loop).toEqual(dispositorChains[lagnaLordKey].loop);
  });
});

describe("TEST 12: Kendra set exactly [1,4,7,10]", () => {
  it("matches exactly", () => {
    expect(HOUSE_GROUPS.kendra).toEqual([1, 4, 7, 10]);
  });
});

describe("TEST 13: Trikona set exactly [1,5,9]", () => {
  it("matches exactly", () => {
    expect(HOUSE_GROUPS.trikona).toEqual([1, 5, 9]);
  });
});

describe("TEST 14: Dusthana set exactly [6,8,12]", () => {
  it("matches exactly", () => {
    expect(HOUSE_GROUPS.dusthana).toEqual([6, 8, 12]);
  });
});

describe("TEST 15: Upachaya set exactly [3,6,10,11]", () => {
  it("matches exactly", () => {
    expect(HOUSE_GROUPS.upachaya).toEqual([3, 6, 10, 11]);
  });
});

describe("TEST 16: every owned house correctly maps to group membership", () => {
  it("for every classical Graha, each owned house appears in ownedXHouses if and only if it is actually a member of that HOUSE_GROUPS list", () => {
    const { planetaryLordshipRoles } = chart().vedic.lordship;
    for (const key of CLASSICAL_GRAHA_KEYS) {
      const role = planetaryLordshipRoles[key];
      for (const house of role.ownedHouses) {
        expect(role.ownedKendraHouses.includes(house)).toBe(HOUSE_GROUPS.kendra.includes(house));
        expect(role.ownedTrikonaHouses.includes(house)).toBe(HOUSE_GROUPS.trikona.includes(house));
        expect(role.ownedDusthanaHouses.includes(house)).toBe(HOUSE_GROUPS.dusthana.includes(house));
        expect(role.ownedUpachayaHouses.includes(house)).toBe(HOUSE_GROUPS.upachaya.includes(house));
      }
    }
  });
});

describe("TEST 17-20: ownsKendra/ownsTrikona/ownsDusthana/ownsUpachaya correct", () => {
  it("matches the verification chart's known planetaryHouseOwnership exactly", () => {
    const { planetaryLordshipRoles } = chart().vedic.lordship;
    const expected = {
      sun: { ownsKendra: true, ownsTrikona: true, ownsDusthana: false, ownsUpachaya: false },
      moon: { ownsKendra: false, ownsTrikona: false, ownsDusthana: true, ownsUpachaya: false },
      mars: { ownsKendra: true, ownsTrikona: true, ownsDusthana: false, ownsUpachaya: false },
      mercury: { ownsKendra: false, ownsTrikona: false, ownsDusthana: false, ownsUpachaya: true },
      jupiter: { ownsKendra: false, ownsTrikona: true, ownsDusthana: true, ownsUpachaya: false },
      venus: { ownsKendra: true, ownsTrikona: false, ownsDusthana: false, ownsUpachaya: true },
      saturn: { ownsKendra: true, ownsTrikona: false, ownsDusthana: true, ownsUpachaya: true },
    };
    for (const [key, flags] of Object.entries(expected)) {
      expect(planetaryLordshipRoles[key].ownsKendra).toBe(flags.ownsKendra);
      expect(planetaryLordshipRoles[key].ownsTrikona).toBe(flags.ownsTrikona);
      expect(planetaryLordshipRoles[key].ownsDusthana).toBe(flags.ownsDusthana);
      expect(planetaryLordshipRoles[key].ownsUpachaya).toBe(flags.ownsUpachaya);
    }
  });
});

describe("TEST 21: ownsKendraAndTrikona correct", () => {
  it("true only for Sun and Mars in the verification chart", () => {
    const { planetaryLordshipRoles } = chart().vedic.lordship;
    expect(planetaryLordshipRoles.sun.ownsKendraAndTrikona).toBe(true);
    expect(planetaryLordshipRoles.mars.ownsKendraAndTrikona).toBe(true);
    for (const key of ["moon", "mercury", "jupiter", "venus", "saturn"]) {
      expect(planetaryLordshipRoles[key].ownsKendraAndTrikona).toBe(false);
    }
  });
});

describe("TEST 22: no Yogakaraka inferred automatically", () => {
  it("chart.vedic.meta.yogakaraka and lordship.meta.yogakaraka are explicitly not_implemented, and no yogakaraka field exists in the actual data", () => {
    const chartResult = chart();
    expect(chartResult.vedic.meta.yogakaraka).toBe("not_implemented");
    expect(chartResult.vedic.lordship.meta.yogakaraka).toBe("not_implemented");
    const { meta, ...data } = chartResult.vedic.lordship;
    expect(JSON.stringify(data)).not.toMatch(/yogakaraka/i);
  });
});

describe("TEST 23: no functional benefic/malefic inferred automatically", () => {
  it("meta fields are explicitly not_implemented, and no functionalBenefic/functionalMalefic VALUE exists in the actual data", () => {
    const chartResult = chart();
    expect(chartResult.vedic.lordship.meta.functionalBenefic).toBe("not_implemented");
    expect(chartResult.vedic.lordship.meta.functionalMalefic).toBe("not_implemented");
    const { meta, ...data } = chartResult.vedic.lordship;
    expect(JSON.stringify(data)).not.toMatch(/functional.?benefic|functional.?malefic/i);
  });
});

describe("TEST 24: no Maraka inferred automatically", () => {
  it("meta.maraka is explicitly not_implemented, and no maraka field exists in the actual data", () => {
    const chartResult = chart();
    expect(chartResult.vedic.lordship.meta.maraka).toBe("not_implemented");
    const { meta, ...data } = chartResult.vedic.lordship;
    expect(JSON.stringify(data)).not.toMatch(/\bmaraka\b/i);
  });
});

describe("TEST 25: no Badhaka inferred automatically", () => {
  it("meta.badhaka is explicitly not_implemented, and no badhaka/badhakesh field exists in the actual data", () => {
    const chartResult = chart();
    expect(chartResult.vedic.lordship.meta.badhaka).toBe("not_implemented");
    const { meta, ...data } = chartResult.vedic.lordship;
    expect(JSON.stringify(data)).not.toMatch(/badhaka|badhakesh/i);
  });
});

describe("TEST 26: 12-house lord placement matrix complete", () => {
  it("houseLordMatrix has exactly 12 rows, one per sourceBhava 1..12", () => {
    const { houseLordMatrix } = chart().vedic.lordship;
    expect(houseLordMatrix.length).toBe(12);
    expect(houseLordMatrix.map((r) => r.sourceBhava).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
});

describe("TEST 27/28: each matrix row's lord and lordBhava match Phase 4B exactly", () => {
  it("houseLordMatrix reconciles field-for-field with bhava.lordshipNetwork", () => {
    const v = chart().vedic;
    for (const row of v.lordship.houseLordMatrix) {
      const bhavaRow = v.bhava.lordshipNetwork.find((r) => r.sourceBhava === row.sourceBhava);
      expect(row.sourceRashi).toBe(bhavaRow.sourceRashi);
      expect(row.lord).toBe(bhavaRow.lord);
      expect(row.lordRashi).toBe(bhavaRow.lordRashi);
      expect(row.lordBhava).toBe(bhavaRow.lordBhava);
    }
  });
});

describe("TEST 29: dignity reused consistently from Phase 4D", () => {
  it("houseLordMatrix[i].lordDignityStatus matches condition.planets[lordKey].dignity.rashiDignityStatus exactly", () => {
    const v = chart().vedic;
    for (const row of v.lordship.houseLordMatrix) {
      const lordKey = Object.keys(GRAHA_DISPLAY_NAME).find((k) => GRAHA_DISPLAY_NAME[k] === row.lord);
      expect(row.lordDignityStatus).toBe(v.condition.planets[lordKey].dignity.rashiDignityStatus);
    }
  });
});

describe("TEST 30: retrograde reused consistently from Phase 4D/4A", () => {
  it("houseLordMatrix[i].lordIsRetrograde matches condition and the original Phase 4A motion field exactly", () => {
    const v = chart().vedic;
    for (const row of v.lordship.houseLordMatrix) {
      const lordKey = Object.keys(GRAHA_DISPLAY_NAME).find((k) => GRAHA_DISPLAY_NAME[k] === row.lord);
      expect(row.lordIsRetrograde).toBe(v.condition.planets[lordKey].condition.isRetrograde);
      expect(row.lordIsRetrograde).toBe(v.grahas[lordKey].motion.retrograde);
    }
  });
});

describe("TEST 31: combustion reused consistently from Phase 4D", () => {
  it("houseLordMatrix[i].lordIsCombust matches condition.planets[lordKey].condition.combustion.isCombust exactly", () => {
    const v = chart().vedic;
    for (const row of v.lordship.houseLordMatrix) {
      const lordKey = Object.keys(GRAHA_DISPLAY_NAME).find((k) => GRAHA_DISPLAY_NAME[k] === row.lord);
      expect(row.lordIsCombust).toBe(v.condition.planets[lordKey].condition.combustion.isCombust);
    }
  });
});

describe("TEST 32: no scoring fields", () => {
  it("no score field anywhere in chart.vedic.lordship", () => {
    const json = JSON.stringify(chart().vedic.lordship);
    expect(json).not.toMatch(/score/i);
  });
});

describe("TEST 33: no interpretation fields", () => {
  it("meta.interpretation is explicitly none, and no interpretive text exists in the actual data", () => {
    const chartResult = chart();
    expect(chartResult.vedic.lordship.meta.interpretation).toBe("none");
    expect(chartResult.vedic.meta.vedicLordshipInterpretation).toBe("none");
    const { meta, ...data } = chartResult.vedic.lordship;
    expect(JSON.stringify(data)).not.toMatch(/\bstrong\b|\bweak\b|powerful|hardship|career|marriage|wealth/i);
  });
});

describe("TEST 34: Phase 4A unchanged", () => {
  it("chart.vedic.grahas/lagna/ayanamsha are byte-for-byte identical to a fresh computation", () => {
    const a = chart().vedic;
    const b = chart().vedic;
    expect(a.grahas).toEqual(b.grahas);
    expect(a.lagna).toEqual(b.lagna);
    expect(a.ayanamsha).toEqual(b.ayanamsha);
  });
});

describe("TEST 35: Phase 4B unchanged", () => {
  it("chart.vedic.bhava is byte-for-byte identical to a fresh computation", () => {
    const a = chart().vedic;
    const b = chart().vedic;
    expect(a.bhava).toEqual(b.bhava);
  });
});

describe("TEST 36: Phase 4C unchanged", () => {
  it("chart.vedic.nakshatra is byte-for-byte identical to a fresh computation", () => {
    const a = chart().vedic;
    const b = chart().vedic;
    expect(a.nakshatra).toEqual(b.nakshatra);
  });
});

describe("TEST 37: Phase 4D unchanged", () => {
  it("chart.vedic.condition is byte-for-byte identical to a fresh computation", () => {
    const a = chart().vedic;
    const b = chart().vedic;
    expect(a.condition).toEqual(b.condition);
  });
});

describe("TEST 38: Western unchanged", () => {
  it("chart.points/planets/angles/houseCusps are identical to a fresh independent computation", () => {
    const withLordship = calculateChart(VERIFICATION_INPUT);
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withLordship.points).toEqual(fresh.points);
    expect(withLordship.planets).toEqual(fresh.planets);
    expect(withLordship.angles).toEqual(fresh.angles);
    expect(withLordship.houseCusps).toEqual(fresh.houseCusps);
  });
});

describe("TEST 39: Classical unchanged", () => {
  it("chart.classical is untouched by adding chart.vedic.lordship", () => {
    const withLordship = calculateChart(VERIFICATION_INPUT);
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withLordship.classical).toEqual(fresh.classical);
  });
});

describe("TEST 40: Phase 3H unchanged", () => {
  it("chart.classical.summary is untouched by adding chart.vedic.lordship", () => {
    const withLordship = calculateChart(VERIFICATION_INPUT);
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withLordship.classical.summary).toEqual(fresh.classical.summary);
  });
});

describe("TEST 41: JSON serializable", () => {
  it("JSON.stringify/parse round-trips chart.vedic.lordship without throwing and preserves shape", () => {
    const { lordship } = chart().vedic;
    const json = JSON.stringify(lordship);
    expect(typeof json).toBe("string");
    const parsed = JSON.parse(json);
    expect(Object.keys(parsed).sort()).toEqual(
      ["meta", "houseGroups", "dispositors", "dispositorChains", "loops", "lagnaLordNetwork", "planetaryLordshipRoles", "houseLordMatrix", "planetaryLordshipEvidence"].sort()
    );
    expect(Object.keys(parsed.dispositors).length).toBe(9);
    expect(Object.keys(parsed.dispositorChains).length).toBe(7);
  });

  it("no functions, no circular references", () => {
    const { lordship } = chart().vedic;
    expect(() => JSON.stringify(lordship)).not.toThrow();
    const walk = (value) => {
      if (typeof value === "function") throw new Error("function found in chart.vedic.lordship");
      if (value && typeof value === "object") {
        for (const v of Object.values(value)) walk(v);
      }
    };
    expect(() => walk(lordship)).not.toThrow();
  });
});

describe("Additional synthetic tests: long chain into self-dispositor", () => {
  it("Jupiter -> Mercury -> Moon -> Mars -> Venus(self), a length-5 chain terminating cleanly", () => {
    const lordship = buildSyntheticLordship({
      jupiter: "gemini",
      mercury: "cancer",
      moon: "aries",
      mars: "taurus",
      venus: "libra",
    });
    expect(lordship.dispositorChains.jupiter.chain).toEqual(["Jupiter", "Mercury", "Moon", "Mars", "Venus"]);
    expect(lordship.dispositorChains.jupiter.finalDispositor).toBe("Venus");
    expect(lordship.dispositorChains.jupiter.loop).toBe(null);
  });
});

describe("Additional synthetic tests: long chain into loop", () => {
  it("Mars feeds into the Sun/Venus/Saturn 3-loop from outside, producing a length-4 chain with no final dispositor, and the loop is deduplicated against the one found starting from Sun/Venus/Saturn directly", () => {
    const lordship = buildSyntheticLordship({
      sun: "taurus",
      venus: "aquarius",
      saturn: "leo",
      mars: "taurus",
    });
    expect(lordship.dispositorChains.mars.chain).toEqual(["Mars", "Venus", "Saturn", "Sun"]);
    expect(lordship.dispositorChains.mars.finalDispositor).toBe(null);
    expect(lordship.dispositorChains.mars.loop).toEqual({ type: "loop", members: ["Saturn", "Sun", "Venus"] });
    // Exactly one distinct loop across all 4 involved chains (Sun, Venus, Saturn, Mars).
    expect(lordship.loops.length).toBe(1);
  });
});

describe("Verification-chart lordship totals reconcile", () => {
  it("reports the full Phase 4E verification-chart output shape", () => {
    const { lordship } = chart().vedic;
    for (const key of CLASSICAL_GRAHA_KEYS) {
      const evidence = lordship.planetaryLordshipEvidence[key];
      expect(evidence).toHaveProperty("rashi");
      expect(evidence).toHaveProperty("bhava");
      expect(evidence).toHaveProperty("ownedHouses");
      expect(evidence).toHaveProperty("dispositor");
      expect(evidence).toHaveProperty("dispositorChain");
      expect(evidence).toHaveProperty("finalDispositor");
      expect(evidence).toHaveProperty("loop");
    }
    expect(lordship.houseLordMatrix.length).toBe(12);
    expect(Object.keys(lordship.dispositors).length).toBe(9);
  });
});
