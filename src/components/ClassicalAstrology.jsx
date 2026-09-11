import { formatDMS } from "../utils/formatDegree.js";
import { formatHouseLabel } from "../utils/houseLabel.js";
import { ZODIAC_SIGNS } from "../astrology/zodiac.js";

const PLANET_NAMES = {
  sun: { en: "Sun", cn: "太阳", symbol: "☉" },
  moon: { en: "Moon", cn: "月亮", symbol: "☽" },
  mercury: { en: "Mercury", cn: "水星", symbol: "☿" },
  venus: { en: "Venus", cn: "金星", symbol: "♀" },
  mars: { en: "Mars", cn: "火星", symbol: "♂" },
  jupiter: { en: "Jupiter", cn: "木星", symbol: "♃" },
  saturn: { en: "Saturn", cn: "土星", symbol: "♄" },
};

function signLabel(signKey) {
  const s = ZODIAC_SIGNS.find((z) => z.key === signKey);
  return s ? `${s.symbol} ${s.english}` : signKey;
}

function mark(active) {
  return active ? "✓" : "—";
}

const SOLAR_CONDITION_LABEL = {
  cazimi: "Cazimi｜日心",
  combust: "Combust｜焦伤",
  under_beams: "Under the Beams｜光束下",
  free: "Free from Beams｜光束外",
};

function formatDegMin(deg) {
  const totalMin = Math.round(deg * 60);
  const d = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${d}°${String(m).padStart(2, "0")}′`;
}

function PlanetDetail({ p }) {
  const name = PLANET_NAMES[p.planet];
  const d = p.dignity;
  const c = p.condition;
  return (
    <details className="planet-detail">
      <summary>
        {name.symbol} {name.en}｜{name.cn} — {signLabel(p.placement.sign)} {formatDMS(p.placement.degreeInSign)}, House{" "}
        {p.placement.house}
      </summary>

      <h4>Essential Dignity｜本质尊贵</h4>
      <table className="detail-table">
        <tbody>
          <tr>
            <td>Domicile｜主宰</td>
            <td>{d.domicile.active ? `Yes (+${d.domicile.score})` : "No"}</td>
          </tr>
          <tr>
            <td>Exaltation｜擢升</td>
            <td>
              {d.exaltation.active ? `Yes (+${d.exaltation.score})` : "No"} — sign rules at{" "}
              {signLabel(d.exaltation.exaltationSign)} {d.exaltation.exaltationDegree}° (metadata, not an orb requirement)
            </td>
          </tr>
          <tr>
            <td>Triplicity｜三分性</td>
            <td>
              {d.triplicity.active ? `Yes (+${d.triplicity.score})` : "No"} — element {d.triplicity.element}, sect{" "}
              {d.triplicity.sect}: day={d.triplicity.dayRuler}, night={d.triplicity.nightRuler}, participating=
              {d.triplicity.participatingRuler}, active={d.triplicity.activeRuler}
            </td>
          </tr>
          <tr>
            <td>Term (Egyptian)｜界</td>
            <td>
              Ruler: {d.term.ruler} {d.term.active ? `— own term (+${d.term.score})` : ""}
            </td>
          </tr>
          <tr>
            <td>Face (Chaldean)｜外观</td>
            <td>
              Ruler: {d.face.ruler} {d.face.active ? `— own face (+${d.face.score})` : ""}
            </td>
          </tr>
          <tr>
            <td>Detriment｜落陷</td>
            <td>{d.detriment.active ? `Yes (${d.detriment.score})` : "No"}</td>
          </tr>
          <tr>
            <td>Fall｜陷落</td>
            <td>
              {d.fall.active ? `Yes (${d.fall.score})` : "No"} — sign falls at {signLabel(d.fall.fallSign)}{" "}
              {d.fall.fallDegree}°
            </td>
          </tr>
          <tr>
            <td>Peregrine｜漂泊</td>
            <td>{p.peregrine ? "Yes" : "No"}</td>
          </tr>
          <tr>
            <td>Immediate Dispositor｜宫主星</td>
            <td>{PLANET_NAMES[p.immediateDispositor]?.en ?? p.immediateDispositor}</td>
          </tr>
          <tr>
            <td>Essential Score｜本质分数</td>
            <td>{p.totalEssentialScore}</td>
          </tr>
        </tbody>
      </table>

      <h4>Planetary Condition｜行星状态</h4>
      <table className="detail-table">
        <tbody>
          <tr>
            <td>Chart Sect｜命盘昼夜</td>
            <td>{c.chartSect === "day" ? "Day｜日间盘" : "Night｜夜间盘"}</td>
          </tr>
          <tr>
            <td>Sect Family｜行星昼夜属性</td>
            <td>
              {c.sect.family === "diurnal" && "Diurnal｜昼间星"}
              {c.sect.family === "nocturnal" && "Nocturnal｜夜间星"}
              {c.sect.family === "variable" && "Variable (Mercury)｜可变（水星）"}
            </td>
          </tr>
          {c.sect.mercuryPhase && (
            <tr>
              <td>Mercury Phase｜水星相位</td>
              <td>{c.sect.mercuryPhase === "oriental" ? "Oriental / Morning Star｜东出（晨星）" : "Occidental / Evening Star｜西入（昏星）"}</td>
            </tr>
          )}
          <tr>
            <td>Of Sect｜合乎宗派</td>
            <td>{c.sect.isOfSect ? "Yes｜是" : "No｜否"}</td>
          </tr>
          <tr>
            <td>Motion｜运行状态</td>
            <td>
              {c.motion.direction === "retrograde" ? "Retrograde｜逆行" : "Direct｜顺行"} ({c.motion.longitudeSpeed.toFixed(4)}
              °/day)
            </td>
          </tr>
          {c.solar && (
            <tr>
              <td>Solar Condition｜太阳状态</td>
              <td>
                {SOLAR_CONDITION_LABEL[c.solar.condition]} — elongation {formatDegMin(c.solar.elongation)} (thresholds:
                cazimi ≤{formatDegMin(c.solar.cazimiThreshold)}, combust ≤{formatDegMin(c.solar.combustionThreshold)}, beams
                ≤{formatDegMin(c.solar.beamsThreshold)})
              </td>
            </tr>
          )}
          <tr>
            <td>Horizon｜地平线</td>
            <td>
              {c.horizon.isAboveHorizon ? "Above Horizon｜地平线上" : "Below Horizon｜地平线下"} (altitude{" "}
              {c.horizon.altitude.toFixed(2)}°)
            </td>
          </tr>
        </tbody>
      </table>
    </details>
  );
}

export default function ClassicalAstrology({ chart }) {
  const { classical } = chart;

  return (
    <section className="classical-astrology">
      <h2>Classical Astrology｜古典占星</h2>

      <div className="classical-settings">
        <h3>Classical Settings｜古典设定</h3>
        <table>
          <tbody>
            <tr>
              <td>Zodiac｜黄道</td>
              <td>{classical.meta.zodiacType === "tropical" ? "Tropical｜回归黄道" : classical.meta.zodiacType}</td>
            </tr>
            <tr>
              <td>Rulership｜守护关系</td>
              <td>Traditional｜传统</td>
            </tr>
            <tr>
              <td>Triplicity｜三分性</td>
              <td>Dorothean｜多罗修</td>
            </tr>
            <tr>
              <td>Terms｜界</td>
              <td>Egyptian｜埃及</td>
            </tr>
            <tr>
              <td>Faces｜外观</td>
              <td>Chaldean｜迦勒底</td>
            </tr>
            <tr>
              <td>Sect｜昼夜区分</td>
              <td>{classical.sect === "day" ? "Day｜日间盘" : "Night｜夜间盘"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Essential Dignity｜本质尊贵</h3>
      <table className="classical-table">
        <thead>
          <tr>
            <th>Planet｜行星</th>
            <th>Sign｜星座</th>
            <th>Degree｜度数</th>
            <th>House｜宫位</th>
            <th>Domicile</th>
            <th>Exalt.</th>
            <th>Triplicity</th>
            <th>Term</th>
            <th>Face</th>
            <th>Detriment</th>
            <th>Fall</th>
            <th>Peregrine</th>
            <th>Score</th>
            <th>Dispositor</th>
          </tr>
        </thead>
        <tbody>
          {classical.planets.map((p) => {
            const name = PLANET_NAMES[p.planet];
            const d = p.dignity;
            return (
              <tr key={p.planet}>
                <td>
                  {name.symbol} {name.en}｜{name.cn}
                </td>
                <td>{signLabel(p.placement.sign)}</td>
                <td>{formatDMS(p.placement.degreeInSign)}</td>
                <td>{formatHouseLabel(p.placement.house)}</td>
                <td>{mark(d.domicile.active)}</td>
                <td>{mark(d.exaltation.active)}</td>
                <td>{mark(d.triplicity.active)}</td>
                <td>
                  {d.term.ruler} {mark(d.term.active)}
                </td>
                <td>
                  {d.face.ruler} {mark(d.face.active)}
                </td>
                <td>{mark(d.detriment.active)}</td>
                <td>{mark(d.fall.active)}</td>
                <td>{mark(p.peregrine)}</td>
                <td>{p.totalEssentialScore}</td>
                <td>{PLANET_NAMES[p.immediateDispositor]?.en ?? p.immediateDispositor}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h3>Planetary Condition｜行星状态</h3>
      <table className="classical-table">
        <thead>
          <tr>
            <th>Planet｜行星</th>
            <th>Sect Family｜昼夜属性</th>
            <th>Mercury Phase｜水星相位</th>
            <th>Of Sect｜合乎宗派</th>
            <th>Motion｜运行</th>
            <th>Solar Condition｜太阳状态</th>
            <th>Elongation｜距角</th>
            <th>Altitude｜地平高度</th>
            <th>Horizon｜地平线</th>
          </tr>
        </thead>
        <tbody>
          {classical.planets.map((p) => {
            const name = PLANET_NAMES[p.planet];
            const c = p.condition;
            return (
              <tr key={p.planet}>
                <td>
                  {name.symbol} {name.en}｜{name.cn}
                </td>
                <td>{c.sect.family}</td>
                <td>{c.sect.mercuryPhase ?? "—"}</td>
                <td>{mark(c.sect.isOfSect)}</td>
                <td>{c.motion.direction === "retrograde" ? "Retrograde｜逆行" : "Direct｜顺行"}</td>
                <td>{c.solar ? SOLAR_CONDITION_LABEL[c.solar.condition] : "—"}</td>
                <td>{c.solar ? formatDegMin(c.solar.elongation) : "—"}</td>
                <td>{c.horizon.altitude.toFixed(2)}°</td>
                <td>{c.horizon.isAboveHorizon ? "Above｜地平线上" : "Below｜地平线下"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h3>Planet Detail｜行星详情</h3>
      {classical.planets.map((p) => (
        <PlanetDetail key={p.planet} p={p} />
      ))}
    </section>
  );
}
