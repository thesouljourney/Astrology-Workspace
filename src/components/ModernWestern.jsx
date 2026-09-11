import { formatDMS } from "../utils/formatDegree.js";
import { formatHouseLabel } from "../utils/houseLabel.js";

const GROUPS = [
  { categories: ["planet"], titleEn: "Planets", titleCn: "行星" },
  { categories: ["angle"], titleEn: "Angles", titleCn: "四轴" },
  { categories: ["node", "calculated"], titleEn: "Nodes & Calculated Points", titleCn: "交点与计算点" },
  { categories: ["asteroid"], titleEn: "Asteroids & Centaurs", titleCn: "小行星与半人马星" },
];

function motionOrTypeLabel(p) {
  if (p.category === "asteroid") return "Not Implemented｜未实现";
  if (p.motion) return p.motion.retrograde ? "Retrograde｜逆行" : "Direct｜顺行";

  if (p.id === "northNode" || p.id === "southNode") {
    return p.meta.nodeType === "true" ? "True Node｜真交点" : "Mean Node｜平交点";
  }
  if (p.id === "lilith") {
    return p.meta.lilithType === "osculating" ? "Osculating｜密切点" : "Mean｜平位";
  }
  if (p.id === "partOfFortune") {
    return p.meta.sect === "day" ? "Day Formula｜日盘公式" : "Night Formula｜夜盘公式";
  }
  return "—";
}

function ModernWesternRow({ point }) {
  if (point.absoluteLongitude === null) {
    return (
      <tr>
        <td>
          {point.symbol} {point.englishName}｜{point.chineseName}
        </td>
        <td colSpan={3} className="not-implemented">
          Not Implemented｜未实现 — {point.meta.reason}
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>
        {point.symbol} {point.englishName}｜{point.chineseName}
      </td>
      <td>
        {point.sign.symbol} {point.sign.english}｜{point.sign.chinese}
      </td>
      <td>{point.formattedDegree}</td>
      <td>{formatHouseLabel(point.house)}</td>
      <td className={point.motion?.retrograde ? "retrograde" : ""}>{motionOrTypeLabel(point)}</td>
    </tr>
  );
}

export default function ModernWestern({ chart }) {
  const implementedCount = chart.points.filter((p) => p.absoluteLongitude !== null).length;
  const totalCount = chart.points.length;

  return (
    <section className="modern-western">
      <h2>Modern Western｜现代西方占星</h2>
      <p className="implementation-summary">
        Implemented｜已实现: {implementedCount}/{totalCount} — Planets 10/10, Angles 4/4, Nodes & Calculated Points
        6/6, Asteroids & Centaurs 0/6
      </p>
      <p className="chart-conventions">
        zodiacType: {chart.meta.zodiacType} · houseSystem: {chart.meta.houseSystem} · nodeType: {chart.meta.nodeType} ·
        lilithType: {chart.meta.lilithType}
      </p>

      {GROUPS.map((group) => {
        const points = chart.points.filter((p) => group.categories.includes(p.category));
        const implemented = points.filter((p) => p.absoluteLongitude !== null).length;
        return (
          <div key={group.titleEn}>
            <h3>
              {group.titleEn}｜{group.titleCn} ({implemented}/{points.length})
            </h3>
            <table>
              <thead>
                <tr>
                  <th>Point｜天体点</th>
                  <th>Sign｜星座</th>
                  <th>Degree｜度数</th>
                  <th>House｜宫位</th>
                  <th>Motion / Type｜状态</th>
                </tr>
              </thead>
              <tbody>
                {points.map((p) => (
                  <ModernWesternRow key={p.id} point={p} />
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      <details className="raw-data">
        <summary>Raw Calculation Data｜原始计算数据</summary>
        <table>
          <thead>
            <tr>
              <th>id</th>
              <th>category</th>
              <th>absoluteLongitude</th>
              <th>degreeInSign</th>
              <th>house</th>
              <th>speedLongitude</th>
              <th>retrograde</th>
              <th>sourceType</th>
              <th>calculationMethod</th>
              <th>calculationConvention</th>
              <th>verificationDifferenceArcsec</th>
              <th>meta (full)</th>
            </tr>
          </thead>
          <tbody>
            {chart.points.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.category}</td>
                <td>{p.absoluteLongitude === null ? "null" : p.absoluteLongitude.toFixed(8)}</td>
                <td>{p.degreeInSign === null ? "null" : p.degreeInSign.toFixed(8)}</td>
                <td>{p.house ?? "null"}</td>
                <td>{p.motion?.speedLongitude != null ? p.motion.speedLongitude.toFixed(6) : "null"}</td>
                <td>{p.motion ? String(p.motion.retrograde) : "null"}</td>
                <td>{p.sourceType ?? "null"}</td>
                <td>{p.meta?.calculationMethod ?? "—"}</td>
                <td>{p.meta?.calculationConvention ?? "—"}</td>
                <td>{p.meta?.verificationDifferenceArcsec != null ? p.meta.verificationDifferenceArcsec : "—"}</td>
                <td className="meta-cell">{JSON.stringify(p.meta)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
