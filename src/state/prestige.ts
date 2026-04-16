import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { prestigeGain, prestigeMultiplier } from '../engine/upgrades';
import { lifetimeWinningsAtom } from './economy';
import { multiplierAtom } from './upgrades';

const KEY = (k: string) => `lucky-idle-slots:v1:${k}`;

export const highRollerPointsAtom = atomWithStorage<number>(KEY('hrp'), 0);

// How many HRP would prestiging right now grant?
export const prestigePendingAtom = atom((get) => prestigeGain(get(lifetimeWinningsAtom)));

// Permanent multiplier from HRP.
export const prestigeMultAtom = atom((get) => prestigeMultiplier(get(highRollerPointsAtom)));

// Combined payout multiplier: upgrade mult × prestige mult.
export const globalMultAtom = atom((get) => get(multiplierAtom) * get(prestigeMultAtom));
