/** @jsxImportSource @emotion/react */
import { css, keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { SlotSymbol } from '../game/symbols';
import { theme } from '../theme';

const spinAnim = keyframes`
  0% { transform: translateY(0); filter: blur(0); }
  40% { transform: translateY(-8px); filter: blur(2px); }
  100% { transform: translateY(0); filter: blur(0); }
`;

const ReelFrame = styled.div`
  position: relative;
  width: clamp(72px, 22vw, 108px);
  height: clamp(92px, 28vw, 140px);
  background: linear-gradient(180deg, #1a0511 0%, #2a0a1f 50%, #1a0511 100%);
  border: 2px solid ${theme.color.gold};
  border-radius: ${theme.radius.md};
  display: flex;
  align-items: center;
  justify-content: center;
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
    background:
      repeating-linear-gradient(
        0deg,
        transparent 0 4px,
        rgba(0, 0, 0, 0.3) 4px 5px
      );
    pointer-events: none;
    opacity: 0.3;
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
  }
`;

const Glyph = styled.div<{ color: string; spinning: boolean }>`
  font-size: clamp(46px, 14vw, 72px);
  line-height: 1;
  color: ${(p) => p.color};
  text-shadow:
    0 2px 0 rgba(0, 0, 0, 0.6),
    0 0 12px ${(p) => p.color}66;
  animation: ${(p) => (p.spinning ? spinAnim : 'none')} 0.3s ease-in-out infinite;
  font-family: ${theme.font.display};
  font-weight: 700;
  z-index: 1;
`;

interface ReelProps {
  symbol: SlotSymbol;
  spinning: boolean;
  delay?: number;
}

export function Reel({ symbol, spinning, delay = 0 }: ReelProps) {
  return (
    <ReelFrame>
      <Glyph
        color={symbol.color}
        spinning={spinning}
        css={css`
          animation-delay: ${delay}ms;
        `}
      >
        {symbol.glyph}
      </Glyph>
    </ReelFrame>
  );
}
