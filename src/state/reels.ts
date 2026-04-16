import { atom } from 'jotai';
import { SlotSymbol, SYMBOLS } from '../game/symbols';

export type SymWindow = [SlotSymbol, SlotSymbol, SlotSymbol];

export type ReelAnimState =
  | { kind: 'resting'; window: SymWindow }
  | {
      kind: 'spinning';
      startTime: number;
      duration: number;
      distanceCells: number;
      resultWindow: SymWindow;
      strip: SlotSymbol[]; // strip[0..2] = prev window, strip[distanceCells..+2] = result
    };

const initialWindow = (): SymWindow => [
  SYMBOLS[0],
  SYMBOLS[1],
  SYMBOLS[2],
];

const restingOn = (w: SymWindow): ReelAnimState => ({ kind: 'resting', window: w });

export const reel0Atom = atom<ReelAnimState>(restingOn(initialWindow()));
export const reel1Atom = atom<ReelAnimState>(restingOn(initialWindow()));
export const reel2Atom = atom<ReelAnimState>(restingOn(initialWindow()));

export const reelAtoms = [reel0Atom, reel1Atom, reel2Atom] as const;

/** Frame time bumped by the animation tick; only SpinningReel subscribes. */
export const frameTimeAtom = atom(0);

export const anyReelSpinningAtom = atom((get) =>
  reelAtoms.some((a) => get(a).kind === 'spinning'),
);

export function getCurrentWindow(state: ReelAnimState): SymWindow {
  return state.kind === 'resting' ? state.window : state.resultWindow;
}
