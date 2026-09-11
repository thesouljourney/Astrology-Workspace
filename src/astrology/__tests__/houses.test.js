import { describe, it, expect } from "vitest";
import { getHouseForLongitude } from "../houses.js";

describe("TEST 5: House wraparound calculation", () => {
  // House 12 cusp = 350 degrees, House 1 (ASC) cusp = 20 degrees, so house 12
  // spans the 0/360 boundary. A naive `min < lon < max` comparison would fail
  // to place 355 degrees (or 0, or 10) into house 12.
  const cusps = [
    20, // house 1 (ASC)
    50, // house 2
    80, // house 3
    110, // house 4 (IC)
    140, // house 5
    170, // house 6
    200, // house 7 (DESC)
    230, // house 8
    260, // house 9
    290, // house 10 (MC)
    320, // house 11
    350, // house 12
  ];

  it("places 355 degrees (past the 0/360 wrap) into house 12", () => {
    expect(getHouseForLongitude(355, cusps)).toBe(12);
  });

  it("places 0 degrees into house 12", () => {
    expect(getHouseForLongitude(0, cusps)).toBe(12);
  });

  it("places 10 degrees into house 12", () => {
    expect(getHouseForLongitude(10, cusps)).toBe(12);
  });

  it("places 20 degrees (exactly on the ASC cusp) into house 1", () => {
    expect(getHouseForLongitude(20, cusps)).toBe(1);
  });

  it("places 25 degrees into house 1", () => {
    expect(getHouseForLongitude(25, cusps)).toBe(1);
  });

  it("places every non-wrapping house correctly", () => {
    expect(getHouseForLongitude(60, cusps)).toBe(2);
    expect(getHouseForLongitude(100, cusps)).toBe(3);
    expect(getHouseForLongitude(150, cusps)).toBe(5);
    expect(getHouseForLongitude(300, cusps)).toBe(10);
  });
});
