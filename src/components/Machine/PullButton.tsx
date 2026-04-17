/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { theme } from '../../theme';

const Row = styled.div`
  display: flex;
  justify-content: center;
  margin-top: clamp(12px, 2.5vw, 18px);
  padding: 0 4px;
`;

const Button = styled.button<{ inactive: boolean }>`
  position: relative;
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

/**
 * Hidden sizer. Always carries the widest label so the button's natural
 * width doesn't change as the label flips between "Pull" and the
 * spinning state. Less critical now that the button is alone in its
 * row (no sibling elements to push around), but the button still
 * shifts horizontally as it re-centers without this — visually jarring.
 */
const ButtonSizer = styled.span`
  visibility: hidden;
  pointer-events: none;
`;

const ButtonLabel = styled.span`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SPINNING_LABEL = '••• SPIN •••';

interface PullButtonProps {
  canSpin: boolean;
  spinning: boolean;
  onSpin: () => void;
}

/** The pull lever. Alone in its row so nothing else shifts with its width. */
export function PullButton({ canSpin, spinning, onSpin }: PullButtonProps) {
  return (
    <Row>
      <Button disabled={!canSpin} inactive={!canSpin} onClick={onSpin}>
        <ButtonSizer aria-hidden>{SPINNING_LABEL}</ButtonSizer>
        <ButtonLabel>{spinning ? SPINNING_LABEL : 'Pull'}</ButtonLabel>
      </Button>
    </Row>
  );
}
