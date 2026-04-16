import { atomWithStorage } from 'jotai/utils';

const KEY = (k: string) => `lucky-idle-slots:v1:${k}`;

export const volumeAtom = atomWithStorage<number>(KEY('volume'), 0.6);
export const mutedAtom = atomWithStorage<boolean>(KEY('muted'), false);
