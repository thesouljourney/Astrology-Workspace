/**
 * Historical-timezone-aware UTC offset resolution — Production UX
 * Refactor, Part 3.
 *
 * THIS FILE PERFORMS NO ASTROLOGY CALCULATION. It answers exactly one
 * question: "for IANA zone Z, what was the UTC offset in effect at local
 * wall-clock date/time D/T?" — and hands the resulting offset string
 * (e.g. "+08:00") to the existing, locked `calculateChart()` input shape
 * (`utcOffset`), which is unchanged (see `src/astrology/time.js`).
 *
 * Deliberately ZERO new runtime dependency: modern JS engines ship the
 * full IANA tz database inside `Intl` (via ICU), including historical
 * transitions and DST rules — the same authoritative source a library
 * like moment-timezone/luxon would otherwise bundle as static data. This
 * was verified against the project's own golden verification chart
 * (1994-11-21 01:44 local, Asia/Kuala_Lumpur) during Stage 2 of the
 * refactor: `Intl.DateTimeFormat` with `timeZoneName: "longOffset"`
 * correctly resolves it to "GMT+08:00", not "today's" Malaysia offset.
 *
 * Browser support requirement: `timeZoneName: "longOffset"` (Chrome 96+,
 * Firefox 110+, Safari 15.4+, Node 18+) — all released well before this
 * project's timeframe. Any environment where it is unsupported, or an
 * unrecognized IANA zone, falls back to manual UTC-offset entry (Part 3's
 * "Advanced Details" fallback), never a silent wrong guess.
 */

/**
 * Resolves the UTC offset (minutes, signed) in effect for `ianaZone` at
 * the given LOCAL wall-clock date/time. Converges in two passes: modern
 * historical zone changes are all whole-hour or half/quarter-hour steps,
 * so one refinement pass after an initial naive guess is sufficient
 * except exactly inside a DST transition's skipped/ambiguous hour — a
 * well-known, universally-accepted edge case shared by every timezone
 * library (there is no single correct answer for a local time that
 * never happened, or happened twice).
 *
 * @param {string} ianaZone e.g. "Asia/Kuala_Lumpur"
 * @param {string} dateStr "YYYY-MM-DD"
 * @param {string} timeStr "HH:MM" or "HH:MM:SS"
 * @returns {{offsetMinutes: number, offsetString: string} | null} null if the zone is unrecognized or the runtime lacks `longOffset` support
 */
export function resolveUtcOffsetForZone(ianaZone, dateStr, timeStr) {
  if (!ianaZone) return null;

  const dateMatch = String(dateStr ?? "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = String(timeStr ?? "").trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!dateMatch || !timeMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const second = timeMatch[3] ? Number(timeMatch[3]) : 0;

  let formatter;
  try {
    formatter = new Intl.DateTimeFormat("en-US", { timeZone: ianaZone, timeZoneName: "longOffset", hourCycle: "h23" });
  } catch {
    return null; // unrecognized IANA zone name
  }

  const offsetMinutesAt = (utcMs) => {
    const parts = formatter.formatToParts(new Date(utcMs));
    const raw = parts.find((p) => p.type === "timeZoneName")?.value;
    if (!raw) return null; // longOffset unsupported by this runtime
    if (raw === "GMT") return 0; // some engines (e.g. Chromium) render exactly zero offset as bare "GMT", not "GMT+00:00"
    const match = raw.match(/GMT([+-]\d{1,2})(?::?(\d{2}))?/); // "GMT+08:00" / "GMT-05:30"
    if (!match) return null;
    const sign = match[1].startsWith("-") ? -1 : 1;
    const h = Math.abs(Number(match[1]));
    const m = match[2] ? Number(match[2]) : 0;
    return sign * (h * 60 + m);
  };

  const wallClockAsUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);

  const firstGuessOffset = offsetMinutesAt(wallClockAsUtcMs);
  if (firstGuessOffset === null) return null;

  // Refine: the true UTC instant is the wall-clock reading minus the
  // offset that actually applies AT that instant.
  const refinedUtcMs = wallClockAsUtcMs - firstGuessOffset * 60 * 1000;
  const refinedOffset = offsetMinutesAt(refinedUtcMs) ?? firstGuessOffset;

  return { offsetMinutes: refinedOffset, offsetString: formatOffsetMinutes(refinedOffset) };
}

/** @param {number} totalMinutes signed @returns {string} e.g. 480 -> "+08:00", -330 -> "-05:30" */
export function formatOffsetMinutes(totalMinutes) {
  const sign = totalMinutes < 0 ? "-" : "+";
  const abs = Math.abs(totalMinutes);
  const h = String(Math.floor(abs / 60)).padStart(2, "0");
  const m = String(abs % 60).padStart(2, "0");
  return `${sign}${h}:${m}`;
}

/**
 * Whether this runtime supports the `longOffset` resolution this module
 * relies on - used to decide whether to show the resolved-offset UI or
 * fall straight to manual entry. Deliberately probes a non-zero-offset
 * zone: a zero-offset zone like "UTC" is not a reliable probe on its
 * own, since some engines render it as bare "GMT" rather than
 * "GMT+00:00" (a real cross-browser difference found and handled in
 * `offsetMinutesAt()` above, verified against headless Chromium during
 * the refactor's own responsive verification pass).
 */
export function isTimezoneResolutionSupported() {
  return resolveUtcOffsetForZone("Asia/Kolkata", "2000-01-01", "00:00") !== null;
}
