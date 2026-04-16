/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { useAtom } from 'jotai';
import { mutedAtom, volumeAtom } from '../state/audio';
import { ensureAudio } from '../audio/engine';
import { theme } from '../theme';

const Wrap = styled.div`
  position: fixed;
  top: clamp(12px, 2vw, 20px);
  right: clamp(12px, 2vw, 20px);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px 8px 10px;
  background: linear-gradient(180deg, ${theme.color.velvet}, ${theme.color.bgDeep});
  border: 1px solid ${theme.color.goldDeep};
  border-radius: ${theme.radius.md};
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.6),
    inset 0 0 0 1px rgba(212, 160, 74, 0.15);
  z-index: 50;
`;

const MuteButton = styled.button`
  background: none;
  border: none;
  color: ${theme.color.gold};
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 2px 4px;
  font-family: ${theme.font.display};
  font-weight: 700;
  &:hover {
    color: ${theme.color.goldBright};
  }
`;

const Slider = styled.input`
  -webkit-appearance: none;
  appearance: none;
  width: clamp(60px, 18vw, 100px);
  height: 4px;
  background: linear-gradient(90deg, ${theme.color.goldDeep}, ${theme.color.gold});
  border-radius: 2px;
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: ${theme.color.goldBright};
    border: 1px solid ${theme.color.goldDeep};
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  }

  &::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: ${theme.color.goldBright};
    border: 1px solid ${theme.color.goldDeep};
    cursor: pointer;
  }
`;

// Unicode glyphs — avoid depending on an icon font.
const SPEAKER_ON = '♪';
const SPEAKER_OFF = '∅';

export function VolumeControl() {
  const [volume, setVolume] = useAtom(volumeAtom);
  const [muted, setMuted] = useAtom(mutedAtom);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    ensureAudio(); // slider drag counts as gesture
    const v = Number(e.target.value);
    setVolume(v);
    if (muted && v > 0) setMuted(false);
  };

  const toggleMute = () => {
    ensureAudio();
    setMuted(!muted);
  };

  return (
    <Wrap>
      <MuteButton onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
        {muted ? SPEAKER_OFF : SPEAKER_ON}
      </MuteButton>
      <Slider
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={muted ? 0 : volume}
        onChange={handleSliderChange}
      />
    </Wrap>
  );
}
