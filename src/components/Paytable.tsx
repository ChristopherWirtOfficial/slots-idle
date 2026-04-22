/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { useAtomValue } from 'jotai';
import { resolvedConfigAtom } from '../state/machine';
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

const Payouts = styled.span`
  display: inline-flex;
  gap: 6px;
  font-family: ${theme.font.mono};
  font-size: 11px;
  color: ${theme.color.gold};
`;

const Tier = styled.span<{ dim?: boolean }>`
  opacity: ${(p) => (p.dim ? 0.35 : 1)};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2px 18px;
  margin-bottom: 10px;
`;

const PaylinesBox = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px dotted rgba(212, 160, 74, 0.18);
`;

const PlMini = styled.svg`
  height: 28px;
`;

export function Paytable() {
  const config = useAtomValue(resolvedConfigAtom);
  const { reelCount, rowCount } = config.topology;

  // Which match counts are reachable at the current reelCount?
  const tiers: number[] = [];
  for (let n = 3; n <= reelCount; n++) tiers.push(n);

  // Payline preview SVG sizing
  const dotSpacingX = 12;
  const dotSpacingY = 8;
  const padX = 6;
  const padY = 6;
  const svgW = padX * 2 + (reelCount - 1) * dotSpacingX;
  const svgH = padY * 2 + (rowCount - 1) * dotSpacingY;
  const cx = (col: number) => padX + col * dotSpacingX;
  const cy = (row: number) => padY + row * dotSpacingY;

  return (
    <Panel>
      <Title>Paytable</Title>
      <Grid>
        {config.wild.chance > 0 && (
          <Row>
            <Left>
              <Glyph c={config.wild.color}>{config.wild.glyph}</Glyph>
              <span>{config.wild.name}</span>
            </Left>
            <Payouts>
              <Tier dim={false}>Substitutes</Tier>
            </Payouts>
          </Row>
        )}
        {config.symbols.map((s) => (
          <Row key={s.id}>
            <Left>
              <Glyph c={s.color}>{s.glyph}</Glyph>
              <span>{s.name}</span>
            </Left>
            <Payouts>
              {tiers.map((n) => {
                const val = s.payouts[n];
                return (
                  <Tier key={n} dim={val === undefined || val === 0}>
                    ×{val ?? '—'}
                  </Tier>
                );
              })}
            </Payouts>
          </Row>
        ))}
      </Grid>
      <PaylinesBox>
        {config.paylines.map((p) => {
          const pts = p.rows.map((row, col) => `${cx(col)},${cy(row)}`).join(' ');
          return (
            <PlMini key={p.id} viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: svgW }}>
              {Array.from({ length: reelCount }, (_, col) =>
                Array.from({ length: rowCount }, (_, row) => (
                  <circle
                    key={`${col}-${row}`}
                    cx={cx(col)}
                    cy={cy(row)}
                    r={1.4}
                    fill={theme.color.ivoryDim}
                    opacity={0.35}
                  />
                )),
              )}
              <polyline
                points={pts}
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
