/** @jsxImportSource @emotion/react */
import { useAtomValue } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { Reel } from '../Reel';
import { SpinResult } from '../../engine/types';
import {
  activeMachineAtom,
  reelCountAtom,
  resolvedConfigAtom,
} from '../../state/machine';
import { jackpotsAtom } from '../../state/economy';
import { ensureAudio } from '../../audio/engine';
import { FloatingWin } from './FloatingWin';
import { MachineCabinet } from './MachineCabinet';
import { MachineHeader } from './MachineHeader';
import { PaylineOverlay } from './PaylineOverlay';
import { ReelGrid } from './ReelGrid';
import { SpinControls } from './SpinControls';
import { WinSummary } from './WinSummary';
import { useCellCenters } from './useCellCenters';
import { useWinCycle } from './useWinCycle';

const JACKPOT_SHAKE_MS = 700;
const FLOAT_TOAST_MS = 1400;
const BIG_WIN_BET_MULTIPLIER = 10;

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
  const machine = useAtomValue(activeMachineAtom);
  const config = useAtomValue(resolvedConfigAtom);
  const reelCount = useAtomValue(reelCountAtom);
  const jackpots = useAtomValue(jackpotsAtom);

  // --- Grid geometry for overlay positioning ---
  const gridRef = useRef<HTMLDivElement>(null);
  const centers = useCellCenters(gridRef, reelCount, config.topology.rowCount);

  // --- Active winning payline cycling ---
  const activeWinIdx = useWinCycle(spinning, lastResult);
  const activeWin = activeWinIdx !== null && lastResult ? lastResult.wins[activeWinIdx] : null;
  const activeHighlight = activeWin ? machine.highlightsForWin(activeWin, config) : null;

  // --- Jackpot cabinet shake (triggered by jackpot counter increment) ---
  const [shaking, setShaking] = useState(false);
  const prevJackpots = useRef(jackpots);
  useEffect(() => {
    if (jackpots > prevJackpots.current) {
      setShaking(true);
      const t = window.setTimeout(() => setShaking(false), JACKPOT_SHAKE_MS);
      prevJackpots.current = jackpots;
      return () => window.clearTimeout(t);
    }
    prevJackpots.current = jackpots;
  }, [jackpots]);

  // --- Floating win toast lifecycle (key'd by lastFloat.id) ---
  const [visibleFloat, setVisibleFloat] = useState<MachineProps['lastFloat']>(null);
  useEffect(() => {
    if (!lastFloat) return;
    setVisibleFloat(lastFloat);
    const t = window.setTimeout(() => setVisibleFloat(null), FLOAT_TOAST_MS);
    return () => window.clearTimeout(t);
  }, [lastFloat?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const justWon = Boolean(lastResult && lastResult.totalPayout > 0 && !spinning);

  const handlePull = () => {
    ensureAudio();
    onSpin();
  };

  return (
    <MachineCabinet shaking={shaking}>
      <MachineHeader
        name={machine.name}
        reelCount={config.topology.reelCount}
        rowCount={config.topology.rowCount}
        paylineCount={config.paylines.length}
      />

      <ReelGrid ref={gridRef} justWon={justWon}>
        {Array.from({ length: reelCount }, (_, i) => (
          <Reel key={i} reelIdx={i} />
        ))}

        <PaylineOverlay
          highlight={activeHighlight}
          centers={centers}
          keyId={activeWinIdx ?? 'none'}
        />

        {visibleFloat && (
          <FloatingWin
            amount={visibleFloat.amount}
            isJackpot={visibleFloat.isJackpot}
            bigThreshold={bet * BIG_WIN_BET_MULTIPLIER}
          />
        )}
      </ReelGrid>

      <SpinControls
        bet={bet}
        chips={chips}
        canSpin={canSpin}
        spinning={spinning}
        onSpin={handlePull}
      />

      <WinSummary
        activeWin={spinning ? null : activeWin}
        winCount={lastResult?.wins.length ?? 0}
        activeIdx={activeWinIdx}
      />
    </MachineCabinet>
  );
}
