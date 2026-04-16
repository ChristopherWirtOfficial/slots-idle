import { atom } from 'jotai';
import { SlotSymbol, SYMBOLS } from '../game/symbols';

export type ReelAnimState =
  | { kind: 'resting'; symbol: SlotSymbol }
  | {
      kind: 'spinning';
      startTime: number; // performance.now() at spin start
      duration: number; // ms
      distanceCells: number; // total cells the strip will scroll
      resultSymbol: SlotSymbol;
      strip: SlotSymbol[]; // strip[0] = prev symbol, strip[distanceCells] = result
    };

const restingOn = (s: SlotSymbol): ReelAnimState => ({ kind: 'resting', symbol: s });

export const reel0Atom = atom<ReelAnimState>(restingOn(SYMBOLS[0]));
export const reel1Atom = atom<ReelAnimState>(restingOn(SYMBOLS[1]));
export const reel2Atom = atom<ReelAnimState>(restingOn(SYMBOLS[2]));

export const reelAtoms = [reel0Atom, reel1Atom, reel2Atom] as const;

/**
 * Bumped by the animation tick every frame. Reel components subscribe to
 * this only while their own state is `spinning` — resting reels don't re-render.
 */
export const frameTimeAtom = atom(0);

export const anyReelSpinningAtom = atom((get) =>
  reelAtoms.some((a) => get(a).kind === 'spinning'),
);

// What symbol is each reel currently showing (at rest or pre-spin)?
export function getCurrentSymbol(state: ReelAnimState): SlotSymbol {
  return state.kind === 'resting' ? state.symbol : state.resultSymbol;
}
