import { describe, it, expect } from "vitest";
import { calculateChart } from "../../astrology/ephemeris.js";
import { classifyDisplayGroup, groupSystemEvidence, DISPLAY_GROUPS } from "../evidenceGrouping.js";

function chart() {
  return calculateChart({
    birthDate: "1994-11-21",
    birthTime: "01:44:00",
    latitude: 1.8548,
    longitude: 102.9325,
    utcOffset: "+08:00",
    houseSystem: "placidus",
  });
}

describe("Phase 7 evidence grouping: presentation-only, no astrology semantics introduced", () => {
  it("every future_required item classifies as missing_evidence regardless of role", () => {
    const c = chart();
    const relationship = c.topicRetrieval.topics.find((t) => t.id === "relationship");
    for (const item of relationship.systems.modernWestern.futureRequired) {
      expect(classifyDisplayGroup(item)).toBe("missing_evidence");
    }
  });

  it("every excluded item classifies as excluded regardless of role", () => {
    const c = chart();
    const career = c.topicRetrieval.topics.find((t) => t.id === "career");
    for (const item of career.systems.classical.excluded) {
      expect(classifyDisplayGroup(item)).toBe("excluded");
    }
  });

  it("every convention_pending item classifies as convention_pending", () => {
    const c = chart();
    const parents = c.topicRetrieval.topics.find((t) => t.id === "parents");
    for (const item of parents.systems.classical.conventionPending) {
      expect(classifyDisplayGroup(item)).toBe("convention_pending");
    }
  });

  it("every contextual item classifies as structural_connections regardless of triggered state", () => {
    const c = chart();
    const career = c.topicRetrieval.topics.find((t) => t.id === "career");
    for (const item of career.systems.classical.contextual) {
      expect(classifyDisplayGroup(item)).toBe("structural_connections");
    }
  });

  it("classification never mutates the item or changes its availability", () => {
    const c = chart();
    const self = c.topicRetrieval.topics.find((t) => t.id === "self_core_nature");
    const item = self.systems.modernWestern.primary[0];
    const before = JSON.stringify(item);
    classifyDisplayGroup(item);
    expect(JSON.stringify(item)).toBe(before);
  });

  it("groupSystemEvidence never fabricates a group with zero items", () => {
    const c = chart();
    const siblings = c.topicRetrieval.topics.find((t) => t.id === "siblings");
    const grouped = groupSystemEvidence(siblings.systems.modernWestern);
    for (const [group, items] of Object.entries(grouped)) {
      expect(DISPLAY_GROUPS).toContain(group);
      expect(items.length).toBeGreaterThan(0);
    }
  });

  it("groupSystemEvidence covers every item in the bundle exactly once", () => {
    const c = chart();
    const wealth = c.topicRetrieval.topics.find((t) => t.id === "wealth");
    const bundle = wealth.systems.vedic;
    const totalInput = bundle.primary.length + bundle.secondary.length + bundle.contextual.length + bundle.futureRequired.length + bundle.excluded.length + bundle.conventionPending.length;
    const grouped = groupSystemEvidence(bundle);
    const totalGrouped = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);
    expect(totalGrouped).toBe(totalInput);
  });
});
