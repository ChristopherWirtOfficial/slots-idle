import { useEffect, useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { SpinResult } from '../../engine/types';
import {
  autospinDelayMsAtom,
  autospinEffectiveAtom,
} from '../../state/autospin';

/** Natural per-win display duration at slow/manual pace. */
const NATURAL_DISPLAY_MS = 1400;
/** Floor per-win display; below this it's just a flash nobody can resolve. */
const MIN_DISPLAY_MS = 250;

export interface WinSlot {
  winIdx: number;
  /** ms from spin-complete when this slot begins. */
  startMs: number;
  /** ms from spin-complete when this slot ends. */
  endMs: number;
}

export interface WinDisplayPlan {
  slots: WinSlot[];
  /** Primary win index for caption (just the most recently-started slot). */
  captionIdx: number | null;
}

/**
 * Given a win count and an autospin-imposed time window, produce the
 * per-win timeline. Compresses display duration AND stagger to fit,
 * bottoming at a readable floor.
 *
 * At slow autospin (or off), slots run sequentially at natural pace
 * (no overlap, identical to the old cycle). As the window shrinks,
 * stagger compresses faster than display duration, so slots start
 * overlapping — the ripple effect. At very fast autospin, slots
 * overlap substantially and the result is a near-simultaneous flash
 * with sequential onset.
 */
function planSlots(winCount: number, windowMs: number | null): WinSlot[] {
  if (winCount === 0) return [];
  if (winCount === 1) {
    return [{ winIdx: 0, startMs: 0, endMs: NATURAL_DISPLAY_MS }];
  }

  // Natural plan: sequential, no overlap.
  const naturalStagger = NATURAL_DISPLAY_MS;
  const naturalTotal = naturalStagger * (winCount - 1) + NATURAL_DISPLAY_MS;

  // No autospin constraint: take the natural plan as-is.
  if (windowMs === null || naturalTotal <= windowMs) {
    return Array.from({ length: winCount }, (_, i) => ({
      winIdx: i,
      startMs: i * naturalStagger,
      endMs: i * naturalStagger + NATURAL_DISPLAY_MS,
    }));
  }

  // Need to compress to fit `windowMs`. Squeeze stagger harder than
  // display duration — stagger can go to 0 (full stack); display has
  // a visibility floor.
  //
  // Let s = stagger, d = display. We want: s * (n - 1) + d = windowMs.
  // Keep d >= MIN_DISPLAY_MS. Set d to fill whatever the stagger
  // doesn't use, capped by NATURAL_DISPLAY_MS.
  //
  // Pick stagger so it scales linearly with available room above the
  // display floor. Simple approach: interpret compression as the
  // fraction we have of natural-total, apply stagger ∝ compression^2
  // so overlap kicks in aggressively; display ∝ compression so it
  // fades more gently.
  const compression = windowMs / naturalTotal; // < 1
  let display = Math.max(MIN_DISPLAY_MS, NATURAL_DISPLAY_MS * compression);
  let stagger = NATURAL_DISPLAY_MS * compression * compression;

  // If display + stagger budget still overshoots (happens when
  // compression * compression slow-rolls), shrink stagger further.
  const used = stagger * (winCount - 1) + display;
  if (used > windowMs) {
    const leftover = Math.max(0, windowMs - display);
    stagger = leftover / Math.max(1, winCount - 1);
  }

  return Array.from({ length: winCount }, (_, i) => ({
    winIdx: i,
    startMs: i * stagger,
    endMs: i * stagger + display,
  }));
}

/**
 * Drive the win-display plan for the most recent spin. Returns an
 * object with:
 *  - slots: per-win { winIdx, startMs, endMs } relative to plan start
 *  - nowMs: milliseconds elapsed since plan start (for overlay phase)
 *  - captionIdx: best single win index for the textual caption
 *
 * Plan start is anchored at the moment lastResult becomes available
 * after a spin. Re-plans on new result.
 */
export function useWinDisplay(
  spinning: boolean,
  lastResult: SpinResult | null,
): { slots: WinSlot[]; nowMs: number; captionIdx: number | null } {
  const autospinOn = useAtomValue(autospinEffectiveAtom);
  const autospinDelayMs = useAtomValue(autospinDelayMsAtom);

  // Plan is a function of (lastResult identity, autospin params at
  // plan time). Memo against lastResult so mid-cycle autospin toggles
  // don't re-plan partway through.
  const plan = useMemo(() => {
    if (spinning || !lastResult || lastResult.wins.length === 0) return [];
    const windowMs = autospinOn ? autospinDelayMs : null;
    return planSlots(lastResult.wins.length, windowMs);
    // Intentionally only depend on the result identity — planning
    // uses the autospin snapshot at that moment and ignores later
    // changes, to avoid mid-cycle remaps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastResult, spinning]);

  const [nowMs, setNowMs] = useState(0);

  useEffect(() => {
    if (plan.length === 0) {
      setNowMs(0);
      return;
    }
    const start = performance.now();
    let rafId = 0;
    const tick = () => {
      setNowMs(performance.now() - start);
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [plan]);

  // Caption picks the most-recently-started slot whose window hasn't
  // ended yet. If none are currently active (we've passed the tail of
  // the last slot), the caption stays on the last one shown.
  const captionIdx = useMemo(() => {
    if (plan.length === 0) return null;
    let picked: number | null = null;
    for (const slot of plan) {
      if (nowMs >= slot.startMs) picked = slot.winIdx;
    }
    return picked;
  }, [plan, nowMs]);

  return { slots: plan, nowMs, captionIdx };
}

/**
 * Opacity curve for a slot given elapsed time within its window. A
 * quick ramp up (10%), a bright plateau (60%), then a longer fade
 * (30%). Returns 0 outside the slot's window.
 */
export function slotOpacity(slot: WinSlot, nowMs: number): number {
  if (nowMs < slot.startMs) return 0;
  const local = nowMs - slot.startMs;
  const dur = slot.endMs - slot.startMs;
  if (local >= dur) return 0;
  const t = local / dur;
  if (t < 0.1) return t / 0.1;
  if (t < 0.7) return 1;
  return 1 - (t - 0.7) / 0.3;
}
