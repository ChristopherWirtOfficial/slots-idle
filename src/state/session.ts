import Decimal from 'break_infinity.js';
import { atom } from 'jotai';
import { SlotSymbol, SpinResult } from '../engine/types';

export const pendingResultAtom = atom<SpinResult | null>(null);
export const lastResultAtom = atom<SpinResult | null>(null);

export interface FloatEvent {
  id: number;
  amount: Decimal;
  isJackpot: boolean;
}
export const lastFloatAtom = atom<FloatEvent | null>(null);

/**
 * When the pending result contains wild-only lines, the commit flow
 * pauses and this atom is populated. The popup component reads it to
 * run the reroll animation; when the animation finishes, the handler
 * mutates the pending result's wins with the rolled symbol+payout and
 * clears this atom. The animation tick sees the cleared atom and
 * proceeds with normal commit.
 *
 * startedAt drives the animation timing; the pre-rolled `revealSymbol`
 * is what the mini-spinner lands on. Rolling happens at reveal-start
 * so the popup's early frames can randomize through symbols
 * convincingly before settling.
 */
export interface WildReroll {
  startedAt: number;
  /** How long the mini-spinner animates before revealing. */
  durationMs: number;
  /** The symbol the wild-only line(s) will pay as. */
  revealSymbol: SlotSymbol;
}
export const wildRerollAtom = atom<WildReroll | null>(null);
