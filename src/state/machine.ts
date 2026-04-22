import { atom } from 'jotai';
import { ACTIVE_MACHINE } from '../machines/registry';
import { levelsAtom } from './levels';
import { GLOBAL_UPGRADES } from '../engine/upgrades';
import { UpgradeDef } from '../engine/types';
import { cheatWildChanceAtom } from './cheats';

/**
 * The active machine. Boot-only — see registry.ts for what runtime
 * swapping would need.
 */
export const activeMachineAtom = atom(ACTIVE_MACHINE);

/**
 * The machine's current resolved shape, re-derived whenever levels change.
 * Pure derivation from machine.resolveConfig — then cheat overrides layered
 * on top (cheats are dev/testing aids, they override real state).
 */
export const resolvedConfigAtom = atom((get) => {
  const machine = get(activeMachineAtom);
  const levels = get(levelsAtom);
  const config = machine.resolveConfig(levels);

  const wildCheat = get(cheatWildChanceAtom);
  if (wildCheat !== null) {
    return { ...config, wild: { ...config.wild, chance: wildCheat } };
  }
  return config;
});

// Convenience derived atoms for commonly-read fields.
export const topologyAtom = atom((get) => get(resolvedConfigAtom).topology);
export const reelCountAtom = atom((get) => get(topologyAtom).reelCount);
export const rowCountAtom = atom((get) => get(topologyAtom).rowCount);
export const paylinesAtom = atom((get) => get(resolvedConfigAtom).paylines);
export const symbolsAtom = atom((get) => get(resolvedConfigAtom).symbols);
export const wildAtom = atom((get) => get(resolvedConfigAtom).wild);

/**
 * Merged upgrade list: engine globals + the active machine's contribution.
 * Ids are assumed not to collide between sources.
 *
 * Upgrades with maxLevel <= 0 are filtered out — this is how we
 * "disable" an upgrade (e.g., locking content behind prestige) without
 * deleting its definition. The definition stays available for
 * derive() and any other math that references its effect at level 0.
 */
export const allUpgradesAtom = atom((get) => {
  const machine = get(activeMachineAtom);
  const machineUpgrades: UpgradeDef[] = machine.upgrades ?? [];
  return [...GLOBAL_UPGRADES, ...machineUpgrades].filter((u) => u.maxLevel > 0);
});
