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

/**
 * Horizontal offset (% of grid width) for a payline's float toast,
 * so multiple wins don't pile up at the same x coordinate.
 *
 * Every payline on a 3-reel machine has the same geometric centroid
 * x (50%), so centroid alone doesn't separate them horizontally. We
 * slot each payline into a fixed position based on its index in the
 * config's ordered payline list — deterministic, consistent across
 * spins (the same line always lives in the same spot), and scales to
 * any payline count. Spread covers ±SPREAD/2 of the grid centered at
 * the centroid.
 */
const STAGGER_SPREAD_PCT = 44;
function horizontalOffsetPct(paylineIdx: number, paylineCount: number): number {
  if (paylineCount <= 1 || paylineIdx < 0) return 0;
  const step = STAGGER_SPREAD_PCT / (paylineCount - 1);
  return (paylineIdx - (paylineCount - 1) / 2) * step;
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

        // Stagger horizontally by the payline's index in config.paylines.
        // Falls back to centered (idx = -1) if the win's meta doesn't
        // identify a payline — shouldn't happen for the fruit machine but
        // a future machine might not emit paylineId.
        const paylineId = (win.meta?.paylineId as string | undefined) ?? null;
        const paylineIdx = paylineId
          ? config.paylines.findIndex((p) => p.id === paylineId)
          : -1;
        const offsetPct = horizontalOffsetPct(paylineIdx, config.paylines.length);

        const style: CSSProperties = {
          left: `calc(${anchor.x}% + ${offsetPct}%)`,
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
