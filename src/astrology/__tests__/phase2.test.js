import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { calculateChart } from "../ephemeris.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = path.resolve(__dirname, "../../");

const VERIFICATION_INPUT = {
  birthDate: "1994-11-21",
  birthTime: "01:44:00",
  latitude: 1.8548,
  longitude: 102.9325,
  utcOffset: "+08:00",
  houseSystem: "placidus",
};

function findPoint(chart, id) {
  return chart.points.find((p) => p.id === id);
}

describe("Phase 2: Modern Western 26-point data model", () => {
  const chart = calculateChart(VERIFICATION_INPUT);

  it("TEST 1: DSC = ASC + 180 (normalized)", () => {
    const asc = findPoint(chart, "asc");
    const dsc = findPoint(chart, "dsc");
    expect(dsc.absoluteLongitude).toBeCloseTo((asc.absoluteLongitude + 180) % 360, 8);
  });

  it("TEST 2: IC = MC + 180 (normalized)", () => {
    const mc = findPoint(chart, "mc");
    const ic = findPoint(chart, "ic");
    expect(ic.absoluteLongitude).toBeCloseTo((mc.absoluteLongitude + 180) % 360, 8);
  });

  it("TEST 3: South Node = North Node + 180 (normalized)", () => {
    const north = findPoint(chart, "northNode");
    const south = findPoint(chart, "southNode");
    expect(south.absoluteLongitude).toBeCloseTo((north.absoluteLongitude + 180) % 360, 8);
  });

  it("TEST 4: Part of Fortune normalization — always 0 <= longitude < 360", () => {
    const pof = findPoint(chart, "partOfFortune");
    expect(pof.absoluteLongitude).toBeGreaterThanOrEqual(0);
    expect(pof.absoluteLongitude).toBeLessThan(360);
  });

  it("TEST 5a: Part of Fortune uses the night formula for a known night chart", () => {
    // 01:44 local time — Sun is below the horizon.
    const pof = findPoint(chart, "partOfFortune");
    expect(pof.meta.sect).toBe("night");
    expect(pof.meta.formulaUsed).toBe("ASC + Sun - Moon");
  });

  it("TEST 5b: Part of Fortune uses the day formula for a known day chart", () => {
    // Same date/location, local noon — Sun is well above the horizon.
    const dayChart = calculateChart({ ...VERIFICATION_INPUT, birthTime: "13:00:00" });
    const pof = findPoint(dayChart, "partOfFortune");
    expect(pof.meta.sect).toBe("day");
    expect(pof.meta.formulaUsed).toBe("ASC + Moon - Sun");
  });

  it("TEST 6: Node type is explicitly stored (true or mean), never silently mixed", () => {
    const north = findPoint(chart, "northNode");
    const south = findPoint(chart, "southNode");
    expect(["true", "mean"]).toContain(north.meta.nodeType);
    expect(south.meta.nodeType).toBe(north.meta.nodeType);

    const meanChart = calculateChart({ ...VERIFICATION_INPUT, nodeType: "mean" });
    expect(findPoint(meanChart, "northNode").meta.nodeType).toBe("mean");
  });

  it("TEST 7: Lilith convention is explicitly stored (mean/true)", () => {
    const lilith = findPoint(chart, "lilith");
    expect(["mean", "true"]).toContain(lilith.meta.lilithType);

    const trueChart = calculateChart({ ...VERIFICATION_INPUT, lilithType: "true" });
    expect(findPoint(trueChart, "lilith").meta.lilithType).toBe("true");
  });

  it("TEST 8: every non-angle, implemented point with a longitude receives a valid house 1-12", () => {
    for (const p of chart.points) {
      if (p.category === "angle") continue; // fixed boundary assignment, checked separately
      if (p.absoluteLongitude === null) continue; // not-implemented asteroids
      expect(p.house).toBeGreaterThanOrEqual(1);
      expect(p.house).toBeLessThanOrEqual(12);
      expect(Number.isInteger(p.house)).toBe(true);
    }
  });

  it("TEST 8b: angles carry their fixed boundary house (ASC=1, MC=10, DSC=7, IC=4)", () => {
    expect(findPoint(chart, "asc").house).toBe(1);
    expect(findPoint(chart, "mc").house).toBe(10);
    expect(findPoint(chart, "dsc").house).toBe(7);
    expect(findPoint(chart, "ic").house).toBe(4);
  });

  it("TEST 9: no runtime network dependency anywhere in the astrology calculation layer", () => {
    const dirsToScan = ["astrology", "utils"];
    const offenderPattern = /\bfetch\s*\(|axios|XMLHttpRequest|https?:\/\//i;
    const offenders = [];

    for (const dir of dirsToScan) {
      const fullDir = path.join(SRC_ROOT, dir);
      const walk = (d) => {
        for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
          if (entry.name === "__tests__") continue; // test scaffolding, not the calculation layer
          const full = path.join(d, entry.name);
          if (entry.isDirectory()) walk(full);
          else if (entry.isFile() && entry.name.endsWith(".js")) {
            const content = fs.readFileSync(full, "utf8");
            if (offenderPattern.test(content)) offenders.push(full);
          }
        }
      };
      walk(fullDir);
    }

    expect(offenders).toEqual([]);
  });

  it("TEST 10: existing Phase 1 verification values do not regress", () => {
    const sun = chart.planets.find((p) => p.key === "sun");
    const moon = chart.planets.find((p) => p.key === "moon");
    const venus = chart.planets.find((p) => p.key === "venus");

    expect(sun.sign.english).toBe("Scorpio");
    expect(sun.degreeInSign).toBeCloseTo(28.175, 2);
    expect(moon.sign.english).toBe("Gemini");
    expect(venus.retrograde).toBe(true);
    expect(chart.angles.asc.sign.english).toBe("Virgo");
    expect(chart.angles.mc.sign.english).toBe("Gemini");
  });

  it("asteroids are marked not-implemented, never fabricated", () => {
    const asteroidIds = ["chiron", "ceres", "pallas", "juno", "vesta", "eros"];
    for (const id of asteroidIds) {
      const p = findPoint(chart, id);
      expect(p).toBeDefined();
      expect(p.absoluteLongitude).toBeNull();
      expect(p.meta.implemented).toBe(false);
      expect(typeof p.meta.reason).toBe("string");
      expect(p.meta.reason.length).toBeGreaterThan(0);
    }
  });

  it("unified data model: every point exposes the canonical shape", () => {
    for (const p of chart.points) {
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("category");
      expect(p).toHaveProperty("englishName");
      expect(p).toHaveProperty("chineseName");
      expect(p).toHaveProperty("sourceType");
      expect(p).toHaveProperty("meta");
    }
  });
});
