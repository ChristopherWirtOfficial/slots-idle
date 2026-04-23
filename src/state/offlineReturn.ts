import Decimal from 'break_infinity.js';
import { atom } from 'jotai';

/**
 * Summary of what happened during the catch-up replay, produced once
 * at mount if there was meaningful offline time. Populated by the
 * catch-up driver, consumed by the "While you were away" modal.
 * Cleared (set to null) when the player claims the modal.
 *
 * Fields are all diffs: how much state advanced during replay, not
 * the current absolute values. That's what the modal wants to show —
 * "+X chips from N spins" is about the delta, not about your current
 * balance.
 */
export interface OfflineReturn {
  /** Wall-clock ms the catch-up processed (capped at the offline cap). */
  elapsedMs: number;
  /** Net change in chips from pre-catch-up to post-catch-up. */
  chipsDelta: Decimal;
  /** How many spins actually happened during replay. */
  spinsDelta: number;
  /** Jackpots hit during replay. */
  jackpotsDelta: number;
}

export const offlineReturnAtom = atom<OfflineReturn | null>(null);
