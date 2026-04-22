/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { useAtomValue } from 'jotai';
import { CSSProperties, useEffect, useRef } from 'react';
import {
  ReelAnimState,
  reelStateAtomFamily,
  SymWindow,
} from '../state/reels';
import { effectiveNowAtom } from '../state/clock';
import { rowCountAtom, wildAtom } from '../state/machine';
import { easeOut, velocityCellsPerFrame } from '../engine/animation';
import { theme } from '../theme';
import { Cell, WildConfig } from '../engine/types';
import { sfxReelTick } from '../audio/sfx';

const ReelFrame = styled.div`
  --cell-h: clamp(62px, 18vw, 100px);
  position: relative;
  width: clamp(74px, 22vw, 110px);
  height: calc(var(--cell-h) * var(--row-count, 3));
  background: linear-gradient(180deg, #100308 0%, #1f0818 50%, #100308 100%);
  border: 1px solid ${theme.color.gold};
  border-radius: ${theme.radius.md};
  box-shadow:
    inset 0 0 24px rgba(0, 0, 0, 0.9),
    inset 0 0 0 1px ${theme.color.goldDeep};
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent 0 4px,
      rgba(0, 0, 0, 0.18) 4px 5px
    );
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

const CellBox = styled.div<{ color: string }>`
  width: 100%;
  height: var(--cell-h);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${theme.font.display};
  font-weight: 700;
  font-size: clamp(34px, 10vw, 56px);
  line-height: 1;
  color: ${(p) => p.color};
  text-shadow:
    0 2px 0 rgba(0, 0, 0, 0.6),
    0 0 10px ${(p) => p.color}55;
`;

/**
 * Render one grid cell. Symbol cells show the symbol glyph/color.
 * Wild cells render the machine's configured wild glyph/color.
 */
function CellView({ cell, wild }: { cell: Cell; wild: WildConfig }) {
  if (cell.kind === 'wild') {
    return <CellBox color={wild.color}>{wild.glyph}</CellBox>;
  }
  return <CellBox color={cell.symbol.color}>{cell.symbol.glyph}</CellBox>;
}

function RestingWindow({ window, wild }: { window: SymWindow; wild: WildConfig }) {
  return (
    <Strip>
      {window.map((c, i) => (
        <CellView key={i} cell={c} wild={wild} />
      ))}
    </Strip>
  );
}

function SpinningReel({
  state,
  wild,
}: {
  state: Extract<ReelAnimState, { kind: 'spinning' }>;
  wild: WildConfig;
}) {
  const frameTime = useAtomValue(effectiveNowAtom);
  const elapsed = Math.max(0, frameTime - state.startTime);
  const t = Math.min(1, elapsed / state.duration);
  const cellsScrolled = easeOut(t) * state.distanceCells;

  const vel = velocityCellsPerFrame(t, state.distanceCells, state.duration);
  const blurPx = Math.min(10, vel * 6);

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
      {state.strip.map((c, i) => (
        <CellView key={i} cell={c} wild={wild} />
      ))}
    </Strip>
  );
}

interface ReelProps {
  reelIdx: number;
}

export function Reel({ reelIdx }: ReelProps) {
  const state = useAtomValue(reelStateAtomFamily(reelIdx));
  const rowCount = useAtomValue(rowCountAtom);
  const wild = useAtomValue(wildAtom);

  return (
    <ReelFrame
      data-reel={true}
      style={{ ['--row-count' as string]: rowCount } as CSSProperties}
    >
      {state.kind === 'resting' ? (
        <RestingWindow window={state.window} wild={wild} />
      ) : (
        <SpinningReel state={state} wild={wild} />
      )}
    </ReelFrame>
  );
}
