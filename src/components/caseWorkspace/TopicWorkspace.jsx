import { useMemo, useState } from "react";
import { SystemEvidencePanel } from "./SystemEvidencePanel.jsx";
import { NotesAndJudgmentSection } from "./NotesAndJudgmentSection.jsx";
import { useAsyncData } from "./useAsyncData.js";

const SYSTEM_LABEL = {
  modernWestern: "Modern Western｜现代西洋占星",
  classical: "Classical｜古典占星",
  vedic: "Vedic｜印度占星",
};

/**
 * Generic workspace for ONE (Case, Phase 6 Topic) pair. Renders exactly
 * the evidence `chart.topicRetrieval` already resolved for this topic -
 * this file contains no astrology recipe of its own (brief Part 0/3).
 *
 * `notesRepository.listVersions`/`listFingerprints` are Promise-
 * returning (Phase 7 pre-lock audit fix), so both are loaded via
 * `useAsyncData` (with stale-result protection) instead of a
 * synchronous `useMemo` read.
 */
export function TopicWorkspace({ caseRecord, chart, currentFingerprint, topicId, notesRepo, onBack }) {
  const { caseId } = caseRecord;
  const topic = useMemo(() => chart.topicRetrieval.topics.find((t) => t.id === topicId), [chart, topicId]);

  const [viewingFingerprint, setViewingFingerprint] = useState(null); // null = viewing the live current fingerprint
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  const activeFingerprint = viewingFingerprint ?? currentFingerprint;

  const {
    data: versions,
    loading: versionsLoading,
    error: versionsError,
    reload: reloadVersions,
  } = useAsyncData(() => notesRepo.listVersions({ caseId, topicId, chartFingerprint: activeFingerprint }), [notesRepo, caseId, topicId, activeFingerprint]);

  const {
    data: historicalFingerprints,
    loading: historicalLoading,
    reload: reloadHistorical,
  } = useAsyncData(
    () => notesRepo.listFingerprints({ caseId, topicId }).then((all) => all.filter((f) => f.chartFingerprint !== currentFingerprint)),
    [notesRepo, caseId, topicId, currentFingerprint],
  );

  function refresh() {
    reloadVersions();
    reloadHistorical();
  }

  const currentVersionForFingerprint = versions && versions.length > 0 ? versions[versions.length - 1] : null;
  const selectedVersion = (versions ?? []).find((v) => v.noteId === selectedNoteId) ?? currentVersionForFingerprint;

  const showEarlierChartBanner = !versionsLoading && !historicalLoading && !viewingFingerprint && !currentVersionForFingerprint && (historicalFingerprints?.length ?? 0) > 0;

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
          <span>
            Viewing historical chart version {viewingFingerprint}｜正在查看历史图版本 {viewingFingerprint}
          </span>
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

      {versionsLoading && <p className="reception-note">Loading notes…｜加载笔记中…</p>}
      {versionsError && <div className="error-box">{versionsError.message}</div>}

      {!versionsLoading && !versionsError && (
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
      )}
    </div>
  );
}
