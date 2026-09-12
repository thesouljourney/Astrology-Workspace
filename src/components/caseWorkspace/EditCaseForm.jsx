import { useState } from "react";
import { computeCaseChart } from "../../caseWorkspace/caseChart.js";
import { deriveCalculationProfile, computeChartFingerprint } from "../../caseWorkspace/fingerprint.js";

/**
 * Edit Case — Phase 7 pre-lock audit fix (Part 4).
 *
 * Reuses the exact same supported fields/options as Case creation
 * (`CaseManager.jsx`'s NewCaseForm) - no new Classical/Vedic doctrine
 * option, no new astrology setting, no geocoding API. On save:
 * recomputes through the existing locked `computeCaseChart()` (the
 * same pipeline used everywhere else), derives a fresh
 * `calculationProfile`, computes the new `chartFingerprint`, and
 * updates the SAME `caseId` via `caseRepo.update()`. It never touches
 * `notesRepository` - historical notes under the old fingerprint are
 * preserved purely because nothing here ever writes to or deletes
 * them (see `localNotesRepository.js`'s own isolation-by-construction).
 */
export function EditCaseForm({ caseRecord, caseRepo, onSaved, onCancel }) {
  const [form, setForm] = useState({
    caseName: caseRecord.caseName,
    date: caseRecord.birthData.date,
    time: caseRecord.birthData.time,
    placeName: caseRecord.birthData.placeName ?? "",
    latitude: caseRecord.birthData.latitude,
    longitude: caseRecord.birthData.longitude,
    timezone: caseRecord.birthData.timezone,
    houseSystem: caseRecord.calculationProfile.westernHouseSystem ?? "placidus",
    nodeType: caseRecord.calculationProfile.westernNodeType ?? "true",
    lilithType: caseRecord.calculationProfile.westernLilithType ?? "mean",
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return; // prevent double-submit
    setError(null);
    setSaving(true);
    try {
      const birthData = { date: form.date, time: form.time, placeName: form.placeName, latitude: form.latitude, longitude: form.longitude, timezone: form.timezone };
      const chart = computeCaseChart({ birthData, calculationProfile: { westernHouseSystem: form.houseSystem, westernNodeType: form.nodeType, westernLilithType: form.lilithType } });
      const calculationProfile = deriveCalculationProfile(chart);
      const chartFingerprint = computeChartFingerprint(birthData, chart);
      await caseRepo.update(caseRecord.caseId, { caseName: form.caseName || "Untitled Case", birthData, calculationProfile, chartFingerprint });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form ws-new-case-form ws-edit-case-form" onSubmit={handleSubmit}>
      <h4 className="ws-edit-case-heading">Edit Case｜编辑案例</h4>
      <div className="field">
        <label htmlFor="ec-caseName">Case Name｜案例名称</label>
        <input id="ec-caseName" value={form.caseName} onChange={set("caseName")} />
      </div>
      <div className="field">
        <label htmlFor="ec-date">Birth Date｜出生日期</label>
        <input id="ec-date" type="date" value={form.date} onChange={set("date")} required />
      </div>
      <div className="field">
        <label htmlFor="ec-time">Birth Time｜出生时间</label>
        <input id="ec-time" type="time" step="1" value={form.time} onChange={set("time")} required />
      </div>
      <div className="field">
        <label htmlFor="ec-place">Place Name｜出生地点</label>
        <input id="ec-place" value={form.placeName} onChange={set("placeName")} placeholder="e.g. Batu Pahat, Johor, Malaysia" />
      </div>
      <div className="field">
        <label htmlFor="ec-lat">Latitude｜纬度</label>
        <input id="ec-lat" type="number" step="any" value={form.latitude} onChange={set("latitude")} required />
      </div>
      <div className="field">
        <label htmlFor="ec-lon">Longitude｜经度</label>
        <input id="ec-lon" type="number" step="any" value={form.longitude} onChange={set("longitude")} required />
      </div>
      <div className="field">
        <label htmlFor="ec-tz">UTC Offset｜UTC 时区偏移</label>
        <input id="ec-tz" value={form.timezone} onChange={set("timezone")} placeholder="+08:00" required />
      </div>
      <div className="field">
        <label htmlFor="ec-house">House System｜宫位制</label>
        <select id="ec-house" value={form.houseSystem} onChange={set("houseSystem")}>
          <option value="placidus">Placidus</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="ec-node">Node Type｜交点类型</label>
        <select id="ec-node" value={form.nodeType} onChange={set("nodeType")}>
          <option value="true">True｜真</option>
          <option value="mean">Mean｜均</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="ec-lilith">Lilith Type｜莉莉丝类型</label>
        <select id="ec-lilith" value={form.lilithType} onChange={set("lilithType")}>
          <option value="mean">Mean｜均</option>
          <option value="osculating">Osculating｜真</option>
        </select>
      </div>
      <div className="ws-edit-case-actions">
        <button type="submit" className="calculate-btn" disabled={saving}>
          {saving ? "Saving…｜保存中…" : "Save Case｜保存案例"}
        </button>
        <button type="button" className="ws-btn" onClick={onCancel} disabled={saving}>
          Cancel｜取消
        </button>
      </div>
      <p className="reception-note">
        If any of date/time/latitude/longitude/timezone changes, this Case's chartFingerprint will change - existing notes are preserved under their original chart version and remain accessible; nothing is copied into the new version automatically｜若出生日期/时间/纬度/经度/时区发生变化，本案例的图版本指纹将随之改变
        —
        已有笔记会保留在原图版本下并可继续访问，系统不会自动将其复制到新版本。
      </p>
      {error && <div className="error-box">{error}</div>}
    </form>
  );
}
