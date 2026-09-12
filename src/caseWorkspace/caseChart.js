/**
 * Case -> chart bridge — Phase 7.
 *
 * The ONLY astrology entry point Phase 7 ever calls is the existing,
 * locked `calculateChart()` (Phase 1-6). This file performs no
 * calculation itself - it only translates a Case's `birthData`/
 * `calculationProfile` shape into `calculateChart()`'s own input shape.
 */

import { calculateChart } from "../astrology/ephemeris.js";

/** Maps a Case's {birthData, calculationProfile} onto calculateChart()'s input shape and returns the resulting fully-computed chart (chart.topicRetrieval included). */
export function computeCaseChart({ birthData, calculationProfile }) {
  return calculateChart({
    birthDate: birthData.date,
    birthTime: birthData.time,
    latitude: birthData.latitude,
    longitude: birthData.longitude,
    utcOffset: birthData.timezone,
    houseSystem: calculationProfile?.westernHouseSystem,
    nodeType: calculationProfile?.westernNodeType,
    lilithType: calculationProfile?.westernLilithType,
  });
}
