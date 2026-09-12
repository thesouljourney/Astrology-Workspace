/**
 * Topic Retrieval Framework — Phase 6.
 *
 * PURPOSE (never violated): Topic -> system-specific evidence recipe ->
 * resolve EXISTING evidence -> technical evidence bundle -> manual
 * interpretation by the user. This module is a retrieval/mapping layer
 * only:
 *
 *   - NO new planetary position, house, aspect, dignity, or rulership
 *     calculation (every value comes from `chart.points`/`chart.planets`/
 *     `chart.houseCusps`/`chart.classical`/`chart.vedic`, already locked
 *     by Phases 1-5).
 *   - NO Western aspect layer, no Vedic Drishti, no Vargas, no Dasha, no
 *     Yoga detection, no Shadbala, no Ashtakavarga, no new Horary
 *     mechanics - every one of those a recipe needs is recorded as
 *     `future_required` (see `recipes.js`) rather than implemented here.
 *   - NO interpretation, prediction, advice, or good/bad judgment.
 *   - NO cross-system scoring or agreement/contradiction judgment (Phase
 *     5's own boundary is preserved unchanged).
 *
 * See `recipes.js` for the eight static Topic Recipes (pure data) and
 * `resolveItem.js`/`helpers.js` for how one descriptor becomes one
 * resolved `EvidenceItem` against a real chart - this file only
 * orchestrates: walk every recipe's every system's every bucket, resolve
 * each descriptor, and assemble the result. The returned value is a
 * `structuredClone()` of that result, matching Phase 4F/5's own
 * established mutation-isolation pattern - mutating
 * `chart.topicRetrieval` afterward can never corrupt any locked Phase
 * 1-5 source structure.
 */

import { TOPIC_RECIPES } from "./recipes.js";
import { resolveEvidenceItem } from "./resolveItem.js";

export const TOPIC_RETRIEVAL_VERSION = "phase_6_v1";
export const TOPIC_RETRIEVAL_TYPE = "topic_based_technical_evidence_retrieval";
export const TOPIC_RETRIEVAL_INTERPRETATION = "none";
export const CROSS_SYSTEM_SYNTHESIS = "none";
export const TOPIC_RETRIEVAL_SCORING = "none";

const BUCKET_KEYS = ["primary", "secondary", "contextual", "futureRequired", "excluded", "conventionPending"];

function resolveBucket(descriptors, chart) {
  return (descriptors ?? []).map((d) => resolveEvidenceItem(d, chart));
}

function resolveSystemBundle(systemRecipe, chart) {
  const bundle = {};
  for (const bucket of BUCKET_KEYS) {
    bundle[bucket] = resolveBucket(systemRecipe[bucket], chart);
  }
  bundle.conventions = { ...(systemRecipe.conventions ?? {}) };
  if (systemRecipe.conceptStatus) bundle.conceptStatus = systemRecipe.conceptStatus;
  if (systemRecipe.subdomains) bundle.subdomains = { ...systemRecipe.subdomains };
  return bundle;
}

function resolveTopic(recipe, chart) {
  return {
    id: recipe.id,
    label: recipe.label,
    definition: recipe.definition,
    version: recipe.version,
    systems: {
      modernWestern: resolveSystemBundle(recipe.systems.modernWestern, chart),
      classical: resolveSystemBundle(recipe.systems.classical, chart),
      vedic: resolveSystemBundle(recipe.systems.vedic, chart),
    },
  };
}

/**
 * Builds the Phase 6 `chart.topicRetrieval` structure from an already-
 * fully-built chart (Phase 1/2A + Phase 3A-3H `chart.classical` + Phase
 * 4A-4F `chart.vedic` + Phase 5 `chart.crossSystem` already attached).
 * Pure retrieval/mapping - no new astronomical or astrological
 * calculation, no mutation of any input.
 *
 * @param {object} params
 * @param {object} params.chart the fully-built chart
 * @returns {object} `chart.topicRetrieval` (deep-cloned, mutation-isolated from every input)
 */
export function buildTopicRetrieval({ chart }) {
  const topics = TOPIC_RECIPES.map((recipe) => resolveTopic(recipe, chart));

  const result = {
    meta: {
      topicRetrievalVersion: TOPIC_RETRIEVAL_VERSION,
      topicRetrievalType: TOPIC_RETRIEVAL_TYPE,
      topicRetrievalInterpretation: TOPIC_RETRIEVAL_INTERPRETATION,
      crossSystemSynthesis: CROSS_SYSTEM_SYNTHESIS,
      scoring: TOPIC_RETRIEVAL_SCORING,
      topicIds: topics.map((t) => t.id),
    },
    topics,
  };

  return structuredClone(result);
}

export { TOPIC_RECIPES };
