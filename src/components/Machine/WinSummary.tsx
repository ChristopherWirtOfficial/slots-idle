/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { MachineWin } from '../../engine/types';
import { theme } from '../../theme';

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

interface WinSummaryProps {
  activeWin: MachineWin | null;
  winCount: number;
  activeIdx: number | null;
}

/**
 * A single line describing the currently-highlighted winning payline.
 * Falls back to an empty (but height-reserved) row when there's nothing
 * to show — prevents layout shift between spins.
 */
export function WinSummary({ activeWin, winCount, activeIdx }: WinSummaryProps) {
  if (!activeWin) return <Row />;

  return (
    <Row>
      <Glyph color={activeWin.symbol.color}>{activeWin.symbol.glyph}</Glyph>{' '}
      <WinName>{activeWin.name}</WinName> · +{activeWin.payout.toLocaleString()}
      {winCount > 1 && (
        <Counter>
          ({(activeIdx ?? 0) + 1}/{winCount})
        </Counter>
      )}
    </Row>
  );
}
