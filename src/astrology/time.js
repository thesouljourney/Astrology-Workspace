/**
 * Time conversion utilities.
 *
 * Astrological calculations require an accurate Universal Time (UT) and
 * Julian Day (JD) derived from the birth data. Local birth time must NEVER
 * be treated as UTC directly — it must first be shifted by the UTC offset
 * of the birth location.
 */

/**
 * Parses a UTC offset string such as "+08:00", "-05:30", "+8", "8" into a
 * signed decimal number of hours.
 *
 * @param {string} offsetString
 * @returns {number} offset in decimal hours (e.g. "+08:00" -> 8, "-05:30" -> -5.5)
 */
export function parseUtcOffset(offsetString) {
  if (typeof offsetString === "number") return offsetString;

  const trimmed = String(offsetString).trim();
  const match = trimmed.match(/^([+-]?)(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) {
    throw new Error(`Invalid UTC offset: "${offsetString}". Expected format like "+08:00".`);
  }

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = match[3] ? Number(match[3]) : 0;

  const value = sign * (hours + minutes / 60);

  if (value < -12 || value > 14) {
    throw new Error(`UTC offset out of range: "${offsetString}". Must be between -12:00 and +14:00.`);
  }

  return value;
}

/**
 * Converts a local birth date/time + UTC offset into an absolute UTC Date.
 *
 * IMPORTANT: local time is never treated as UTC. The conversion is:
 *   UTC = LocalTime - UTCOffset
 *
 * Example:
 *   1994-11-21 01:44:00, UTC+8
 *   -> 1994-11-20 17:44:00 UTC
 *
 * @param {string} birthDate  "YYYY-MM-DD"
 * @param {string} birthTime  "HH:MM" or "HH:MM:SS"
 * @param {string|number} utcOffset e.g. "+08:00"
 * @returns {Date} JavaScript Date object representing the absolute UTC instant
 */
export function convertLocalBirthTimeToUTC(birthDate, birthTime, utcOffset) {
  const dateMatch = String(birthDate).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) {
    throw new Error(`Invalid birth date: "${birthDate}". Expected format "YYYY-MM-DD".`);
  }
  const timeMatch = String(birthTime).trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!timeMatch) {
    throw new Error(`Invalid birth time: "${birthTime}". Expected format "HH:MM" or "HH:MM:SS".`);
  }

  const [, yearStr, monthStr, dayStr] = dateMatch;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const second = timeMatch[3] ? Number(timeMatch[3]) : 0;

  if (month < 1 || month > 12) throw new Error(`Invalid month in birth date: "${birthDate}".`);
  if (day < 1 || day > 31) throw new Error(`Invalid day in birth date: "${birthDate}".`);
  if (hour > 23 || minute > 59 || second > 59) {
    throw new Error(`Invalid birth time: "${birthTime}".`);
  }

  const offsetHours = parseUtcOffset(utcOffset);

  // Step 1: build the wall-clock instant as if it were UTC (Date.UTC treats
  // its arguments as UTC fields, which is exactly the "local calendar
  // reading" we want before adjusting for the offset).
  const localAsUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);

  // Step 2: shift by the UTC offset to obtain the true UTC instant.
  // Local time = UTC + offset  =>  UTC = Local time - offset
  const offsetMs = offsetHours * 60 * 60 * 1000;
  const utcMs = localAsUtcMs - offsetMs;

  return new Date(utcMs);
}

/**
 * Calculates the Julian Day (UT-based) for a given UTC Date.
 *
 * Standard algorithm (Meeus, "Astronomical Algorithms", ch. 7), valid for
 * the Gregorian calendar.
 *
 * @param {Date} utcDate absolute UTC instant
 * @returns {number} Julian Day number
 */
export function calculateJulianDay(utcDate) {
  const year = utcDate.getUTCFullYear();
  const month = utcDate.getUTCMonth() + 1;
  const day =
    utcDate.getUTCDate() +
    (utcDate.getUTCHours() +
      utcDate.getUTCMinutes() / 60 +
      (utcDate.getUTCSeconds() + utcDate.getUTCMilliseconds() / 1000) / 3600) /
      24;

  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);

  const jd =
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    b -
    1524.5;

  return jd;
}
