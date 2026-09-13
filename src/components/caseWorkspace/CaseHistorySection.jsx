import { useAsyncData } from "./useAsyncData.js";
import { PHASE6_TOPIC_IDS } from "../../caseWorkspace/noteModel.js";
import { TOPIC_LABELS } from "./topicLabels.js";

async function aggregateFingerprintHistory(notesRepo, caseId) {
  const perTopic = await Promise.all(PHASE6_TOPIC_IDS.map(async (topicId) => ({ topicId, fingerprints: await notesRepo.listFingerprints({ caseId, topicId }) })));
  const byFingerprint = {};
  for (const { topicId, fingerprints } of perTopic) {
    for (const f of fingerprints) {
      const bucket = (byFingerprint[f.chartFingerprint] ??= { chartFingerprint: f.chartFingerprint, lastUpdatedAt: "", topicIds: [] });
      bucket.topicIds.push(topicId);
      if (f.lastUpdatedAt > bucket.lastUpdatedAt) bucket.lastUpdatedAt = f.lastUpdatedAt;
    }
  }
  return Object.values(byFingerprint).sort((a, b) => (a.lastUpdatedAt < b.lastUpdatedAt ? 1 : -1));
}

/**
 * History — Production UX Refactor, Part 5. A read-only, aggregated view
 * of every chart version (`chartFingerprint`) this Case has ever had
 * notes under, across all 8 Topics — a presentation-only lens on Phase
 * 7's already-locked `notesRepository.listFingerprints()`; it never
 * introduces a second history/versioning mechanism.
 */
export function CaseHistorySection({ caseId, currentFingerprint, notesRepo }) {
  const { data: entries, loading, error } = useAsyncData(() => aggregateFingerprintHistory(notesRepo, caseId), [notesRepo, caseId]);

  if (loading) return <p className="reception-note">Loading History…｜加载历史记录中…</p>;
  if (error) return <div className="error-box">{error.message}</div>;

  return (
    <div className="case-history-section">
      <h3>History｜历史记录</h3>
      <p className="reception-note">
        Every chart version this Case has ever had notes under. Editing birth data creates a new chart version but
        never deletes the notes written under an earlier one｜本案例曾经拥有笔记的每一个图版本。修改出生资料会产生新的图版本，但绝不会删除较早版本下的笔记
      </p>

      {(!entries || entries.length === 0) && <p className="reception-note">No notes have been written yet｜尚未撰写任何笔记</p>}

      {entries && entries.length > 0 && (
        <ul className="case-history-list">
          {entries.map((entry) => (
            <li key={entry.chartFingerprint} className="case-history-item">
              <div className="case-history-item-head">
                <span className={entry.chartFingerprint === currentFingerprint ? "ws-status-badge ws-status-draft" : "ws-status-badge"}>
                  {entry.chartFingerprint === currentFingerprint ? "Current｜当前" : "Historical｜历史"}
                </span>
                <span className="reception-note">{entry.chartFingerprint}</span>
                <span className="reception-note">Last updated｜最后更新: {entry.lastUpdatedAt || "—"}</span>
              </div>
              <div className="case-history-item-topics">
                {entry.topicIds.map((topicId) => (
                  <span key={topicId} className="case-history-topic-chip">
                    {TOPIC_LABELS[topicId]}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
