/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';

const Block = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #9ab;
  text-transform: uppercase;
`;

const Buttons = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const Btn = styled.button`
  flex: 1;
  min-width: 50px;
  padding: 6px 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: #9ab;
  background: #121620;
  border: 1px solid #2a3340;
  border-radius: 3px;
  cursor: pointer;
  transition: all 120ms;
  &:hover {
    color: #6bf;
    border-color: #6bf;
  }
`;

const Note = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.1em;
  color: #678;
  text-transform: uppercase;
`;

const KEY = 'lucky-idle-slots:v1:lastTickAt';

const presets: Array<{ label: string; minutes: number }> = [
  { label: '5m', minutes: 5 },
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '2h', minutes: 120 },
];

/**
 * Dev tool: backdate the persisted lastTickAt by N minutes and reload
 * the page. Triggers the next session's useCatchUp to replay that
 * gap. 2h tests the offline cap (>1h gets clamped to 1h).
 *
 * Writes localStorage directly rather than going through jotai —
 * atomWithStorage's write path would sync back to the atom but we
 * want the value to land before the reload happens regardless of
 * React scheduling.
 */
export function OfflineSimCheat() {
  const simulate = (minutes: number) => {
    const backdated = Date.now() - minutes * 60 * 1000;
    // atomWithStorage stores values as JSON strings.
    localStorage.setItem(KEY, JSON.stringify(backdated));
    window.location.reload();
  };

  return (
    <Block>
      <Label>Simulate offline</Label>
      <Buttons>
        {presets.map((p) => (
          <Btn key={p.label} onClick={() => simulate(p.minutes)}>
            {p.label}
          </Btn>
        ))}
      </Buttons>
      <Note>reloads the page</Note>
    </Block>
  );
}
