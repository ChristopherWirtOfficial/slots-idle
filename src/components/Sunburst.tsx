/** @jsxImportSource @emotion/react */
import { theme } from '../theme';

interface SunburstProps {
  size?: number;
  rays?: number;
  opacity?: number;
}

export function Sunburst({ size = 600, rays = 36, opacity = 0.08 }: SunburstProps) {
  const paths = [];
  for (let i = 0; i < rays; i++) {
    const a1 = (i / rays) * Math.PI * 2;
    const a2 = ((i + 0.5) / rays) * Math.PI * 2;
    const r1 = size / 2;
    const x1 = Math.cos(a1) * r1;
    const y1 = Math.sin(a1) * r1;
    const x2 = Math.cos(a2) * r1;
    const y2 = Math.sin(a2) * r1;
    paths.push(
      <path
        key={i}
        d={`M 0 0 L ${x1} ${y1} L ${x2} ${y2} Z`}
        fill={theme.color.gold}
        opacity={opacity}
      />,
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
      style={{ position: 'absolute', pointerEvents: 'none' }}
    >
      {paths}
      <circle r={size / 2} fill="url(#sb-fade)" />
      <defs>
        <radialGradient id="sb-fade">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="70%" stopColor="transparent" />
          <stop offset="100%" stopColor={theme.color.bg} />
        </radialGradient>
      </defs>
    </svg>
  );
}
