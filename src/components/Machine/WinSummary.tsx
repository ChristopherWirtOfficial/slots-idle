/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { useAtomValue } from 'jotai';
import { theme } from '../../theme';
import { formatNum } from '../../util/format';
import { anyReelSpinningAtom } from '../../state/reels';
import { lastCommitAtom } from '../../state/session';
import { captionIdxAtom } from '../../state/winDisplay';

const Row = styled.div`
  margin-top: 8px;
  text-align: center;
  font-family: ${theme.font.body};
  font-size: 12px;
  color: ${theme.color.ivoryDim};
  min-height: 18px;
  line-height: 1.5;
`;

const Glyph = styled.span<{ color: string }>`
  color: ${(p) => p.color};
  font-weight: 700;
`;

const WinName = styled.span`
  color: ${theme.color.ivory};
`;

const Counter = styled.span`
  color: ${theme.color.ivoryDim};
  margin-left: 8px;
`;

/**
 * A single line describing the currently-highlighted winning payline.
 * Reads commit + caption index directly; no props. Falls back to an
 * empty (but height-reserved) row when there's nothing to show —
 * prevents layout shift between spins.
 */
export function WinSummary() {
  const commit = useAtomValue(lastCommitAtom);
  const captionIdx = useAtomValue(captionIdxAtom);
  const spinning = useAtomValue(anyReelSpinningAtom);

  if (spinning || !commit || captionIdx === null) return <Row />;
  const activeWin = commit.result.wins[captionIdx];
  if (!activeWin) return <Row />;

  const winCount = commit.result.wins.length;
  return (
    <Row>
      <Glyph color={activeWin.symbol.color}>{activeWin.symbol.glyph}</Glyph>{' '}
      <WinName>{activeWin.name}</WinName> · +{formatNum(activeWin.payout)}
      {winCount > 1 && (
        <Counter>
          ({captionIdx + 1}/{winCount})
        </Counter>
      )}
    </Row>
  );
}
