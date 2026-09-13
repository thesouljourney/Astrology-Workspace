import { useState } from "react";
import ChartMetaAndHouses from "../ChartMetaAndHouses.jsx";
import ModernWestern from "../ModernWestern.jsx";
import ClassicalAstrology from "../ClassicalAstrology.jsx";
import VedicAstrology from "../VedicAstrology.jsx";
import CrossSystemEvidence from "../CrossSystemEvidence.jsx";

/** Exported so the four-system-tab structure (Part 4) is directly testable without a React rendering harness. */
export const SYSTEMS = [
  { id: "modernWestern", label: "Modern Western｜西洋占星" },
  { id: "classical", label: "Classical｜古典占星" },
  { id: "vedic", label: "Vedic｜印度占星" },
  { id: "crossSystem", label: "Cross-System｜跨体系" },
];

/**
 * Chart Data — Targeted UX Refinement: the Case's complete technical
 * reference library, reorganized into four clearly separated system
 * views (Modern Western / Classical / Vedic / Cross-System) instead of
 * one long mixed page. Reuses the exact same already-calculated `chart`
 * and the exact same locked display components already built for
 * Modern Western/Classical/Vedic/Cross-System - this file computes
 * nothing and defines no new astrology component; it only decides which
 * ONE of the four already-existing components is visible at a time.
 * Houses (Part 5.E) live in the Modern Western view via
 * `ChartMetaAndHouses`; "Related Anchors" (Part 8.B) now lives inside
 * `CrossSystemEvidence.jsx` itself, since that component's only
 * remaining consumer is this Cross-System tab.
 */
export function CaseChartData({ chart }) {
  const [activeSystem, setActiveSystem] = useState("modernWestern");

  return (
    <div className="case-chart-data">
      <nav className="chart-data-system-nav">
        {SYSTEMS.map((s) => (
          <button key={s.id} type="button" className={activeSystem === s.id ? "topic-btn active" : "topic-btn"} onClick={() => setActiveSystem(s.id)}>
            {s.label}
          </button>
        ))}
      </nav>

      {activeSystem === "modernWestern" && (
        <div className="chart-data-system-panel">
          <ChartMetaAndHouses chart={chart} />
          <ModernWestern chart={chart} />
        </div>
      )}

      {activeSystem === "classical" && (
        <div className="chart-data-system-panel">
          <ClassicalAstrology chart={chart} />
        </div>
      )}

      {activeSystem === "vedic" && (
        <div className="chart-data-system-panel">
          <VedicAstrology chart={chart} />
        </div>
      )}

      {activeSystem === "crossSystem" && (
        <div className="chart-data-system-panel">
          <CrossSystemEvidence chart={chart} />
        </div>
      )}
    </div>
  );
}
