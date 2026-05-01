import { atom } from 'jotai';
import { autospinDelayMsAtom, autospinEffectiveAtom } from './autospin';
import { effectiveNowAtom } from './clock';
import { SlotSymbol } from '../engine/types';
import { symbolsAtom } from './machine';
import { FloatEvent, lastCommitAtom, lastFloatAtom, wildRerollAtom } from './session';

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
  return get(effectiveNowAtom) - commit.committedAt;
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
 * How long a per-line float toast lives, in ms, starting when the slot
 * starts. Independent of the slot's visible-overlay duration — even at
 * high autospin compression where overlay duration bottoms at 250ms,
 * the float still rises for its own fixed-ish duration (with a compress
 * floor so it doesn't outlast the available window).
 */
export const LINE_FLOAT_DURATION_MS = 1100;

export interface LineFloatAnim {
  /** 0..1 progress through the float's lifetime. */
  t: number;
  /** 0..1 opacity — fade in quickly, hold, fade out. */
  opacity: number;
  /** Pixels the toast has risen from its anchor. */
  riseY: number;
}

/**
 * Pure: given a slot's startMs and the current elapsed time, compute
 * the float's animation state. Returns null when the float is not
 * currently visible (before start or after end). No atom reads — this
 * is called by the render component per frame with values from atoms.
 */
export function lineFloatAnim(
  slotStartMs: number,
  elapsedMs: number,
  durationMs: number = LINE_FLOAT_DURATION_MS,
): LineFloatAnim | null {
  if (elapsedMs < slotStartMs) return null;
  const local = elapsedMs - slotStartMs;
  if (local >= durationMs) return null;
  const t = local / durationMs;
  // Fade: fast in (0-12%), plateau (12-70%), slow out (70-100%)
  let opacity: number;
  if (t < 0.12) opacity = t / 0.12;
  else if (t < 0.7) opacity = 1;
  else opacity = 1 - (t - 0.7) / 0.3;
  // Rise: eased toward a 40px target
  const riseY = 40 * (1 - Math.pow(1 - t, 2));
  return { t, opacity, riseY };
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

/* ──────────────────────────────────────────────────────────────
 * Timestamp-driven display derivations.
 *
 * Each of the below is a pure function of (fact-with-timestamp,
 * effectiveNow): shaking/visible/symbol is "true iff elapsed since
 * the event < duration." Consumers read a derived atom; when virtual
 * time fast-forwards (offline catch-up), the derivation fast-forwards
 * with it automatically — no imperative cleanup, no animation refs.
 * ────────────────────────────────────────────────────────────── */

const JACKPOT_SHAKE_MS = 700;
const FLOAT_TOAST_MS = 1400;

/** Is the cabinet currently doing its jackpot-celebration shake? */
export const jackpotShakingAtom = atom<boolean>((get) => {
  const commit = get(lastCommitAtom);
  if (commit === null) return false;
  if (!commit.result.hasJackpot) return false;
  const elapsed = get(effectiveNowAtom) - commit.committedAt;
  return elapsed >= 0 && elapsed < JACKPOT_SHAKE_MS;
});

/**
 * The float toast currently on screen, or null if none should show.
 * Visible for FLOAT_TOAST_MS after the float's createdAt.
 */
export const visibleFloatAtom = atom<FloatEvent | null>((get) => {
  const f = get(lastFloatAtom);
  if (f === null) return null;
  const elapsed = get(effectiveNowAtom) - f.createdAt;
  if (elapsed < 0 || elapsed >= FLOAT_TOAST_MS) return null;
  return f;
});

export interface WildRerollDisplay {
  symbol: SlotSymbol;
  landed: boolean;
}

/**
 * What the wild-reroll popup should display right now: a cycling
 * symbol from the pool during the early 85% of the animation, then
 * the revealed symbol for the final 15%.
 *
 * Cycle count is the analytic integral of the original imperative
 * rate function (stepMs(t) = 20 + 80·t/D), giving an identical feel
 * without the setTimeout loop and accumulated state. The integral
 * evaluates to (D/80)·ln(1 + 4t/D), which is monotonic and smooth.
 */
export const wildRerollDisplayAtom = atom<WildRerollDisplay | null>((get) => {
  const reroll = get(wildRerollAtom);
  if (reroll === null) return null;
  const elapsed = get(effectiveNowAtom) - reroll.startedAt;
  const landed = elapsed >= reroll.durationMs * 0.85;
  if (landed) return { symbol: reroll.revealSymbol, landed: true };
  const symbols = get(symbolsAtom);
  if (symbols.length === 0) {
    return { symbol: reroll.revealSymbol, landed: false };
  }
  const cycles = elapsed > 0
    ? (reroll.durationMs / 80) * Math.log(1 + (4 * elapsed) / reroll.durationMs)
    : 0;
  const idx = Math.floor(cycles) % symbols.length;
  return { symbol: symbols[idx], landed: false };
});
