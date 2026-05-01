/** @jsxImportSource @emotion/react */
import { css, keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { useAtomValue } from 'jotai';
import { ReactNode } from 'react';
import { jackpotShakingAtom } from '../../state/winDisplay';
import { theme } from '../../theme';

const shake = keyframes`
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-5px, 2px); }
  20% { transform: translate(5px, -2px); }
  30% { transform: translate(-4px, 1px); }
  40% { transform: translate(4px, -1px); }
  50% { transform: translate(-3px, 1px); }
  60% { transform: translate(3px, 0); }
  70% { transform: translate(-2px, 0); }
  80% { transform: translate(1px, 0); }
`;

const Shell = styled.section<{ shaking: boolean }>`
  position: relative;
  padding: clamp(14px, 3vw, 22px);
  background: linear-gradient(180deg, ${theme.color.velvet}, ${theme.color.bgDeep});
  border: 1px solid ${theme.color.goldDeep};
  border-radius: ${theme.radius.lg};
  box-shadow: 0 20px 40px -20px rgba(0, 0, 0, 0.8);
  width: 100%;
  ${(p) => p.shaking && css`animation: ${shake} 0.7s ease-out;`}
`;

/**
 * The outer cabinet. Shakes briefly on a jackpot-producing commit.
 * Shake duration is a pure derivation of effectiveNow vs the commit
 * timestamp (see jackpotShakingAtom) — the component reads the atom
 * and renders accordingly; no local lifecycle, no setTimeout.
 */
export function MachineCabinet({ children }: { children: ReactNode }) {
  const shaking = useAtomValue(jackpotShakingAtom);
  return <Shell shaking={shaking}>{children}</Shell>;
}
