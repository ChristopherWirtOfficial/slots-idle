import Decimal from 'break_infinity.js';
import { atom } from 'jotai';
import { easeOut, velocityCellsPerFrame } from '../../engine/animation';
import { sfxReelTick } from '../../audio/sfx';
import { chipsAtom } from '../economy';
import { effectiveNowAtom } from '../clock';
import { reelAtomsAtom } from '../reels';
import { passiveAmountAtom } from '../upgrades';

/**
 * Passive income tick: adds the current passive amount to the player's
 * chips. Registered with the tick loop in usePassiveIncome at the
 * user's current passive-rate frequency.
 */
export const passiveIncomeTickAtom = atom(null, (get, set) => {
  const amount = get(passiveAmountAtom);
  if (amount === 0) return;
  set(chipsAtom, get(chipsAtom).add(new Decimal(amount)));
});

/**
 * Per-reel memory: the last integer cell we fired a "tick" sound for.
 * Module-scoped Map — this is purely bookkeeping local to this tick
 * functor, nobody else needs to read it. Cleared per reel whenever
 * the reel leaves the spinning state.
 */
const lastTickedCellByReel = new Map<number, number>();

/**
 * Reel-tick audio: for each spinning reel, fire a tick sound each time
 * a new integer cell crosses under the window. Velocity-modulated so
 * the ticks speed up with the reel's perceived speed.
 *
 * Previously this was a per-render useEffect in Reel.tsx using a ref
 * to remember the last integer cell. Moved to a tick functor so the
 * edge-detection runs regardless of React rendering, and so offline
 * catch-up fast-forwards the ticks through virtual time along with
 * everything else.
 */
export const reelTickAudioTickAtom = atom(null, (get) => {
  const reelAtoms = get(reelAtomsAtom);
  const now = get(effectiveNowAtom);
  for (let i = 0; i < reelAtoms.length; i++) {
    const reel = get(reelAtoms[i]);
    if (reel.kind !== 'spinning') {
      if (lastTickedCellByReel.has(i)) lastTickedCellByReel.delete(i);
      continue;
    }
    const elapsed = Math.max(0, now - reel.startTime);
    const t = Math.min(1, elapsed / reel.duration);
    const cellsScrolled = easeOut(t) * reel.distanceCells;
    const currentInt = Math.floor(cellsScrolled);
    const last = lastTickedCellByReel.get(i) ?? 0;
    if (currentInt > last) {
      const vel = velocityCellsPerFrame(t, reel.distanceCells, reel.duration);
      if (vel > 0.02) sfxReelTick(vel);
      lastTickedCellByReel.set(i, currentInt);
    }
  }
});
