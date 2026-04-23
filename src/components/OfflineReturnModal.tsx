/** @jsxImportSource @emotion/react */
import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { useAtomValue, useSetAtom } from 'jotai';
import { offlineReturnAtom } from '../state/offlineReturn';
import { theme } from '../theme';
import { formatNum } from '../util/format';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const riseIn = keyframes`
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(10, 5, 17, 0.82);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: ${fadeIn} 320ms ease-out;
`;

const Card = styled.div`
  background: linear-gradient(180deg, ${theme.color.velvet}, ${theme.color.bgDeep});
  border: 2px solid ${theme.color.gold};
  border-radius: ${theme.radius.lg};
  box-shadow: ${theme.shadow.frame};
  padding: clamp(24px, 5vw, 36px) clamp(22px, 5vw, 36px);
  max-width: 420px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  animation: ${riseIn} 480ms cubic-bezier(0.2, 1, 0.4, 1);
`;

const Kicker = styled.div`
  font-family: ${theme.font.script};
  font-size: 11px;
  letter-spacing: 0.4em;
  color: ${theme.color.ivoryDim};
  text-transform: uppercase;
  &::before, &::after {
    content: '◆';
    margin: 0 10px;
    color: ${theme.color.gold};
  }
`;

const Title = styled.h2`
  font-family: ${theme.font.display};
  font-weight: 500;
  font-style: italic;
  font-size: clamp(22px, 5vw, 28px);
  letter-spacing: 0.05em;
  color: ${theme.color.gold};
  margin: 0;
  text-align: center;
`;

const Duration = styled.div`
  font-family: ${theme.font.body};
  font-size: 14px;
  color: ${theme.color.ivoryDim};
  font-style: italic;
`;

const TotalBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin: 6px 0;
`;

const TotalLabel = styled.div`
  font-family: ${theme.font.script};
  font-size: 10px;
  letter-spacing: 0.3em;
  color: ${theme.color.ivoryDim};
  text-transform: uppercase;
`;

const TotalValue = styled.div`
  font-family: ${theme.font.display};
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  font-style: italic;
  font-size: clamp(36px, 9vw, 52px);
  color: ${theme.color.goldBright};
  text-shadow:
    0 2px 10px rgba(0, 0, 0, 0.8),
    0 0 22px rgba(212, 160, 74, 0.45);
`;

const Ledger = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border-top: 1px solid rgba(212, 160, 74, 0.2);
  border-bottom: 1px solid rgba(212, 160, 74, 0.2);
`;

const LedgerRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-family: ${theme.font.body};
  font-size: 13px;
  color: ${theme.color.ivoryDim};
`;

const LedgerValue = styled.span`
  font-variant-numeric: tabular-nums;
  color: ${theme.color.ivory};
  font-weight: 500;
`;

const ClaimButton = styled.button`
  font-family: ${theme.font.display};
  font-weight: 600;
  font-style: italic;
  font-size: 16px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: ${theme.color.black};
  background: linear-gradient(180deg, ${theme.color.goldBright}, ${theme.color.gold} 60%, ${theme.color.goldDeep});
  border: 1px solid ${theme.color.goldDeep};
  border-radius: ${theme.radius.md};
  padding: 12px 34px;
  cursor: pointer;
  box-shadow:
    0 3px 0 ${theme.color.goldDeep},
    0 6px 14px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  transition: transform 80ms, box-shadow 80ms;
  &:active {
    transform: translateY(2px);
    box-shadow:
      0 1px 0 ${theme.color.goldDeep},
      0 3px 8px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
  }
  &:hover {
    background: linear-gradient(180deg, #ffe4a0, ${theme.color.goldBright} 60%, ${theme.color.gold});
  }
`;

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 1) return 'Under a minute';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  if (minutes === 0) return `${hours} hour${hours === 1 ? '' : 's'}`;
  return `${hours}h ${minutes}m`;
}

/**
 * Ceremonial "while you were away" summary. Appears when catch-up
 * produced a non-trivial offline return. Dismisses on claim, clearing
 * the atom.
 */
export function OfflineReturnModal() {
  const ret = useAtomValue(offlineReturnAtom);
  const setRet = useSetAtom(offlineReturnAtom);
  if (ret === null) return null;

  const claim = () => setRet(null);

  return (
    <Backdrop onClick={claim}>
      <Card onClick={(e) => e.stopPropagation()}>
        <Kicker>The Parlour Kept Your Seat</Kicker>
        <Title>While you were away</Title>
        <Duration>{formatDuration(ret.elapsedMs)}</Duration>

        <TotalBox>
          <TotalLabel>Net winnings</TotalLabel>
          <TotalValue>+{formatNum(ret.chipsDelta)}</TotalValue>
        </TotalBox>

        <Ledger>
          <LedgerRow>
            <span>Spins played</span>
            <LedgerValue>{ret.spinsDelta.toLocaleString()}</LedgerValue>
          </LedgerRow>
          <LedgerRow>
            <span>Jackpots hit</span>
            <LedgerValue>{ret.jackpotsDelta}</LedgerValue>
          </LedgerRow>
        </Ledger>

        <ClaimButton onClick={claim}>Claim</ClaimButton>
      </Card>
    </Backdrop>
  );
}
