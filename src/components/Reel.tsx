/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { useAtomValue } from 'jotai';
import { CSSProperties, useEffect, useRef } from 'react';
import { PrimitiveAtom } from 'jotai';
import { frameTimeAtom, ReelAnimState } from '../state/reels';
import { easeOut, velocityCellsPerFrame } from '../game/animation';
import { theme } from '../theme';
import { SlotSymbol } from '../game/symbols';
import { sfxReelTick } from '../audio/sfx';

const ReelFrame = styled.div`
  --cell-h: clamp(92px, 28vw, 140px);
  position: relative;
  width: clamp(72px, 22vw, 108px);
  height: var(--cell-h);
  background: linear-gradient(180deg, #1a0511 0%, #2a0a1f 50%, #1a0511 100%);
  border: 2px solid ${theme.color.gold};
  border-radius: ${theme.radius.md};
  box-shadow:
    inset 0 0 24px rgba(0, 0, 0, 0.9),
    inset 0 0 0 1px ${theme.color.goldDeep},
    0 0 0 4px ${theme.color.bg},
    0 0 0 5px ${theme.color.goldDeep};
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent 0 4px,
      rgba(0, 0, 0, 0.3) 4px 5px
    );
    pointer-events: none;
    opacity: 0.3;
    z-index: 2;
  }

  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      ${theme.color.gold},
      transparent
    );
    opacity: 0.4;
    pointer-events: none;
    z-index: 2;
  }
`;

const Strip = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  transform: translateY(calc(var(--cells-scrolled, 0) * var(--cell-h) * -1));
  will-change: transform;
`;

const Cell = styled.div<{ color: string }>`
  width: 100%;
  height: var(--cell-h);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${theme.font.display};
  font-weight: 700;
  font-size: clamp(46px, 14vw, 72px);
  line-height: 1;
  color: ${(p) => p.color};
  text-shadow:
    0 2px 0 rgba(0, 0, 0, 0.6),
    0 0 12px ${(p) => p.color}66;
`;

function CellView({ symbol }: { symbol: SlotSymbol }) {
  return <Cell color={symbol.color}>{symbol.glyph}</Cell>;
}

/**
 * Renders an active spinning reel — reads frame time and recomputes offset
 * each render. Split from Reel so resting reels don't subscribe to frame time.
 */
function SpinningReel({
  state,
}: {
  state: Extract<ReelAnimState, { kind: 'spinning' }>;
}) {
  const frameTime = useAtomValue(frameTimeAtom);
  const elapsed = Math.max(0, frameTime - state.startTime);
  const t = Math.min(1, elapsed / state.duration);
  const cellsScrolled = easeOut(t) * state.distanceCells;

  // Velocity-scaled blur smooths the transition through the aliasing zone
  // (~0.5-2 cells/frame) that would otherwise read as wagon-wheeling.
  const vel = velocityCellsPerFrame(t, state.distanceCells, state.duration);
  const blurPx = Math.min(10, vel * 6);

  // Per-cell tick: fire a short click each time an integer cell boundary
  // is crossed. Fresh ref per SpinningReel mount (one per spin), so no
  // stale state to clear between spins.
  const lastCellIntRef = useRef(0);
  useEffect(() => {
    const intCells = Math.floor(cellsScrolled);
    if (intCells > lastCellIntRef.current && vel > 0.02) {
      sfxReelTick(vel);
      lastCellIntRef.current = intCells;
    }
  });

  return (
    <Strip
      style={{
        ['--cells-scrolled' as string]: cellsScrolled,
        filter: blurPx > 0.1 ? `blur(${blurPx.toFixed(2)}px)` : 'none',
      } as CSSProperties}
    >
      {state.strip.map((sym, i) => (
        <CellView key={i} symbol={sym} />
      ))}
    </Strip>
  );
}

interface ReelProps {
  reelAtom: PrimitiveAtom<ReelAnimState>;
}

export function Reel({ reelAtom }: ReelProps) {
  const state = useAtomValue(reelAtom);

  return (
    <ReelFrame>
      {state.kind === 'resting' ? (
        <Strip>
          <CellView symbol={state.symbol} />
        </Strip>
      ) : (
        <SpinningReel state={state} />
      )}
    </ReelFrame>
  );
}
