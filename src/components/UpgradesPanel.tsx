/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { useAtomValue } from 'jotai';
import { allUpgradesAtom } from '../state/machine';
import { theme } from '../theme';

const Panel = styled.aside`
  background: linear-gradient(180deg, ${theme.color.velvet}, ${theme.color.bgDeep});
  border-radius: ${theme.radius.lg};
  padding: clamp(18px, 3.5vw, 28px) clamp(16px, 3vw, 24px);
  box-shadow: ${theme.shadow.frame};
  width: 100%;
`;

const PanelTitle = styled.h2`
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

const PanelSub = styled.div`
  font-family: ${theme.font.script};
  font-size: 11px;
  letter-spacing: 0.3em;
  color: ${theme.color.ivoryDim};
  text-transform: uppercase;
  text-align: center;
  margin-bottom: 20px;
  &::before, &::after {
    content: '◆';
    margin: 0 10px;
    color: ${theme.color.gold};
  }
`;

const Row = styled.button<{ affordable: boolean; maxed: boolean }>`
  display: block;
  width: 100%;
  text-align: left;
  background: ${(p) =>
    p.maxed
      ? 'rgba(212, 160, 74, 0.08)'
      : p.affordable
      ? 'rgba(212, 160, 74, 0.12)'
      : 'rgba(10, 5, 17, 0.5)'};
  border: 1px solid
    ${(p) => (p.affordable && !p.maxed ? theme.color.gold : 'rgba(212, 160, 74, 0.2)')};
  border-radius: ${theme.radius.md};
  padding: 12px 14px;
  margin-bottom: 10px;
  cursor: ${(p) => (p.affordable && !p.maxed ? 'pointer' : 'default')};
  color: ${theme.color.ivory};
  transition: all 120ms;
  position: relative;

  &:hover:not(:disabled) {
    background: ${(p) =>
      p.affordable && !p.maxed ? 'rgba(212, 160, 74, 0.22)' : undefined};
    transform: ${(p) => (p.affordable && !p.maxed ? 'translateX(2px)' : 'none')};
  }

  &:disabled {
    opacity: ${(p) => (p.maxed ? 0.7 : 0.5)};
  }
`;

const RowTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
`;

const UpgradeName = styled.div`
  font-family: ${theme.font.display};
  font-size: 17px;
  font-weight: 600;
  font-style: italic;
  color: ${theme.color.gold};
  letter-spacing: 0.04em;
`;

const Level = styled.span`
  font-family: ${theme.font.mono};
  font-size: 11px;
  color: ${theme.color.ivoryDim};
  letter-spacing: 0.1em;
`;

const Blurb = styled.div`
  font-family: ${theme.font.body};
  font-size: 13px;
  line-height: 1.35;
  color: ${theme.color.ivoryDim};
  margin: 4px 0 6px;
`;

const RowBottom = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-family: ${theme.font.mono};
  font-size: 12px;
`;

const Effect = styled.span`
  color: ${theme.color.goldBright};
  font-family: ${theme.font.display};
  font-style: italic;
  font-size: 14px;
`;

const Cost = styled.span<{ affordable: boolean }>`
  color: ${(p) => (p.affordable ? theme.color.goldBright : theme.color.oxbloodBright)};
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  letter-spacing: 0.05em;
`;

interface UpgradesPanelProps {
  levels: Record<string, number>;
  costs: Record<string, number>;
  chips: number;
  onBuy: (id: string) => void;
}

export function UpgradesPanel({ levels, costs, chips, onBuy }: UpgradesPanelProps) {
  const upgrades = useAtomValue(allUpgradesAtom);
  return (
    <Panel>
      <PanelTitle>The Parlour</PanelTitle>
      <PanelSub>Improvements</PanelSub>

      {upgrades.map((u) => {
        const lvl = levels[u.id] ?? 0;
        const cost = costs[u.id] ?? 0;
        const maxed = lvl >= u.maxLevel;
        const affordable = !maxed && chips >= cost;
        const effectLabel = u.format ? u.format(lvl) : `Level ${lvl}`;
        return (
          <Row
            key={u.id}
            affordable={affordable}
            maxed={maxed}
            disabled={!affordable}
            onClick={() => affordable && onBuy(u.id)}
          >
            <RowTop>
              <UpgradeName>{u.name}</UpgradeName>
              <Level>Lv {lvl}{maxed ? ' · MAX' : ` / ${u.maxLevel}`}</Level>
            </RowTop>
            <Blurb>{u.blurb}</Blurb>
            <RowBottom>
              <Effect>{effectLabel}</Effect>
              {!maxed && (
                <Cost affordable={affordable}>
                  {cost.toLocaleString()} <span css={css`color:${theme.color.ivoryDim};font-weight:400;`}>chips</span>
                </Cost>
              )}
            </RowBottom>
          </Row>
        );
      })}
    </Panel>
  );
}
