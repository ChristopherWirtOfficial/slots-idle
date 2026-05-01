/** @jsxImportSource @emotion/react */
import { useAtomValue, useSetAtom } from 'jotai';
import Decimal from 'break_infinity.js';
import { useRef } from 'react';
import { Reel } from '../Reel';
import {
  activeMachineAtom,
  reelCountAtom,
  resolvedConfigAtom,
} from '../../state/machine';
import { ensureAudioReadyAtom } from '../../state/audio';
import { currentBetAtom } from '../../state/upgrades';
import { anyReelSpinningAtom } from '../../state/reels';
import { canSpinAtom } from '../../state/canSpin';
import { lastCommitAtom } from '../../state/session';
import { visibleFloatAtom } from '../../state/winDisplay';
import { spinActionAtom } from '../../state/actions';
import { FloatingWin } from './FloatingWin';
import { AutoSpinToggle } from './AutoSpinToggle';
import { CreditBar } from './CreditBar';
import { MachineCabinet } from './MachineCabinet';
import { MachineHeader } from './MachineHeader';
import { PullButton } from './PullButton';
import { ReelGrid } from './ReelGrid';
import { WinSummary } from './WinSummary';
import { WildRerollPopup } from './WildRerollPopup';
import { WinOverlays } from './WinOverlays';
import { LineFloats } from './LineFloats';
import { useCellCenters } from './useCellCenters';

const BIG_WIN_BET_MULTIPLIER = 10;

export function Machine() {
  const machine = useAtomValue(activeMachineAtom);
  const config = useAtomValue(resolvedConfigAtom);
  const reelCount = useAtomValue(reelCountAtom);
  const bet = useAtomValue(currentBetAtom);
  const spinning = useAtomValue(anyReelSpinningAtom);
  const canSpin = useAtomValue(canSpinAtom);
  const commit = useAtomValue(lastCommitAtom);
  const visibleFloat = useAtomValue(visibleFloatAtom);
  const onSpin = useSetAtom(spinActionAtom);
  const ensureAudioReady = useSetAtom(ensureAudioReadyAtom);

  // Grid geometry for overlay positioning (real DOM measurement).
  const gridRef = useRef<HTMLDivElement>(null);
  const centers = useCellCenters(gridRef, reelCount, config.topology.rowCount);

  const justWon = Boolean(commit && commit.result.totalPayout.gt(0) && !spinning);

  const handlePull = () => {
    ensureAudioReady();
    onSpin();
  };

  const bigThreshold = new Decimal(bet * BIG_WIN_BET_MULTIPLIER);

  return (
    <MachineCabinet>
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

        <WinOverlays centers={centers} />
        <LineFloats centers={centers} bet={bet} />

        {visibleFloat && (
          <FloatingWin
            amount={visibleFloat.amount}
            isJackpot={visibleFloat.isJackpot}
            bigThreshold={bigThreshold}
          />
        )}

        <WildRerollPopup />
      </ReelGrid>

      <PullButton canSpin={canSpin} spinning={spinning} onSpin={handlePull} />

      <AutoSpinToggle />

      <WinSummary />
    </MachineCabinet>
  );
}
