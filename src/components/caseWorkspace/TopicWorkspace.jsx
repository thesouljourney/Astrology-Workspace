import { useMemo, useState } from "react";
import { SystemEvidencePanel } from "./SystemEvidencePanel.jsx";
import { NotesAndJudgmentSection } from "./NotesAndJudgmentSection.jsx";

const SYSTEM_LABEL = {
  modernWestern: "Modern Western｜现代西洋占星",
  classical: "Classical｜古典占星",
  vedic: "Vedic｜印度占星",
};

/**
 * Generic workspace for ONE (Case, Phase 6 Topic) pair. Renders exactly
 * the evidence `chart.topicRetrieval` already resolved for this topic -
 * this file contains no astrology recipe of its own (brief Part 0/3).
 */
export function TopicWorkspace({ caseRecord, chart, currentFingerprint, topicId, notesRepo, onBack }) {
  const { caseId } = caseRecord;
  const topic = useMemo(() => chart.topicRetrieval.topics.find((t) => t.id === topicId), [chart, topicId]);

  const [refreshTick, setRefreshTick] = useState(0);
  const [viewingFingerprint, setViewingFingerprint] = useState(null); // null = viewing the live current fingerprint
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  const refresh = () => setRefreshTick((t) => t + 1);

  const activeFingerprint = viewingFingerprint ?? currentFingerprint;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const versions = useMemo(() => notesRepo.listVersions({ caseId, topicId, chartFingerprint: activeFingerprint }), [caseId, topicId, activeFingerprint, refreshTick]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const historicalFingerprints = useMemo(() => notesRepo.listFingerprints({ caseId, topicId }).filter((f) => f.chartFingerprint !== currentFingerprint), [caseId, topicId, currentFingerprint, refreshTick]);

  const currentVersionForFingerprint = versions.length > 0 ? versions[versions.length - 1] : null;
  const selectedVersion = versions.find((v) => v.noteId === selectedNoteId) ?? currentVersionForFingerprint;

  const showEarlierChartBanner = !viewingFingerprint && !currentVersionForFingerprint && historicalFingerprints.length > 0;

  function selectVersion(noteId) {
    setSelectedNoteId(noteId);
  }

  function viewHistorical(fingerprint) {
    setViewingFingerprint(fingerprint || null);
    setSelectedNoteId(null);
  }

  return (
    <div className="topic-workspace">
      <button type="button" className="ws-btn ws-back-btn" onClick={onBack}>
        ← Back to Case Overview｜返回案例总览
      </button>

      <header className="ws-topic-header">
        <h3>
          {topic.label.en}｜{topic.label.zh}
        </h3>
        <p className="reception-note">
          {topic.definition.en}｜{topic.definition.zh}
        </p>
      </header>

      {showEarlierChartBanner && (
        <div className="ws-banner">
          <p>This interpretation was written for an earlier chart version｜此解读是针对较早的图版本撰写的</p>
          <label htmlFor="ws-historical-select">View Previous Notes｜查看历史笔记</label>
          <select id="ws-historical-select" defaultValue="" onChange={(e) => viewHistorical(e.target.value)}>
            <option value="" disabled>
              Select a previous chart version｜选择一个历史图版本
            </option>
            {historicalFingerprints.map((f) => (
              <option key={f.chartFingerprint} value={f.chartFingerprint}>
                {f.chartFingerprint} — {f.lastUpdatedAt || "—"}
              </option>
            ))}
          </select>
        </div>
      )}

      {viewingFingerprint && (
        <div className="ws-banner ws-banner-neutral">
          <span>Viewing historical chart version {viewingFingerprint}｜正在查看历史图版本 {viewingFingerprint}</span>
          <button type="button" className="ws-btn" onClick={() => viewHistorical(null)}>
            Back to Current｜返回当前版本
          </button>
        </div>
      )}

      <div className="ws-systems-grid">
        {["modernWestern", "classical", "vedic"].map((systemKey) => (
          <SystemEvidencePanel key={systemKey} systemLabel={SYSTEM_LABEL[systemKey]} bundle={topic.systems[systemKey]} />
        ))}
      </div>

      <NotesAndJudgmentSection
        key={selectedVersion?.noteId ?? "no-version"}
        caseId={caseId}
        topicId={topicId}
        chartFingerprint={activeFingerprint}
        notesRepo={notesRepo}
        version={selectedVersion}
        versions={versions}
        onSelectVersion={selectVersion}
        onRefresh={refresh}
        forceReadOnly={!!viewingFingerprint}
      />
    </div>
  );
}
