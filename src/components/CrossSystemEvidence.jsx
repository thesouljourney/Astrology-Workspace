import { formatDMS } from "../utils/formatDegree.js";

const STATUS_LABEL = {
  implemented: "✓",
  notImplemented: "—",
  notApplicable: "n/a",
};

const STATUS_TITLE = {
  implemented: "Implemented｜已实现",
  notImplemented: "Not implemented｜未实现",
  notApplicable: "Not applicable｜不适用",
};

const CATEGORY_LABEL = {
  identity: "Identity｜身份",
  position: "Position｜位置",
  zodiac: "Zodiac｜黄道",
  houses: "Houses｜宫位（西式）",
  houseLords: "House Lords｜宫主",
  angles: "Angles｜四轴",
  aspects: "Aspects｜相位",
  dignity: "Dignity｜尊贵",
  sect: "Sect｜昼夜",
  planetaryCondition: "Planetary Condition｜行星状态",
  dispositor: "Dispositor｜守护星",
  reception: "Reception｜接纳",
  perfection: "Perfection｜完成式",
  nakshatra: "Nakshatra｜二十七宿",
  bhava: "Bhava｜宫位（印度式）",
  lordship: "Lordship Structure｜宫主结构",
  motion: "Motion｜运行",
  nodes: "Nodes｜交点",
  calculatedPoints: "Calculated Points｜计算点",
  provenance: "Provenance｜数据来源",
};

const FAMILY_LABEL_FALLBACK = (family) => family.replace(/_/g, " ");

/**
 * Related Anchors — Targeted UX Refinement, Part 8B. A presentation-only
 * addition over already-locked Phase 1 (`chart.angles.asc`) and Phase 4B
 * (`chart.vedic.summary.chartOverview.lagna`) values - it computes
 * nothing new. Deliberately does NOT label ASC as a celestial body, does
 * NOT add it to this file's own "Shared Bodies" count above, and does
 * NOT claim tropical ASC and sidereal Lagna are numerically equivalent -
 * this file's own equivalence rules (Same Frame / Numerically Equivalent
 * columns above) are unchanged and remain the authority.
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
        Conceptually Related｜概念相关 — Not Numerically Equivalent｜数值不可直接等同: same astronomical horizon point,
        different zodiac frame and therefore a different resulting sign/degree - see "Shared Bodies" above for the
        full, unchanged Phase 5 equivalence rules｜同一天文地平点，坐标系不同、结果星座/度数亦不同 — 完整且未变的 Phase 5
        等价规则见上方"共同天体"
      </p>
    </section>
  );
}


function StatusCell({ cell }) {
  return (
    <td title={STATUS_TITLE[cell.status]} className={cell.status === "implemented" ? "cs-implemented" : cell.status === "notApplicable" ? "cs-not-applicable" : "cs-not-implemented"}>
      {STATUS_LABEL[cell.status]}
    </td>
  );
}

/** Exported so "Shared Bodies never includes ASC" (Part 8.A) is directly testable without a React rendering harness - the 7 traditional shared classical planets only, never an angle. */
export const SHARED_BODY_KEYS = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"];

export default function CrossSystemEvidence({ chart }) {
  const { crossSystem } = chart;
  if (!crossSystem) return null;

  const { meta, systems, evidenceAvailability, bodyIdentities, conceptFamilies, comparisonGroups, nonEquivalentConcepts } = crossSystem;

  const sharedBodyKeys = SHARED_BODY_KEYS;

  return (
    <section className="cross-system-evidence">
      <h2>Cross-System Evidence｜跨体系证据</h2>
      <p className="reception-note">
        A neutral mapping of what technical evidence exists in Modern Western, Classical, and Vedic astrology, where it
        lives, and which concepts belong to a shared broad family — this is NOT a merged doctrine, NOT a claim of
        equivalence, and NOT an interpretation｜标示现代西方、古典与印度占星三体系中已有的技术证据及其归属，以及哪些概念属于同一大类
        —
        并非合并的学说、并非等价声明、亦非解读
      </p>

      <h3>System Availability｜体系可用性</h3>
      <div className="table-scroll">
        <table className="classical-table">
          <thead>
            <tr>
              <th>System｜体系</th>
              <th>Available｜可用</th>
              <th>Zodiac｜黄道</th>
              <th>Summary Layer｜汇总层</th>
              <th>Source Phases｜来源阶段</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Modern Western｜现代西方</td>
              <td>{systems.modernWestern.available ? "Yes｜是" : "No｜否"}</td>
              <td>{systems.modernWestern.zodiacType}</td>
              <td>{systems.modernWestern.summaryAvailable ? systems.modernWestern.summarySource : "Not built｜未建立"}</td>
              <td>{systems.modernWestern.sourcePhases.join(", ")}</td>
            </tr>
            <tr>
              <td>Classical｜古典</td>
              <td>{systems.classical.available ? "Yes｜是" : "No｜否"}</td>
              <td>{systems.classical.zodiacType}</td>
              <td>{systems.classical.summarySource}</td>
              <td>{systems.classical.sourcePhases.join(", ")}</td>
            </tr>
            <tr>
              <td>Vedic｜印度</td>
              <td>{systems.vedic.available ? "Yes｜是" : "No｜否"}</td>
              <td>{systems.vedic.zodiacType}</td>
              <td>{systems.vedic.summarySource}</td>
              <td>{systems.vedic.sourcePhases.join(", ")}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Shared Bodies｜共同天体</h3>
      <p className="reception-note">
        Same astronomical point, three different astrological frameworks — matching calculation convention does NOT
        imply matching zodiac frame or matching number｜同一天体，三种不同占星框架 — 算法相同不代表坐标系或数值相同
      </p>
      <div className="table-scroll">
        <table className="classical-table">
          <thead>
            <tr>
              <th>Body｜天体</th>
              <th>Western Sign｜西方星座</th>
              <th>Classical Sign｜古典星座</th>
              <th>Vedic Rashi｜印度星座</th>
              <th title="Same astronomical point｜同一天体">Same Point｜同一天体</th>
              <th title="Same calculation convention｜同一算法">Same Convention｜同一算法</th>
              <th title="Same zodiac/coordinate frame｜同一坐标系">Same Frame｜同一坐标系</th>
              <th title="Numerically equivalent (same frame AND same number)｜数值等价（同坐标系且数值相符）">Numerically Equivalent｜数值等价</th>
            </tr>
          </thead>
          <tbody>
            {sharedBodyKeys.map((key) => {
              const b = bodyIdentities[key];
              return (
                <tr key={key}>
                  <td>{b.canonicalBody}</td>
                  <td>{b.systems.modernWestern.sign}</td>
                  <td>{b.systems.classical.sign}</td>
                  <td>{b.systems.vedic.sign}</td>
                  <td>{b.sameAstronomicalIdentity ? "✓" : "—"}</td>
                  <td>{b.sameCalculationConvention ? "✓" : "—"}</td>
                  <td>{b.sameCoordinateFrame ? "✓" : "—"}</td>
                  <td>{b.numericallyEquivalent ? "✓" : "—"}</td>
                </tr>
              );
            })}
            {["northNode_rahu", "southNode_ketu"].map((key) => {
              const b = bodyIdentities[key];
              const label = key === "northNode_rahu" ? "North Node / Rahu｜北交点/罗睺" : "South Node / Ketu｜南交点/计都";
              return (
                <tr key={key}>
                  <td>{label}</td>
                  <td>{b.systems.modernWestern.sign} ({b.systems.modernWestern.convention})</td>
                  <td>—</td>
                  <td>{b.systems.vedic.sign} ({b.systems.vedic.convention})</td>
                  <td>{b.sameAstronomicalIdentity ? "✓" : "—"}</td>
                  <td>{b.sameCalculationConvention ? "✓" : "—"}</td>
                  <td>{b.sameCoordinateFrame ? "✓" : "—"}</td>
                  <td>{b.numericallyEquivalent ? "✓" : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="reception-note">
        Same Frame (and therefore Numerically Equivalent) is always "—" for any Western/Classical-vs-Vedic row in this
        app, because Western/Classical output is always tropical and Vedic output is always sidereal — even when Same
        Convention is "✓" (e.g. both selecting the Mean Node)｜本应用中西方/古典与印度的比较，"同一坐标系"（及"数值等价"）恒为
        "—"，因西方/古典恒为回归制、印度恒为恒星制 — 即使"同一算法"为"✓"（如双方皆选平交点）亦然
      </p>

      <RelatedAnchors chart={chart} />

      <h3>Evidence Availability Matrix｜证据可用性矩阵</h3>
      <div className="table-scroll">
        <table className="classical-table">
          <thead>
            <tr>
              <th>Concept｜概念</th>
              <th>Modern Western｜现代西方</th>
              <th>Classical｜古典</th>
              <th>Vedic｜印度</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(evidenceAvailability).map(([category, row]) => (
              <tr key={category}>
                <td>{CATEGORY_LABEL[category] ?? category}</td>
                <StatusCell cell={row.modernWestern} />
                <StatusCell cell={row.classical} />
                <StatusCell cell={row.vedic} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="reception-note">✓ implemented｜已实现 · — not implemented｜未实现 · n/a not applicable｜不适用（非缺陷）</p>

      <h3>Concept Families｜概念族群</h3>
      <p className="reception-note">
        A loose analogy grouping, never an equivalence claim｜仅为松散的类比分组，并非等价声明
      </p>
      <div className="table-scroll">
        <table className="classical-table">
          <thead>
            <tr>
              <th>Family｜族群</th>
              <th>Modern Western｜现代西方</th>
              <th>Classical｜古典</th>
              <th>Vedic｜印度</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(comparisonGroups).map(([family, group]) => (
              <tr key={family}>
                <td>{group.label ?? FAMILY_LABEL_FALLBACK(family)}</td>
                <td>{group.availableIn.modernWestern.length > 0 ? group.availableIn.modernWestern.join(", ") : "—"}</td>
                <td>{group.availableIn.classical.length > 0 ? group.availableIn.classical.join(", ") : "—"}</td>
                <td>{group.availableIn.vedic.length > 0 ? group.availableIn.vedic.join(", ") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>Non-Equivalent Concepts｜非等价概念</h3>
      <p className="reception-note">
        These pairs must NOT be collapsed into one value — mapped does not mean identical｜以下概念对不得合并为同一数值 —
        存在映射关系不代表二者相同
      </p>
      <ul className="non-equivalent-list">
        {nonEquivalentConcepts.map((pair, i) => (
          <li key={i}>
            <strong>{pair.conceptA.label}</strong> ({pair.conceptA.system}) ≠ <strong>{pair.conceptB.label}</strong> ({pair.conceptB.system})
            <br />
            <span className="reception-note">{pair.reason}</span>
          </li>
        ))}
      </ul>

      <div className="table-scroll">
        <table className="detail-table">
          <tbody>
            <tr>
              <td>Version｜版本</td>
              <td>{meta.crossSystemVersion}</td>
            </tr>
            <tr>
              <td>Type｜类型</td>
              <td>{meta.crossSystemType}</td>
            </tr>
            <tr>
              <td>Interpretation｜解读</td>
              <td>{meta.crossSystemInterpretation}</td>
            </tr>
            <tr>
              <td>Comparison Policy｜比较策略</td>
              <td className="meta-cell">{meta.crossSystemComparisonPolicy}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
