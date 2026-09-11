/**
 * Display-layer formatting only. Internal calculations always use full
 * floating-point precision; rounding happens here, at the last step.
 */

/**
 * Converts a decimal degree value into degrees/minutes/seconds.
 * @param {number} decimalDegrees non-negative, typically 0-30 (degree within sign) or 0-360
 * @returns {{deg:number, min:number, sec:number}}
 */
export function toDMS(decimalDegrees) {
  const totalSeconds = Math.round(decimalDegrees * 3600);
  const deg = Math.floor(totalSeconds / 3600);
  const min = Math.floor((totalSeconds % 3600) / 60);
  const sec = totalSeconds % 60;
  return { deg, min, sec };
}

/**
 * Formats a degree-within-sign value as "28°10′30″".
 * @param {number} decimalDegrees
 * @returns {string}
 */
export function formatDMS(decimalDegrees) {
  const { deg, min, sec } = toDMS(decimalDegrees);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(deg)}°${pad(min)}′${pad(sec)}″`;
}
