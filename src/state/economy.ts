import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

const KEY = (k: string) => `lucky-idle-slots:v1:${k}`;

export const chipsAtom = atomWithStorage<number>(KEY('chips'), 20);
export const lifetimeWinningsAtom = atomWithStorage<number>(KEY('lifetimeWinnings'), 0);
export const totalEverWonAtom = atomWithStorage<number>(KEY('totalEverWon'), 0);
export const jackpotsAtom = atomWithStorage<number>(KEY('jackpots'), 0);
export const spinsTotalAtom = atomWithStorage<number>(KEY('spinsTotal'), 0);

// Convenience: can the player afford the given amount right now?
export const canAffordAtom = atom((get) => (amount: number) => get(chipsAtom) >= amount);
