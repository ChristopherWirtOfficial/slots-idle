import { atom } from 'jotai';
import { SpinResult } from '../game/spin';

export const pendingResultAtom = atom<SpinResult | null>(null);
export const lastResultAtom = atom<SpinResult | null>(null);

export interface FloatEvent {
  id: number;
  amount: number;
  isJackpot: boolean;
}
export const lastFloatAtom = atom<FloatEvent | null>(null);
