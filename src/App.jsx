import { useState } from "react";
import { calculateChart } from "./astrology/ephemeris.js";
import { formatDMS } from "./utils/formatDegree.js";
import { formatHouseLabel } from "./utils/houseLabel.js";
import { SUPPORTED_HOUSE_SYSTEMS } from "./astrology/houses.js";
import ModernWestern from "./components/ModernWestern.jsx";
import ClassicalAstrology from "./components/ClassicalAstrology.jsx";
import VedicAstrology from "./components/VedicAstrology.jsx";
import CrossSystemEvidence from "./components/CrossSystemEvidence.jsx";
import "./App.css";

const DEFAULT_INPUT = {
  birthDate: "1994-11-21",
  birthTime: "01:44:00",
  latitude: "1.8548",
  longitude: "102.9325",
  utcOffset: "+08:00",
  houseSystem: "placidus",
  nodeType: "true",
  lilithType: "mean",
};

function App() {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [chart, setChart] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (field) => (e) => {
    setInput((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleCalculate = () => {
    setError(null);
    setChart(null);
    try {
      const result = calculateChart(input);
      setChart(result);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="workspace">
      <header>
        <h1>Personal Astrology Workspace｜个人占星工作台</h1>
        <p className="subtitle">Calculation Prototype｜计算原型</p>
      </header>

      <section className="form">
        <div className="field">
          <label htmlFor="birthDate">Birth Date｜出生日期</label>
          <input
            id="birthDate"
            type="text"
            placeholder="YYYY-MM-DD"
            value={input.birthDate}
            onChange={handleChange("birthDate")}
          />
        </div>

        <div className="field">
          <label htmlFor="birthTime">Birth Time｜出生时间</label>
          <input
            id="birthTime"
            type="text"
            placeholder="HH:MM:SS"
            value={input.birthTime}
            onChange={handleChange("birthTime")}
          />
        </div>

        <div className="field">
          <label htmlFor="latitude">Latitude｜纬度</label>
          <input
            id="latitude"
            type="text"
            placeholder="-90 to 90"
            value={input.latitude}
            onChange={handleChange("latitude")}
          />
        </div>

        <div className="field">
          <label htmlFor="longitude">Longitude｜经度</label>
          <input
            id="longitude"
            type="text"
            placeholder="-180 to 180"
            value={input.longitude}
            onChange={handleChange("longitude")}
          />
        </div>

        <div className="field">
          <label htmlFor="utcOffset">UTC Offset｜UTC 时区偏移</label>
          <input
            id="utcOffset"
            type="text"
            placeholder="+08:00"
            value={input.utcOffset}
            onChange={handleChange("utcOffset")}
          />
        </div>

        <div className="field">
          <label htmlFor="houseSystem">House System｜宫位制</label>
          <select id="houseSystem" value={input.houseSystem} onChange={handleChange("houseSystem")}>
            {SUPPORTED_HOUSE_SYSTEMS.map((sys) => (
              <option key={sys} value={sys}>
                {sys[0].toUpperCase() + sys.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="nodeType">Node Type｜交点类型</label>
          <select id="nodeType" value={input.nodeType} onChange={handleChange("nodeType")}>
            <option value="true">True Node｜真交点</option>
            <option value="mean">Mean Node｜平交点</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="lilithType">Lilith Type｜莉莉丝类型</label>
          <select id="lilithType" value={input.lilithType} onChange={handleChange("lilithType")}>
            <option value="mean">Mean｜平位</option>
            <option value="osculating">Osculating｜密切点</option>
          </select>
        </div>

        <button type="button" className="calculate-btn" onClick={handleCalculate}>
          Calculate Chart｜开始计算
        </button>
      </section>

      {error && <div className="error-box">{error}</div>}

      {chart && (
        <section className="results">
          <div className="meta">
            <div>UTC｜世界协调时: {chart.meta.utcIso}</div>
            <div>Julian Day｜儒略日: {chart.meta.julianDay.toFixed(6)}</div>
            <div>House System｜宫位制: {chart.meta.houseSystem}</div>
          </div>

          <h2>Planets｜行星</h2>
          <table>
            <thead>
              <tr>
                <th>Body｜天体</th>
                <th>Sign｜星座</th>
                <th>Degree｜度数</th>
                <th>House｜宫位</th>
                <th>Motion｜状态</th>
              </tr>
            </thead>
            <tbody>
              {chart.planets.map((p) => (
                <tr key={p.key}>
                  <td>
                    {p.english}｜{p.chinese}
                  </td>
                  <td>
                    {p.sign.symbol} {p.sign.english}｜{p.sign.chinese}
                  </td>
                  <td>{formatDMS(p.degreeInSign)}</td>
                  <td>{formatHouseLabel(p.house)}</td>
                  <td className={p.retrograde ? "retrograde" : "direct"}>
                    {p.retrograde ? "Retrograde｜逆行" : "Direct｜顺行"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Angles｜四轴</h2>
          <table>
            <tbody>
              <tr>
                <td>ASC｜上升</td>
                <td>
                  {chart.angles.asc.sign.symbol} {chart.angles.asc.sign.english}｜{chart.angles.asc.sign.chinese}
                </td>
                <td>{formatDMS(chart.angles.asc.degreeInSign)}</td>
              </tr>
              <tr>
                <td>MC｜天顶</td>
                <td>
                  {chart.angles.mc.sign.symbol} {chart.angles.mc.sign.english}｜{chart.angles.mc.sign.chinese}
                </td>
                <td>{formatDMS(chart.angles.mc.degreeInSign)}</td>
              </tr>
              <tr>
                <td>IC｜天底</td>
                <td>
                  {chart.angles.ic.sign.symbol} {chart.angles.ic.sign.english}｜{chart.angles.ic.sign.chinese}
                </td>
                <td>{formatDMS(chart.angles.ic.degreeInSign)}</td>
              </tr>
              <tr>
                <td>DESC｜下降</td>
                <td>
                  {chart.angles.desc.sign.symbol} {chart.angles.desc.sign.english}｜{chart.angles.desc.sign.chinese}
                </td>
                <td>{formatDMS(chart.angles.desc.degreeInSign)}</td>
              </tr>
            </tbody>
          </table>

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

          <ModernWestern chart={chart} />
          <ClassicalAstrology chart={chart} />
          <VedicAstrology chart={chart} />
          <CrossSystemEvidence chart={chart} />
        </section>
      )}
    </div>
  );
}

export default App;
