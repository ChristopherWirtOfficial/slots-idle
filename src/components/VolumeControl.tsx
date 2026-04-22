/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import {
  ensureAudioReadyAtom,
  mutedAtom,
  setMutedAtom,
  setVolumeAtom,
  volumeAtom,
} from '../state/audio';
import { theme } from '../theme';

const Wrap = styled.div`
  position: fixed;
  top: clamp(10px, 2vw, 18px);
  right: clamp(10px, 2vw, 18px);
  z-index: 50;
`;

const IconButton = styled.button<{ open: boolean }>`
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, ${theme.color.velvet}, ${theme.color.bgDeep});
  border: 1px solid ${(p) => (p.open ? theme.color.goldBright : theme.color.goldDeep)};
  border-radius: ${theme.radius.md};
  color: ${theme.color.gold};
  font-family: ${theme.font.display};
  font-weight: 700;
  font-size: 18px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  transition: border-color 120ms;
  &:hover { border-color: ${theme.color.gold}; color: ${theme.color.goldBright}; }
`;

const Popover = styled.div`
  position: absolute;
  top: 44px;
  right: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: linear-gradient(180deg, ${theme.color.velvet}, ${theme.color.bgDeep});
  border: 1px solid ${theme.color.goldDeep};
  border-radius: ${theme.radius.md};
  box-shadow:
    0 6px 18px rgba(0, 0, 0, 0.7),
    inset 0 0 0 1px rgba(212, 160, 74, 0.15);
  white-space: nowrap;
`;

const PopLabel = styled.span`
  font-family: ${theme.font.script};
  font-size: 10px;
  letter-spacing: 0.25em;
  color: ${theme.color.ivoryDim};
  text-transform: uppercase;
`;

const Slider = styled.input`
  -webkit-appearance: none;
  appearance: none;
  width: 120px;
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

const MuteInlineBtn = styled.button`
  background: none;
  border: none;
  color: ${theme.color.gold};
  font-size: 14px;
  font-family: ${theme.font.display};
  cursor: pointer;
  padding: 2px 4px;
  &:hover { color: ${theme.color.goldBright}; }
`;

const SPEAKER_ON = '♪';
const SPEAKER_OFF = '∅';

export function VolumeControl() {
  const volume = useAtomValue(volumeAtom);
  const muted = useAtomValue(mutedAtom);
  const setVolume = useSetAtom(setVolumeAtom);
  const setMuted = useSetAtom(setMutedAtom);
  const ensureAudioReady = useSetAtom(ensureAudioReadyAtom);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    ensureAudioReady();
    setVolume(Number(e.target.value));
  };

  const toggleMute = () => {
    ensureAudioReady();
    setMuted(!muted);
  };

  const toggleOpen = () => {
    ensureAudioReady();
    setOpen((o) => !o);
  };

  return (
    <Wrap ref={wrapRef}>
      <IconButton onClick={toggleOpen} open={open} aria-label="Audio settings">
        {muted ? SPEAKER_OFF : SPEAKER_ON}
      </IconButton>
      {open && (
        <Popover>
          <MuteInlineBtn onClick={toggleMute}>
            {muted ? SPEAKER_OFF : SPEAKER_ON}
          </MuteInlineBtn>
          <PopLabel>Vol</PopLabel>
          <Slider
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={handleSliderChange}
          />
        </Popover>
      )}
    </Wrap>
  );
}
