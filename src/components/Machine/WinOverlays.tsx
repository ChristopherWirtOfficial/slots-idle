/** @jsxImportSource @emotion/react */
import { useAtomValue } from 'jotai';
import { activeMachineAtom, resolvedConfigAtom } from '../../state/machine';
import { lastCommitAtom } from '../../state/session';
import {
  slotOpacity,
  winElapsedMsAtom,
  winSlotsAtom,
} from '../../state/winDisplay';
import { PaylineOverlay } from './PaylineOverlay';
import { CellCenters } from './useCellCenters';

interface WinOverlaysProps {
  centers: CellCenters;
}

/**
 * Renders each active payline overlay with its live opacity. This
 * component subscribes to the per-frame elapsed atom, so it re-renders
 * every frame during the ripple window — isolating that churn from
 * Machine. Outside the ripple window (no commit, or all slots ended)
 * it returns null and stops consuming frames.
 */
export function WinOverlays({ centers }: WinOverlaysProps) {
  const machine = useAtomValue(activeMachineAtom);
  const config = useAtomValue(resolvedConfigAtom);
  const commit = useAtomValue(lastCommitAtom);
  const slots = useAtomValue(winSlotsAtom);
  const elapsedMs = useAtomValue(winElapsedMsAtom);

  if (commit === null || slots.length === 0) return null;

  return (
    <>
      {slots.map((slot) => {
        const win = commit.result.wins[slot.winIdx];
        if (!win) return null;
        const opacity = slotOpacity(slot, elapsedMs);
        if (opacity <= 0) return null;
        const highlight = machine.highlightsForWin(win, config);
        return (
          <PaylineOverlay
            key={slot.winIdx}
            highlight={highlight}
            centers={centers}
            opacity={opacity}
          />
        );
      })}
    </>
  );
}
