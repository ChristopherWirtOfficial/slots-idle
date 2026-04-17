/** @jsxImportSource @emotion/react */
import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { CellHighlight } from '../../engine/types';
import { theme } from '../../theme';
import { CellCenters } from './useCellCenters';

const fadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;

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
  animation:
    ${fadeIn} 0.3s ease-out forwards,
    ${pulseGlow} 1.2s ease-in-out 0.3s infinite;
  vector-effect: non-scaling-stroke;
`;

const Dot = styled.circle<{ jackpot: boolean }>`
  fill: ${(p) => (p.jackpot ? theme.color.bigWin : theme.color.goldBright)};
  animation: ${cellPulse} 1.2s ease-in-out infinite;
`;

interface PaylineOverlayProps {
  highlight: CellHighlight | null;
  centers: CellCenters;
  /** Changes when the active win cycles — remounts the SVG for a fresh fade-in. */
  keyId: string | number;
}

/**
 * Draws the current active winning payline as an SVG overlay above the
 * reel grid. Expects cell centers in percentage coordinates.
 *
 * Renders nothing when there's no active highlight, no cells to show,
 * or centers haven't been measured yet.
 */
export function PaylineOverlay({ highlight, centers, keyId }: PaylineOverlayProps) {
  if (!highlight || highlight.cells.length === 0 || centers.cols.length === 0) {
    return null;
  }

  const jackpot = highlight.variant === 'jackpot';
  const cx = (col: number) => centers.cols[col] ?? 0;
  const cy = (row: number) => centers.rows[row] ?? 0;

  return (
    <Svg key={keyId} viewBox="0 0 100 100" preserveAspectRatio="none">
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
