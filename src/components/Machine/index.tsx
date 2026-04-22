/** @jsxImportSource @emotion/react */
import { useAtomValue, useSetAtom } from 'jotai';
import Decimal from 'break_infinity.js';
import { useEffect, useRef, useState } from 'react';
import { Reel } from '../Reel';
import { SpinResult } from '../../engine/types';
import { FloatEvent } from '../../state/session';
import {
  activeMachineAtom,
  reelCountAtom,
  resolvedConfigAtom,
} from '../../state/machine';
import { jackpotsAtom } from '../../state/economy';
import { ensureAudioReadyAtom } from '../../state/audio';
import { FloatingWin } from './FloatingWin';
import { AutoSpinToggle } from './AutoSpinToggle';
import { CreditBar } from './CreditBar';
import { MachineCabinet } from './MachineCabinet';
import { MachineHeader } from './MachineHeader';
import { PaylineOverlay } from './PaylineOverlay';
import { PullButton } from './PullButton';
import { ReelGrid } from './ReelGrid';
import { WinSummary } from './WinSummary';
import { useCellCenters } from './useCellCenters';
import { useWinCycle } from './useWinCycle';

const JACKPOT_SHAKE_MS = 700;
const FLOAT_TOAST_MS = 1400;
const BIG_WIN_BET_MULTIPLIER = 10;

interface MachineProps {
  spinning: boolean;
  /** Used to compute the big-win threshold for the floating toast. */
  bet: number;
  canSpin: boolean;
  onSpin: () => void;
  lastFloat: FloatEvent | null;
  lastResult: SpinResult | null;
}

export function Machine({
  spinning,
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
  const ensureAudioReady = useSetAtom(ensureAudioReadyAtom);

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

  const justWon = Boolean(lastResult && lastResult.totalPayout.gt(0) && !spinning);

  const handlePull = () => {
    ensureAudioReady();
    onSpin();
  };

  const bigThreshold = new Decimal(bet * BIG_WIN_BET_MULTIPLIER);

  return (
    <MachineCabinet shaking={shaking}>
      <MachineHeader
        name={machine.name}
        reelCount={config.topology.reelCount}
        rowCount={config.topology.rowCount}
        paylineCount={config.paylines.length}
      />

      <CreditBar />

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
            bigThreshold={bigThreshold}
          />
        )}
      </ReelGrid>

      <PullButton canSpin={canSpin} spinning={spinning} onSpin={handlePull} />

      <AutoSpinToggle />

      <WinSummary
        activeWin={spinning ? null : activeWin}
        winCount={lastResult?.wins.length ?? 0}
        activeIdx={activeWinIdx}
      />
    </MachineCabinet>
  );
}
