import { describe, it, expect } from "vitest";
import { calculateChart } from "../../astrology/ephemeris.js";
import { computeChartFingerprint, deriveCalculationProfile, deriveCalculationVersionProfile } from "../fingerprint.js";
import { ASTROLOGY_CALCULATION_GENERATION } from "../../astrology/calculationGeneration.js";

const VERIFICATION_INPUT = {
  birthDate: "1994-11-21",
  birthTime: "01:44:00",
  latitude: 1.8548,
  longitude: 102.9325,
  utcOffset: "+08:00",
  houseSystem: "placidus",
};

function chart(overrides = {}) {
  return calculateChart({ ...VERIFICATION_INPUT, ...overrides });
}

const birthData = { date: "1994-11-21", time: "01:44:00", placeName: "Batu Pahat, Johor, Malaysia", latitude: 1.8548, longitude: 102.9325, timezone: "+08:00" };

describe("Phase 7 fingerprint: B. deterministic and input-sensitive", () => {
  it("is deterministic for identical chart input (same run twice)", () => {
    const c1 = chart();
    const c2 = chart();
    expect(computeChartFingerprint(birthData, c1)).toBe(computeChartFingerprint(birthData, c2));
  });

  it("does not change when only an unrelated field (e.g. a caseName-like label passed alongside) changes", () => {
    const c = chart();
    const fpA = computeChartFingerprint(birthData, c);
    const fpB = computeChartFingerprint({ ...birthData, placeName: "A totally different label" }, c);
    expect(fpA).toBe(fpB); // placeName is not a fingerprint input
  });

  it("changes when birth time changes", () => {
    const c1 = chart();
    const c2 = chart({ birthTime: "02:00:00" });
    const fp1 = computeChartFingerprint(birthData, c1);
    const fp2 = computeChartFingerprint({ ...birthData, time: "02:00:00" }, c2);
    expect(fp1).not.toBe(fp2);
  });

  it("changes when latitude/longitude change", () => {
    const c1 = chart();
    const c2 = chart({ latitude: 10, longitude: 20 });
    const fp1 = computeChartFingerprint(birthData, c1);
    const fp2 = computeChartFingerprint({ ...birthData, latitude: 10, longitude: 20 }, c2);
    expect(fp1).not.toBe(fp2);
  });

  it("changes when timezone/utcOffset changes", () => {
    const c1 = chart();
    const c2 = chart({ utcOffset: "+05:00" });
    const fp1 = computeChartFingerprint(birthData, c1);
    const fp2 = computeChartFingerprint({ ...birthData, timezone: "+05:00" }, c2);
    expect(fp1).not.toBe(fp2);
  });

  it("changes when a locked calculation convention identifier changes (simulated - only one house system is implemented today, so this fabricates a minimal chart-shaped object differing in one meta field to prove the fingerprint is sensitive to it)", () => {
    const c = chart();
    const fp1 = computeChartFingerprint(birthData, c);
    const c2 = { ...c, meta: { ...c.meta, houseSystem: "whole_sign_hypothetical" } };
    const fp2 = computeChartFingerprint(birthData, c2);
    expect(fp1).not.toBe(fp2);
  });

  it("changes when node type changes", () => {
    const c1 = chart({ nodeType: "true" });
    const c2 = chart({ nodeType: "mean" });
    const fp1 = computeChartFingerprint(birthData, c1);
    const fp2 = computeChartFingerprint(birthData, c2);
    expect(fp1).not.toBe(fp2);
  });

  it("changes when Lilith type changes", () => {
    const c1 = chart({ lilithType: "mean" });
    const c2 = chart({ lilithType: "osculating" });
    const fp1 = computeChartFingerprint(birthData, c1);
    const fp2 = computeChartFingerprint(birthData, c2);
    expect(fp1).not.toBe(fp2);
  });

  it("deriveCalculationProfile reads already-locked convention identifiers verbatim off the chart, never inventing new ones", () => {
    const c = chart();
    const profile = deriveCalculationProfile(c);
    expect(profile.westernZodiac).toBe(c.meta.zodiacType);
    expect(profile.westernHouseSystem).toBe(c.meta.houseSystem);
    expect(profile.classicalRulershipSystem).toBe(c.classical.meta.rulershipSystem);
    expect(profile.vedicAyanamsha).toBe(c.vedic.meta.ayanamshaImplementation);
    expect(profile.vedicBhavaSystem).toBe(c.vedic.meta.bhavaSystem);
  });

  it("is a plain, JSON-serializable string, using the v2 payload prefix", () => {
    const c = chart();
    const fp = computeChartFingerprint(birthData, c);
    expect(typeof fp).toBe("string");
    expect(fp.startsWith("fp2_")).toBe(true);
    expect(() => JSON.stringify({ fp })).not.toThrow();
  });
});

describe("Phase 7 pre-lock audit fix: calculation-generation identity in the fingerprint", () => {
  it("deriveCalculationVersionProfile reads astrologyCalculationGeneration off chart.meta and topicRetrievalVersion off chart.topicRetrieval.meta", () => {
    const c = chart();
    const versionProfile = deriveCalculationVersionProfile(c);
    expect(versionProfile.astrologyCalculationGeneration).toBe(c.meta.astrologyCalculationGeneration);
    expect(versionProfile.astrologyCalculationGeneration).toBe(ASTROLOGY_CALCULATION_GENERATION);
    expect(versionProfile.topicRetrievalVersion).toBe(c.topicRetrieval.meta.topicRetrievalVersion);
  });

  it("changes when astrologyCalculationGeneration changes (simulated - proves a same-convention calculation bug fix would now be detected)", () => {
    const c = chart();
    const fp1 = computeChartFingerprint(birthData, c);
    const c2 = { ...c, meta: { ...c.meta, astrologyCalculationGeneration: "astrology_calculation_generation_v2_hypothetical" } };
    const fp2 = computeChartFingerprint(birthData, c2);
    expect(fp1).not.toBe(fp2);
  });

  it("changes when topicRetrievalVersion changes (simulated - proves a Phase 6 recipe/schema generation change is detected)", () => {
    const c = chart();
    const fp1 = computeChartFingerprint(birthData, c);
    const c2 = { ...c, topicRetrieval: { ...c.topicRetrieval, meta: { ...c.topicRetrieval.meta, topicRetrievalVersion: "phase_6_v2_hypothetical" } } };
    const fp2 = computeChartFingerprint(birthData, c2);
    expect(fp1).not.toBe(fp2);
  });

  it("does NOT include chart.classical.meta.technicalSummaryVersion, chart.vedic.meta.technicalSummaryVersion, or chart.crossSystem.meta.crossSystemVersion as redundant proxies", () => {
    const c = chart();
    const versionProfile = deriveCalculationVersionProfile(c);
    expect(Object.keys(versionProfile).sort()).toEqual(["astrologyCalculationGeneration", "topicRetrievalVersion"]);
  });
});
