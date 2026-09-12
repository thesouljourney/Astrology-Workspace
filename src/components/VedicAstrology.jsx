const GRAHA_NAMES = {
  sun: { en: "Sun", cn: "太阳", symbol: "☉" },
  moon: { en: "Moon", cn: "月亮", symbol: "☽" },
  mars: { en: "Mars", cn: "火星", symbol: "♂" },
  mercury: { en: "Mercury", cn: "水星", symbol: "☿" },
  jupiter: { en: "Jupiter", cn: "木星", symbol: "♃" },
  venus: { en: "Venus", cn: "金星", symbol: "♀" },
  saturn: { en: "Saturn", cn: "土星", symbol: "♄" },
  rahu: { en: "Rahu", cn: "罗睺", symbol: "☊" },
  ketu: { en: "Ketu", cn: "计都", symbol: "☋" },
};

const RASHI_LABEL = {
  Aries: "Aries｜白羊",
  Taurus: "Taurus｜金牛",
  Gemini: "Gemini｜双子",
  Cancer: "Cancer｜巨蟹",
  Leo: "Leo｜狮子",
  Virgo: "Virgo｜处女",
  Libra: "Libra｜天秤",
  Scorpio: "Scorpio｜天蝎",
  Sagittarius: "Sagittarius｜射手",
  Capricorn: "Capricorn｜摩羯",
  Aquarius: "Aquarius｜水瓶",
  Pisces: "Pisces｜双鱼",
};

function grahaLabel(key) {
  const n = GRAHA_NAMES[key];
  return n ? `${n.symbol} ${n.en}｜${n.cn}` : key;
}

const GRAHA_ENGLISH_TO_KEY = Object.fromEntries(Object.entries(GRAHA_NAMES).map(([key, n]) => [n.en, key]));

/** chart.vedic.bhava's house.grahas/lord fields store plain English display names (e.g. "Moon") - relabel them bilingually for display, same as everywhere else in this section. */
function grahaDisplayLabel(englishName) {
  const key = GRAHA_ENGLISH_TO_KEY[englishName];
  return key ? grahaLabel(key) : englishName;
}

export default function VedicAstrology({ chart }) {
  const { vedic } = chart;
  if (!vedic) return null;

  const { meta, ayanamsha, lagna, grahas, bhava, nakshatra } = vedic;
  const grahaKeys = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"];

  return (
    <section className="vedic-astrology">
      <h2>Vedic Astrology｜印度占星</h2>
      <p className="reception-note">
        Sidereal technical positions only — no dignity, house, Nakshatra, or interpretation yet｜仅为恒星黄道技术位置 —
        尚未涉及尊贵、宫位、二十七宿或解读
      </p>

      <h3>Sidereal Foundation｜恒星黄道基础</h3>
      <div className="table-scroll">
      <table className="detail-table">
        <tbody>
          <tr>
            <td>Zodiac Type｜黄道类型</td>
            <td>{meta.zodiacType}</td>
          </tr>
          <tr>
            <td>Ayanamsha｜岁差值</td>
            <td>Lahiri / Chitrapaksha — {ayanamsha.formatted} ({ayanamsha.degrees.toFixed(6)}°)</td>
          </tr>
          <tr>
            <td>Ayanamsha Implementation｜岁差算法</td>
            <td className="meta-cell">{meta.ayanamshaImplementation}</td>
          </tr>
          <tr>
            <td>Node Type (Rahu/Ketu)｜交点类型</td>
            <td>{meta.vedicNodeType === "mean" ? "Mean Node｜平均交点" : "True Node｜真实交点"}</td>
          </tr>
          <tr>
            <td>Graha Set｜行星集合</td>
            <td>{meta.grahaSet}</td>
          </tr>
          <tr>
            <td>Rashi System｜星座系统</td>
            <td>{meta.rashiSystem}</td>
          </tr>
          <tr>
            <td>Bhava (House) System｜宫位系统</td>
            <td className="meta-cell">{meta.bhavaSystem}</td>
          </tr>
          <tr>
            <td>Bhava Cusp Model｜宫位始点模型</td>
            <td className="meta-cell">{meta.bhavaCuspModel}</td>
          </tr>
          <tr>
            <td>House Lordship System｜宫主系统</td>
            <td className="meta-cell">{meta.houseLordshipSystem}</td>
          </tr>
          <tr>
            <td>Bhava Chalit｜宫位始点盘</td>
            <td>{meta.bhavaChalit}</td>
          </tr>
          <tr>
            <td>Functional Lordship｜功能性宫主判定</td>
            <td>{meta.functionalLordship}</td>
          </tr>
          <tr>
            <td>Nakshatra System｜二十七宿系统</td>
            <td className="meta-cell">{meta.nakshatraSystem}</td>
          </tr>
          <tr>
            <td>Nakshatra Boundary Policy｜宿始点边界规则</td>
            <td className="meta-cell">{meta.nakshatraBoundaryPolicy}</td>
          </tr>
          <tr>
            <td>Nakshatra Lord Sequence｜宿主序列</td>
            <td className="meta-cell">{meta.nakshatraLordSequence}</td>
          </tr>
          <tr>
            <td>Dasha System｜大运系统</td>
            <td>{meta.dashaSystem}</td>
          </tr>
          <tr>
            <td>Navamsa From Pada｜Pada 推 Navamsa</td>
            <td>{meta.navamsaFromPada}</td>
          </tr>
          <tr>
            <td>Interpretation｜解读</td>
            <td>{meta.vedicInterpretation}</td>
          </tr>
          <tr>
            <td>House Interpretation｜宫位解读</td>
            <td>{meta.vedicHouseInterpretation}</td>
          </tr>
          <tr>
            <td>Nakshatra Interpretation｜宿之解读</td>
            <td>{meta.nakshatraInterpretation}</td>
          </tr>
        </tbody>
      </table>
      </div>

      <h3>Lagna｜上升点</h3>
      <p className="reception-note">{lagna.label}｜恒星黄道上升点基础 — 非宫位分配引擎</p>
      <div className="table-scroll">
      <table className="detail-table">
        <tbody>
          <tr>
            <td>Rashi｜星座</td>
            <td>{RASHI_LABEL[lagna.rashi] ?? lagna.rashi}</td>
          </tr>
          <tr>
            <td>Degree｜度数</td>
            <td>{lagna.degreeFormatted}</td>
          </tr>
          <tr>
            <td>Sidereal Longitude｜恒星经度</td>
            <td>{lagna.siderealLongitude.toFixed(4)}°</td>
          </tr>
          <tr>
            <td>Tropical Longitude｜回归经度</td>
            <td>{lagna.tropicalLongitude.toFixed(4)}°</td>
          </tr>
        </tbody>
      </table>
      </div>

      <h3>Bhava Structure｜宫位结构</h3>
      <p className="reception-note">
        Whole-Sign Bhavas from Lagna — categorical by Rashi only, no cusp degrees; ownership only, no functional
        benefic/malefic or interpretation yet｜整宫制，以上升星座为基准 — 仅按星座分宫，无始点度数；仅宫主关系，尚未涉及功能性吉凶或解读
      </p>
      <div className="table-scroll">
      <table className="detail-table">
        <tbody>
          <tr>
            <td>Lagna Rashi｜上升星座</td>
            <td>{RASHI_LABEL[bhava.lagna.rashi] ?? bhava.lagna.rashi}</td>
          </tr>
          <tr>
            <td>Lagna Lord｜上升主星</td>
            <td>{grahaDisplayLabel(bhava.lagna.lord)}</td>
          </tr>
        </tbody>
      </table>
      </div>

      <div className="table-scroll">
      <table className="classical-table">
        <thead>
          <tr>
            <th>Bhava｜宫位</th>
            <th>Rashi｜星座</th>
            <th>Lord｜宫主</th>
            <th>Grahas｜行星</th>
            <th>Lord Placed In｜宫主所在宫位</th>
          </tr>
        </thead>
        <tbody>
          {bhava.houses.map((house) => (
            <tr key={house.bhavaNumber}>
              <td>{house.bhavaNumber}</td>
              <td>{RASHI_LABEL[house.rashi] ?? house.rashi}</td>
              <td>{grahaDisplayLabel(house.lord)}</td>
              <td>{house.grahas.length > 0 ? house.grahas.map((g) => grahaDisplayLabel(g)).join(", ") : "—"}</td>
              <td>{house.lordPlacedInBhava}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <h4>Navagraha → Bhava｜九曜所在宫位</h4>
      <div className="table-scroll">
      <table className="classical-table">
        <thead>
          <tr>
            <th>Graha｜行星</th>
            <th>Rashi｜星座</th>
            <th>Bhava｜宫位</th>
          </tr>
        </thead>
        <tbody>
          {grahaKeys.map((key) => {
            const placement = bhava.grahaPlacements[key];
            return (
              <tr key={key}>
                <td>{grahaLabel(key)}</td>
                <td>{RASHI_LABEL[placement.rashi] ?? placement.rashi}</td>
                <td>{placement.bhavaNumber}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      <h3>Nakshatra & Pada｜二十七宿与 Pada</h3>
      <p className="reception-note">
        27-Nakshatra / 4-Pada placement only — no Dasha, no Navamsa, no interpretation yet｜仅为二十七宿与四分之一（Pada）位置 —
        尚未涉及大运、Navamsa 或解读
      </p>
      <div className="table-scroll">
      <table className="detail-table">
        <tbody>
          <tr>
            <td>Moon Nakshatra｜月亮所在宿</td>
            <td>
              {nakshatra.moonNakshatra.name} — Lord: {grahaDisplayLabel(nakshatra.moonNakshatra.lord)}, Pada{" "}
              {nakshatra.moonNakshatra.pada}
            </td>
          </tr>
          <tr>
            <td>Lagna Nakshatra｜上升点所在宿</td>
            <td>
              {nakshatra.lagna.nakshatra} — Lord: {grahaDisplayLabel(nakshatra.lagna.nakshatraLord)}, Pada{" "}
              {nakshatra.lagna.pada}
            </td>
          </tr>
        </tbody>
      </table>
      </div>

      <div className="table-scroll">
      <table className="classical-table">
        <thead>
          <tr>
            <th>Graha｜行星</th>
            <th>Nakshatra｜宿</th>
            <th>Lord｜宿主</th>
            <th>Pada｜位</th>
            <th>Degree Within Nakshatra｜宿内度数</th>
          </tr>
        </thead>
        <tbody>
          {grahaKeys.map((key) => {
            const n = nakshatra.grahas[key];
            return (
              <tr key={key}>
                <td>{grahaLabel(key)}</td>
                <td>
                  {n.nakshatra} ({n.nakshatraNumber})
                </td>
                <td>{grahaDisplayLabel(n.nakshatraLord)}</td>
                <td>{n.pada}</td>
                <td>{n.degreeFormatted}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      <h3>Navagraha｜九曜</h3>
      <div className="table-scroll">
      <table className="classical-table">
        <thead>
          <tr>
            <th>Graha｜行星</th>
            <th>Rashi｜星座</th>
            <th>Degree｜度数</th>
            <th>Sidereal Longitude｜恒星经度</th>
            <th>Tropical Longitude｜回归经度</th>
            <th>Motion｜运行</th>
          </tr>
        </thead>
        <tbody>
          {grahaKeys.map((key) => {
            const g = grahas[key];
            return (
              <tr key={key}>
                <td>{grahaLabel(key)}</td>
                <td>{RASHI_LABEL[g.rashi] ?? g.rashi}</td>
                <td>{g.degreeFormatted}</td>
                <td>{g.siderealLongitude.toFixed(4)}°</td>
                <td>{g.tropicalLongitude.toFixed(4)}°</td>
                <td>{g.motion.retrograde ? "Retrograde｜逆行" : "Direct｜顺行"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      <h3>Graha Detail｜行星详情</h3>
      {grahaKeys.map((key) => {
        const g = grahas[key];
        return (
          <details className="planet-detail" key={key}>
            <summary>
              {grahaLabel(key)} — {RASHI_LABEL[g.rashi] ?? g.rashi} {g.degreeFormatted}
            </summary>
            <table className="detail-table">
              <tbody>
                <tr>
                  <td>Tropical Longitude｜回归经度</td>
                  <td>{g.tropicalLongitude.toFixed(6)}°</td>
                </tr>
                <tr>
                  <td>Ayanamsha (at this instant)｜岁差值</td>
                  <td>{g.ayanamshaDegrees.toFixed(6)}°</td>
                </tr>
                <tr>
                  <td>Sidereal Longitude｜恒星经度</td>
                  <td>{g.siderealLongitude.toFixed(6)}°</td>
                </tr>
                <tr>
                  <td>Rashi｜星座</td>
                  <td>{RASHI_LABEL[g.rashi] ?? g.rashi} (index {g.rashiIndex})</td>
                </tr>
                <tr>
                  <td>Degree Within Rashi｜星座内度数</td>
                  <td>{g.degreeFormatted}</td>
                </tr>
                <tr>
                  <td>Tropical Speed｜回归速度</td>
                  <td>{g.motion.tropicalSpeedDegPerDay.toFixed(6)}°/day</td>
                </tr>
                <tr>
                  <td>Sidereal Speed｜恒星速度</td>
                  <td>{g.motion.siderealSpeedDegPerDay.toFixed(6)}°/day</td>
                </tr>
                <tr>
                  <td>Motion｜运行状态</td>
                  <td>{g.motion.retrograde ? "Retrograde｜逆行" : "Direct｜顺行"}</td>
                </tr>
                {g.nodeType && (
                  <tr>
                    <td>Node Type｜交点类型</td>
                    <td>{g.nodeType}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </details>
        );
      })}
    </section>
  );
}
