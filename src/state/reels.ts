import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { SlotSymbol } from '../engine/types';
import { reelCountAtom } from './machine';

/** A column window — length equals the current machine's rowCount. */
export type SymWindow = SlotSymbol[];

export type ReelAnimState =
  | { kind: 'resting'; window: SymWindow }
  | {
      kind: 'spinning';
      startTime: number;
      duration: number;
      distanceCells: number;
      resultWindow: SymWindow;
      strip: SlotSymbol[];
    };

/**
 * One atom per reel index. The factory can't read other atoms at creation
 * time, so initial state is `resting` with an empty window. An init effect
 * (useReelSync) populates each reel with default symbols on App mount and
 * whenever topology changes.
 *
 * Family entries persist across topology shrinks (orphaned atoms remain
 * cached but unused). Acceptable — prestige/reset are rare events.
 */
export const reelStateAtomFamily = atomFamily((_reelIdx: number) =>
  atom<ReelAnimState>({ kind: 'resting', window: [] }),
);

/**
 * Array of the currently-active reel atoms, length = reelCount.
 * Rebuilt whenever reelCount changes.
 */
export const reelAtomsAtom = atom((get) => {
  const count = get(reelCountAtom);
  return Array.from({ length: count }, (_, i) => reelStateAtomFamily(i));
});

export const anyReelSpinningAtom = atom((get) => {
  const atoms = get(reelAtomsAtom);
  return atoms.some((a) => get(a).kind === 'spinning');
});

/** Frame time bumped by the animation tick. Only SpinningReel subscribes. */
export const frameTimeAtom = atom(0);

export function getCurrentWindow(state: ReelAnimState): SymWindow {
  return state.kind === 'resting' ? state.window : state.resultWindow;
}
