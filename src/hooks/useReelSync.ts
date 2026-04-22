import { useAtomValue, useStore } from 'jotai';
import { useLayoutEffect } from 'react';
import { reelAtomsAtom } from '../state/reels';
import {
  reelCountAtom,
  resolvedConfigAtom,
  rowCountAtom,
} from '../state/machine';
import { Cell, SlotSymbol, symbolCell } from '../engine/types';

function defaultWindow(
  symbols: SlotSymbol[],
  rowCount: number,
  reelIdx: number,
): Cell[] {
  return Array.from({ length: rowCount }, (_, i) =>
    symbolCell(symbols[(reelIdx + i) % symbols.length]),
  );
}

/**
 * Keeps each active reel's window in sync with the current topology.
 * Runs on mount and whenever reelCount or rowCount changes (e.g. upgrade
 * purchase).
 *
 * Only writes when needed (window is empty or length-mismatched); spinning
 * reels are left alone (they'll land normally and their resultWindow was
 * already built with the config snapshot at spin start).
 */
export function useReelSync(): void {
  const reelCount = useAtomValue(reelCountAtom);
  const rowCount = useAtomValue(rowCountAtom);
  const config = useAtomValue(resolvedConfigAtom);
  const reelAtoms = useAtomValue(reelAtomsAtom);
  const store = useStore();

  useLayoutEffect(() => {
    for (let i = 0; i < reelCount; i++) {
      const atom = reelAtoms[i];
      if (!atom) continue;
      const state = store.get(atom);
      if (state.kind === 'spinning') continue;
      if (state.window.length === rowCount && state.window.length > 0) continue;
      store.set(atom, {
        kind: 'resting',
        window: defaultWindow(config.symbols, rowCount, i),
      });
    }
  }, [reelCount, rowCount, config.symbols, reelAtoms, store]);
}
