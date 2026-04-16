import { atomWithStorage } from 'jotai/utils';

/**
 * Persisted upgrade levels, keyed by upgrade id. Shared across engine
 * upgrades (bet, luck, passive, etc) and machine-contributed upgrades
 * (extraReel, extraRow, ...). Unknown or unpurchased ids read as 0.
 */
export const levelsAtom = atomWithStorage<Record<string, number>>(
  'lucky-idle-slots:v1:levels',
  {},
);
