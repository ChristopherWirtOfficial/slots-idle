/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { theme } from '../../theme';

const Row = styled.div`
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

const Badge = styled.div`
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

interface MachineHeaderProps {
  name: string;
  reelCount: number;
  rowCount: number;
  paylineCount: number;
}

/** Top strip of the cabinet: machine name and current topology summary. */
export function MachineHeader({
  name,
  reelCount,
  rowCount,
  paylineCount,
}: MachineHeaderProps) {
  return (
    <Row>
      <Marquee>{name}</Marquee>
      <Badge>
        {reelCount}×{rowCount} · {paylineCount} lines
      </Badge>
    </Row>
  );
}
