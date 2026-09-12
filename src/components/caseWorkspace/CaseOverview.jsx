import { useEffect, useMemo, useState } from "react";
import { computeCaseChart } from "../../caseWorkspace/caseChart.js";
import { computeChartFingerprint } from "../../caseWorkspace/fingerprint.js";
import { PHASE6_TOPIC_IDS } from "../../caseWorkspace/noteModel.js";
import { TopicWorkspace } from "./TopicWorkspace.jsx";
import { EditCaseForm } from "./EditCaseForm.jsx";
import { useAsyncData } from "./useAsyncData.js";

const TOPIC_LABELS = {
  self_core_nature: "Self / Core Nature｜本我与人格核心",
  career: "Career｜事业",
  wealth: "Wealth｜财富与资源",
  relationship: "Relationship｜感情与亲密关系",
  family_roots: "Family & Roots｜家庭、根基与归属",
  parents: "Parents｜父母",
  siblings: "Siblings｜兄弟姐妹",
  inner_shadow: "Inner Shadow｜内在阴影",
};

async function topicStatus(notesRepo, caseId, topicId, currentFingerprint) {
  const current = await notesRepo.getCurrentVersion({ caseId, topicId, chartFingerprint: currentFingerprint });
  if (current) return { text: `v${current.versionNumber} — ${current.status}`, hasNotes: true };
  const historical = (await notesRepo.listFingerprints({ caseId, topicId })).filter((f) => f.chartFingerprint !== currentFingerprint);
  if (historical.length > 0) return { text: "Earlier chart version has notes｜有历史图版本笔记", hasNotes: true };
  return { text: "Never Started｜未开始", hasNotes: false };
}

/**
 * One Case's birth-data summary + 8-topic progress grid, the Edit Case
 * workflow, and hosts the currently-open TopicWorkspace (if any).
 *
 * `notesRepository` methods are Promise-returning (Phase 7 pre-lock
 * audit fix), so the 8-topic status grid is loaded via `useAsyncData`
 * (all 8 topics in parallel) instead of being read synchronously during
 * render.
 */
export function CaseOverview({ caseRecord, caseRepo, notesRepo, onBack, onCaseChanged }) {
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

  const {
    data: topicStatuses,
    loading,
    error,
    reload: reloadTopicStatuses,
  } = useAsyncData(
    () => Promise.all(PHASE6_TOPIC_IDS.map((topicId) => topicStatus(notesRepo, caseRecord.caseId, topicId, currentFingerprint))),
    [notesRepo, caseRecord.caseId, currentFingerprint],
  );

  if (selectedTopicId) {
    return (
      <TopicWorkspace
        caseRecord={caseRecord}
        chart={chart}
        currentFingerprint={currentFingerprint}
        topicId={selectedTopicId}
        notesRepo={notesRepo}
        onBack={() => {
          setSelectedTopicId(null);
          reloadTopicStatuses();
        }}
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

      {loading && <p className="reception-note">Loading topic progress…｜加载主题进度中…</p>}
      {error && <div className="error-box">{error.message}</div>}

      {!loading && !error && (
        <div className="ws-topic-grid">
          {PHASE6_TOPIC_IDS.map((topicId, i) => {
            const status = topicStatuses[i];
            return (
              <button key={topicId} type="button" className={`ws-topic-card ${status.hasNotes ? "ws-topic-card-started" : ""}`} onClick={() => setSelectedTopicId(topicId)}>
                <span className="ws-topic-card-label">{TOPIC_LABELS[topicId]}</span>
                <span className="ws-topic-card-status">{status.text}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
