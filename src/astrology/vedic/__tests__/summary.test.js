import { describe, it, expect } from "vitest";
import { calculateChart } from "../../ephemeris.js";
import { RASHIS } from "../rashi.js";
import { NAKSHATRAS } from "../nakshatra.js";
import { GRAHA_DISPLAY_NAME, NAVAGRAHA_ORDER } from "../grahaNames.js";
import { CLASSICAL_GRAHA_KEYS } from "../dignityTables.js";
import {
  buildVedicTechnicalSummary,
  TECHNICAL_SUMMARY_VERSION,
  TECHNICAL_SUMMARY_TYPE,
  TECHNICAL_SUMMARY_INTERPRETATION,
  SOURCE_PHASES,
  DISPOSITOR_LOOP_ORDERED_PATH_STATUS,
} from "../summary.js";

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

const NODE_KEYS = ["rahu", "ketu"];

// ============================================================
// TEST 1-5: existence, metadata, record counts
// ============================================================

describe("TEST 1: chart.vedic.summary exists", () => {
  it("is a plain object", () => {
    const { summary } = chart().vedic;
    expect(summary).toBeTruthy();
    expect(typeof summary).toBe("object");
  });
});

describe("TEST 2: summary version/type metadata correct", () => {
  it("chart.vedic.summary.meta matches the exported constants", () => {
    const { summary } = chart().vedic;
    expect(summary.meta.technicalSummaryVersion).toBe(TECHNICAL_SUMMARY_VERSION);
    expect(summary.meta.technicalSummaryType).toBe(TECHNICAL_SUMMARY_TYPE);
    expect(summary.meta.technicalSummaryInterpretation).toBe(TECHNICAL_SUMMARY_INTERPRETATION);
    expect(summary.meta.technicalSummaryVersion).toBe("phase_4f_v1");
    expect(summary.meta.technicalSummaryType).toBe("normalized_evidence_layer");
    expect(summary.meta.technicalSummaryInterpretation).toBe("none");
    expect(summary.meta.sourcePhases).toEqual(SOURCE_PHASES);
    expect(summary.meta.sourcePhases).toEqual(["phase_4a", "phase_4b", "phase_4c", "phase_4d", "phase_4e"]);
  });

  it("chart.vedic.meta also carries the same 4 top-level fields (Part V)", () => {
    const { meta } = chart().vedic;
    expect(meta.technicalSummaryVersion).toBe("phase_4f_v1");
    expect(meta.technicalSummaryType).toBe("normalized_evidence_layer");
    expect(meta.technicalSummaryInterpretation).toBe("none");
    expect(meta.technicalSummarySourcePhases).toEqual(["phase_4a", "phase_4b", "phase_4c", "phase_4d", "phase_4e"]);
  });
});

describe("TEST 3: exactly 9 Graha evidence records", () => {
  it("chart.vedic.summary.grahas has all 9 Navagraha keys, no more, no less", () => {
    const { summary } = chart().vedic;
    expect(Object.keys(summary.grahas).sort()).toEqual([...NAVAGRAHA_ORDER].sort());
    expect(Object.keys(summary.grahas).length).toBe(9);
  });
});

describe("TEST 4: exactly 12 Bhava evidence records", () => {
  it("chart.vedic.summary.bhavas is an array of 12, bhavaNumber 1..12 in order", () => {
    const { summary } = chart().vedic;
    expect(summary.bhavas.length).toBe(12);
    expect(summary.bhavas.map((b) => b.bhavaNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
});

describe("TEST 5: exactly 7 classical lordship evidence records", () => {
  it("chart.vedic.summary.lordship.planets has exactly the 7 classical Graha keys", () => {
    const { summary } = chart().vedic;
    expect(Object.keys(summary.lordship.planets).sort()).toEqual([...CLASSICAL_GRAHA_KEYS].sort());
    expect(Object.keys(summary.lordship.planets).length).toBe(7);
  });
});

// ============================================================
// TEST 6-8: position reconciliation to Phase 4A
// ============================================================

describe("TEST 6: Sun position reconciles to Phase 4A", () => {
  it("summary.grahas.sun.position matches chart.vedic.grahas.sun", () => {
    const { vedic } = chart();
    const s = vedic.summary.grahas.sun.position;
    const g = vedic.grahas.sun;
    expect(s.tropicalLongitude).toBe(g.tropicalLongitude);
    expect(s.siderealLongitude).toBe(g.siderealLongitude);
    expect(s.rashi).toBe(g.rashi);
    expect(s.degreeInRashi).toBe(g.degreeWithinRashi);
    expect(s.motion).toEqual(g.motion);
  });
});

describe("TEST 7: Moon position reconciles to Phase 4A", () => {
  it("summary.grahas.moon.position matches chart.vedic.grahas.moon", () => {
    const { vedic } = chart();
    const s = vedic.summary.grahas.moon.position;
    const g = vedic.grahas.moon;
    expect(s.tropicalLongitude).toBe(g.tropicalLongitude);
    expect(s.siderealLongitude).toBe(g.siderealLongitude);
    expect(s.rashi).toBe(g.rashi);
    expect(s.degreeInRashi).toBe(g.degreeWithinRashi);
  });
});

describe("TEST 8: Rahu/Ketu positions reconcile to Phase 4A", () => {
  it("summary.grahas.rahu/ketu.position matches chart.vedic.grahas.rahu/ketu, including nodeType", () => {
    const { vedic } = chart();
    for (const key of NODE_KEYS) {
      const s = vedic.summary.grahas[key].position;
      const g = vedic.grahas[key];
      expect(s.tropicalLongitude).toBe(g.tropicalLongitude);
      expect(s.siderealLongitude).toBe(g.siderealLongitude);
      expect(s.rashi).toBe(g.rashi);
      expect(s.degreeInRashi).toBe(g.degreeWithinRashi);
      expect(s.nodeType).toBe(g.nodeType);
      expect(s.nodeType).toBe("mean");
    }
  });
});

// ============================================================
// TEST 9-13: Bhava/Nakshatra/dignity/combustion/retrograde reconciliation
// ============================================================

describe("TEST 9: every Graha Bhava reconciles to Phase 4B", () => {
  it("summary.grahas[key].bhava matches chart.vedic.bhava.grahaPlacements[key] for all 9 Grahas", () => {
    const { vedic } = chart();
    for (const key of NAVAGRAHA_ORDER) {
      const s = vedic.summary.grahas[key].bhava;
      const p = vedic.bhava.grahaPlacements[key];
      expect(s.number).toBe(p.bhavaNumber);
      expect(s.rashi).toBe(p.rashi);
    }
  });
});

describe("TEST 10: every Graha Nakshatra/Pada reconciles to Phase 4C", () => {
  it("summary.grahas[key].nakshatra matches chart.vedic.nakshatra.grahas[key] for all 9 Grahas", () => {
    const { vedic } = chart();
    for (const key of NAVAGRAHA_ORDER) {
      const s = vedic.summary.grahas[key].nakshatra;
      const n = vedic.nakshatra.grahas[key];
      expect(s.name).toBe(n.nakshatra);
      expect(s.number).toBe(n.nakshatraNumber);
      expect(s.lord).toBe(n.nakshatraLord);
      expect(s.pada).toBe(n.pada);
      expect(s.degreeWithinNakshatra).toBe(n.degreeWithinNakshatra);
    }
  });
});

describe("TEST 11: every classical Graha dignity reconciles to Phase 4D", () => {
  it("summary.grahas[key].dignity matches chart.vedic.condition.planets[key].dignity for all 7 classical Grahas", () => {
    const { vedic } = chart();
    for (const key of CLASSICAL_GRAHA_KEYS) {
      const s = vedic.summary.grahas[key].dignity;
      const d = vedic.condition.planets[key].dignity;
      expect(s.applicable).toBe(true);
      expect(s.isOwnSign).toBe(d.isOwnSign);
      expect(s.isExaltedSign).toBe(d.isExaltedSign);
      expect(s.isDebilitatedSign).toBe(d.isDebilitatedSign);
      expect(s.isMoolatrikona).toBe(d.isMoolatrikona);
      expect(s.isExactExaltationPoint).toBe(d.isExactExaltationPoint);
      expect(s.isExactDebilitationPoint).toBe(d.isExactDebilitationPoint);
      expect(s.dignityLabels).toEqual(d.dignityLabels);
      expect(s.rashiDignityStatus).toBe(d.rashiDignityStatus);
      expect(s.signLord).toBe(vedic.condition.planets[key].signRelationship.signLord);
      expect(s.naturalRelationshipToSignLord).toBe(vedic.condition.planets[key].signRelationship.naturalRelationshipToSignLord);
    }
  });
});

describe("TEST 12: every classical Graha combustion reconciles to Phase 4D", () => {
  it("summary.grahas[key].condition.combustion matches chart.vedic.condition.planets[key].condition.combustion", () => {
    const { vedic } = chart();
    for (const key of CLASSICAL_GRAHA_KEYS) {
      const s = vedic.summary.grahas[key].condition.combustion;
      const c = vedic.condition.planets[key].condition.combustion;
      expect(s.applicable).toBe(true);
      expect(s.isCombust).toBe(c.isCombust);
      expect(s.solarElongationDegrees).toBe(c.solarElongationDegrees);
      expect(s.thresholdDegrees).toBe(c.thresholdDegrees);
    }
  });
});

describe("TEST 13: every Graha retrograde state reconciles", () => {
  it("summary.grahas[key].condition.retrograde matches Phase 4A motion.retrograde for all 9 Grahas", () => {
    const { vedic } = chart();
    for (const key of NAVAGRAHA_ORDER) {
      expect(vedic.summary.grahas[key].condition.retrograde).toBe(vedic.grahas[key].motion.retrograde);
      expect(vedic.summary.grahas[key].position.motion.retrograde).toBe(vedic.grahas[key].motion.retrograde);
    }
  });
});

// ============================================================
// TEST 14-17: dispositor reconciliation to Phase 4E
// ============================================================

describe("TEST 14: every immediate dispositor reconciles to Phase 4E", () => {
  it("summary.grahas[key].dispositor.immediate matches chart.vedic.lordship.dispositors[key] for all 9 Grahas", () => {
    const { vedic } = chart();
    for (const key of NAVAGRAHA_ORDER) {
      const s = vedic.summary.grahas[key].dispositor;
      const d = vedic.lordship.dispositors[key];
      expect(s.immediate).toBe(d.dispositor);
      expect(s.isSelfDispositor).toBe(d.isSelfDispositor);
    }
  });
});

describe("TEST 15: every dispositor chain reconciles to Phase 4E", () => {
  it("summary.grahas[key].dispositor.chain matches chart.vedic.lordship.dispositorChains[key].chain for all 7 classical Grahas", () => {
    const { vedic } = chart();
    for (const key of CLASSICAL_GRAHA_KEYS) {
      expect(vedic.summary.grahas[key].dispositor.chain).toEqual(vedic.lordship.dispositorChains[key].chain);
      expect(vedic.summary.grahas[key].dispositor.chainApplicable).toBe(true);
    }
  });

  it("summary.grahas[rahu/ketu].dispositor.chain is null (chain not applicable to nodes)", () => {
    const { vedic } = chart();
    for (const key of NODE_KEYS) {
      expect(vedic.summary.grahas[key].dispositor.chain).toBeNull();
      expect(vedic.summary.grahas[key].dispositor.chainApplicable).toBe(false);
    }
  });
});

describe("TEST 16: final dispositor reconciles to Phase 4E", () => {
  it("summary.grahas[key].dispositor.finalDispositor matches chart.vedic.lordship.dispositorChains[key].finalDispositor", () => {
    const { vedic } = chart();
    for (const key of CLASSICAL_GRAHA_KEYS) {
      expect(vedic.summary.grahas[key].dispositor.finalDispositor).toBe(vedic.lordship.dispositorChains[key].finalDispositor);
    }
  });
});

describe("TEST 17: loops reconcile to Phase 4E", () => {
  it("summary.lordship.dispositorNetwork.loops canonicalMembers matches chart.vedic.lordship.loops", () => {
    const { vedic } = chart();
    const canonical = vedic.summary.lordship.dispositorNetwork.loops.map((l) => l.canonicalMembers);
    const source = vedic.lordship.loops.map((l) => l.members);
    expect(canonical).toEqual(source);
  });

  it("orderedPath is explicitly null for every loop (Part I limitation)", () => {
    const { vedic } = chart();
    for (const loop of vedic.summary.lordship.dispositorNetwork.loops) {
      expect(loop.orderedPath).toBeNull();
    }
    expect(vedic.summary.lordship.dispositorNetwork.orderedPathStatus).toBe(DISPOSITOR_LOOP_ORDERED_PATH_STATUS);
    expect(vedic.summary.lordship.dispositorNetwork.orderedPathStatus).toBe("not_implemented");
  });

  it("per-Graha loop field reconciles to Phase 4E for every classical Graha", () => {
    const { vedic } = chart();
    for (const key of CLASSICAL_GRAHA_KEYS) {
      expect(vedic.summary.grahas[key].dispositor.loop).toEqual(vedic.lordship.dispositorChains[key].loop);
    }
  });
});

describe("TEST 18: Lagna Lord Network reconciles", () => {
  it("summary.lagnaLordNetwork's core fields match chart.vedic.lordship.lagnaLordNetwork", () => {
    const { vedic } = chart();
    const s = vedic.summary.lagnaLordNetwork;
    const net = vedic.lordship.lagnaLordNetwork;
    expect(s.lagnaRashi).toBe(net.lagnaRashi);
    expect(s.lagnaLord).toBe(net.lagnaLord);
    expect(s.lagnaLordRashi).toBe(net.lagnaLordRashi);
    expect(s.lagnaLordBhava).toBe(net.lagnaLordBhava);
    expect(s.lagnaLordDispositor).toBe(net.lagnaLordDispositor);
    expect(s.dispositorChain).toEqual(net.dispositorChain);
    expect(s.finalDispositor).toBe(net.finalDispositor);
    expect(s.loop).toEqual(net.loop);
  });

  it("summary.lagnaLordNetwork's added dignity/nakshatra fields reconcile to Phase 4D/4C", () => {
    const { vedic } = chart();
    const s = vedic.summary.lagnaLordNetwork;
    const lagnaLordKey = NAVAGRAHA_ORDER.find((k) => GRAHA_DISPLAY_NAME[k] === s.lagnaLord);
    expect(s.lagnaLordDignity.dignityLabels).toEqual(vedic.condition.planets[lagnaLordKey].dignity.dignityLabels);
    expect(s.lagnaLordDignity.rashiDignityStatus).toBe(vedic.condition.planets[lagnaLordKey].dignity.rashiDignityStatus);
    expect(s.lagnaLordNakshatra.name).toBe(vedic.nakshatra.grahas[lagnaLordKey].nakshatra);
    expect(s.lagnaLordNakshatra.pada).toBe(vedic.nakshatra.grahas[lagnaLordKey].pada);
  });
});

// ============================================================
// TEST 19-21: Bhava reconciliation to Phase 4B
// ============================================================

describe("TEST 19: every Bhava Rashi reconciles to Phase 4B", () => {
  it("summary.bhavas[i].rashi matches chart.vedic.bhava.houses[i].rashi", () => {
    const { vedic } = chart();
    for (let i = 0; i < 12; i++) {
      expect(vedic.summary.bhavas[i].rashi).toBe(vedic.bhava.houses[i].rashi);
    }
  });
});

describe("TEST 20: every Bhava Lord reconciles to Phase 4B", () => {
  it("summary.bhavas[i].lord matches chart.vedic.bhava.houses[i].lord", () => {
    const { vedic } = chart();
    for (let i = 0; i < 12; i++) {
      expect(vedic.summary.bhavas[i].lord).toBe(vedic.bhava.houses[i].lord);
    }
  });
});

describe("TEST 21: every Bhava lord placement reconciles", () => {
  it("summary.bhavas[i].lordPlacement matches chart.vedic.lordship.houseLordMatrix[i]", () => {
    const { vedic } = chart();
    for (let i = 0; i < 12; i++) {
      const s = vedic.summary.bhavas[i];
      const row = vedic.lordship.houseLordMatrix[i];
      expect(s.lordPlacement.lordRashi).toBe(row.lordRashi);
      expect(s.lordPlacement.lordBhava).toBe(row.lordBhava);
      expect(s.lordCondition.rashiDignityStatus).toBe(row.lordDignityStatus);
      expect(s.lordCondition.retrograde).toBe(row.lordIsRetrograde);
      expect(s.lordCondition.combustion).toBe(row.lordIsCombust);
    }
  });

  it("summary.bhavas[i].grahas matches chart.vedic.bhava.houses[i].grahas", () => {
    const { vedic } = chart();
    for (let i = 0; i < 12; i++) {
      expect(vedic.summary.bhavas[i].grahas).toEqual(vedic.bhava.houses[i].grahas);
    }
  });
});

describe("TEST 22: house-group flags correct", () => {
  it("summary.bhavas[i].houseGroups matches chart.vedic.lordship.houseGroups membership", () => {
    const { vedic } = chart();
    const { kendra, trikona, dusthana, upachaya } = vedic.lordship.houseGroups;
    for (const b of vedic.summary.bhavas) {
      expect(b.houseGroups.isKendra).toBe(kendra.includes(b.bhavaNumber));
      expect(b.houseGroups.isTrikona).toBe(trikona.includes(b.bhavaNumber));
      expect(b.houseGroups.isDusthana).toBe(dusthana.includes(b.bhavaNumber));
      expect(b.houseGroups.isUpachaya).toBe(upachaya.includes(b.bhavaNumber));
    }
  });
});

// ============================================================
// TEST 23-24: lordship evidence reconciliation
// ============================================================

describe("TEST 23: planetary ownership evidence reconciles", () => {
  it("summary.grahas[key].ownership and summary.lordship.planets[key] match chart.vedic.lordship.planetaryLordshipRoles[key]", () => {
    const { vedic } = chart();
    for (const key of CLASSICAL_GRAHA_KEYS) {
      const role = vedic.lordship.planetaryLordshipRoles[key];
      const own = vedic.summary.grahas[key].ownership;
      expect(own.applicable).toBe(true);
      expect(own.ownedBhavas).toEqual(role.ownedHouses);
      expect(own.kendra).toEqual(role.ownedKendraHouses);
      expect(own.trikona).toEqual(role.ownedTrikonaHouses);
      expect(own.dusthana).toEqual(role.ownedDusthanaHouses);
      expect(own.upachaya).toEqual(role.ownedUpachayaHouses);

      const lp = vedic.summary.lordship.planets[key];
      expect(lp.ownedBhavas).toEqual(role.ownedHouses);
      expect(lp.ownedKendraHouses).toEqual(role.ownedKendraHouses);
      expect(lp.ownedTrikonaHouses).toEqual(role.ownedTrikonaHouses);
      expect(lp.ownedDusthanaHouses).toEqual(role.ownedDusthanaHouses);
      expect(lp.ownedUpachayaHouses).toEqual(role.ownedUpachayaHouses);
      expect(lp.currentBhava).toBe(vedic.bhava.grahaPlacements[key].bhavaNumber);
      expect(lp.currentRashi).toBe(vedic.grahas[key].rashi);
    }
  });

  it("summary.grahas[rahu/ketu].ownership is explicitly not applicable", () => {
    const { vedic } = chart();
    for (const key of NODE_KEYS) {
      expect(vedic.summary.grahas[key].ownership).toEqual({ applicable: false });
    }
  });
});

describe("TEST 24: Kendra+Trikona overlap reconciles", () => {
  it("ownsKendraAndTrikona matches chart.vedic.lordship.planetaryLordshipRoles for all 7 classical Grahas", () => {
    const { vedic } = chart();
    for (const key of CLASSICAL_GRAHA_KEYS) {
      const expected = vedic.lordship.planetaryLordshipRoles[key].ownsKendraAndTrikona;
      expect(vedic.summary.grahas[key].ownership.ownsKendraAndTrikona).toBe(expected);
      expect(vedic.summary.lordship.planets[key].ownsKendraAndTrikona).toBe(expected);
    }
    // Verification-chart known result (README/lordship report): only Sun and Mars.
    expect(vedic.summary.lordship.planets.sun.ownsKendraAndTrikona).toBe(true);
    expect(vedic.summary.lordship.planets.mars.ownsKendraAndTrikona).toBe(true);
    for (const key of ["moon", "mercury", "jupiter", "venus", "saturn"]) {
      expect(vedic.summary.lordship.planets[key].ownsKendraAndTrikona).toBe(false);
    }
  });
});

// ============================================================
// TEST 25-30: relationship indexes
// ============================================================

describe("TEST 25: grahasByBhava complete", () => {
  it("has all 12 Bhava numbers as keys, each an array, union covering all 9 Grahas", () => {
    const { vedic } = chart();
    const idx = vedic.summary.relationships.grahasByBhava;
    expect(Object.keys(idx).map(Number).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const all = Object.values(idx).flat();
    expect(all.length).toBe(9);
  });
});

describe("TEST 26: grahasByRashi complete", () => {
  it("has all 12 Rashi names as keys, union covering all 9 Grahas", () => {
    const { vedic } = chart();
    const idx = vedic.summary.relationships.grahasByRashi;
    expect(Object.keys(idx).sort()).toEqual(RASHIS.map((r) => r.name).sort());
    const all = Object.values(idx).flat();
    expect(all.length).toBe(9);
  });
});

describe("TEST 27: grahasByNakshatra complete", () => {
  it("has all 27 Nakshatra names as keys, union covering all 9 Grahas", () => {
    const { vedic } = chart();
    const idx = vedic.summary.relationships.grahasByNakshatra;
    expect(Object.keys(idx).sort()).toEqual(NAKSHATRAS.map((n) => n.name).sort());
    const all = Object.values(idx).flat();
    expect(all.length).toBe(9);
  });
});

describe("TEST 28: bhavasByLord complete", () => {
  it("has exactly the 7 classical Graha display names as keys, union covering all 12 Bhavas", () => {
    const { vedic } = chart();
    const idx = vedic.summary.relationships.bhavasByLord;
    expect(Object.keys(idx).sort()).toEqual(CLASSICAL_GRAHA_KEYS.map((k) => GRAHA_DISPLAY_NAME[k]).sort());
    const all = Object.values(idx).flat();
    expect(all.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
});

describe("TEST 29: no Graha appears twice in one index bucket", () => {
  it("grahasByBhava/grahasByRashi/grahasByNakshatra buckets have no internal duplicates", () => {
    const { vedic } = chart();
    for (const idx of [
      vedic.summary.relationships.grahasByBhava,
      vedic.summary.relationships.grahasByRashi,
      vedic.summary.relationships.grahasByNakshatra,
    ]) {
      for (const bucket of Object.values(idx)) {
        expect(new Set(bucket).size).toBe(bucket.length);
      }
    }
  });
});

describe("TEST 30: all 9 Grahas represented exactly once in each applicable index", () => {
  it("every Graha display name appears exactly once across grahasByBhava/grahasByRashi/grahasByNakshatra", () => {
    const { vedic } = chart();
    const allDisplayNames = NAVAGRAHA_ORDER.map((k) => GRAHA_DISPLAY_NAME[k]);
    for (const idx of [
      vedic.summary.relationships.grahasByBhava,
      vedic.summary.relationships.grahasByRashi,
      vedic.summary.relationships.grahasByNakshatra,
    ]) {
      const all = Object.values(idx).flat();
      for (const name of allDisplayNames) {
        expect(all.filter((x) => x === name).length).toBe(1);
      }
    }
  });
});

// ============================================================
// TEST 31-34: no fabrication for Rahu/Ketu, raw booleans preserved
// ============================================================

describe("TEST 31: Rahu/Ketu have no fabricated dignity", () => {
  it("dignity.applicable is false, no own-sign/exaltation/Moolatrikona boolean invented", () => {
    const { vedic } = chart();
    for (const key of NODE_KEYS) {
      const d = vedic.summary.grahas[key].dignity;
      expect(d.applicable).toBe(false);
      expect(d).not.toHaveProperty("isOwnSign");
      expect(d).not.toHaveProperty("isExaltedSign");
      expect(d).not.toHaveProperty("isMoolatrikona");
      expect(d.convention).toBe(vedic.condition.nodes[key].dignityConvention);
    }
  });
});

describe("TEST 32: Rahu/Ketu have no fabricated house ownership", () => {
  it("ownership.applicable is false, no owned houses invented", () => {
    const { vedic } = chart();
    for (const key of NODE_KEYS) {
      expect(vedic.summary.grahas[key].ownership).toEqual({ applicable: false });
    }
  });
});

describe("TEST 33: raw dignity booleans preserved", () => {
  it("all 6 independent dignity booleans are present and not collapsed for every classical Graha", () => {
    const { vedic } = chart();
    for (const key of CLASSICAL_GRAHA_KEYS) {
      const d = vedic.summary.grahas[key].dignity;
      for (const boolKey of [
        "isOwnSign",
        "isExaltedSign",
        "isDebilitatedSign",
        "isMoolatrikona",
        "isExactExaltationPoint",
        "isExactDebilitationPoint",
      ]) {
        expect(typeof d[boolKey]).toBe("boolean");
      }
    }
  });

  it("Venus (Moolatrikona AND own sign in the verification chart) shows both booleans true simultaneously", () => {
    const { vedic } = chart();
    const d = vedic.summary.grahas.venus.dignity;
    expect(d.isMoolatrikona).toBe(true);
    expect(d.isOwnSign).toBe(true);
  });
});

describe("TEST 34: dignityLabels preserved", () => {
  it("summary.grahas[key].dignity.dignityLabels matches Phase 4D verbatim, never collapsed to just rashiDignityStatus", () => {
    const { vedic } = chart();
    for (const key of CLASSICAL_GRAHA_KEYS) {
      expect(vedic.summary.grahas[key].dignity.dignityLabels).toEqual(vedic.condition.planets[key].dignity.dignityLabels);
    }
    // Venus/Saturn in the verification chart both carry 2 simultaneous labels.
    expect(vedic.summary.grahas.venus.dignity.dignityLabels).toEqual(["moolatrikona", "own_sign"]);
    expect(vedic.summary.grahas.saturn.dignity.dignityLabels).toEqual(["moolatrikona", "own_sign"]);
  });
});

// ============================================================
// TEST 35-36: flags
// ============================================================

describe("TEST 35: factual flags generated correctly", () => {
  it("Venus (retrograde, own sign, Moolatrikona, self-dispositor) carries exactly those flags in the verification chart", () => {
    const { vedic } = chart();
    const flags = vedic.summary.grahas.venus.flags;
    expect(flags).toContain("retrograde");
    expect(flags).toContain("own_sign");
    expect(flags).toContain("moolatrikona");
    expect(flags).toContain("self_dispositor");
    expect(flags).not.toContain("exalted_sign");
    expect(flags).not.toContain("combust");
  });

  it("Mercury/Jupiter (combust in the verification chart) carry the combust flag", () => {
    const { vedic } = chart();
    expect(vedic.summary.grahas.mercury.flags).toContain("combust");
    expect(vedic.summary.grahas.jupiter.flags).toContain("combust");
  });

  it("flags are generated only from already-computed evidence (spot check against source booleans) for every classical Graha", () => {
    const { vedic } = chart();
    for (const key of CLASSICAL_GRAHA_KEYS) {
      const flags = vedic.summary.grahas[key].flags;
      const g = vedic.grahas[key];
      const c = vedic.condition.planets[key];
      const disp = vedic.lordship.dispositors[key];
      expect(flags.includes("retrograde")).toBe(g.motion.retrograde);
      expect(flags.includes("combust")).toBe(c.condition.combustion.isCombust);
      expect(flags.includes("own_sign")).toBe(c.dignity.isOwnSign);
      expect(flags.includes("exalted_sign")).toBe(c.dignity.isExaltedSign);
      expect(flags.includes("debilitated_sign")).toBe(c.dignity.isDebilitatedSign);
      expect(flags.includes("moolatrikona")).toBe(c.dignity.isMoolatrikona);
      expect(flags.includes("self_dispositor")).toBe(disp.isSelfDispositor);
    }
  });
});

describe("TEST 36: no interpretive flags", () => {
  it("no flag anywhere is strong/weak/auspicious/inauspicious/career/relationship-shaped", () => {
    const { vedic } = chart();
    const bannedPattern = /strong|weak|auspicious|inauspicious|career|relationship|positive|negative|difficult|good|bad/i;
    for (const key of NAVAGRAHA_ORDER) {
      for (const flag of vedic.summary.grahas[key].flags) {
        expect(flag).not.toMatch(bannedPattern);
      }
    }
  });
});

// ============================================================
// TEST 37-38: unresolved conventions
// ============================================================

describe("TEST 37: unresolvedConventions derives from live metadata", () => {
  it("every entry's status matches the live chart.vedic.meta value for its metaKey (or the module's own dispositor-loop-ordered-path marker)", () => {
    const { vedic } = chart();
    for (const entry of vedic.summary.unresolvedConventions) {
      if (entry.metaKey === "dispositorLoopOrderedPath") {
        expect(entry.status).toBe(DISPOSITOR_LOOP_ORDERED_PATH_STATUS);
      } else {
        expect(vedic.meta[entry.metaKey]).toBe(entry.status);
      }
    }
  });

  it("recomputing with a mutated meta value changes the resulting unresolvedConventions (proves it is live, not hard-coded)", () => {
    const { vedic } = chart();
    const mutatedMeta = { ...vedic.meta, shadbala: "not_implemented", dashaSystem: "resolved_hypothetically" };
    const rebuilt = buildVedicTechnicalSummary({
      meta: mutatedMeta,
      lagna: vedic.lagna,
      grahas: vedic.grahas,
      bhava: vedic.bhava,
      nakshatra: vedic.nakshatra,
      condition: vedic.condition,
      lordship: vedic.lordship,
    });
    expect(rebuilt.unresolvedConventions.some((e) => e.metaKey === "dashaSystem")).toBe(false);
    expect(rebuilt.unresolvedConventions.some((e) => e.metaKey === "shadbala")).toBe(true);
  });
});

describe("TEST 38: implemented features are not listed unresolved", () => {
  it("no unresolvedConventions entry references a meta field whose value is an actual defined convention (not a deferral marker)", () => {
    const { vedic } = chart();
    const unresolvedKeys = new Set(vedic.summary.unresolvedConventions.map((e) => e.metaKey));
    for (const implementedKey of ["dispositorSystem", "bhavaSystem", "nakshatraSystem", "vedicDignitySystem", "vedicNodeType", "ayanamsha"]) {
      expect(unresolvedKeys.has(implementedKey)).toBe(false);
    }
    // "none"-valued interpretation fields are a permanent by-design
    // decision, not a deferred feature - never listed as unresolved.
    expect(unresolvedKeys.has("vedicInterpretation")).toBe(false);
    expect(unresolvedKeys.has("vedicLordshipInterpretation")).toBe(false);
    expect(unresolvedKeys.has("technicalSummaryInterpretation")).toBe(false);
  });
});

// ============================================================
// TEST 39: provenance
// ============================================================

describe("TEST 39: provenance labels correct", () => {
  it("every Graha evidence record's provenance names the correct source phase per concept", () => {
    const { vedic } = chart();
    for (const key of NAVAGRAHA_ORDER) {
      const p = vedic.summary.grahas[key].provenance;
      expect(p.position).toBe("phase_4a");
      expect(p.bhava).toBe("phase_4b");
      expect(p.nakshatra).toBe("phase_4c");
      expect(p.dignity).toBe("phase_4d");
      expect(p.condition).toBe("phase_4d");
      expect(p.ownership).toBe("phase_4e");
      expect(p.dispositor).toBe("phase_4e");
    }
  });

  it("top-level provenance and chartOverview provenance only reference the 5 source phases", () => {
    const { vedic } = chart();
    expect(Object.keys(vedic.summary.provenance).sort()).toEqual([...SOURCE_PHASES].sort());
    expect(Object.values(vedic.summary.chartOverview.provenance).every((v) => SOURCE_PHASES.includes(v))).toBe(true);
  });
});

// ============================================================
// TEST 40-41: JSON serialization / circular references
// ============================================================

describe("TEST 40: summary JSON serializable", () => {
  it("JSON.stringify/parse round-trips chart.vedic.summary without throwing", () => {
    const { vedic } = chart();
    expect(() => JSON.stringify(vedic.summary)).not.toThrow();
    const parsed = JSON.parse(JSON.stringify(vedic.summary));
    expect(Object.keys(parsed).sort()).toEqual(
      ["meta", "chartOverview", "grahas", "bhavas", "lagnaLordNetwork", "lordship", "relationships", "unresolvedConventions", "provenance"].sort(),
    );
  });
});

describe("TEST 41: no circular references", () => {
  it("no functions, no circular structure anywhere in chart.vedic.summary", () => {
    const { vedic } = chart();
    expect(() => JSON.stringify(vedic.summary)).not.toThrow();
    const walk = (value, seen = new Set()) => {
      if (typeof value === "function") throw new Error("function found in chart.vedic.summary");
      if (value && typeof value === "object") {
        if (seen.has(value)) throw new Error("circular reference found in chart.vedic.summary");
        seen.add(value);
        for (const v of Object.values(value)) walk(v, seen);
      }
    };
    expect(() => walk(vedic.summary)).not.toThrow();
  });
});

// ============================================================
// TEST 42-46: mutation isolation (Part S)
// ============================================================

describe("TEST 42: mutating summary does not mutate Phase 4A source", () => {
  it("mutating summary.grahas.sun.position.motion does not change chart.vedic.grahas.sun.motion", () => {
    const { vedic } = chart();
    const before = vedic.grahas.sun.motion.retrograde;
    vedic.summary.grahas.sun.position.motion.retrograde = !before;
    expect(vedic.grahas.sun.motion.retrograde).toBe(before);
  });
});

describe("TEST 43: mutating summary does not mutate Phase 4B source", () => {
  it("pushing into summary.bhavas[0].grahas does not change chart.vedic.bhava.houses[0].grahas", () => {
    const { vedic } = chart();
    const beforeLength = vedic.bhava.houses[0].grahas.length;
    vedic.summary.bhavas[0].grahas.push("Intruder");
    expect(vedic.bhava.houses[0].grahas.length).toBe(beforeLength);
    expect(vedic.bhava.houses[0].grahas).not.toContain("Intruder");
  });
});

describe("TEST 44: mutating summary does not mutate Phase 4C source", () => {
  it("mutating summary.grahas.moon.nakshatra does not change chart.vedic.nakshatra.grahas.moon", () => {
    const { vedic } = chart();
    const before = vedic.nakshatra.grahas.moon.nakshatra;
    vedic.summary.grahas.moon.nakshatra.name = "Intruder Nakshatra";
    expect(vedic.nakshatra.grahas.moon.nakshatra).toBe(before);
  });
});

describe("TEST 45: mutating summary does not mutate Phase 4D source", () => {
  it("pushing into summary.grahas.sun.dignity.dignityLabels does not change chart.vedic.condition.planets.sun.dignity.dignityLabels", () => {
    const { vedic } = chart();
    const beforeLength = vedic.condition.planets.sun.dignity.dignityLabels.length;
    vedic.summary.grahas.sun.dignity.dignityLabels.push("intruder_label");
    expect(vedic.condition.planets.sun.dignity.dignityLabels.length).toBe(beforeLength);
    expect(vedic.condition.planets.sun.dignity.dignityLabels).not.toContain("intruder_label");
  });
});

describe("TEST 46: mutating summary does not mutate Phase 4E source", () => {
  it("pushing into summary.lordship.dispositorNetwork.chains.sun.chain does not change chart.vedic.lordship.dispositorChains.sun.chain", () => {
    const { vedic } = chart();
    const beforeLength = vedic.lordship.dispositorChains.sun.chain.length;
    vedic.summary.lordship.dispositorNetwork.chains.sun.chain.push("Intruder");
    expect(vedic.lordship.dispositorChains.sun.chain.length).toBe(beforeLength);
    expect(vedic.lordship.dispositorChains.sun.chain).not.toContain("Intruder");
  });
});

// ============================================================
// TEST 47-56: no new doctrine / no scoring / no interpretation
// ============================================================

describe("TEST 47: no Dasha", () => {
  it("no Dasha/Mahadasha/Antardasha field or value anywhere in chart.vedic.summary", () => {
    const { vedic } = chart();
    expect(JSON.stringify(vedic.summary)).not.toMatch(/mahadasha|antardasha|pratyantardasha|dasha_balance/i);
  });
});

// unresolvedConventions is EXCLUDED from the scans below - it is
// precisely the manifest of what is NOT implemented (e.g. a
// "navamsa_from_pada"/"shadbala" topic with status "not_implemented"),
// so mentioning those names there confirms absence, not implementation.

describe("TEST 48: no Navamsa/Varga", () => {
  it("no Navamsa/Varga/D9 field anywhere in chart.vedic.summary's data", () => {
    const { vedic } = chart();
    const { unresolvedConventions, ...rest } = vedic.summary;
    expect(JSON.stringify(rest)).not.toMatch(/navamsa|varga|\bd9\b/i);
  });
});

describe("TEST 49: no Shadbala", () => {
  it("no Shadbala/Sthana Bala/Dig Bala numeric strength field in chart.vedic.summary's data", () => {
    const { vedic } = chart();
    const { unresolvedConventions, ...rest } = vedic.summary;
    expect(JSON.stringify(rest)).not.toMatch(/shadbala|sthanabala|digbala|kalabala|chestabala|naisargikabala|drikbala/i);
  });
});

describe("TEST 50: no Yoga detection", () => {
  it("no Yoga name or detection field anywhere in chart.vedic.summary", () => {
    const { vedic } = chart();
    expect(JSON.stringify(vedic.summary)).not.toMatch(/gajakesari|panchamahapurusha|neechabhanga|rajayoga|dhanayoga/i);
  });
});

describe("TEST 51: no functional benefic/malefic", () => {
  it("no per-planet functionalBenefic/functionalMalefic assignment anywhere in the Graha or lordship evidence records", () => {
    const { vedic } = chart();
    for (const key of NAVAGRAHA_ORDER) {
      expect(vedic.summary.grahas[key]).not.toHaveProperty("functionalBenefic");
      expect(vedic.summary.grahas[key]).not.toHaveProperty("functionalMalefic");
    }
    for (const key of CLASSICAL_GRAHA_KEYS) {
      expect(vedic.summary.lordship.planets[key]).not.toHaveProperty("functionalBenefic");
      expect(vedic.summary.lordship.planets[key]).not.toHaveProperty("functionalMalefic");
    }
  });
});

describe("TEST 52: no Yogakaraka", () => {
  it("no per-planet yogakaraka assignment anywhere in the Graha or lordship evidence records", () => {
    const { vedic } = chart();
    for (const key of NAVAGRAHA_ORDER) {
      expect(vedic.summary.grahas[key]).not.toHaveProperty("yogakaraka");
      expect(vedic.summary.grahas[key].flags).not.toContain("yogakaraka");
    }
  });
});

describe("TEST 53: no Maraka", () => {
  it("no per-planet maraka assignment anywhere in the Graha or lordship evidence records", () => {
    const { vedic } = chart();
    for (const key of NAVAGRAHA_ORDER) {
      expect(vedic.summary.grahas[key]).not.toHaveProperty("maraka");
    }
  });
});

describe("TEST 54: no Badhaka", () => {
  it("no per-planet badhaka assignment anywhere in the Graha or lordship evidence records", () => {
    const { vedic } = chart();
    for (const key of NAVAGRAHA_ORDER) {
      expect(vedic.summary.grahas[key]).not.toHaveProperty("badhaka");
    }
  });
});

describe("TEST 55: no scoring", () => {
  it("no score field anywhere in chart.vedic.summary", () => {
    const { vedic } = chart();
    expect(JSON.stringify(vedic.summary)).not.toMatch(/score/i);
  });
});

describe("TEST 56: no interpretation", () => {
  it("no personality/career/love/family/wealth/health/prediction text anywhere in chart.vedic.summary", () => {
    const { vedic } = chart();
    expect(JSON.stringify(vedic.summary)).not.toMatch(/personality|career|love life|marriage prospect|wealth prospect|health issue|prediction|life purpose|spirituality/i);
  });
});

// ============================================================
// TEST 57-64: full regression
// ============================================================

describe("TEST 57: Phase 4A unchanged", () => {
  it("chart.vedic.grahas/lagna/ayanamsha are untouched by adding chart.vedic.summary", () => {
    const withSummary = chart();
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withSummary.vedic.grahas).toEqual(fresh.vedic.grahas);
    expect(withSummary.vedic.lagna).toEqual(fresh.vedic.lagna);
    expect(withSummary.vedic.ayanamsha).toEqual(fresh.vedic.ayanamsha);
  });
});

describe("TEST 58: Phase 4B unchanged", () => {
  it("chart.vedic.bhava is untouched by adding chart.vedic.summary", () => {
    const withSummary = chart();
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withSummary.vedic.bhava).toEqual(fresh.vedic.bhava);
  });
});

describe("TEST 59: Phase 4C unchanged", () => {
  it("chart.vedic.nakshatra is untouched by adding chart.vedic.summary", () => {
    const withSummary = chart();
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withSummary.vedic.nakshatra).toEqual(fresh.vedic.nakshatra);
  });
});

describe("TEST 60: Phase 4D unchanged", () => {
  it("chart.vedic.condition is untouched by adding chart.vedic.summary", () => {
    const withSummary = chart();
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withSummary.vedic.condition).toEqual(fresh.vedic.condition);
  });
});

describe("TEST 61: Phase 4E unchanged", () => {
  it("chart.vedic.lordship is untouched by adding chart.vedic.summary", () => {
    const withSummary = chart();
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withSummary.vedic.lordship).toEqual(fresh.vedic.lordship);
  });
});

describe("TEST 62: Western unchanged", () => {
  it("chart.points/planets/angles/houseCusps are untouched by adding chart.vedic.summary", () => {
    const withSummary = chart();
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withSummary.points).toEqual(fresh.points);
    expect(withSummary.planets).toEqual(fresh.planets);
    expect(withSummary.angles).toEqual(fresh.angles);
    expect(withSummary.houseCusps).toEqual(fresh.houseCusps);
  });
});

describe("TEST 63: Classical unchanged", () => {
  it("chart.classical is untouched by adding chart.vedic.summary", () => {
    const withSummary = chart();
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withSummary.classical).toEqual(fresh.classical);
  });
});

describe("TEST 64: Phase 3H unchanged", () => {
  it("chart.classical.summary is untouched by adding chart.vedic.summary", () => {
    const withSummary = chart();
    const fresh = calculateChart(VERIFICATION_INPUT);
    expect(withSummary.classical.summary).toEqual(fresh.classical.summary);
  });
});

// ============================================================
// Additional: verification-chart sanity totals
// ============================================================

describe("Verification-chart summary totals reconcile", () => {
  it("matches the locked verification chart's known shape end-to-end", () => {
    const { vedic } = chart();
    expect(vedic.summary.chartOverview.lagna.rashi).toBe("Leo");
    expect(vedic.summary.chartOverview.lagna.lagnaLord).toBe("Sun");
    expect(vedic.summary.lagnaLordNetwork.finalDispositor).toBe("Venus");
    expect(vedic.summary.lordship.dispositorNetwork.loops.length).toBe(0);
    expect(vedic.summary.bhavas.length).toBe(12);
    expect(Object.keys(vedic.summary.grahas).length).toBe(9);
    expect(Object.keys(vedic.summary.lordship.planets).length).toBe(7);
  });
});
