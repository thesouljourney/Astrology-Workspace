import { useEffect, useMemo, useState } from "react";
import { computeCaseChart } from "../../caseWorkspace/caseChart.js";
import { computeChartFingerprint } from "../../caseWorkspace/fingerprint.js";
import { PHASE6_TOPIC_IDS } from "../../caseWorkspace/noteModel.js";
import { TopicWorkspace } from "./TopicWorkspace.jsx";

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

function topicStatusLabel(notesRepo, caseId, topicId, currentFingerprint) {
  const current = notesRepo.getCurrentVersion({ caseId, topicId, chartFingerprint: currentFingerprint });
  if (current) return { text: `v${current.versionNumber} — ${current.status}`, hasNotes: true };
  const historical = notesRepo.listFingerprints({ caseId, topicId }).filter((f) => f.chartFingerprint !== currentFingerprint);
  if (historical.length > 0) return { text: "Earlier chart version has notes｜有历史图版本笔记", hasNotes: true };
  return { text: "Never Started｜未开始", hasNotes: false };
}

/** One Case's birth-data summary + 8-topic progress grid, and hosts the currently-open TopicWorkspace (if any). */
export function CaseOverview({ caseRecord, caseRepo, notesRepo, onBack }) {
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const chart = useMemo(() => computeCaseChart(caseRecord), [caseRecord.caseId]); // eslint-disable-line react-hooks/exhaustive-deps
  const currentFingerprint = useMemo(() => computeChartFingerprint(caseRecord.birthData, chart), [chart, caseRecord.birthData]);

  useEffect(() => {
    if (caseRecord.chartFingerprint !== currentFingerprint) {
      caseRepo.update(caseRecord.caseId, { chartFingerprint: currentFingerprint });
    }
    // Fingerprint sync only - never mutates birthData/calculationProfile/notes.
  }, [caseRecord.caseId, caseRecord.chartFingerprint, currentFingerprint, caseRepo]);

  if (selectedTopicId) {
    return (
      <TopicWorkspace
        key={`${selectedTopicId}-${refreshTick}`}
        caseRecord={caseRecord}
        chart={chart}
        currentFingerprint={currentFingerprint}
        topicId={selectedTopicId}
        notesRepo={notesRepo}
        onBack={() => {
          setSelectedTopicId(null);
          setRefreshTick((t) => t + 1);
        }}
      />
    );
  }

  const { birthData } = caseRecord;

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
      </header>

      <div className="ws-topic-grid">
        {PHASE6_TOPIC_IDS.map((topicId) => {
          const status = topicStatusLabel(notesRepo, caseRecord.caseId, topicId, currentFingerprint);
          return (
            <button key={topicId} type="button" className={`ws-topic-card ${status.hasNotes ? "ws-topic-card-started" : ""}`} onClick={() => setSelectedTopicId(topicId)}>
              <span className="ws-topic-card-label">{TOPIC_LABELS[topicId]}</span>
              <span className="ws-topic-card-status">{status.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
