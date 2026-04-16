/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { theme } from '../theme';
import { prestigeMultiplier } from '../game/upgrades';

const Panel = styled.aside`
  background: linear-gradient(180deg, ${theme.color.velvet}, ${theme.color.bgDeep});
  border-radius: ${theme.radius.lg};
  padding: clamp(18px, 3.5vw, 28px) clamp(16px, 3vw, 24px);
  box-shadow: ${theme.shadow.frame};
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Title = styled.h2`
  font-family: ${theme.font.display};
  font-weight: 400;
  font-style: italic;
  font-size: 22px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${theme.color.gold};
  margin: 0 0 4px;
  text-align: center;
`;

const Sub = styled.div`
  font-family: ${theme.font.script};
  font-size: 11px;
  letter-spacing: 0.3em;
  color: ${theme.color.ivoryDim};
  text-transform: uppercase;
  text-align: center;
  margin-bottom: 12px;
  &::before, &::after {
    content: '◆';
    margin: 0 10px;
    color: ${theme.color.gold};
  }
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 6px 0;
  border-bottom: 1px dotted rgba(212, 160, 74, 0.15);
  &:last-of-type { border-bottom: none; }
`;

const StatLabel = styled.span`
  font-family: ${theme.font.body};
  font-size: 13px;
  color: ${theme.color.ivoryDim};
  letter-spacing: 0.05em;
`;

const StatValue = styled.span`
  font-family: ${theme.font.display};
  font-style: italic;
  font-weight: 600;
  font-size: 16px;
  color: ${theme.color.gold};
`;

const PrestigeCard = styled.div<{ ready: boolean }>`
  background: ${(p) =>
    p.ready
      ? `linear-gradient(180deg, ${theme.color.oxblood}, #3a0818)`
      : 'rgba(10, 5, 17, 0.5)'};
  border: 2px solid ${(p) => (p.ready ? theme.color.goldBright : 'rgba(212,160,74,0.2)')};
  border-radius: ${theme.radius.md};
  padding: 16px;
  text-align: center;
`;

const PrestigeTitle = styled.div`
  font-family: ${theme.font.display};
  font-style: italic;
  font-size: 16px;
  color: ${theme.color.gold};
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 6px;
`;

const PrestigeBlurb = styled.div`
  font-family: ${theme.font.body};
  font-size: 12px;
  color: ${theme.color.ivoryDim};
  line-height: 1.4;
  margin-bottom: 10px;
`;

const PrestigeButton = styled.button<{ disabled: boolean }>`
  width: 100%;
  font-family: ${theme.font.display};
  font-style: italic;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  background: ${(p) =>
    p.disabled ? 'rgba(212,160,74,0.15)' : 'linear-gradient(180deg, #ff3860, #a01028)'};
  color: ${(p) => (p.disabled ? theme.color.ivoryDim : theme.color.ivory)};
  border: 1px solid ${(p) => (p.disabled ? 'rgba(212,160,74,0.2)' : theme.color.goldBright)};
  border-radius: ${theme.radius.sm};
  padding: 10px;
  cursor: ${(p) => (p.disabled ? 'not-allowed' : 'pointer')};
  transition: transform 80ms;
  &:active:not(:disabled) { transform: translateY(1px); }
`;

const ResetBtn = styled.button`
  font-family: ${theme.font.mono};
  font-size: 10px;
  letter-spacing: 0.2em;
  background: none;
  border: none;
  color: rgba(196, 184, 150, 0.4);
  cursor: pointer;
  padding: 4px;
  text-transform: uppercase;
  &:hover { color: ${theme.color.oxbloodBright}; }
`;

interface StatsProps {
  chips: number;
  lifetimeWinnings: number;
  totalEverWon: number;
  spinsTotal: number;
  jackpots: number;
  highRollerPoints: number;
  prestigePending: number;
  globalMult: number;
  passiveAmount: number;
  passiveRateMs: number;
  onPrestige: () => void;
  onReset: () => void;
}

export function StatsPanel({
  lifetimeWinnings,
  totalEverWon,
  spinsTotal,
  jackpots,
  highRollerPoints,
  prestigePending,
  globalMult,
  passiveAmount,
  passiveRateMs,
  onPrestige,
  onReset,
}: StatsProps) {
  const nextMult = prestigeMultiplier(highRollerPoints + prestigePending);
  const chipsPerSec = passiveAmount / (passiveRateMs / 1000);
  return (
    <Panel>
      <div>
        <Title>Ledger</Title>
        <Sub>House Records</Sub>
        <StatRow><StatLabel>Total spins</StatLabel><StatValue>{spinsTotal.toLocaleString()}</StatValue></StatRow>
        <StatRow><StatLabel>Lifetime winnings</StatLabel><StatValue>{lifetimeWinnings.toLocaleString()}</StatValue></StatRow>
        <StatRow><StatLabel>All-time won</StatLabel><StatValue>{totalEverWon.toLocaleString()}</StatValue></StatRow>
        <StatRow><StatLabel>Jackpots hit</StatLabel><StatValue>{jackpots}</StatValue></StatRow>
        <StatRow><StatLabel>Payout multiplier</StatLabel><StatValue>×{globalMult.toFixed(2)}</StatValue></StatRow>
        <StatRow><StatLabel>Passive income</StatLabel><StatValue>{chipsPerSec.toFixed(2)} / s</StatValue></StatRow>
      </div>

      <PrestigeCard ready={prestigePending > 0}>
        <PrestigeTitle>High Roller</PrestigeTitle>
        <PrestigeBlurb>
          {highRollerPoints > 0 && (
            <>You hold <b style={{color: theme.color.goldBright}}>{highRollerPoints}</b> HRP — permanent ×{prestigeMultiplier(highRollerPoints).toFixed(2)} winnings.<br/></>
          )}
          {prestigePending > 0
            ? `Cash out now for +${prestigePending} HRP. New total mult: ×${nextMult.toFixed(2)}.`
            : 'Win 10,000 chips this run to earn your first HRP.'}
        </PrestigeBlurb>
        <PrestigeButton
          disabled={prestigePending === 0}
          onClick={() => prestigePending > 0 && onPrestige()}
        >
          {prestigePending > 0 ? `Cash out · +${prestigePending}` : 'Locked'}
        </PrestigeButton>
      </PrestigeCard>

      <div style={{ textAlign: 'center' }}>
        <ResetBtn onClick={onReset}>Burn it all down</ResetBtn>
      </div>
    </Panel>
  );
}
