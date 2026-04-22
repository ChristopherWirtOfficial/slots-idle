import { atom } from 'jotai';
import { autospinDelayMsAtom, autospinEffectiveAtom } from './autospin';
import { frameTimeAtom } from './reels';
import { lastCommitAtom } from './session';

/** Natural per-win display duration at slow/manual pace. */
export const NATURAL_DISPLAY_MS = 1400;
/** Floor per-win display; below this it's just a flash nobody can resolve. */
export const MIN_DISPLAY_MS = 250;

export interface WinSlot {
  winIdx: number;
  /** ms from commit when this slot begins. */
  startMs: number;
  /** ms from commit when this slot ends. */
  endMs: number;
}

/**
 * Given a win count and an autospin-imposed time window, produce the
 * per-win timeline. Pure — no reads of ambient state. Called by the
 * derived winSlotsAtom below.
 *
 * At slow autospin (or off / null), slots run sequentially at natural
 * pace (no overlap). As the window shrinks, stagger compresses faster
 * than display duration, so slots start overlapping — the ripple. At
 * very fast autospin stagger bottoms at ~0 and all wins flash together.
 */
export function planSlots(winCount: number, windowMs: number | null): WinSlot[] {
  if (winCount === 0) return [];
  if (winCount === 1) {
    return [{ winIdx: 0, startMs: 0, endMs: NATURAL_DISPLAY_MS }];
  }

  const naturalStagger = NATURAL_DISPLAY_MS;
  const naturalTotal = naturalStagger * (winCount - 1) + NATURAL_DISPLAY_MS;

  if (windowMs === null || naturalTotal <= windowMs) {
    return Array.from({ length: winCount }, (_, i) => ({
      winIdx: i,
      startMs: i * naturalStagger,
      endMs: i * naturalStagger + NATURAL_DISPLAY_MS,
    }));
  }

  // Compress to fit windowMs. Stagger squeezes quadratically, display
  // linearly (with a floor), so stagger collapses faster than display
  // — slots overlap more and more as the window shrinks.
  const compression = windowMs / naturalTotal;
  let display = Math.max(MIN_DISPLAY_MS, NATURAL_DISPLAY_MS * compression);
  let stagger = NATURAL_DISPLAY_MS * compression * compression;

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
 * The current ripple plan, derived purely from current state. Recomputes
 * whenever wins change or autospin parameters change.
 *
 * WORRY: If the player buys an autospin upgrade while a ripple is in
 * flight, this replans mid-cycle and slots shift to their new positions.
 * That's a real reflection of the new state, but it may look jarring in
 * practice. If playtest shows it's a problem, the fix is to capture the
 * autospin delay in lastCommitAtom at commit time (making it a fact of
 * the commit event, not ambient state). Not doing that preemptively —
 * the event is rare and the reflow may not even be noticeable.
 */
export const winSlotsAtom = atom<WinSlot[]>((get) => {
  const commit = get(lastCommitAtom);
  if (commit === null) return [];
  const autospinOn = get(autospinEffectiveAtom);
  const windowMs = autospinOn ? get(autospinDelayMsAtom) : null;
  return planSlots(commit.result.wins.length, windowMs);
});

/**
 * Milliseconds elapsed since the current commit. Ticks with frameTime.
 * Returns 0 when no commit.
 */
export const winElapsedMsAtom = atom<number>((get) => {
  const commit = get(lastCommitAtom);
  if (commit === null) return 0;
  return get(frameTimeAtom) - commit.committedAt;
});

/**
 * Opacity curve for a slot given elapsed ms. Pure; no atom reads —
 * callers pass in the values. Shape: quick 10% ramp, 60% plateau,
 * 30% fade. Zero outside the slot's window.
 */
export function slotOpacity(slot: WinSlot, elapsedMs: number): number {
  if (elapsedMs < slot.startMs) return 0;
  const local = elapsedMs - slot.startMs;
  const dur = slot.endMs - slot.startMs;
  if (local >= dur) return 0;
  const t = local / dur;
  if (t < 0.1) return t / 0.1;
  if (t < 0.7) return 1;
  return 1 - (t - 0.7) / 0.3;
}

/**
 * Which win should the summary caption describe? The latest-started
 * slot (even if its window has ended). Null when no wins. Recomputes
 * every frame but its value only changes at slot boundaries — jotai
 * references compare so consumers won't re-render unnecessarily.
 */
export const captionIdxAtom = atom<number | null>((get) => {
  const slots = get(winSlotsAtom);
  if (slots.length === 0) return null;
  const elapsed = get(winElapsedMsAtom);
  let picked: number | null = null;
  for (const slot of slots) {
    if (elapsed >= slot.startMs) picked = slot.winIdx;
  }
  return picked;
});
