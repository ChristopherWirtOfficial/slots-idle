/** @jsxImportSource @emotion/react */
import { css, keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { Reel } from './Reel';
import { theme } from '../theme';
import { SpinResult } from '../game/spin';
import { PAYLINES } from '../game/paylines';
import { reelAtoms } from '../state/reels';
import { jackpotsAtom } from '../state/economy';
import { ensureAudio } from '../audio/engine';

// --- Animations ---

const float = keyframes`
  0% { opacity: 0; transform: translate(-50%, 0) scale(0.8); }
  15% { opacity: 1; transform: translate(-50%, -14px) scale(1.05); }
  100% { opacity: 0; transform: translate(-50%, -90px) scale(1); }
`;

const winGlow = keyframes`
  0%, 100% { box-shadow: inset 0 0 0 1px ${theme.color.goldDeep}, 0 0 0 0 transparent; }
  50% { box-shadow: inset 0 0 0 1px ${theme.color.goldBright}, 0 0 40px ${theme.color.goldBright}44; }
`;

const jackpotShake = keyframes`
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-5px, 2px); }
  20% { transform: translate(5px, -2px); }
  30% { transform: translate(-4px, 1px); }
  40% { transform: translate(4px, -1px); }
  50% { transform: translate(-3px, 1px); }
  60% { transform: translate(3px, 0); }
  70% { transform: translate(-2px, 0); }
  80% { transform: translate(1px, 0); }
`;

const drawInLine = keyframes`
  0% { stroke-dashoffset: 100; opacity: 0.2; }
  60% { stroke-dashoffset: 0; opacity: 1; }
  100% { stroke-dashoffset: 0; opacity: 1; }
`;

const pulseGlow = keyframes`
  0%, 100% {
    filter:
      drop-shadow(0 0 4px ${theme.color.goldBright})
      drop-shadow(0 0 10px ${theme.color.gold});
  }
  50% {
    filter:
      drop-shadow(0 0 10px ${theme.color.goldBright})
      drop-shadow(0 0 22px ${theme.color.gold});
  }
`;

const cellPulse = keyframes`
  0%, 100% { opacity: 0.25; }
  50% { opacity: 0.6; }
`;

// --- Layout ---

const Card = styled.section<{ shaking: boolean }>`
  position: relative;
  padding: clamp(14px, 3vw, 22px);
  background: linear-gradient(180deg, ${theme.color.velvet}, ${theme.color.bgDeep});
  border: 1px solid ${theme.color.goldDeep};
  border-radius: ${theme.radius.lg};
  box-shadow: 0 20px 40px -20px rgba(0, 0, 0, 0.8);
  width: 100%;
  ${(p) => p.shaking && css`animation: ${jackpotShake} 0.7s ease-out;`}
`;

const Header = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: clamp(10px, 2vw, 14px);
  padding: 0 4px;
`;

const Marquee = styled.h1`
  font-family: ${theme.font.display};
  font-weight: 500;
  font-style: italic;
  font-size: clamp(14px, 3vw, 17px);
  letter-spacing: 0.18em;
  color: ${theme.color.gold};
  text-transform: uppercase;
  margin: 0;
`;

const PaylineBadge = styled.div`
  font-family: ${theme.font.mono};
  font-size: 10px;
  letter-spacing: 0.2em;
  color: ${theme.color.ivoryDim};
  text-transform: uppercase;
  &::before {
    content: '◆';
    color: ${theme.color.gold};
    margin-right: 6px;
  }
`;

const Grid = styled.div<{ winning: boolean }>`
  position: relative;
  display: flex;
  gap: clamp(6px, 1.5vw, 10px);
  justify-content: center;
  padding: clamp(10px, 2vw, 14px);
  background: linear-gradient(180deg, ${theme.color.bgDeep}, ${theme.color.black});
  border-radius: ${theme.radius.md};
  ${(p) =>
    p.winning &&
    css`animation: ${winGlow} 1s ease-out;`}
`;

const PaylineOverlay = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 6;
  overflow: visible;
`;

const PaylinePolyline = styled.polyline<{ jackpot: boolean }>`
  fill: none;
  stroke: ${(p) => (p.jackpot ? theme.color.bigWin : theme.color.goldBright)};
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 100;
  animation:
    ${drawInLine} 0.45s ease-out forwards,
    ${pulseGlow} 1.2s ease-in-out 0.45s infinite;
  vector-effect: non-scaling-stroke;
`;

const CellHighlight = styled.circle<{ jackpot: boolean }>`
  fill: ${(p) => (p.jackpot ? theme.color.bigWin : theme.color.goldBright)};
  animation: ${cellPulse} 1.2s ease-in-out infinite;
`;

const FloatWrap = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  pointer-events: none;
  z-index: 10;
`;

const FloatText = styled.div<{ big: boolean; jackpot: boolean }>`
  font-family: ${theme.font.display};
  font-weight: 700;
  font-style: italic;
  font-size: ${(p) =>
    p.jackpot
      ? 'clamp(42px, 12vw, 62px)'
      : p.big
      ? 'clamp(32px, 8vw, 44px)'
      : 'clamp(24px, 6vw, 32px)'};
  color: ${(p) => (p.jackpot ? theme.color.bigWin : theme.color.goldBright)};
  text-shadow:
    0 2px 12px rgba(0, 0, 0, 0.9),
    0 0 24px ${(p) => (p.jackpot ? theme.color.bigWin : theme.color.goldBright)};
  white-space: nowrap;
  animation: ${float} 1.4s ease-out forwards;
`;

const Controls = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: clamp(10px, 2.5vw, 18px);
  margin-top: clamp(12px, 2.5vw, 18px);
  padding: 0 4px;
`;

const Readout = styled.div<{ align: 'left' | 'right' }>`
  text-align: ${(p) => p.align};
`;

const ReadoutLabel = styled.div`
  font-family: ${theme.font.script};
  font-size: 10px;
  letter-spacing: 0.3em;
  color: ${theme.color.ivoryDim};
  text-transform: uppercase;
  margin-bottom: 2px;
`;

const ReadoutValue = styled.div<{ large?: boolean }>`
  font-family: ${theme.font.display};
  font-weight: 600;
  font-style: italic;
  font-size: ${(p) => (p.large ? 'clamp(22px, 5.5vw, 28px)' : 'clamp(16px, 4vw, 20px)')};
  color: ${theme.color.gold};
  line-height: 1;
`;

const SpinButton = styled.button<{ disabled: boolean }>`
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
  cursor: ${(p) => (p.disabled ? 'not-allowed' : 'pointer')};
  opacity: ${(p) => (p.disabled ? 0.4 : 1)};
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

// --- Component ---

interface MachineProps {
  spinning: boolean;
  chips: number;
  bet: number;
  canSpin: boolean;
  onSpin: () => void;
  lastFloat: { id: number; amount: number; isJackpot: boolean } | null;
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
  const [activeWinIdx, setActiveWinIdx] = useState<number | null>(null);

  // Cell center positions as percentages of the Grid (0–100).
  // Measured from live DOM so the SVG overlay lines up regardless of viewport size.
  const gridRef = useRef<HTMLDivElement>(null);
  const [cells, setCells] = useState({
    cols: [16.67, 50, 83.33],
    rows: [16.67, 50, 83.33],
  });

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const measure = () => {
      const reels = grid.querySelectorAll<HTMLElement>('[data-reel]');
      if (reels.length !== 3) return;
      const gridRect = grid.getBoundingClientRect();
      if (gridRect.width === 0 || gridRect.height === 0) return;

      const cols: number[] = [];
      reels.forEach((el) => {
        const r = el.getBoundingClientRect();
        cols.push(((r.left + r.width / 2 - gridRect.left) / gridRect.width) * 100);
      });
      const first = reels[0].getBoundingClientRect();
      const cellH = first.height / 3;
      const rowsPct = [0.5, 1.5, 2.5].map(
        (m) => ((first.top + cellH * m - gridRect.top) / gridRect.height) * 100,
      );
      setCells({ cols, rows: rowsPct });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(grid);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

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

  // Cycle through winning paylines after each spin; clear while spinning.
  useEffect(() => {
    if (spinning || !lastResult || lastResult.wins.length === 0) {
      setActiveWinIdx(null);
      return;
    }
    setActiveWinIdx(0);
    if (lastResult.wins.length === 1) return;
    const winCount = lastResult.wins.length;
    const id = window.setInterval(() => {
      setActiveWinIdx((i) => (i === null ? 0 : (i + 1) % winCount));
    }, 1400);
    return () => window.clearInterval(id);
  }, [spinning, lastResult]);

  const activeWin =
    activeWinIdx !== null && lastResult ? lastResult.wins[activeWinIdx] : null;
  const activePayline = activeWin
    ? PAYLINES.find((p) => p.id === activeWin.paylineId)
    : null;
  const activeJackpot =
    activeWin?.matchCount === 3 && activeWin.symbol.id === 'seven';

  const justWon = Boolean(lastResult && lastResult.totalPayout > 0 && !spinning);
  const winCount = lastResult?.wins.length ?? 0;

  const handlePull = () => {
    ensureAudio();
    onSpin();
  };

  const floatIsBig = showFloat ? showFloat.amount >= bet * 10 : false;

  return (
    <Card shaking={shaking}>
      <Header>
        <Marquee>Lucky Parlour</Marquee>
        <PaylineBadge>5 lines</PaylineBadge>
      </Header>

      <Grid winning={justWon} ref={gridRef}>
        <Reel reelAtom={reelAtoms[0]} />
        <Reel reelAtom={reelAtoms[1]} />
        <Reel reelAtom={reelAtoms[2]} />

        {activePayline && (
          <PaylineOverlay
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            key={`${activeWinIdx}-${activePayline.id}`}
          >
            <PaylinePolyline
              jackpot={activeJackpot}
              points={activePayline.rows
                .map((r, i) => `${cells.cols[i]},${cells.rows[r]}`)
                .join(' ')}
            />
            {activePayline.rows.map((r, i) => (
              <CellHighlight
                key={i}
                jackpot={activeJackpot}
                cx={cells.cols[i]}
                cy={cells.rows[r]}
                r={2.5}
              />
            ))}
          </PaylineOverlay>
        )}

        {showFloat && (
          <FloatWrap>
            <FloatText big={floatIsBig} jackpot={showFloat.isJackpot}>
              {showFloat.isJackpot ? '★ ' : ''}
              +{showFloat.amount.toLocaleString()}
              {showFloat.isJackpot ? ' ★' : ''}
            </FloatText>
          </FloatWrap>
        )}
      </Grid>

      <Controls>
        <Readout align="left">
          <ReadoutLabel>Wager</ReadoutLabel>
          <ReadoutValue>{bet.toLocaleString()}</ReadoutValue>
        </Readout>

        <SpinButton onClick={handlePull} disabled={!canSpin}>
          {spinning ? '••• spin •••' : 'Pull'}
        </SpinButton>

        <Readout align="right">
          <ReadoutLabel>Chips</ReadoutLabel>
          <ReadoutValue large>{chips.toLocaleString()}</ReadoutValue>
        </Readout>
      </Controls>

      {lastResult && !spinning && lastResult.totalPayout > 0 && (
        <div
          css={css`
            margin-top: 8px;
            text-align: center;
            font-family: ${theme.font.body};
            font-size: 12px;
            color: ${theme.color.ivoryDim};
            min-height: 16px;
          `}
        >
          {activeWin && activePayline ? (
            <>
              <span style={{ color: activeWin.symbol.color, fontWeight: 700 }}>
                {activeWin.symbol.glyph}
              </span>{' '}
              <span style={{ color: theme.color.ivory }}>{activePayline.name}</span>{' '}
              · +{activeWin.payout.toLocaleString()}
              {winCount > 1 && (
                <span
                  css={css`color: ${theme.color.ivoryDim}; margin-left: 8px;`}
                >
                  ({(activeWinIdx ?? 0) + 1}/{winCount})
                </span>
              )}
            </>
          ) : (
            <>
              {winCount} line{winCount === 1 ? '' : 's'} · last paid{' '}
              {lastResult.totalPayout.toLocaleString()}
            </>
          )}
        </div>
      )}
    </Card>
  );
}
