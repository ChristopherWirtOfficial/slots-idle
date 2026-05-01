import { createRoot } from 'react-dom/client';
import { App } from './App';
import { startTickLoop } from './tick/loop';

// Startup side-effects that don't belong inside React: kick the tick
// loop before the first render. The pulse gates on caughtUpAtom until
// useCatchUp resolves, so the loop safely no-ops through boot.
startTickLoop();

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<App />);
}
