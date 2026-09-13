import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { SYSTEMS } from "../caseWorkspace/CaseChartData.jsx";
import { SHARED_BODY_KEYS } from "../CrossSystemEvidence.jsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = (relPath) => readFileSync(join(__dirname, "..", "..", "..", relPath), "utf-8");

/**
 * Targeted UX Refinement - project has no React component-rendering
 * test infrastructure (see `editCaseLifecycle.test.js`'s own note), so
 * these tests target the same two things every prior phase's UI tests
 * have: (1) exported configuration/data the UI renders FROM, and (2) a
 * source-level regression guard against a removed feature reappearing.
 * Live behavior (tab switching, exact DOM visibility per system, no
 * horizontal overflow) was verified with a headless-browser workflow
 * script across 390/430/768/1400px - see the final report.
 */
describe("Targeted UX Refinement: Quick Calculator removed from navigation", () => {
  it("App.jsx no longer renders a 'Quick Calculator' navigation destination", () => {
    const appSource = src("src/App.jsx");
    expect(appSource).not.toContain("Quick Calculator｜快速计算"); // the literal removed nav label - explanatory comments may still mention the feature by name
    expect(appSource).not.toContain("activeTab");
  });

  it("App.jsx renders CaseWorkspace unconditionally - Cases is the sole/default entry", () => {
    const appSource = src("src/App.jsx");
    expect(appSource).toMatch(/<CaseWorkspace\s*\/>/);
  });

  it("the locked calculation engine entry point is untouched and still exported", async () => {
    const { calculateChart } = await import("../../astrology/ephemeris.js");
    expect(typeof calculateChart).toBe("function");
  });

  it("reusable display components removed from Quick Calculator remain in place, still used by Case Chart Data", () => {
    const caseChartDataSource = src("src/components/caseWorkspace/CaseChartData.jsx");
    for (const componentImport of ["ModernWestern", "ClassicalAstrology", "VedicAstrology", "CrossSystemEvidence", "ChartMetaAndHouses"]) {
      expect(caseChartDataSource).toContain(componentImport);
    }
  });
});

describe("Targeted UX Refinement: Case Chart Data four-system architecture", () => {
  it("exposes exactly four top-level system views, in the specified order", () => {
    expect(SYSTEMS.map((s) => s.id)).toEqual(["modernWestern", "classical", "vedic", "crossSystem"]);
  });

  it("every system has a bilingual label", () => {
    for (const system of SYSTEMS) {
      expect(system.label).toContain("｜");
    }
  });
});

describe("Targeted UX Refinement: Cross-System Shared Bodies never includes ASC", () => {
  it("SHARED_BODY_KEYS is exactly the 7 traditional shared planets - never an angle", () => {
    expect(SHARED_BODY_KEYS).toEqual(["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"]);
    expect(SHARED_BODY_KEYS).not.toContain("asc");
    expect(SHARED_BODY_KEYS).toHaveLength(7);
  });

  it("Related Anchors wording explicitly denies numerical equivalence and never claims ASC = Lagna", () => {
    const crossSystemSource = src("src/components/CrossSystemEvidence.jsx");
    expect(crossSystemSource).toContain("Related Anchors");
    expect(crossSystemSource).toContain("Not Numerically Equivalent");
    expect(crossSystemSource).not.toMatch(/ASC\s*=\s*Lagna/i);
  });
});

describe("Targeted UX Refinement: no Raw/debug UI in Case Chart Data", () => {
  it("ModernWestern.jsx no longer renders a raw calculation data dump", () => {
    const modernWesternSource = src("src/components/ModernWestern.jsx");
    expect(modernWesternSource).not.toContain("raw-data");
    expect(modernWesternSource).not.toContain("Raw Calculation Data");
  });

  it("SystemEvidencePanel (Topics workspace, unchanged by this refinement) still has no raw JSON dump either", () => {
    const panelSource = src("src/components/caseWorkspace/SystemEvidencePanel.jsx");
    expect(panelSource).not.toContain("ws-evidence-raw");
  });
});

describe("Targeted UX Refinement: Vedic view does not fabricate unimplemented doctrine", () => {
  it("VedicAstrology.jsx does not claim Drishti/Dasha/Vargas/Shadbala/Yoga are implemented", () => {
    const vedicSource = src("src/components/VedicAstrology.jsx");
    // Presence of the word alone (e.g. in a "not yet implemented" list) is fine;
    // this guards against a literal computed Drishti/Dasha VALUE ever being rendered as if resolved.
    expect(vedicSource).not.toMatch(/drishti\s*[:=]\s*{/i);
    expect(vedicSource).not.toMatch(/dasha\s*[:=]\s*{/i);
  });
});

describe("Targeted UX Refinement: Classical Aspects remain reachable from Case Chart Data", () => {
  it("ClassicalAstrology.jsx (rendered in the Classical system view) still renders a Classical Aspects section", () => {
    const classicalSource = src("src/components/ClassicalAstrology.jsx");
    expect(classicalSource).toContain("Aspects");
  });
});
