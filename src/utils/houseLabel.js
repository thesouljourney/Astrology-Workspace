/**
 * Display-layer helper for bilingual house cusp labels.
 */

const CHINESE_NUMERALS = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];

/**
 * Formats a house number (1-12) as "House N｜第N宫".
 * @param {number} houseNumber 1-12
 * @returns {string}
 */
export function formatHouseLabel(houseNumber) {
  const chinese = CHINESE_NUMERALS[houseNumber - 1] ?? String(houseNumber);
  return `House ${houseNumber}｜第${chinese}宫`;
}
