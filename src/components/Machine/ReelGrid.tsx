/** @jsxImportSource @emotion/react */
import { css, keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { ReactNode, Ref } from 'react';
import { theme } from '../../theme';

const glow = keyframes`
  0%, 100% { box-shadow: inset 0 0 0 1px ${theme.color.goldDeep}, 0 0 0 0 transparent; }
  50% { box-shadow: inset 0 0 0 1px ${theme.color.goldBright}, 0 0 40px ${theme.color.goldBright}44; }
`;

const GridBox = styled.div<{ winning: boolean }>`
  position: relative;
  display: flex;
  gap: clamp(6px, 1.5vw, 10px);
  justify-content: center;
  padding: clamp(10px, 2vw, 14px);
  background: linear-gradient(180deg, ${theme.color.bgDeep}, ${theme.color.black});
  border-radius: ${theme.radius.md};
  ${(p) => p.winning && css`animation: ${glow} 1s ease-out;`}
`;

interface ReelGridProps {
  justWon: boolean;
  ref?: Ref<HTMLDivElement>;
  children: ReactNode;
}

/**
 * Holds the reels and any on-grid overlays. Pulses briefly after a winning
 * spin. `ref` is forwarded to the underlying div so parent hooks can
 * measure cell geometry.
 */
export function ReelGrid({ justWon, ref, children }: ReelGridProps) {
  return (
    <GridBox ref={ref} winning={justWon}>
      {children}
    </GridBox>
  );
}
