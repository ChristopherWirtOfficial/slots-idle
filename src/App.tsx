/** @jsxImportSource @emotion/react */
import { Global, css } from '@emotion/react';
import styled from '@emotion/styled';
import { Machine } from './components/Machine';
import { UpgradesPanel } from './components/UpgradesPanel';
import { StatsPanel } from './components/StatsPanel';
import { Paytable } from './components/Paytable';
import { theme } from './theme';
import { useAutospin } from './hooks/useAutospin';
import { useCatchUp } from './hooks/useCatchUp';
import { usePassiveIncome } from './hooks/usePassiveIncome';
import { useAnimationTick } from './hooks/useAnimationTick';
import { useReelTickAudio } from './hooks/useReelTickAudio';
import { VolumeControl } from './components/VolumeControl';
import { CheatPanel } from './components/CheatPanel';
import { OfflineReturnModal } from './components/OfflineReturnModal';

const globalStyles = css`
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Cormorant+SC:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  html, body, #root {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    background:
      radial-gradient(ellipse at top, ${theme.color.velvet} 0%, ${theme.color.bgDeep} 60%),
      ${theme.color.bg};
    color: ${theme.color.ivory};
    font-family: ${theme.font.body};
  }

  *, *::before, *::after { box-sizing: border-box; }

  body {
    background-image:
      radial-gradient(ellipse 80% 60% at 50% 0%, rgba(92,16,36,0.35) 0%, transparent 60%),
      radial-gradient(circle at 20% 80%, rgba(212,160,74,0.05) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(212,160,74,0.04) 0%, transparent 50%);
    background-attachment: fixed;
    min-height: 100vh;
    &::before {
      content: '';
      position: fixed;
      inset: 0;
      pointer-events: none;
      opacity: 0.04;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>");
      z-index: 100;
    }
  }

  button { font-family: inherit; }
`;

const Page = styled.div`
  min-height: 100vh;
  padding: clamp(16px, 4vw, 40px) clamp(12px, 3vw, 24px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(16px, 3vw, 28px);
`;

const TopBanner = styled.header`
  text-align: center;
  max-width: 800px;
`;

const BrandLine = styled.div`
  font-family: ${theme.font.script};
  font-size: 11px;
  letter-spacing: 0.5em;
  color: ${theme.color.ivoryDim};
  text-transform: uppercase;
  margin-bottom: 6px;
`;

const BrandMark = styled.div`
  font-family: ${theme.font.display};
  font-style: italic;
  font-weight: 500;
  font-size: 13px;
  letter-spacing: 0.2em;
  color: ${theme.color.goldDeep};
  text-transform: uppercase;
  &::before, &::after {
    content: '———';
    margin: 0 14px;
    color: ${theme.color.goldDeep};
  }
`;

const Layout = styled.div`
  display: grid;
  width: 100%;
  max-width: 520px;
  gap: clamp(14px, 3vw, 24px);
  grid-template-columns: 1fr;
  grid-template-areas:
    'machine'
    'upgrades'
    'paytable'
    'stats';

  @media (min-width: 760px) {
    max-width: 900px;
    grid-template-columns: 1.2fr 1fr;
    grid-template-areas:
      'machine   upgrades'
      'paytable  upgrades'
      'stats     upgrades';
    align-items: start;
  }

  @media (min-width: 1100px) {
    max-width: 1280px;
    grid-template-columns: minmax(280px, 320px) minmax(auto, 500px) minmax(300px, 360px);
    grid-template-areas:
      'stats machine  upgrades'
      'stats paytable upgrades';
    align-items: start;
  }
`;

const MachineArea = styled.div`
  grid-area: machine;
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 2.5vw, 20px);
  min-width: 0;
`;

const PaytableArea = styled.div`
  grid-area: paytable;
  min-width: 0;
`;

const UpgradesArea = styled.div`
  grid-area: upgrades;
  min-width: 0;
`;

const StatsArea = styled.div`
  grid-area: stats;
  min-width: 0;
`;

const Footer = styled.footer`
  font-family: ${theme.font.script};
  font-size: 10px;
  letter-spacing: 0.3em;
  color: rgba(196, 184, 150, 0.35);
  text-transform: uppercase;
  text-align: center;
  padding-top: 20px;
`;

/**
 * App root. Responsibilities:
 *  - Global CSS (emotion <Global>)
 *  - Top-level lifecycle hooks (tick loop, animation, reel sync, etc)
 *  - Fixed-position chrome (volume control, cheat panel)
 *  - Page layout structure
 *
 * Everything else — state, actions, game logic — lives in the panel
 * components, which read atoms directly. App doesn't drill props.
 */
export function App() {
  // One-time catch-up on session start: reads persisted lastTickAt,
  // replays offline time through virtual ticks, flips caughtUp true.
  // The tick loop (started in main.tsx) no-ops until this resolves.
  useCatchUp();

  // Subscribes autospin to the tick loop at upgrade-derived frequency.
  useAutospin();

  // Passive chip income — always on, upgrade-controlled rate and amount.
  usePassiveIncome();

  // Drives reel animations: frame time, landings, payout commit.
  useAnimationTick();

  // Reel-tick audio: fire sfx when a spinning reel crosses integer cells.
  useReelTickAudio();

  return (
    <>
      <Global styles={globalStyles} />
      <VolumeControl />
      <CheatPanel />
      <OfflineReturnModal />
      <Page>
        <TopBanner>
          <BrandLine>An evening's diversion</BrandLine>
          <BrandMark>The Establishment</BrandMark>
        </TopBanner>

        <Layout>
          <StatsArea>
            <StatsPanel />
          </StatsArea>

          <MachineArea>
            <Machine />
          </MachineArea>

          <UpgradesArea>
            <UpgradesPanel />
          </UpgradesArea>

          <PaytableArea>
            <Paytable />
          </PaytableArea>
        </Layout>

        <Footer>Play responsibly · Saves to local storage</Footer>
      </Page>
    </>
  );
}
