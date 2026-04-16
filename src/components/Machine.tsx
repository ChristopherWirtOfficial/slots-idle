/** @jsxImportSource @emotion/react */
import { css, keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { useEffect, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { Reel } from './Reel';
import { Sunburst } from './Sunburst';
import { theme } from '../theme';
import { SpinResult } from '../game/spin';
import { reelAtoms } from '../state/reels';
import { jackpotsAtom } from '../state/economy';
import { ensureAudio } from '../audio/engine';

const float = keyframes`
  0% { opacity: 0; transform: translate(-50%, 0) scale(0.8); }
  20% { opacity: 1; transform: translate(-50%, -20px) scale(1.05); }
  100% { opacity: 0; transform: translate(-50%, -120px) scale(1); }
`;

const winPulse = keyframes`
  0%, 100% { box-shadow: ${theme.shadow.frame}; }
  50% { box-shadow: ${theme.shadow.frame}, 0 0 80px ${theme.color.goldBright}; }
`;

const jackpotShake = keyframes`
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-6px, 2px); }
  20% { transform: translate(5px, -3px); }
  30% { transform: translate(-5px, 2px); }
  40% { transform: translate(4px, -2px); }
  50% { transform: translate(-4px, 1px); }
  60% { transform: translate(3px, -1px); }
  70% { transform: translate(-3px, 1px); }
  80% { transform: translate(2px, 0); }
  90% { transform: translate(-1px, 0); }
`;

const Cabinet = styled.section<{ shaking: boolean }>`
  position: relative;
  padding: clamp(20px, 5vw, 48px) clamp(16px, 4vw, 40px) clamp(20px, 4vw, 36px);
  background:
    radial-gradient(ellipse at top, ${theme.color.velvet} 0%, ${theme.color.bgDeep} 70%),
    ${theme.color.bg};
  border-radius: ${theme.radius.lg};
  box-shadow: ${theme.shadow.frame};
  overflow: hidden;
  width: 100%;
  ${(p) => p.shaking && css`animation: ${jackpotShake} 0.7s ease-out;`}
`;

const Marquee = styled.h1`
  font-family: ${theme.font.display};
  font-weight: 400;
  font-style: italic;
  font-size: clamp(20px, 5.5vw, 28px);
  letter-spacing: 0.15em;
  text-align: center;
  color: ${theme.color.gold};
  margin: 0 0 4px;
  text-transform: uppercase;
  position: relative;
  z-index: 2;

  &::after {
    content: '';
    display: block;
    width: 60px;
    height: 1px;
    background: ${theme.color.gold};
    margin: 12px auto 0;
  }
`;

const Subtitle = styled.div`
  font-family: ${theme.font.script};
  font-size: 13px;
  letter-spacing: 0.4em;
  text-align: center;
  color: ${theme.color.ivoryDim};
  margin-bottom: 28px;
  text-transform: uppercase;
  position: relative;
  z-index: 2;
`;

const ReelRow = styled.div<{ winning: boolean }>`
  display: flex;
  gap: clamp(6px, 2vw, 12px);
  justify-content: center;
  padding: clamp(14px, 3.5vw, 24px) clamp(14px, 3.5vw, 28px);
  background: linear-gradient(180deg, ${theme.color.bgDeep}, ${theme.color.black});
  border-radius: ${theme.radius.md};
  box-shadow:
    inset 0 4px 12px rgba(0, 0, 0, 0.9),
    ${theme.shadow.frame};
  position: relative;
  z-index: 2;
  ${(p) =>
    p.winning &&
    css`
      animation: ${winPulse} 1.2s ease-out;
    `}
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(10px, 3vw, 24px);
  margin-top: clamp(18px, 4vw, 28px);
  position: relative;
  z-index: 2;
`;

const SpinButton = styled.button<{ disabled: boolean }>`
  font-family: ${theme.font.display};
  font-weight: 600;
  font-style: italic;
  font-size: clamp(16px, 4.5vw, 22px);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: ${theme.color.black};
  background: linear-gradient(180deg, ${theme.color.goldBright}, ${theme.color.gold} 60%, ${theme.color.goldDeep});
  border: 2px solid ${theme.color.goldDeep};
  border-radius: ${theme.radius.md};
  padding: clamp(10px, 3vw, 16px) clamp(20px, 6vw, 48px);
  cursor: ${(p) => (p.disabled ? 'not-allowed' : 'pointer')};
  opacity: ${(p) => (p.disabled ? 0.4 : 1)};
  box-shadow:
    0 4px 0 ${theme.color.goldDeep},
    0 8px 24px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  transition: transform 80ms, box-shadow 80ms;
  white-space: nowrap;

  &:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow:
      0 1px 0 ${theme.color.goldDeep},
      0 4px 12px rgba(0, 0, 0, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
  }

  &:hover:not(:disabled) {
    background: linear-gradient(180deg, #ffe4a0, ${theme.color.goldBright} 60%, ${theme.color.gold});
  }
`;

const ChipDisplay = styled.div`
  text-align: right;
`;

const ChipLabel = styled.div`
  font-family: ${theme.font.script};
  font-size: 11px;
  letter-spacing: 0.3em;
  color: ${theme.color.ivoryDim};
  text-transform: uppercase;
  margin-bottom: 4px;
`;

const ChipAmount = styled.div`
  font-family: ${theme.font.display};
  font-weight: 600;
  font-style: italic;
  font-size: clamp(22px, 6vw, 32px);
  color: ${theme.color.gold};
  line-height: 1;
  letter-spacing: 0.02em;
`;

const BetDisplay = styled.div`
  text-align: left;
`;

const FloatWrap = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  pointer-events: none;
  z-index: 10;
`;

const FloatText = styled.div<{ kind: SpinResult['kind'] }>`
  font-family: ${theme.font.display};
  font-weight: 700;
  font-style: italic;
  font-size: ${(p) => (p.kind === 'three' ? 'clamp(42px, 12vw, 64px)' : 'clamp(26px, 7vw, 36px)')};
  color: ${(p) => (p.kind === 'three' ? theme.color.bigWin : theme.color.goldBright)};
  text-shadow:
    0 2px 12px rgba(0, 0, 0, 0.9),
    0 0 24px ${(p) => (p.kind === 'three' ? theme.color.bigWin : theme.color.goldBright)};
  white-space: nowrap;
  animation: ${float} 1.4s ease-out forwards;
`;

const SunburstBg = styled.div`
  position: absolute;
  top: -50px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 0;
  opacity: 0.6;
`;

interface MachineProps {
  spinning: boolean;
  chips: number;
  bet: number;
  canSpin: boolean;
  onSpin: () => void;
  lastFloat: { id: number; amount: number; kind: SpinResult['kind'] } | null;
  lastResult: SpinResult | null;
}

export function Machine({
  spinning,
  chips,
  bet,
  canSpin,
  onSpin,
  lastFloat,
  lastResult,
}: MachineProps) {
  const [showFloat, setShowFloat] = useState<typeof lastFloat>(null);
  const [shaking, setShaking] = useState(false);

  const jackpots = useAtomValue(jackpotsAtom);
  const prevJackpots = useRef(jackpots);

  useEffect(() => {
    if (jackpots > prevJackpots.current) {
      setShaking(true);
      const t = window.setTimeout(() => setShaking(false), 700);
      prevJackpots.current = jackpots;
      return () => window.clearTimeout(t);
    }
    prevJackpots.current = jackpots;
  }, [jackpots]);

  useEffect(() => {
    if (lastFloat) {
      setShowFloat(lastFloat);
      const t = setTimeout(() => setShowFloat(null), 1400);
      return () => clearTimeout(t);
    }
  }, [lastFloat?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const justWon = Boolean(lastResult && lastResult.payout > 0 && !spinning);

  const handlePull = () => {
    ensureAudio(); // first user gesture initializes AudioContext
    onSpin();
  };

  return (
    <Cabinet shaking={shaking}>
      <SunburstBg>
        <Sunburst size={700} rays={48} opacity={0.06} />
      </SunburstBg>

      <Marquee>Lucky Idle Slots</Marquee>
      <Subtitle>— Est. 1924 —</Subtitle>

      <ReelRow winning={justWon}>
        <Reel reelAtom={reelAtoms[0]} />
        <Reel reelAtom={reelAtoms[1]} />
        <Reel reelAtom={reelAtoms[2]} />

        {showFloat && (
          <FloatWrap>
            <FloatText kind={showFloat.kind}>
              {showFloat.kind === 'three' && showFloat.amount > 100 ? '★ ' : ''}
              +{showFloat.amount.toLocaleString()}
              {showFloat.kind === 'three' && showFloat.amount > 100 ? ' ★' : ''}
            </FloatText>
          </FloatWrap>
        )}
      </ReelRow>

      <Controls>
        <BetDisplay>
          <ChipLabel>Wager</ChipLabel>
          <ChipAmount css={css`font-size: 22px;`}>{bet.toLocaleString()}</ChipAmount>
        </BetDisplay>

        <SpinButton onClick={handlePull} disabled={!canSpin}>
          {spinning ? '—— spin ——' : 'Pull'}
        </SpinButton>

        <ChipDisplay>
          <ChipLabel>Chips</ChipLabel>
          <ChipAmount>{chips.toLocaleString()}</ChipAmount>
        </ChipDisplay>
      </Controls>
    </Cabinet>
  );
}
