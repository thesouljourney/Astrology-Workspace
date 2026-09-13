import { useEffect, useRef, useState } from "react";
import { loadCityIndex, searchPlaces } from "../../geo/placeSearch.js";
import { resolveUtcOffsetForZone, isTimezoneResolutionSupported } from "../../geo/timezoneResolution.js";

/**
 * Shared Birth Data input — Production UX Refactor, Part 2/3.
 *
 * Used identically by Quick Calculator, Create Case, and Edit Case, so
 * there is exactly one Birth Place search / timezone-resolution
 * behavior in the app. Renders Birth Date / Birth Time / Birth Place
 * (with offline place-name search) plus a collapsed "Advanced Details"
 * section exposing latitude/longitude/IANA timezone/resolved UTC offset
 * for manual entry or correction.
 *
 * THIS COMPONENT PERFORMS NO ASTROLOGY CALCULATION. Its only output is
 * exactly the fields `calculateChart()`/`computeCaseChart()` already
 * accept: `date`, `time`, `latitude`, `longitude`, `timezone` (a UTC
 * offset string, e.g. "+08:00" - unchanged shape). `placeName` and the
 * new `ianaTimeZone` are additional, purely-informational birthData
 * fields the locked fingerprint payload does not read (see
 * `fingerprint.js`'s `fingerprintPayload()`), exactly like the existing
 * `placeName` field already was.
 *
 * @param {object} props
 * @param {{date,time,placeName,latitude,longitude,ianaTimeZone,timezone}} props.value
 * @param {(patch: object) => void} props.onChange merges `patch` into the caller's birthData state
 * @param {string} props.idPrefix unique per-form id prefix (form ids must be unique per page)
 */
export function BirthDataFields({ value, onChange, idPrefix }) {
  const { date, time, placeName, latitude, longitude, ianaTimeZone, timezone } = value;
  const [query, setQuery] = useState(placeName || "");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [offsetOverridden, setOffsetOverridden] = useState(false);
  const cityIndexRef = useRef(null);
  const supportsResolution = useRef(isTimezoneResolutionSupported()).current;

  useEffect(() => {
    setQuery(placeName || "");
  }, [placeName]);

  // Whenever the selected IANA zone, birth date, or birth time changes,
  // re-resolve the UTC offset that actually applied at that historical
  // instant - never "today's" offset for that zone (Part 3). Skipped
  // once the astrologer has manually typed a different offset directly.
  useEffect(() => {
    if (!ianaTimeZone || offsetOverridden || !supportsResolution) return;
    const resolved = resolveUtcOffsetForZone(ianaTimeZone, date, time);
    if (resolved && resolved.offsetString !== timezone) onChange({ timezone: resolved.offsetString });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ianaTimeZone, date, time, offsetOverridden]);

  async function handleQueryChange(e) {
    const q = e.target.value;
    setQuery(q);
    onChange({ placeName: q }); // free-text is always saved, even before/without picking a suggestion
    if (q.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    if (!cityIndexRef.current) cityIndexRef.current = await loadCityIndex();
    setResults(searchPlaces(q, cityIndexRef.current));
    setShowResults(true);
  }

  function selectPlace(place) {
    setQuery(place.label);
    setShowResults(false);
    setOffsetOverridden(false);
    const resolved = supportsResolution ? resolveUtcOffsetForZone(place.timezone, date, time) : null;
    onChange({
      placeName: place.label,
      latitude: place.lat,
      longitude: place.lng,
      ianaTimeZone: place.timezone,
      timezone: resolved ? resolved.offsetString : timezone,
    });
  }

  return (
    <>
      <div className="field">
        <label htmlFor={`${idPrefix}-date`}>Birth Date｜出生日期</label>
        <input id={`${idPrefix}-date`} type="date" value={date} onChange={(e) => onChange({ date: e.target.value })} required />
      </div>

      <div className="field">
        <label htmlFor={`${idPrefix}-time`}>Birth Time｜出生时间</label>
        <input id={`${idPrefix}-time`} type="time" step="1" value={time} onChange={(e) => onChange({ time: e.target.value })} required />
      </div>

      <div className="field bdi-place-field">
        <label htmlFor={`${idPrefix}-place`}>Birth Place｜出生地点</label>
        <input
          id={`${idPrefix}-place`}
          value={query}
          autoComplete="off"
          placeholder="Start typing a city…｜输入城市名称…"
          onChange={handleQueryChange}
          onFocus={() => results.length > 0 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 150)}
        />
        {showResults && results.length > 0 && (
          <ul className="bdi-place-suggestions">
            {results.map((r, i) => (
              <li key={`${r.label}-${i}`}>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => selectPlace(r)}>
                  {r.label}
                </button>
              </li>
            ))}
          </ul>
        )}
        {ianaTimeZone && (
          <p className="reception-note bdi-resolved-note">
            Resolved｜已解析: {ianaTimeZone} · UTC{timezone || "—"}
          </p>
        )}
      </div>

      <details className="bdi-advanced">
        <summary>Advanced Details｜高级资料</summary>
        <div className="field">
          <label htmlFor={`${idPrefix}-lat`}>Latitude｜纬度</label>
          <input id={`${idPrefix}-lat`} type="number" step="any" value={latitude} onChange={(e) => onChange({ latitude: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}-lon`}>Longitude｜经度</label>
          <input id={`${idPrefix}-lon`} type="number" step="any" value={longitude} onChange={(e) => onChange({ longitude: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}-ianatz`}>IANA Timezone｜IANA 时区</label>
          <input
            id={`${idPrefix}-ianatz`}
            value={ianaTimeZone || ""}
            placeholder="e.g. Asia/Kuala_Lumpur"
            onChange={(e) => {
              setOffsetOverridden(false);
              onChange({ ianaTimeZone: e.target.value });
            }}
          />
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}-tz`}>Resolved UTC Offset｜已解析 UTC 偏移</label>
          <input
            id={`${idPrefix}-tz`}
            value={timezone}
            placeholder="+08:00"
            onChange={(e) => {
              setOffsetOverridden(true);
              onChange({ timezone: e.target.value });
            }}
          />
        </div>
        <p className="reception-note">
          A place not found above can be entered manually here — latitude, longitude, and UTC offset are all
          editable directly｜若上方未找到该地点，可在此手动输入纬度、经度与 UTC 偏移
        </p>
        {!supportsResolution && (
          <p className="reception-note">
            This browser cannot auto-resolve historical timezone offsets — please enter the UTC offset manually｜此浏览器无法自动解析历史时区偏移，请手动输入 UTC 偏移
          </p>
        )}
      </details>
    </>
  );
}
