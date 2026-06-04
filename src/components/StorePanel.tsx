/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import Decimal from 'break_infinity.js';
import { useAtomValue, useSetAtom } from 'jotai';
import { theme } from '../theme';
import { formatNum } from '../util/format';
import { highRollerPointsAtom } from '../state/prestige';
import { storeCostsAtom, storeLevelsAtom, storeTracksAtom } from '../state/store';
import { buyStoreTrackAtom } from '../state/actions';

const Panel = styled.aside`
  background: linear-gradient(180deg, ${theme.color.oxblood}, ${theme.color.bgDeep});
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
  color: ${theme.color.goldBright};
  margin: 0 0 4px;
  text-align: center;
`;

const Balance = styled.div`
  font-family: ${theme.font.script};
  font-size: 12px;
  letter-spacing: 0.2em;
  color: ${theme.color.ivoryDim};
  text-transform: uppercase;
  text-align: center;
  margin-bottom: 20px;
  b { color: ${theme.color.goldBright}; font-style: normal; }
  &::before, &::after { content: '◆'; margin: 0 10px; color: ${theme.color.gold}; }
`;

const Row = styled.button<{ affordable: boolean; payout: boolean }>`
  display: block;
  width: 100%;
  text-align: left;
  background: ${(p) =>
    p.payout
      ? 'rgba(244, 208, 122, 0.1)'
      : p.affordable
      ? 'rgba(212, 160, 74, 0.12)'
      : 'rgba(10, 5, 17, 0.5)'};
  border: 1px solid
    ${(p) =>
      p.payout
        ? theme.color.goldBright
        : p.affordable
        ? theme.color.gold
        : 'rgba(212, 160, 74, 0.2)'};
  border-radius: ${theme.radius.md};
  padding: 12px 14px;
  margin-bottom: 10px;
  cursor: ${(p) => (p.affordable ? 'pointer' : 'default')};
  color: ${theme.color.ivory};
  transition: all 120ms;

  &:hover:not(:disabled) {
    background: ${(p) => (p.affordable ? 'rgba(212, 160, 74, 0.22)' : undefined)};
    transform: ${(p) => (p.affordable ? 'translateX(2px)' : 'none')};
  }
  &:disabled .dimOnDisabled { opacity: 0.55; }
`;

const RowTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
`;

const TrackName = styled.div`
  font-family: ${theme.font.display};
  font-size: 16px;
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

const RowBottom = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 4px;
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
  color: ${(p) => (p.affordable ? theme.color.goldBright : '#e06a82')};
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  letter-spacing: 0.05em;
`;

/**
 * The prestige store. Hidden until the player holds points or has bought
 * a track — brand-new players never see it. Tracks compete for one pool
 * of High-Roller Points: a global payout boost vs. per-upgrade discounts.
 */
export function StorePanel() {
  const points = useAtomValue(highRollerPointsAtom);
  const tracks = useAtomValue(storeTracksAtom);
  const levels = useAtomValue(storeLevelsAtom);
  const costs = useAtomValue(storeCostsAtom);
  const onBuy = useSetAtom(buyStoreTrackAtom);

  const anyLevel = Object.values(levels).some((l) => l > 0);
  if (points.lte(0) && !anyLevel) return null;

  return (
    <Panel>
      <PanelTitle>High Roller Store</PanelTitle>
      <Balance>
        <b>{formatNum(points)}</b> markers in hand
      </Balance>

      {tracks.map((t) => {
        const lvl = levels[t.id] ?? 0;
        const cost = costs[t.id] ?? new Decimal(0);
        const capped = t.maxLevel > 0 && lvl >= t.maxLevel;
        const affordable = !capped && points.gte(cost);
        const payout = t.kind === 'payout';
        return (
          <Row
            key={t.id}
            payout={payout}
            affordable={affordable}
            disabled={!affordable}
            onClick={() => affordable && onBuy(t.id)}
          >
            <RowTop>
              <TrackName className="dimOnDisabled">
                {payout ? t.name : `${t.name} — discount`}
              </TrackName>
              <Level className="dimOnDisabled">
                Lv {lvl}
                {capped ? ' · MAX' : ''}
              </Level>
            </RowTop>
            <RowBottom>
              <Effect className="dimOnDisabled">{t.format(lvl)}</Effect>
              {!capped && (
                <Cost affordable={affordable}>
                  {formatNum(cost)}{' '}
                  <span css={css`color:${theme.color.ivoryDim};font-weight:400;`}>HRP</span>
                </Cost>
              )}
            </RowBottom>
          </Row>
        );
      })}
    </Panel>
  );
}
