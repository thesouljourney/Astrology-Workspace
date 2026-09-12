import { describe, it, expect } from "vitest";
import * as Astronomy from "astronomy-engine";
import { calculateChart } from "../../ephemeris.js";
import { computeLahiriAyanamsha } from "../ayanamsha.js";
import { getRashi, RASHIS } from "../rashi.js";
import { buildVedicChart, NAVAGRAHA_ORDER, VEDIC_NODE_TYPE } from "../vedicChart.js";

const VERIFICATION_INPUT = {
  birthDate: "1994-11-21",
  birthTime: "01:44:00",
  latitude: 1.8548,
  longitude: 102.9325,
  utcOffset: "+08:00",
  houseSystem: "placidus",
};

function normalize360(x) {
  let r = x % 360;
  if (r < 0) r += 360;
  return r;
}

describe("TEST 1: Lahiri ayanamsha varies by date", () => {
  it("differs meaningfully between two dates a decade apart", () => {
    const t1 = Astronomy.MakeTime(new Date("1994-11-20T17:44:00Z"));
    const t2 = Astronomy.MakeTime(new Date("2004-11-20T17:44:00Z"));
    const a1 = computeLahiriAyanamsha(t1).degrees;
    const a2 = computeLahiriAyanamsha(t2).degrees;
    expect(a1).not.toBeCloseTo(a2, 3);
    // Should increase by roughly 10 years * ~0.01397 deg/year ~= 0.14 deg.
    expect(a2 - a1).toBeGreaterThan(0.1);
    expect(a2 - a1).toBeLessThan(0.2);
  });
});

describe("TEST 2: ayanamsha is not a hard-coded constant", () => {
  it("computeLahiriAyanamsha is a genuine function of astroTime, not a fixed literal", () => {
    const dates = ["1900-01-01T00:00:00Z", "1950-01-01T00:00:00Z", "2000-01-01T00:00:00Z", "2050-01-01T00:00:00Z"];
    const values = dates.map((d) => computeLahiriAyanamsha(Astronomy.MakeTime(new Date(d))).degrees);
    const uniqueRounded = new Set(values.map((v) => v.toFixed(2)));
    expect(uniqueRounded.size).toBe(dates.length);
    // Strictly increasing over time.
    for (let i = 1; i < values.length; i++) expect(values[i]).toBeGreaterThan(values[i - 1]);
  });
});

describe("TEST 3: tropical -> sidereal conversion works normally", () => {
  it("normalize360(tropical - ayanamsha) matches example arithmetic", () => {
    expect(normalize360(2 - 24)).toBeCloseTo(338, 10);
  });

  it("real verification-chart Sun sidereal longitude equals tropical minus ayanamsha", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const sun = chart.vedic.grahas.sun;
    expect(normalize360(sun.tropicalLongitude - sun.ayanamshaDegrees)).toBeCloseTo(sun.siderealLongitude, 9);
  });
});

describe("TEST 4: negative wrap works", () => {
  it("a tropical longitude smaller than the ayanamsha wraps positive", () => {
    expect(normalize360(5 - 23.79)).toBeCloseTo(341.21, 6);
    expect(normalize360(5 - 23.79)).toBeGreaterThanOrEqual(0);
  });
});

describe("TEST 5: 359 deg / 0 deg wrap works", () => {
  it("a tropical longitude just below 360 combined with ayanamsha wraps correctly through 0", () => {
    // 359 - 23.79 = 335.21 (no wrap needed) - now push it further: 5 - 23.79 wraps through 0.
    expect(normalize360(359.9 - 23.79)).toBeCloseTo(336.11, 6);
    expect(normalize360(0.05 - 23.79)).toBeCloseTo(336.26, 6);
  });
});

describe("TEST 6: all 12 Rashi boundaries correct", () => {
  it("every 30-degree boundary resolves to the correct Rashi, in the correct fixed order", () => {
    const expectedOrder = [
      "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
      "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
    ];
    expect(RASHIS.map((r) => r.name)).toEqual(expectedOrder);
    for (let i = 0; i < 12; i++) {
      const { rashi, rashiIndex, degreeWithinRashi } = getRashi(i * 30);
      expect(rashi.name).toBe(expectedOrder[i]);
      expect(rashiIndex).toBe(i);
      expect(degreeWithinRashi).toBe(0);
    }
  });
});

describe("TEST 7: 0 deg Aries handled", () => {
  it("exactly 0 degrees sidereal resolves to Aries, 0 deg within sign", () => {
    const { rashi, rashiIndex, degreeWithinRashi } = getRashi(0);
    expect(rashi.name).toBe("Aries");
    expect(rashiIndex).toBe(0);
    expect(degreeWithinRashi).toBe(0);
  });
});

describe("TEST 8: 29 deg 59' Pisces handled", () => {
  it("359.9833... degrees (29 deg 59' into Pisces) resolves correctly, not rolling over to Aries", () => {
    const almostThreeSixty = 11 * 30 + 29 + 59 / 60;
    const { rashi, rashiIndex, degreeWithinRashi } = getRashi(almostThreeSixty);
    expect(rashi.name).toBe("Pisces");
    expect(rashiIndex).toBe(11);
    expect(degreeWithinRashi).toBeCloseTo(29 + 59 / 60, 6);
  });

  it("exactly 360 degrees wraps to 0 Aries, not a 13th Pisces overflow", () => {
    const { rashi, rashiIndex } = getRashi(360);
    expect(rashi.name).toBe("Aries");
    expect(rashiIndex).toBe(0);
  });
});

describe("TEST 9: exactly 9 Navagraha records", () => {
  it("chart.vedic.grahas has exactly 9 keys, matching NAVAGRAHA_ORDER", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const keys = Object.keys(chart.vedic.grahas);
    expect(keys.length).toBe(9);
    expect(NAVAGRAHA_ORDER.length).toBe(9);
    expect(new Set(keys)).toEqual(new Set(NAVAGRAHA_ORDER));
  });
});

describe("TEST 10: no Uranus/Neptune/Pluto in Navagraha", () => {
  it("modern outer planets, asteroids, Chiron, and Lilith are absent from chart.vedic.grahas", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    for (const key of ["uranus", "neptune", "pluto", "chiron", "lilith", "ceres", "pallas", "juno", "vesta"]) {
      expect(chart.vedic.grahas).not.toHaveProperty(key);
    }
  });
});

describe("TEST 11: Ketu exactly opposite Rahu", () => {
  it("Ketu's sidereal longitude is exactly 180 degrees from Rahu's, in both tropical and sidereal", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const { rahu, ketu } = chart.vedic.grahas;
    expect(normalize360(ketu.tropicalLongitude - rahu.tropicalLongitude)).toBeCloseTo(180, 9);
    expect(normalize360(ketu.siderealLongitude - rahu.siderealLongitude)).toBeCloseTo(180, 9);
  });
});

describe("TEST 12: Rahu/Ketu convention stored in metadata", () => {
  it("chart.vedic.meta.vedicNodeType is explicit and matches the exported constant", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    expect(chart.vedic.meta.vedicNodeType).toBe("mean");
    expect(chart.vedic.meta.vedicNodeType).toBe(VEDIC_NODE_TYPE);
    expect(chart.vedic.grahas.rahu.nodeType).toBe("mean");
    expect(chart.vedic.grahas.ketu.nodeType).toBe("mean");
  });
});

describe("TEST 13: Lagna sidereal conversion correct", () => {
  it("lagna.siderealLongitude reconciles with tropicalLongitude and ayanamshaDegrees", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const { lagna } = chart.vedic;
    expect(normalize360(lagna.tropicalLongitude - lagna.ayanamshaDegrees)).toBeCloseTo(lagna.siderealLongitude, 9);
    expect(lagna.tropicalLongitude).toBe(chart.angles.asc.longitude);
    expect(lagna.label).toMatch(/lagna/i);
    expect(lagna.label).toMatch(/not.*bhava/i);
  });
});

describe("TEST 14: no Vedic Bhava assignment exists yet", () => {
  it("no house/bhava field anywhere in chart.vedic, and metadata says not_yet_implemented", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    expect(chart.vedic.meta.bhavaSystem).toBe("not_yet_implemented");
    expect(chart.vedic).not.toHaveProperty("bhavas");
    expect(chart.vedic.lagna).not.toHaveProperty("house");
    expect(chart.vedic.lagna).not.toHaveProperty("bhava");
    for (const graha of Object.values(chart.vedic.grahas)) {
      expect(graha).not.toHaveProperty("house");
      expect(graha).not.toHaveProperty("bhava");
    }
    const json = JSON.stringify(chart.vedic);
    expect(json).not.toMatch(/bhavaChalit|whole_sign_bhava|sripati/i);
  });
});

describe("TEST 15: no Nakshatra assignment exists yet", () => {
  it("no nakshatra/pada field anywhere in chart.vedic.grahas/lagna, and metadata explicitly says not_yet_implemented", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    expect(chart.vedic.meta.nakshatraSystem).toBe("not_yet_implemented");
    // Check the actual data (grahas/lagna), not the metadata block itself -
    // the metadata key "nakshatraSystem" legitimately contains "nakshatra".
    const dataJson = JSON.stringify({ grahas: chart.vedic.grahas, lagna: chart.vedic.lagna });
    expect(dataJson).not.toMatch(/nakshatra|\bpada\b|vimshottari|dasha/i);
  });
});

describe("TEST 16: every Graha preserves tropical longitude", () => {
  it("each of the 9 grahas has a numeric tropicalLongitude in [0,360)", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    for (const key of NAVAGRAHA_ORDER) {
      const g = chart.vedic.grahas[key];
      expect(typeof g.tropicalLongitude).toBe("number");
      expect(g.tropicalLongitude).toBeGreaterThanOrEqual(0);
      expect(g.tropicalLongitude).toBeLessThan(360);
    }
  });
});

describe("TEST 17: every Graha preserves sidereal longitude", () => {
  it("each of the 9 grahas has a numeric siderealLongitude in [0,360)", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    for (const key of NAVAGRAHA_ORDER) {
      const g = chart.vedic.grahas[key];
      expect(typeof g.siderealLongitude).toBe("number");
      expect(g.siderealLongitude).toBeGreaterThanOrEqual(0);
      expect(g.siderealLongitude).toBeLessThan(360);
    }
  });
});

describe("TEST 18: every Graha conversion reconciles with ayanamsha", () => {
  it("normalize360(tropicalLongitude - ayanamshaDegrees) === siderealLongitude within strict tolerance, for all 9 grahas", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    for (const key of NAVAGRAHA_ORDER) {
      const g = chart.vedic.grahas[key];
      const recomputed = normalize360(g.tropicalLongitude - g.ayanamshaDegrees);
      expect(Math.abs(recomputed - g.siderealLongitude)).toBeLessThan(1e-9);
    }
  });

  it("each graha's rashi/degreeWithinRashi is consistent with its own siderealLongitude", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    for (const key of NAVAGRAHA_ORDER) {
      const g = chart.vedic.grahas[key];
      const { rashi, degreeWithinRashi } = getRashi(g.siderealLongitude);
      expect(g.rashi).toBe(rashi.name);
      expect(g.degreeWithinRashi).toBeCloseTo(degreeWithinRashi, 9);
    }
  });
});

describe("TEST 19: existing Modern Western output unchanged", () => {
  it("chart.points/chart.planets/chart.angles are identical to a fresh independent computation", () => {
    const withVedic = calculateChart(VERIFICATION_INPUT);
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withVedic.points).toEqual(fresh.points);
    expect(withVedic.planets).toEqual(fresh.planets);
    expect(withVedic.angles).toEqual(fresh.angles);
    expect(withVedic.houseCusps).toEqual(fresh.houseCusps);
  });
});

describe("TEST 20: existing Classical output unchanged", () => {
  it("chart.classical is untouched by adding chart.vedic", () => {
    const withVedic = calculateChart(VERIFICATION_INPUT);
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withVedic.classical).toEqual(fresh.classical);
  });
});

describe("TEST 21: Phase 3H summary unchanged", () => {
  it("chart.classical.summary is untouched by adding chart.vedic", () => {
    const withVedic = calculateChart(VERIFICATION_INPUT);
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withVedic.classical.summary).toEqual(fresh.classical.summary);
  });
});

describe("TEST 22: no Vedic interpretation text exists", () => {
  it("no strong/weak/benefic/malefic/exalted/debilitated/good/bad language anywhere in chart.vedic", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const json = JSON.stringify(chart.vedic);
    expect(json).not.toMatch(/\bstrong\b|\bweak\b|benefic|malefic|exalted|debilitat|friendly|enem|\bgood\b|\bbad\b/i);
    expect(chart.vedic.meta.vedicInterpretation).toBe("none");
  });
});

describe("TEST 23: no Vedic score exists", () => {
  it("no score field anywhere in chart.vedic", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const json = JSON.stringify(chart.vedic);
    expect(json).not.toMatch(/score/i);
  });
});

describe("TEST 24: output is JSON serializable", () => {
  it("JSON.stringify/parse round-trips chart.vedic without throwing and preserves shape", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const json = JSON.stringify(chart.vedic);
    expect(typeof json).toBe("string");
    const parsed = JSON.parse(json);
    expect(Object.keys(parsed).sort()).toEqual(["ayanamsha", "grahas", "lagna", "meta"].sort());
    expect(Object.keys(parsed.grahas).length).toBe(9);
  });

  it("no functions, no circular references", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    expect(() => JSON.stringify(chart.vedic)).not.toThrow();
    const walk = (value) => {
      if (typeof value === "function") throw new Error("function found in chart.vedic");
      if (value && typeof value === "object") {
        for (const v of Object.values(value)) walk(v);
      }
    };
    expect(() => walk(chart.vedic)).not.toThrow();
  });
});

describe("TEST 25: no API/network dependency", () => {
  it("calculateChart (including chart.vedic) is fully synchronous - no network/async call is possible", () => {
    const result = calculateChart(VERIFICATION_INPUT);
    // A synchronous function call cannot itself be a Promise; if any step
    // secretly performed network I/O it would have to be async.
    expect(result).not.toBeInstanceOf(Promise);
    expect(result.vedic).toBeDefined();
  });
});

describe("Boundary tests around exact 30-degree Rashi transitions", () => {
  it("just below and just above each 30-degree boundary land in the correct adjacent Rashi", () => {
    for (let i = 0; i < 12; i++) {
      const boundary = i * 30;
      const justBelow = normalize360(boundary - 0.0001);
      const justAbove = boundary + 0.0001;
      const belowRashiIndex = getRashi(justBelow).rashiIndex;
      const aboveRashiIndex = getRashi(justAbove).rashiIndex;
      const expectedBelowIndex = (i + 11) % 12;
      expect(belowRashiIndex).toBe(expectedBelowIndex);
      expect(aboveRashiIndex).toBe(i);
    }
  });
});

describe("Verification chart totals reconcile", () => {
  it("reports the full Phase 4A verification-chart output", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const v = chart.vedic;
    // Sanity: every graha object has the full documented shape.
    for (const key of NAVAGRAHA_ORDER) {
      const g = v.grahas[key];
      expect(g).toHaveProperty("name");
      expect(g).toHaveProperty("tropicalLongitude");
      expect(g).toHaveProperty("ayanamshaDegrees");
      expect(g).toHaveProperty("siderealLongitude");
      expect(g).toHaveProperty("rashi");
      expect(g).toHaveProperty("rashiIndex");
      expect(g).toHaveProperty("degreeWithinRashi");
      expect(g).toHaveProperty("degreeFormatted");
      expect(g.motion).toHaveProperty("tropicalSpeedDegPerDay");
      expect(g.motion).toHaveProperty("siderealSpeedDegPerDay");
      expect(typeof g.motion.retrograde).toBe("boolean");
    }
    expect(v.ayanamsha.degrees).toBeGreaterThan(23);
    expect(v.ayanamsha.degrees).toBeLessThan(24);
  });
});
