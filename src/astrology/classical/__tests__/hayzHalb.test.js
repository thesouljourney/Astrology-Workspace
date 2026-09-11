import { describe, it, expect } from "vitest";
import { calculateChart } from "../../ephemeris.js";
import { getSignGender, MASCULINE_SIGNS, FEMININE_SIGNS } from "../rules/signGender.js";
import { computeSectConditionDetail } from "../hayzHalb.js";

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

const ALL_SIGNS = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "sagittarius", "capricorn", "aquarius", "pisces", "libra", "scorpio",
];

describe("TEST 1-2: Sign gender table completeness", () => {
  it("TEST 1: masculine + feminine sets are each exactly 6 signs, no overlap, cover all 12 signs", () => {
    expect(MASCULINE_SIGNS.length).toBe(6);
    expect(FEMININE_SIGNS.length).toBe(6);
    const overlap = MASCULINE_SIGNS.filter((s) => FEMININE_SIGNS.includes(s));
    expect(overlap).toEqual([]);
    for (const sign of ALL_SIGNS) {
      expect(MASCULINE_SIGNS.includes(sign) || FEMININE_SIGNS.includes(sign)).toBe(true);
    }
  });

  it("TEST 2: getSignGender is correct for every sign, and throws on an unknown sign", () => {
    expect(getSignGender("aries")).toBe("masculine");
    expect(getSignGender("gemini")).toBe("masculine");
    expect(getSignGender("leo")).toBe("masculine");
    expect(getSignGender("libra")).toBe("masculine");
    expect(getSignGender("sagittarius")).toBe("masculine");
    expect(getSignGender("aquarius")).toBe("masculine");
    expect(getSignGender("taurus")).toBe("feminine");
    expect(getSignGender("cancer")).toBe("feminine");
    expect(getSignGender("virgo")).toBe("feminine");
    expect(getSignGender("scorpio")).toBe("feminine");
    expect(getSignGender("capricorn")).toBe("feminine");
    expect(getSignGender("pisces")).toBe("feminine");
    expect(() => getSignGender("not-a-sign")).toThrow();
  });
});

describe("TEST 3-6: Hayz rule (positive and negative cases, rule-level)", () => {
  it("TEST 3: diurnal planet, day chart, above horizon, masculine sign -> Hayz", () => {
    const r = computeSectConditionDetail({
      sign: "leo",
      chartSect: "day",
      effectiveSect: "diurnal",
      isOfSect: true,
      isAboveHorizon: true,
      altitudeDegrees: 40,
    });
    expect(r.hayz.isHayz).toBe(true);
    expect(r.halb.isHalb).toBe(false);
    expect(r.sectConditionLabel).toBe("hayz");
  });

  it("TEST 4: nocturnal planet, night chart, below horizon, feminine sign -> Hayz", () => {
    const r = computeSectConditionDetail({
      sign: "cancer",
      chartSect: "night",
      effectiveSect: "nocturnal",
      isOfSect: true,
      isAboveHorizon: false,
      altitudeDegrees: -20,
    });
    expect(r.hayz.isHayz).toBe(true);
    expect(r.halb.isHalb).toBe(false);
    expect(r.sectConditionLabel).toBe("hayz");
  });

  it("TEST 5: diurnal planet in a night chart is never Hayz, regardless of hemisphere/sign", () => {
    const r = computeSectConditionDetail({
      sign: "leo",
      chartSect: "night",
      effectiveSect: "diurnal",
      isOfSect: false,
      isAboveHorizon: true,
      altitudeDegrees: 40,
    });
    expect(r.hayz.isHayz).toBe(false);
    expect(r.hayz.chartSectMatches).toBe(false);
  });

  it("TEST 6: correct chart sect and hemisphere but wrong sign gender is never Hayz", () => {
    const r = computeSectConditionDetail({
      sign: "cancer", // feminine, but planet is diurnal
      chartSect: "day",
      effectiveSect: "diurnal",
      isOfSect: true,
      isAboveHorizon: true,
      altitudeDegrees: 40,
    });
    expect(r.hayz.isHayz).toBe(false);
    expect(r.hayz.signGenderMatches).toBe(false);
  });
});

describe("TEST 7-9: Halb rule (this project's definition)", () => {
  it("TEST 7: chart sect matches + hemisphere matches + gender does NOT match -> Halb", () => {
    const r = computeSectConditionDetail({
      sign: "cancer", // feminine
      chartSect: "day",
      effectiveSect: "diurnal",
      isOfSect: true,
      isAboveHorizon: true, // correct hemisphere for a diurnal planet
      altitudeDegrees: 40,
    });
    expect(r.halb.isHalb).toBe(true);
    expect(r.hayz.isHayz).toBe(false);
    expect(r.sectConditionLabel).toBe("halb");
  });

  it("TEST 8: hemisphere matches but chart sect does NOT match -> not Halb (isOfSect required)", () => {
    const r = computeSectConditionDetail({
      sign: "cancer",
      chartSect: "night",
      effectiveSect: "diurnal", // planet out of sect in this chart
      isOfSect: false,
      isAboveHorizon: true,
      altitudeDegrees: 40,
    });
    expect(r.halb.isHalb).toBe(false);
    expect(r.hayz.isHayz).toBe(false);
    expect(r.sectConditionLabel).toBe("out_of_sect");
  });

  it("TEST 9: chart sect matches but hemisphere does NOT match -> not Halb", () => {
    const r = computeSectConditionDetail({
      sign: "cancer",
      chartSect: "day",
      effectiveSect: "diurnal",
      isOfSect: true,
      isAboveHorizon: false, // wrong hemisphere for a diurnal planet
      altitudeDegrees: -10,
    });
    expect(r.halb.isHalb).toBe(false);
    expect(r.hayz.isHayz).toBe(false);
    expect(r.sectConditionLabel).toBe("of_sect_only");
  });
});

describe("TEST 10: Hayz and Halb are mutually exclusive across the full input space", () => {
  it("no combination of inputs ever yields isHayz === true && isHalb === true", () => {
    const signs = ALL_SIGNS;
    const chartSects = ["day", "night"];
    const effectiveSects = ["diurnal", "nocturnal"];
    const boolValues = [true, false];
    for (const sign of signs) {
      for (const chartSect of chartSects) {
        for (const effectiveSect of effectiveSects) {
          for (const isOfSect of boolValues) {
            for (const isAboveHorizon of boolValues) {
              const r = computeSectConditionDetail({
                sign,
                chartSect,
                effectiveSect,
                isOfSect,
                isAboveHorizon,
                altitudeDegrees: isAboveHorizon ? 10 : -10,
              });
              expect(r.hayz.isHayz && r.halb.isHalb).toBe(false);
            }
          }
        }
      }
    }
  });
});

describe("TEST 11: sectConditionLabel exactly reflects the four exclusive categories", () => {
  it("hayz / halb / of_sect_only / out_of_sect cover all cases with no overlap", () => {
    const cases = [
      { isOfSect: true, hemisphereMatches: true, signGenderMatches: true, expected: "hayz" },
      { isOfSect: true, hemisphereMatches: true, signGenderMatches: false, expected: "halb" },
      { isOfSect: true, hemisphereMatches: false, signGenderMatches: true, expected: "of_sect_only" },
      { isOfSect: true, hemisphereMatches: false, signGenderMatches: false, expected: "of_sect_only" },
      { isOfSect: false, hemisphereMatches: true, signGenderMatches: true, expected: "out_of_sect" },
      { isOfSect: false, hemisphereMatches: false, signGenderMatches: false, expected: "out_of_sect" },
    ];
    for (const c of cases) {
      // Construct sign/effectiveSect/isAboveHorizon combos that produce the desired
      // hemisphereMatches/signGenderMatches flags for a diurnal planet.
      const sign = c.signGenderMatches ? "leo" : "cancer";
      const isAboveHorizon = c.hemisphereMatches;
      const r = computeSectConditionDetail({
        sign,
        chartSect: "day",
        effectiveSect: "diurnal",
        isOfSect: c.isOfSect,
        isAboveHorizon,
        altitudeDegrees: isAboveHorizon ? 10 : -10,
      });
      expect(r.sectConditionLabel).toBe(c.expected);
    }
  });
});

describe("TEST 12: The WHY breakdown is always reported independently, not just the final boolean", () => {
  it("hayz object always exposes chartSectMatches, hemisphereMatches, signGenderMatches", () => {
    const r = computeSectConditionDetail({
      sign: "leo",
      chartSect: "night",
      effectiveSect: "diurnal",
      isOfSect: false,
      isAboveHorizon: false,
      altitudeDegrees: -5,
    });
    expect(r.hayz).toHaveProperty("chartSectMatches");
    expect(r.hayz).toHaveProperty("hemisphereMatches");
    expect(r.hayz).toHaveProperty("signGenderMatches");
    expect(r.hayz.chartSectMatches).toBe(false);
    expect(r.hayz.hemisphereMatches).toBe(false);
    expect(r.hayz.signGenderMatches).toBe(true);
  });
});

describe("TEST 13: No score of any kind exists in sectConditionDetail", () => {
  it("JSON of sectConditionDetail never contains the substring 'score' for any classical planet", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    for (const p of chart.classical.planets) {
      const json = JSON.stringify(p.sectConditionDetail);
      expect(json).not.toMatch(/score/i);
      expect(p.sectConditionDetail).not.toHaveProperty("hayzScore");
      expect(p.sectConditionDetail).not.toHaveProperty("sectScore");
      expect(p.sectConditionDetail).not.toHaveProperty("traditionalStrengthScore");
    }
  });
});

describe("TEST 14-17: chart.classical wiring reuses Phase 3B data bit-for-bit, not recalculated", () => {
  const chart = calculateChart(VERIFICATION_INPUT);

  it("TEST 14: sectConditionDetail.chartSect matches Phase 3B condition.chartSect for every planet", () => {
    for (const p of chart.classical.planets) {
      expect(p.sectConditionDetail.chartSect).toBe(p.condition.chartSect);
    }
  });

  it("TEST 15: sectConditionDetail.effectiveSect and isOfSect match Phase 3B condition.sect exactly (Mercury included)", () => {
    for (const p of chart.classical.planets) {
      expect(p.sectConditionDetail.effectiveSect).toBe(p.condition.sect.effectiveSect);
      expect(p.sectConditionDetail.isOfSect).toBe(p.condition.sect.isOfSect);
    }
    // Mercury specifically: its effectiveSect is variable (oriental/occidental-derived),
    // and Phase 3D must not recompute it independently.
    const mercury = findClassical(chart, "mercury");
    expect(mercury.sectConditionDetail.effectiveSect).toBe(mercury.condition.sect.effectiveSect);
  });

  it("TEST 16: sectConditionDetail.horizon matches Phase 3B condition.horizon exactly (bit-identical, not house-based)", () => {
    for (const p of chart.classical.planets) {
      expect(p.sectConditionDetail.horizon.isAboveHorizon).toBe(p.condition.horizon.isAboveHorizon);
      expect(p.sectConditionDetail.horizon.altitudeDegrees).toBe(p.condition.horizon.altitude);
    }
  });

  it("TEST 17: Sun and Moon use the exact same computeSectConditionDetail logic as every other planet (not special-cased)", () => {
    const sun = findClassical(chart, "sun");
    const moon = findClassical(chart, "moon");
    for (const p of [sun, moon]) {
      expect(p.sectConditionDetail).toHaveProperty("hayz");
      expect(p.sectConditionDetail).toHaveProperty("halb");
      expect(p.sectConditionDetail).toHaveProperty("sectConditionLabel");
      expect(p.sectConditionDetail.hayz).toHaveProperty("chartSectMatches");
      expect(p.sectConditionDetail.hayz).toHaveProperty("hemisphereMatches");
      expect(p.sectConditionDetail.hayz).toHaveProperty("signGenderMatches");
    }
    // Verify by direct recomputation that Sun's result is identical to calling
    // the shared function manually with Sun's own upstream inputs - i.e. no
    // Sun-specific branch exists anywhere in the wiring.
    const sunPlanet = chart.planets.find((pl) => pl.key === "sun");
    const recomputed = computeSectConditionDetail({
      sign: sunPlanet.sign.key,
      chartSect: sun.condition.chartSect,
      effectiveSect: sun.condition.sect.effectiveSect,
      isOfSect: sun.condition.sect.isOfSect,
      isAboveHorizon: sun.condition.horizon.isAboveHorizon,
      altitudeDegrees: sun.condition.horizon.altitude,
    });
    expect(sun.sectConditionDetail).toEqual(recomputed);
  });
});

describe("TEST 18: Full verification chart output - computed, not pre-assumed", () => {
  it("TEST 18: every classical planet has a well-formed sectConditionDetail, and the actual computed result matches the documented, independently-verified rule trace", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    expect(chart.classical.sect).toBe("night");

    const expected = {
      // Derived by tracing the rules against each planet's already-verified
      // Phase 1/3B sign, chartSect, effectiveSect, isOfSect and horizon data -
      // not chosen in advance. See Phase 3D report for the full per-planet trace.
      sun: "out_of_sect",
      moon: "of_sect_only",
      mercury: "out_of_sect",
      venus: "hayz",
      mars: "of_sect_only",
      jupiter: "out_of_sect",
      saturn: "out_of_sect",
    };

    for (const [key, label] of Object.entries(expected)) {
      const p = findClassical(chart, key);
      expect(p.sectConditionDetail.sectConditionLabel).toBe(label);
    }

    // Exactly one planet reaches full Hayz in this chart, and none reach Halb.
    const hayzCount = chart.classical.planets.filter((p) => p.sectConditionDetail.hayz.isHayz).length;
    const halbCount = chart.classical.planets.filter((p) => p.sectConditionDetail.halb.isHalb).length;
    expect(hayzCount).toBe(1);
    expect(halbCount).toBe(0);
  });
});

describe("TEST 19: sectConditionDetail has the exact documented structured shape", () => {
  it("shape includes chartSect, effectiveSect, isOfSect, signGender, horizon, hayz, halb, sectConditionLabel", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    for (const p of chart.classical.planets) {
      const d = p.sectConditionDetail;
      expect(d).toHaveProperty("chartSect");
      expect(d).toHaveProperty("effectiveSect");
      expect(d).toHaveProperty("isOfSect");
      expect(d).toHaveProperty("signGender");
      expect(d).toHaveProperty("horizon");
      expect(d.horizon).toHaveProperty("isAboveHorizon");
      expect(d.horizon).toHaveProperty("altitudeDegrees");
      expect(d).toHaveProperty("hayz");
      expect(d.hayz).toHaveProperty("isHayz");
      expect(d).toHaveProperty("halb");
      expect(d.halb).toHaveProperty("isHalb");
      expect(d).toHaveProperty("sectConditionLabel");
      expect(["hayz", "halb", "of_sect_only", "out_of_sect"]).toContain(d.sectConditionLabel);
    }
  });
});
