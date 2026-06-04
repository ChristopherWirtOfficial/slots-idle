import Decimal from 'break_infinity.js';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import {
  PAYOUT_TRACK,
  payoutTrackMult,
  reductionFactor,
  reductionTrackFor,
  trackPointCost,
} from '../engine/upgrades';
import { StoreTrackDef } from '../engine/types';
import { allUpgradesAtom } from './machine';

const KEY = (k: string) => `lucky-idle-slots:v1:${k}`;

/**
 * Prestige-store track levels, keyed by track id. Permanent — survives
 * prestige (only a full reset wipes them). Unknown ids read as 0.
 */
export const storeLevelsAtom = atomWithStorage<Record<string, number>>(
  KEY('store'),
  {},
);

/**
 * All store tracks: the global payout boost + one cost-reduction track
 * per purchasable upgrade. Derived from the merged upgrade list so new
 * upgrades automatically gain a reduction track.
 */
export const storeTracksAtom = atom((get): StoreTrackDef[] => {
  const upgrades = get(allUpgradesAtom);
  return [PAYOUT_TRACK, ...upgrades.map(reductionTrackFor)];
});

/** Point cost of the next level per track id. */
export const storeCostsAtom = atom((get) => {
  const tracks = get(storeTracksAtom);
  const levels = get(storeLevelsAtom);
  const result: Record<string, Decimal> = {};
  for (const t of tracks) result[t.id] = trackPointCost(t, levels[t.id] ?? 0);
  return result;
});

/**
 * Chip-cost reduction factor per upgrade id (1 = no reduction). Read by
 * costsAtom to discount upgrade prices. Composes: costsAtom doesn't need
 * to know the store exists beyond this factor.
 */
export const reductionFactorsAtom = atom((get) => {
  const levels = get(storeLevelsAtom);
  const upgrades = get(allUpgradesAtom);
  const result: Record<string, number> = {};
  for (const u of upgrades) {
    result[u.id] = reductionFactor(levels[`reduce:${u.id}`] ?? 0);
  }
  return result;
});

/** Permanent payout multiplier from the House Favor track. */
export const payoutMultAtom = atom((get) =>
  payoutTrackMult(get(storeLevelsAtom)[PAYOUT_TRACK.id] ?? 0),
);
