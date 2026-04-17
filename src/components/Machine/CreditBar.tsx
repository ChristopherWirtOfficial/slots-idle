/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { useAtomValue } from 'jotai';
import { chipsAtom } from '../../state/economy';
import { betAtom } from '../../state/upgrades';
import { theme } from '../../theme';

const Bar = styled.div`
  display: flex;
  align-items: baseline;
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

const WagerValue = styled.div`
  font-family: ${theme.font.display};
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  font-style: italic;
  font-size: clamp(15px, 3.5vw, 18px);
  color: ${theme.color.gold};
  line-height: 1;
  opacity: 0.85;
`;

/**
 * Credit meter above the reels. Mirrors the convention on physical slot
 * machines where chips/credits and current wager are displayed as a
 * dedicated readout, separate from the spin control.
 *
 * Reads atoms directly so it can live anywhere in the tree without
 * prop threading.
 */
export function CreditBar() {
  const chips = useAtomValue(chipsAtom);
  const bet = useAtomValue(betAtom);

  return (
    <Bar>
      <Group>
        <Label>Chips</Label>
        <ChipsValue>{chips.toLocaleString()}</ChipsValue>
      </Group>
      <Group>
        <Label>Wager</Label>
        <WagerValue>{bet.toLocaleString()}</WagerValue>
      </Group>
    </Bar>
  );
}
