/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { useAtom, useAtomValue } from 'jotai';
import { cheatLuckAtom } from '../../state/cheats';
import { luckAtom } from '../../state/upgrades';

const LUCK_SLIDER_MAX = 3.0;
const LUCK_SLIDER_STEP = 0.05;
const DEFAULT_OVERRIDE = 1.0;

const Block = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const TopRow = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #9ab;
  cursor: pointer;
  user-select: none;
`;

const Checkbox = styled.input`
  accent-color: #6bf;
  width: 13px;
  height: 13px;
  margin: 0;
`;

const Label = styled.span`
  flex: 1;
  text-transform: uppercase;
`;

const Value = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: #6bf;
  min-width: 48px;
  text-align: right;
  tabular-nums: normal;
  font-variant-numeric: tabular-nums;
`;

const Slider = styled.input`
  width: 100%;
  accent-color: #6bf;
  margin: 0;
  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

const SubLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.1em;
  color: #678;
  text-transform: uppercase;
  display: flex;
  justify-content: space-between;
`;

export function LuckCheat() {
  const [override, setOverride] = useAtom(cheatLuckAtom);
  const currentLuck = useAtomValue(luckAtom);

  const enabled = override !== null;

  const handleToggle = () => {
    setOverride(enabled ? null : DEFAULT_OVERRIDE);
  };

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOverride(parseFloat(e.target.value));
  };

  return (
    <Block>
      <TopRow>
        <Checkbox type="checkbox" checked={enabled} onChange={handleToggle} />
        <Label>Override luck</Label>
        <Value>{enabled ? (override as number).toFixed(2) : '—'}</Value>
      </TopRow>
      <Slider
        type="range"
        min={0}
        max={LUCK_SLIDER_MAX}
        step={LUCK_SLIDER_STEP}
        value={enabled ? (override as number) : 0}
        onChange={handleSlider}
        disabled={!enabled}
      />
      <SubLabel>
        <span>effective: {currentLuck.toFixed(3)}</span>
        <span>max natural: 0.50</span>
      </SubLabel>
    </Block>
  );
}
