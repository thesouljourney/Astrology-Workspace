import { formatDMS } from "../utils/formatDegree.js";
import { formatHouseLabel } from "../utils/houseLabel.js";

/**
 * Chart meta (UTC/Julian Day/House System) + House Cusps table.
 *
 * Extracted from the original Quick Calculator inline markup so it can
 * be reused unchanged inside a Case's Chart Data area (Production UX
 * Refactor, Part 7) — `ModernWestern.jsx` already covers Planets/Angles/
 * Nodes/Calculated Points via `chart.points`, but House Cusps has no
 * other home. Presentation only; reads fields `calculateChart()` has
 * always produced.
 */
export default function ChartMetaAndHouses({ chart }) {
  return (
    <>
      <div className="meta">
        <div>UTC｜世界协调时: {chart.meta.utcIso}</div>
        <div>Julian Day｜儒略日: {chart.meta.julianDay.toFixed(6)}</div>
        <div>House System｜宫位制: {chart.meta.houseSystem}</div>
      </div>

      <h2>House Cusps｜宫位</h2>
      <table>
        <thead>
          <tr>
            <th>House｜宫位</th>
            <th>Sign｜星座</th>
            <th>Degree｜度数</th>
          </tr>
        </thead>
        <tbody>
          {chart.houseCusps.map((c) => (
            <tr key={c.house}>
              <td>{formatHouseLabel(c.house)}</td>
              <td>
                {c.sign.symbol} {c.sign.english}｜{c.sign.chinese}
              </td>
              <td>{formatDMS(c.degreeInSign)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
