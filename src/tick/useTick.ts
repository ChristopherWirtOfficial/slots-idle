import { useAtomValue, useSetAtom, WritableAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { atom } from 'jotai';
import { registerFunctor } from './loop';

function uuid(): string {
  // Non-cryptographic, good enough for functor IDs
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Optional global gate. Set to false to pause all ticks; defaults to true.
export const tickEnabledAtom = atom(true);

/**
 * Registers a function to be called on every tick (or every Nth tick via frequency).
 * The functor identity can change between renders — we use a ref internally so
 * consumers don't need to memoize their callback.
 */
export function useTick(functor: (tickNumber: number) => void, frequency = 1): void {
  const [id] = useState(uuid);
  const ref = useRef(functor);
  ref.current = functor;

  const enabled = useAtomValue(tickEnabledAtom);

  useEffect(() => {
    if (!enabled) return;
    return registerFunctor({
      id,
      frequency,
      functor: (n) => ref.current(n),
    });
  }, [id, frequency, enabled]);
}

/**
 * Sugar: tick a write-only atom. The atom's setter is the functor.
 */
export function useAtomicTick<Args extends unknown[], Result>(
  writeAtom: WritableAtom<unknown, Args, Result>,
  frequency = 1,
): void {
  const setter = useSetAtom(writeAtom);
  useTick(() => {
    // Write atoms in our app take no args; cast is safe for our usage.
    (setter as unknown as () => void)();
  }, frequency);
}
