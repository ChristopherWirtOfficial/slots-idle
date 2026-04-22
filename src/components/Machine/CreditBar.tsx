/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { useAtomValue, useSetAtom } from 'jotai';
import { chipsAtom } from '../../state/economy';
import {
  currentBetAtom,
  maxBetAtom,
  setCurrentBetAtom,
} from '../../state/upgrades';
import { theme } from '../../theme';
import { formatNum } from '../../util/format';

const Bar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: clamp(6px, 1.4vw, 10px) clamp(10px, 2vw, 14px);
  margin-bottom: clamp(10px, 2vw, 14px);
  border-top: 1px solid rgba(212, 160, 74, 0.18);
  border-bottom: 1px solid rgba(212, 160, 74, 0.18);
`;

const Group = styled.div`
  display: flex;
  align-items: baseline;
  gap: 10px;
`;

const WagerGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Label = styled.div`
  font-family: ${theme.font.script};
  font-size: 10px;
  letter-spacing: 0.3em;
  color: ${theme.color.ivoryDim};
  text-transform: uppercase;
`;

const ChipsValue = styled.div`
  font-family: ${theme.font.display};
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  font-style: italic;
  font-size: clamp(22px, 5.5vw, 28px);
  color: ${theme.color.gold};
  line-height: 1;
`;

const Stepper = styled.button<{ disabled?: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid ${(p) => (p.disabled ? 'rgba(212, 160, 74, 0.15)' : theme.color.gold)};
  background: transparent;
  color: ${(p) => (p.disabled ? 'rgba(212, 160, 74, 0.25)' : theme.color.gold)};
  font-family: ${theme.font.display};
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
  cursor: ${(p) => (p.disabled ? 'default' : 'pointer')};
  transition: all 120ms;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  &:hover:not(:disabled) {
    background: rgba(212, 160, 74, 0.12);
  }
`;

const WagerValue = styled.div`
  font-family: ${theme.font.display};
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  font-style: italic;
  font-size: clamp(15px, 3.5vw, 18px);
  color: ${theme.color.gold};
  line-height: 1;
  min-width: 2.5ch;
  text-align: center;
`;

const WagerOverMax = styled.span`
  color: ${theme.color.ivoryDim};
  opacity: 0.6;
  font-size: clamp(12px, 2.8vw, 14px);
  font-variant-numeric: tabular-nums;
  margin-left: 2px;
`;

/**
 * Credit meter above the reels. Chips on the left, interactive wager
 * selector on the right. The wager is the player's bet for the next
 * spin, bounded [1, maxBet]. Tap − / + to step; tap the value itself
 * to snap to max.
 */
export function CreditBar() {
  const chips = useAtomValue(chipsAtom);
  const bet = useAtomValue(currentBetAtom);
  const maxBet = useAtomValue(maxBetAtom);
  const setBet = useSetAtom(setCurrentBetAtom);

  const canDec = bet > 1;
  const canInc = bet < maxBet;

  return (
    <Bar>
      <Group>
        <Label>Chips</Label>
        <ChipsValue>{formatNum(chips)}</ChipsValue>
      </Group>
      <WagerGroup>
        <Label>Wager</Label>
        <Stepper
          onClick={() => canDec && setBet(bet - 1)}
          disabled={!canDec}
          aria-label="Decrease wager"
        >
          −
        </Stepper>
        <WagerValue
          onClick={() => setBet(maxBet)}
          title="Tap to set max"
          style={{ cursor: bet < maxBet ? 'pointer' : 'default' }}
        >
          {formatNum(bet)}
          <WagerOverMax>/{maxBet}</WagerOverMax>
        </WagerValue>
        <Stepper
          onClick={() => canInc && setBet(bet + 1)}
          disabled={!canInc}
          aria-label="Increase wager"
        >
          +
        </Stepper>
      </WagerGroup>
    </Bar>
  );
}
