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

const HOUSE_CLASS_LABEL = {
  angular: "Angular｜始宫",
  succedent: "Succedent｜续宫",
  cadent: "Cadent｜果宫",
};

const SPEED_STATUS_LABEL = {
  swift: "Swift｜快速",
  slow: "Slow｜迟缓",
  mean: "Mean｜平均",
};

const SECT_CONDITION_LABEL = {
  hayz: "Hayz｜合宜",
  halb_only: "Halb Only｜仅合半宜",
  of_sect_only: "Of Sect Only｜仅合乎宗派",
  out_of_sect: "Out of Sect｜不合宗派",
};

const SIGN_GENDER_LABEL = {
  masculine: "Masculine｜阳性",
  feminine: "Feminine｜阴性",
};

function speedLabel(speed) {
  if (speed.status === null) return "Withheld｜未定 (no agreed reference)";
  return SPEED_STATUS_LABEL[speed.status];
}

function PlanetDetail({ p }) {
  const name = PLANET_NAMES[p.planet];
  const d = p.dignity;
  const c = p.condition;
  const o = p.operationalCondition;
  const s = p.sectConditionDetail;
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

      <h4>Operational Condition｜行动条件</h4>
      <table className="detail-table">
        <tbody>
          <tr>
            <td>House｜宫位</td>
            <td>
              House {o.housePosition.house} — {HOUSE_CLASS_LABEL[o.housePosition.class]}
            </td>
          </tr>
          <tr>
            <td>Nearest Angle｜最近四轴</td>
            <td>
              {o.angleProximity.nearestAngle.angle} — {formatDegMin(o.angleProximity.nearestAngle.distanceDegrees)}
            </td>
          </tr>
          <tr>
            <td>Distance to Angles｜距四轴角距</td>
            <td>
              ASC {formatDegMin(o.angleProximity.asc)} · IC {formatDegMin(o.angleProximity.ic)} · DSC{" "}
              {formatDegMin(o.angleProximity.dsc)} · MC {formatDegMin(o.angleProximity.mc)}
            </td>
          </tr>
          <tr>
            <td>Motion｜运行</td>
            <td>{o.motion.direction === "retrograde" ? "Retrograde｜逆行" : "Direct｜顺行"}</td>
          </tr>
          <tr>
            <td>Speed｜速度</td>
            <td>
              {speedLabel(o.speed)}
              {o.speed.referenceMeanSpeed != null &&
                ` — ${o.speed.absoluteSpeed.toFixed(4)}°/day vs mean ${o.speed.referenceMeanSpeed.toFixed(4)}°/day`}
            </td>
          </tr>
          <tr>
            <td>Solar｜太阳状态</td>
            <td>{o.solar ? SOLAR_CONDITION_LABEL[o.solar.status] : "—"}</td>
          </tr>
          <tr>
            <td>Sect｜宗派</td>
            <td>{o.sect.isOfSect ? "Of Sect｜合乎宗派" : "Out of Sect｜不合宗派"}</td>
          </tr>
          <tr>
            <td>Horizon｜地平线</td>
            <td>{o.horizon.hemisphere === "above_horizon" ? "Above Horizon｜地平线上" : "Below Horizon｜地平线下"}</td>
          </tr>
        </tbody>
      </table>

      <h4>Sect Condition｜派别条件</h4>
      <table className="detail-table">
        <tbody>
          <tr>
            <td>Chart Sect｜命盘昼夜</td>
            <td>{s.chartSect === "day" ? "Day｜日间盘" : "Night｜夜间盘"}</td>
          </tr>
          <tr>
            <td>Planet's Effective Sect｜行星有效宗派</td>
            <td>{s.effectiveSect === "diurnal" ? "Diurnal｜昼间星" : "Nocturnal｜夜间星"}</td>
          </tr>
          <tr>
            <td>Of Sect｜合乎宗派</td>
            <td>{mark(s.isOfSect)}</td>
          </tr>
          <tr>
            <td>Sign Gender｜星座阴阳</td>
            <td>{SIGN_GENDER_LABEL[s.signGender]}</td>
          </tr>
          <tr>
            <td>Horizon｜地平线</td>
            <td>
              {s.horizon.isAboveHorizon ? "Above Horizon｜地平线上" : "Below Horizon｜地平线下"} (altitude{" "}
              {s.horizon.altitudeDegrees.toFixed(2)}°)
            </td>
          </tr>
          <tr>
            <td>Hayz｜合宜</td>
            <td>
              {mark(s.hayz.isHayz)} — Chart Sect Matches {mark(s.hayz.chartSectMatches)}, Hemisphere Matches{" "}
              {mark(s.hayz.hemisphereMatches)}, Sign Gender Matches {mark(s.hayz.signGenderMatches)}
            </td>
          </tr>
          <tr>
            <td>Halb</td>
            <td>{mark(s.halb.isHalb)}</td>
          </tr>
          <tr>
            <td>Sect Condition｜派别条件</td>
            <td>{SECT_CONDITION_LABEL[s.sectConditionLabel]}</td>
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

      <h3>Operational Condition｜行动条件</h3>
      <table className="classical-table">
        <thead>
          <tr>
            <th>Planet｜行星</th>
            <th>House Class｜宫位类别</th>
            <th>Nearest Angle｜最近四轴</th>
            <th>Motion｜运行</th>
            <th>Speed｜速度</th>
            <th>Solar｜太阳</th>
            <th>Sect｜宗派</th>
          </tr>
        </thead>
        <tbody>
          {classical.planets.map((p) => {
            const name = PLANET_NAMES[p.planet];
            const o = p.operationalCondition;
            return (
              <tr key={p.planet}>
                <td>
                  {name.symbol} {name.en}｜{name.cn}
                </td>
                <td>
                  {o.housePosition.house} — {o.housePosition.class}
                </td>
                <td>
                  {o.angleProximity.nearestAngle.angle} {formatDegMin(o.angleProximity.nearestAngle.distanceDegrees)}
                </td>
                <td>{o.motion.direction === "retrograde" ? "Retrograde｜逆行" : "Direct｜顺行"}</td>
                <td>{o.speed.status === null ? "—" : SPEED_STATUS_LABEL[o.speed.status]}</td>
                <td>{o.solar ? SOLAR_CONDITION_LABEL[o.solar.status] : "—"}</td>
                <td>{mark(o.sect.isOfSect)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h3>Sect Condition｜派别条件 (Hayz / Halb)</h3>
      <table className="classical-table">
        <thead>
          <tr>
            <th>Planet｜行星</th>
            <th>Chart Sect｜命盘昼夜</th>
            <th>Effective Sect｜有效宗派</th>
            <th>Of Sect｜合乎宗派</th>
            <th>Sign Gender｜星座阴阳</th>
            <th>Horizon｜地平线</th>
            <th>Hayz</th>
            <th>Halb</th>
            <th>Sect Condition｜派别条件</th>
          </tr>
        </thead>
        <tbody>
          {classical.planets.map((p) => {
            const name = PLANET_NAMES[p.planet];
            const s = p.sectConditionDetail;
            return (
              <tr key={p.planet}>
                <td>
                  {name.symbol} {name.en}｜{name.cn}
                </td>
                <td>{s.chartSect === "day" ? "Day｜日间盘" : "Night｜夜间盘"}</td>
                <td>{s.effectiveSect === "diurnal" ? "Diurnal｜昼间星" : "Nocturnal｜夜间星"}</td>
                <td>{mark(s.isOfSect)}</td>
                <td>{SIGN_GENDER_LABEL[s.signGender]}</td>
                <td>{s.horizon.isAboveHorizon ? "Above｜地平线上" : "Below｜地平线下"}</td>
                <td>{mark(s.hayz.isHayz)}</td>
                <td>{mark(s.halb.isHalb)}</td>
                <td>{SECT_CONDITION_LABEL[s.sectConditionLabel]}</td>
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
