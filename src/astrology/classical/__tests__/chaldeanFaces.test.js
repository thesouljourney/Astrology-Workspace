import { describe, it, expect } from "vitest";
import { getFaceRuler } from "../rules/chaldeanFaces.js";

describe("TEST 12: Chaldean Faces starting sequence", () => {
  it("Aries 0 deg -> Mars", () => {
    expect(getFaceRuler("aries", 0)).toBe("mars");
  });
  it("Aries 10 deg -> Sun", () => {
    expect(getFaceRuler("aries", 10)).toBe("sun");
  });
  it("Aries 20 deg -> Venus", () => {
    expect(getFaceRuler("aries", 20)).toBe("venus");
  });
});

describe("TEST 13: Face boundary behavior", () => {
  it("9 deg 59 min 59 sec and 10 deg 00 min 00 sec return different, correct rulers", () => {
    const justBefore = 10 - 1 / 3600;
    expect(getFaceRuler("aries", justBefore)).toBe("mars");
    expect(getFaceRuler("aries", 10)).toBe("sun");
  });

  it("19 deg 59 min 59 sec and 20 deg 00 min 00 sec return different, correct rulers", () => {
    const justBefore = 20 - 1 / 3600;
    expect(getFaceRuler("aries", justBefore)).toBe("sun");
    expect(getFaceRuler("aries", 20)).toBe("venus");
  });
});

describe("Full 36-decan table matches the independently cross-checked reference", () => {
  const expected = {
    aries: ["mars", "sun", "venus"],
    taurus: ["mercury", "moon", "saturn"],
    gemini: ["jupiter", "mars", "sun"],
    cancer: ["venus", "mercury", "moon"],
    leo: ["saturn", "jupiter", "mars"],
    virgo: ["sun", "venus", "mercury"],
    libra: ["moon", "saturn", "jupiter"],
    scorpio: ["mars", "sun", "venus"],
    sagittarius: ["mercury", "moon", "saturn"],
    capricorn: ["jupiter", "mars", "sun"],
    aquarius: ["venus", "mercury", "moon"],
    pisces: ["saturn", "jupiter", "mars"],
  };

  it.each(Object.entries(expected))("%s decans match [%s]", (sign, rulers) => {
    expect(getFaceRuler(sign, 0)).toBe(rulers[0]);
    expect(getFaceRuler(sign, 10)).toBe(rulers[1]);
    expect(getFaceRuler(sign, 20)).toBe(rulers[2]);
  });
});
