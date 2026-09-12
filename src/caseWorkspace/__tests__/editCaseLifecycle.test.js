import { describe, it, expect, beforeEach } from "vitest";
import { createMemoryStorage } from "../storage/memoryStorage.js";
import { createLocalCaseRepository } from "../storage/localCaseRepository.js";
import { createLocalNotesRepository } from "../storage/localNotesRepository.js";
import { computeCaseChart } from "../caseChart.js";
import { deriveCalculationProfile, computeChartFingerprint } from "../fingerprint.js";
import { NOTE_STATUS } from "../noteModel.js";

/**
 * Simulates exactly what `EditCaseForm.jsx`'s handleSubmit does
 * (compute chart -> derive profile -> compute fingerprint -> update the
 * SAME caseId), without rendering React - the project has no React
 * component-testing infrastructure, so this integration test proves
 * the underlying Edit Case data-flow directly, which is what the UI
 * component calls verbatim.
 */
async function editCase(caseRepo, caseId, newBirthDataFields) {
  const original = await caseRepo.get(caseId);
  const birthData = { ...original.birthData, ...newBirthDataFields };
  const chart = computeCaseChart({ birthData, calculationProfile: original.calculationProfile });
  const calculationProfile = deriveCalculationProfile(chart);
  const chartFingerprint = computeChartFingerprint(birthData, chart);
  return caseRepo.update(caseId, { birthData, calculationProfile, chartFingerprint });
}

const initialBirthData = { date: "1994-11-21", time: "01:44:00", placeName: "Batu Pahat, Johor, Malaysia", latitude: 1.8548, longitude: 102.9325, timezone: "+08:00" };
const calculationProfileInput = { westernHouseSystem: "placidus", westernNodeType: "true", westernLilithType: "mean" };

let caseRepo;
let notesRepo;
let caseId;
let originalFingerprint;

beforeEach(async () => {
  caseRepo = createLocalCaseRepository(createMemoryStorage());
  notesRepo = createLocalNotesRepository(createMemoryStorage());

  const chart = computeCaseChart({ birthData: initialBirthData, calculationProfile: calculationProfileInput });
  const calculationProfile = deriveCalculationProfile(chart);
  originalFingerprint = computeChartFingerprint(initialBirthData, chart);
  const created = await caseRepo.create({ caseName: "Edit Case Subject", birthData: initialBirthData, calculationProfile, chartFingerprint: originalFingerprint });
  caseId = created.caseId;
});

describe("Phase 7 pre-lock audit fix: Edit Case lifecycle", () => {
  it("same caseId survives a birth-data correction", async () => {
    const updated = await editCase(caseRepo, caseId, { time: "02:15:00" });
    expect(updated.caseId).toBe(caseId);
  });

  it("birth time correction changes chartFingerprint", async () => {
    const updated = await editCase(caseRepo, caseId, { time: "02:15:00" });
    expect(updated.chartFingerprint).not.toBe(originalFingerprint);
  });

  it("coordinate correction changes chartFingerprint", async () => {
    const updated = await editCase(caseRepo, caseId, { latitude: 10, longitude: 20 });
    expect(updated.chartFingerprint).not.toBe(originalFingerprint);
  });

  it("placeName-only edit does NOT change chartFingerprint", async () => {
    const updated = await editCase(caseRepo, caseId, { placeName: "A completely different label" });
    expect(updated.chartFingerprint).toBe(originalFingerprint);
    expect(updated.birthData.placeName).toBe("A completely different label"); // but the label itself IS saved
  });

  it("old notes survive a birth-data correction (old fingerprint's notes remain readable)", async () => {
    const oldVersion = await notesRepo.createVersion({ caseId, topicId: "career", chartFingerprint: originalFingerprint });
    await notesRepo.saveDraft({ caseId, topicId: "career", chartFingerprint: originalFingerprint, noteId: oldVersion.noteId, patch: { westernNotes: "pre-correction note" } });

    await editCase(caseRepo, caseId, { time: "02:15:00" });

    const stillThere = await notesRepo.getCurrentVersion({ caseId, topicId: "career", chartFingerprint: originalFingerprint });
    expect(stillThere.westernNotes).toBe("pre-correction note");
  });

  it("old Final interpretation survives a birth-data correction unchanged", async () => {
    const oldVersion = await notesRepo.createVersion({ caseId, topicId: "career", chartFingerprint: originalFingerprint });
    await notesRepo.saveDraft({ caseId, topicId: "career", chartFingerprint: originalFingerprint, noteId: oldVersion.noteId, patch: { finalInterpretation: "my final read" } });
    await notesRepo.markFinal({ caseId, topicId: "career", chartFingerprint: originalFingerprint, noteId: oldVersion.noteId });

    await editCase(caseRepo, caseId, { latitude: 10, longitude: 20 });

    const stillFinal = await notesRepo.getCurrentVersion({ caseId, topicId: "career", chartFingerprint: originalFingerprint });
    expect(stillFinal.status).toBe(NOTE_STATUS.FINAL);
    expect(stillFinal.finalInterpretation).toBe("my final read");
  });

  it("a new note version under the new fingerprint starts entirely blank - no evidenceReliedOn or other field copied", async () => {
    const oldVersion = await notesRepo.createVersion({ caseId, topicId: "career", chartFingerprint: originalFingerprint });
    await notesRepo.saveDraft({
      caseId,
      topicId: "career",
      chartFingerprint: originalFingerprint,
      noteId: oldVersion.noteId,
      patch: {
        westernNotes: "w",
        classicalNotes: "c",
        vedicNotes: "v",
        convergenceNotes: "conv",
        differencesNotes: "diff",
        uncertainNotes: "unc",
        finalInterpretation: "final",
        evidenceReliedOn: ["core_rulers", "domain_architecture"],
      },
    });

    const updated = await editCase(caseRepo, caseId, { time: "02:15:00" });
    const newVersion = await notesRepo.createVersion({ caseId, topicId: "career", chartFingerprint: updated.chartFingerprint });

    expect(newVersion.westernNotes).toBe("");
    expect(newVersion.classicalNotes).toBe("");
    expect(newVersion.vedicNotes).toBe("");
    expect(newVersion.convergenceNotes).toBe("");
    expect(newVersion.differencesNotes).toBe("");
    expect(newVersion.uncertainNotes).toBe("");
    expect(newVersion.finalInterpretation).toBe("");
    expect(newVersion.evidenceReliedOn).toEqual([]);
  });

  it("the historical fingerprint remains listed and readable after the Case moves to a new fingerprint", async () => {
    await notesRepo.createVersion({ caseId, topicId: "career", chartFingerprint: originalFingerprint });
    const updated = await editCase(caseRepo, caseId, { time: "02:15:00" });
    await notesRepo.createVersion({ caseId, topicId: "career", chartFingerprint: updated.chartFingerprint });

    const fingerprints = (await notesRepo.listFingerprints({ caseId, topicId: "career" })).map((f) => f.chartFingerprint);
    expect(fingerprints).toContain(originalFingerprint);
    expect(fingerprints).toContain(updated.chartFingerprint);
  });

  it("the current chart after editing recomputes through the existing locked calculateChart pipeline (topicRetrieval present, all 8 topics)", async () => {
    const updated = await editCase(caseRepo, caseId, { time: "02:15:00" });
    const chart = computeCaseChart({ birthData: updated.birthData, calculationProfile: updated.calculationProfile });
    expect(chart.topicRetrieval.topics).toHaveLength(8);
    expect(chart.classical).toBeTruthy();
    expect(chart.vedic).toBeTruthy();
  });
});
