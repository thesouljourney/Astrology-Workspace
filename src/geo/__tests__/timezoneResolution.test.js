import { describe, it, expect } from "vitest";
import { resolveUtcOffsetForZone, formatOffsetMinutes, isTimezoneResolutionSupported } from "../timezoneResolution.js";

describe("timezoneResolution", () => {
  it("this runtime supports longOffset resolution", () => {
    expect(isTimezoneResolutionSupported()).toBe(true);
  });

  it("resolves the golden verification chart's zone/date to +08:00 (never today's offset)", () => {
    const result = resolveUtcOffsetForZone("Asia/Kuala_Lumpur", "1994-11-21", "01:44:00");
    expect(result.offsetString).toBe("+08:00");
    expect(result.offsetMinutes).toBe(480);
  });

  it("resolves a historical Malaysia date predating the modern +08:00 unification (pre-1982) to a different offset", () => {
    // Peninsular Malaysia used +07:30 before 1 Jan 1982.
    const result = resolveUtcOffsetForZone("Asia/Kuala_Lumpur", "1980-06-15", "12:00:00");
    expect(result.offsetString).not.toBe("+08:00");
  });

  it("resolves a US Eastern summer date to DST (-04:00), not standard (-05:00)", () => {
    const result = resolveUtcOffsetForZone("America/New_York", "2000-07-04", "12:00:00");
    expect(result.offsetString).toBe("-04:00");
  });

  it("resolves a US Eastern winter date to standard time (-05:00)", () => {
    const result = resolveUtcOffsetForZone("America/New_York", "2000-01-04", "12:00:00");
    expect(result.offsetString).toBe("-05:00");
  });

  it("resolves a half-hour offset zone correctly", () => {
    const result = resolveUtcOffsetForZone("Asia/Kolkata", "2000-06-15", "12:00:00");
    expect(result.offsetString).toBe("+05:30");
  });

  it("resolves the UTC zone to exactly +00:00 (regression: some engines render zero offset as bare \"GMT\", not \"GMT+00:00\")", () => {
    const result = resolveUtcOffsetForZone("UTC", "2000-01-01", "00:00:00");
    expect(result.offsetString).toBe("+00:00");
    expect(result.offsetMinutes).toBe(0);
  });

  it("returns null for an unrecognized IANA zone (fallback to manual entry)", () => {
    expect(resolveUtcOffsetForZone("Not/AZone", "2000-01-01", "00:00")).toBeNull();
  });

  it("returns null for malformed date/time input", () => {
    expect(resolveUtcOffsetForZone("Asia/Kuala_Lumpur", "not-a-date", "01:44:00")).toBeNull();
    expect(resolveUtcOffsetForZone("Asia/Kuala_Lumpur", "1994-11-21", "not-a-time")).toBeNull();
  });

  it("formatOffsetMinutes formats positive and negative offsets", () => {
    expect(formatOffsetMinutes(480)).toBe("+08:00");
    expect(formatOffsetMinutes(-330)).toBe("-05:30");
    expect(formatOffsetMinutes(0)).toBe("+00:00");
  });
});
