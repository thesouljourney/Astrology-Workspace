import { describe, it, expect } from "vitest";
import { convertLocalBirthTimeToUTC, calculateJulianDay } from "../time.js";

describe("TEST 1: Local time -> UTC conversion", () => {
  it("converts 1994-11-21 01:44 UTC+8 to 1994-11-20 17:44 UTC", () => {
    const utc = convertLocalBirthTimeToUTC("1994-11-21", "01:44:00", "+08:00");
    expect(utc.getUTCFullYear()).toBe(1994);
    expect(utc.getUTCMonth()).toBe(10); // 0-indexed: November
    expect(utc.getUTCDate()).toBe(20);
    expect(utc.getUTCHours()).toBe(17);
    expect(utc.getUTCMinutes()).toBe(44);
    expect(utc.getUTCSeconds()).toBe(0);
  });

  it("handles negative UTC offsets", () => {
    const utc = convertLocalBirthTimeToUTC("2000-01-01", "00:30:00", "-05:00");
    expect(utc.getUTCFullYear()).toBe(2000);
    expect(utc.getUTCMonth()).toBe(0);
    expect(utc.getUTCDate()).toBe(1);
    expect(utc.getUTCHours()).toBe(5);
    expect(utc.getUTCMinutes()).toBe(30);
  });

  it("handles half-hour offsets", () => {
    const utc = convertLocalBirthTimeToUTC("2000-01-01", "12:00:00", "+05:30");
    expect(utc.getUTCHours()).toBe(6);
    expect(utc.getUTCMinutes()).toBe(30);
  });
});

describe("Julian Day calculation", () => {
  it("matches the well-known JD for 2000-01-01 12:00 UTC (J2000.0 = 2451545.0)", () => {
    const jd = calculateJulianDay(new Date(Date.UTC(2000, 0, 1, 12, 0, 0)));
    expect(jd).toBeCloseTo(2451545.0, 5);
  });

  it("matches the known JD for 1994-11-20 17:44 UTC", () => {
    const jd = calculateJulianDay(new Date(Date.UTC(1994, 10, 20, 17, 44, 0)));
    // Cross-checked against a standard Julian Day calculator.
    expect(jd).toBeCloseTo(2449677.239, 3);
  });
});
