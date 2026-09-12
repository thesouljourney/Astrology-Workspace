/**
 * Case model — Phase 7. Pure data factories, no storage, no astrology
 * calculation. A Case represents one natal chart/person; its
 * `calculationProfile` is derived (via `deriveCalculationProfile()` in
 * `fingerprint.js`) from an already-computed chart, never invented here.
 */

const uuid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `case_${Date.now()}_${Math.random().toString(16).slice(2)}`);

export const CASE_STATUS = { ACTIVE: "active", ARCHIVED: "archived" };

/**
 * @param {object} params
 * @param {string} params.caseName
 * @param {object} params.birthData {date, time, placeName, latitude, longitude, timezone}
 * @param {object} params.calculationProfile see `deriveCalculationProfile()`
 * @returns {object} a new Case record
 */
export function createCaseRecord({ caseName, birthData, calculationProfile }) {
  const now = new Date().toISOString();
  return {
    caseId: uuid(),
    caseName,
    birthData: { ...birthData },
    calculationProfile: { ...calculationProfile },
    chartFingerprint: null, // set by the repository once the chart is computed for this birthData/profile
    status: CASE_STATUS.ACTIVE,
    createdAt: now,
    updatedAt: now,
  };
}
