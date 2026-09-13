import { useEffect, useMemo, useState } from "react";
import { computeCaseChart } from "../../caseWorkspace/caseChart.js";
import { computeChartFingerprint } from "../../caseWorkspace/fingerprint.js";
import { PHASE6_TOPIC_IDS } from "../../caseWorkspace/noteModel.js";
import { TOPIC_LABELS } from "./topicLabels.js";
import { TopicWorkspace } from "./TopicWorkspace.jsx";
import { EditCaseForm } from "./EditCaseForm.jsx";
import { CaseChartData } from "./CaseChartData.jsx";
import { CaseNotesSection } from "./CaseNotesSection.jsx";
import { FinalReadingSection } from "./FinalReadingSection.jsx";
import { CaseHistorySection } from "./CaseHistorySection.jsx";
import { useAsyncData } from "./useAsyncData.js";

const TABS = [
  { id: "overview", label: "Overview｜总览" },
  { id: "chartData", label: "Chart Data｜星盘资料" },
  { id: "topics", label: "Topics｜主题解盘" },
  { id: "caseNotes", label: "Case Notes｜整盘笔记" },
  { id: "finalReading", label: "Final Reading｜完整解盘" },
  { id: "history", label: "History｜历史记录" },
];

async function topicStatus(notesRepo, caseId, topicId, currentFingerprint) {
  const current = await notesRepo.getCurrentVersion({ caseId, topicId, chartFingerprint: currentFingerprint });
  if (current) return { text: `v${current.versionNumber} — ${current.status}`, hasNotes: true };
  const historical = (await notesRepo.listFingerprints({ caseId, topicId })).filter((f) => f.chartFingerprint !== currentFingerprint);
  if (historical.length > 0) return { text: "Earlier chart version has notes｜有历史图版本笔记", hasNotes: true };
  return { text: "Never Started｜未开始", hasNotes: false };
}

/** Concise Case Overview (Part 6): birth summary + a compact 3-system snapshot - never a raw technical dump (that lives in the Chart Data tab). */
function CaseOverviewSummary({ chart }) {
  const sun = chart.planets.find((p) => p.key === "sun");
  const moon = chart.planets.find((p) => p.key === "moon");
  const asc = chart.angles.asc;
  const lagna = chart.vedic?.summary?.chartOverview?.lagna;
  const moonNakshatra = chart.vedic?.summary?.grahas?.moon?.nakshatra;

  return (
    <div className="case-overview-summary">
      <div className="cos-system-grid">
        <div className="cos-system-card">
          <h4>Modern Western｜现代西方</h4>
          <p>
            Sun｜太阳: {sun.sign.english} {sun.degreeInSign.toFixed(1)}°
          </p>
          <p>
            Moon｜月亮: {moon.sign.english} {moon.degreeInSign.toFixed(1)}°
          </p>
          <p>
            ASC｜上升: {asc.sign.english} {asc.degreeInSign.toFixed(1)}°
          </p>
        </div>
        <div className="cos-system-card">
          <h4>Classical｜古典</h4>
          <p>Sect｜昼夜: {chart.classical.sect === "day" ? "Day Chart｜日盘" : "Night Chart｜夜盘"}</p>
        </div>
        <div className="cos-system-card">
          <h4>Vedic｜印度</h4>
          {lagna && (
            <p>
              Lagna｜上升点: {lagna.rashi} {lagna.degreeInRashi.toFixed(1)}°
            </p>
          )}
          {moonNakshatra && (
            <p>
              Moon Nakshatra｜月亮宿: {moonNakshatra.name} (Pada {moonNakshatra.pada})
            </p>
          )}
        </div>
      </div>
      <p className="reception-note">
        See the Chart Data tab for the complete technical reference across all three systems｜完整技术资料请见"星盘资料"分页
      </p>
    </div>
  );
}

/** The 8-topic progress grid + entry point into a single Topic's workspace (Part 8). */
function CaseTopicsTab({ caseRecord, currentFingerprint, notesRepo, onSelectTopic }) {
  const {
    data: topicStatuses,
    loading,
    error,
  } = useAsyncData(
    () => Promise.all(PHASE6_TOPIC_IDS.map((topicId) => topicStatus(notesRepo, caseRecord.caseId, topicId, currentFingerprint))),
    [notesRepo, caseRecord.caseId, currentFingerprint],
  );

  if (loading) return <p className="reception-note">Loading topic progress…｜加载主题进度中…</p>;
  if (error) return <div className="error-box">{error.message}</div>;

  return (
    <div className="ws-topic-grid">
      {PHASE6_TOPIC_IDS.map((topicId, i) => {
        const status = topicStatuses[i];
        return (
          <button key={topicId} type="button" className={`ws-topic-card ${status.hasNotes ? "ws-topic-card-started" : ""}`} onClick={() => onSelectTopic(topicId)}>
            <span className="ws-topic-card-label">{TOPIC_LABELS[topicId]}</span>
            <span className="ws-topic-card-status">{status.text}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * One Case's complete workspace (Production UX Refactor, Part 5): a
 * persistent header (name/birth summary/Edit Case) above a tabbed area -
 * Overview / Chart Data / Topics / Case Notes / Final Reading / History.
 * Selecting a Topic still opens the full-page `TopicWorkspace` (Part 12
 * keeps its evidence+writing layout intact and central); Edit Case still
 * replaces this view entirely while active - both unchanged behaviors
 * from Phase 7, just re-hosted under the new tab shell.
 */
export function CaseOverview({ caseRecord, caseRepo, notesRepo, caseNotesRepo, finalReadingRepo, onBack, onCaseChanged }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [editing, setEditing] = useState(false);

  const chart = useMemo(() => computeCaseChart(caseRecord), [caseRecord.caseId, caseRecord.birthData, caseRecord.calculationProfile]); // eslint-disable-line react-hooks/exhaustive-deps
  const currentFingerprint = useMemo(() => computeChartFingerprint(caseRecord.birthData, chart), [chart, caseRecord.birthData]);

  useEffect(() => {
    if (caseRecord.chartFingerprint !== currentFingerprint) {
      caseRepo.update(caseRecord.caseId, { chartFingerprint: currentFingerprint }).then(() => onCaseChanged());
    }
    // Fingerprint sync only - never mutates birthData/calculationProfile/notes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseRecord.caseId, caseRecord.chartFingerprint, currentFingerprint]);

  if (selectedTopicId) {
    return (
      <TopicWorkspace
        caseRecord={caseRecord}
        chart={chart}
        currentFingerprint={currentFingerprint}
        topicId={selectedTopicId}
        notesRepo={notesRepo}
        onBack={() => setSelectedTopicId(null)}
      />
    );
  }

  const { birthData } = caseRecord;

  if (editing) {
    return (
      <div className="case-overview">
        <EditCaseForm
          caseRecord={caseRecord}
          caseRepo={caseRepo}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            onCaseChanged();
          }}
        />
      </div>
    );
  }

  return (
    <div className="case-overview">
      <button type="button" className="ws-btn ws-back-btn" onClick={onBack}>
        ← All Cases｜所有案例
      </button>

      <header className="ws-case-header">
        <h3>{caseRecord.caseName}</h3>
        <p className="reception-note">
          {birthData.date} {birthData.time} · {birthData.placeName || `${birthData.latitude}, ${birthData.longitude}`} · UTC{birthData.timezone}
        </p>
        <button type="button" className="ws-btn" onClick={() => setEditing(true)}>
          Edit Case｜编辑案例
        </button>
      </header>

      <nav className="case-tab-nav">
        {TABS.map((tab) => (
          <button key={tab.id} type="button" className={activeTab === tab.id ? "topic-btn active" : "topic-btn"} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "overview" && <CaseOverviewSummary chart={chart} />}
      {activeTab === "chartData" && <CaseChartData chart={chart} />}
      {activeTab === "topics" && <CaseTopicsTab caseRecord={caseRecord} currentFingerprint={currentFingerprint} notesRepo={notesRepo} onSelectTopic={setSelectedTopicId} />}
      {activeTab === "caseNotes" && <CaseNotesSection caseId={caseRecord.caseId} caseNotesRepo={caseNotesRepo} />}
      {activeTab === "finalReading" && <FinalReadingSection caseId={caseRecord.caseId} currentFingerprint={currentFingerprint} notesRepo={notesRepo} finalReadingRepo={finalReadingRepo} />}
      {activeTab === "history" && <CaseHistorySection caseId={caseRecord.caseId} currentFingerprint={currentFingerprint} notesRepo={notesRepo} />}
    </div>
  );
}
