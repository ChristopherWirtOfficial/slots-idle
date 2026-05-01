/** @jsxImportSource @emotion/react */
import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { useAtomValue } from 'jotai';
import { wildRerollAtom } from '../../state/session';
import { wildRerollDisplayAtom } from '../../state/winDisplay';
import { theme } from '../../theme';

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 5, 17, 0.72);
  backdrop-filter: blur(2px);
  z-index: 10;
  pointer-events: none;
`;

const pop = keyframes`
  0% { transform: scale(0.6); opacity: 0; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

const Card = styled.div`
  background: linear-gradient(180deg, ${theme.color.velvet}, ${theme.color.bgDeep});
  border: 2px solid ${theme.color.gold};
  border-radius: ${theme.radius.lg};
  padding: 22px 32px;
  box-shadow: ${theme.shadow.frame};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  animation: ${pop} 260ms cubic-bezier(0.2, 1.1, 0.6, 1.05) both;
`;

const Label = styled.div`
  font-family: ${theme.font.script};
  font-size: 10px;
  letter-spacing: 0.3em;
  color: ${theme.color.ivoryDim};
  text-transform: uppercase;
  &::before, &::after {
    content: '◆';
    margin: 0 8px;
    color: ${theme.color.gold};
  }
`;

const GlyphBox = styled.div<{ color: string; landed: boolean }>`
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${(p) => (p.landed ? p.color : 'rgba(212,160,74,0.35)')};
  border-radius: ${theme.radius.md};
  background: ${theme.color.bgDeep};
  font-family: ${theme.font.display};
  font-size: 56px;
  color: ${(p) => p.color};
  text-shadow:
    0 2px 0 rgba(0, 0, 0, 0.6),
    0 0 14px ${(p) => (p.landed ? `${p.color}88` : 'transparent')};
  transition: border-color 120ms, text-shadow 160ms;
`;

const Sub = styled.div<{ visible: boolean }>`
  font-family: ${theme.font.display};
  font-style: italic;
  font-size: 16px;
  color: ${theme.color.gold};
  opacity: ${(p) => (p.visible ? 1 : 0)};
  transition: opacity 180ms;
  min-height: 22px;
`;

/**
 * Popup shown during the wild-reroll mini-animation. Its displayed
 * symbol is a pure derivation of effectiveNow + wildReroll.startedAt
 * (see wildRerollDisplayAtom) — the component just renders whatever
 * the derivation says should be on screen right now.
 *
 * No setTimeout loop, no tick state, no ref bookkeeping. As effective
 * time advances, the atom recomputes and the component re-renders
 * with a new symbol. Fast-forwards naturally during offline catch-up.
 */
export function WildRerollPopup() {
  const reroll = useAtomValue(wildRerollAtom);
  const display = useAtomValue(wildRerollDisplayAtom);
  if (reroll === null || display === null) return null;

  return (
    <Overlay>
      <Card>
        <Label>Wild Line</Label>
        <GlyphBox color={display.symbol.color} landed={display.landed}>
          {display.symbol.glyph}
        </GlyphBox>
        <Sub visible={display.landed}>{reroll.revealSymbol.name}</Sub>
      </Card>
    </Overlay>
  );
}
