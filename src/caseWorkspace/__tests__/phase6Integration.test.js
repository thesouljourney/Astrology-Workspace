import { describe, it, expect } from "vitest";
import { calculateChart } from "../../astrology/ephemeris.js";
import { computeCaseChart } from "../caseChart.js";
import { PHASE6_TOPIC_IDS } from "../noteModel.js";
import { groupSystemEvidence } from "../evidenceGrouping.js";

const birthData = { date: "1994-11-21", time: "01:44:00", placeName: "Batu Pahat, Johor, Malaysia", latitude: 1.8548, longitude: 102.9325, timezone: "+08:00" };
const calculationProfile = { westernHouseSystem: "placidus", westernNodeType: "true", westernLilithType: "mean" };

function directChart() {
  return calculateChart({
    birthDate: birthData.date,
    birthTime: birthData.time,
    latitude: birthData.latitude,
    longitude: birthData.longitude,
    utcOffset: birthData.timezone,
    houseSystem: calculationProfile.westernHouseSystem,
    nodeType: calculationProfile.westernNodeType,
    lilithType: calculationProfile.westernLilithType,
  });
}

describe("Phase 7 G. Phase 6 integration", () => {
  it("computeCaseChart() produces the exact same chart.topicRetrieval as calling calculateChart() directly - no duplicate topic-recipe engine", () => {
    const viaCase = computeCaseChart({ birthData, calculationProfile });
    const viaDirect = directChart();
    expect(viaCase.topicRetrieval).toEqual(viaDirect.topicRetrieval);
  });

  it("all eight locked Phase 6 topic IDs are present and match PHASE6_TOPIC_IDS exactly", () => {
    const chart = computeCaseChart({ birthData, calculationProfile });
    const topicIds = chart.topicRetrieval.topics.map((t) => t.id);
    expect(topicIds).toEqual(PHASE6_TOPIC_IDS);
  });

  it("for every topic, groupSystemEvidence() consumes Phase 6 evidence without altering availability states", () => {
    const chart = computeCaseChart({ birthData, calculationProfile });
    for (const topic of chart.topicRetrieval.topics) {
      for (const systemKey of ["modernWestern", "classical", "vedic"]) {
        const bundle = topic.systems[systemKey];
        const grouped = groupSystemEvidence(bundle);
        const flat = Object.values(grouped).flat();
        for (const item of flat) {
          expect(["available", "contextual_available", "future_required", "excluded", "convention_pending"]).toContain(item.availability);
        }
      }
    }
  });

  it("future_required stays future_required after Phase 7 grouping (never silently resolved)", () => {
    const chart = computeCaseChart({ birthData, calculationProfile });
    const relationship = chart.topicRetrieval.topics.find((t) => t.id === "relationship");
    const grouped = groupSystemEvidence(relationship.systems.modernWestern);
    for (const item of grouped.missing_evidence) {
      expect(item.availability).toBe("future_required");
      expect(item.value).toBeNull();
    }
  });

  it("convention_pending stays convention_pending after Phase 7 grouping", () => {
    const chart = computeCaseChart({ birthData, calculationProfile });
    const parents = chart.topicRetrieval.topics.find((t) => t.id === "parents");
    const grouped = groupSystemEvidence(parents.systems.classical);
    expect(grouped.convention_pending.length).toBeGreaterThan(0);
    for (const item of grouped.convention_pending) {
      expect(item.availability).toBe("convention_pending");
    }
  });

  it("excluded evidence never becomes interpretation evidence (still availability: excluded, value: null)", () => {
    const chart = computeCaseChart({ birthData, calculationProfile });
    for (const topic of chart.topicRetrieval.topics) {
      const grouped = groupSystemEvidence(topic.systems.classical);
      for (const item of grouped.excluded ?? []) {
        expect(item.availability).toBe("excluded");
        expect(item.value).toBeNull();
      }
    }
  });
});

describe("Phase 7 H. Parents", () => {
  it("preserves the three locked system-specific conventions exactly", () => {
    const chart = computeCaseChart({ birthData, calculationProfile });
    const parents = chart.topicRetrieval.topics.find((t) => t.id === "parents");
    expect(parents.systems.modernWestern.conventions.parentalAxis).toBe("modern_h4_mother_h10_father");
    expect(parents.systems.classical.conventions.houseConvention).toBe("traditional_lilly_h4_father_h10_mother");
    expect(parents.systems.vedic.conventions.selectedConvention).toBe("selected_jyotish_h4_mother_h9_father");
  });

  it("Classical maternal natural significator remains convention_pending", () => {
    const chart = computeCaseChart({ birthData, calculationProfile });
    const parents = chart.topicRetrieval.topics.find((t) => t.id === "parents");
    const pending = parents.systems.classical.conventionPending.find((i) => i.evidenceId === "traditional_maternal_natural_significator");
    expect(pending).toBeTruthy();
    expect(pending.availability).toBe("convention_pending");
  });

  it("Modern Western: mother uses H4, father uses H10 (not normalized to Classical/Vedic conventions)", () => {
    const chart = computeCaseChart({ birthData, calculationProfile });
    const parents = chart.topicRetrieval.topics.find((t) => t.id === "parents");
    const western = parents.systems.modernWestern;
    expect(western.subdomains.mother.house).toBe(4);
    expect(western.subdomains.father.house).toBe(10);
  });

  it("Classical: father uses H4, mother uses H10 (deliberately the opposite of Modern Western)", () => {
    const chart = computeCaseChart({ birthData, calculationProfile });
    const parents = chart.topicRetrieval.topics.find((t) => t.id === "parents");
    const classical = parents.systems.classical;
    expect(classical.subdomains.father.house).toBe(4);
    expect(classical.subdomains.mother.house).toBe(10);
  });

  it("Vedic: mother uses Bhava 4, father uses Bhava 9", () => {
    const chart = computeCaseChart({ birthData, calculationProfile });
    const parents = chart.topicRetrieval.topics.find((t) => t.id === "parents");
    const vedic = parents.systems.vedic;
    expect(vedic.subdomains.mother.bhava).toBe(4);
    expect(vedic.subdomains.father.bhava).toBe(9);
  });
});

describe("Phase 7 I. Inner Shadow", () => {
  it("Classical and Vedic conceptStatus remain cross_framework_relevant_evidence_only", () => {
    const chart = computeCaseChart({ birthData, calculationProfile });
    const innerShadow = chart.topicRetrieval.topics.find((t) => t.id === "inner_shadow");
    expect(innerShadow.systems.classical.conceptStatus).toBe("cross_framework_relevant_evidence_only");
    expect(innerShadow.systems.vedic.conceptStatus).toBe("cross_framework_relevant_evidence_only");
  });

  it("Modern Western is labeled as a genuine modern psychological topic, not shared doctrine", () => {
    const chart = computeCaseChart({ birthData, calculationProfile });
    const innerShadow = chart.topicRetrieval.topics.find((t) => t.id === "inner_shadow");
    expect(innerShadow.systems.modernWestern.conceptStatus).toBe("modern_psychological_framing");
  });

  it("no evidence label anywhere in Inner Shadow encodes a fixed psychological equation (Pluto=trauma, Rahu=shadow, etc.)", () => {
    const chart = computeCaseChart({ birthData, calculationProfile });
    const innerShadow = chart.topicRetrieval.topics.find((t) => t.id === "inner_shadow");
    const allLabels = [];
    for (const systemKey of ["modernWestern", "classical", "vedic"]) {
      for (const bucket of ["primary", "secondary", "contextual", "futureRequired", "excluded", "conventionPending"]) {
        for (const item of innerShadow.systems[systemKey][bucket]) {
          allLabels.push(item.label.en, item.label.zh);
        }
      }
    }
    const joined = allLabels.join(" ");
    // Fixed psychological equations (the banned pattern) always take the
    // form "X = Y" or "X: Y" - the CORRECT disclaiming phrasing used by
    // this project ("relevant evidence, not a shadow doctrine") contains
    // none of that shape, so checking for the equation form specifically
    // (rather than banning the word "shadow" outright) cannot be
    // confused with the disclaimer that is supposed to be there.
    expect(joined).not.toMatch(/pluto\s*[=:]\s*trauma/i);
    expect(joined).not.toMatch(/rahu\s*[=:]\s*shadow/i);
    expect(joined).not.toMatch(/ketu\s*[=:]\s*past-life shadow/i);
    expect(joined).not.toMatch(/h(ouse)?\s*12\s*[=:]\s*self-sabotage/i);
    expect(joined).not.toMatch(/lilith\s*[=:]\s*shadow/i);
    expect(joined).toMatch(/not a shadow doctrine/i); // the correct disclaimer IS present
    expect(joined).toMatch(/not a past-life-shadow doctrine/i);
  });
});

describe("Phase 7 J. No upstream mutation", () => {
  it("deep-compares upstream chart evidence before/after building and grouping the Phase 7 workspace view for all eight topics", () => {
    const chart = computeCaseChart({ birthData, calculationProfile });
    const beforePoints = JSON.parse(JSON.stringify(chart.points));
    const beforeClassical = JSON.parse(JSON.stringify(chart.classical));
    const beforeVedic = JSON.parse(JSON.stringify(chart.vedic));
    const beforeTopicRetrieval = JSON.parse(JSON.stringify(chart.topicRetrieval));

    for (const topic of chart.topicRetrieval.topics) {
      for (const systemKey of ["modernWestern", "classical", "vedic"]) {
        const grouped = groupSystemEvidence(topic.systems[systemKey]);
        // simulate a UI reading/iterating over every group, including mutating a LOCAL copy
        for (const items of Object.values(grouped)) {
          const localCopy = items.map((i) => ({ ...i }));
          localCopy.forEach((i) => {
            i.mutatedLocally = true;
          });
        }
      }
    }

    expect(chart.points).toEqual(beforePoints);
    expect(chart.classical).toEqual(beforeClassical);
    expect(chart.vedic).toEqual(beforeVedic);
    expect(chart.topicRetrieval).toEqual(beforeTopicRetrieval);
  });
});
