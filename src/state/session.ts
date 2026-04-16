import { atom } from 'jotai';
import { SYMBOLS, SlotSymbol } from '../game/symbols';
import { SpinResult } from '../game/spin';

export const isSpinningAtom = atom(false);

export const reelsDisplayAtom = atom<SlotSymbol[]>([SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]]);

export const lastResultAtom = atom<SpinResult | null>(null);

export interface FloatEvent {
  id: number;
  amount: number;
  kind: SpinResult['kind'];
}
export const lastFloatAtom = atom<FloatEvent | null>(null);
