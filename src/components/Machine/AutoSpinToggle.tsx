/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { useAtom, useAtomValue } from 'jotai';
import {
  autospinActiveAtom,
  autospinDelayMsAtom,
  autospinUnlockedAtom,
} from '../../state/autospin';
import { theme } from '../../theme';

const Wrap = styled.div`
  display: flex;
  justify-content: center;
  margin-top: clamp(6px, 1.5vw, 10px);
  padding: 0 4px;
`;

const Pill = styled.button<{ active: boolean }>`
  font-family: ${theme.font.mono};
  font-size: 10px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: ${(p) => (p.active ? theme.color.goldBright : theme.color.ivoryDim)};
  background: transparent;
  border: 1px solid ${(p) => (p.active ? theme.color.gold : 'rgba(212, 160, 74, 0.2)')};
  border-radius: 999px;
  padding: 5px 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 120ms;

  &:hover {
    background: rgba(212, 160, 74, 0.08);
    border-color: ${theme.color.gold};
  }
`;

const Dot = styled.span<{ active: boolean }>`
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${(p) => (p.active ? theme.color.goldBright : 'rgba(196, 184, 150, 0.3)')};
  box-shadow: ${(p) => (p.active ? `0 0 6px ${theme.color.goldBright}` : 'none')};
`;

const Delay = styled.span`
  font-size: 9px;
  opacity: 0.7;
  letter-spacing: 0.15em;
`;

/**
 * Toggle for autospin on/off. Only renders when autospin is unlocked
 * (level >= 1). Shows the current delay inline so the player always
 * knows the cadence without opening the upgrade panel.
 */
export function AutoSpinToggle() {
  const unlocked = useAtomValue(autospinUnlockedAtom);
  const [active, setActive] = useAtom(autospinActiveAtom);
  const delayMs = useAtomValue(autospinDelayMsAtom);

  if (!unlocked) return null;

  return (
    <Wrap>
      <Pill active={active} onClick={() => setActive(!active)}>
        <Dot active={active} />
        Auto · {active ? 'ON' : 'OFF'}
        <Delay>({(delayMs / 1000).toFixed(1)}s)</Delay>
      </Pill>
    </Wrap>
  );
}
