import { useEffect, useState } from 'react';
import { SpinResult } from '../../engine/types';

const CYCLE_MS = 1400;

/**
 * When a spin resolves with one or more wins, cycles through them at a
 * fixed interval so the highlight overlay visits each winning payline
 * in turn. Returns the index of the currently-active win, or null when
 * there's nothing to show (mid-spin, no wins, or initial mount).
 */
export function useWinCycle(
  spinning: boolean,
  lastResult: SpinResult | null,
): number | null {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  useEffect(() => {
    if (spinning || !lastResult || lastResult.wins.length === 0) {
      setActiveIdx(null);
      return;
    }
    setActiveIdx(0);
    if (lastResult.wins.length === 1) return;
    const count = lastResult.wins.length;
    const id = window.setInterval(() => {
      setActiveIdx((i) => (i === null ? 0 : (i + 1) % count));
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [spinning, lastResult]);

  return activeIdx;
}
