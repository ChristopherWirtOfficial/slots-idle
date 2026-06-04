import { atom } from 'jotai';
import { sfxUpgrade } from '../../audio/sfx';
import { highRollerPointsAtom } from '../prestige';
import { storeCostsAtom, storeLevelsAtom, storeTracksAtom } from '../store';

/** Buy one level of a prestige-store track, paying in High-Roller Points. */
export const buyStoreTrackAtom = atom(null, (get, set, trackId: string) => {
  const tracks = get(storeTracksAtom);
  const track = tracks.find((t) => t.id === trackId);
  if (!track) return;

  const levels = get(storeLevelsAtom);
  const lvl = levels[trackId] ?? 0;
  if (track.maxLevel > 0 && lvl >= track.maxLevel) return;

  const cost = get(storeCostsAtom)[trackId];
  const points = get(highRollerPointsAtom);
  if (!cost || points.lt(cost)) return;

  set(highRollerPointsAtom, points.sub(cost));
  set(storeLevelsAtom, { ...levels, [trackId]: lvl + 1 });
  sfxUpgrade();
});
