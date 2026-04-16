// Art deco casino palette — oxblood, gold leaf, ivory, velvet
export const theme = {
  color: {
    bg: '#0a0511',
    bgDeep: '#050209',
    velvet: '#2a0a1f',
    oxblood: '#5c1024',
    oxbloodBright: '#8a1a38',
    gold: '#d4a04a',
    goldBright: '#f4d07a',
    goldDeep: '#8a6520',
    ivory: '#f2e8d5',
    ivoryDim: '#c4b896',
    black: '#0a0511',
    win: '#f4d07a',
    bigWin: '#ff3860',
  },
  font: {
    display: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
    script: '"Cormorant SC", Georgia, serif',
    body: '"Cormorant Garamond", Georgia, serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
  },
  radius: {
    sm: '2px',
    md: '4px',
    lg: '8px',
  },
  shadow: {
    card: '0 20px 50px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,160,74,0.2) inset',
    frame: '0 0 0 2px #d4a04a, 0 0 0 4px #0a0511, 0 0 0 6px #d4a04a, 0 30px 60px -20px rgba(0,0,0,0.9)',
  },
} as const;

export type Theme = typeof theme;
