import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { UPGRADES, UpgradeDef, costOf } from '../game/upgrades';

const KEY = (k: string) => `lucky-idle-slots:v1:${k}`;

const initialLevels: Record<string, number> = Object.fromEntries(
  UPGRADES.map((u) => [u.id, 0]),
);

export const levelsAtom = atomWithStorage<Record<string, number>>(
  KEY('levels'),
  initialLevels,
);

// Derived: current cost to buy the next level of each upgrade.
export const costsAtom = atom((get) => {
  const levels = get(levelsAtom);
  return Object.fromEntries(
    UPGRADES.map((u) => [u.id, costOf(u, levels[u.id] ?? 0)]),
  ) as Record<string, number>;
});

// Build a derived atom for a single upgrade's current effect.
// Id-based so array ordering can change freely.
function upgradeEffectAtom(id: string) {
  return atom((get) => {
    const u: UpgradeDef | undefined = UPGRADES.find((x) => x.id === id);
    if (!u) return 0;
    return u.effect(get(levelsAtom)[id] ?? 0);
  });
}

export const betAtom = upgradeEffectAtom('bet');
export const luckAtom = upgradeEffectAtom('luck');
export const autoPerTickAtom = upgradeEffectAtom('autospin');
export const tickMsAtom = upgradeEffectAtom('speed');
export const multiplierAtom = upgradeEffectAtom('multiplier');
export const passiveAmountAtom = upgradeEffectAtom('passiveAmount');
export const passiveRateMsAtom = upgradeEffectAtom('passiveRate');
