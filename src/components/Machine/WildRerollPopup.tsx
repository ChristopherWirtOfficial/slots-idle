/** @jsxImportSource @emotion/react */
import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { useAtomValue } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { symbolsAtom } from '../../state/machine';
import { wildRerollAtom } from '../../state/session';
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
 * Popup shown when a spin produces one or more all-wild paylines. A
 * mini roulette cycles through the symbol pool before landing on the
 * pre-rolled reveal symbol. The reveal symbol is used to pay the
 * wild-only line(s) — controlled upstream in animationTickAtom.
 *
 * Rendered by MachineCabinet so it overlays the reels.
 */
export function WildRerollPopup() {
  const reroll = useAtomValue(wildRerollAtom);
  const symbols = useAtomValue(symbolsAtom);

  // Track "cycle" phase via a throbbing index that moves through the
  // symbol pool. We stop cycling at ~85% of the duration, leaving a
  // short window for the landing to settle visually.
  const [tickIdx, setTickIdx] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (reroll === null) return;
    const start = reroll.startedAt;
    const cycleEndsAt = start + reroll.durationMs * 0.85;

    // Cycle speeds up then slows down. Use distance from midpoint for
    // a rough ease feel. Interval in ms per symbol step.
    const tick = () => {
      const now = performance.now();
      if (now >= cycleEndsAt) {
        rafRef.current = null;
        return;
      }
      const elapsed = now - start;
      const progress = elapsed / reroll.durationMs;
      // Frame-rate-dependent increment: ~2ms at start (fast), ~9ms
      // near end (slow). Bias so early frames are the blur and late
      // frames settle toward the reveal.
      const stepMs = 20 + progress * 80;
      setTickIdx((i) => i + 1);
      rafRef.current = window.setTimeout(tick, stepMs) as unknown as number;
    };

    rafRef.current = window.setTimeout(tick, 20) as unknown as number;
    return () => {
      if (rafRef.current !== null) window.clearTimeout(rafRef.current);
    };
  }, [reroll]);

  if (reroll === null) return null;

  const elapsed = performance.now() - reroll.startedAt;
  const landed = elapsed >= reroll.durationMs * 0.85;
  const displaySymbol = landed
    ? reroll.revealSymbol
    : symbols[tickIdx % symbols.length] ?? reroll.revealSymbol;

  return (
    <Overlay>
      <Card>
        <Label>Wild Line</Label>
        <GlyphBox color={displaySymbol.color} landed={landed}>
          {displaySymbol.glyph}
        </GlyphBox>
        <Sub visible={landed}>{reroll.revealSymbol.name}</Sub>
      </Card>
    </Overlay>
  );
}
