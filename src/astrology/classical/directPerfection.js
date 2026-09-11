/**
 * Direct Perfection & Future Motion Validation — Phase 3G-A.
 *
 * CORE QUESTION: Phase 3F answers "are these two planets applying right
 * now?" (a snapshot judgment from a tiny forward probe). This module
 * answers a DIFFERENT question: "does that applying aspect actually
 * reach exact geometric contact in the future, before something (a
 * station/retrogradation) prevents it?" This requires genuinely
 * recalculating REAL future planetary positions — the Phase 3F 0.01-day
 * probe is explicitly NOT sufficient for this (it only captures the
 * instantaneous local trend, not acceleration, station, or
 * retrogradation over the days/weeks a real aspect takes to perfect).
 *
 * FUTURE POSITIONS: recalculated via astronomy-engine, reusing
 * `computeLongitudeAndSpeed()` from `../planets.js` verbatim (the exact
 * same method Phase 1 uses) — no competing longitude calculation, no
 * new production dependency, no network access.
 *
 * ARCHITECTURE (for testability without depending on real ephemeris
 * cooperating with every test scenario): the numerically pure event
 * scanner (`scanForAspectEvents`) operates on injectable position
 * functions of a plain "days since start" number, so unit tests can
 * supply synthetic motion (including engineered stations, retrogrades,
 * and sign ingresses) deterministically. The production adapter
 * (`computeDirectPerfection`) plugs real astronomy-engine positions into
 * that same scanner for the actual chart.
 *
 * SCOPE — only DIRECT perfection of the SAME aspect Phase 3F already
 * found "applying": this module never re-selects a different, later,
 * geometrically-closer aspect. It does not implement Translation of
 * Light, Collection of Light, Prohibition, Frustration, Abscission,
 * Interference, Void of Course, or any final horary yes/no judgment —
 * those are explicitly deferred to a later phase (Phase 3G-B).
 * "perfects" here means ONLY that the two planets geometrically reach
 * the exact currently-applying classical aspect under the conventions
 * below — never an interpretive claim about outcome.
 *
 * ====================================================================
 * SIGN-INGRESS CONVENTION — a genuine sourced disagreement, resolved by
 * explicit decision, not silently:
 * ====================================================================
 * Research (Skyscript forum threads on "Moon's last aspect" and
 * "changing signs before conjunction") found reputable traditional
 * authors materially disagree on whether a sign change by either
 * applying planet, before exact contact, prevents perfection:
 *   - Ivy Goldstein-Jacobson: the aspect must perfect before the sign
 *     changes, or it does not count.
 *   - March-McEvers: sign change does not matter; perfection across the
 *     boundary still counts.
 *   - Lilly's own position (per Skyscript's summary): application is
 *     counted as formed within the original sign, but perfection itself
 *     can still occur after the planet has left that sign — with a
 *     separately-named exception ("evasion") specifically when the
 *     SLOWER planet leaves its sign before the faster one catches up,
 *     which is judged negatively regardless of eventual numeric
 *     conjunction.
 * This was reported to the project owner rather than resolved
 * unilaterally; the owner chose to DEFER rather than pick a side:
 * when a sign ingress is detected before the geometric exactitude
 * timestamp, this module reports the raw ingress event AND whether
 * exactitude was geometrically found, but sets `status` to
 * `"requires_historical_rule"` rather than asserting perfects/
 * does_not_perfect. See `chart.classical.meta.signIngressConvention`.
 *
 * ====================================================================
 * REFRANATION — cross-checked against Astrodienst's Astrowiki,
 * astrologysoftware.com's dictionary, and a third independent summary
 * (all consistent with each other, no material disagreement found):
 * ====================================================================
 * Refranation occurs when an applying significator turns RETROGRADE
 * before the aspect perfects, and — as a DIRECT, LOCAL consequence of
 * that reversal — the application withdraws (the distance to the
 * targeted exact aspect starts increasing instead of decreasing). All
 * three sources describe the triggering direction the same way
 * ("turns retrograde," never the reverse); no source describes a
 * retrograde-to-direct station as refranation, so that direction is not
 * treated as historically qualifying here — though the raw station
 * detector below records BOTH transition directions with the same
 * local before/after evidence, so a future phase could revisit this
 * without new instrumentation if a source were found to disagree.
 *
 * REVISED DEFINITION (this is a technical, LOCAL judgment about the
 * moment of reversal, evaluated independently of whether the module's
 * search later finds a crossing — the 180-day search horizon is a
 * software safety limit and must never be part of the definition):
 *   1. the pair is applying;
 *   2. before exactitude, a relevant planet stations from direct to
 *      retrograde;
 *   3. sampled just before and just after that station, the orb-from-
 *      exact of the CURRENTLY-TARGETED aspect increases rather than
 *      continuing to decrease (`applicationReversedAway`).
 * When all three hold, `refranation.occurs: true`, citing the specific
 * station's evidence (`orbBeforeReversal`/`orbAfterReversal`). This
 * event is NEVER erased or overwritten later in the same search: per
 * the project brief, if the pair's original application refrains and
 * then, much later, a fresh application forms (e.g. after the planet
 * returns to direct motion and a new approach develops), that is a
 * SEPARATE future event — this module does not attempt to fully
 * classify it, and `chart.classical.directPerfection[i].status` may
 * still read "perfects" (describing that later, distinct crossing)
 * alongside a populated `refranation` object describing the earlier,
 * interrupted one. A planet that starts the search already retrograde
 * and simply continues toward exactitude is not refranation (no
 * station event occurs at all in that case) — see TEST "generic
 * retrograde != automatically refranation". Per all three sources, a
 * station that occurs AFTER the aspect has already perfected can never
 * retroactively undo that perfection.
 *
 * NO SCORE, no Translation/Collection/Prohibition/Frustration/Void of
 * Course/final horary outcome anywhere in this module.
 */

import { normalizeDegrees } from "../zodiac.js";
import { PLANET_BODIES, computeLongitudeAndSpeed } from "../planets.js";
import { EXACT_EPSILON_DEGREES } from "./aspects.js";

/**
 * Software safety limit on how far into the future this module will
 * search for direct perfection — an ENGINEERING choice, not a
 * historical astrological doctrine (stored separately from historical
 * conventions in metadata for exactly this reason). 180 days is
 * generous enough to resolve even a slow Jupiter/Saturn-type applying
 * aspect through a full retrograde station and return to direct motion
 * (a typical outer-planet synodic retrograde loop runs roughly
 * 100-150 days) while remaining a bounded, practical limit rather than
 * an open-ended search.
 */
export const DIRECT_PERFECTION_SEARCH_HORIZON_DAYS = 180;

/**
 * Coarse forward-scan step size, in days. Chosen conservatively against
 * the fastest realistic relative motion between any two of the seven
 * traditional planets (the Moon, at up to ~13-15 deg/day) — a 0.25 day
 * (6 hour) step moves the Moon at most ~3.75 deg, comfortably resolving
 * every pair's Lilly moiety orb (the smallest of which, Mercury-Mars,
 * is 7.25 deg) without risking a skipped sign-flip bracket.
 */
export const COARSE_STEP_DAYS = 0.25;

/**
 * Root-finding tolerance for the aspect-exactitude search, in degrees.
 * Reused directly from Phase 3F's EXACT_EPSILON_DEGREES (~1 arcsecond)
 * for consistency — this is NOT the same thing as the Lilly aspect orb
 * (Phase 3F, degrees-wide, decides whether an aspect exists at all) nor
 * the same thing as timestamp precision (a DERIVED quantity: given this
 * angular tolerance and the local relative angular speed, the resulting
 * time resolution is typically sub-minute — it is not a separately
 * chosen absolute time value).
 */
export const DIRECT_PERFECTION_ROOT_TOLERANCE_DEGREES = EXACT_EPSILON_DEGREES;

/**
 * The selected historical refranation convention — a direct->retrograde
 * station whose local before/after evidence shows the application
 * withdrawing. Deliberately does NOT mention the search horizon: that is
 * an unrelated software safety limit, never part of this definition.
 */
export const REFRANATION_CONVENTION = "direct_to_retrograde_application_reversal";

/** Generous safety cap on bisection iterations for the main aspect root — far more than the ~15-20 needed in practice. */
const MAX_ROOT_ITERATIONS = 60;

/** Fixed iteration count for ingress/station sub-event refinement — sub-minute precision, deterministic. */
const EVENT_REFINE_ITERATIONS = 30;

/**
 * Local window (days) used to sample the orb-from-exact just before and
 * just after a detected station, to determine whether the application
 * genuinely reversed away (refranation's defining local evidence — see
 * module doc comment) rather than merely slowing down. Small relative to
 * how long a classical aspect takes to perfect (days to weeks), but large
 * enough that even a slow outer-planet pair's orb change is clearly
 * resolvable above numerical noise.
 */
const LOCAL_TREND_WINDOW_DAYS = 1;

const SIGN_KEYS = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];

function normalizeSigned180(deg) {
  let d = normalizeDegrees(deg);
  if (d > 180) d -= 360;
  return d;
}

/** Signed angular error of (lonB - lonA) from `targetAngle`, in (-180, 180]. Continuous except at the point exactly opposite the target — far from any realistic search window here. */
export function signedErrorToTarget(lonA, lonB, targetAngle) {
  const rawDiff = normalizeDegrees(lonB - lonA);
  return normalizeSigned180(rawDiff - targetAngle);
}

/**
 * Every classical aspect except conjunction (0) and opposition (180) has
 * TWO raw-longitude-difference representations that are equally "that
 * aspect" — e.g. a trine (120) shows up as (lonB - lonA) === 120 OR
 * === 240 (= 360 - 120), depending on which planet is "ahead." Phase
 * 3F's `angularSeparation` is direction-agnostic (always the shortest
 * of the two), so to keep this module's signed search consistent with
 * Phase 3F's already-computed reality, the EFFECTIVE numeric target
 * used internally is resolved ONCE, at the start of the search, to
 * whichever of {exactAngle, 360-exactAngle} the pair is actually
 * closest to right now — then held fixed for the entire search (never
 * re-resolved), so the search always locks onto the same physical
 * configuration Phase 3F identified as "applying."
 * @returns {number} the effective target angle (in [0, 360)) to pass to signedErrorToTarget for the rest of this search
 */
export function resolveEffectiveTargetAngle(lonA, lonB, exactAngle) {
  const rawDiff = normalizeDegrees(lonB - lonA);
  const mirror = normalizeDegrees(360 - exactAngle);
  const distToExact = Math.abs(normalizeSigned180(rawDiff - exactAngle));
  const distToMirror = Math.abs(normalizeSigned180(rawDiff - mirror));
  return distToExact <= distToMirror ? exactAngle : mirror;
}

function signIndexOf(lon) {
  return Math.floor(normalizeDegrees(lon) / 30);
}

/**
 * Deterministic bisection root-finder for a scalar function of time
 * (plain days-since-start numbers). Assumes f(t1) and f(t2) have
 * opposite signs. Stops when |f(mid)| <= toleranceAbs (if provided) or
 * after maxIterations halvings, whichever comes first.
 */
function bisect(f, t1, f1, t2, f2, { maxIterations, toleranceAbs }) {
  let lo = t1;
  let hi = t2;
  let flo = f1;
  let mid = (lo + hi) / 2;
  let fmid = f2;
  for (let i = 0; i < maxIterations; i++) {
    mid = (lo + hi) / 2;
    fmid = f(mid);
    if (toleranceAbs !== undefined && Math.abs(fmid) <= toleranceAbs) {
      return { t: mid, value: fmid, iterations: i + 1 };
    }
    if (Math.sign(fmid) === Math.sign(flo) || Math.sign(fmid) === 0) {
      lo = mid;
      flo = fmid;
    } else {
      hi = mid;
    }
  }
  return { t: mid, value: fmid, iterations: maxIterations };
}

/**
 * Pure, injectable-position event scanner — the testable core. Operates
 * entirely on abstract "days since start" numbers; the production
 * adapter (computeDirectPerfection) supplies real astronomy-engine
 * positions, while tests can supply synthetic ones.
 *
 * @param {object} params
 * @param {(tDays:number)=>{longitude:number, speedDegPerDay:number}} params.getStateA
 * @param {(tDays:number)=>{longitude:number, speedDegPerDay:number}} params.getStateB
 * @param {number} params.exactAngle 0|60|90|120|180
 * @param {number} params.horizonDays
 * @param {number} params.coarseStepDays
 * @returns {object} raw scan result (tDays-based), see inline shape
 */
export function scanForAspectEvents({ getStateA, getStateB, exactAngle, horizonDays, coarseStepDays }) {
  const getStateForRole = (role, t) => (role === "planetA" ? getStateA(t) : getStateB(t));

  const state0A = getStateA(0);
  const state0B = getStateB(0);
  const startingOrb = Math.abs(signedErrorToTarget(state0A.longitude, state0B.longitude, exactAngle));

  const errorAt = (t) => {
    const a = getStateA(t);
    const b = getStateB(t);
    return signedErrorToTarget(a.longitude, b.longitude, exactAngle);
  };

  const ingressEvents = []; // {role, fromIndex, toIndex, tDays}
  const stationEvents = []; // {role, fromMotion, toMotion, tDays}

  let prevT = 0;
  let prevA = state0A;
  let prevB = state0B;
  let prevErr = signedErrorToTarget(state0A.longitude, state0B.longitude, exactAngle);
  let prevAbs = Math.abs(prevErr);
  let minAbsSeen = prevAbs;
  let turnedAwayAtDays = null;

  let exactitudeFound = false;
  let exactTDays = null;
  let exactError = null;

  const maxSteps = Math.ceil(horizonDays / coarseStepDays);

  for (let step = 1; step <= maxSteps && !exactitudeFound; step++) {
    const t = Math.min(step * coarseStepDays, horizonDays);
    const a = getStateA(t);
    const b = getStateB(t);
    const err = signedErrorToTarget(a.longitude, b.longitude, exactAngle);
    const abs = Math.abs(err);

    // --- sign ingress detection (per role) ---
    for (const [role, prevState, curState] of [
      ["planetA", prevA, a],
      ["planetB", prevB, b],
    ]) {
      const idx1 = signIndexOf(prevState.longitude);
      const idx2 = signIndexOf(curState.longitude);
      if (idx1 !== idx2) {
        const forward = idx2 === (idx1 + 1) % 12;
        const boundaryDeg = forward ? ((idx1 + 1) % 12) * 30 : idx1 * 30;
        const f = (t2) => normalizeSigned180(getStateForRole(role, t2).longitude - boundaryDeg);
        const f1 = normalizeSigned180(prevState.longitude - boundaryDeg);
        const f2 = normalizeSigned180(curState.longitude - boundaryDeg);
        const { t: refinedT } = bisect(f, prevT, f1, t, f2, { maxIterations: EVENT_REFINE_ITERATIONS });
        ingressEvents.push({ role, fromIndex: idx1, toIndex: idx2, tDays: refinedT });
      }
    }

    // --- station (motion reversal) detection (per role) ---
    for (const [role, prevState, curState] of [
      ["planetA", prevA, a],
      ["planetB", prevB, b],
    ]) {
      if (prevState.speedDegPerDay === 0 || curState.speedDegPerDay === 0) continue;
      if (Math.sign(prevState.speedDegPerDay) !== Math.sign(curState.speedDegPerDay)) {
        const f = (t2) => getStateForRole(role, t2).speedDegPerDay;
        const { t: refinedT } = bisect(f, prevT, prevState.speedDegPerDay, t, curState.speedDegPerDay, {
          maxIterations: EVENT_REFINE_ITERATIONS,
        });
        // Local evidence: does the orb-from-exact of the CURRENTLY-TARGETED
        // aspect actually begin increasing after this reversal (a genuine
        // withdrawal from application), or does the pair keep closing in
        // regardless (a mere slowdown, not a withdrawal)? This is raw,
        // direction-agnostic technical data — both direct->retrograde and
        // retrograde->direct transitions get it recorded; which direction
        // (if any) counts as historically qualifying "refranation" is a
        // separate classification decision made by the caller, not baked
        // in here.
        const beforeT = Math.max(0, refinedT - LOCAL_TREND_WINDOW_DAYS);
        const afterT = Math.min(horizonDays, refinedT + LOCAL_TREND_WINDOW_DAYS);
        const orbBeforeReversal = Math.abs(errorAt(beforeT));
        const orbAfterReversal = Math.abs(errorAt(afterT));
        stationEvents.push({
          role,
          fromMotion: prevState.speedDegPerDay < 0 ? "retrograde" : "direct",
          toMotion: curState.speedDegPerDay < 0 ? "retrograde" : "direct",
          tDays: refinedT,
          orbBeforeReversal,
          orbAfterReversal,
          applicationReversedAway: orbAfterReversal > orbBeforeReversal,
        });
      }
    }

    // --- aspect-exactitude root bracket ---
    // A sign change alone is not sufficient evidence of a genuine crossing:
    // signedErrorToTarget wraps into (-180, 180], so the representation
    // ALSO flips sign when the pair passes the point exactly opposite the
    // target (e.g. prevErr=+179, err=-179) — a wraparound artifact, not a
    // real aspect crossing. A real crossing near zero changes by roughly
    // one coarse step's worth of relative motion; a wraparound artifact
    // jumps by ~360 degrees in raw terms. Guarding on the jump size
    // distinguishes the two before ever attempting to bisect.
    const isPlausibleCrossing = prevErr !== 0 && Math.sign(err) !== Math.sign(prevErr) && Math.abs(err - prevErr) < 180;
    if (isPlausibleCrossing) {
      const { t: rootT, value: rootErr } = bisect(errorAt, prevT, prevErr, t, err, {
        maxIterations: MAX_ROOT_ITERATIONS,
        toleranceAbs: DIRECT_PERFECTION_ROOT_TOLERANCE_DEGREES,
      });
      // Only accept if bisection actually converged to the tolerance —
      // otherwise this was not a genuine crossing after all (defense in
      // depth alongside the jump-size guard above).
      if (Math.abs(rootErr) <= DIRECT_PERFECTION_ROOT_TOLERANCE_DEGREES) {
        exactitudeFound = true;
        exactTDays = rootT;
        exactError = rootErr;
        break;
      }
    }

    if (abs > prevAbs && turnedAwayAtDays === null) {
      turnedAwayAtDays = prevT;
    }
    if (abs < minAbsSeen) minAbsSeen = abs;

    prevT = t;
    prevA = a;
    prevB = b;
    prevErr = err;
    prevAbs = abs;
  }

  return {
    startingOrb,
    exactitudeFound,
    exactTDays,
    exactError,
    ingressEvents,
    stationEvents,
    turnedAwayAtDays,
    finalAbsError: prevAbs,
    horizonReachedWithoutCrossing: !exactitudeFound,
    stillTrendingTowardExactAtHorizon: !exactitudeFound && prevAbs <= minAbsSeen,
  };
}

function bodyForPlanet(planetKey) {
  const entry = PLANET_BODIES.find((p) => p.key === planetKey);
  if (!entry) throw new Error(`Unknown planet "${planetKey}"`);
  return entry.body;
}

/**
 * Real astronomy-engine position/speed for `planetKey` at `startAstroTime` plus `tDays`.
 * Reuses computeLongitudeAndSpeed() verbatim — no competing calculation.
 */
function realState(planetKey, startAstroTime, tDays) {
  const body = bodyForPlanet(planetKey);
  const t = startAstroTime.AddDays(tDays);
  return computeLongitudeAndSpeed(body, t);
}

const NON_CANDIDATE_REASON = {
  separating: "currently_separating",
  exact: "already_exact",
};

/**
 * Full Phase 3G-A result for one Phase 3F pair.
 * @param {object} params
 * @param {object} params.aspectPair a Phase 3F pair object (chart.classical.aspects[i]) — read-only, never modified
 * @param {import("astronomy-engine").AstroTime} params.startAstroTime the chart's birth AstroTime
 * @returns {object} directPerfection result, see module doc comment / README for shape
 */
export function computeDirectPerfection({ aspectPair, startAstroTime }) {
  const { planetA, planetB, aspect, motion } = aspectPair;

  if (!aspect.isWithinOrb || aspect.type === null) {
    return nonCandidateResult(planetA, planetB, aspect, "no_current_classical_aspect");
  }
  if (motion.status !== "applying") {
    const reasonCode = NON_CANDIDATE_REASON[motion.status] ?? "not_currently_applying";
    return nonCandidateResult(planetA, planetB, aspect, reasonCode);
  }

  const getStateA = (tDays) => realState(planetA, startAstroTime, tDays);
  const getStateB = (tDays) => realState(planetB, startAstroTime, tDays);

  // Resolve which of the two raw-longitude-difference mirrors (see
  // resolveEffectiveTargetAngle's doc comment) this pair is currently
  // closest to, so the signed search locks onto the same physical
  // configuration Phase 3F already found "applying" for its whole
  // duration — never re-resolved mid-search.
  const state0A = getStateA(0);
  const state0B = getStateB(0);
  const effectiveTargetAngle = resolveEffectiveTargetAngle(state0A.longitude, state0B.longitude, aspect.exactAngle);

  const raw = scanForAspectEvents({
    getStateA,
    getStateB,
    exactAngle: effectiveTargetAngle,
    horizonDays: DIRECT_PERFECTION_SEARCH_HORIZON_DAYS,
    coarseStepDays: COARSE_STEP_DAYS,
  });

  const roleToPlanet = { planetA, planetB };
  const toSignEvent = (e) => ({
    planet: roleToPlanet[e.role],
    fromSign: SIGN_KEYS[e.fromIndex],
    toSign: SIGN_KEYS[e.toIndex],
    timestamp: startAstroTime.AddDays(e.tDays).date.toISOString(),
  });
  const toMotionEvent = (e) => ({
    planet: roleToPlanet[e.role],
    fromMotion: e.fromMotion,
    toMotion: e.toMotion,
    timestamp: startAstroTime.AddDays(e.tDays).date.toISOString(),
  });

  const exactitudeTDays = raw.exactTDays;
  const beforeExact = (tDays) => exactitudeTDays === null || tDays < exactitudeTDays;

  const ingressBefore = raw.ingressEvents.filter((e) => beforeExact(e.tDays));
  const motionBefore = raw.stationEvents.filter((e) => beforeExact(e.tDays));

  const ingressBeforeExactitude = {
    planetA: ingressBefore.some((e) => e.role === "planetA"),
    planetB: ingressBefore.some((e) => e.role === "planetB"),
    events: ingressBefore.map(toSignEvent),
  };
  const motionChangeBeforeExactitude = {
    planetA: motionBefore.some((e) => e.role === "planetA"),
    planetB: motionBefore.some((e) => e.role === "planetB"),
    events: motionBefore.map(toMotionEvent),
  };

  // Refranation (see module doc comment for the full definition): the
  // FIRST direct->retrograde station whose own local before/after
  // evidence shows the application withdrawing. This is evaluated from
  // the complete station list, entirely independent of whether the
  // search later finds an exactitude crossing (that may belong to a
  // separate, later re-application - see Part 3 of the brief) and
  // independent of the search horizon.
  const qualifyingRefranationStation = raw.stationEvents.find(
    (e) => e.fromMotion === "direct" && e.toMotion === "retrograde" && e.applicationReversedAway,
  );
  let refranation = {
    occurs: false,
    planet: null,
    motionChange: null,
    timestampUTC: null,
    orbBeforeReversal: null,
    orbAfterReversal: null,
    applicationReversedAway: false,
    convention: REFRANATION_CONVENTION,
  };
  if (qualifyingRefranationStation) {
    refranation = {
      occurs: true,
      planet: roleToPlanet[qualifyingRefranationStation.role],
      motionChange: { from: qualifyingRefranationStation.fromMotion, to: qualifyingRefranationStation.toMotion },
      timestampUTC: startAstroTime.AddDays(qualifyingRefranationStation.tDays).date.toISOString(),
      orbBeforeReversal: qualifyingRefranationStation.orbBeforeReversal,
      orbAfterReversal: qualifyingRefranationStation.orbAfterReversal,
      applicationReversedAway: true,
      convention: REFRANATION_CONVENTION,
    };
  }

  let status;
  let reasonCode;
  let exactitudePositions = null;
  let exactitudeTimestampUTC = null;
  let timeToExactitudeDays = null;

  if (raw.exactitudeFound) {
    exactitudeTimestampUTC = startAstroTime.AddDays(exactitudeTDays).date.toISOString();
    timeToExactitudeDays = exactitudeTDays;
    exactitudePositions = {
      planetALongitude: getStateA(exactitudeTDays).longitude,
      planetBLongitude: getStateB(exactitudeTDays).longitude,
    };
    if (ingressBeforeExactitude.planetA || ingressBeforeExactitude.planetB) {
      status = "requires_historical_rule";
      reasonCode = "sign_ingress_before_exactitude_unresolved_convention";
    } else {
      status = "perfects";
      reasonCode = "geometric_perfection_confirmed_no_ingress";
    }
  } else if (refranation.occurs) {
    status = "does_not_perfect";
    reasonCode = "refranation";
  } else if (raw.stillTrendingTowardExactAtHorizon) {
    status = "search_horizon_reached";
    reasonCode = "search_horizon_reached_still_applying";
  } else {
    status = "does_not_perfect";
    reasonCode = "no_crossing_within_search_horizon";
  }

  return {
    isCandidate: true,
    planetA,
    planetB,
    aspectType: aspect.type,
    exactAngle: aspect.exactAngle,
    startingOrb: raw.startingOrb,
    exactitudeFound: raw.exactitudeFound,
    exactitudeTimestampUTC,
    timeToExactitudeDays,
    exactitudePositions,
    ingressBeforeExactitude,
    motionChangeBeforeExactitude,
    refranation,
    status,
    reasonCode,
  };
}

function nonCandidateResult(planetA, planetB, aspect, reasonCode) {
  return {
    isCandidate: false,
    planetA,
    planetB,
    aspectType: aspect.type,
    exactAngle: aspect.exactAngle ?? null,
    startingOrb: aspect.orbFromExact ?? null,
    exactitudeFound: false,
    exactitudeTimestampUTC: null,
    timeToExactitudeDays: null,
    exactitudePositions: null,
    ingressBeforeExactitude: { planetA: false, planetB: false, events: [] },
    motionChangeBeforeExactitude: { planetA: false, planetB: false, events: [] },
    refranation: {
      occurs: false,
      planet: null,
      motionChange: null,
      timestampUTC: null,
      orbBeforeReversal: null,
      orbAfterReversal: null,
      applicationReversedAway: false,
      convention: REFRANATION_CONVENTION,
    },
    status: "not_a_candidate",
    reasonCode,
  };
}
