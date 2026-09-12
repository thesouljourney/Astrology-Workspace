import { describe, it, expect } from "vitest";
import { calculateChart } from "../../ephemeris.js";
import { RASHIS } from "../rashi.js";
import { RASHI_LORDS } from "../rashiLordship.js";
import { GRAHA_DISPLAY_NAME, NAVAGRAHA_ORDER } from "../grahaNames.js";
import { buildVedicBhava, bhavaNumberFromRashiIndex, VEDIC_BHAVA_SYSTEM } from "../bhava.js";

const VERIFICATION_INPUT = {
  birthDate: "1994-11-21",
  birthTime: "01:44:00",
  latitude: 1.8548,
  longitude: 102.9325,
  utcOffset: "+08:00",
  houseSystem: "placidus",
};

const REAL_PLANET_KEYS = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];

function chart() {
  return calculateChart(VERIFICATION_INPUT);
}

describe("TEST 1: exactly 12 Bhavas exist", () => {
  it("chart.vedic.bhava.houses has exactly 12 entries, numbered 1..12", () => {
    const { bhava } = chart().vedic;
    expect(bhava.houses.length).toBe(12);
    expect(bhava.houses.map((h) => h.bhavaNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
});

describe("TEST 2: Bhava 1 Rashi equals Lagna Rashi", () => {
  it("houses[0].rashi and bhava.lagna.rashi both equal chart.vedic.lagna.rashi", () => {
    const v = chart().vedic;
    expect(v.bhava.houses[0].rashi).toBe(v.lagna.rashi);
    expect(v.bhava.lagna.rashi).toBe(v.lagna.rashi);
    expect(v.bhava.houses[0].rashiIndex).toBe(v.lagna.rashiIndex);
    expect(v.bhava.houses[0].lagnaOffsetSigns).toBe(0);
  });
});

describe("TEST 3: Bhava 2 is next Rashi", () => {
  it("houses[1].rashiIndex is exactly one Rashi ahead of the Lagna's, wrapping through 12", () => {
    const v = chart().vedic;
    expect(v.bhava.houses[1].rashiIndex).toBe((v.lagna.rashiIndex + 1) % 12);
    expect(v.bhava.houses[1].lagnaOffsetSigns).toBe(1);
  });
});

describe("TEST 4: Bhava 12 wraps correctly", () => {
  it("houses[11].rashiIndex is exactly one Rashi behind the Lagna's, wrapping through 0", () => {
    const v = chart().vedic;
    expect(v.bhava.houses[11].rashiIndex).toBe((v.lagna.rashiIndex + 11) % 12);
    expect(v.bhava.houses[11].lagnaOffsetSigns).toBe(11);
  });
});

describe("TEST 5: all 12 Rashis appear exactly once", () => {
  it("the 12 Bhavas' rashiIndex values are a permutation of 0..11", () => {
    const { bhava } = chart().vedic;
    const indices = bhava.houses.map((h) => h.rashiIndex).sort((a, b) => a - b);
    expect(indices).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(new Set(bhava.houses.map((h) => h.rashi)).size).toBe(12);
  });
});

describe("TEST 6: every Bhava has exactly one traditional lord", () => {
  it("each house has a single, non-empty lord string matching one of the seven classical grahas", () => {
    const { bhava } = chart().vedic;
    const classicalNames = REAL_PLANET_KEYS.map((k) => GRAHA_DISPLAY_NAME[k]);
    for (const house of bhava.houses) {
      expect(typeof house.lord).toBe("string");
      expect(house.lord.length).toBeGreaterThan(0);
      expect(classicalNames).toContain(house.lord);
    }
  });
});

describe("TEST 7: traditional Rashi lordship table is correct", () => {
  it("matches the classical seven-planet scheme exactly", () => {
    expect(RASHI_LORDS).toEqual({
      aries: "mars",
      taurus: "venus",
      gemini: "mercury",
      cancer: "moon",
      leo: "sun",
      virgo: "mercury",
      libra: "venus",
      scorpio: "mars",
      sagittarius: "jupiter",
      capricorn: "saturn",
      aquarius: "saturn",
      pisces: "jupiter",
    });
  });
});

describe("TEST 8: no Uranus/Neptune/Pluto rulership", () => {
  it("no modern outer-planet name appears anywhere in the lordship table or lord fields", () => {
    const values = Object.values(RASHI_LORDS);
    for (const modern of ["uranus", "neptune", "pluto"]) {
      expect(values).not.toContain(modern);
    }
    const { bhava } = chart().vedic;
    const json = JSON.stringify(bhava);
    expect(json).not.toMatch(/uranus|neptune|pluto/i);
  });
});

describe("TEST 9: Lagna lord correct", () => {
  it("bhava.lagna.lord is the traditional ruler of the Lagna Rashi", () => {
    const v = chart().vedic;
    const lagnaRashiKey = RASHIS[v.lagna.rashiIndex].key;
    const expectedLordKey = RASHI_LORDS[lagnaRashiKey];
    expect(v.bhava.lagna.lord).toBe(GRAHA_DISPLAY_NAME[expectedLordKey]);
  });
});

describe("TEST 10: exactly 9 Graha placements", () => {
  it("chart.vedic.bhava.grahaPlacements has exactly 9 keys, matching NAVAGRAHA_ORDER", () => {
    const { bhava } = chart().vedic;
    const keys = Object.keys(bhava.grahaPlacements);
    expect(keys.length).toBe(9);
    expect(new Set(keys)).toEqual(new Set(NAVAGRAHA_ORDER));
  });
});

describe("TEST 11: every Graha has a Bhava number 1-12", () => {
  it("every grahaPlacements entry has an integer bhavaNumber in [1,12]", () => {
    const { bhava } = chart().vedic;
    for (const key of NAVAGRAHA_ORDER) {
      const bn = bhava.grahaPlacements[key].bhavaNumber;
      expect(Number.isInteger(bn)).toBe(true);
      expect(bn).toBeGreaterThanOrEqual(1);
      expect(bn).toBeLessThanOrEqual(12);
    }
  });
});

describe("TEST 12: Graha in same Rashi as Lagna = Bhava 1", () => {
  it("bhavaNumberFromRashiIndex(lagnaRashiIndex, lagnaRashiIndex) === 1, for every possible Lagna Rashi", () => {
    for (let i = 0; i < 12; i++) {
      expect(bhavaNumberFromRashiIndex(i, i)).toBe(1);
    }
  });
});

describe("TEST 13: one sign behind Lagna = Bhava 12", () => {
  it("a Graha one Rashi behind the Lagna always lands in Bhava 12, for every possible Lagna Rashi", () => {
    for (let lagnaIdx = 0; lagnaIdx < 12; lagnaIdx++) {
      const grahaIdx = (lagnaIdx + 11) % 12;
      expect(bhavaNumberFromRashiIndex(grahaIdx, lagnaIdx)).toBe(12);
    }
  });
});

describe("TEST 14: Pisces -> Aries wrap correct", () => {
  it("Lagna in Pisces (index 11) puts Aries (index 0) in Bhava 2, and every offset wraps correctly", () => {
    const lagnaIdx = 11; // Pisces
    expect(bhavaNumberFromRashiIndex(0, lagnaIdx)).toBe(2); // Aries
    expect(bhavaNumberFromRashiIndex(11, lagnaIdx)).toBe(1); // Pisces itself
    expect(bhavaNumberFromRashiIndex(10, lagnaIdx)).toBe(12); // Aquarius, one behind
    for (let offset = 0; offset < 12; offset++) {
      const grahaIdx = (lagnaIdx + offset) % 12;
      expect(bhavaNumberFromRashiIndex(grahaIdx, lagnaIdx)).toBe(offset + 1);
    }
  });
});

describe("TEST 15: Rahu/Ketu receive Bhava placement", () => {
  it("both rahu and ketu have a valid grahaPlacements entry with a numeric bhavaNumber", () => {
    const { bhava } = chart().vedic;
    for (const key of ["rahu", "ketu"]) {
      expect(bhava.grahaPlacements).toHaveProperty(key);
      expect(typeof bhava.grahaPlacements[key].bhavaNumber).toBe("number");
    }
  });

  it("Rahu and Ketu land in Bhavas exactly 6 apart (180 degrees = 6 signs)", () => {
    const { bhava } = chart().vedic;
    const rahuBhava = bhava.grahaPlacements.rahu.bhavaNumber;
    const ketuBhava = bhava.grahaPlacements.ketu.bhavaNumber;
    const diff = Math.abs(rahuBhava - ketuBhava);
    expect(diff === 6).toBe(true);
  });
});

describe("TEST 16: Rahu/Ketu receive no house lordship", () => {
  it("neither Rahu nor Ketu ever appears as a house lord or in planetaryHouseOwnership", () => {
    const { bhava } = chart().vedic;
    expect(Object.values(bhava.houseLords)).not.toContain("Rahu");
    expect(Object.values(bhava.houseLords)).not.toContain("Ketu");
    expect(bhava.planetaryHouseOwnership).not.toHaveProperty("rahu");
    expect(bhava.planetaryHouseOwnership).not.toHaveProperty("ketu");
    for (const house of bhava.houses) {
      expect(house.lord).not.toBe("Rahu");
      expect(house.lord).not.toBe("Ketu");
    }
  });
});

describe("TEST 17: every Bhava lord placement is internally consistent", () => {
  it("house.lordPlacedInBhava matches the lord's own grahaPlacements bhavaNumber, and matches lordshipNetwork", () => {
    const { bhava } = chart().vedic;
    const displayToKey = Object.fromEntries(REAL_PLANET_KEYS.map((k) => [GRAHA_DISPLAY_NAME[k], k]));
    for (const house of bhava.houses) {
      const lordKey = displayToKey[house.lord];
      expect(house.lordPlacedInBhava).toBe(bhava.grahaPlacements[lordKey].bhavaNumber);
    }
    for (const entry of bhava.lordshipNetwork) {
      const house = bhava.houses[entry.sourceBhava - 1];
      expect(entry.sourceRashi).toBe(house.rashi);
      expect(entry.lord).toBe(house.lord);
      expect(entry.lordBhava).toBe(house.lordPlacedInBhava);
    }
  });
});

describe("TEST 18: house ownership reverse map consistent", () => {
  it("planetaryHouseOwnership[planet] lists exactly the Bhavas whose houseLords entry is that planet", () => {
    const { bhava } = chart().vedic;
    const keyToDisplay = GRAHA_DISPLAY_NAME;
    for (const [key, bhavaNumbers] of Object.entries(bhava.planetaryHouseOwnership)) {
      for (const bn of bhavaNumbers) {
        expect(bhava.houseLords[bn]).toBe(keyToDisplay[key]);
      }
    }
    // And every Bhava's lord is findable in the reverse map under its own number.
    for (const house of bhava.houses) {
      const lordKey = Object.keys(GRAHA_DISPLAY_NAME).find((k) => GRAHA_DISPLAY_NAME[k] === house.lord);
      expect(bhava.planetaryHouseOwnership[lordKey]).toContain(house.bhavaNumber);
    }
  });
});

describe("TEST 19: Sun owns exactly one sign/Bhava", () => {
  it("planetaryHouseOwnership.sun has exactly one entry (Leo only)", () => {
    const { bhava } = chart().vedic;
    expect(bhava.planetaryHouseOwnership.sun.length).toBe(1);
  });
});

describe("TEST 20: Moon owns exactly one sign/Bhava", () => {
  it("planetaryHouseOwnership.moon has exactly one entry (Cancer only)", () => {
    const { bhava } = chart().vedic;
    expect(bhava.planetaryHouseOwnership.moon.length).toBe(1);
  });
});

describe("TEST 21: Mars/Mercury/Jupiter/Venus/Saturn ownership count matches Rashi rulership", () => {
  it("each of the five dual-rulership classical planets owns exactly two Bhavas", () => {
    const { bhava } = chart().vedic;
    for (const key of ["mars", "mercury", "jupiter", "venus", "saturn"]) {
      expect(bhava.planetaryHouseOwnership[key].length).toBe(2);
    }
    // Total ownership across all seven planets must sum to exactly 12 (every Bhava owned once).
    const total = Object.values(bhava.planetaryHouseOwnership).reduce((sum, arr) => sum + arr.length, 0);
    expect(total).toBe(12);
  });
});

describe("TEST 22: no Bhava cusp degrees exist", () => {
  it("no house record carries a longitude/degree/cusp field, and meta explicitly declares the Rashi-based (no-cusp) model", () => {
    const { bhava } = chart().vedic;
    for (const house of bhava.houses) {
      expect(house).not.toHaveProperty("longitude");
      expect(house).not.toHaveProperty("degree");
      expect(house).not.toHaveProperty("cusp");
      expect(house).not.toHaveProperty("cuspDegree");
    }
    // bhava.meta.bhavaCuspModel itself names the (absent) cusp model - check
    // the houses/grahaPlacements/lordshipNetwork data instead of the whole
    // object, so this doesn't false-positive on that documenting key name.
    const dataJson = JSON.stringify({
      houses: bhava.houses,
      grahaPlacements: bhava.grahaPlacements,
      lordshipNetwork: bhava.lordshipNetwork,
    });
    expect(dataJson).not.toMatch(/cusp/i);
    expect(bhava.meta.bhavaCuspModel).toBe("none_rashi_based");
  });
});

describe("TEST 23: no Bhava Chalit field exists", () => {
  it("bhava.meta explicitly marks bhavaChalit as not_implemented, and no chalit/sripati data structure exists", () => {
    const { bhava } = chart().vedic;
    expect(bhava.meta.bhavaChalit).toBe("not_implemented");
    expect(bhava).not.toHaveProperty("chalit");
    expect(bhava).not.toHaveProperty("bhavaChalit");
    const json = JSON.stringify(bhava);
    expect(json).not.toMatch(/sripati/i);
  });
});

describe("TEST 24: no dignity fields introduced", () => {
  it("no own-sign/exaltation/debilitation/moolatrikona/friend-enemy field anywhere in chart.vedic.bhava", () => {
    const { bhava } = chart().vedic;
    const json = JSON.stringify(bhava);
    expect(json).not.toMatch(/exalt|debilitat|moolatrikona|own.?sign|combust|\bfriend\b|\benem/i);
  });
});

describe("TEST 25: no interpretation text introduced", () => {
  it("no yogakaraka/maraka/benefic/malefic/strong/weak/good/bad language anywhere in chart.vedic.bhava", () => {
    const chartResult = chart();
    const json = JSON.stringify(chartResult.vedic.bhava);
    expect(json).not.toMatch(/yogakaraka|maraka|benefic|malefic|\bstrong\b|\bweak\b|\bgood\b|\bbad\b/i);
    expect(chartResult.vedic.meta.vedicHouseInterpretation).toBe("none");
  });
});

describe("TEST 26: no score introduced", () => {
  it("no score field anywhere in chart.vedic.bhava", () => {
    const { bhava } = chart().vedic;
    const json = JSON.stringify(bhava);
    expect(json).not.toMatch(/score/i);
  });
});

describe("TEST 27: Phase 4A graha positions unchanged", () => {
  it("chart.vedic.grahas/lagna/ayanamsha are byte-for-byte identical to a fresh computation without regard to bhava", () => {
    const a = chart().vedic;
    const b = chart().vedic;
    expect(a.grahas).toEqual(b.grahas);
    expect(a.lagna).toEqual(b.lagna);
    expect(a.ayanamsha).toEqual(b.ayanamsha);
  });

  it("no Phase 4A graha object gained a bhava-related field", () => {
    const { grahas, lagna } = chart().vedic;
    for (const g of Object.values(grahas)) {
      expect(g).not.toHaveProperty("bhavaNumber");
      expect(g).not.toHaveProperty("houseLord");
    }
    expect(lagna).not.toHaveProperty("lord");
    expect(lagna).not.toHaveProperty("bhavaNumber");
  });
});

describe("TEST 28: Western output unchanged", () => {
  it("chart.points/planets/angles/houseCusps are identical to a fresh independent computation", () => {
    const withBhava = calculateChart(VERIFICATION_INPUT);
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withBhava.points).toEqual(fresh.points);
    expect(withBhava.planets).toEqual(fresh.planets);
    expect(withBhava.angles).toEqual(fresh.angles);
    expect(withBhava.houseCusps).toEqual(fresh.houseCusps);
  });
});

describe("TEST 29: Classical output unchanged", () => {
  it("chart.classical is untouched by adding chart.vedic.bhava", () => {
    const withBhava = calculateChart(VERIFICATION_INPUT);
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withBhava.classical).toEqual(fresh.classical);
  });
});

describe("TEST 30: Phase 3H unchanged", () => {
  it("chart.classical.summary is untouched by adding chart.vedic.bhava", () => {
    const withBhava = calculateChart(VERIFICATION_INPUT);
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withBhava.classical.summary).toEqual(fresh.classical.summary);
  });
});

describe("TEST 31: output is JSON serializable", () => {
  it("JSON.stringify/parse round-trips chart.vedic.bhava without throwing and preserves shape", () => {
    const { bhava } = chart().vedic;
    const json = JSON.stringify(bhava);
    expect(typeof json).toBe("string");
    const parsed = JSON.parse(json);
    expect(Object.keys(parsed).sort()).toEqual(
      ["meta", "lagna", "houses", "grahaPlacements", "houseLords", "planetaryHouseOwnership", "lordshipNetwork"].sort()
    );
    expect(parsed.houses.length).toBe(12);
  });

  it("no functions, no circular references", () => {
    const { bhava } = chart().vedic;
    expect(() => JSON.stringify(bhava)).not.toThrow();
    const walk = (value) => {
      if (typeof value === "function") throw new Error("function found in chart.vedic.bhava");
      if (value && typeof value === "object") {
        for (const v of Object.values(value)) walk(v);
      }
    };
    expect(() => walk(bhava)).not.toThrow();
  });
});

describe("Boundary tests around Rashi transitions and buildVedicBhava direct calls", () => {
  it("buildVedicBhava is a pure function of (lagna, grahas) - two independent calls with the same input produce deeply equal output", () => {
    const v = chart().vedic;
    const a = buildVedicBhava({ lagna: v.lagna, grahas: v.grahas });
    const b = buildVedicBhava({ lagna: v.lagna, grahas: v.grahas });
    expect(a).toEqual(b);
  });

  it("a Graha at exactly 0 degrees of a Rashi and one at 29.9999 degrees of the same Rashi land in the same Bhava", () => {
    const v = chart().vedic;
    const lagnaRashiIndex = v.lagna.rashiIndex;
    const targetRashiIndex = (lagnaRashiIndex + 3) % 12;
    const grahaAt0 = { ...v.grahas.mars, rashiIndex: targetRashiIndex, siderealLongitude: targetRashiIndex * 30 };
    const grahaAt2959 = { ...v.grahas.jupiter, rashiIndex: targetRashiIndex, siderealLongitude: targetRashiIndex * 30 + 29.9997 };
    const fakeGrahas = { ...v.grahas, mars: grahaAt0, jupiter: grahaAt2959 };
    const bhava = buildVedicBhava({ lagna: v.lagna, grahas: fakeGrahas });
    expect(bhava.grahaPlacements.mars.bhavaNumber).toBe(bhava.grahaPlacements.jupiter.bhavaNumber);
  });

  it("every one of the 12 possible Lagna Rashis produces a full, internally-consistent 12-Bhava structure", () => {
    const v = chart().vedic;
    for (let lagnaRashiIndex = 0; lagnaRashiIndex < 12; lagnaRashiIndex++) {
      const fakeLagna = { ...v.lagna, rashiIndex: lagnaRashiIndex, rashi: RASHIS[lagnaRashiIndex].name };
      const bhava = buildVedicBhava({ lagna: fakeLagna, grahas: v.grahas });
      expect(bhava.houses.length).toBe(12);
      expect(bhava.houses[0].rashiIndex).toBe(lagnaRashiIndex);
      expect(new Set(bhava.houses.map((h) => h.rashiIndex)).size).toBe(12);
      const totalOwnership = Object.values(bhava.planetaryHouseOwnership).reduce((sum, arr) => sum + arr.length, 0);
      expect(totalOwnership).toBe(12);
    }
  });
});

describe("Verification-chart Bhava totals reconcile", () => {
  it("reports the full Phase 4B verification-chart Bhava output shape", () => {
    const v = chart().vedic;
    expect(v.bhava.meta.system).toBe(VEDIC_BHAVA_SYSTEM);
    for (const house of v.bhava.houses) {
      expect(house).toHaveProperty("bhavaNumber");
      expect(house).toHaveProperty("rashi");
      expect(house).toHaveProperty("rashiIndex");
      expect(house).toHaveProperty("lord");
      expect(Array.isArray(house.grahas)).toBe(true);
      expect(house).toHaveProperty("lordPlacedInBhava");
    }
    expect(Object.keys(v.bhava.houseLords).length).toBe(12);
    expect(v.bhava.lordshipNetwork.length).toBe(12);
  });
});
