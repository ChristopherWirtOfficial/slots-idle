import { atom } from 'jotai';
import { ACTIVE_MACHINE } from '../machines/registry';
import { levelsAtom } from './levels';
import { GLOBAL_UPGRADES } from '../engine/upgrades';
import { UpgradeDef } from '../engine/types';

/**
 * The active machine. Boot-only — see registry.ts for what runtime
 * swapping would need.
 */
export const activeMachineAtom = atom(ACTIVE_MACHINE);

/**
 * The machine's current resolved shape, re-derived whenever levels change.
 * Pure derivation: machine.resolveConfig(levels).
 */
export const resolvedConfigAtom = atom((get) => {
  const machine = get(activeMachineAtom);
  const levels = get(levelsAtom);
  return machine.resolveConfig(levels);
});

// Convenience derived atoms for commonly-read fields.
export const topologyAtom = atom((get) => get(resolvedConfigAtom).topology);
export const reelCountAtom = atom((get) => get(topologyAtom).reelCount);
export const rowCountAtom = atom((get) => get(topologyAtom).rowCount);
export const paylinesAtom = atom((get) => get(resolvedConfigAtom).paylines);
export const symbolsAtom = atom((get) => get(resolvedConfigAtom).symbols);

/**
 * Merged upgrade list: engine globals + the active machine's contribution.
 * Ids are assumed not to collide between sources.
 */
export const allUpgradesAtom = atom((get) => {
  const machine = get(activeMachineAtom);
  const machineUpgrades: UpgradeDef[] = machine.upgrades ?? [];
  return [...GLOBAL_UPGRADES, ...machineUpgrades];
});
