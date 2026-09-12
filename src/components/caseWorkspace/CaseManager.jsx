import { useState } from "react";
import { computeCaseChart } from "../../caseWorkspace/caseChart.js";
import { deriveCalculationProfile, computeChartFingerprint } from "../../caseWorkspace/fingerprint.js";
import { CASE_STATUS } from "../../caseWorkspace/caseModel.js";
import { useAsyncData } from "./useAsyncData.js";

const NEW_CASE_DEFAULTS = {
  caseName: "",
  date: "",
  time: "",
  placeName: "",
  latitude: "",
  longitude: "",
  timezone: "+08:00",
  houseSystem: "placidus",
  nodeType: "true",
  lilithType: "mean",
};

function NewCaseForm({ caseRepo, onCreated }) {
  const [form, setForm] = useState(NEW_CASE_DEFAULTS);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return; // prevent double-submit
    setError(null);
    setSubmitting(true);
    try {
      const birthData = { date: form.date, time: form.time, placeName: form.placeName, latitude: form.latitude, longitude: form.longitude, timezone: form.timezone };
      const chart = computeCaseChart({ birthData, calculationProfile: { westernHouseSystem: form.houseSystem, westernNodeType: form.nodeType, westernLilithType: form.lilithType } });
      const calculationProfile = deriveCalculationProfile(chart);
      const chartFingerprint = computeChartFingerprint(birthData, chart);
      const created = await caseRepo.create({ caseName: form.caseName || "Untitled Case", birthData, calculationProfile, chartFingerprint });
      setForm(NEW_CASE_DEFAULTS);
      onCreated(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form ws-new-case-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="nc-caseName">Case Name｜案例名称</label>
        <input id="nc-caseName" value={form.caseName} onChange={set("caseName")} placeholder="e.g. Client A" />
      </div>
      <div className="field">
        <label htmlFor="nc-date">Birth Date｜出生日期</label>
        <input id="nc-date" type="date" value={form.date} onChange={set("date")} required />
      </div>
      <div className="field">
        <label htmlFor="nc-time">Birth Time｜出生时间</label>
        <input id="nc-time" type="time" step="1" value={form.time} onChange={set("time")} required />
      </div>
      <div className="field">
        <label htmlFor="nc-place">Place Name｜出生地点</label>
        <input id="nc-place" value={form.placeName} onChange={set("placeName")} placeholder="e.g. Batu Pahat, Johor, Malaysia" />
      </div>
      <div className="field">
        <label htmlFor="nc-lat">Latitude｜纬度</label>
        <input id="nc-lat" type="number" step="any" value={form.latitude} onChange={set("latitude")} required />
      </div>
      <div className="field">
        <label htmlFor="nc-lon">Longitude｜经度</label>
        <input id="nc-lon" type="number" step="any" value={form.longitude} onChange={set("longitude")} required />
      </div>
      <div className="field">
        <label htmlFor="nc-tz">UTC Offset｜UTC 时区偏移</label>
        <input id="nc-tz" value={form.timezone} onChange={set("timezone")} placeholder="+08:00" required />
      </div>
      <div className="field">
        <label htmlFor="nc-house">House System｜宫位制</label>
        <select id="nc-house" value={form.houseSystem} onChange={set("houseSystem")}>
          <option value="placidus">Placidus</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="nc-node">Node Type｜交点类型</label>
        <select id="nc-node" value={form.nodeType} onChange={set("nodeType")}>
          <option value="true">True｜真</option>
          <option value="mean">Mean｜均</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="nc-lilith">Lilith Type｜莉莉丝类型</label>
        <select id="nc-lilith" value={form.lilithType} onChange={set("lilithType")}>
          <option value="mean">Mean｜均</option>
          <option value="osculating">Osculating｜真</option>
        </select>
      </div>
      <button type="submit" className="calculate-btn" disabled={submitting}>
        {submitting ? "Creating…｜创建中…" : "Create Case｜创建案例"}
      </button>
      {error && <div className="error-box">{error}</div>}
    </form>
  );
}

/**
 * Case list + create/rename/archive/switch workflow (brief Part 23).
 *
 * `caseRepo.list()` is Promise-returning (Phase 7 pre-lock audit fix),
 * so the list is loaded via `useAsyncData` rather than read directly
 * during render; every write (`create`/`rename`/`archive`/`unarchive`)
 * is awaited before `reload()` re-reads, so a network-backed repository
 * could never show stale data or race its own write.
 */
export function CaseManager({ caseRepo, onOpenCase }) {
  const [showArchived, setShowArchived] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [busyId, setBusyId] = useState(null); // prevents double-submit on rename/archive/unarchive per row

  const { data: cases, loading, error, reload } = useAsyncData(() => caseRepo.list({ includeArchived: true }), [caseRepo]);

  const visibleCases = (cases ?? []).filter((c) => (showArchived ? c.status === CASE_STATUS.ARCHIVED : c.status === CASE_STATUS.ACTIVE));

  function startRename(c) {
    setRenamingId(c.caseId);
    setRenameValue(c.caseName);
  }

  async function commitRename(caseId) {
    if (busyId) return;
    setBusyId(caseId);
    try {
      await caseRepo.rename(caseId, renameValue || "Untitled Case");
      setRenamingId(null);
      await reload();
    } finally {
      setBusyId(null);
    }
  }

  async function toggleArchive(c) {
    if (busyId) return;
    setBusyId(c.caseId);
    try {
      if (c.status === CASE_STATUS.ACTIVE) await caseRepo.archive(c.caseId);
      else await caseRepo.unarchive(c.caseId);
      await reload();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="case-manager">
      <h2>Cases｜案例</h2>
      <p className="reception-note">Manual Interpretation Workspace — organize technical evidence per person/chart and write your own notes｜人工解盘工作台 — 按人/命盘组织技术证据并撰写笔记</p>

      <NewCaseForm caseRepo={caseRepo} onCreated={() => reload()} />

      <div className="ws-case-list-header">
        <button type="button" className={showArchived ? "topic-btn" : "topic-btn active"} onClick={() => setShowArchived(false)}>
          Active｜进行中
        </button>
        <button type="button" className={showArchived ? "topic-btn active" : "topic-btn"} onClick={() => setShowArchived(true)}>
          Archived｜已归档
        </button>
      </div>

      {loading && <p className="reception-note">Loading Cases…｜加载中…</p>}
      {error && <div className="error-box">{error.message}</div>}

      {!loading && !error && (
        <ul className="ws-case-list">
          {visibleCases.length === 0 && <li className="reception-note">No cases yet｜暂无案例</li>}
          {visibleCases.map((c) => (
            <li key={c.caseId} className="ws-case-list-item">
              {renamingId === c.caseId ? (
                <>
                  <input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
                  <button type="button" className="ws-btn" onClick={() => commitRename(c.caseId)} disabled={busyId === c.caseId}>
                    Save｜保存
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="ws-case-open-btn" onClick={() => onOpenCase(c)}>
                    {c.caseName}
                    <span className="reception-note">
                      {" "}
                      — {c.birthData.date} {c.birthData.placeName || `${c.birthData.latitude}, ${c.birthData.longitude}`}
                    </span>
                  </button>
                  <div className="ws-case-actions">
                    <button type="button" className="ws-btn" onClick={() => startRename(c)} disabled={busyId === c.caseId}>
                      Rename｜重命名
                    </button>
                    <button type="button" className="ws-btn" onClick={() => toggleArchive(c)} disabled={busyId === c.caseId}>
                      {c.status === CASE_STATUS.ACTIVE ? "Archive｜归档" : "Unarchive｜取消归档"}
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
