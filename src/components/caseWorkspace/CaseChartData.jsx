import ChartMetaAndHouses from "../ChartMetaAndHouses.jsx";
import ModernWestern from "../ModernWestern.jsx";
import ClassicalAstrology from "../ClassicalAstrology.jsx";
import VedicAstrology from "../VedicAstrology.jsx";
import CrossSystemEvidence from "../CrossSystemEvidence.jsx";
import { formatDMS } from "../../utils/formatDegree.js";

/**
 * Related Anchors — Production UX Refactor, Part 7. A presentation-only
 * addition over already-locked Phase 1 (`chart.angles.asc`) and Phase 4B
 * (`chart.vedic.summary.chartOverview.lagna`) values - it computes
 * nothing new. Deliberately does NOT label ASC as a celestial body, does
 * NOT add it to Cross-System Evidence's "Shared Bodies" count below, and
 * does NOT claim tropical ASC and sidereal Lagna are numerically
 * equivalent (Phase 5's own Cross-System Evidence section already
 * establishes, unchanged, that Western/Classical output is always
 * tropical and Vedic output is always sidereal).
 */
function RelatedAnchors({ chart }) {
  const asc = chart.angles?.asc;
  const lagna = chart.vedic?.summary?.chartOverview?.lagna;
  if (!asc || !lagna) return null;

  return (
    <section className="related-anchors">
      <h3>Related Anchors｜相关核心锚点</h3>
      <p className="reception-note">
        A presentation-only grouping of conceptually related chart anchors across systems — not a claim of numerical
        equivalence｜跨体系概念相关锚点的展示分组 — 并非数值等价声明
      </p>
      <div className="table-scroll">
        <table className="classical-table">
          <thead>
            <tr>
              <th>System｜体系</th>
              <th>Anchor｜锚点</th>
              <th>Zodiac｜黄道</th>
              <th>Value｜数值</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Modern Western｜现代西方</td>
              <td>ASC｜上升</td>
              <td>Tropical｜回归制</td>
              <td>
                {asc.sign.english} {formatDMS(asc.degreeInSign)}
              </td>
            </tr>
            <tr>
              <td>Classical｜古典</td>
              <td>ASC｜上升</td>
              <td>Tropical｜回归制</td>
              <td>
                {asc.sign.english} {formatDMS(asc.degreeInSign)}
              </td>
            </tr>
            <tr>
              <td>Vedic｜印度</td>
              <td>Lagna｜上升点</td>
              <td>Sidereal｜恒星制</td>
              <td>
                {lagna.rashi} {formatDMS(lagna.degreeInRashi)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="reception-note">
        Conceptually Related Anchor｜概念相关核心锚点 — Not Numerically Equivalent｜数值不可直接等同: same astronomical
        horizon point, different zodiac frame and therefore a different resulting sign/degree - see Cross-System
        Evidence below for the full, unchanged Phase 5 equivalence rules｜同一天文地平点，坐标系不同、结果星座/度数亦不同 —
        完整且未变的 Phase 5 等价规则见下方跨体系证据
      </p>
    </section>
  );
}

/**
 * Chart Data — Production UX Refactor, Part 7: the Case's complete
 * technical reference library, reusing the SAME already-calculated
 * `chart` and the SAME locked display components already built for
 * Quick Calculator - this file computes nothing and defines no new
 * astrology component. Raw/debug expanders are hidden via CSS only (see
 * `.case-chart-data details.raw-data` in `caseWorkspace.css`) — Part 9 -
 * the underlying data these expanders would have shown is completely
 * unchanged and still reachable from Quick Calculator.
 */
export function CaseChartData({ chart }) {
  return (
    <div className="case-chart-data">
      <ChartMetaAndHouses chart={chart} />
      <RelatedAnchors chart={chart} />
      <ModernWestern chart={chart} />
      <ClassicalAstrology chart={chart} />
      <VedicAstrology chart={chart} />
      <CrossSystemEvidence chart={chart} />
    </div>
  );
}
