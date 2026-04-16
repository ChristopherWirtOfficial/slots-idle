/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { useAtomValue } from 'jotai';
import { CSSProperties } from 'react';
import { PrimitiveAtom } from 'jotai';
import { frameTimeAtom, ReelAnimState } from '../state/reels';
import { easeOut } from '../game/animation';
import { theme } from '../theme';
import { SlotSymbol } from '../game/symbols';

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

const Cell = styled.div<{ color: string; blurred: boolean }>`
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
  filter: ${(p) => (p.blurred ? 'blur(2px)' : 'none')};
`;

function CellView({ symbol, blurred }: { symbol: SlotSymbol; blurred: boolean }) {
  return (
    <Cell color={symbol.color} blurred={blurred}>
      {symbol.glyph}
    </Cell>
  );
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

  // Motion blur only while moving quickly — last ~15% of spin sharpens the result.
  const blurred = t < 0.85;

  return (
    <Strip
      style={{ ['--cells-scrolled' as string]: cellsScrolled } as CSSProperties}
    >
      {state.strip.map((sym, i) => (
        <CellView key={i} symbol={sym} blurred={blurred} />
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
          <CellView symbol={state.symbol} blurred={false} />
        </Strip>
      ) : (
        <SpinningReel state={state} />
      )}
    </ReelFrame>
  );
}
