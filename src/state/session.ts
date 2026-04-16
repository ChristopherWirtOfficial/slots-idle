import { atom } from 'jotai';
import { SpinResult } from '../game/spin';

/**
 * Result of a spin whose reels are currently animating. Committed to the
 * economy when the last reel lands; cleared after commit.
 */
export const pendingResultAtom = atom<SpinResult | null>(null);

export const lastResultAtom = atom<SpinResult | null>(null);

export interface FloatEvent {
  id: number;
  amount: number;
  kind: SpinResult['kind'];
}
export const lastFloatAtom = atom<FloatEvent | null>(null);
