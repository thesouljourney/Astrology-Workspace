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

const DIGNITY_TYPE_LABEL = {
  domicile: "Domicile｜主宰",
  exaltation: "Exaltation｜擢升",
  triplicity: "Triplicity｜三分性",
  term: "Term｜界",
  face: "Face｜外观",
};

function planetLabel(key) {
  const name = PLANET_NAMES[key];
  return name ? `${name.symbol} ${name.en}` : key;
}

function formatReceptionList(entries) {
  if (entries.length === 0) return "None｜无";
  return entries.map((e) => `${planetLabel(e.planet)} — ${e.types.map((t) => DIGNITY_TYPE_LABEL[t]).join(", ")}`).join("; ");
}

function formatDispositorChain(chain) {
  return chain.map(planetLabel).join(" → ");
}

const ASPECT_TYPE_LABEL = {
  conjunction: "Conjunction｜合相",
  sextile: "Sextile｜六合",
  square: "Square｜四分",
  trine: "Trine｜三合",
  opposition: "Opposition｜对分",
};

const MOTION_STATUS_LABEL = {
  applying: "Applying｜入相",
  separating: "Separating｜出相",
  exact: "Exact｜正相",
};

const PERFECTION_TECHNICAL_STATUS_LABEL = {
  detected: "Detected｜检测到",
  requires_historical_rule: "Requires Historical Rule｜需历史惯例判定",
};

function formatSignedSpeed(speed) {
  return `${speed >= 0 ? "+" : ""}${speed.toFixed(4)}°/day`;
}

const DIRECT_PERFECTION_STATUS_LABEL = {
  perfects: "Perfects｜成相",
  does_not_perfect: "Does Not Perfect｜不成相",
  requires_historical_rule: "Requires Historical Rule｜需历史惯例判定",
  search_horizon_reached: "Search Horizon Reached｜搜索期限已达",
  not_a_candidate: "Not a Candidate｜非候选",
};

function formatUTCTimestamp(iso) {
  if (!iso) return "—";
  return `${iso.replace("T", " ").replace("Z", "")} UTC`;
}

function formatDays(days) {
  if (days === null || days === undefined) return "—";
  return `${days.toFixed(2)} days｜天`;
}

function formatIngressEvents(events) {
  if (events.length === 0) return "";
  return events
    .map((e) => `${planetLabel(e.planet)} ${e.fromSign}→${e.toSign} @ ${formatUTCTimestamp(e.timestamp)}`)
    .join("; ");
}

function formatMotionEvents(events) {
  if (events.length === 0) return "";
  return events
    .map((e) => `${planetLabel(e.planet)} ${e.fromMotion}→${e.toMotion} @ ${formatUTCTimestamp(e.timestamp)}`)
    .join("; ");
}

const TERMINATION_TYPE_LABEL = {
  self_dispositor: "Self-Dispositor｜自主行星",
  loop: "Loop｜循环",
  unknown: "Unknown｜未知",
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
  const disp = p.dispositor;
  const rec = p.reception;
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

      <h4>Dispositor & Reception｜定位星与接纳</h4>
      <p className="reception-note">Reception by dignity — not yet qualified by aspect｜按尊贵接纳 — 尚未经相位判定</p>
      <table className="detail-table">
        <tbody>
          <tr>
            <td>Immediate Dispositor｜直接定位星</td>
            <td>{planetLabel(disp.immediate.ruledBy)}</td>
          </tr>
          <tr>
            <td>Dispositor Chain｜定位星链</td>
            <td>{formatDispositorChain(disp.chain.chain)}</td>
          </tr>
          <tr>
            <td>Chain Termination｜链终止方式</td>
            <td>{TERMINATION_TYPE_LABEL[disp.chain.terminationType]}</td>
          </tr>
          <tr>
            <td>Final Dispositor｜最终定位星</td>
            <td>{disp.chain.finalDispositor ? planetLabel(disp.chain.finalDispositor) : "None｜无"}</td>
          </tr>
          <tr>
            <td>Receives｜接纳</td>
            <td>{formatReceptionList(rec.receives)}</td>
          </tr>
          <tr>
            <td>Received By｜被接纳</td>
            <td>{formatReceptionList(rec.receivedBy)}</td>
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

      <h3>Dispositor & Reception｜定位星与接纳</h3>
      <p className="reception-note">Reception by dignity — not yet qualified by aspect｜按尊贵接纳 — 尚未经相位判定</p>
      <table className="classical-table">
        <thead>
          <tr>
            <th>Planet｜行星</th>
            <th>Immediate Dispositor｜直接定位星</th>
            <th>Dispositor Chain｜定位星链</th>
            <th>Chain Termination｜链终止方式</th>
            <th>Final Dispositor｜最终定位星</th>
            <th>Receives｜接纳</th>
            <th>Received By｜被接纳</th>
          </tr>
        </thead>
        <tbody>
          {classical.planets.map((p) => {
            const name = PLANET_NAMES[p.planet];
            const disp = p.dispositor;
            const rec = p.reception;
            return (
              <tr key={p.planet}>
                <td>
                  {name.symbol} {name.en}｜{name.cn}
                </td>
                <td>{planetLabel(disp.immediate.ruledBy)}</td>
                <td>{formatDispositorChain(disp.chain.chain)}</td>
                <td>{TERMINATION_TYPE_LABEL[disp.chain.terminationType]}</td>
                <td>{disp.chain.finalDispositor ? planetLabel(disp.chain.finalDispositor) : "None｜无"}</td>
                <td>{formatReceptionList(rec.receives)}</td>
                <td>{formatReceptionList(rec.receivedBy)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h3>Mutual Reception｜互容</h3>
      <p className="reception-note">Mutual dignity relationship — not "perfect" or operative reception｜互相尊贵接纳 — 非"完全"或已判定的接纳</p>
      {classical.mutualReceptions.length === 0 ? (
        <p>No mutual reception found.｜未发现互容。</p>
      ) : (
        <table className="classical-table">
          <thead>
            <tr>
              <th>Pair｜配对</th>
              <th>A Receives B｜A 接纳 B</th>
              <th>B Receives A｜B 接纳 A</th>
            </tr>
          </thead>
          <tbody>
            {classical.mutualReceptions.map((m) => (
              <tr key={`${m.planetA}-${m.planetB}`}>
                <td>
                  {planetLabel(m.planetA)} ↔ {planetLabel(m.planetB)}
                </td>
                <td>{m.aReceivesB.types.map((t) => DIGNITY_TYPE_LABEL[t]).join(", ")}</td>
                <td>{m.bReceivesA.types.map((t) => DIGNITY_TYPE_LABEL[t]).join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Classical Aspects｜古典相位</h3>
      <p className="reception-note">
        Technical geometry and motion only — not a perfection judgment｜仅为技术性几何与运行状态 — 非最终判定
      </p>
      {(() => {
        const withinOrbAspects = classical.aspects.filter((a) => a.aspect.isWithinOrb);
        if (withinOrbAspects.length === 0) {
          return <p>No pairs within the classical aspect orb.｜没有配对落在古典相位容许度内。</p>;
        }
        return (
          <>
            <table className="classical-table">
              <thead>
                <tr>
                  <th>Pair｜配对</th>
                  <th>Aspect｜相位</th>
                  <th>Orb from Exact｜距正相度数</th>
                  <th>Allowed Orb｜容许度</th>
                  <th>Motion｜运行状态</th>
                </tr>
              </thead>
              <tbody>
                {withinOrbAspects.map((a) => (
                  <tr key={`${a.planetA}-${a.planetB}`}>
                    <td>
                      {planetLabel(a.planetA)} — {planetLabel(a.planetB)}
                    </td>
                    <td>{ASPECT_TYPE_LABEL[a.aspect.type]}</td>
                    <td>{formatDegMin(a.aspect.orbFromExact)}</td>
                    <td>{formatDegMin(a.aspect.allowedOrb)}</td>
                    <td>{MOTION_STATUS_LABEL[a.motion.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {withinOrbAspects.map((a) => (
              <details className="planet-detail" key={`${a.planetA}-${a.planetB}-detail`}>
                <summary>
                  {planetLabel(a.planetA)} — {planetLabel(a.planetB)}: {ASPECT_TYPE_LABEL[a.aspect.type]}
                </summary>
                <table className="detail-table">
                  <tbody>
                    <tr>
                      <td>Aspect｜相位</td>
                      <td>{ASPECT_TYPE_LABEL[a.aspect.type]}</td>
                    </tr>
                    <tr>
                      <td>Exact Angle｜正相角度</td>
                      <td>{a.aspect.exactAngle}°</td>
                    </tr>
                    <tr>
                      <td>Current Separation｜当前角距</td>
                      <td>{formatDMS(a.aspect.angularSeparation)}</td>
                    </tr>
                    <tr>
                      <td>Orb from Exact｜距正相度数</td>
                      <td>{formatDegMin(a.aspect.orbFromExact)}</td>
                    </tr>
                    <tr>
                      <td>Allowed Orb｜容许度</td>
                      <td>{formatDegMin(a.aspect.allowedOrb)} (moiety sum｜半径之和)</td>
                    </tr>
                    <tr>
                      <td>Whole-Sign Relation｜整宫相位</td>
                      <td>{a.signAspectRelation ? ASPECT_TYPE_LABEL[a.signAspectRelation] : "None (aversion)｜无（失位）"}</td>
                    </tr>
                    <tr>
                      <td>Motion｜运行状态</td>
                      <td>{MOTION_STATUS_LABEL[a.motion.status]}</td>
                    </tr>
                    <tr>
                      <td>
                        {planetLabel(a.planetA)} Speed｜{planetLabel(a.planetA)}速度
                      </td>
                      <td>{formatSignedSpeed(a.motion.planetASpeed)}</td>
                    </tr>
                    <tr>
                      <td>
                        {planetLabel(a.planetB)} Speed｜{planetLabel(a.planetB)}速度
                      </td>
                      <td>{formatSignedSpeed(a.motion.planetBSpeed)}</td>
                    </tr>
                    <tr>
                      <td>Reception (dignity)｜接纳（尊贵）</td>
                      <td>
                        {planetLabel(a.planetA)} receives {planetLabel(a.planetB)}:{" "}
                        {a.reception.aReceivesB.types.length > 0
                          ? a.reception.aReceivesB.types.map((t) => DIGNITY_TYPE_LABEL[t]).join(", ")
                          : "None｜无"}
                        ; {planetLabel(a.planetB)} receives {planetLabel(a.planetA)}:{" "}
                        {a.reception.bReceivesA.types.length > 0
                          ? a.reception.bReceivesA.types.map((t) => DIGNITY_TYPE_LABEL[t]).join(", ")
                          : "None｜无"}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {a.motion.status === "applying" &&
                  (() => {
                    const dp = classical.directPerfection.find(
                      (d) => d.planetA === a.planetA && d.planetB === a.planetB,
                    );
                    if (!dp || !dp.isCandidate) return null;
                    return (
                      <>
                        <h4>Direct Perfection｜直接成相</h4>
                        <table className="detail-table">
                          <tbody>
                            <tr>
                              <td>Current Status｜当前状态</td>
                              <td>{MOTION_STATUS_LABEL[a.motion.status]}</td>
                            </tr>
                            <tr>
                              <td>Exactitude｜是否成正相</td>
                              <td>{dp.exactitudeFound ? "Found｜是" : "Not Found｜否"}</td>
                            </tr>
                            <tr>
                              <td>Exact Time (UTC)｜正相时间</td>
                              <td>{formatUTCTimestamp(dp.exactitudeTimestampUTC)}</td>
                            </tr>
                            <tr>
                              <td>Time to Exact｜距正相时间</td>
                              <td>{formatDays(dp.timeToExactitudeDays)}</td>
                            </tr>
                            <tr>
                              <td>Ingress Before Exact｜正相前是否换座</td>
                              <td>
                                {dp.ingressBeforeExactitude.planetA || dp.ingressBeforeExactitude.planetB ? "Yes｜是" : "No｜否"}
                                {dp.ingressBeforeExactitude.events.length > 0 &&
                                  ` — ${formatIngressEvents(dp.ingressBeforeExactitude.events)}`}
                              </td>
                            </tr>
                            <tr>
                              <td>Motion Change Before Exact｜正相前是否顺逆转变</td>
                              <td>
                                {dp.motionChangeBeforeExactitude.planetA || dp.motionChangeBeforeExactitude.planetB
                                  ? "Yes｜是"
                                  : "No｜否"}
                                {dp.motionChangeBeforeExactitude.events.length > 0 &&
                                  ` — ${formatMotionEvents(dp.motionChangeBeforeExactitude.events)}`}
                              </td>
                            </tr>
                            <tr>
                              <td>Refranation｜反相</td>
                              <td>
                                {dp.refranation.occurs
                                  ? `Yes｜是 — ${planetLabel(dp.refranation.planet)} direct→retrograde @ ${formatUTCTimestamp(dp.refranation.timestampUTC)} (orb ${formatDegMin(dp.refranation.orbBeforeReversal)} → ${formatDegMin(dp.refranation.orbAfterReversal)})`
                                  : "No｜否"}
                              </td>
                            </tr>
                            <tr>
                              <td>Technical Result｜技术性结果</td>
                              <td>{DIRECT_PERFECTION_STATUS_LABEL[dp.status]}</td>
                            </tr>
                          </tbody>
                        </table>
                      </>
                    );
                  })()}
              </details>
            ))}
          </>
        );
      })()}

      <h3>Perfection Mechanics｜成相机制</h3>
      <p className="reception-note">
        Event sequence facts only — not a final Horary outcome and not scored｜仅为事件顺序的技术性事实 — 非最终占星判断，亦不评分
      </p>

      <h4>Translation of Light｜传光</h4>
      {classical.perfectionMechanics.translations.length === 0 ? (
        <p>None detected under the selected convention.｜在当前惯例下未检测到传光。</p>
      ) : (
        <table className="classical-table">
          <thead>
            <tr>
              <th>Translator｜传光者</th>
              <th>Separates From｜出相于</th>
              <th>Applies To｜入相于</th>
              <th>Separation Exact｜出相正相时刻</th>
              <th>Application Exact｜入相正相时刻</th>
              <th>Technical Status｜技术性状态</th>
            </tr>
          </thead>
          <tbody>
            {classical.perfectionMechanics.translations.map((t, i) => (
              <tr key={`translation-${i}`}>
                <td>{planetLabel(t.translator)}</td>
                <td>
                  {planetLabel(t.fromPlanet)} ({ASPECT_TYPE_LABEL[t.separatedAspect]})
                </td>
                <td>
                  {planetLabel(t.toPlanet)} ({ASPECT_TYPE_LABEL[t.applyingAspect]})
                </td>
                <td>{formatUTCTimestamp(t.separationExactitudeTime)}</td>
                <td>{formatUTCTimestamp(t.applicationExactitudeTime)}</td>
                <td>{PERFECTION_TECHNICAL_STATUS_LABEL[t.technicalStatus]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h4>Collection of Light｜聚光</h4>
      {classical.perfectionMechanics.collections.length === 0 ? (
        <p>None detected under the selected convention.｜在当前惯例下未检测到聚光。</p>
      ) : (
        <table className="classical-table">
          <thead>
            <tr>
              <th>Collector｜聚光者</th>
              <th>Planet A｜行星A</th>
              <th>Planet B｜行星B</th>
              <th>A Exact｜A正相时刻</th>
              <th>B Exact｜B正相时刻</th>
              <th>Technical Status｜技术性状态</th>
            </tr>
          </thead>
          <tbody>
            {classical.perfectionMechanics.collections.map((c, i) => (
              <tr key={`collection-${i}`}>
                <td>{planetLabel(c.collector)}</td>
                <td>
                  {planetLabel(c.planetA)} ({ASPECT_TYPE_LABEL[c.aToCollectorAspect]})
                </td>
                <td>
                  {planetLabel(c.planetB)} ({ASPECT_TYPE_LABEL[c.bToCollectorAspect]})
                </td>
                <td>{formatUTCTimestamp(c.aExactitudeTime)}</td>
                <td>{formatUTCTimestamp(c.bExactitudeTime)}</td>
                <td>{PERFECTION_TECHNICAL_STATUS_LABEL[c.technicalStatus]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h4>Prohibition｜阻碍</h4>
      <p className="reception-note">
        William Lilly, Christian Astrology: a third planet interposes before the original pair's own perfection｜威廉·礼利《基督教占星学》：第三行星在原配对自身成相前介入
      </p>
      {classical.perfectionMechanics.prohibitions.length === 0 ? (
        <p>None detected under the selected convention.｜在当前惯例下未检测到阻碍。</p>
      ) : (
        <table className="classical-table">
          <thead>
            <tr>
              <th>Original Pair｜原配对</th>
              <th>Prohibiting Planet｜介入行星</th>
              <th>Intervening Aspect｜介入相位</th>
              <th>Intervening Exact｜介入正相时刻</th>
              <th>Original Expected Exact｜原配对预期正相时刻</th>
            </tr>
          </thead>
          <tbody>
            {classical.perfectionMechanics.prohibitions.map((p, i) => (
              <tr key={`prohibition-${i}`}>
                <td>
                  {planetLabel(p.originalPair[0])} — {planetLabel(p.originalPair[1])} ({ASPECT_TYPE_LABEL[p.originalAspect]})
                </td>
                <td>{planetLabel(p.prohibitingPlanet)}</td>
                <td>{ASPECT_TYPE_LABEL[p.interveningAspect]}</td>
                <td>{formatUTCTimestamp(p.interveningExactitudeTime)}</td>
                <td>{formatUTCTimestamp(p.originalExpectedExactitudeTime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h4>Frustration｜挫败</h4>
      <p className="reception-note">
        Deferred as a distinct doctrine｜作为独立学说被推迟：sourced definitions materially disagree (a significator/non-significator
        role distinction vs. a synonym of Prohibition/Abscission) and this phase does not assign house-significator roles. The
        underlying facts remain visible via Prohibition and the raw Interference Events below. See README.｜相关来源存在实质分歧
        （要求区分"代表者/非代表者"角色，或与阻碍/切断视为同义），且本阶段不指派宫位代表角色。相关事实仍可见于上方"阻碍"与下方"干预事件"。详见
        README。
      </p>

      <h4>Interference Events｜干预事件（原始层）</h4>
      <p className="reception-note">
        Raw third-planet contact facts, independent of any doctrine label (includes every Prohibition above, plus any
        unresolved "abscission"-type contact)｜原始的第三行星接触事实，独立于任何学说标签（包含上方所有"阻碍"，以及任何尚未定名的"切断"类接触）
      </p>
      {classical.perfectionMechanics.interferenceEvents.length === 0 ? (
        <p>None detected under the selected convention.｜在当前惯例下未检测到干预事件。</p>
      ) : (
        <table className="classical-table">
          <thead>
            <tr>
              <th>Original Pair｜原配对</th>
              <th>Contacted Planet｜被接触行星</th>
              <th>Third Planet｜第三行星</th>
              <th>Aspect｜相位</th>
              <th>Exact Time｜正相时刻</th>
            </tr>
          </thead>
          <tbody>
            {classical.perfectionMechanics.interferenceEvents.map((e, i) => (
              <tr key={`interference-${i}`}>
                <td>
                  {planetLabel(e.originalPair[0])} — {planetLabel(e.originalPair[1])}
                </td>
                <td>{planetLabel(e.contactedPlanet)}</td>
                <td>{planetLabel(e.thirdPlanet)}</td>
                <td>{ASPECT_TYPE_LABEL[e.aspectType]}</td>
                <td>{formatUTCTimestamp(e.exactitudeTimestampUTC)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Planet Detail｜行星详情</h3>
      {classical.planets.map((p) => (
        <PlanetDetail key={p.planet} p={p} />
      ))}
    </section>
  );
}
