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

const DIGNITY_STATUS_LABEL = {
  exact_exaltation_point: "Exact Exaltation Point｜擢升精确点",
  moolatrikona: "Moolatrikona",
  exaltation: "Exaltation｜擢升",
  own_sign: "Own Sign｜自己星座",
  exact_debilitation_point: "Exact Debilitation Point｜落陷精确点",
  debilitation: "Debilitation｜落陷",
  friend_sign: "Friend's Sign｜友宫",
  neutral_sign: "Neutral Sign｜中立宫",
  enemy_sign: "Enemy's Sign｜敌宫",
};

/**
 * Every simultaneously-true CATEGORICAL dignity label (never just the
 * single collapsed `rashiDignityStatus`), joined for display - per the
 * Phase 4D dignity-display-precedence audit, a placement such as
 * Mercury at 17 Virgo is genuinely both "Moolatrikona" AND "Exaltation"
 * AND "Own Sign" at once, and hiding any of those behind a single label
 * would misrepresent the technical record. The relational labels
 * (friend/neutral/enemy sign) are intentionally excluded here since the
 * separate Relationship column already shows that fact.
 */
const RELATIONAL_DIGNITY_LABELS = new Set(["friend_sign", "neutral_sign", "enemy_sign"]);

function categoricalDignityLabels(dignity) {
  const categorical = dignity.dignityLabels.filter((label) => !RELATIONAL_DIGNITY_LABELS.has(label));
  if (categorical.length === 0) return "—";
  return categorical.map((label) => DIGNITY_STATUS_LABEL[label] ?? label).join(", ");
}

const UNRESOLVED_TOPIC_LABEL = {
  bhava_chalit: "Bhava Chalit｜宫位始点盘",
  functional_lordship: "Functional Lordship｜功能性宫主判定",
  dasha_system: "Dasha｜大运",
  navamsa_from_pada: "Navamsa (from Pada)｜Navamsa（九分盘）",
  temporary_friendship: "Temporary Friendship｜临时关系",
  compound_friendship: "Compound Friendship｜复合关系",
  shadbala: "Shadbala｜六重力",
  functional_benefic: "Functional Benefic｜功能性吉星",
  functional_malefic: "Functional Malefic｜功能性凶星",
  yogakaraka: "Yogakaraka｜瑜伽卡拉卡",
  maraka: "Maraka｜生死主",
  badhaka: "Badhaka｜阻碍主",
  dispositor_loop_ordered_path: "Dispositor Loop Ordered Path｜守护星循环方向路径",
};

const PHASE_LABEL = {
  phase_4a: "Phase 4A — Sidereal Foundation & Navagraha｜恒星黄道基础与九曜",
  phase_4b: "Phase 4B — Bhava House Structure｜宫位结构",
  phase_4c: "Phase 4C — Nakshatra & Pada｜二十七宿与 Pada",
  phase_4d: "Phase 4D — Dignity & Planetary Condition｜尊贵与行星状态",
  phase_4e: "Phase 4E — Dispositor, Lordship & Functional Structure｜守护星与宫主结构",
};

const RELATIONSHIP_LABEL = {
  self: "Self｜自己",
  friend: "Friend｜友",
  neutral: "Neutral｜中立",
  enemy: "Enemy｜敌",
};

export default function VedicAstrology({ chart }) {
  const { vedic } = chart;
  if (!vedic) return null;

  const { meta, ayanamsha, lagna, grahas, bhava, nakshatra, condition, lordship, summary } = vedic;
  const grahaKeys = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"];
  const classicalGrahaKeys = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];

  return (
    <section className="vedic-astrology">
      <h2>Vedic Astrology｜印度占星</h2>
      <p className="reception-note">
        Technical sidereal positions, house structure, Nakshatra, and dignity/condition evidence only — no yogas,
        dasha, or interpretation｜仅为恒星黄道技术位置、宫位结构、二十七宿与尊贵/状态证据 — 尚未涉及瑜伽、大运或解读
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
          <tr>
            <td>Dignity System｜尊贵系统</td>
            <td className="meta-cell">{meta.vedicDignitySystem}</td>
          </tr>
          <tr>
            <td>Exaltation Convention｜擢升度数依据</td>
            <td className="meta-cell">{meta.exaltationConvention}</td>
          </tr>
          <tr>
            <td>Moolatrikona Convention｜Moolatrikona 依据</td>
            <td className="meta-cell">{meta.moolatrikonaConvention}</td>
          </tr>
          <tr>
            <td>Moolatrikona Boundary｜Moolatrikona 边界规则</td>
            <td className="meta-cell">{meta.moolatrikonaBoundaryConvention}</td>
          </tr>
          <tr>
            <td>Natural Friendship Convention｜自然关系依据</td>
            <td className="meta-cell">{meta.naturalFriendshipConvention}</td>
          </tr>
          <tr>
            <td>Combustion Convention｜燃烧依据</td>
            <td className="meta-cell">{meta.combustionConvention}</td>
          </tr>
          <tr>
            <td>Rahu/Ketu Dignity｜罗睺计都尊贵</td>
            <td className="meta-cell">{meta.rahuKetuDignity}</td>
          </tr>
          <tr>
            <td>Temporary Friendship｜临时关系</td>
            <td>{meta.temporaryFriendship}</td>
          </tr>
          <tr>
            <td>Compound Friendship｜复合关系</td>
            <td>{meta.compoundFriendship}</td>
          </tr>
          <tr>
            <td>Shadbala｜六重力</td>
            <td>{meta.shadbala}</td>
          </tr>
          <tr>
            <td>Condition Interpretation｜状态解读</td>
            <td>{meta.vedicConditionInterpretation}</td>
          </tr>
          <tr>
            <td>Dispositor System｜守护星系统</td>
            <td className="meta-cell">{meta.dispositorSystem}</td>
          </tr>
          <tr>
            <td>Dispositor Final Rule｜最终守护星规则</td>
            <td className="meta-cell">{meta.dispositorFinalRule}</td>
          </tr>
          <tr>
            <td>Dispositor Loop Policy｜守护星循环规则</td>
            <td className="meta-cell">{meta.dispositorLoopPolicy}</td>
          </tr>
          <tr>
            <td>House Group Convention｜宫位分组依据</td>
            <td className="meta-cell">{meta.houseGroupConvention}</td>
          </tr>
          <tr>
            <td>Functional Benefic｜功能性吉星</td>
            <td>{meta.functionalBenefic}</td>
          </tr>
          <tr>
            <td>Functional Malefic｜功能性凶星</td>
            <td>{meta.functionalMalefic}</td>
          </tr>
          <tr>
            <td>Yogakaraka｜瑜伽卡拉卡</td>
            <td>{meta.yogakaraka}</td>
          </tr>
          <tr>
            <td>Maraka｜生死主</td>
            <td>{meta.maraka}</td>
          </tr>
          <tr>
            <td>Badhaka｜阻碍主</td>
            <td>{meta.badhaka}</td>
          </tr>
          <tr>
            <td>Lordship Interpretation｜宫主结构解读</td>
            <td>{meta.vedicLordshipInterpretation}</td>
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

      <h3>Planetary Condition｜行星状态</h3>
      <p className="reception-note">
        Technical dignity/condition evidence only — own sign, exaltation, Moolatrikona, natural sign relationship,
        retrograde, and combustion. No functional benefic/malefic, Yogakaraka, Maraka, or Shadbala yet｜仅为尊贵/状态技术证据
        — 自己星座、擢升、Moolatrikona、自然宫主关系、逆行与燃烧。尚未涉及功能性吉凶、生死主或六重力
      </p>
      <div className="table-scroll">
      <table className="classical-table">
        <thead>
          <tr>
            <th>Graha｜行星</th>
            <th>Rashi｜星座</th>
            <th>Dignity｜尊贵</th>
            <th>Moolatrikona｜Moolatrikona</th>
            <th>Sign Lord｜宫主</th>
            <th>Relationship｜关系</th>
            <th>Retrograde｜逆行</th>
            <th>Combustion｜燃烧</th>
          </tr>
        </thead>
        <tbody>
          {classicalGrahaKeys.map((key) => {
            const p = condition.planets[key];
            return (
              <tr key={key}>
                <td>{grahaLabel(key)}</td>
                <td>{RASHI_LABEL[p.rashi] ?? p.rashi}</td>
                <td>{categoricalDignityLabels(p.dignity)}</td>
                <td>{p.dignity.isMoolatrikona ? "Yes｜是" : "—"}</td>
                <td>{grahaDisplayLabel(p.signRelationship.signLord)}</td>
                <td>{RELATIONSHIP_LABEL[p.signRelationship.naturalRelationshipToSignLord] ?? p.signRelationship.naturalRelationshipToSignLord}</td>
                <td>{p.condition.isRetrograde ? "Retrograde｜逆行" : "Direct｜顺行"}</td>
                <td>
                  {p.condition.combustion.isCombust
                    ? `Combust｜燃烧 (${p.condition.combustion.solarElongationDegrees.toFixed(2)}°)`
                    : "—"}
                </td>
              </tr>
            );
          })}
          {["rahu", "ketu"].map((key) => {
            const n = condition.nodes[key];
            return (
              <tr key={key}>
                <td>{grahaLabel(key)}</td>
                <td>{RASHI_LABEL[n.rashi] ?? n.rashi}</td>
                <td colSpan={4} className="not-implemented">
                  Not assigned — convention varies｜未指定 — 传统流派不一
                </td>
                <td>{n.isRetrograde ? "Retrograde｜逆行" : "Direct｜顺行"}</td>
                <td>—</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      <h3>Dispositor & Lordship Structure｜守护星与宫主结构</h3>
      <p className="reception-note">
        Rashi dispositors, dispositor chains/loops, Lagna Lord network, house-group membership, and the 12-house lord
        matrix — structural evidence only, reusing Phase 4B house ownership and Phase 4D dignity/condition. No
        functional benefic/malefic, Yogakaraka, Maraka, Badhaka, or scoring｜仅为守护星（宫主）结构证据 — 复用第4B阶段宫位归属与第4D阶段尊贵/状态数据。尚未涉及功能性吉凶、瑜伽卡拉卡、生死主、阻碍主或评分
      </p>

      <h4>Lagna Lord Network｜上升主星关系网</h4>
      <div className="table-scroll">
      <table className="detail-table">
        <tbody>
          <tr>
            <td>Lagna Rashi｜上升星座</td>
            <td>{RASHI_LABEL[lordship.lagnaLordNetwork.lagnaRashi] ?? lordship.lagnaLordNetwork.lagnaRashi}</td>
          </tr>
          <tr>
            <td>Lagna Lord｜上升主星</td>
            <td>{grahaDisplayLabel(lordship.lagnaLordNetwork.lagnaLord)}</td>
          </tr>
          <tr>
            <td>Lagna Lord's Rashi｜上升主星所在星座</td>
            <td>{RASHI_LABEL[lordship.lagnaLordNetwork.lagnaLordRashi] ?? lordship.lagnaLordNetwork.lagnaLordRashi}</td>
          </tr>
          <tr>
            <td>Lagna Lord's Bhava｜上升主星所在宫位</td>
            <td>{lordship.lagnaLordNetwork.lagnaLordBhava}</td>
          </tr>
          <tr>
            <td>Lagna Lord's Dispositor｜上升主星之守护星</td>
            <td>{grahaDisplayLabel(lordship.lagnaLordNetwork.lagnaLordDispositor)}</td>
          </tr>
          <tr>
            <td>Dispositor Chain｜守护星链</td>
            <td>{lordship.lagnaLordNetwork.dispositorChain.map((n) => grahaDisplayLabel(n)).join(" → ")}</td>
          </tr>
          <tr>
            <td>Final Dispositor｜最终守护星</td>
            <td>
              {lordship.lagnaLordNetwork.finalDispositor
                ? grahaDisplayLabel(lordship.lagnaLordNetwork.finalDispositor)
                : lordship.lagnaLordNetwork.loop
                ? `Loop｜循环: ${lordship.lagnaLordNetwork.loop.members.map((n) => grahaDisplayLabel(n)).join(" ↔ ")}`
                : "—"}
            </td>
          </tr>
        </tbody>
      </table>
      </div>

      <h4>Rashi Dispositors｜星座守护星</h4>
      <div className="table-scroll">
      <table className="classical-table">
        <thead>
          <tr>
            <th>Graha｜行星</th>
            <th>Rashi｜星座</th>
            <th>Dispositor｜守护星</th>
            <th>Dispositor Chain｜守护星链</th>
            <th>Final Dispositor / Loop｜最终守护星或循环</th>
          </tr>
        </thead>
        <tbody>
          {grahaKeys.map((key) => {
            const d = lordship.dispositors[key];
            const chainInfo = lordship.dispositorChains[key];
            return (
              <tr key={key}>
                <td>{grahaLabel(key)}</td>
                <td>{RASHI_LABEL[d.rashi] ?? d.rashi}</td>
                <td>
                  {grahaDisplayLabel(d.dispositor)}
                  {d.isSelfDispositor ? " (Self｜自己)" : ""}
                </td>
                <td>{chainInfo ? chainInfo.chain.map((n) => grahaDisplayLabel(n)).join(" → ") : "—"}</td>
                <td>
                  {!chainInfo
                    ? "—"
                    : chainInfo.finalDispositor
                    ? grahaDisplayLabel(chainInfo.finalDispositor)
                    : chainInfo.loop
                    ? `Loop｜循环: ${chainInfo.loop.members.map((n) => grahaDisplayLabel(n)).join(" ↔ ")}`
                    : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      {lordship.loops.length > 0 && (
        <>
          <h4>Distinct Dispositor Loops｜独立守护星循环</h4>
          <ul>
            {lordship.loops.map((loop, i) => (
              <li key={i}>{loop.members.map((n) => grahaDisplayLabel(n)).join(" ↔ ")}</li>
            ))}
          </ul>
        </>
      )}

      <h4>House Group Ownership｜宫位分组归属</h4>
      <p className="reception-note">
        Kendra｜四正宫 {"{1,4,7,10}"}, Trikona｜三方宫 {"{1,5,9}"}, Dusthana｜凶宫 {"{6,8,12}"}, Upachaya｜渐强宫{" "}
        {"{3,6,10,11}"} — membership only, no good/bad inference｜仅列归属，不作吉凶推断
      </p>
      <div className="table-scroll">
      <table className="classical-table">
        <thead>
          <tr>
            <th>Graha｜行星</th>
            <th>Owned Houses｜所主宫位</th>
            <th>Kendra｜四正宫</th>
            <th>Trikona｜三方宫</th>
            <th>Dusthana｜凶宫</th>
            <th>Upachaya｜渐强宫</th>
            <th>Kendra + Trikona｜四正+三方</th>
          </tr>
        </thead>
        <tbody>
          {classicalGrahaKeys.map((key) => {
            const r = lordship.planetaryLordshipRoles[key];
            return (
              <tr key={key}>
                <td>{grahaLabel(key)}</td>
                <td>{r.ownedHouses.length > 0 ? r.ownedHouses.join(", ") : "—"}</td>
                <td>{r.ownsKendra ? r.ownedKendraHouses.join(", ") : "—"}</td>
                <td>{r.ownsTrikona ? r.ownedTrikonaHouses.join(", ") : "—"}</td>
                <td>{r.ownsDusthana ? r.ownedDusthanaHouses.join(", ") : "—"}</td>
                <td>{r.ownsUpachaya ? r.ownedUpachayaHouses.join(", ") : "—"}</td>
                <td>{r.ownsKendraAndTrikona ? "Yes｜是" : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      <h4>12-House Lord Matrix｜十二宫宫主矩阵</h4>
      <div className="table-scroll">
      <table className="classical-table">
        <thead>
          <tr>
            <th>Bhava｜宫位</th>
            <th>Rashi｜星座</th>
            <th>Lord｜宫主</th>
            <th>Lord's Bhava｜宫主所在宫位</th>
            <th>Dignity｜尊贵</th>
            <th>Retrograde｜逆行</th>
            <th>Combust｜燃烧</th>
          </tr>
        </thead>
        <tbody>
          {lordship.houseLordMatrix.map((row) => (
            <tr key={row.sourceBhava}>
              <td>{row.sourceBhava}</td>
              <td>{RASHI_LABEL[row.sourceRashi] ?? row.sourceRashi}</td>
              <td>{grahaDisplayLabel(row.lord)}</td>
              <td>{row.lordBhava}</td>
              <td>{DIGNITY_STATUS_LABEL[row.lordDignityStatus] ?? row.lordDignityStatus}</td>
              <td>{row.lordIsRetrograde ? "Retrograde｜逆行" : "Direct｜顺行"}</td>
              <td>{row.lordIsCombust ? "Combust｜燃烧" : "—"}</td>
            </tr>
          ))}
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

      <h3>Technical Summary｜技术摘要</h3>
      <p className="reception-note">
        A normalized, read-only aggregation of Phase 4A–4E evidence — no new calculation, no new astrology rule, no
        interpretation｜第4A–4E阶段证据的规范化只读汇总 — 无新计算、无新占星规则、无解读
      </p>
      <div className="table-scroll">
      <table className="detail-table">
        <tbody>
          <tr>
            <td>Lagna｜上升点</td>
            <td>
              {RASHI_LABEL[summary.chartOverview.lagna.rashi] ?? summary.chartOverview.lagna.rashi} — Lord:{" "}
              {grahaDisplayLabel(summary.chartOverview.lagna.lagnaLord)}, Nakshatra: {summary.chartOverview.lagna.nakshatra} Pada{" "}
              {summary.chartOverview.lagna.pada}
            </td>
          </tr>
          <tr>
            <td>Graha Evidence Coverage｜行星证据覆盖</td>
            <td>{Object.keys(summary.grahas).length} / 9 Navagraha</td>
          </tr>
          <tr>
            <td>Bhava Evidence Coverage｜宫位证据覆盖</td>
            <td>{summary.bhavas.length} / 12 Bhava</td>
          </tr>
          <tr>
            <td>Nakshatra Coverage｜宿之覆盖</td>
            <td>{Object.values(summary.relationships.grahasByNakshatra).flat().length} / 9 Navagraha placed</td>
          </tr>
          <tr>
            <td>Dignity/Condition Coverage｜尊贵与状态覆盖</td>
            <td>{Object.keys(summary.lordship.planets).length} / 7 classical Grahas (Rahu/Ketu: position + retrograde only, no dignity/ownership fabricated)</td>
          </tr>
          <tr>
            <td>Lordship/Dispositor Coverage｜宫主与守护星覆盖</td>
            <td>{Object.keys(summary.lordship.planets).length} / 7 classical Grahas — {summary.lordship.dispositorNetwork.loops.length} dispositor loop(s) found</td>
          </tr>
        </tbody>
      </table>
      </div>

      <h4>Unresolved / Deferred Technical Modules｜未实现或延后的技术模块</h4>
      <p className="reception-note">
        Generated live from current implementation metadata — never a hard-coded list｜由当前实现状态实时生成 — 非固定列表
      </p>
      <div className="table-scroll">
      <table className="classical-table">
        <thead>
          <tr>
            <th>Module｜模块</th>
            <th>Status｜状态</th>
          </tr>
        </thead>
        <tbody>
          {summary.unresolvedConventions.map((u) => (
            <tr key={u.metaKey}>
              <td>{UNRESOLVED_TOPIC_LABEL[u.topic] ?? u.topic}</td>
              <td className="not-implemented">{u.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <h4>Provenance / Source Phases｜数据来源阶段</h4>
      <div className="table-scroll">
      <table className="classical-table">
        <thead>
          <tr>
            <th>Source Phase｜来源阶段</th>
          </tr>
        </thead>
        <tbody>
          {summary.meta.sourcePhases.map((p) => (
            <tr key={p}>
              <td>{PHASE_LABEL[p] ?? p}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <h4>Per-Graha Evidence Cards｜逐行星证据卡片</h4>
      {grahaKeys.map((key) => {
        const ge = summary.grahas[key];
        return (
          <details className="planet-detail" key={key}>
            <summary>
              {grahaLabel(key)} — {RASHI_LABEL[ge.position.rashi] ?? ge.position.rashi}, Bhava {ge.bhava.number}
            </summary>
            <table className="detail-table">
              <tbody>
                <tr>
                  <td>Nakshatra｜宿</td>
                  <td>
                    {ge.nakshatra.name} — Lord: {grahaDisplayLabel(ge.nakshatra.lord)}, Pada {ge.nakshatra.pada}
                  </td>
                </tr>
                <tr>
                  <td>Dignity｜尊贵</td>
                  <td>{ge.dignity.applicable ? categoricalDignityLabels(ge.dignity) : "Not applicable｜不适用"}</td>
                </tr>
                <tr>
                  <td>Ownership｜宫位归属</td>
                  <td>{ge.ownership.applicable ? (ge.ownership.ownedBhavas.length > 0 ? ge.ownership.ownedBhavas.join(", ") : "—") : "Not applicable｜不适用"}</td>
                </tr>
                <tr>
                  <td>Immediate Dispositor｜直接守护星</td>
                  <td>
                    {grahaDisplayLabel(ge.dispositor.immediate)}
                    {ge.dispositor.isSelfDispositor ? " (Self｜自己)" : ""}
                  </td>
                </tr>
                <tr>
                  <td>Flags｜标记</td>
                  <td>{ge.flags.length > 0 ? ge.flags.join(", ") : "—"}</td>
                </tr>
              </tbody>
            </table>
          </details>
        );
      })}
    </section>
  );
}
