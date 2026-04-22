/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { useAtomValue } from 'jotai';
import { CSSProperties } from 'react';
import {
  Machine as MachineDef,
  MachineWin,
  ResolvedMachineConfig,
} from '../../engine/types';
import { activeMachineAtom, resolvedConfigAtom } from '../../state/machine';
import { lastCommitAtom } from '../../state/session';
import {
  lineFloatAnim,
  winElapsedMsAtom,
  winSlotsAtom,
} from '../../state/winDisplay';
import { theme } from '../../theme';
import { formatNum } from '../../util/format';
import { CellCenters } from './useCellCenters';

const FloatWrap = styled.div`
  position: absolute;
  pointer-events: none;
  z-index: 9;
  transform: translate(-50%, -50%);
  white-space: nowrap;
  font-family: ${theme.font.display};
  font-variant-numeric: tabular-nums;
  font-style: italic;
  font-weight: 700;
  text-shadow:
    0 1px 6px rgba(0, 0, 0, 0.9),
    0 0 14px rgba(0, 0, 0, 0.6);
`;

type Tier = 'small' | 'big' | 'jackpot';

const FONT_SIZE: Record<Tier, string> = {
  small: 'clamp(14px, 3.2vw, 18px)',
  big: 'clamp(18px, 4vw, 22px)',
  jackpot: 'clamp(22px, 5vw, 28px)',
};

const COLOR: Record<Tier, string> = {
  small: theme.color.goldBright,
  big: theme.color.goldBright,
  jackpot: theme.color.bigWin,
};

/** Centroid of the winning cells in % coords, or null if centers aren't measured. */
function centroid(
  win: MachineWin,
  machine: MachineDef,
  config: ResolvedMachineConfig,
  centers: CellCenters,
): { x: number; y: number } | null {
  if (centers.cols.length === 0) return null;
  const highlight = machine.highlightsForWin(win, config);
  if (!highlight || highlight.cells.length === 0) return null;
  let sx = 0,
    sy = 0,
    n = 0;
  for (const cell of highlight.cells) {
    const cx = centers.cols[cell.col];
    const cy = centers.rows[cell.row];
    if (cx === undefined || cy === undefined) continue;
    sx += cx;
    sy += cy;
    n += 1;
  }
  if (n === 0) return null;
  return { x: sx / n, y: sy / n };
}

/** Decide toast tier from the win. */
function tierFor(win: MachineWin, bet: number): Tier {
  if (win.isJackpot) return 'jackpot';
  if (win.payout.gte(bet * 5)) return 'big';
  return 'small';
}

interface LineFloatsProps {
  centers: CellCenters;
  bet: number;
}

/**
 * Per-line payout toasts that rise from each winning payline's
 * centroid, synchronized with the ripple — each float starts when its
 * slot starts. Separate from the spin-total FloatingWin, which still
 * summarizes the whole spin.
 */
export function LineFloats({ centers, bet }: LineFloatsProps) {
  const commit = useAtomValue(lastCommitAtom);
  const slots = useAtomValue(winSlotsAtom);
  const elapsedMs = useAtomValue(winElapsedMsAtom);
  const machine = useAtomValue(activeMachineAtom);
  const config = useAtomValue(resolvedConfigAtom);

  if (commit === null || slots.length === 0) return null;

  return (
    <>
      {slots.map((slot) => {
        const anim = lineFloatAnim(slot.startMs, elapsedMs);
        if (anim === null) return null;
        const win = commit.result.wins[slot.winIdx];
        if (!win) return null;
        const anchor = centroid(win, machine, config, centers);
        if (anchor === null) return null;

        const tier = tierFor(win, bet);
        const glyph = win.symbol.glyph;
        const label =
          tier === 'jackpot'
            ? `${glyph} +${formatNum(win.payout)} ${glyph}`
            : `${glyph} +${formatNum(win.payout)}`;

        const style: CSSProperties = {
          left: `${anchor.x}%`,
          top: `calc(${anchor.y}% - ${anim.riseY}px)`,
          opacity: anim.opacity,
          fontSize: FONT_SIZE[tier],
          color: COLOR[tier],
        };

        return (
          <FloatWrap key={slot.winIdx} style={style}>
            {label}
          </FloatWrap>
        );
      })}
    </>
  );
}
