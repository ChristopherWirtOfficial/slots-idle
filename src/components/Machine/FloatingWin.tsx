/** @jsxImportSource @emotion/react */
import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { theme } from '../../theme';

const rise = keyframes`
  0% { opacity: 0; transform: translate(-50%, 0) scale(0.8); }
  15% { opacity: 1; transform: translate(-50%, -14px) scale(1.05); }
  100% { opacity: 0; transform: translate(-50%, -90px) scale(1); }
`;

const Wrap = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  pointer-events: none;
  z-index: 10;
`;

type Tier = 'small' | 'big' | 'jackpot';

const FONT_SIZE: Record<Tier, string> = {
  small: 'clamp(24px, 6vw, 32px)',
  big: 'clamp(32px, 8vw, 44px)',
  jackpot: 'clamp(42px, 12vw, 62px)',
};

const Text = styled.div<{ tier: Tier }>`
  font-family: ${theme.font.display};
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  font-style: italic;
  font-size: ${(p) => FONT_SIZE[p.tier]};
  color: ${(p) => (p.tier === 'jackpot' ? theme.color.bigWin : theme.color.goldBright)};
  text-shadow:
    0 2px 12px rgba(0, 0, 0, 0.9),
    0 0 24px
      ${(p) => (p.tier === 'jackpot' ? theme.color.bigWin : theme.color.goldBright)};
  white-space: nowrap;
  animation: ${rise} 1.4s ease-out forwards;
`;

interface FloatingWinProps {
  amount: number;
  isJackpot: boolean;
  /** Amount threshold at which the toast renders in "big" size. */
  bigThreshold: number;
}

/** Animated +N chip toast rising from the grid center. */
export function FloatingWin({ amount, isJackpot, bigThreshold }: FloatingWinProps) {
  const tier: Tier = isJackpot ? 'jackpot' : amount >= bigThreshold ? 'big' : 'small';
  const label = isJackpot
    ? `★ +${amount.toLocaleString()} ★`
    : `+${amount.toLocaleString()}`;

  return (
    <Wrap>
      <Text tier={tier}>{label}</Text>
    </Wrap>
  );
}
