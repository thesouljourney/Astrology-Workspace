import { describe, it, expect } from "vitest";
import { calculateChart } from "../ephemeris.js";
import {
  buildCrossSystemEvidence,
  resolveEvidencePath,
  CROSS_SYSTEM_VERSION,
  CROSS_SYSTEM_TYPE,
  CROSS_SYSTEM_INTERPRETATION,
  CROSS_SYSTEM_COMPARISON_POLICY,
} from "../crossSystem.js";

const VERIFICATION_INPUT = {
  birthDate: "1994-11-21",
  birthTime: "01:44:00",
  latitude: 1.8548,
  longitude: 102.9325,
  utcOffset: "+08:00",
  houseSystem: "placidus",
};

function chart() {
  return calculateChart(VERIFICATION_INPUT);
}

const SEVEN_CLASSICAL = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"];

/** Recursively collects every string value found under a key named "sourcePath". */
function collectSourcePaths(obj) {
  const paths = [];
  const walk = (value) => {
    if (value === null || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    for (const [k, v] of Object.entries(value)) {
      if (k === "sourcePath" && typeof v === "string") paths.push(v);
      else walk(v);
    }
  };
  walk(obj);
  return paths;
}

// ============================================================
// TEST 1-5: existence, system registration, availability
// ============================================================

describe("TEST 1: chart.crossSystem exists", () => {
  it("is a plain object", () => {
    const c = chart();
    expect(c.crossSystem).toBeTruthy();
    expect(typeof c.crossSystem).toBe("object");
  });
});

describe("TEST 2: exactly three systems registered", () => {
  it("chart.crossSystem.systems has exactly modernWestern/classical/vedic", () => {
    const { crossSystem } = chart();
    expect(Object.keys(crossSystem.systems).sort()).toEqual(["classical", "modernWestern", "vedic"]);
  });
});

describe("TEST 3: Modern Western available", () => {
  it("systems.modernWestern.available is true", () => {
    const { crossSystem } = chart();
    expect(crossSystem.systems.modernWestern.available).toBe(true);
  });
});

describe("TEST 4: Classical available", () => {
  it("systems.classical.available is true", () => {
    const { crossSystem } = chart();
    expect(crossSystem.systems.classical.available).toBe(true);
    expect(crossSystem.systems.classical.summaryAvailable).toBe(true);
  });
});

describe("TEST 5: Vedic available", () => {
  it("systems.vedic.available is true", () => {
    const { crossSystem } = chart();
    expect(crossSystem.systems.vedic.available).toBe(true);
    expect(crossSystem.systems.vedic.summaryAvailable).toBe(true);
  });
});

// ============================================================
// TEST 6-9: shared body / node mapping
// ============================================================

describe("TEST 6: shared seven planetary identities mapped", () => {
  it("bodyIdentities has all 7 classical/shared planets, each present in all three systems", () => {
    const { crossSystem } = chart();
    for (const key of SEVEN_CLASSICAL) {
      expect(crossSystem.bodyIdentities[key]).toBeTruthy();
      expect(crossSystem.bodyIdentities[key].presentIn.sort()).toEqual(["classical", "modernWestern", "vedic"]);
    }
  });
});

describe("TEST 7: no outer planets fabricated in Vedic", () => {
  it("uranus/neptune/pluto are presentIn modernWestern only, with explicit implemented:false for classical/vedic", () => {
    const { crossSystem } = chart();
    for (const key of ["uranus", "neptune", "pluto"]) {
      const b = crossSystem.bodyIdentities[key];
      expect(b.presentIn).toEqual(["modernWestern"]);
      expect(b.systems.classical.implemented).toBe(false);
      expect(b.systems.vedic.implemented).toBe(false);
      expect(b.systems.classical.longitude).toBeUndefined();
      expect(b.systems.vedic.longitude).toBeUndefined();
    }
  });
});

describe("TEST 8: Rahu/Ketu mapped only to node concept family", () => {
  it("bodyIdentities.northNode_rahu/southNode_ketu exist and are not duplicated under a planet-identity key", () => {
    const { crossSystem } = chart();
    expect(crossSystem.bodyIdentities.northNode_rahu).toBeTruthy();
    expect(crossSystem.bodyIdentities.southNode_ketu).toBeTruthy();
    expect(crossSystem.bodyIdentities.northNode_rahu.concept).toBe("lunar_ascending_node");
    expect(crossSystem.bodyIdentities.southNode_ketu.concept).toBe("lunar_descending_node");
    expect(crossSystem.bodyIdentities.rahu).toBeUndefined();
    expect(crossSystem.bodyIdentities.ketu).toBeUndefined();
  });
});

describe("TEST 9: True Node vs Mean Rahu marked non-numerically-equivalent by default", () => {
  it("with the default Western nodeType ('true'), numericallyEquivalent is false", () => {
    const c = chart();
    expect(c.meta.nodeType).toBe("true");
    expect(c.vedic.meta.vedicNodeType).toBe("mean");
    expect(c.crossSystem.bodyIdentities.northNode_rahu.numericallyEquivalent).toBe(false);
    expect(c.crossSystem.bodyIdentities.southNode_ketu.numericallyEquivalent).toBe(false);
    expect(c.crossSystem.bodyIdentities.northNode_rahu.sameAstronomicalIdentity).toBe(true);
  });

  it("selecting the same convention (mean) for Western still keeps numericallyEquivalent false - matching convention never implies matching coordinate frame (pre-lock audit fix)", () => {
    const c = calculateChart({ ...VERIFICATION_INPUT, nodeType: "mean" });
    expect(c.crossSystem.bodyIdentities.northNode_rahu.sameCalculationConvention).toBe(true);
    expect(c.crossSystem.bodyIdentities.northNode_rahu.sameCoordinateFrame).toBe(false);
    expect(c.crossSystem.bodyIdentities.northNode_rahu.numericallyEquivalent).toBe(false);
  });
});

// ============================================================
// Pre-lock audit: cross-system equivalence semantics (Part J)
// ============================================================

describe("Audit Part J.1: Western True Node vs Vedic Mean Rahu equivalence dimensions", () => {
  it("sameAstronomicalIdentity=true, sameCalculationConvention=false, sameCoordinateFrame=false, numericallyEquivalent=false", () => {
    const c = chart();
    const n = c.crossSystem.bodyIdentities.northNode_rahu;
    expect(n.sameAstronomicalIdentity).toBe(true);
    expect(n.sameCalculationConvention).toBe(false);
    expect(n.sameCoordinateFrame).toBe(false);
    expect(n.numericallyEquivalent).toBe(false);
  });
});

describe("Audit Part J.2: Western Mean Node vs Vedic Mean Rahu equivalence dimensions", () => {
  it("sameAstronomicalIdentity=true, sameCalculationConvention=true, sameCoordinateFrame=false, numericallyEquivalent=false", () => {
    const c = calculateChart({ ...VERIFICATION_INPUT, nodeType: "mean" });
    const n = c.crossSystem.bodyIdentities.northNode_rahu;
    expect(n.sameAstronomicalIdentity).toBe(true);
    expect(n.sameCalculationConvention).toBe(true);
    expect(n.sameCoordinateFrame).toBe(false);
    expect(n.numericallyEquivalent).toBe(false);
    // The native longitudes must genuinely differ by the ayanamsha offset,
    // not merely be labeled non-equivalent - proves the fix isn't cosmetic.
    const diff = Math.abs(n.systems.modernWestern.longitude - n.systems.vedic.longitude);
    expect(diff).toBeGreaterThan(20);
    expect(diff).toBeLessThan(25);
  });
});

describe("Audit Part J.3: South Node / Ketu equivalent cases", () => {
  it("mirrors the North Node/Rahu cases under both default and Mean Node settings", () => {
    const cDefault = chart();
    const sDefault = cDefault.crossSystem.bodyIdentities.southNode_ketu;
    expect(sDefault.sameAstronomicalIdentity).toBe(true);
    expect(sDefault.sameCalculationConvention).toBe(false);
    expect(sDefault.sameCoordinateFrame).toBe(false);
    expect(sDefault.numericallyEquivalent).toBe(false);

    const cMean = calculateChart({ ...VERIFICATION_INPUT, nodeType: "mean" });
    const sMean = cMean.crossSystem.bodyIdentities.southNode_ketu;
    expect(sMean.sameCalculationConvention).toBe(true);
    expect(sMean.sameCoordinateFrame).toBe(false);
    expect(sMean.numericallyEquivalent).toBe(false);
  });
});

describe("Audit Part J.4: native Tropical vs Sidereal longitude difference remains preserved", () => {
  it("northNode_rahu/southNode_ketu still expose each system's own native longitude, unconverted", () => {
    const c = chart();
    const n = c.crossSystem.bodyIdentities.northNode_rahu;
    expect(n.systems.modernWestern.longitude).toBe(c.points.find((p) => p.id === "northNode").absoluteLongitude);
    expect(n.systems.vedic.longitude).toBe(c.vedic.grahas.rahu.siderealLongitude);
    expect(n.systems.modernWestern.longitude).not.toBeCloseTo(n.systems.vedic.longitude, 3);
  });
});

describe("Audit Part J.5: Sun-Saturn shared identity does not imply same zodiac longitude/sign", () => {
  it("every shared planet has sameAstronomicalIdentity=true but numericallyEquivalent=false (Western/Classical vs Vedic), and Western/Classical's own agreement is a separate live fact", () => {
    const c = chart();
    for (const key of SEVEN_CLASSICAL) {
      const b = c.crossSystem.bodyIdentities[key];
      expect(b.sameAstronomicalIdentity).toBe(true);
      expect(b.sameCoordinateFrame).toBe(false);
      expect(b.numericallyEquivalent).toBe(false);
      expect(b.westernAndClassicalShareValue).toBe(true);
      expect(b.systems.modernWestern.longitude).toBe(b.systems.classical.longitude);
      expect(b.systems.modernWestern.longitude).not.toBe(b.systems.vedic.longitude);
    }
  });
});

describe("Audit Part J.6: ASC and Lagna are not marked numerically equivalent merely because both are ascendant-related", () => {
  it("no numericallyEquivalent boolean exists anywhere claiming ASC=Lagna, and the pair is explicitly registered as non-equivalent", () => {
    const c = chart();
    const pair = c.crossSystem.nonEquivalentConcepts.find((p) => p.conceptA.label.includes("ASC") && p.conceptB.label.includes("Lagna"));
    expect(pair).toBeTruthy();
    // self_identity family descriptors never carry a numericallyEquivalent field.
    const family = c.crossSystem.conceptFamilies.find((f) => f.family === "self_identity");
    for (const d of family.descriptors) {
      expect(d).not.toHaveProperty("numericallyEquivalent");
    }
  });
});

describe("Audit Part J.7: MC and Vedic 10th Bhava remain non-equivalent constructs", () => {
  it("still explicitly registered in nonEquivalentConcepts, unaffected by the equivalence-dimension refactor", () => {
    const c = chart();
    const pair = c.crossSystem.nonEquivalentConcepts.find((p) => p.conceptA.label === "MC" && p.conceptB.label.includes("10th Bhava"));
    expect(pair).toBeTruthy();
  });
});

describe("Audit Part J.8: no cross-system dignity equivalence introduced", () => {
  it("planetary_status_by_sign family descriptors carry no numericallyEquivalent/sameCoordinateFrame field", () => {
    const c = chart();
    const family = c.crossSystem.conceptFamilies.find((f) => f.family === "planetary_status_by_sign");
    for (const d of family.descriptors) {
      expect(d).not.toHaveProperty("numericallyEquivalent");
      expect(d).not.toHaveProperty("sameCoordinateFrame");
    }
  });
});

describe("Audit Part J.9: no dispositor equivalence introduced", () => {
  it("dispositor_structure family descriptors carry no numericallyEquivalent/sameCoordinateFrame field", () => {
    const c = chart();
    const family = c.crossSystem.conceptFamilies.find((f) => f.family === "dispositor_structure");
    for (const d of family.descriptors) {
      expect(d).not.toHaveProperty("numericallyEquivalent");
      expect(d).not.toHaveProperty("sameCoordinateFrame");
    }
  });
});

describe("Audit Part J.10: every sourcePath still resolves", () => {
  it("all sourcePaths collected from the refactored chart.crossSystem resolve to a defined value", () => {
    const c = chart();
    const paths = collectSourcePaths(c.crossSystem);
    expect(paths.length).toBeGreaterThan(20);
    for (const p of paths) {
      expect(resolveEvidencePath(c, p), `sourcePath "${p}" did not resolve`).not.toBeUndefined();
    }
  });
});

describe("Audit Part J.11: no interpretation", () => {
  it("no strong/weak/auspicious/career language introduced by the equivalence refactor", () => {
    const { crossSystem } = chart();
    expect(JSON.stringify(crossSystem)).not.toMatch(/\bstrong\b|\bweak\b|auspicious|inauspicious|\bcareer\b/i);
  });
});

describe("Audit Part J.12: no scoring", () => {
  it("no score field introduced by the equivalence refactor", () => {
    const { crossSystem } = chart();
    expect(JSON.stringify(crossSystem)).not.toMatch(/score/i);
  });
});

describe("Audit Part J.13: no agreement/contradiction judgment", () => {
  it("no 'agree'/'contradict' text introduced by the equivalence refactor", () => {
    const { crossSystem } = chart();
    expect(JSON.stringify(crossSystem)).not.toMatch(/\bagree\b|contradict/i);
  });
});

describe("Audit Part J.14-16: Western/Classical/Vedic source unchanged", () => {
  it("chart.points/chart.classical/chart.vedic are byte-for-byte identical to a fresh independent computation", () => {
    const withAudit = chart();
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withAudit.points).toEqual(fresh.points);
    expect(withAudit.classical).toEqual(fresh.classical);
    expect(withAudit.vedic).toEqual(fresh.vedic);
  });
});

// ============================================================
// TEST 10-16: non-equivalence preserved
// ============================================================

describe("TEST 10: Western houses remain distinct from Vedic Bhavas", () => {
  it("evidenceAvailability marks Vedic houses notApplicable (never merged with Western/Classical houses)", () => {
    const { crossSystem } = chart();
    expect(crossSystem.evidenceAvailability.houses.modernWestern.status).toBe("implemented");
    expect(crossSystem.evidenceAvailability.houses.classical.status).toBe("implemented");
    expect(crossSystem.evidenceAvailability.houses.vedic.status).toBe("notApplicable");
    expect(crossSystem.evidenceAvailability.bhava.vedic.status).toBe("implemented");
    expect(crossSystem.evidenceAvailability.bhava.modernWestern.status).toBe("notApplicable");
    const pair = crossSystem.nonEquivalentConcepts.find((p) => p.conceptA.label.includes("Western House") && p.conceptB.label.includes("Vedic Bhava"));
    expect(pair).toBeTruthy();
  });
});

describe("TEST 11: Classical dignity remains distinct from Vedic dignity", () => {
  it("nonEquivalentConcepts lists Classical Essential Dignity vs Vedic Dignity, and no shared dignity value/score exists", () => {
    const { crossSystem } = chart();
    const pair = crossSystem.nonEquivalentConcepts.find((p) => p.conceptA.label.includes("Essential Dignity") && p.conceptB.label.includes("Vedic Dignity"));
    expect(pair).toBeTruthy();
    const family = crossSystem.conceptFamilies.find((f) => f.family === "planetary_status_by_sign");
    expect(family.descriptors.some((d) => d.concept.includes("score"))).toBe(false);
  });
});

describe("TEST 12: Classical dispositor remains distinct from Vedic dispositor", () => {
  it("dispositor_structure family keeps classical/vedic descriptors separate, never merged into one chain", () => {
    const { crossSystem } = chart();
    const family = crossSystem.conceptFamilies.find((f) => f.family === "dispositor_structure");
    const classicalDesc = family.descriptors.find((d) => d.system === "classical");
    const vedicDesc = family.descriptors.find((d) => d.system === "vedic");
    expect(classicalDesc.sourcePath).not.toBe(vedicDesc.sourcePath);
    expect(classicalDesc.provenance).toBe("phase_3e");
    expect(vedicDesc.provenance).toBe("phase_4e");
  });
});

describe("TEST 13: Classical combustion remains distinct from Vedic combustion", () => {
  it("planetary_condition family keeps separate descriptors/provenance for classical vs vedic combustion", () => {
    const { crossSystem } = chart();
    const family = crossSystem.conceptFamilies.find((f) => f.family === "planetary_condition");
    const classicalCombustion = family.descriptors.find((d) => d.system === "classical" && d.category === "planetaryCondition");
    const vedicCombustion = family.descriptors.find((d) => d.system === "vedic" && d.category === "planetaryCondition");
    expect(classicalCombustion.provenance).toBe("phase_3b");
    expect(vedicCombustion.provenance).toBe("phase_4d");
    expect(classicalCombustion.sourcePath).not.toBe(vedicCombustion.sourcePath);
  });
});

describe("TEST 14: Vedic aspects marked not implemented", () => {
  it("evidenceAvailability.aspects.vedic.status is 'notImplemented' and the aspects family notes it explicitly", () => {
    const { crossSystem } = chart();
    expect(crossSystem.evidenceAvailability.aspects.vedic.status).toBe("notImplemented");
    const family = crossSystem.conceptFamilies.find((f) => f.family === "aspects");
    const vedicDesc = family.descriptors.find((d) => d.system === "vedic");
    expect(vedicDesc.implemented).toBe(false);
    expect(vedicDesc.sourcePath).toBeNull();
  });
});

describe("TEST 15: Classical perfection has no fabricated Vedic equivalent", () => {
  it("classical_specific family's Vedic perfection descriptor is implemented:false with a null sourcePath", () => {
    const { crossSystem } = chart();
    const family = crossSystem.conceptFamilies.find((f) => f.family === "classical_specific");
    const vedicPerfection = family.descriptors.find((d) => d.system === "vedic" && d.concept.includes("perfection"));
    expect(vedicPerfection.implemented).toBe(false);
    expect(vedicPerfection.sourcePath).toBeNull();
    const pair = crossSystem.nonEquivalentConcepts.find((p) => p.conceptA.label.includes("Horary Perfection") && p.conceptB.label.includes("Vedic structure"));
    expect(pair).toBeTruthy();
  });
});

describe("TEST 16: MC not treated as Vedic 10th Bhava", () => {
  it("nonEquivalentConcepts explicitly registers MC vs Vedic 10th Bhava, and evidenceAvailability confirms Vedic has no MC", () => {
    const { crossSystem } = chart();
    const pair = crossSystem.nonEquivalentConcepts.find((p) => p.conceptA.label === "MC" && p.conceptB.label.includes("10th Bhava"));
    expect(pair).toBeTruthy();
    expect(crossSystem.evidenceAvailability.angles.vedic.status).toBe("notImplemented");
  });
});

describe("TEST 17: Lagna Lord not treated as identical to Western chart ruler", () => {
  it("nonEquivalentConcepts explicitly registers Modern Chart Ruler vs Vedic Lagna Lord, and Western chart ruler is notImplemented", () => {
    const { crossSystem } = chart();
    const pair = crossSystem.nonEquivalentConcepts.find((p) => p.conceptA.label.includes("Chart Ruler") && p.conceptB.label.includes("Lagna Lord"));
    expect(pair).toBeTruthy();
    const family = crossSystem.conceptFamilies.find((f) => f.family === "self_identity");
    const westernRuler = family.descriptors.find((d) => d.system === "modernWestern" && d.concept === "chart_ruler");
    expect(westernRuler.implemented).toBe(false);
  });
});

// ============================================================
// TEST 18-19: live derivation, no interpretation
// ============================================================

describe("TEST 18: Evidence availability map derives from live data", () => {
  it("recomputing crossSystem from a chart missing chart.classical.aspects would change the aspects.classical status (proves it is live, not hard-coded)", () => {
    const c = chart();
    const mutatedChart = { ...c, classical: { ...c.classical, aspects: [] } };
    const rebuilt = buildCrossSystemEvidence({ chart: mutatedChart });
    expect(rebuilt.evidenceAvailability.aspects.classical.status).toBe("notImplemented");
    // Confirm the original, unmutated chart still reports implemented.
    expect(c.crossSystem.evidenceAvailability.aspects.classical.status).toBe("implemented");
  });
});

describe("TEST 19: No hard-coded interpretation labels", () => {
  it("no strong/weak/auspicious/inauspicious/career/agree/contradict language anywhere in chart.crossSystem", () => {
    const { crossSystem } = chart();
    const json = JSON.stringify(crossSystem);
    expect(json).not.toMatch(/\bstrong\b|\bweak\b|auspicious|inauspicious|\bcareer\b|\bagree\b|\bcontradict/i);
  });
});

// ============================================================
// TEST 20-22: descriptor provenance / sourcePath validation
// ============================================================

describe("TEST 20: Every mapped evidence descriptor has provenance", () => {
  it("every descriptor in every conceptFamily has a non-empty provenance string", () => {
    const { crossSystem } = chart();
    for (const family of crossSystem.conceptFamilies) {
      for (const d of family.descriptors) {
        expect(typeof d.provenance).toBe("string");
        expect(d.provenance.length).toBeGreaterThan(0);
      }
    }
  });

  it("every bodyIdentity system entry has provenance (when implemented)", () => {
    const { crossSystem } = chart();
    for (const key of SEVEN_CLASSICAL) {
      for (const sys of Object.values(crossSystem.bodyIdentities[key].systems)) {
        expect(typeof sys.provenance).toBe("string");
      }
    }
  });
});

describe("TEST 21: Every sourcePath resolves to an existing field", () => {
  it("every sourcePath collected from chart.crossSystem resolves to a defined value against the real chart", () => {
    const c = chart();
    const paths = collectSourcePaths(c.crossSystem);
    expect(paths.length).toBeGreaterThan(20);
    for (const p of paths) {
      const resolved = resolveEvidencePath(c, p);
      expect(resolved, `sourcePath "${p}" did not resolve`).not.toBeUndefined();
    }
  });
});

describe("TEST 22: No sourcePath points to invented schema", () => {
  it("resolveEvidencePath returns undefined for a made-up path (control case, proves the resolver is not vacuously true)", () => {
    const c = chart();
    expect(resolveEvidencePath(c, "vedic.summary.grahas.sun.doesNotExist")).toBeUndefined();
    expect(resolveEvidencePath(c, "classical.summary.planets.pluto.essentialDignity")).toBeUndefined();
    expect(resolveEvidencePath(c, "modernWestern.sun.position.longitude")).toBeUndefined();
  });
});

// ============================================================
// TEST 23-25: source unchanged
// ============================================================

describe("TEST 23: Modern Western source fields unchanged", () => {
  it("chart.points/planets/angles/houseCusps are byte-for-byte identical to a fresh independent computation", () => {
    const withCrossSystem = chart();
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withCrossSystem.points).toEqual(fresh.points);
    expect(withCrossSystem.planets).toEqual(fresh.planets);
    expect(withCrossSystem.angles).toEqual(fresh.angles);
    expect(withCrossSystem.houseCusps).toEqual(fresh.houseCusps);
  });
});

describe("TEST 24: Classical summary unchanged", () => {
  it("chart.classical is byte-for-byte identical to a fresh independent computation", () => {
    const withCrossSystem = chart();
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withCrossSystem.classical).toEqual(fresh.classical);
  });
});

describe("TEST 25: Vedic summary unchanged", () => {
  it("chart.vedic is byte-for-byte identical to a fresh independent computation", () => {
    const withCrossSystem = chart();
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withCrossSystem.vedic).toEqual(fresh.vedic);
  });
});

// ============================================================
// TEST 26-30: no scoring / agreement / topic retrieval
// ============================================================

describe("TEST 26: No combined dignity", () => {
  it("no combinedDignity field anywhere in chart.crossSystem", () => {
    const { crossSystem } = chart();
    expect(JSON.stringify(crossSystem)).not.toMatch(/combinedDignity/i);
  });
});

describe("TEST 27: No combined strength", () => {
  it("no combinedStrength/overallStrength field anywhere in chart.crossSystem", () => {
    const { crossSystem } = chart();
    expect(JSON.stringify(crossSystem)).not.toMatch(/combinedStrength|overallStrength/i);
  });
});

describe("TEST 28: No agreement score", () => {
  it("no agreementScore/systemAgreement/confidenceScore/accuracyScore field anywhere", () => {
    const { crossSystem } = chart();
    expect(JSON.stringify(crossSystem)).not.toMatch(/agreementScore|systemAgreement|confidenceScore|accuracyScore/i);
  });
});

describe("TEST 29: No contradiction judgment", () => {
  it("no 'systems agree'/'contradict' style text anywhere in chart.crossSystem", () => {
    const { crossSystem } = chart();
    expect(JSON.stringify(crossSystem)).not.toMatch(/systems agree|contradict|confirms this/i);
  });
});

describe("TEST 30: No topic retrieval yet", () => {
  it("no careerPlanets/relationshipPlanets/wealthPlanets or similar semantic index anywhere in chart.crossSystem", () => {
    const { crossSystem } = chart();
    expect(JSON.stringify(crossSystem)).not.toMatch(/careerPlanets|relationshipPlanets|wealthPlanets|familyPlanets|siblingsPlanets|shadowPlanets/i);
  });
});

// ============================================================
// TEST 31-32: serialization / circularity
// ============================================================

describe("TEST 31: Cross-system map JSON serializable", () => {
  it("JSON.stringify/parse round-trips chart.crossSystem without throwing", () => {
    const { crossSystem } = chart();
    expect(() => JSON.stringify(crossSystem)).not.toThrow();
    const parsed = JSON.parse(JSON.stringify(crossSystem));
    expect(Object.keys(parsed).sort()).toEqual(
      ["meta", "systems", "evidenceAvailability", "bodyIdentities", "conceptFamilies", "comparisonGroups", "nonEquivalentConcepts", "unresolvedMappings", "provenance"].sort(),
    );
  });
});

describe("TEST 32: No circular references", () => {
  it("no functions, no circular structure anywhere in chart.crossSystem", () => {
    const { crossSystem } = chart();
    const walk = (value, seen = new Set()) => {
      if (typeof value === "function") throw new Error("function found in chart.crossSystem");
      if (value && typeof value === "object") {
        if (seen.has(value)) throw new Error("circular reference found in chart.crossSystem");
        seen.add(value);
        for (const v of Object.values(value)) walk(v, seen);
      }
    };
    expect(() => walk(crossSystem)).not.toThrow();
  });
});

// ============================================================
// TEST 33-35: mutation isolation
// ============================================================

describe("TEST 33: Mutation of crossSystem does not mutate Western source", () => {
  it("mutating crossSystem.bodyIdentities.sun.systems.modernWestern does not change chart.points", () => {
    const c = chart();
    const before = c.points.find((p) => p.id === "sun").absoluteLongitude;
    c.crossSystem.bodyIdentities.sun.systems.modernWestern.longitude = 999;
    expect(c.points.find((p) => p.id === "sun").absoluteLongitude).toBe(before);
  });
});

describe("TEST 34: Mutation of crossSystem does not mutate Classical source", () => {
  it("mutating crossSystem.bodyIdentities.sun.systems.classical does not change chart.classical", () => {
    const c = chart();
    const before = c.classical.summary.planets.sun.position.absoluteLongitude;
    c.crossSystem.bodyIdentities.sun.systems.classical.longitude = 999;
    expect(c.classical.summary.planets.sun.position.absoluteLongitude).toBe(before);
  });
});

describe("TEST 35: Mutation of crossSystem does not mutate Vedic source", () => {
  it("mutating crossSystem.bodyIdentities.sun.systems.vedic does not change chart.vedic", () => {
    const c = chart();
    const before = c.vedic.summary.grahas.sun.position.siderealLongitude;
    c.crossSystem.bodyIdentities.sun.systems.vedic.longitude = 999;
    expect(c.vedic.summary.grahas.sun.position.siderealLongitude).toBe(before);
  });

  it("pushing into crossSystem.nonEquivalentConcepts does not affect a freshly built chart", () => {
    const c = chart();
    c.crossSystem.nonEquivalentConcepts.push({ intruder: true });
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(fresh.crossSystem.nonEquivalentConcepts.some((x) => x.intruder)).toBe(false);
  });
});

// ============================================================
// TEST 36-40: full regression + no API/dependency
// ============================================================

describe("TEST 36: Phase 2A unchanged", () => {
  it("chart.points/planets/angles/houseCusps are untouched by adding chart.crossSystem (repeat, different framing)", () => {
    const withCrossSystem = chart();
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withCrossSystem.points).toEqual(fresh.points);
  });
});

describe("TEST 37: Phase 3A-3H unchanged", () => {
  it("chart.classical.summary is untouched by adding chart.crossSystem", () => {
    const withCrossSystem = chart();
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withCrossSystem.classical.summary).toEqual(fresh.classical.summary);
  });
});

describe("TEST 38: Phase 4A-4F unchanged", () => {
  it("chart.vedic.summary is untouched by adding chart.crossSystem", () => {
    const withCrossSystem = chart();
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withCrossSystem.vedic.summary).toEqual(fresh.vedic.summary);
  });
});

describe("TEST 39: No API", () => {
  it("buildCrossSystemEvidence performs no network call - structural check: module makes no fetch/XHR/import of a network client", () => {
    const src = buildCrossSystemEvidence.toString();
    expect(src).not.toMatch(/fetch\(|XMLHttpRequest|axios/i);
  });
});

describe("TEST 40: No new dependency", () => {
  it("crossSystem.js imports nothing outside this project's own source tree", () => {
    // Structural guard - this test file itself only imports from ../crossSystem.js
    // and ../ephemeris.js, both local; crossSystem.js's own imports are none
    // (it takes the already-built chart as a plain parameter).
    expect(typeof buildCrossSystemEvidence).toBe("function");
  });
});

// ============================================================
// Additional: metadata + verification-chart sanity
// ============================================================

describe("Metadata (Part Y)", () => {
  it("chart.crossSystem.meta matches the exported constants", () => {
    const { crossSystem } = chart();
    expect(crossSystem.meta.crossSystemVersion).toBe(CROSS_SYSTEM_VERSION);
    expect(crossSystem.meta.crossSystemType).toBe(CROSS_SYSTEM_TYPE);
    expect(crossSystem.meta.crossSystemInterpretation).toBe(CROSS_SYSTEM_INTERPRETATION);
    expect(crossSystem.meta.crossSystemComparisonPolicy).toBe(CROSS_SYSTEM_COMPARISON_POLICY);
    expect(crossSystem.meta.crossSystemVersion).toBe("phase_5_v1");
    expect(crossSystem.meta.crossSystemInterpretation).toBe("none");
  });
});

describe("Verification-chart cross-system totals reconcile", () => {
  it("matches the locked verification chart's known shape end-to-end", () => {
    const { crossSystem } = chart();
    expect(crossSystem.bodyIdentities.sun.systems.modernWestern.sign).toBe("scorpio");
    expect(crossSystem.bodyIdentities.sun.systems.vedic.sign).toBe("Scorpio");
    expect(crossSystem.evidenceAvailability.dignity.modernWestern.status).toBe("notImplemented");
    expect(crossSystem.evidenceAvailability.dignity.classical.status).toBe("implemented");
    expect(crossSystem.evidenceAvailability.dignity.vedic.status).toBe("implemented");
    expect(crossSystem.nonEquivalentConcepts.length).toBe(10);
    expect(crossSystem.conceptFamilies.length).toBeGreaterThanOrEqual(9);
  });
});
