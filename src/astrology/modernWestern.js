/**
 * Modern Western Astrology — assembles the unified 26-point data model
 * (Planets, Angles, Nodes & Calculated Points, Asteroids & Centaurs) on top
 * of the verified Phase 1 planet/house engines. Nothing here re-derives
 * planet longitudes or house cusps — it only wraps/combines them and adds
 * the Phase 2 points (nodes, Lilith, Part of Fortune, Vertex, East Point).
 */

import { buildPoint } from "./model.js";
import { trueObliquity, computeRAMC, getHouseForLongitude } from "./houses.js";
import { computeNorthNode, computeSouthNode } from "./nodes.js";
import { computeLilith } from "./lilith.js";
import { computePartOfFortune } from "./partOfFortune.js";
import { computeEastPoint, computeVertex } from "./vertex.js";
import { ASTEROID_STATUS } from "./asteroids.js";

/**
 * @param {object} params
 * @param {import("astronomy-engine").AstroTime} params.astroTime
 * @param {number} params.latitude
 * @param {number} params.longitude
 * @param {{asc:number, mc:number, ic:number, desc:number, cusps:number[]}} params.houses
 * @param {Array} params.planetsWithSignAndHouse Phase 1 planet results (already sign/house resolved)
 * @param {"true"|"mean"} [params.nodeType="true"]
 * @param {"mean"|"true"} [params.lilithType="mean"]
 * @returns {Array} unified array of canonical points (planets + angles + nodes/calculated + asteroid status)
 */
export function buildModernWesternPoints({
  astroTime,
  latitude,
  longitude,
  houses,
  planetsWithSignAndHouse,
  nodeType = "true",
  lilithType = "mean",
}) {
  const points = [];

  // --- A. Planets (reuse Phase 1 results, wrapped in the canonical shape) ---
  for (const p of planetsWithSignAndHouse) {
    points.push(
      buildPoint({
        id: p.key,
        category: "planet",
        englishName: p.english,
        chineseName: p.chinese,
        symbol: PLANET_SYMBOLS[p.key] ?? "",
        absoluteLongitude: p.longitude,
        house: p.house,
        speedLongitude: p.speedDegPerDay,
        retrogradeApplicable: true,
        sourceType: "ephemeris",
        meta: {},
      })
    );
  }

  // --- B. Angles (ASC/MC/DSC/IC) — fixed house boundaries, no independent approximation ---
  const angleDefs = [
    { id: "asc", englishName: "Ascendant", chineseName: "上升", symbol: "ASC", longitude: houses.asc, house: 1 },
    { id: "mc", englishName: "Midheaven", chineseName: "天顶", symbol: "MC", longitude: houses.mc, house: 10 },
    { id: "dsc", englishName: "Descendant", chineseName: "下降", symbol: "DSC", longitude: houses.desc, house: 7 },
    { id: "ic", englishName: "Imum Coeli", chineseName: "天底", symbol: "IC", longitude: houses.ic, house: 4 },
  ];
  for (const a of angleDefs) {
    points.push(
      buildPoint({
        id: a.id,
        category: "angle",
        englishName: a.englishName,
        chineseName: a.chineseName,
        symbol: a.symbol,
        absoluteLongitude: a.longitude,
        house: a.house,
        retrogradeApplicable: false,
        sourceType: "angle",
        meta: {},
      })
    );
  }

  // --- C. Nodes & Calculated Points ---
  const obliquity = trueObliquity(astroTime);
  const ramc = computeRAMC(astroTime, longitude);

  const northNode = computeNorthNode(astroTime, nodeType);
  points.push(
    buildPoint({
      id: "northNode",
      category: "node",
      englishName: "North Node",
      chineseName: "北交点",
      symbol: "☊",
      absoluteLongitude: northNode.longitude,
      house: getHouseForLongitude(northNode.longitude, houses.cusps),
      retrogradeApplicable: false,
      sourceType: "calculated",
      meta: { nodeType: northNode.nodeType },
    })
  );

  const southNodeLongitude = computeSouthNode(northNode.longitude);
  points.push(
    buildPoint({
      id: "southNode",
      category: "node",
      englishName: "South Node",
      chineseName: "南交点",
      symbol: "☋",
      absoluteLongitude: southNodeLongitude,
      house: getHouseForLongitude(southNodeLongitude, houses.cusps),
      retrogradeApplicable: false,
      sourceType: "derived",
      meta: { nodeType: northNode.nodeType, derivedFrom: "northNode+180" },
    })
  );

  const lilith = computeLilith(astroTime, lilithType);
  points.push(
    buildPoint({
      id: "lilith",
      category: "node",
      englishName: "Black Moon Lilith",
      chineseName: "黑月莉莉丝",
      symbol: "⚸",
      absoluteLongitude: lilith.longitude,
      house: getHouseForLongitude(lilith.longitude, houses.cusps),
      retrogradeApplicable: false,
      sourceType: "calculated",
      meta: { lilithType: lilith.lilithType },
    })
  );

  const sunPoint = planetsWithSignAndHouse.find((p) => p.key === "sun");
  const moonPoint = planetsWithSignAndHouse.find((p) => p.key === "moon");
  const fortune = computePartOfFortune({
    astroTime,
    latitude,
    longitude,
    ascLongitude: houses.asc,
    sunLongitude: sunPoint.longitude,
    moonLongitude: moonPoint.longitude,
  });
  points.push(
    buildPoint({
      id: "partOfFortune",
      category: "calculated",
      englishName: "Part of Fortune",
      chineseName: "福点",
      symbol: "⊗",
      absoluteLongitude: fortune.longitude,
      house: getHouseForLongitude(fortune.longitude, houses.cusps),
      retrogradeApplicable: false,
      sourceType: "calculated",
      meta: { sect: fortune.sect, formulaUsed: fortune.formulaUsed },
    })
  );

  const vertexLongitude = computeVertex(astroTime, obliquity, latitude, longitude);
  points.push(
    buildPoint({
      id: "vertex",
      category: "calculated",
      englishName: "Vertex",
      chineseName: "宿命点",
      symbol: "Vx",
      absoluteLongitude: vertexLongitude,
      house: getHouseForLongitude(vertexLongitude, houses.cusps),
      retrogradeApplicable: false,
      sourceType: "calculated",
      meta: { method: "prime-vertical azimuth=270 crossing" },
    })
  );

  const eastPointLongitude = computeEastPoint(ramc, obliquity);
  points.push(
    buildPoint({
      id: "eastPoint",
      category: "calculated",
      englishName: "East Point",
      chineseName: "东升点",
      symbol: "EP",
      absoluteLongitude: eastPointLongitude,
      house: getHouseForLongitude(eastPointLongitude, houses.cusps),
      retrogradeApplicable: false,
      sourceType: "calculated",
      meta: { convention: "Equatorial Ascendant (RA = RAMC + 90 deg)" },
    })
  );

  // --- D. Asteroids & Centaurs — not implemented; status only, never fabricated ---
  for (const a of ASTEROID_STATUS) {
    points.push({
      id: a.id,
      category: "asteroid",
      englishName: a.englishName,
      chineseName: a.chineseName,
      symbol: a.symbol,
      absoluteLongitude: null,
      sign: null,
      degreeInSign: null,
      formattedDegree: null,
      house: null,
      motion: null,
      sourceType: null,
      meta: { implemented: false, reason: a.reason },
    });
  }

  return points;
}

const PLANET_SYMBOLS = {
  sun: "☉",
  moon: "☽",
  mercury: "☿",
  venus: "♀",
  mars: "♂",
  jupiter: "♃",
  saturn: "♄",
  uranus: "♅",
  neptune: "♆",
  pluto: "♇",
};
