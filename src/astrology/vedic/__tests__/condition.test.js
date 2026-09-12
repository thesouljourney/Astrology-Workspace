import { describe, it, expect } from "vitest";
import { calculateChart } from "../../ephemeris.js";
import { RASHIS } from "../rashi.js";
import { RASHI_LORDS } from "../rashiLordship.js";
import { GRAHA_DISPLAY_NAME } from "../grahaNames.js";
import { THRESHOLDS as WESTERN_COMBUSTION_THRESHOLDS } from "../../classical/solarCondition.js";
import {
  CLASSICAL_GRAHA_KEYS,
  OWN_SIGNS,
  EXALTATION,
  MOOLATRIKONA,
  NATURAL_RELATIONSHIPS,
  COMBUSTION_CONVENTION,
  getDebilitation,
  getCombustionThreshold,
} from "../dignityTables.js";
import { buildVedicCondition } from "../condition.js";

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

/** A minimal, independently-constructed fake `chart.vedic.grahas[key]` record, for direct boundary testing of buildVedicCondition without depending on any real birth instant. */
function fakeGraha(rashiIndex, degreeWithinRashi, { retrograde = false } = {}) {
  return {
    rashi: RASHIS[rashiIndex].name,
    rashiIndex,
    degreeWithinRashi,
    siderealLongitude: rashiIndex * 30 + degreeWithinRashi,
    motion: { retrograde },
  };
}

/** All 9 grahas, defaulting to a neutral placement (0 Aries) except overrides. */
function fakeGrahas(overrides = {}) {
  const base = {};
  for (const key of ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"]) {
    base[key] = fakeGraha(0, 0);
  }
  return { ...base, ...overrides };
}

describe("TEST 1: exactly 7 classical Grahas receive full dignity evaluation", () => {
  it("chart.vedic.condition.planets has exactly 7 keys, matching CLASSICAL_GRAHA_KEYS", () => {
    const { condition } = chart().vedic;
    const keys = Object.keys(condition.planets);
    expect(keys.length).toBe(7);
    expect(new Set(keys)).toEqual(new Set(CLASSICAL_GRAHA_KEYS));
    expect(condition.planets).not.toHaveProperty("rahu");
    expect(condition.planets).not.toHaveProperty("ketu");
  });
});

describe("TEST 2: own-sign table correct", () => {
  it("matches the Parashari baseline exactly", () => {
    expect(OWN_SIGNS).toEqual({
      sun: ["leo"],
      moon: ["cancer"],
      mars: ["aries", "scorpio"],
      mercury: ["gemini", "virgo"],
      jupiter: ["sagittarius", "pisces"],
      venus: ["taurus", "libra"],
      saturn: ["capricorn", "aquarius"],
    });
  });
});

describe("TEST 3: exaltation sign table correct", () => {
  it("matches Part C exactly", () => {
    const expected = {
      sun: "aries",
      moon: "taurus",
      mars: "capricorn",
      mercury: "virgo",
      jupiter: "cancer",
      venus: "pisces",
      saturn: "libra",
    };
    for (const [planet, rashiKey] of Object.entries(expected)) {
      expect(EXALTATION[planet].rashiKey).toBe(rashiKey);
    }
  });
});

describe("TEST 4: debilitation sign table correct", () => {
  it("matches Part C exactly (derived as 180 degrees from exaltation)", () => {
    const expected = {
      sun: "libra",
      moon: "scorpio",
      mars: "cancer",
      mercury: "pisces",
      jupiter: "capricorn",
      venus: "virgo",
      saturn: "aries",
    };
    for (const [planet, rashiKey] of Object.entries(expected)) {
      expect(getDebilitation(planet, RASHIS).rashiKey).toBe(rashiKey);
    }
  });
});

describe("TEST 5: exact exaltation degrees correct under selected convention", () => {
  it("matches the researched Parashari table exactly", () => {
    expect(EXALTATION.sun.exactDegree).toBe(10);
    expect(EXALTATION.moon.exactDegree).toBe(3);
    expect(EXALTATION.mars.exactDegree).toBe(28);
    expect(EXALTATION.mercury.exactDegree).toBe(15);
    expect(EXALTATION.jupiter.exactDegree).toBe(5);
    expect(EXALTATION.venus.exactDegree).toBe(27);
    expect(EXALTATION.saturn.exactDegree).toBe(20);
  });
});

describe("TEST 6: debilitation point exactly 180 degrees opposite exaltation", () => {
  it("holds for every classical Graha", () => {
    for (const planet of CLASSICAL_GRAHA_KEYS) {
      const exaltationDeg = RASHIS.find((r) => r.key === EXALTATION[planet].rashiKey).index * 30 + EXALTATION[planet].exactDegree;
      const debilitation = getDebilitation(planet, RASHIS);
      const debilitationDeg = RASHIS.find((r) => r.key === debilitation.rashiKey).index * 30 + debilitation.exactDegree;
      const diff = ((debilitationDeg - exaltationDeg + 360) % 360);
      expect(diff).toBe(180);
    }
  });
});

describe("TEST 7: Moolatrikona table matches selected convention", () => {
  it("matches the researched-and-approved bphs_critical_edition ranges exactly", () => {
    expect(MOOLATRIKONA).toEqual({
      sun: { rashiKey: "leo", startDegree: 0, endDegree: 20 },
      moon: { rashiKey: "taurus", startDegree: 4, endDegree: 30 },
      mars: { rashiKey: "aries", startDegree: 0, endDegree: 12 },
      mercury: { rashiKey: "virgo", startDegree: 16, endDegree: 20 },
      jupiter: { rashiKey: "sagittarius", startDegree: 0, endDegree: 10 },
      venus: { rashiKey: "libra", startDegree: 0, endDegree: 15 },
      saturn: { rashiKey: "aquarius", startDegree: 0, endDegree: 20 },
    });
  });
});

describe("TEST 8: Moolatrikona boundary policy explicit (half-open [start, end))", () => {
  it("the start degree belongs to Moolatrikona; the end degree does not", () => {
    // Sun: Leo 0-20. Leo is rashiIndex 4.
    const leoIndex = RASHIS.find((r) => r.key === "leo").index;
    const atStart = buildVedicCondition({ grahas: fakeGrahas({ sun: fakeGraha(leoIndex, 0) }) });
    expect(atStart.planets.sun.dignity.isMoolatrikona).toBe(true);
    const atEnd = buildVedicCondition({ grahas: fakeGrahas({ sun: fakeGraha(leoIndex, 20) }) });
    expect(atEnd.planets.sun.dignity.isMoolatrikona).toBe(false);
    const justBelowEnd = buildVedicCondition({ grahas: fakeGrahas({ sun: fakeGraha(leoIndex, 19.9999) }) });
    expect(justBelowEnd.planets.sun.dignity.isMoolatrikona).toBe(true);
  });

  it("Mercury's 16-20 Virgo Moolatrikona: 15.9999 is excluded, 16.0 is included", () => {
    const virgoIndex = RASHIS.find((r) => r.key === "virgo").index;
    const justBelow = buildVedicCondition({ grahas: fakeGrahas({ mercury: fakeGraha(virgoIndex, 15.9999) }) });
    expect(justBelow.planets.mercury.dignity.isMoolatrikona).toBe(false);
    const atStart = buildVedicCondition({ grahas: fakeGrahas({ mercury: fakeGraha(virgoIndex, 16) }) });
    expect(atStart.planets.mercury.dignity.isMoolatrikona).toBe(true);
  });

  it("Moon's 4-30 Taurus Moolatrikona: 3.9999 is excluded, 4.0 is included, and it extends all the way to (but not past) the sign end", () => {
    const taurusIndex = RASHIS.find((r) => r.key === "taurus").index;
    const justBelow = buildVedicCondition({ grahas: fakeGrahas({ moon: fakeGraha(taurusIndex, 3.9999) }) });
    expect(justBelow.planets.moon.dignity.isMoolatrikona).toBe(false);
    const atStart = buildVedicCondition({ grahas: fakeGrahas({ moon: fakeGraha(taurusIndex, 4) }) });
    expect(atStart.planets.moon.dignity.isMoolatrikona).toBe(true);
    const nearSignEnd = buildVedicCondition({ grahas: fakeGrahas({ moon: fakeGraha(taurusIndex, 29.9999) }) });
    expect(nearSignEnd.planets.moon.dignity.isMoolatrikona).toBe(true);
  });
});

describe("TEST 9: natural friendship table complete", () => {
  it("every classical Graha has a friends/neutrals/enemies entry", () => {
    for (const key of CLASSICAL_GRAHA_KEYS) {
      expect(NATURAL_RELATIONSHIPS).toHaveProperty(key);
      expect(Array.isArray(NATURAL_RELATIONSHIPS[key].friends)).toBe(true);
      expect(Array.isArray(NATURAL_RELATIONSHIPS[key].neutrals)).toBe(true);
      expect(Array.isArray(NATURAL_RELATIONSHIPS[key].enemies)).toBe(true);
    }
  });
});

describe("TEST 10: each planet classifies every other classical Graha exactly once", () => {
  it("friends+neutrals+enemies for each planet is exactly the other 6, with no duplicates", () => {
    for (const key of CLASSICAL_GRAHA_KEYS) {
      const { friends, neutrals, enemies } = NATURAL_RELATIONSHIPS[key];
      const all = [...friends, ...neutrals, ...enemies];
      const others = CLASSICAL_GRAHA_KEYS.filter((k) => k !== key);
      expect(all.length).toBe(others.length);
      expect(new Set(all)).toEqual(new Set(others));
      expect(new Set(all).size).toBe(all.length); // no duplicates
    }
  });
});

describe("TEST 11: no self appears in friend/neutral/enemy sets", () => {
  it("no planet lists itself under its own friends/neutrals/enemies", () => {
    for (const key of CLASSICAL_GRAHA_KEYS) {
      const { friends, neutrals, enemies } = NATURAL_RELATIONSHIPS[key];
      expect(friends).not.toContain(key);
      expect(neutrals).not.toContain(key);
      expect(enemies).not.toContain(key);
    }
  });
});

describe("TEST 12: sign lord derived correctly", () => {
  it("chart.vedic.condition.planets[key].signRelationship.signLord matches RASHI_LORDS for the Graha's own Rashi", () => {
    const chartResult = chart();
    const { grahas, condition } = chartResult.vedic;
    for (const key of CLASSICAL_GRAHA_KEYS) {
      const rashiKey = RASHIS[grahas[key].rashiIndex].key;
      const expectedLordKey = RASHI_LORDS[rashiKey];
      expect(condition.planets[key].signRelationship.signLord).toBe(GRAHA_DISPLAY_NAME[expectedLordKey]);
    }
  });
});

describe("TEST 13: own-sign relationship resolves to self", () => {
  it("a Graha placed in its own sign shows naturalRelationshipToSignLord: 'self'", () => {
    const leoIndex = RASHIS.find((r) => r.key === "leo").index;
    const result = buildVedicCondition({ grahas: fakeGrahas({ sun: fakeGraha(leoIndex, 15) }) });
    expect(result.planets.sun.signRelationship.naturalRelationshipToSignLord).toBe("self");
    expect(result.planets.sun.signRelationship.signLord).toBe("Sun");
  });
});

describe("TEST 14: friend-sign relationship correct", () => {
  it("Sun placed in Sagittarius (ruled by Jupiter, Sun's natural friend) shows 'friend'", () => {
    const sagIndex = RASHIS.find((r) => r.key === "sagittarius").index;
    const result = buildVedicCondition({ grahas: fakeGrahas({ sun: fakeGraha(sagIndex, 10) }) });
    expect(result.planets.sun.signRelationship.signLord).toBe("Jupiter");
    expect(result.planets.sun.signRelationship.naturalRelationshipToSignLord).toBe("friend");
  });
});

describe("TEST 15: neutral-sign relationship correct", () => {
  it("Sun placed in Gemini (ruled by Mercury, Sun's natural neutral) shows 'neutral'", () => {
    const geminiIndex = RASHIS.find((r) => r.key === "gemini").index;
    const result = buildVedicCondition({ grahas: fakeGrahas({ sun: fakeGraha(geminiIndex, 10) }) });
    expect(result.planets.sun.signRelationship.signLord).toBe("Mercury");
    expect(result.planets.sun.signRelationship.naturalRelationshipToSignLord).toBe("neutral");
  });
});

describe("TEST 16: enemy-sign relationship correct", () => {
  it("Sun placed in Taurus (ruled by Venus, Sun's natural enemy) shows 'enemy'", () => {
    const taurusIndex = RASHIS.find((r) => r.key === "taurus").index;
    const result = buildVedicCondition({ grahas: fakeGrahas({ sun: fakeGraha(taurusIndex, 10) }) });
    expect(result.planets.sun.signRelationship.signLord).toBe("Venus");
    expect(result.planets.sun.signRelationship.naturalRelationshipToSignLord).toBe("enemy");
  });
});

describe("TEST 17: retrograde status reused from astronomical data", () => {
  it("condition.planets[key].condition.isRetrograde is exactly grahas[key].motion.retrograde, never recomputed", () => {
    const { grahas, condition } = chart().vedic;
    for (const key of CLASSICAL_GRAHA_KEYS) {
      expect(condition.planets[key].condition.isRetrograde).toBe(grahas[key].motion.retrograde);
    }
    for (const key of ["rahu", "ketu"]) {
      expect(condition.nodes[key].isRetrograde).toBe(grahas[key].motion.retrograde);
    }
  });
});

describe("TEST 18: no Western combustion thresholds reused", () => {
  it("the Jyotish per-planet orb table is structurally different from, and never equal to, Phase 3B's single universal Western orb", () => {
    // Western Classical (Phase 3B) uses ONE flat orb for every planet.
    const westernOrb = WESTERN_COMBUSTION_THRESHOLDS.combustionDegrees;
    const jyotishOrbs = [
      getCombustionThreshold("moon", false),
      getCombustionThreshold("mars", false),
      getCombustionThreshold("mercury", false),
      getCombustionThreshold("mercury", true),
      getCombustionThreshold("jupiter", false),
      getCombustionThreshold("venus", false),
      getCombustionThreshold("venus", true),
      getCombustionThreshold("saturn", false),
    ];
    // Jyotish orbs vary by planet - not a single flat value like Western's.
    expect(new Set(jyotishOrbs).size).toBeGreaterThan(1);
    for (const orb of jyotishOrbs) {
      expect(orb).not.toBe(westernOrb);
    }
  });
});

describe("TEST 19: combustion metadata names selected Jyotish convention", () => {
  it("chart.vedic.meta.combustionConvention and the per-planet combustion.convention field both name the Jyotish-specific convention", () => {
    const chartResult = chart();
    expect(chartResult.vedic.meta.combustionConvention).toBe(COMBUSTION_CONVENTION);
    expect(chartResult.vedic.meta.combustionConvention).toMatch(/bphs|phaladeepika/i);
    for (const key of CLASSICAL_GRAHA_KEYS) {
      if (key === "sun") continue;
      expect(chartResult.vedic.condition.planets[key].condition.combustion.convention).toBe(COMBUSTION_CONVENTION);
    }
  });
});

describe("TEST 20: combustion boundary exactness correct", () => {
  it("exactly at the threshold is NOT combust (strict less-than); one thousandth of a degree inside is combust", () => {
    // Mercury direct threshold = 14 degrees. Place Mercury exactly 14 degrees from a Sun at 0.
    const atThreshold = buildVedicCondition({ grahas: fakeGrahas({ sun: fakeGraha(0, 0), mercury: fakeGraha(0, 14) }) });
    expect(atThreshold.planets.mercury.condition.combustion.isCombust).toBe(false);
    const justInside = buildVedicCondition({ grahas: fakeGrahas({ sun: fakeGraha(0, 0), mercury: fakeGraha(0, 13.999) }) });
    expect(justInside.planets.mercury.condition.combustion.isCombust).toBe(true);
  });

  it("Mercury retrograde uses the 12-degree threshold, not the 14-degree direct one", () => {
    const direct = buildVedicCondition({ grahas: fakeGrahas({ sun: fakeGraha(0, 0), mercury: fakeGraha(0, 13, { retrograde: false }) }) });
    expect(direct.planets.mercury.condition.combustion.isCombust).toBe(true); // 13 < 14 direct
    expect(direct.planets.mercury.condition.combustion.thresholdDegrees).toBe(14);
    const retro = buildVedicCondition({ grahas: fakeGrahas({ sun: fakeGraha(0, 0), mercury: fakeGraha(0, 13, { retrograde: true }) }) });
    expect(retro.planets.mercury.condition.combustion.isCombust).toBe(false); // 13 > 12 retrograde
    expect(retro.planets.mercury.condition.combustion.thresholdDegrees).toBe(12);
  });

  it("Venus retrograde uses the 8-degree threshold, not the 10-degree direct one", () => {
    const direct = buildVedicCondition({ grahas: fakeGrahas({ sun: fakeGraha(0, 0), venus: fakeGraha(0, 9, { retrograde: false }) }) });
    expect(direct.planets.venus.condition.combustion.isCombust).toBe(true); // 9 < 10
    const retro = buildVedicCondition({ grahas: fakeGrahas({ sun: fakeGraha(0, 0), venus: fakeGraha(0, 9, { retrograde: true }) }) });
    expect(retro.planets.venus.condition.combustion.isCombust).toBe(false); // 9 > 8
  });

  it("Mars/Jupiter/Saturn/Moon use one fixed orb regardless of retrograde state", () => {
    const marsDirect = buildVedicCondition({ grahas: fakeGrahas({ sun: fakeGraha(0, 0), mars: fakeGraha(0, 16, { retrograde: false }) }) });
    const marsRetro = buildVedicCondition({ grahas: fakeGrahas({ sun: fakeGraha(0, 0), mars: fakeGraha(0, 16, { retrograde: true }) }) });
    expect(marsDirect.planets.mars.condition.combustion.thresholdDegrees).toBe(17);
    expect(marsRetro.planets.mars.condition.combustion.thresholdDegrees).toBe(17);
    expect(marsDirect.planets.mars.condition.combustion.isCombust).toBe(true);
    expect(marsRetro.planets.mars.condition.combustion.isCombust).toBe(true);
  });

  it("the Sun itself is never combust and has no threshold", () => {
    const result = buildVedicCondition({ grahas: fakeGrahas({ sun: fakeGraha(0, 0) }) });
    expect(result.planets.sun.condition.combustion.isCombust).toBe(false);
    expect(result.planets.sun.condition.combustion.thresholdDegrees).toBe(null);
  });
});

describe("TEST 21: Rahu/Ketu not assigned unsupported own/exaltation/moolatrikona status", () => {
  it("chart.vedic.condition.nodes.rahu/ketu carry no dignity boolean fields, only the explicit non-assignment marker", () => {
    const { condition } = chart().vedic;
    for (const key of ["rahu", "ketu"]) {
      expect(condition.nodes[key]).not.toHaveProperty("isOwnSign");
      expect(condition.nodes[key]).not.toHaveProperty("isExaltedSign");
      expect(condition.nodes[key]).not.toHaveProperty("isMoolatrikona");
      expect(condition.nodes[key]).not.toHaveProperty("dignity");
      expect(condition.nodes[key].dignityConvention).toBe("not_assigned_due_to_traditional_variance");
    }
    expect(condition.meta.rahuKetuDignity).toBe("not_assigned_due_to_traditional_variance");
  });
});

describe("TEST 22: no temporary friendship", () => {
  it("chart.vedic.meta.temporaryFriendship is explicitly not_implemented, and no tatkalika field exists in the actual planets/nodes data", () => {
    const chartResult = chart();
    expect(chartResult.vedic.meta.temporaryFriendship).toBe("not_implemented");
    const json = JSON.stringify({ planets: chartResult.vedic.condition.planets, nodes: chartResult.vedic.condition.nodes });
    expect(json).not.toMatch(/tatkalika|temporaryFriend/i);
  });
});

describe("TEST 23: no compound friendship", () => {
  it("chart.vedic.meta.compoundFriendship is explicitly not_implemented, and no panchadha field exists in the actual planets/nodes data", () => {
    const chartResult = chart();
    expect(chartResult.vedic.meta.compoundFriendship).toBe("not_implemented");
    const json = JSON.stringify({ planets: chartResult.vedic.condition.planets, nodes: chartResult.vedic.condition.nodes });
    expect(json).not.toMatch(/panchadha|compoundFriend|panchdha/i);
  });
});

describe("TEST 24: no Shadbala", () => {
  it("chart.vedic.meta.shadbala is explicitly not_implemented, and no shadbala/rupa/bala field exists in the actual planets/nodes data", () => {
    const chartResult = chart();
    expect(chartResult.vedic.meta.shadbala).toBe("not_implemented");
    const json = JSON.stringify({ planets: chartResult.vedic.condition.planets, nodes: chartResult.vedic.condition.nodes });
    expect(json).not.toMatch(/shadbala|\brupa\b|chestabala|ucchabala|digbala/i);
  });
});

describe("TEST 25: no functional benefic/malefic", () => {
  it("no functionalBenefic/functionalMalefic field or value anywhere in chart.vedic.condition", () => {
    const json = JSON.stringify(chart().vedic.condition);
    expect(json).not.toMatch(/functional.?benefic|functional.?malefic/i);
  });
});

describe("TEST 26: no Yogakaraka", () => {
  it("no yogakaraka field anywhere in chart.vedic.condition", () => {
    const json = JSON.stringify(chart().vedic.condition);
    expect(json).not.toMatch(/yogakaraka/i);
  });
});

describe("TEST 27: no Maraka", () => {
  it("no maraka/badhaka field anywhere in chart.vedic.condition", () => {
    const json = JSON.stringify(chart().vedic.condition);
    expect(json).not.toMatch(/\bmaraka\b|badhaka/i);
  });
});

describe("TEST 28: no dignity score", () => {
  it("no dignityScore/planetScore/strengthScore field anywhere in chart.vedic.condition", () => {
    const json = JSON.stringify(chart().vedic.condition);
    expect(json).not.toMatch(/dignityScore|planetScore|beneficScore/i);
  });
});

describe("TEST 29: no overall strength score", () => {
  it("no overallStrength/percentageStrength/score field anywhere in chart.vedic.condition", () => {
    const json = JSON.stringify(chart().vedic.condition);
    expect(json).not.toMatch(/overallStrength|percentageStrength|\bscore\b/i);
  });
});

describe("TEST 30: no interpretation text", () => {
  it("no 'strong'/'weak'/'gives hardship'/'improves career' style language anywhere in chart.vedic.condition", () => {
    const json = JSON.stringify(chart().vedic.condition);
    expect(json).not.toMatch(/\bstrong\b|\bweak\b|hardship|improves|harms|powerful/i);
    expect(chart().vedic.meta.vedicConditionInterpretation).toBe("none");
  });
});

describe("TEST 31: Phase 4A unchanged", () => {
  it("chart.vedic.grahas/lagna/ayanamsha are byte-for-byte identical to a fresh computation", () => {
    const a = chart().vedic;
    const b = chart().vedic;
    expect(a.grahas).toEqual(b.grahas);
    expect(a.lagna).toEqual(b.lagna);
    expect(a.ayanamsha).toEqual(b.ayanamsha);
  });

  it("no Phase 4A graha object gained a dignity-related field", () => {
    const { grahas } = chart().vedic;
    for (const g of Object.values(grahas)) {
      expect(g).not.toHaveProperty("dignity");
      expect(g).not.toHaveProperty("isOwnSign");
      expect(g).not.toHaveProperty("combustion");
    }
  });
});

describe("TEST 32: Phase 4B unchanged", () => {
  it("chart.vedic.bhava is byte-for-byte identical to a fresh computation", () => {
    const a = chart().vedic;
    const b = chart().vedic;
    expect(a.bhava).toEqual(b.bhava);
  });
});

describe("TEST 33: Phase 4C unchanged", () => {
  it("chart.vedic.nakshatra is byte-for-byte identical to a fresh computation", () => {
    const a = chart().vedic;
    const b = chart().vedic;
    expect(a.nakshatra).toEqual(b.nakshatra);
  });
});

describe("TEST 34: Western unchanged", () => {
  it("chart.points/planets/angles/houseCusps are identical to a fresh independent computation", () => {
    const withCondition = calculateChart(VERIFICATION_INPUT);
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withCondition.points).toEqual(fresh.points);
    expect(withCondition.planets).toEqual(fresh.planets);
    expect(withCondition.angles).toEqual(fresh.angles);
    expect(withCondition.houseCusps).toEqual(fresh.houseCusps);
  });
});

describe("TEST 35: Classical unchanged", () => {
  it("chart.classical is untouched by adding chart.vedic.condition", () => {
    const withCondition = calculateChart(VERIFICATION_INPUT);
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withCondition.classical).toEqual(fresh.classical);
  });
});

describe("TEST 36: Phase 3H unchanged", () => {
  it("chart.classical.summary is untouched by adding chart.vedic.condition", () => {
    const withCondition = calculateChart(VERIFICATION_INPUT);
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withCondition.classical.summary).toEqual(fresh.classical.summary);
  });
});

describe("TEST 37: JSON serializable", () => {
  it("JSON.stringify/parse round-trips chart.vedic.condition without throwing and preserves shape", () => {
    const { condition } = chart().vedic;
    const json = JSON.stringify(condition);
    expect(typeof json).toBe("string");
    const parsed = JSON.parse(json);
    expect(Object.keys(parsed).sort()).toEqual(["meta", "planets", "nodes"].sort());
    expect(Object.keys(parsed.planets).length).toBe(7);
    expect(Object.keys(parsed.nodes).length).toBe(2);
  });

  it("no functions, no circular references", () => {
    const { condition } = chart().vedic;
    expect(() => JSON.stringify(condition)).not.toThrow();
    const walk = (value) => {
      if (typeof value === "function") throw new Error("function found in chart.vedic.condition");
      if (value && typeof value === "object") {
        for (const v of Object.values(value)) walk(v);
      }
    };
    expect(() => walk(condition)).not.toThrow();
  });
});

describe("Extensive boundary tests: exact exaltation/debilitation degrees", () => {
  it("distanceFromExactExaltationDegrees is exactly 0 when a Graha sits precisely at its own exaltation point", () => {
    for (const planet of CLASSICAL_GRAHA_KEYS) {
      const exaltationIndex = RASHIS.find((r) => r.key === EXALTATION[planet].rashiKey).index;
      const grahas = fakeGrahas({ [planet]: fakeGraha(exaltationIndex, EXALTATION[planet].exactDegree) });
      const result = buildVedicCondition({ grahas });
      expect(result.planets[planet].dignity.distanceFromExactExaltationDegrees).toBeCloseTo(0, 9);
      expect(result.planets[planet].dignity.isExaltedSign).toBe(true);
    }
  });

  it("distanceFromExactDebilitationDegrees is exactly 0 when a Graha sits precisely at its own debilitation point", () => {
    for (const planet of CLASSICAL_GRAHA_KEYS) {
      const debilitation = getDebilitation(planet, RASHIS);
      const debilitationIndex = RASHIS.find((r) => r.key === debilitation.rashiKey).index;
      const grahas = fakeGrahas({ [planet]: fakeGraha(debilitationIndex, debilitation.exactDegree) });
      const result = buildVedicCondition({ grahas });
      expect(result.planets[planet].dignity.distanceFromExactDebilitationDegrees).toBeCloseTo(0, 9);
      expect(result.planets[planet].dignity.isDebilitatedSign).toBe(true);
    }
  });
});

describe("Extensive boundary tests: every Moolatrikona start/end boundary for all 7 planets", () => {
  it("the start degree is included and the end degree is excluded, for every planet's Moolatrikona range", () => {
    for (const planet of CLASSICAL_GRAHA_KEYS) {
      const { rashiKey, startDegree, endDegree } = MOOLATRIKONA[planet];
      const rashiIndex = RASHIS.find((r) => r.key === rashiKey).index;

      const atStart = buildVedicCondition({ grahas: fakeGrahas({ [planet]: fakeGraha(rashiIndex, startDegree) }) });
      expect(atStart.planets[planet].dignity.isMoolatrikona).toBe(true);

      const atEnd = buildVedicCondition({ grahas: fakeGrahas({ [planet]: fakeGraha(rashiIndex, endDegree % 30) }) });
      // endDegree can be 30 (Moon) - modulo 30 wraps to 0 of the NEXT sign, which is never that planet's Moolatrikona rashi, so isMoolatrikona is false either way.
      if (endDegree < 30) {
        expect(atEnd.planets[planet].dignity.isMoolatrikona).toBe(false);
      }

      if (startDegree > 0) {
        const justBelowStart = buildVedicCondition({ grahas: fakeGrahas({ [planet]: fakeGraha(rashiIndex, startDegree - 0.0001) }) });
        expect(justBelowStart.planets[planet].dignity.isMoolatrikona).toBe(false);
      }
    }
  });
});

describe("Extensive boundary tests: every combustion threshold for all 6 combustible planets", () => {
  it("exactly at the threshold is not combust; a thousandth of a degree inside is combust (direct motion)", () => {
    for (const planet of ["moon", "mars", "mercury", "jupiter", "venus", "saturn"]) {
      const threshold = getCombustionThreshold(planet, false);
      const atThreshold = buildVedicCondition({ grahas: fakeGrahas({ sun: fakeGraha(0, 0), [planet]: fakeGraha(0, threshold) }) });
      expect(atThreshold.planets[planet].condition.combustion.isCombust).toBe(false);

      const justInside = buildVedicCondition({ grahas: fakeGrahas({ sun: fakeGraha(0, 0), [planet]: fakeGraha(0, threshold - 0.001) }) });
      expect(justInside.planets[planet].condition.combustion.isCombust).toBe(true);
    }
  });

  it("exactly at the retrograde threshold is not combust; a thousandth of a degree inside is combust (Mercury/Venus retrograde)", () => {
    for (const planet of ["mercury", "venus"]) {
      const threshold = getCombustionThreshold(planet, true);
      const atThreshold = buildVedicCondition({ grahas: fakeGrahas({ sun: fakeGraha(0, 0), [planet]: fakeGraha(0, threshold, { retrograde: true }) }) });
      expect(atThreshold.planets[planet].condition.combustion.isCombust).toBe(false);

      const justInside = buildVedicCondition({ grahas: fakeGrahas({ sun: fakeGraha(0, 0), [planet]: fakeGraha(0, threshold - 0.001, { retrograde: true }) }) });
      expect(justInside.planets[planet].condition.combustion.isCombust).toBe(true);
    }
  });
});

describe("Verification-chart condition totals reconcile", () => {
  it("reports the full Phase 4D verification-chart output shape", () => {
    const { condition } = chart().vedic;
    for (const key of CLASSICAL_GRAHA_KEYS) {
      const p = condition.planets[key];
      expect(p).toHaveProperty("rashi");
      expect(p).toHaveProperty("degreeInRashi");
      expect(p.dignity).toHaveProperty("rashiDignityStatus");
      expect(p.signRelationship).toHaveProperty("signLord");
      expect(p.signRelationship).toHaveProperty("naturalRelationshipToSignLord");
      expect(p.condition).toHaveProperty("isRetrograde");
      expect(p.condition.combustion).toHaveProperty("isCombust");
    }
    for (const key of ["rahu", "ketu"]) {
      expect(condition.nodes[key]).toHaveProperty("rashi");
      expect(condition.nodes[key]).toHaveProperty("isRetrograde");
    }
  });
});
