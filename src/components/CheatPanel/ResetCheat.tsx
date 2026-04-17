/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { resetActionAtom } from '../../state/actions';

/** Time after an arm-click before the button auto-disarms. */
const CONFIRM_TIMEOUT_MS = 3000;

const Block = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-top: 1px solid #1a2028;
  padding-top: 12px;
`;

const Heading = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.2em;
  color: #678;
  text-transform: uppercase;
`;

const Button = styled.button<{ armed: boolean }>`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 8px 12px;
  background: ${(p) => (p.armed ? '#3a0f1a' : 'transparent')};
  color: ${(p) => (p.armed ? '#f8a0a8' : '#8a6070')};
  border: 1px solid ${(p) => (p.armed ? '#a84050' : '#3a2028')};
  border-radius: 3px;
  cursor: pointer;
  transition: background 120ms, border-color 120ms, color 120ms;

  &:hover {
    background: ${(p) => (p.armed ? '#4a1420' : '#1a1018')};
    border-color: ${(p) => (p.armed ? '#c85060' : '#5a2830')};
    color: ${(p) => (p.armed ? '#fcc' : '#c89')};
  }
`;

/**
 * Nukes all saved state. Two-click confirmation: first click "arms" the
 * button (red, label changes to "Click again to confirm"), a 3-second
 * timeout auto-disarms if the player doesn't follow through, and a
 * second click inside that window fires the reset.
 *
 * Intentionally friction-heavy for an otherwise one-click panel — this
 * is the only destructive action and a misclick wipes the whole run.
 */
export function ResetCheat() {
  const doReset = useSetAtom(resetActionAtom);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(false), CONFIRM_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [armed]);

  const handleClick = () => {
    if (armed) {
      doReset();
      setArmed(false);
    } else {
      setArmed(true);
    }
  };

  return (
    <Block>
      <Heading>Danger Zone</Heading>
      <Button armed={armed} onClick={handleClick}>
        {armed ? 'Click again to confirm' : 'Reset Game'}
      </Button>
    </Block>
  );
}
