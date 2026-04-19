/** @jsxImportSource @emotion/react */
import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { useAtom, useAtomValue } from 'jotai';
import { CSSProperties } from 'react';
import {
  autospinActiveAtom,
  autospinDelayMsAtom,
  autospinUnlockedAtom,
  autospinWaitingAtom,
} from '../../state/autospin';
import { theme } from '../../theme';

const Wrap = styled.div`
  display: flex;
  justify-content: center;
  margin-top: clamp(6px, 1.5vw, 10px);
  padding: 0 4px;
`;

const Pill = styled.button<{ active: boolean }>`
  position: relative;
  overflow: hidden;
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
  transition: border-color 120ms, color 120ms;

  &:hover {
    border-color: ${theme.color.gold};
  }
`;

const fillSweep = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;

/**
 * The background fill. Anchored to the left edge and grows rightward
 * via transform:scaleX over the autospin delay. Remounts every time
 * `autospinWaitingAtom` flips back to true (parent conditional), so
 * the animation starts fresh at the beginning of every cycle.
 */
const FillSweep = styled.span`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(212, 160, 74, 0.22),
    rgba(212, 160, 74, 0.32)
  );
  transform-origin: left center;
  transform: scaleX(0);
  animation: ${fillSweep} linear forwards;
  animation-duration: var(--autospin-delay);
  z-index: 0;
  pointer-events: none;
`;

const Content = styled.span`
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 8px;
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
  /* Override the pill's uppercase so the unit "s" reads as a unit,
   * not as an ambiguous capital after a period. Parens removed —
   * visual separator is the same middle-dot the ON/OFF uses. */
  text-transform: none;
  font-size: 10px;
  opacity: 0.6;
  letter-spacing: 0.1em;
  margin-left: 2px;
`;

/**
 * Toggle for autospin on/off. Only renders when autospin is unlocked
 * (level >= 1). When autospin is waiting for the next pull, a gold
 * sweep fills the pill from left to right at the same rate as the
 * underlying setTimeout — a visible countdown that matches what the
 * hook is actually doing.
 */
export function AutoSpinToggle() {
  const unlocked = useAtomValue(autospinUnlockedAtom);
  const [active, setActive] = useAtom(autospinActiveAtom);
  const delayMs = useAtomValue(autospinDelayMsAtom);
  const waiting = useAtomValue(autospinWaitingAtom);

  if (!unlocked) return null;

  const fillStyle = {
    ['--autospin-delay' as string]: `${delayMs}ms`,
  } as CSSProperties;

  return (
    <Wrap>
      <Pill active={active} onClick={() => setActive(!active)}>
        {waiting && <FillSweep key={delayMs} style={fillStyle} />}
        <Content>
          <Dot active={active} />
          Auto · {active ? 'ON' : 'OFF'}
          <Delay>· {(delayMs / 1000).toFixed(1)}s</Delay>
        </Content>
      </Pill>
    </Wrap>
  );
}
