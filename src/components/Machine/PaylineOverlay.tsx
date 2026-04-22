/** @jsxImportSource @emotion/react */
import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { CellHighlight } from '../../engine/types';
import { theme } from '../../theme';
import { CellCenters } from './useCellCenters';

const pulseGlow = keyframes`
  0%, 100% {
    filter:
      drop-shadow(0 0 4px ${theme.color.goldBright})
      drop-shadow(0 0 10px ${theme.color.gold});
  }
  50% {
    filter:
      drop-shadow(0 0 10px ${theme.color.goldBright})
      drop-shadow(0 0 22px ${theme.color.gold});
  }
`;

const cellPulse = keyframes`
  0%, 100% { opacity: 0.25; }
  50% { opacity: 0.6; }
`;

const Svg = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 6;
  overflow: visible;
`;

const Line = styled.polyline<{ jackpot: boolean }>`
  fill: none;
  stroke: ${(p) => (p.jackpot ? theme.color.bigWin : theme.color.goldBright)};
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  animation: ${pulseGlow} 1.2s ease-in-out infinite;
  vector-effect: non-scaling-stroke;
`;

const Dot = styled.circle<{ jackpot: boolean }>`
  fill: ${(p) => (p.jackpot ? theme.color.bigWin : theme.color.goldBright)};
  animation: ${cellPulse} 1.2s ease-in-out infinite;
`;

interface PaylineOverlayProps {
  highlight: CellHighlight | null;
  centers: CellCenters;
  /**
   * Top-level opacity for the whole overlay. Driven externally by
   * useWinDisplay — the hook computes a ripple shape based on each
   * slot's position within its display window. Use 1 for classic
   * single-highlight behavior.
   */
  opacity?: number;
}

/**
 * Draws a winning payline as an SVG overlay above the reel grid.
 * Expects cell centers in percentage coordinates. The overlay's
 * visibility is controlled by `opacity`, leaving the internal glow
 * pulse independent — line/dots still shimmer on their own while
 * the parent fades them in and out.
 *
 * Renders nothing when there's no active highlight, no cells to show,
 * or centers haven't been measured yet.
 */
export function PaylineOverlay({
  highlight,
  centers,
  opacity = 1,
}: PaylineOverlayProps) {
  if (!highlight || highlight.cells.length === 0 || centers.cols.length === 0) {
    return null;
  }
  if (opacity <= 0) return null;

  const jackpot = highlight.variant === 'jackpot';
  const cx = (col: number) => centers.cols[col] ?? 0;
  const cy = (row: number) => centers.rows[row] ?? 0;

  return (
    <Svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity }}>
      {highlight.line && highlight.line.length >= 2 && (
        <Line
          jackpot={jackpot}
          points={highlight.line.map((p) => `${cx(p.col)},${cy(p.row)}`).join(' ')}
        />
      )}
      {highlight.cells.map((p, i) => (
        <Dot key={i} jackpot={jackpot} cx={cx(p.col)} cy={cy(p.row)} r={2.5} />
      ))}
    </Svg>
  );
}
