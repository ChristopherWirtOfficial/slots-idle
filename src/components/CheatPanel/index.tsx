/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { anyCheatActiveAtom } from '../../state/cheats';
import { LuckCheat } from './LuckCheat';

const Wrap = styled.div`
  position: fixed;
  right: 16px;
  bottom: 16px;
  width: 280px;
  max-width: calc(100vw - 32px);
  background: #0a0c10;
  border: 1px solid #2a3340;
  border-radius: 4px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6);
  z-index: 50;
  font-family: 'JetBrains Mono', monospace;
  color: #9ab;
`;

const Header = styled.button<{ active: boolean }>`
  width: 100%;
  background: transparent;
  border: 0;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
  font-family: inherit;
  font-size: 11px;
  letter-spacing: 0.15em;
  color: ${(p) => (p.active ? '#6bf' : '#9ab')};
  text-transform: uppercase;
  &:hover {
    background: #121620;
  }
`;

const Dot = styled.span<{ active: boolean }>`
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${(p) => (p.active ? '#6bf' : '#334')};
  box-shadow: ${(p) => (p.active ? '0 0 6px #6bf' : 'none')};
`;

const HeaderLeft = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Chevron = styled.span<{ open: boolean }>`
  display: inline-block;
  transition: transform 120ms;
  transform: rotate(${(p) => (p.open ? '90deg' : '0deg')});
  font-size: 10px;
`;

const Body = styled.div`
  padding: 12px;
  border-top: 1px solid #1a2028;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

/**
 * Dev-facing cheat panel. Collapsed by default; lives in a corner of
 * the viewport so it's out of the way. Visible indicator (blue dot +
 * blue header text) when any cheat is currently active.
 *
 * Not persisted — cheats are runtime-only. Reload restores real state.
 */
export function CheatPanel() {
  const [open, setOpen] = useState(false);
  const active = useAtomValue(anyCheatActiveAtom);

  return (
    <Wrap>
      <Header active={active} onClick={() => setOpen((o) => !o)}>
        <HeaderLeft>
          <Chevron open={open}>▸</Chevron>
          <span>Cheats</span>
          <Dot active={active} />
        </HeaderLeft>
        <span>{active ? 'ACTIVE' : ''}</span>
      </Header>
      {open && (
        <Body>
          <LuckCheat />
        </Body>
      )}
    </Wrap>
  );
}
