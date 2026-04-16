/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { SYMBOLS } from '../game/symbols';
import { theme } from '../theme';

const Panel = styled.div`
  background: linear-gradient(180deg, ${theme.color.velvet}, ${theme.color.bgDeep});
  border-radius: ${theme.radius.md};
  padding: 16px 20px;
  box-shadow: ${theme.shadow.card};
`;

const Title = styled.div`
  font-family: ${theme.font.script};
  font-size: 11px;
  letter-spacing: 0.3em;
  color: ${theme.color.ivoryDim};
  text-transform: uppercase;
  text-align: center;
  margin-bottom: 12px;
  &::before, &::after {
    content: '◆';
    margin: 0 10px;
    color: ${theme.color.gold};
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  gap: 8px 16px;
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: ${theme.font.mono};
  font-size: 11px;
  color: ${theme.color.ivoryDim};
`;

const Glyph = styled.span`
  font-size: 18px;
  font-family: ${theme.font.display};
  font-weight: 700;
`;

export function Paytable() {
  return (
    <Panel>
      <Title>Paytable · 3-in-a-row</Title>
      <Grid>
        {SYMBOLS.map((s) => (
          <Item key={s.id}>
            <Glyph style={{ color: s.color }}>{s.glyph}</Glyph>
            <span style={{ color: theme.color.gold }}>×{s.payout3}</span>
          </Item>
        ))}
      </Grid>
    </Panel>
  );
}
