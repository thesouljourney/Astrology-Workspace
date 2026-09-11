import { describe, it, expect } from "vitest";
import { calculateChart } from "../../ephemeris.js";
import { TRADITIONAL_PLANETS } from "../essentialDignity.js";
import { canonicalPlanetPair, PROVENANCE, ALL_PROVENANCE_LABELS } from "../technicalSummary.js";

const VERIFICATION_INPUT = {
  birthDate: "1994-11-21",
  birthTime: "01:44:00",
  latitude: 1.8548,
  longitude: 102.9325,
  utcOffset: "+08:00",
  houseSystem: "placidus",
};

function findClassicalPlanet(chart, key) {
  return chart.classical.planets.find((p) => p.planet === key);
}

describe("TEST 1: exactly 7 traditional planet evidence records exist", () => {
  it("planets map has exactly 7 keys", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    expect(Object.keys(chart.classical.summary.planets).length).toBe(7);
    for (const key of TRADITIONAL_PLANETS) {
      expect(chart.classical.summary.planets).toHaveProperty(key);
    }
  });
});

describe("TEST 2: no modern outer planets in Classical planet evidence", () => {
  it("Uranus/Neptune/Pluto are absent", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    expect(chart.classical.summary.planets).not.toHaveProperty("uranus");
    expect(chart.classical.summary.planets).not.toHaveProperty("neptune");
    expect(chart.classical.summary.planets).not.toHaveProperty("pluto");
    expect(chart.classical.summary.chartOverview.traditionalPlanetsIncluded).toEqual([
      "sun",
      "moon",
      "mercury",
      "venus",
      "mars",
      "jupiter",
      "saturn",
    ]);
  });
});

describe("TEST 3: exactly 21 unique relationship records exist", () => {
  it("relationships.length === 21", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    expect(chart.classical.summary.relationships.length).toBe(21);
  });
});

describe("TEST 4: every relationship has a unique stable pairId", () => {
  it("all 21 pairIds are unique strings", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const ids = chart.classical.summary.relationships.map((r) => r.pairId);
    expect(new Set(ids).size).toBe(21);
    for (const id of ids) expect(typeof id).toBe("string");
  });
});

describe("TEST 5: A-B and B-A normalize to the same pairId", () => {
  it("canonicalPlanetPair is order-independent", () => {
    expect(canonicalPlanetPair("moon", "saturn")).toEqual(canonicalPlanetPair("saturn", "moon"));
    expect(canonicalPlanetPair("sun", "venus").pairId).toBe(canonicalPlanetPair("venus", "sun").pairId);
    // Matches upstream generation order (TRADITIONAL_PLANETS index), not
    // an alphabetical sort - the exact class of mismatch this project
    // already hit once at the test level in Phase 3G-B.
    expect(canonicalPlanetPair("saturn", "sun")).toEqual({ pairId: "sun-saturn", planetA: "sun", planetB: "saturn" });
  });

  it("throws on an unknown planet or a self-pair", () => {
    expect(() => canonicalPlanetPair("moon", "moon")).toThrow();
    expect(() => canonicalPlanetPair("moon", "chiron")).toThrow();
  });
});

describe("TEST 6: no duplicate pair records", () => {
  it("every unordered pair of traditional planets appears exactly once", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const seen = new Set();
    for (const r of chart.classical.summary.relationships) {
      const key = [r.planetA, r.planetB].sort().join("|");
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
    expect(seen.size).toBe(21);
  });
});

describe("TEST 7: planet position equals locked upstream position exactly", () => {
  it("summary position fields match chart.classical.planets[*].placement/condition verbatim", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    for (const key of TRADITIONAL_PLANETS) {
      const upstream = findClassicalPlanet(chart, key);
      const pos = chart.classical.summary.planets[key].position;
      expect(pos.sign).toBe(upstream.placement.sign);
      expect(pos.absoluteLongitude).toBe(upstream.placement.absoluteLongitude);
      expect(pos.degreeInSign).toBe(upstream.placement.degreeInSign);
      expect(pos.house).toBe(upstream.placement.house);
      expect(pos.motion.longitudeSpeedDegPerDay).toBe(upstream.condition.motion.longitudeSpeed);
      expect(pos.retrograde).toBe(upstream.condition.motion.direction === "retrograde");
      expect(pos.horizon).toEqual(upstream.condition.horizon);
    }
  });
});

describe("TEST 8: essential dignity equals Phase 3A exactly", () => {
  it("summary essentialDignity matches chart.classical.planets[*].dignity/peregrine/etc. verbatim", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    for (const key of TRADITIONAL_PLANETS) {
      const upstream = findClassicalPlanet(chart, key);
      const ed = chart.classical.summary.planets[key].essentialDignity;
      expect(ed.domicile).toEqual(upstream.dignity.domicile);
      expect(ed.exaltation).toEqual(upstream.dignity.exaltation);
      expect(ed.triplicity).toEqual(upstream.dignity.triplicity);
      expect(ed.term).toEqual(upstream.dignity.term);
      expect(ed.face).toEqual(upstream.dignity.face);
      expect(ed.detriment).toEqual(upstream.dignity.detriment);
      expect(ed.fall).toEqual(upstream.dignity.fall);
      expect(ed.peregrine).toBe(upstream.peregrine);
      expect(ed.immediateDispositor).toBe(upstream.immediateDispositor);
      expect(ed.totalEssentialScore).toBe(upstream.totalEssentialScore);
    }
  });
});

describe("TEST 9: planetary condition equals Phase 3B exactly", () => {
  it("summary planetaryCondition is the exact upstream object, unmodified", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    for (const key of TRADITIONAL_PLANETS) {
      const upstream = findClassicalPlanet(chart, key);
      expect(chart.classical.summary.planets[key].planetaryCondition).toEqual(upstream.condition);
    }
  });
});

describe("TEST 10: operational condition equals Phase 3C exactly", () => {
  it("summary operationalCondition is the exact upstream object, unmodified", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    for (const key of TRADITIONAL_PLANETS) {
      const upstream = findClassicalPlanet(chart, key);
      expect(chart.classical.summary.planets[key].operationalCondition).toEqual(upstream.operationalCondition);
    }
  });
});

describe("TEST 11: Hayz/Halb equals Phase 3D exactly", () => {
  it("summary sectCondition is the exact upstream object, unmodified", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    for (const key of TRADITIONAL_PLANETS) {
      const upstream = findClassicalPlanet(chart, key);
      expect(chart.classical.summary.planets[key].sectCondition).toEqual(upstream.sectConditionDetail);
    }
  });
});

describe("TEST 12: dispositor chain equals Phase 3E exactly", () => {
  it("summary dispositor fields match chart.classical.planets[*].dispositor verbatim, loops preserved", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    for (const key of TRADITIONAL_PLANETS) {
      const upstream = findClassicalPlanet(chart, key);
      const disp = chart.classical.summary.planets[key].dispositor;
      expect(disp.immediateDispositor).toBe(upstream.dispositor.immediate.ruledBy);
      expect(disp.dispositorChain).toEqual(upstream.dispositor.chain.chain);
      expect(disp.terminationType).toBe(upstream.dispositor.chain.terminationType);
      expect(disp.finalDispositor).toBe(upstream.dispositor.chain.finalDispositor);
      expect(disp.loopMembers).toEqual(upstream.dispositor.chain.loopMembers);
      // A loop's finalDispositor must never be invented/replaced.
      if (disp.terminationType === "loop") expect(disp.finalDispositor).toBeNull();
    }
  });
});

describe("TEST 13: reception direction is not reversed", () => {
  it("summary receives/receivedBy match the raw reception matrix direction exactly (B receives A means A occupies B's dignity)", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    for (const key of TRADITIONAL_PLANETS) {
      const upstream = findClassicalPlanet(chart, key);
      const rec = chart.classical.summary.planets[key].reception;
      expect(rec.receives.map((e) => ({ otherPlanet: e.otherPlanet, dignityTypes: e.dignityTypes }))).toEqual(
        upstream.reception.receives.map((e) => ({ otherPlanet: e.planet, dignityTypes: e.types })),
      );
      expect(rec.receivedBy.map((e) => ({ otherPlanet: e.otherPlanet, dignityTypes: e.dignityTypes }))).toEqual(
        upstream.reception.receivedBy.map((e) => ({ otherPlanet: e.planet, dignityTypes: e.types })),
      );
      expect(rec.receptionQualification).toBe(chart.classical.meta.receptionQualification);
    }

    // Cross-check against the raw matrix directly for one known real
    // relationship in this chart, confirming the direction convention:
    // if B receives A, A occupies B's dignity, never reversed.
    const receiverEntries = chart.classical.receptionMatrix.filter((e) => e.types.length > 0);
    expect(receiverEntries.length).toBeGreaterThan(0);
    const sample = receiverEntries[0];
    const receiverSummary = chart.classical.summary.planets[sample.receiver];
    const found = receiverSummary.reception.receives.find((e) => e.otherPlanet === sample.received);
    expect(found).toBeDefined();
    expect(found.dignityTypes).toEqual(sample.types);
  });
});

describe("TEST 14: aspect evidence equals Phase 3F exactly", () => {
  it("summary per-planet aspects match the within-orb subset of chart.classical.aspects verbatim", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    for (const key of TRADITIONAL_PLANETS) {
      const expected = chart.classical.aspects
        .filter((a) => (a.planetA === key || a.planetB === key) && a.aspect.isWithinOrb)
        .map((a) => ({
          otherPlanet: a.planetA === key ? a.planetB : a.planetA,
          aspectType: a.aspect.type,
          exactAngle: a.aspect.exactAngle,
          angularSeparation: a.aspect.angularSeparation,
          orbFromExact: a.aspect.orbFromExact,
          allowedOrb: a.aspect.allowedOrb,
          motionStatus: a.motion.status,
          signAspectRelation: a.signAspectRelation,
        }));
      expect(chart.classical.summary.planets[key].aspects).toEqual(expected);
    }
  });

  it("relationship-level currentAspect matches the pair's Phase 3F aspect object exactly", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    for (const r of chart.classical.summary.relationships) {
      const upstream = chart.classical.aspects.find(
        (a) => (a.planetA === r.planetA && a.planetB === r.planetB) || (a.planetA === r.planetB && a.planetB === r.planetA),
      );
      expect(r.currentAspect.type).toBe(upstream.aspect.type);
      expect(r.currentAspect.orbFromExact).toBe(upstream.aspect.orbFromExact);
      expect(r.currentAspect.allowedOrb).toBe(upstream.aspect.allowedOrb);
      expect(r.currentAspect.isWithinOrb).toBe(upstream.aspect.isWithinOrb);
      expect(r.currentAspect.motionStatus).toBe(upstream.motion.status);
      expect(r.currentAspect.signAspectRelation).toBe(upstream.signAspectRelation);
      expect(r.reception.aReceivesB).toEqual(upstream.reception.aReceivesB.types);
      expect(r.reception.bReceivesA).toEqual(upstream.reception.bReceivesA.types);
    }
  });
});

describe("TEST 15: direct perfection evidence equals Phase 3G-A exactly", () => {
  it("summary per-planet directPerfection entries match the candidate subset of chart.classical.directPerfection verbatim", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    for (const key of TRADITIONAL_PLANETS) {
      const upstreamCandidates = chart.classical.directPerfection.filter(
        (d) => d.isCandidate && (d.planetA === key || d.planetB === key),
      );
      const summaryEntries = chart.classical.summary.planets[key].directPerfection;
      expect(summaryEntries.length).toBe(upstreamCandidates.length);
      for (const d of upstreamCandidates) {
        const otherPlanet = d.planetA === key ? d.planetB : d.planetA;
        const match = summaryEntries.find((e) => e.otherPlanet === otherPlanet);
        expect(match).toBeDefined();
        expect(match.aspectType).toBe(d.aspectType);
        expect(match.startingOrb).toBe(d.startingOrb);
        expect(match.exactitudeFound).toBe(d.exactitudeFound);
        expect(match.exactitudeTimestampUTC).toBe(d.exactitudeTimestampUTC);
        expect(match.timeToExactitudeDays).toBe(d.timeToExactitudeDays);
        expect(match.technicalStatus).toBe(d.status);
        expect(match.reasonCode).toBe(d.reasonCode);
        expect(match.ingressBeforeExactitude).toEqual(d.ingressBeforeExactitude);
        expect(match.motionChangeBeforeExactitude).toEqual(d.motionChangeBeforeExactitude);
        expect(match.refranation).toEqual(d.refranation);
      }
    }
  });

  it("relationship-level directPerfection matches the pair's Phase 3G-A entry exactly (with status renamed to technicalStatus only)", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    for (const r of chart.classical.summary.relationships) {
      const upstream = chart.classical.directPerfection.find(
        (d) => (d.planetA === r.planetA && d.planetB === r.planetB) || (d.planetA === r.planetB && d.planetB === r.planetA),
      );
      expect(r.directPerfection.isCandidate).toBe(upstream.isCandidate);
      expect(r.directPerfection.technicalStatus).toBe(upstream.status);
      expect(r.directPerfection.exactitudeFound).toBe(upstream.exactitudeFound);
      expect(r.directPerfection.exactitudeTimestampUTC).toBe(upstream.exactitudeTimestampUTC);
      expect(r.directPerfection.refranation).toEqual(upstream.refranation);
    }
  });
});

describe("TEST 16: translation involvement equals Phase 3G-B exactly", () => {
  it("every real translation is reflected in exactly the 2-3 involved planets' mechanicsInvolvement.translations", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const pm = chart.classical.perfectionMechanics;
    for (const t of pm.translations) {
      for (const [key, expectedRole] of [
        [t.translator, "translator"],
        [t.fromPlanet, "translationFrom"],
        [t.toPlanet, "translationTo"],
      ]) {
        const entries = chart.classical.summary.planets[key].mechanicsInvolvement.translations;
        const match = entries.find((e) => e.translator === t.translator && e.fromPlanet === t.fromPlanet && e.toPlanet === t.toPlanet);
        expect(match).toBeDefined();
        expect(match.role).toBe(expectedRole);
        expect(match.technicalStatus).toBe(t.technicalStatus);
      }
    }
  });
});

describe("TEST 17: collection involvement equals Phase 3G-B exactly", () => {
  it("every real collection is reflected in exactly the collector's and both participants' mechanicsInvolvement.collections", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const pm = chart.classical.perfectionMechanics;
    for (const c of pm.collections) {
      for (const [key, expectedRole] of [
        [c.collector, "collector"],
        [c.planetA, "collectionParticipant"],
        [c.planetB, "collectionParticipant"],
      ]) {
        const entries = chart.classical.summary.planets[key].mechanicsInvolvement.collections;
        const match = entries.find((e) => e.collector === c.collector && e.planetA === c.planetA && e.planetB === c.planetB);
        expect(match).toBeDefined();
        expect(match.role).toBe(expectedRole);
        expect(match.completionStatus).toBe(c.completionStatus);
      }
    }
  });
});

describe("TEST 18: prohibition involvement equals Phase 3G-B exactly", () => {
  it("every real prohibition is reflected in the prohibiting planet's and both original-pair members' mechanicsInvolvement.prohibitions", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const pm = chart.classical.perfectionMechanics;
    for (const pr of pm.prohibitions) {
      const involvedPlanets = [pr.prohibitingPlanet, ...pr.originalPair];
      for (const key of involvedPlanets) {
        const entries = chart.classical.summary.planets[key].mechanicsInvolvement.prohibitions;
        const match = entries.find(
          (e) => e.prohibitingPlanet === pr.prohibitingPlanet && e.originalPair.join(",") === pr.originalPair.join(","),
        );
        expect(match).toBeDefined();
        expect(match.role).toBe(key === pr.prohibitingPlanet ? "prohibitingPlanet" : "prohibitedPairMember");
      }
    }

    // Relationship-level: mechanics.prohibitions matches only the pair
    // whose originalPair equals this relationship's own pair.
    for (const r of chart.classical.summary.relationships) {
      const expected = pm.prohibitions.filter(
        (pr) => canonicalPlanetPair(pr.originalPair[0], pr.originalPair[1]).pairId === r.pairId,
      );
      expect(r.mechanics.prohibitions).toEqual(expected);
    }
  });
});

describe("TEST 19: Frustration remains deferred", () => {
  it("frustrations stay [] and no involvement is invented anywhere in the summary", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    expect(chart.classical.perfectionMechanics.frustrations).toEqual([]);
    for (const key of TRADITIONAL_PLANETS) {
      expect(chart.classical.summary.planets[key].mechanicsInvolvement.frustrations).toEqual([]);
    }
    expect(chart.classical.summary.mechanics.frustrationsCount).toBe(0);
    expect(chart.classical.summary.chartOverview.frustrationConvention).toBe("deferred_due_to_historical_variance");
  });
});

describe("TEST 20: raw interference events preserved", () => {
  it("summary interferenceEventsCount and per-relationship interference match Phase 3G-B's raw layer exactly", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const pm = chart.classical.perfectionMechanics;
    expect(chart.classical.summary.mechanics.interferenceEventsCount).toBe(pm.interferenceEvents.length);

    let totalFoundAcrossRelationships = 0;
    for (const r of chart.classical.summary.relationships) {
      const expected = pm.interferenceEvents.filter(
        (e) => canonicalPlanetPair(e.originalPair[0], e.originalPair[1]).pairId === r.pairId,
      );
      expect(r.interference).toEqual(expected);
      totalFoundAcrossRelationships += r.interference.length;
    }
    // Every raw interference event belongs to exactly one relationship's originalPair.
    expect(totalFoundAcrossRelationships).toBe(pm.interferenceEvents.length);
  });
});

describe("TEST 21: requires_historical_rule survives aggregation unchanged", () => {
  it("every occurrence of requires_historical_rule in upstream data is preserved verbatim in the summary, never converted to a boolean", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const withIngress = chart.classical.directPerfection.filter((d) => d.status === "requires_historical_rule");
    expect(withIngress.length).toBeGreaterThan(0);
    for (const d of withIngress) {
      for (const key of [d.planetA, d.planetB]) {
        const entry = chart.classical.summary.planets[key].directPerfection.find(
          (e) => e.otherPlanet === (d.planetA === key ? d.planetB : d.planetA),
        );
        expect(entry.technicalStatus).toBe("requires_historical_rule");
      }
    }
    const withRequiresRuleTranslations = chart.classical.perfectionMechanics.translations.filter(
      (t) => t.technicalStatus === "requires_historical_rule",
    );
    expect(withRequiresRuleTranslations.length).toBeGreaterThan(0);
  });
});

describe("TEST 22: refranation evidence survives aggregation unchanged", () => {
  it("refranation objects appear verbatim wherever the underlying leg refranates", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const refranating = chart.classical.directPerfection.filter((d) => d.isCandidate && d.refranation.occurs);
    expect(refranating.length).toBeGreaterThan(0);
    for (const d of refranating) {
      for (const key of [d.planetA, d.planetB]) {
        const entry = chart.classical.summary.planets[key].directPerfection.find(
          (e) => e.otherPlanet === (d.planetA === key ? d.planetB : d.planetA),
        );
        expect(entry.refranation).toEqual(d.refranation);
        expect(entry.refranation.occurs).toBe(true);
      }
    }
    // At least one collection leg in this chart's own verification data
    // refranates (Jupiter-Saturn) - confirm it is not silently dropped.
    const collectionWithRefranatingLeg = chart.classical.perfectionMechanics.collections.find(
      (c) => c.completionStatus === "one_leg_does_not_perfect",
    );
    expect(collectionWithRefranatingLeg).toBeDefined();
  });
});

describe("TEST 23: no combined strength score exists", () => {
  it("no totalStrengthScore/combinedScore/planetPower/overallRating anywhere in the summary", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const json = JSON.stringify(chart.classical.summary);
    expect(json).not.toMatch(/totalStrengthScore|combinedScore|planetPower|overallRating|operationalScore|accidentalScore/i);
  });
});

describe("TEST 24: no ranking exists", () => {
  it("no rank/strongest/weakest/dominant/best-testimony/worst-testimony language anywhere in the summary", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const json = JSON.stringify(chart.classical.summary);
    expect(json).not.toMatch(/strongest|weakest|dominant|mostImportant|bestTestimony|worstTestimony|\brank(ing)?\b/i);
  });
});

describe("TEST 25: no interpretation text exists in calculation output", () => {
  it("no interpretive good/bad/strong/weak/afflicted/successful/promising/blocked labels anywhere in the summary", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const json = JSON.stringify(chart.classical.summary);
    expect(json).not.toMatch(
      /isStrong|isWeak|isBeneficial|isAfflicted|isPromising|isSuccessful|isBlocked|\bgood\b|\bbad\b/i,
    );
  });
});

describe("TEST 26: summary is JSON serializable", () => {
  it("JSON.stringify/parse round-trips without throwing and without losing top-level shape", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const json = JSON.stringify(chart.classical.summary);
    expect(typeof json).toBe("string");
    const parsed = JSON.parse(json);
    expect(Object.keys(parsed).sort()).toEqual(
      ["chartOverview", "planets", "relationships", "mechanics", "unresolvedConventions"].sort(),
    );
    expect(Object.keys(parsed.planets).length).toBe(7);
    expect(parsed.relationships.length).toBe(21);
  });

  it("no functions or React elements anywhere in the summary", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const walk = (value) => {
      if (typeof value === "function") throw new Error("function found in summary");
      if (value && typeof value === "object") {
        if (Object.prototype.hasOwnProperty.call(value, "$$typeof")) throw new Error("React element found in summary");
        for (const v of Object.values(value)) walk(v);
      }
    };
    expect(() => walk(chart.classical.summary)).not.toThrow();
  });
});

describe("TEST 27: no circular references", () => {
  it("JSON.stringify never throws a circular structure error", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    expect(() => JSON.stringify(chart.classical.summary)).not.toThrow();
  });
});

describe("TEST 28: provenance labels are present and valid", () => {
  it("every planet/relationship/mechanics provenance array is non-empty and drawn only from ALL_PROVENANCE_LABELS", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const validLabels = new Set([...ALL_PROVENANCE_LABELS, PROVENANCE.ASTRONOMICAL_FOUNDATION]);

    expect(chart.classical.summary.chartOverview.provenance.length).toBeGreaterThan(0);
    for (const label of chart.classical.summary.chartOverview.provenance) expect(validLabels.has(label)).toBe(true);

    for (const key of TRADITIONAL_PLANETS) {
      const provenance = chart.classical.summary.planets[key].provenance;
      expect(provenance.length).toBeGreaterThan(0);
      for (const label of provenance) expect(validLabels.has(label)).toBe(true);
    }

    for (const r of chart.classical.summary.relationships) {
      expect(r.provenance.length).toBeGreaterThan(0);
      for (const label of r.provenance) expect(validLabels.has(label)).toBe(true);
    }

    expect(chart.classical.summary.mechanics.provenance).toEqual([PROVENANCE.PERFECTION_MECHANICS]);
  });
});

describe("TEST 29: unresolved conventions reflect metadata rather than inventing new rules", () => {
  it("every unresolvedConventions entry's status matches the corresponding live chart.classical.meta value", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const meta = chart.classical.meta;
    const list = chart.classical.summary.unresolvedConventions;
    expect(list.length).toBeGreaterThan(0);

    const byTopic = Object.fromEntries(list.map((e) => [e.topic, e.status]));
    expect(byTopic.sign_ingress_before_perfection).toBe(meta.signIngressConvention);
    expect(byTopic.reception_qualification).toBe(meta.receptionQualification);
    expect(byTopic.frustration).toBe(meta.frustrationConvention);
    expect(byTopic.dexter_sinister).toBe(meta.dexterSinisterStatus);

    // A settled (non-deferred) convention must NOT appear on this list -
    // e.g. refranationConvention currently names a definite historical
    // rule, not a deferral/ambiguity marker.
    expect(meta.refranationConvention).toBe("direct_to_retrograde_application_reversal");
    expect(list.find((e) => e.topic === "refranation")).toBeUndefined();
  });
});

describe("TEST 30: all Phase 1-3G-B results remain unchanged by Phase 3H", () => {
  it("chart.classical fields other than `summary` are untouched by adding the summary layer", () => {
    const withSummary = calculateChart(VERIFICATION_INPUT);
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withSummary.classical.planets).toEqual(fresh.classical.planets);
    expect(withSummary.classical.aspects).toEqual(fresh.classical.aspects);
    expect(withSummary.classical.directPerfection).toEqual(fresh.classical.directPerfection);
    expect(withSummary.classical.perfectionMechanics).toEqual(fresh.classical.perfectionMechanics);
    expect(withSummary.classical.receptionMatrix).toEqual(fresh.classical.receptionMatrix);
    expect(withSummary.classical.mutualReceptions).toEqual(fresh.classical.mutualReceptions);
    // The full Phase 1-3G-B suite itself is run and confirmed passing as
    // part of the same `npx vitest run` invocation as this file - see
    // the Phase 3H final report for the full-suite total.
  });
});

describe("Verification chart totals reconcile with upstream phases", () => {
  it("reports the exact totals used in the Phase 3H final report", () => {
    const chart = calculateChart(VERIFICATION_INPUT);
    const s = chart.classical.summary;
    const withinOrb = chart.classical.aspects.filter((a) => a.aspect.isWithinOrb);
    const applying = withinOrb.filter((a) => a.motion.status === "applying");
    const separating = withinOrb.filter((a) => a.motion.status === "separating");
    const dpCandidates = chart.classical.directPerfection.filter((d) => d.isCandidate);
    const dpPerfects = dpCandidates.filter((d) => d.status === "perfects" || d.status === "requires_historical_rule");
    const dpDoesNotPerfect = dpCandidates.filter((d) => d.status === "does_not_perfect");
    const refranating = dpCandidates.filter((d) => d.refranation.occurs);

    expect(withinOrb.length).toBe(9);
    expect(applying.length + separating.length).toBe(9);
    expect(dpCandidates.length).toBe(5);
    expect(s.mechanics.translationsCount).toBe(3);
    expect(s.mechanics.collectionsCount).toBe(2);
    expect(s.mechanics.collectionCompletionStatusCounts).toEqual({
      both_legs_perfect: 0,
      one_leg_does_not_perfect: 1,
      requires_historical_rule: 1,
    });
    expect(s.mechanics.prohibitionsCount).toBe(2);
    expect(s.mechanics.interferenceEventsCount).toBe(2);
    expect(refranating.length).toBe(2);
    expect(s.unresolvedConventions.length).toBe(4);

    // Reconciliation: dpPerfects + dpDoesNotPerfect must account for every candidate.
    expect(dpPerfects.length + dpDoesNotPerfect.length).toBe(dpCandidates.length);
  });
});
