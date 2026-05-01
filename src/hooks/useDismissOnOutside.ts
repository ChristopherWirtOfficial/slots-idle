import { RefObject, useEffect } from 'react';

/**
 * While `enabled`, dismiss when the user interacts outside the ref'd
 * element or presses Escape. Subscribes to document events; cleans up
 * when enabled flips false or the component unmounts.
 *
 * Shape: "open = external fact, dismiss = external event". The hook
 * turns those external events into a callback so consumers don't have
 * to care about document listeners or cleanup.
 *
 * Usage:
 *   const ref = useRef<HTMLDivElement>(null);
 *   const [open, setOpen] = useState(false);
 *   useDismissOnOutside(ref, open, () => setOpen(false));
 */
export function useDismissOnOutside(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  onDismiss: () => void,
): void {
  useEffect(() => {
    if (!enabled) return;
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onDismiss();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [enabled, ref, onDismiss]);
}
