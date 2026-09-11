import { describe, it, expect } from "vitest";
import { EGYPTIAN_TERMS, getTermRuler } from "../rules/egyptianTerms.js";

const SIGNS = Object.keys(EGYPTIAN_TERMS);

describe("TEST 10: Egyptian Terms cover every degree with no gaps or overlaps", () => {
  it.each(SIGNS)("%s bounds are contiguous from 0 to 30 with no gaps/overlaps", (sign) => {
    const bounds = EGYPTIAN_TERMS[sign];
    expect(bounds[0].from).toBe(0);
    expect(bounds[bounds.length - 1].to).toBe(30);
    for (let i = 0; i < bounds.length - 1; i++) {
      expect(bounds[i].to).toBe(bounds[i + 1].from); // no gap, no overlap
    }
    for (const b of bounds) {
      expect(b.to).toBeGreaterThan(b.from);
    }
  });

  it("all 12 signs are present", () => {
    expect(SIGNS.length).toBe(12);
  });

  it("only the five non-luminary planets appear as term rulers (never Sun or Moon)", () => {
    const allowed = new Set(["mercury", "venus", "mars", "jupiter", "saturn"]);
    for (const sign of SIGNS) {
      for (const bound of EGYPTIAN_TERMS[sign]) {
        expect(allowed.has(bound.ruler)).toBe(true);
      }
    }
  });

  it("each planet's total degrees across the whole zodiac match the independently-cited reference totals", () => {
    const totals = { saturn: 0, jupiter: 0, mars: 0, venus: 0, mercury: 0 };
    for (const sign of SIGNS) {
      for (const b of EGYPTIAN_TERMS[sign]) {
        totals[b.ruler] += b.to - b.from;
      }
    }
    expect(totals.saturn).toBe(57);
    expect(totals.jupiter).toBe(79);
    expect(totals.mars).toBe(66);
    expect(totals.venus).toBe(82);
    expect(totals.mercury).toBe(76);
    expect(totals.saturn + totals.jupiter + totals.mars + totals.venus + totals.mercury).toBe(360);
  });
});

describe("TEST 11: Egyptian Term exact-boundary behavior (every bound transition)", () => {
  it.each(SIGNS)("%s: every internal boundary belongs to the new (later) ruler", (sign) => {
    const bounds = EGYPTIAN_TERMS[sign];
    for (let i = 0; i < bounds.length - 1; i++) {
      const boundary = bounds[i].to;
      const justBefore = boundary - 1 / 3600; // one arcsecond before
      expect(getTermRuler(sign, justBefore)).toBe(bounds[i].ruler);
      expect(getTermRuler(sign, boundary)).toBe(bounds[i + 1].ruler);
    }
  });

  it("0 deg always belongs to the sign's first term ruler", () => {
    for (const sign of SIGNS) {
      expect(getTermRuler(sign, 0)).toBe(EGYPTIAN_TERMS[sign][0].ruler);
    }
  });

  it("just under 30 deg belongs to the sign's last term ruler", () => {
    for (const sign of SIGNS) {
      const last = EGYPTIAN_TERMS[sign][EGYPTIAN_TERMS[sign].length - 1];
      expect(getTermRuler(sign, 30 - 1 / 3600)).toBe(last.ruler);
    }
  });
});
