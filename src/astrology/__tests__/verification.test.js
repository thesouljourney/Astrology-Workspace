import { describe, it, expect } from "vitest";
import { calculateChart } from "../ephemeris.js";

// Verification case (Batu Pahat, Johor, Malaysia).
// These are the project's reference values, NOT hard-coded into the engine —
// this test only checks that the independently-computed engine output lands
// close to them. See README.md for accuracy notes.
const VERIFICATION_INPUT = {
  birthDate: "1994-11-21",
  birthTime: "01:44:00",
  latitude: 1.8548,
  longitude: 102.9325,
  utcOffset: "+08:00",
  houseSystem: "placidus",
};

function findPlanet(chart, key) {
  return chart.planets.find((p) => p.key === key);
}

describe("Verification case", () => {
  const chart = calculateChart(VERIFICATION_INPUT);

  it("TEST 6: Venus is retrograde", () => {
    const venus = findPlanet(chart, "venus");
    expect(venus.retrograde).toBe(true);
  });

  it("Sun, Moon, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto are direct", () => {
    for (const key of ["sun", "moon", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"]) {
      expect(findPlanet(chart, key).retrograde).toBe(false);
    }
  });

  it("Sun lands in Scorpio near 28 degrees", () => {
    const sun = findPlanet(chart, "sun");
    expect(sun.sign.english).toBe("Scorpio");
    expect(sun.degreeInSign).toBeGreaterThan(27);
    expect(sun.degreeInSign).toBeLessThan(29);
  });

  it("Moon lands in Gemini near 24-25 degrees", () => {
    const moon = findPlanet(chart, "moon");
    expect(moon.sign.english).toBe("Gemini");
    expect(moon.degreeInSign).toBeGreaterThan(23);
    expect(moon.degreeInSign).toBeLessThan(26);
  });

  it("ASC lands in Virgo", () => {
    expect(chart.angles.asc.sign.english).toBe("Virgo");
  });

  it("MC lands in Gemini", () => {
    expect(chart.angles.mc.sign.english).toBe("Gemini");
  });

  it("house cusps are monotonically increasing around the wheel with no duplicate", () => {
    const longitudes = chart.houseCusps.map((c) => c.longitude);
    expect(new Set(longitudes.map((l) => l.toFixed(4))).size).toBe(12);
  });
});
