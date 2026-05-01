import { atom } from 'jotai';
import { atomFamily } from 'jotai-family';
import { Cell, SlotSymbol, symbolCell } from '../engine/types';
import { reelCountAtom, rowCountAtom, symbolsAtom } from './machine';

/** A column window — length equals the current machine's rowCount. */
export type SymWindow = Cell[];

export type ReelAnimState =
  | { kind: 'resting'; window: SymWindow }
  | {
      kind: 'spinning';
      startTime: number;
      duration: number;
      distanceCells: number;
      resultWindow: SymWindow;
      strip: Cell[];
    };

/**
 * Default "never been spun" window for a given reel. Offset by reelIdx
 * so the initial grid doesn't display a single symbol in every column.
 */
function defaultRestingWindow(
  symbols: SlotSymbol[],
  rowCount: number,
  reelIdx: number,
): SymWindow {
  if (symbols.length === 0 || rowCount === 0) return [];
  return Array.from({ length: rowCount }, (_, i) =>
    symbolCell(symbols[(reelIdx + i) % symbols.length]),
  );
}

/**
 * One writable-derived atom per reel index.
 *
 * Before the reel has ever been spun (or after an explicit reset to
 * null), the atom reads as a default resting window computed from
 * current symbols + rowCount + reelIdx. Once written — at spin-start
 * or commit-landing — the stored value wins; reads return exactly
 * what was written.
 *
 * This shape eliminates the mount-time sync effect that used to
 * populate initial windows, and lets the render path read a valid
 * ReelAnimState on the very first render. "Empty window" is no longer
 * a sentinel for "not yet initialized"; the derivation handles it.
 *
 * Topology-changing upgrades (currently disabled: extraRow, extraReel)
 * would need buyUpgradeAtom to reset these base atoms to null when
 * purchased, so reads recompute against the new rowCount/reelIdx.
 * Until those upgrades ship, that reset isn't wired.
 */
export const reelStateAtomFamily = atomFamily((reelIdx: number) => {
  const base = atom<ReelAnimState | null>(null);
  return atom(
    (get): ReelAnimState => {
      const stored = get(base);
      if (stored !== null) return stored;
      return {
        kind: 'resting',
        window: defaultRestingWindow(
          get(symbolsAtom),
          get(rowCountAtom),
          reelIdx,
        ),
      };
    },
    (_get, set, update: ReelAnimState) => set(base, update),
  );
});

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

export function getCurrentWindow(state: ReelAnimState): SymWindow {
  return state.kind === 'resting' ? state.window : state.resultWindow;
}
