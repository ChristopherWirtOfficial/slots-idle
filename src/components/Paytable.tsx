/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { SYMBOLS } from '../game/symbols';
import { theme } from '../theme';

const Panel = styled.div`
  background: linear-gradient(180deg, ${theme.color.velvet}, ${theme.color.bgDeep});
  border: 1px solid ${theme.color.goldDeep};
  border-radius: ${theme.radius.md};
  padding: 14px 18px;
`;

const Title = styled.div`
  font-family: ${theme.font.script};
  font-size: 10px;
  letter-spacing: 0.3em;
  color: ${theme.color.ivoryDim};
  text-transform: uppercase;
  text-align: center;
  margin-bottom: 10px;
  &::before, &::after {
    content: '◆';
    margin: 0 8px;
    color: ${theme.color.gold};
  }
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-family: ${theme.font.body};
  font-size: 12px;
  color: ${theme.color.ivoryDim};
  padding: 3px 0;
`;

const Left = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Glyph = styled.span<{ c: string }>`
  font-family: ${theme.font.display};
  font-weight: 700;
  font-size: 18px;
  color: ${(p) => p.c};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px 18px;
  margin-bottom: 10px;
`;

const PaylinesBox = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px dotted rgba(212, 160, 74, 0.18);
`;

const PlMini = styled.svg`
  width: 36px;
  height: 28px;
`;

function paylineGraph(rows: [number, number, number]) {
  // Normalize to SVG coords, 3 dots per column
  const cx = (i: number) => 6 + i * 12;
  const cy = (r: number) => 6 + r * 8;
  const pts = rows.map((r, i) => `${cx(i)},${cy(r)}`).join(' ');
  return { pts };
}

const lines: [number, number, number][] = [
  [0, 0, 0],
  [1, 1, 1],
  [2, 2, 2],
  [0, 1, 2],
  [2, 1, 0],
];

export function Paytable() {
  return (
    <Panel>
      <Title>Paytable</Title>
      <Grid>
        {SYMBOLS.map((s) => (
          <Row key={s.id}>
            <Left>
              <Glyph c={s.color}>{s.glyph}</Glyph>
              <span>{s.name}</span>
            </Left>
            <span style={{ color: theme.color.gold, fontFamily: theme.font.mono }}>
              ×{s.payout3}
            </span>
          </Row>
        ))}
      </Grid>
      <PaylinesBox>
        {lines.map((rows, idx) => {
          const g = paylineGraph(rows);
          return (
            <PlMini key={idx} viewBox="0 0 36 28">
              {/* 3x3 dot grid */}
              {[0, 1, 2].map((col) =>
                [0, 1, 2].map((row) => (
                  <circle
                    key={`${col}-${row}`}
                    cx={6 + col * 12}
                    cy={6 + row * 8}
                    r={1.4}
                    fill={theme.color.ivoryDim}
                    opacity={0.35}
                  />
                )),
              )}
              <polyline
                points={g.pts}
                fill="none"
                stroke={theme.color.gold}
                strokeWidth={1.4}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </PlMini>
          );
        })}
      </PaylinesBox>
    </Panel>
  );
}
