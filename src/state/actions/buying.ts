import { atom } from 'jotai';
import { costOf } from '../../engine/upgrades';
import { sfxUpgrade } from '../../audio/sfx';
import { chipsAtom } from '../economy';
import { levelsAtom } from '../levels';
import { allUpgradesAtom } from '../machine';

/** Buy a level of any upgrade (engine global or machine contribution). */
export const buyUpgradeAtom = atom(null, (get, set, id: string) => {
  const upgrades = get(allUpgradesAtom);
  const u = upgrades.find((x) => x.id === id);
  if (!u) return;

  const levels = get(levelsAtom);
  const lvl = levels[id] ?? 0;
  if (lvl >= u.maxLevel) return;

  const cost = costOf(u, lvl);
  const chips = get(chipsAtom);
  if (chips.lt(cost)) return;

  set(chipsAtom, chips.sub(cost));
  set(levelsAtom, { ...levels, [id]: lvl + 1 });
  sfxUpgrade();
});
