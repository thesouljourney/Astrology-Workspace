import { describe, it, expect } from "vitest";
import { getZodiacSign, normalizeDegrees } from "../zodiac.js";

describe("Longitude -> Zodiac sign conversion", () => {
  it("TEST 2: 238 degrees -> Scorpio", () => {
    expect(getZodiacSign(238).sign.english).toBe("Scorpio");
  });

  it("TEST 3: 359 degrees -> Pisces", () => {
    expect(getZodiacSign(359).sign.english).toBe("Pisces");
  });

  it("TEST 4: 0 degrees -> Aries", () => {
    expect(getZodiacSign(0).sign.english).toBe("Aries");
  });

  it("computes degree-within-sign correctly", () => {
    const { sign, degreeInSign } = getZodiacSign(238.175);
    expect(sign.english).toBe("Scorpio");
    expect(degreeInSign).toBeCloseTo(28.175, 6);
  });

  it("normalizes longitudes outside [0, 360)", () => {
    expect(normalizeDegrees(-10)).toBeCloseTo(350, 10);
    expect(normalizeDegrees(370)).toBeCloseTo(10, 10);
    expect(normalizeDegrees(360)).toBeCloseTo(0, 10);
  });
});
