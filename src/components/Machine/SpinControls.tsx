/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { theme } from '../../theme';

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: clamp(10px, 2.5vw, 18px);
  margin-top: clamp(12px, 2.5vw, 18px);
  padding: 0 4px;
`;

const Cell = styled.div<{ align: 'left' | 'right' }>`
  text-align: ${(p) => p.align};
`;

const Label = styled.div`
  font-family: ${theme.font.script};
  font-size: 10px;
  letter-spacing: 0.3em;
  color: ${theme.color.ivoryDim};
  text-transform: uppercase;
  margin-bottom: 2px;
`;

const Value = styled.div<{ emphasis?: boolean }>`
  font-family: ${theme.font.display};
  font-weight: 600;
  font-style: italic;
  font-size: ${(p) => (p.emphasis ? 'clamp(22px, 5.5vw, 28px)' : 'clamp(16px, 4vw, 20px)')};
  color: ${theme.color.gold};
  line-height: 1;
`;

const Button = styled.button<{ inactive: boolean }>`
  font-family: ${theme.font.display};
  font-weight: 600;
  font-style: italic;
  font-size: clamp(15px, 4vw, 19px);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: ${theme.color.black};
  background: linear-gradient(180deg, ${theme.color.goldBright}, ${theme.color.gold} 60%, ${theme.color.goldDeep});
  border: 1px solid ${theme.color.goldDeep};
  border-radius: ${theme.radius.md};
  padding: clamp(10px, 2.5vw, 14px) clamp(22px, 6vw, 40px);
  cursor: ${(p) => (p.inactive ? 'not-allowed' : 'pointer')};
  opacity: ${(p) => (p.inactive ? 0.4 : 1)};
  box-shadow:
    0 3px 0 ${theme.color.goldDeep},
    0 6px 14px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  transition: transform 80ms, box-shadow 80ms;
  white-space: nowrap;
  &:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow:
      0 1px 0 ${theme.color.goldDeep},
      0 3px 8px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
  }
  &:hover:not(:disabled) {
    background: linear-gradient(180deg, #ffe4a0, ${theme.color.goldBright} 60%, ${theme.color.gold});
  }
`;

interface SpinControlsProps {
  bet: number;
  chips: number;
  canSpin: boolean;
  spinning: boolean;
  onSpin: () => void;
}

/** Wager readout, pull button, and chip balance in a single row. */
export function SpinControls({
  bet,
  chips,
  canSpin,
  spinning,
  onSpin,
}: SpinControlsProps) {
  return (
    <Row>
      <Cell align="left">
        <Label>Wager</Label>
        <Value>{bet.toLocaleString()}</Value>
      </Cell>

      <Button disabled={!canSpin} inactive={!canSpin} onClick={onSpin}>
        {spinning ? '••• spin •••' : 'Pull'}
      </Button>

      <Cell align="right">
        <Label>Chips</Label>
        <Value emphasis>{chips.toLocaleString()}</Value>
      </Cell>
    </Row>
  );
}
