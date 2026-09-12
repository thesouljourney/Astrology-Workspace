/**
 * Topic Recipes — Phase 6.
 *
 * Pure, chart-independent DATA. Each recipe declares WHICH already-locked
 * Phase 1-5 evidence a topic should retrieve, in which system, at which
 * priority (`primary`/`secondary`/`contextual`/`future_required`/
 * `excluded`/`convention_pending`) - never the evidence's VALUE (that is
 * resolved per-chart by `resolveItem.js`/`index.js`).
 *
 * CONSOLIDATION NOTE (read before adding a new descriptor): a "lord" or
 * "planet" evidence item's resolved value is the planet's FULL already-
 * assembled Phase 3H/4F technical-condition bundle (dignity, condition,
 * operational condition, sect condition, dispositor, dispositor chain,
 * reception, aspects for Classical; position, bhava, nakshatra, dignity,
 * condition, ownership, dispositor for Vedic) - never re-fetched field by
 * field. So a brief bullet like "L1 essential dignity" / "L1 dispositor
 * chain" / "L1 natal aspects" is already inside that ONE `classicalLord`
 * item's `.value.evidence` (or `vedicBhavaLord`'s `.value.lordGraha`) -
 * it is intentionally NOT restated as a separate secondary/contextual
 * item. Only genuinely distinct facts (a different planet, an occupant
 * list, a lord's house-ownership role, an inter-planet relationship) get
 * their own descriptor.
 *
 * HORARY BOUNDARY (Part 18): every Classical bucket's `excluded` array
 * includes `CLASSICAL_HORARY_EXCLUSIONS` - Direct Perfection, Refranation
 * (as perfection mechanics), Translation/Collection/Prohibition, and raw
 * interference are excluded from all eight natal topics by default.
 * Ordinary natal aspect facts (type/orb/within-orb/applying-separating)
 * remain retrievable via each planet's own `.aspects` field.
 */

const bi = (en, zh) => ({ en, zh });

// ----------------------------------------------------------------------
// Descriptor factories (thin wrappers - see resolveItem.js for the kinds)
// ----------------------------------------------------------------------

const wPoint = (id, label, role, category) => ({ kind: "westernPoint", id, evidenceId: `western_point_${id}`, label, role, category });
const wHouseOccupants = (house, label, role, category) => ({ kind: "westernHouseOccupants", house, evidenceId: `western_house${house}_occupants`, label, role, category });
const wHouseCusp = (house, label, role, category) => ({ kind: "westernHouseCusp", house, evidenceId: `western_house${house}_cusp`, label, role, category });

const cPlanet = (id, label, role, category) => ({ kind: "classicalPlanet", id, evidenceId: `classical_planet_${id}`, label, role, category });
const cLord = (house, label, role, category) => ({ kind: "classicalLord", house, evidenceId: `classical_lord${house}`, label, role, category });
const cHouseOccupants = (house, label, role, category) => ({ kind: "classicalHouseOccupants", house, evidenceId: `classical_house${house}_occupants`, label, role, category });
const cSectLight = (label, role, category) => ({ kind: "classicalSectLight", evidenceId: "classical_sect_light", label, role, category });
const cContextual = (evidenceId, a, b, label, role, category) => ({ kind: "classicalContextual", a, b, evidenceId, label, role, category });

const vGraha = (id, label, role, category) => ({ kind: "vedicGraha", id, evidenceId: `vedic_graha_${id}`, label, role, category });
const vLagna = (label, role, category) => ({ kind: "vedicLagna", evidenceId: "vedic_lagna", label, role, category });
const vLagnaLordNetwork = (label, role, category) => ({ kind: "vedicLagnaLordNetwork", evidenceId: "vedic_lagna_lord_network", label, role, category });
const vBhavaLord = (bhava, label, role, category) => ({ kind: "vedicBhavaLord", bhava, evidenceId: `vedic_bhava${bhava}_lord`, label, role, category });
const vBhavaOccupants = (bhava, label, role, category) => ({ kind: "vedicBhavaOccupants", bhava, evidenceId: `vedic_bhava${bhava}_occupants`, label, role, category });
const vLordshipForRef = (evidenceId, ref, label, role, category) => ({ kind: "vedicLordshipForRef", ref, evidenceId, label, role, category });
const vContextual = (evidenceId, a, b, label, role, category) => ({ kind: "vedicContextual", a, b, evidenceId, label, role, category });

const future = (evidenceId, label, role, reason) => ({ kind: "future", evidenceId, label, role, category: "future_required", reason });
const excluded = (evidenceId, label, role, reason) => ({ kind: "excluded", evidenceId, label, role, category: "excluded", reason });
const conventionPending = (evidenceId, label, role, reason) => ({ kind: "conventionPending", evidenceId, label, role, category: "convention_pending", reason });

const planetRef = (key) => ({ type: "planet", key });
const lordOfHouseRef = (house) => ({ type: "lordOfHouse", house });
const grahaRef = (key) => ({ type: "graha", key });
const bhavaLordRef = (bhava) => ({ type: "bhavaLord", bhava });
const lagnaLordRef = () => ({ type: "lagnaLord" });

/** Part 18 - shared across every one of the eight natal topics' Classical bucket. */
export const CLASSICAL_HORARY_EXCLUSIONS = [
  excluded("classical_direct_perfection", bi("Direct Perfection", "直接完成式"), "technical_condition", "Horary event-perfection mechanics (Phase 3G-A) - not part of a natal topic bundle by default."),
  excluded("classical_refranation", bi("Refranation", "反接（撤回）"), "technical_condition", "A Horary perfection-mechanics concept (Phase 3G-A) - not part of a natal topic bundle by default."),
  excluded("classical_translation", bi("Translation of Light", "光之传递"), "relationship_evidence", "Horary perfection mechanics (Phase 3G-B) - not part of a natal topic bundle by default."),
  excluded("classical_collection", bi("Collection of Light", "光之收集"), "relationship_evidence", "Horary perfection mechanics (Phase 3G-B) - not part of a natal topic bundle by default."),
  excluded("classical_prohibition", bi("Prohibition", "禁止"), "relationship_evidence", "Horary perfection mechanics (Phase 3G-B) - not part of a natal topic bundle by default."),
  excluded("classical_raw_interference", bi("Raw Interference", "原始干扰事件"), "relationship_evidence", "Horary perfection mechanics (Phase 3G-B) - not part of a natal topic bundle by default."),
];

const VEDIC_FUTURE_CORE = () => [
  future("vedic_navamsa", bi("Navamsa (D9)", "九分盘"), "contextual_structure", "No Varga/divisional-chart engine is implemented in this project."),
  future("vedic_shadbala", bi("Shadbala", "六重力"), "technical_condition", "Shadbala is not implemented (chart.vedic.meta.shadbala: not_implemented)."),
  future("vedic_drishti", bi("Vedic Drishti (Graha aspects)", "宿曜相位（Drishti）"), "relationship_evidence", "No Vedic aspect (Drishti) engine is implemented in this project."),
  future("vedic_avastha", bi("Avastha", "行星状态阶段"), "technical_condition", "Avastha is not implemented in this project."),
  future("vedic_yoga", bi("Yoga detection", "瑜伽组合判定"), "contextual_structure", "No Yoga-detection engine is implemented in this project."),
];

// ======================================================================
// TOPIC 01 — SELF / CORE NATURE｜本质与人格核心
// ======================================================================

const selfCoreNature = {
  id: "self_core_nature",
  label: bi("Self / Core Nature", "本质与人格核心"),
  definition: bi(
    "The chart's own first-point structure and its immediate supporting bodies - a technical anchor, never a personality description.",
    "命盘自身的第一宫结构及其直接支持天体 — 仅为技术性锚点，并非人格描述。",
  ),
  version: "phase_6_v1",
  systems: {
    modernWestern: {
      primary: [
        wPoint("asc", bi("Ascendant (ASC)", "上升点"), "native_anchor", "primary"),
        wPoint("sun", bi("Sun", "太阳"), "supporting_luminary", "primary"),
        wPoint("moon", bi("Moon", "月亮"), "supporting_luminary", "primary"),
        wHouseOccupants(1, bi("Planets in House 1", "第一宫内行星"), "domain_occupant", "primary"),
      ],
      secondary: [
        wPoint("mercury", bi("Mercury", "水星"), "supporting_planet", "secondary"),
        wPoint("venus", bi("Venus", "金星"), "supporting_planet", "secondary"),
        wPoint("mars", bi("Mars", "火星"), "supporting_planet", "secondary"),
      ],
      contextual: [],
      futureRequired: [
        future("western_chart_ruler", bi("Structured ASC / Chart Ruler", "结构化命主星"), "domain_ruler", "Phase 2A has no rulership/dignity engine - no chart-ruler concept exists yet."),
        future("western_chart_ruler_placement", bi("Chart Ruler Placement Evidence", "命主星落位证据"), "domain_ruler", "Depends on the chart-ruler concept above, which does not exist."),
        future("western_aspects", bi("Modern Western Major Aspects", "现代西方主要相位"), "relationship_evidence", "Phase 2A has no aspect-calculation layer."),
        future("western_sun_moon_asc_aspects", bi("Sun/Moon/ASC Aspect Network", "日月及上升相位网络"), "relationship_evidence", "Depends on the Modern Western aspect layer above, which does not exist."),
      ],
      excluded: [],
      conventions: {},
    },
    classical: {
      primary: [
        wPoint("asc", bi("Ascendant", "上升点"), "native_anchor", "primary"),
        cLord(1, bi("Lord of 1 (complete technical condition)", "命主星（完整技术状态）"), "domain_ruler", "primary"),
        cPlanet("moon", bi("Moon (technical condition)", "月亮（技术状态）"), "supporting_luminary", "primary"),
      ],
      secondary: [
        cPlanet("sun", bi("Sun (technical condition)", "太阳（技术状态）"), "supporting_luminary", "secondary"),
        cSectLight(bi("Sect Light", "在光（当值光体）"), "supporting_luminary", "secondary"),
        cHouseOccupants(1, bi("Planets in House 1", "第一宫内行星"), "domain_occupant", "secondary"),
      ],
      contextual: [],
      futureRequired: [],
      excluded: [...CLASSICAL_HORARY_EXCLUSIONS],
      conventions: {},
    },
    vedic: {
      primary: [
        vLagna(bi("Lagna (Rashi, Nakshatra, Pada)", "上升点（星座、宿、Pada）"), "native_anchor", "primary"),
        vLagnaLordNetwork(bi("Lagna Lord (dignity, dispositor chain)", "上升主星（尊贵、守护星链）"), "domain_ruler", "primary"),
        vGraha("moon", bi("Moon (Rashi/Bhava/Nakshatra/Pada)", "月亮（星座/宫位/宿/Pada）"), "supporting_luminary", "primary"),
        vGraha("sun", bi("Sun (Rashi/Bhava/Nakshatra/Pada)", "太阳（星座/宫位/宿/Pada）"), "supporting_luminary", "primary"),
      ],
      secondary: [
        vBhavaOccupants(1, bi("Grahas in Bhava 1", "第一宫内行星"), "domain_occupant", "secondary"),
        vLordshipForRef("vedic_lagna_lord_ownership", lagnaLordRef(), bi("Lagna Lord House Ownership", "上升主星宫位归属"), "domain_ruler", "secondary"),
      ],
      contextual: [],
      futureRequired: VEDIC_FUTURE_CORE(),
      excluded: [],
      conventions: {},
    },
  },
};

// ======================================================================
// TOPIC 02 — CAREER｜事业
// ======================================================================

const career = {
  id: "career",
  label: bi("Career", "事业"),
  definition: bi(
    "Technical evidence conventionally associated with the 10th-house/MC/Bhava-10 axis and its lord - structural evidence only, never a career prediction.",
    "传统上与第十宫/天顶/第十宫（Bhava 10）轴线及其宫主相关的技术证据 — 仅为结构性证据，并非事业预测。",
  ),
  version: "phase_6_v1",
  systems: {
    modernWestern: {
      primary: [
        wPoint("mc", bi("Midheaven (MC)", "天顶"), "native_anchor", "primary"),
        wHouseCusp(10, bi("House 10 Cusp/Sign", "第十宫始点/星座"), "domain_anchor", "primary"),
        wHouseOccupants(10, bi("Planets in House 10", "第十宫内行星"), "domain_occupant", "primary"),
      ],
      secondary: [
        wPoint("sun", bi("Sun", "太阳"), "supporting_luminary", "secondary"),
        wPoint("saturn", bi("Saturn", "土星"), "supporting_planet", "secondary"),
        wHouseOccupants(6, bi("Planets in House 6", "第六宫内行星"), "contextual_structure", "secondary"),
        wHouseOccupants(2, bi("Planets in House 2", "第二宫内行星"), "contextual_structure", "secondary"),
        wHouseOccupants(11, bi("Planets in House 11", "第十一宫内行星"), "contextual_structure", "secondary"),
      ],
      contextual: [],
      futureRequired: [
        future("western_h10_ruler", bi("Structured House 10 Ruler", "结构化第十宫主"), "domain_ruler", "Phase 2A has no rulership engine - no house-ruler concept exists yet."),
        future("western_h10_ruler_network", bi("House 10 Ruler Placement Network", "第十宫主落位网络"), "domain_ruler", "Depends on the house-ruler concept above, which does not exist."),
        future("western_aspects_career", bi("Modern Western Aspects", "现代西方相位"), "relationship_evidence", "Phase 2A has no aspect-calculation layer."),
        future("western_mc_aspects", bi("Aspects to MC", "至天顶的相位"), "relationship_evidence", "Depends on the Modern Western aspect layer above, which does not exist."),
      ],
      excluded: [],
      conventions: {},
    },
    classical: {
      primary: [
        cLord(10, bi("Lord of 10 (complete technical condition)", "第十宫主星（完整技术状态）"), "domain_ruler", "primary"),
        cHouseOccupants(10, bi("Planets in House 10", "第十宫内行星"), "domain_occupant", "primary"),
      ],
      secondary: [
        cLord(2, bi("Lord of 2", "第二宫主星"), "contextual_structure", "secondary"),
        cLord(6, bi("Lord of 6", "第六宫主星"), "contextual_structure", "secondary"),
        cLord(11, bi("Lord of 11", "第十一宫主星"), "contextual_structure", "secondary"),
      ],
      contextual: [
        cContextual("classical_l10_l2_relationship", lordOfHouseRef(10), lordOfHouseRef(2), bi("L10 <-> L2 Relationship", "第十宫主与第二宫主关系"), "relationship_evidence", "contextual"),
        cContextual("classical_l10_l6_relationship", lordOfHouseRef(10), lordOfHouseRef(6), bi("L10 <-> L6 Relationship", "第十宫主与第六宫主关系"), "relationship_evidence", "contextual"),
        cContextual("classical_l10_l11_relationship", lordOfHouseRef(10), lordOfHouseRef(11), bi("L10 <-> L11 Relationship", "第十宫主与第十一宫主关系"), "relationship_evidence", "contextual"),
      ],
      futureRequired: [],
      excluded: [...CLASSICAL_HORARY_EXCLUSIONS],
      conventions: {},
    },
    vedic: {
      primary: [
        vBhavaLord(10, bi("Bhava 10 / Lord 10 (complete evidence)", "第十宫/宫主（完整证据）"), "domain_ruler", "primary"),
        vBhavaOccupants(10, bi("Grahas in Bhava 10", "第十宫内行星"), "domain_occupant", "primary"),
      ],
      secondary: [
        vLordshipForRef("vedic_lagna_lord_career", lagnaLordRef(), bi("Lagna Lord (house ownership)", "上升主星（宫位归属）"), "contextual_structure", "secondary"),
        vBhavaLord(2, bi("Bhava 2 / Lord 2", "第二宫/宫主"), "contextual_structure", "secondary"),
        vBhavaLord(6, bi("Bhava 6 / Lord 6", "第六宫/宫主"), "contextual_structure", "secondary"),
        vBhavaLord(11, bi("Bhava 11 / Lord 11", "第十一宫/宫主"), "contextual_structure", "secondary"),
        vGraha("sun", bi("Sun", "太阳"), "supporting_significator", "secondary"),
        vGraha("saturn", bi("Saturn", "土星"), "supporting_significator", "secondary"),
      ],
      contextual: [
        vContextual("vedic_l10_l2_relationship", bhavaLordRef(10), bhavaLordRef(2), bi("L10 <-> L2 Ownership/Dispositor", "第十宫主与第二宫主之归属/守护关系"), "relationship_evidence", "contextual"),
        vContextual("vedic_l10_l6_relationship", bhavaLordRef(10), bhavaLordRef(6), bi("L10 <-> L6 Ownership/Dispositor", "第十宫主与第六宫主之归属/守护关系"), "relationship_evidence", "contextual"),
        vContextual("vedic_l10_l11_relationship", bhavaLordRef(10), bhavaLordRef(11), bi("L10 <-> L11 Ownership/Dispositor", "第十宫主与第十一宫主之归属/守护关系"), "relationship_evidence", "contextual"),
      ],
      futureRequired: [
        future("vedic_d10", bi("D10 (Dasamsa)", "十分盘"), "contextual_structure", "No Varga/divisional-chart engine is implemented in this project."),
        ...VEDIC_FUTURE_CORE(),
        future("vedic_dasha_career", bi("Dasha", "大运"), "contextual_structure", "No Dasha engine is implemented in this project."),
        future("vedic_ashtakavarga", bi("Ashtakavarga", "八分力量"), "technical_condition", "No Ashtakavarga engine is implemented in this project."),
        future("vedic_functional_benefic_malefic_career", bi("Functional Benefic/Malefic", "功能性吉凶星"), "technical_condition", "Not implemented (chart.vedic.meta.functionalBenefic/functionalMalefic: not_implemented)."),
        future("vedic_yogakaraka_career", bi("Yogakaraka", "瑜伽卡拉卡"), "technical_condition", "Not implemented (chart.vedic.meta.yogakaraka: not_implemented)."),
      ],
      excluded: [],
      conventions: {},
    },
  },
};

// ======================================================================
// TOPIC 03 — WEALTH｜财富与资源
// ======================================================================

const wealth = {
  id: "wealth",
  label: bi("Wealth", "财富与资源"),
  definition: bi(
    "Technical evidence conventionally associated with the 2nd/11th house/Bhava axis and their lords - structural evidence only, never a wealth prediction or formula.",
    "传统上与第二/十一宫（Bhava）轴线及其宫主相关的技术证据 — 仅为结构性证据，并非财富预测或公式。",
  ),
  version: "phase_6_v1",
  systems: {
    modernWestern: {
      primary: [
        wHouseCusp(2, bi("House 2 Cusp/Sign", "第二宫始点/星座"), "domain_anchor", "primary"),
        wHouseOccupants(2, bi("Planets in House 2", "第二宫内行星"), "domain_occupant", "primary"),
      ],
      secondary: [
        wPoint("venus", bi("Venus", "金星"), "supporting_planet", "secondary"),
        wHouseOccupants(8, bi("Planets in House 8", "第八宫内行星"), "contextual_structure", "secondary"),
        wHouseOccupants(11, bi("Planets in House 11", "第十一宫内行星"), "contextual_structure", "secondary"),
        wHouseCusp(10, bi("House 10/MC (factual)", "第十宫/天顶（事实性）"), "contextual_structure", "secondary"),
      ],
      contextual: [],
      futureRequired: [
        future("western_h2_ruler", bi("Structured House 2 Ruler", "结构化第二宫主"), "domain_ruler", "Phase 2A has no rulership engine."),
        future("western_h8_ruler", bi("Structured House 8 Ruler", "结构化第八宫主"), "domain_ruler", "Phase 2A has no rulership engine."),
        future("western_h11_ruler", bi("Structured House 11 Ruler", "结构化第十一宫主"), "domain_ruler", "Phase 2A has no rulership engine."),
        future("western_aspects_wealth", bi("Modern Western Aspects", "现代西方相位"), "relationship_evidence", "Phase 2A has no aspect-calculation layer."),
        future("western_ruler_network_wealth", bi("Ruler Relationship Network", "宫主关系网络"), "relationship_evidence", "Depends on the house-ruler concepts above, which do not exist."),
      ],
      excluded: [],
      conventions: {},
    },
    classical: {
      primary: [
        cLord(2, bi("Lord of 2 (complete technical condition)", "第二宫主星（完整技术状态）"), "domain_ruler", "primary"),
        cHouseOccupants(2, bi("Planets in House 2", "第二宫内行星"), "domain_occupant", "primary"),
      ],
      secondary: [
        cLord(8, bi("Lord of 8", "第八宫主星"), "contextual_structure", "secondary"),
        cLord(11, bi("Lord of 11", "第十一宫主星"), "contextual_structure", "secondary"),
        cLord(10, bi("Lord of 10", "第十宫主星"), "contextual_structure", "secondary"),
      ],
      contextual: [
        cContextual("classical_l2_l8_relationship", lordOfHouseRef(2), lordOfHouseRef(8), bi("L2 <-> L8 Relationship", "第二宫主与第八宫主关系"), "relationship_evidence", "contextual"),
        cContextual("classical_l2_l11_relationship", lordOfHouseRef(2), lordOfHouseRef(11), bi("L2 <-> L11 Relationship", "第二宫主与第十一宫主关系"), "relationship_evidence", "contextual"),
        cContextual("classical_l2_l10_relationship", lordOfHouseRef(2), lordOfHouseRef(10), bi("L2 <-> L10 Relationship", "第二宫主与第十宫主关系"), "relationship_evidence", "contextual"),
      ],
      futureRequired: [],
      excluded: [...CLASSICAL_HORARY_EXCLUSIONS],
      conventions: {},
    },
    vedic: {
      primary: [
        vBhavaLord(2, bi("Bhava 2 / Lord 2 (complete evidence)", "第二宫/宫主（完整证据）"), "domain_ruler", "primary"),
        vBhavaLord(11, bi("Bhava 11 / Lord 11 (complete evidence)", "第十一宫/宫主（完整证据）"), "domain_ruler", "primary"),
        vBhavaOccupants(2, bi("Grahas in Bhava 2", "第二宫内行星"), "domain_occupant", "primary"),
        vBhavaOccupants(11, bi("Grahas in Bhava 11", "第十一宫内行星"), "domain_occupant", "primary"),
      ],
      secondary: [
        vBhavaLord(10, bi("Bhava 10 / Lord 10", "第十宫/宫主"), "contextual_structure", "secondary"),
        vBhavaLord(8, bi("Bhava 8 / Lord 8", "第八宫/宫主"), "contextual_structure", "secondary"),
        vLordshipForRef("vedic_lagna_lord_wealth", lagnaLordRef(), bi("Lagna Lord", "上升主星"), "contextual_structure", "secondary"),
        vGraha("jupiter", bi("Jupiter", "木星"), "supporting_significator", "secondary"),
        vGraha("venus", bi("Venus", "金星"), "supporting_significator", "secondary"),
      ],
      contextual: [
        vContextual("vedic_l2_l11_relationship", bhavaLordRef(2), bhavaLordRef(11), bi("L2 <-> L11 Ownership/Dispositor", "第二宫主与第十一宫主之归属/守护关系"), "relationship_evidence", "contextual"),
      ],
      futureRequired: [
        future("vedic_d2", bi("D2 (Hora)", "二分盘"), "contextual_structure", "No Varga/divisional-chart engine is implemented in this project."),
        future("vedic_dhana_yoga", bi("Dhana Yoga Detection", "财富瑜伽判定"), "contextual_structure", "No Yoga-detection engine is implemented in this project."),
        future("vedic_dasha_wealth", bi("Dasha", "大运"), "contextual_structure", "No Dasha engine is implemented in this project."),
        future("vedic_shadbala_wealth", bi("Shadbala", "六重力"), "technical_condition", "Not implemented."),
        future("vedic_drishti_wealth", bi("Vedic Drishti", "宿曜相位"), "relationship_evidence", "Not implemented."),
        future("vedic_ashtakavarga_wealth", bi("Ashtakavarga", "八分力量"), "technical_condition", "Not implemented."),
      ],
      excluded: [],
      conventions: {},
    },
  },
};

// ======================================================================
// TOPIC 04 — RELATIONSHIP｜感情与亲密关系
// ======================================================================

const relationship = {
  id: "relationship",
  label: bi("Relationship", "感情与亲密关系"),
  definition: bi(
    "Natal relationship STRUCTURE only - the 7th-house/Bhava-7 axis and supporting bodies. Never a marriage or partner prediction; no gender-based significator rule is applied.",
    "仅为先天关系结构 — 第七宫（Bhava 7）轴线及其支持天体。并非婚姻或伴侣预测；不套用基于性别的配偶指标规则。",
  ),
  version: "phase_6_v1",
  systems: {
    modernWestern: {
      primary: [
        wPoint("dsc", bi("Descendant (DSC)", "下降点"), "native_anchor", "primary"),
        wHouseOccupants(7, bi("Planets in House 7", "第七宫内行星"), "domain_occupant", "primary"),
        wPoint("venus", bi("Venus", "金星"), "supporting_significator", "primary"),
        wPoint("moon", bi("Moon", "月亮"), "supporting_luminary", "primary"),
      ],
      secondary: [
        wPoint("mars", bi("Mars", "火星"), "supporting_planet", "secondary"),
        wHouseOccupants(5, bi("Planets in House 5", "第五宫内行星"), "contextual_structure", "secondary"),
        wHouseOccupants(8, bi("Planets in House 8", "第八宫内行星"), "contextual_structure", "secondary"),
      ],
      contextual: [],
      futureRequired: [
        future("western_h7_ruler", bi("Structured House 7 Ruler", "结构化第七宫主"), "domain_ruler", "Phase 2A has no rulership engine."),
        future("western_aspects_relationship", bi("Modern Western Aspects", "现代西方相位"), "relationship_evidence", "Phase 2A has no aspect-calculation layer."),
        future("western_juno", bi("Juno", "婚神星"), "supporting_significator", "Phase 2A has not implemented Juno's coordinates (20/26 points implemented)."),
        future("western_eros", bi("Eros", "厄洛斯星"), "supporting_significator", "Phase 2A has not implemented Eros's coordinates (20/26 points implemented)."),
      ],
      excluded: [],
      conventions: {},
    },
    classical: {
      primary: [
        cLord(1, bi("Lord of 1 (complete technical condition)", "命主星（完整技术状态）"), "domain_ruler", "primary"),
        cLord(7, bi("Lord of 7 (complete technical condition)", "第七宫主星（完整技术状态）"), "domain_ruler", "primary"),
      ],
      secondary: [
        cHouseOccupants(7, bi("Planets in House 7", "第七宫内行星"), "domain_occupant", "secondary"),
        cPlanet("moon", bi("Moon", "月亮"), "supporting_luminary", "secondary"),
        cPlanet("venus", bi("Venus", "金星"), "supporting_significator", "secondary"),
      ],
      contextual: [
        cContextual("classical_l1_l7_relationship", lordOfHouseRef(1), lordOfHouseRef(7), bi("L1 <-> L7 Relationship (aspect/reception/dispositor)", "命主星与第七宫主关系（相位/接纳/守护）"), "relationship_evidence", "contextual"),
      ],
      futureRequired: [],
      excluded: [...CLASSICAL_HORARY_EXCLUSIONS],
      conventions: {},
    },
    vedic: {
      primary: [
        vLagna(bi("Lagna", "上升点"), "native_anchor", "primary"),
        vLagnaLordNetwork(bi("Lagna Lord", "上升主星"), "domain_ruler", "primary"),
        vBhavaLord(7, bi("Bhava 7 / Lord 7 (complete evidence)", "第七宫/宫主（完整证据）"), "domain_ruler", "primary"),
        vBhavaOccupants(7, bi("Grahas in Bhava 7", "第七宫内行星"), "domain_occupant", "primary"),
      ],
      secondary: [
        vGraha("venus", bi("Venus", "金星"), "supporting_significator", "secondary"),
        vGraha("moon", bi("Moon", "月亮"), "supporting_luminary", "secondary"),
        vBhavaLord(5, bi("Bhava 5 / Lord 5", "第五宫/宫主"), "contextual_structure", "secondary"),
        vBhavaLord(8, bi("Bhava 8 / Lord 8", "第八宫/宫主"), "contextual_structure", "secondary"),
      ],
      contextual: [
        vContextual("vedic_lagnalord_l7_relationship", lagnaLordRef(), bhavaLordRef(7), bi("Lagna Lord <-> L7 Ownership/Dispositor", "上升主星与第七宫主之归属/守护关系"), "relationship_evidence", "contextual"),
      ],
      futureRequired: [
        future("vedic_d9", bi("D9 (Navamsa)", "九分盘"), "contextual_structure", "No Varga/divisional-chart engine is implemented in this project."),
        future("vedic_darakaraka", bi("Darakaraka", "婚姻卡拉卡"), "technical_condition", "Requires Jaimini Char Karaka assignment, not implemented in this project."),
        future("vedic_upapada_lagna", bi("Upapada Lagna", "Upapada 上升点"), "technical_condition", "Not implemented in this project."),
        future("vedic_drishti_relationship", bi("Vedic Drishti", "宿曜相位"), "relationship_evidence", "Not implemented."),
        future("vedic_marriage_yoga", bi("Marriage Yoga Detection", "婚姻瑜伽判定"), "contextual_structure", "No Yoga-detection engine is implemented in this project."),
        future("vedic_dasha_relationship", bi("Dasha", "大运"), "contextual_structure", "No Dasha engine is implemented in this project."),
        future("vedic_shadbala_relationship", bi("Shadbala", "六重力"), "technical_condition", "Not implemented."),
      ],
      excluded: [],
      conventions: {},
    },
  },
};

// ======================================================================
// TOPIC 05 — FAMILY & ROOTS｜家庭、根基与归属
// ======================================================================

const familyRoots = {
  id: "family_roots",
  label: bi("Family & Roots", "家庭、根基与归属"),
  definition: bi(
    "Technical evidence conventionally associated with the 4th-house/IC/Bhava-4 axis - roots and domestic foundation, distinct from the Parents topic.",
    "传统上与第四宫/天底/第四宫（Bhava 4）轴线相关的技术证据 — 根基与家庭基础，与「父母」主题不同。",
  ),
  version: "phase_6_v1",
  systems: {
    modernWestern: {
      primary: [
        wPoint("ic", bi("Imum Coeli (IC)", "天底"), "native_anchor", "primary"),
        wHouseOccupants(4, bi("Planets in House 4", "第四宫内行星"), "domain_occupant", "primary"),
      ],
      secondary: [
        wPoint("moon", bi("Moon", "月亮"), "supporting_luminary", "secondary"),
        wPoint("saturn", bi("Saturn", "土星"), "supporting_planet", "secondary"),
      ],
      contextual: [],
      futureRequired: [
        future("western_h4_ruler", bi("Structured House 4 Ruler", "结构化第四宫主"), "domain_ruler", "Phase 2A has no rulership engine."),
        future("western_aspects_family", bi("Modern Western Aspects", "现代西方相位"), "relationship_evidence", "Phase 2A has no aspect-calculation layer."),
        future("western_ic_aspects", bi("Aspects to IC", "至天底的相位"), "relationship_evidence", "Depends on the Modern Western aspect layer above, which does not exist."),
      ],
      excluded: [],
      conventions: {},
    },
    classical: {
      primary: [
        cLord(4, bi("Lord of 4 (complete technical condition)", "第四宫主星（完整技术状态）"), "domain_ruler", "primary"),
        cHouseOccupants(4, bi("Planets in House 4", "第四宫内行星"), "domain_occupant", "primary"),
      ],
      secondary: [cPlanet("moon", bi("Moon", "月亮"), "supporting_luminary", "secondary")],
      contextual: [
        cContextual("classical_l4_relationship_context", lordOfHouseRef(4), lordOfHouseRef(1), bi("L4 <-> L1 Relationship", "第四宫主与命主星关系"), "relationship_evidence", "contextual"),
      ],
      futureRequired: [],
      excluded: [
        ...CLASSICAL_HORARY_EXCLUSIONS,
        excluded("classical_auto_mother_father", bi("Automatic Mother/Father Assignment", "自动母/父指派"), "technical_condition", "This topic is Family & Roots, not Parents - no automatic parental assignment is made here. See the separate Parents topic."),
      ],
      conventions: {},
    },
    vedic: {
      primary: [
        vBhavaLord(4, bi("Bhava 4 / Lord 4 (complete evidence)", "第四宫/宫主（完整证据）"), "domain_ruler", "primary"),
        vBhavaOccupants(4, bi("Grahas in Bhava 4", "第四宫内行星"), "domain_occupant", "primary"),
      ],
      secondary: [
        vGraha("moon", bi("Moon", "月亮"), "supporting_luminary", "secondary"),
        vLordshipForRef("vedic_lagna_lord_family", lagnaLordRef(), bi("Lagna Lord", "上升主星"), "contextual_structure", "secondary"),
      ],
      contextual: [
        vContextual("vedic_l4_l2_context", bhavaLordRef(4), bhavaLordRef(2), bi("L4 <-> L2 Ownership/Dispositor (lineage context)", "第四宫主与第二宫主之归属/守护关系（家族脉络）"), "relationship_evidence", "contextual"),
      ],
      futureRequired: [
        future("vedic_drishti_family", bi("Vedic Drishti", "宿曜相位"), "relationship_evidence", "Not implemented."),
        future("vedic_dasha_family", bi("Dasha", "大运"), "contextual_structure", "No Dasha engine is implemented in this project."),
        future("vedic_shadbala_family", bi("Shadbala", "六重力"), "technical_condition", "Not implemented."),
        future("vedic_vargas_family", bi("Relevant Vargas", "相关分盘"), "contextual_structure", "No Varga/divisional-chart engine is implemented in this project."),
        future("vedic_yoga_family", bi("Yoga detection", "瑜伽组合判定"), "contextual_structure", "No Yoga-detection engine is implemented in this project."),
      ],
      excluded: [],
      conventions: {},
    },
  },
};

// ======================================================================
// TOPIC 06 — PARENTS｜父母
// ======================================================================

const parents = {
  id: "parents",
  label: bi("Parents", "父母"),
  definition: bi(
    "System-specific parental-axis conventions - never a universal motherHouse/fatherHouse mapping. Each system's selected convention is recorded explicitly and is replaceable.",
    "各体系specific的父母轴线约定 — 绝非通用的「母亲宫/父亲宫」映射。每个体系所选用的约定均明确记录，且可替换。",
  ),
  version: "phase_6_v1",
  systems: {
    modernWestern: {
      primary: [
        wHouseOccupants(4, bi("[Mother] Planets in House 4", "【母亲】第四宫内行星"), "domain_occupant", "primary"),
        wPoint("moon", bi("[Mother] Moon", "【母亲】月亮"), "supporting_luminary", "primary"),
        wHouseOccupants(10, bi("[Father] Planets in House 10", "【父亲】第十宫内行星"), "domain_occupant", "primary"),
        wPoint("sun", bi("[Father] Sun", "【父亲】太阳"), "supporting_luminary", "primary"),
      ],
      secondary: [wPoint("saturn", bi("[Father] Saturn (supporting)", "【父亲】土星（辅助证据）"), "supporting_planet", "secondary")],
      contextual: [],
      futureRequired: [
        future("western_h4_ruler_parents", bi("House 4 Ruler", "第四宫主"), "domain_ruler", "Phase 2A has no rulership engine."),
        future("western_h10_ruler_parents", bi("House 10 Ruler", "第十宫主"), "domain_ruler", "Phase 2A has no rulership engine."),
        future("western_aspects_parents", bi("Modern Western Aspects", "现代西方相位"), "relationship_evidence", "Phase 2A has no aspect-calculation layer."),
      ],
      excluded: [],
      conventions: { parentalAxis: "modern_h4_mother_h10_father" },
      subdomains: {
        parentalAxis: { houseA: 4, pointA: "ic", houseB: 10, pointB: "mc" },
        mother: { house: 4, planets: ["moon"] },
        father: { house: 10, planets: ["sun", "saturn"] },
      },
    },
    classical: {
      primary: [
        cLord(4, bi("[Father] Lord of 4 (complete technical condition)", "【父亲】第四宫主星（完整技术状态）"), "domain_ruler", "primary"),
        cHouseOccupants(4, bi("[Father] Planets in House 4", "【父亲】第四宫内行星"), "domain_occupant", "primary"),
        cLord(10, bi("[Mother] Lord of 10 (complete technical condition)", "【母亲】第十宫主星（完整技术状态）"), "domain_ruler", "primary"),
        cHouseOccupants(10, bi("[Mother] Planets in House 10", "【母亲】第十宫内行星"), "domain_occupant", "primary"),
      ],
      secondary: [],
      contextual: [],
      futureRequired: [],
      excluded: [...CLASSICAL_HORARY_EXCLUSIONS],
      conventionPending: [
        conventionPending(
          "traditional_maternal_natural_significator",
          bi("Traditional Maternal Natural Significator", "传统母亲自然指标星"),
          "supporting_significator",
          "No explicit, documented traditional maternal natural-significator convention (e.g. the Moon or Venus as natural significator of the mother) was found already selected/locked anywhere in this project's Classical implementation (Phases 3A-3H). Rather than silently introducing one in Phase 6, this remains convention_pending.",
        ),
      ],
      conventions: { houseConvention: "traditional_lilly_h4_father_h10_mother" },
      subdomains: {
        father: { house: 4 },
        mother: { house: 10 },
      },
    },
    vedic: {
      primary: [
        vBhavaLord(4, bi("[Mother] Bhava 4 / Lord 4 (complete evidence)", "【母亲】第四宫/宫主（完整证据）"), "domain_ruler", "primary"),
        vBhavaOccupants(4, bi("[Mother] Grahas in Bhava 4", "【母亲】第四宫内行星"), "domain_occupant", "primary"),
        vGraha("moon", bi("[Mother] Moon", "【母亲】月亮"), "supporting_luminary", "primary"),
        vBhavaLord(9, bi("[Father] Bhava 9 / Lord 9 (complete evidence)", "【父亲】第九宫/宫主（完整证据）"), "domain_ruler", "primary"),
        vBhavaOccupants(9, bi("[Father] Grahas in Bhava 9", "【父亲】第九宫内行星"), "domain_occupant", "primary"),
        vGraha("sun", bi("[Father] Sun", "【父亲】太阳"), "supporting_luminary", "primary"),
      ],
      secondary: [],
      contextual: [],
      futureRequired: [
        future("vedic_drishti_parents", bi("Vedic Drishti", "宿曜相位"), "relationship_evidence", "Not implemented."),
        future("vedic_dasha_parents", bi("Dasha", "大运"), "contextual_structure", "No Dasha engine is implemented in this project."),
        future("vedic_shadbala_parents", bi("Shadbala", "六重力"), "technical_condition", "Not implemented."),
        future("vedic_vargas_parents", bi("Relevant Vargas", "相关分盘"), "contextual_structure", "No Varga/divisional-chart engine is implemented in this project."),
      ],
      excluded: [],
      conventions: { selectedConvention: "selected_jyotish_h4_mother_h9_father" },
      subdomains: {
        mother: { bhava: 4 },
        father: { bhava: 9 },
      },
    },
  },
};

// ======================================================================
// TOPIC 07 — SIBLINGS｜兄弟姐妹
// ======================================================================

const siblings = {
  id: "siblings",
  label: bi("Siblings", "兄弟姐妹"),
  definition: bi(
    "Technical evidence conventionally associated with the 3rd-house/Bhava-3 axis (and, in Jyotish, the 11th Bhava for elder siblings) - structural evidence only.",
    "传统上与第三宫（Bhava 3）轴线相关的技术证据（在印度占星中，第十一宫另涉长兄姐结构）— 仅为结构性证据。",
  ),
  version: "phase_6_v1",
  systems: {
    modernWestern: {
      primary: [wHouseOccupants(3, bi("Planets in House 3", "第三宫内行星"), "domain_occupant", "primary")],
      secondary: [wPoint("mercury", bi("Mercury", "水星"), "supporting_planet", "secondary")],
      contextual: [],
      futureRequired: [
        future("western_h3_ruler", bi("Structured House 3 Ruler", "结构化第三宫主"), "domain_ruler", "Phase 2A has no rulership engine."),
        future("western_aspects_siblings", bi("Modern Western Aspects", "现代西方相位"), "relationship_evidence", "Phase 2A has no aspect-calculation layer."),
      ],
      excluded: [],
      conventions: {},
    },
    classical: {
      primary: [
        cLord(3, bi("Lord of 3 (complete technical condition)", "第三宫主星（完整技术状态）"), "domain_ruler", "primary"),
        cHouseOccupants(3, bi("Planets in House 3", "第三宫内行星"), "domain_occupant", "primary"),
      ],
      secondary: [],
      contextual: [
        cContextual("classical_l3_relationship_context", lordOfHouseRef(3), lordOfHouseRef(1), bi("L3 <-> L1 Relationship", "第三宫主与命主星关系"), "relationship_evidence", "contextual"),
      ],
      futureRequired: [],
      excluded: [
        ...CLASSICAL_HORARY_EXCLUSIONS,
        excluded("classical_turned_houses", bi("Automatic Turned-House Subtopics", "自动轮转宫位子主题"), "contextual_structure", "Deriving a 'sibling's spouse' or similar turned-house subtopic is out of scope for this baseline recipe."),
      ],
      conventions: {},
    },
    vedic: {
      primary: [
        vBhavaLord(3, bi("Bhava 3 / Lord 3 (complete evidence)", "第三宫/宫主（完整证据）"), "sibling_domain_anchor", "primary"),
        vBhavaOccupants(3, bi("Grahas in Bhava 3", "第三宫内行星"), "domain_occupant", "primary"),
        vBhavaLord(11, bi("Bhava 11 / Lord 11 (elder-sibling structure)", "第十一宫/宫主（兄姐结构）"), "elder_sibling_anchor", "primary"),
        vBhavaOccupants(11, bi("Grahas in Bhava 11", "第十一宫内行星"), "domain_occupant", "primary"),
      ],
      secondary: [vGraha("mars", bi("Mars (supporting natural significator)", "火星（辅助自然指标星）"), "supporting_natural_significator", "secondary")],
      contextual: [
        vContextual("vedic_l3_l11_relationship", bhavaLordRef(3), bhavaLordRef(11), bi("L3 <-> L11 Ownership/Dispositor", "第三宫主与第十一宫主之归属/守护关系"), "relationship_evidence", "contextual"),
      ],
      futureRequired: [
        future("vedic_drishti_siblings", bi("Vedic Drishti", "宿曜相位"), "relationship_evidence", "Not implemented."),
        future("vedic_dasha_siblings", bi("Dasha", "大运"), "contextual_structure", "No Dasha engine is implemented in this project."),
        future("vedic_shadbala_siblings", bi("Shadbala", "六重力"), "technical_condition", "Not implemented."),
        future("vedic_vargas_siblings", bi("Relevant Vargas", "相关分盘"), "contextual_structure", "No Varga/divisional-chart engine is implemented in this project."),
      ],
      excluded: [],
      conventions: {},
    },
  },
};

// ======================================================================
// TOPIC 08 — INNER SHADOW｜内在阴影
// ======================================================================

const innerShadow = {
  id: "inner_shadow",
  label: bi("Inner Shadow", "内在阴影"),
  definition: bi(
    "A modern psychological framing. Modern Western evidence is retrieved under that framing; Classical and Vedic sections retrieve only cross-framework RELEVANT technical evidence (12th house/Bhava, its lord, Rahu/Ketu) - never presented as a native or equivalent doctrine in those systems.",
    "此为现代心理学框架下的主题。现代西方部分依此框架取证；古典与印度部分仅提供跨体系「相关技术证据」（第十二宫/Bhava 及其宫主、罗睺/计都）— 绝不作为该体系本有或对等的学说呈现。",
  ),
  version: "phase_6_v1",
  systems: {
    modernWestern: {
      conceptStatus: "modern_psychological_framing",
      primary: [
        wHouseOccupants(12, bi("Planets in House 12", "第十二宫内行星"), "domain_occupant", "primary"),
        wPoint("saturn", bi("Saturn", "土星"), "supporting_planet", "primary"),
        wPoint("pluto", bi("Pluto", "冥王星"), "supporting_planet", "primary"),
      ],
      secondary: [
        wPoint("moon", bi("Moon", "月亮"), "supporting_luminary", "secondary"),
        wHouseOccupants(8, bi("Planets in House 8", "第八宫内行星"), "contextual_structure", "secondary"),
      ],
      contextual: [wPoint("lilith", bi("Black Moon Lilith", "黑月莉莉丝"), "contextual_structure", "contextual")],
      futureRequired: [
        future("western_h12_ruler", bi("Structured House 12 Ruler", "结构化第十二宫主"), "domain_ruler", "Phase 2A has no rulership engine."),
        future("western_aspects_shadow", bi("Modern Western Aspects", "现代西方相位"), "relationship_evidence", "Phase 2A has no aspect-calculation layer - H12-ruler/Saturn/Pluto relationship evidence depends on this."),
      ],
      excluded: [],
      conventions: {},
    },
    classical: {
      conceptStatus: "cross_framework_relevant_evidence_only",
      primary: [
        cLord(12, bi("Lord of 12 (complete technical condition)", "第十二宫主星（完整技术状态）"), "domain_ruler", "primary"),
        cHouseOccupants(12, bi("Planets in House 12", "第十二宫内行星"), "domain_occupant", "primary"),
      ],
      secondary: [cLord(1, bi("Lord of 1 (complete technical condition)", "命主星（完整技术状态）"), "domain_ruler", "secondary")],
      contextual: [
        cContextual("classical_l1_l12_relationship", lordOfHouseRef(1), lordOfHouseRef(12), bi("L1 <-> L12 Relationship (aspect/reception/dispositor)", "命主星与第十二宫主关系（相位/接纳/守护）"), "relationship_evidence", "contextual"),
      ],
      futureRequired: [],
      excluded: [
        ...CLASSICAL_HORARY_EXCLUSIONS,
        excluded("classical_pluto", bi("Pluto", "冥王星"), "technical_condition", "Classical astrology in this project scopes to the seven traditional planets only - Pluto is never given classical dignity/condition."),
        excluded("classical_lilith", bi("Black Moon Lilith", "黑月莉莉丝"), "technical_condition", "Lilith is a modern calculated point with no traditional classical treatment in this project."),
        excluded("classical_psychological_interpretation", bi("Psychological Interpretation", "心理学解读"), "technical_condition", "This topic retrieves relevant technical evidence only - never a psychological interpretation."),
      ],
      conventions: {},
    },
    vedic: {
      conceptStatus: "cross_framework_relevant_evidence_only",
      primary: [
        vBhavaLord(12, bi("Bhava 12 / Lord 12 (complete evidence)", "第十二宫/宫主（完整证据）"), "domain_ruler", "primary"),
        vBhavaOccupants(12, bi("Grahas in Bhava 12", "第十二宫内行星"), "domain_occupant", "primary"),
      ],
      secondary: [
        vLordshipForRef("vedic_lagna_lord_shadow", lagnaLordRef(), bi("Lagna Lord", "上升主星"), "contextual_structure", "secondary"),
        vGraha("moon", bi("Moon", "月亮"), "supporting_luminary", "secondary"),
      ],
      contextual: [
        vGraha("rahu", bi("Rahu (relevant evidence, not a shadow doctrine)", "罗睺（相关证据，非阴影学说）"), "contextual_structure", "contextual"),
        vGraha("ketu", bi("Ketu (relevant evidence, not a past-life-shadow doctrine)", "计都（相关证据，非前世阴影学说）"), "contextual_structure", "contextual"),
        vBhavaLord(8, bi("Bhava 8 / Lord 8", "第八宫/宫主"), "contextual_structure", "contextual"),
        vContextual("vedic_lagnalord_l12_relationship", lagnaLordRef(), bhavaLordRef(12), bi("Lagna Lord <-> L12 Ownership/Dispositor", "上升主星与第十二宫主之归属/守护关系"), "relationship_evidence", "contextual"),
      ],
      futureRequired: [
        future("vedic_drishti_shadow", bi("Vedic Drishti", "宿曜相位"), "relationship_evidence", "Not implemented."),
        future("vedic_dasha_shadow", bi("Dasha", "大运"), "contextual_structure", "No Dasha engine is implemented in this project."),
        future("vedic_shadbala_shadow", bi("Shadbala", "六重力"), "technical_condition", "Not implemented."),
        future("vedic_avastha_shadow", bi("Avastha", "行星状态阶段"), "technical_condition", "Not implemented."),
        future("vedic_vargas_shadow", bi("Relevant Vargas", "相关分盘"), "contextual_structure", "No Varga/divisional-chart engine is implemented in this project."),
        future("vedic_yoga_shadow", bi("Yoga detection", "瑜伽组合判定"), "contextual_structure", "No Yoga-detection engine is implemented in this project."),
      ],
      excluded: [],
      conventions: {},
    },
  },
};

export const TOPIC_RECIPES = [selfCoreNature, career, wealth, relationship, familyRoots, parents, siblings, innerShadow];
