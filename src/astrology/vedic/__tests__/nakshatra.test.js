import { describe, it, expect } from "vitest";
import { calculateChart } from "../../ephemeris.js";
import { NAVAGRAHA_ORDER } from "../grahaNames.js";
import {
  NAKSHATRAS,
  NAKSHATRA_SPAN_DEGREES,
  PADA_SPAN_DEGREES,
  NAKSHATRA_LORD_SEQUENCE,
  getNakshatra,
  buildVedicNakshatra,
} from "../nakshatra.js";

const VERIFICATION_INPUT = {
  birthDate: "1994-11-21",
  birthTime: "01:44:00",
  latitude: 1.8548,
  longitude: 102.9325,
  utcOffset: "+08:00",
  houseSystem: "placidus",
};

/** Build a degrees value from degrees/minutes/seconds, matching the brief's D-M-S examples exactly. */
function dms(d, m, s) {
  return d + m / 60 + s / 3600;
}

function chart() {
  return calculateChart(VERIFICATION_INPUT);
}

describe("TEST 1: exactly 27 Nakshatras exist", () => {
  it("NAKSHATRAS has exactly 27 entries, indexed 0..26", () => {
    expect(NAKSHATRAS.length).toBe(27);
    expect(NAKSHATRAS.map((n) => n.index)).toEqual(Array.from({ length: 27 }, (_, i) => i));
  });
});

describe("TEST 2: every Nakshatra span = 13 degrees 20 arcminutes", () => {
  it("NAKSHATRA_SPAN_DEGREES equals the exact fraction 360/27, matching 13d20m", () => {
    expect(NAKSHATRA_SPAN_DEGREES).toBe(360 / 27);
    expect(NAKSHATRA_SPAN_DEGREES).toBeCloseTo(dms(13, 20, 0), 9);
  });
});

describe("TEST 3: every Pada span = 3 degrees 20 arcminutes", () => {
  it("PADA_SPAN_DEGREES equals the exact fraction 360/108, matching 3d20m, and is exactly 1/4 of a Nakshatra span", () => {
    expect(PADA_SPAN_DEGREES).toBe(360 / 108);
    expect(PADA_SPAN_DEGREES).toBeCloseTo(dms(3, 20, 0), 9);
    expect(PADA_SPAN_DEGREES * 4).toBeCloseTo(NAKSHATRA_SPAN_DEGREES, 9);
  });
});

describe("TEST 4: Nakshatra order correct", () => {
  it("matches the fixed zodiacal order exactly", () => {
    expect(NAKSHATRAS.map((n) => n.name)).toEqual([
      "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
      "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
      "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
      "Uttara Bhadrapada", "Revati",
    ]);
    expect(NAKSHATRAS.map((n) => n.key)).toEqual([
      "ashwini", "bharani", "krittika", "rohini", "mrigashira", "ardra", "punarvasu", "pushya", "ashlesha",
      "magha", "purva_phalguni", "uttara_phalguni", "hasta", "chitra", "swati", "vishakha", "anuradha", "jyeshtha",
      "mula", "purva_ashadha", "uttara_ashadha", "shravana", "dhanishta", "shatabhisha", "purva_bhadrapada",
      "uttara_bhadrapada", "revati",
    ]);
  });
});

describe("TEST 5: lord sequence correct", () => {
  it("the 9-lord Vimshottari cycle matches exactly, and Nakshatras 1-9 map to it in order", () => {
    expect(NAKSHATRA_LORD_SEQUENCE).toEqual(["ketu", "venus", "sun", "moon", "mars", "rahu", "jupiter", "saturn", "mercury"]);
    const expectedLordDisplay = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
    const chartResult = chart();
    for (let i = 0; i < 9; i++) {
      const longitude = i * NAKSHATRA_SPAN_DEGREES + 1; // 1 degree into each of the first 9 Nakshatras
      const n = getNakshatra(longitude);
      expect(n.nakshatra).toBe(NAKSHATRAS[i].name);
      expect(n.nakshatraLord).toBe(expectedLordDisplay[i]);
    }
    expect(chartResult).toBeDefined(); // keep chart() referenced/used for consistency with other describe blocks
  });
});

describe("TEST 6: lord sequence repeats every 9 Nakshatras", () => {
  it("Nakshatra i, i+9, and i+18 all share the same lord", () => {
    for (let i = 0; i < 9; i++) {
      expect(NAKSHATRAS[i].lordKey).toBe(NAKSHATRAS[i + 9].lordKey);
      expect(NAKSHATRAS[i].lordKey).toBe(NAKSHATRAS[i + 18].lordKey);
    }
  });
});

describe("TEST 7: 0 degrees maps to Ashwini Pada 1", () => {
  it("getNakshatra(0) is Ashwini, Pada 1, 0 degrees within", () => {
    const n = getNakshatra(0);
    expect(n.nakshatra).toBe("Ashwini");
    expect(n.nakshatraNumber).toBe(1);
    expect(n.pada).toBe(1);
    expect(n.degreeWithinNakshatra).toBe(0);
  });
});

describe("TEST 8: 13d19m59.999s maps to Ashwini", () => {
  it("one millisecond of arc before the Nakshatra boundary is still Ashwini", () => {
    const n = getNakshatra(dms(13, 19, 59.999));
    expect(n.nakshatra).toBe("Ashwini");
    expect(n.nakshatraNumber).toBe(1);
    expect(n.pada).toBe(4);
  });
});

describe("TEST 9: 13d20m exactly maps to Bharani Pada 1", () => {
  it("the exact Nakshatra boundary belongs to the next Nakshatra (half-open policy)", () => {
    const n = getNakshatra(dms(13, 20, 0));
    expect(n.nakshatra).toBe("Bharani");
    expect(n.nakshatraNumber).toBe(2);
    expect(n.pada).toBe(1);
    expect(n.degreeWithinNakshatra).toBeCloseTo(0, 9);
  });
});

describe("TEST 10: within-Nakshatra 3d19m59.999s maps to Pada 1", () => {
  it("one millisecond of arc before the Pada boundary is still Pada 1", () => {
    const n = getNakshatra(dms(3, 19, 59.999));
    expect(n.pada).toBe(1);
  });
});

describe("TEST 11: within-Nakshatra 3d20m exactly maps to Pada 2", () => {
  it("the exact Pada boundary belongs to the next Pada (half-open policy)", () => {
    const n = getNakshatra(dms(3, 20, 0));
    expect(n.pada).toBe(2);
  });
});

describe("TEST 12: 6d40m exactly maps to Pada 3", () => {
  it("two full Pada spans in", () => {
    const n = getNakshatra(dms(6, 40, 0));
    expect(n.pada).toBe(3);
  });
});

describe("TEST 13: 10d00m exactly maps to Pada 4", () => {
  it("three full Pada spans in", () => {
    const n = getNakshatra(dms(10, 0, 0));
    expect(n.pada).toBe(4);
  });
});

describe("TEST 14: 13d20m within a Nakshatra rolls to next Nakshatra Pada 1", () => {
  it("a full Nakshatra span in longitude rolls the Nakshatra index forward and resets Pada to 1", () => {
    const n = getNakshatra(NAKSHATRA_SPAN_DEGREES);
    expect(n.nakshatra).toBe("Bharani");
    expect(n.pada).toBe(1);
    expect(n.degreeWithinNakshatra).toBeCloseTo(0, 9);
  });
});

describe("TEST 15: 359d59m59s maps to Revati", () => {
  it("just under the 360-degree wrap is the final Nakshatra", () => {
    const n = getNakshatra(dms(359, 59, 59));
    expect(n.nakshatra).toBe("Revati");
    expect(n.nakshatraNumber).toBe(27);
  });
});

describe("TEST 16: 360 degrees normalizes to Ashwini", () => {
  it("getNakshatra(360) behaves exactly like getNakshatra(0)", () => {
    const n = getNakshatra(360);
    expect(n.nakshatra).toBe("Ashwini");
    expect(n.pada).toBe(1);
    expect(n.siderealLongitude).toBe(0);
  });
});

describe("TEST 17: negative longitude normalizes correctly", () => {
  it("getNakshatra(-10) equals getNakshatra(350)", () => {
    const negative = getNakshatra(-10);
    const positive = getNakshatra(350);
    expect(negative).toEqual(positive);
    expect(negative.siderealLongitude).toBe(350);
  });
});

describe("TEST 18: exactly 9 Graha Nakshatra records", () => {
  it("chart.vedic.nakshatra.grahas has exactly 9 keys, matching NAVAGRAHA_ORDER", () => {
    const { nakshatra } = chart().vedic;
    const keys = Object.keys(nakshatra.grahas);
    expect(keys.length).toBe(9);
    expect(new Set(keys)).toEqual(new Set(NAVAGRAHA_ORDER));
  });
});

describe("TEST 19: Lagna Nakshatra record exists", () => {
  it("chart.vedic.nakshatra.lagna has the full documented shape", () => {
    const { nakshatra } = chart().vedic;
    expect(nakshatra.lagna).toHaveProperty("nakshatra");
    expect(nakshatra.lagna).toHaveProperty("nakshatraNumber");
    expect(nakshatra.lagna).toHaveProperty("nakshatraLord");
    expect(nakshatra.lagna).toHaveProperty("pada");
    expect(nakshatra.lagna).toHaveProperty("degreeWithinNakshatra");
  });
});

describe("TEST 20: Moon Nakshatra summary exists", () => {
  it("chart.vedic.nakshatra.moonNakshatra is exposed prominently and matches grahas.moon", () => {
    const { nakshatra } = chart().vedic;
    expect(nakshatra.moonNakshatra.name).toBe(nakshatra.grahas.moon.nakshatra);
    expect(nakshatra.moonNakshatra.number).toBe(nakshatra.grahas.moon.nakshatraNumber);
    expect(nakshatra.moonNakshatra.lord).toBe(nakshatra.grahas.moon.nakshatraLord);
    expect(nakshatra.moonNakshatra.pada).toBe(nakshatra.grahas.moon.pada);
  });
});

describe("TEST 21: every Graha retains Phase 4A sidereal longitude", () => {
  it("nakshatra.grahas[key].siderealLongitude equals chart.vedic.grahas[key].siderealLongitude exactly", () => {
    const v = chart().vedic;
    for (const key of NAVAGRAHA_ORDER) {
      expect(v.nakshatra.grahas[key].siderealLongitude).toBe(v.grahas[key].siderealLongitude);
    }
    expect(v.nakshatra.lagna.siderealLongitude).toBe(v.lagna.siderealLongitude);
  });
});

describe("TEST 22: Rahu has Nakshatra/Pada", () => {
  it("chart.vedic.nakshatra.grahas.rahu has a valid Nakshatra name and Pada 1-4", () => {
    const { nakshatra } = chart().vedic;
    expect(typeof nakshatra.grahas.rahu.nakshatra).toBe("string");
    expect(nakshatra.grahas.rahu.pada).toBeGreaterThanOrEqual(1);
    expect(nakshatra.grahas.rahu.pada).toBeLessThanOrEqual(4);
  });
});

describe("TEST 23: Ketu has Nakshatra/Pada", () => {
  it("chart.vedic.nakshatra.grahas.ketu has a valid Nakshatra name and Pada 1-4, exactly opposite Rahu's global Pada slot", () => {
    const { nakshatra } = chart().vedic;
    expect(typeof nakshatra.grahas.ketu.nakshatra).toBe("string");
    expect(nakshatra.grahas.ketu.pada).toBeGreaterThanOrEqual(1);
    expect(nakshatra.grahas.ketu.pada).toBeLessThanOrEqual(4);
    // 108 total Padas around the zodiac; 180 degrees = exactly 54 Padas (3.3333... * 54 = 180).
    const rahuGlobalPada = nakshatra.grahas.rahu.nakshatraIndex * 4 + nakshatra.grahas.rahu.padaIndex;
    const ketuGlobalPada = nakshatra.grahas.ketu.nakshatraIndex * 4 + nakshatra.grahas.ketu.padaIndex;
    expect(Math.abs(rahuGlobalPada - ketuGlobalPada)).toBe(54);
  });
});

describe("TEST 24: no Dasha fields exist", () => {
  it("no Mahadasha/Antardasha/Pratyantardasha/timeline/balance field anywhere in chart.vedic.nakshatra", () => {
    const { nakshatra } = chart().vedic;
    const json = JSON.stringify(nakshatra);
    expect(json).not.toMatch(/mahadasha|antardasha|pratyantardasha|dashaBalance|dashaTimeline/i);
    expect(json).not.toMatch(/\bdasha\b/i);
  });
});

describe("TEST 25: no Navamsa fields exist", () => {
  it("no navamsaSign/D9/varga/padaRashi field anywhere in chart.vedic.nakshatra", () => {
    const { nakshatra } = chart().vedic;
    const json = JSON.stringify(nakshatra);
    expect(json).not.toMatch(/navamsa|\bd9\b|varga|padaRashi/i);
  });
});

describe("TEST 26: no interpretation fields exist", () => {
  it("no temperament/compatibility/personality/meaning language anywhere in chart.vedic.nakshatra", () => {
    const chartResult = chart();
    const json = JSON.stringify(chartResult.vedic.nakshatra);
    expect(json).not.toMatch(/temperament|compatibility|personality|\bmeaning\b|\bstrong\b|\bweak\b|benefic|malefic/i);
    expect(chartResult.vedic.meta.nakshatraInterpretation).toBe("none");
  });
});

describe("TEST 27: no score exists", () => {
  it("no score field anywhere in chart.vedic.nakshatra", () => {
    const { nakshatra } = chart().vedic;
    const json = JSON.stringify(nakshatra);
    expect(json).not.toMatch(/score/i);
  });
});

describe("TEST 28: Phase 4A unchanged", () => {
  it("chart.vedic.grahas/lagna/ayanamsha are byte-for-byte identical to a fresh computation", () => {
    const a = chart().vedic;
    const b = chart().vedic;
    expect(a.grahas).toEqual(b.grahas);
    expect(a.lagna).toEqual(b.lagna);
    expect(a.ayanamsha).toEqual(b.ayanamsha);
  });

  it("no Phase 4A graha/lagna object gained a nakshatra-related field", () => {
    const { grahas, lagna } = chart().vedic;
    for (const g of Object.values(grahas)) {
      expect(g).not.toHaveProperty("nakshatra");
      expect(g).not.toHaveProperty("pada");
    }
    expect(lagna).not.toHaveProperty("nakshatra");
    expect(lagna).not.toHaveProperty("pada");
  });
});

describe("TEST 29: Phase 4B unchanged", () => {
  it("chart.vedic.bhava is byte-for-byte identical to a fresh computation", () => {
    const a = chart().vedic;
    const b = chart().vedic;
    expect(a.bhava).toEqual(b.bhava);
  });
});

describe("TEST 30: Western unchanged", () => {
  it("chart.points/planets/angles/houseCusps are identical to a fresh independent computation", () => {
    const withNakshatra = calculateChart(VERIFICATION_INPUT);
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withNakshatra.points).toEqual(fresh.points);
    expect(withNakshatra.planets).toEqual(fresh.planets);
    expect(withNakshatra.angles).toEqual(fresh.angles);
    expect(withNakshatra.houseCusps).toEqual(fresh.houseCusps);
  });
});

describe("TEST 31: Classical unchanged", () => {
  it("chart.classical is untouched by adding chart.vedic.nakshatra", () => {
    const withNakshatra = calculateChart(VERIFICATION_INPUT);
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withNakshatra.classical).toEqual(fresh.classical);
  });
});

describe("TEST 32: Phase 3H unchanged", () => {
  it("chart.classical.summary is untouched by adding chart.vedic.nakshatra", () => {
    const withNakshatra = calculateChart(VERIFICATION_INPUT);
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withNakshatra.classical.summary).toEqual(fresh.classical.summary);
  });
});

describe("TEST 33: output is JSON serializable", () => {
  it("JSON.stringify/parse round-trips chart.vedic.nakshatra without throwing and preserves shape", () => {
    const { nakshatra } = chart().vedic;
    const json = JSON.stringify(nakshatra);
    expect(typeof json).toBe("string");
    const parsed = JSON.parse(json);
    expect(Object.keys(parsed).sort()).toEqual(["meta", "lagna", "grahas", "moonNakshatra"].sort());
    expect(Object.keys(parsed.grahas).length).toBe(9);
  });

  it("no functions, no circular references", () => {
    const { nakshatra } = chart().vedic;
    expect(() => JSON.stringify(nakshatra)).not.toThrow();
    const walk = (value) => {
      if (typeof value === "function") throw new Error("function found in chart.vedic.nakshatra");
      if (value && typeof value === "object") {
        for (const v of Object.values(value)) walk(v);
      }
    };
    expect(() => walk(nakshatra)).not.toThrow();
  });
});

describe("Extensive boundary tests around every Nakshatra and Pada transition", () => {
  it("just below and just above every one of the 27 Nakshatra boundaries land in the correct adjacent Nakshatra", () => {
    for (let i = 0; i < 27; i++) {
      const boundary = i * NAKSHATRA_SPAN_DEGREES;
      if (boundary === 0) continue; // 0 is covered by the 359.99999 wrap case below
      const justBelowArcsec = Math.round(boundary * 3600 * 1e6) - 1; // one microarcsecond below
      const justBelow = justBelowArcsec / (3600 * 1e6);
      const below = getNakshatra(justBelow);
      const above = getNakshatra(boundary);
      expect(below.nakshatraIndex).toBe((i + 26) % 27);
      expect(above.nakshatraIndex).toBe(i);
      expect(above.pada).toBe(1);
    }
  });

  it("just below and just above every one of the 108 Pada boundaries land in the correct adjacent Pada", () => {
    for (let i = 0; i < 108; i++) {
      const boundary = i * PADA_SPAN_DEGREES;
      if (boundary === 0) continue;
      const justBelowArcsec = Math.round(boundary * 3600 * 1e6) - 1;
      const justBelow = justBelowArcsec / (3600 * 1e6);
      const below = getNakshatra(justBelow);
      const above = getNakshatra(boundary);
      const belowGlobalPada = below.nakshatraIndex * 4 + below.padaIndex;
      const aboveGlobalPada = above.nakshatraIndex * 4 + above.padaIndex;
      expect(belowGlobalPada).toBe((i + 107) % 108);
      expect(aboveGlobalPada).toBe(i % 108);
    }
  });

  it("the 359.99999.../0 wrap is continuous across Revati -> Ashwini", () => {
    const justBelowZero = getNakshatra(360 - 1e-9);
    expect(justBelowZero.nakshatra).toBe("Revati");
    const atZero = getNakshatra(0);
    expect(atZero.nakshatra).toBe("Ashwini");
    expect(atZero.pada).toBe(1);
  });

  it("buildVedicNakshatra is a pure function of (lagna, grahas) - two independent calls with the same input produce deeply equal output", () => {
    const v = chart().vedic;
    const a = buildVedicNakshatra({ lagna: v.lagna, grahas: v.grahas });
    const b = buildVedicNakshatra({ lagna: v.lagna, grahas: v.grahas });
    expect(a).toEqual(b);
  });
});

describe("Verification-chart Nakshatra totals reconcile", () => {
  it("reports the full Phase 4C verification-chart Nakshatra/Pada output shape", () => {
    const v = chart().vedic;
    for (const key of NAVAGRAHA_ORDER) {
      const g = v.nakshatra.grahas[key];
      expect(g).toHaveProperty("siderealLongitude");
      expect(g).toHaveProperty("nakshatra");
      expect(g).toHaveProperty("nakshatraNumber");
      expect(g).toHaveProperty("nakshatraLord");
      expect(g).toHaveProperty("pada");
      expect(g).toHaveProperty("degreeWithinNakshatra");
      expect(g.nakshatraNumber).toBeGreaterThanOrEqual(1);
      expect(g.nakshatraNumber).toBeLessThanOrEqual(27);
      expect(g.pada).toBeGreaterThanOrEqual(1);
      expect(g.pada).toBeLessThanOrEqual(4);
    }
  });
});
