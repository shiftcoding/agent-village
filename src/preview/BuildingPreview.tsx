import type { ReactNode } from 'react';
import { ArtDefs, Chapel, HerbalistHut, Schoolhouse, Tavern } from '../art';
import { Cottage } from '../art/v3/Cottage';

/**
 * Dev-only page (preview.html, served by `npm run dev` at /preview.html; not part of the village build): a gallery of
 * the art pass 3 buildings, one per tile, for reviewing art changes without the rest of the scene.
 * ?theme=light|dark and ?time=day|dawn|dusk|night pick the palette.
 */

const params = new URLSearchParams(window.location.search);
const theme = params.get('theme');
if (theme === 'light' || theme === 'dark') document.documentElement.setAttribute('data-theme', theme);
const time = params.get('time') ?? 'day';
/** ?only=<index> shows one building, bigger, for close inspection. */
const only = params.get('only');

function Tile({ title, children, w = 520, h = 400, y = 300 }: { title: string; children: ReactNode; w?: number; h?: number; y?: number }): JSX.Element {
  const cx = w / 2;
  return (
    <figure style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label={title} style={{ display: 'block', borderRadius: 10, border: '1px solid var(--va-border)' }}>
        <rect width={w} height={h} fill="var(--va-grass)" />
        <rect width={w} height={h} fill="url(#va-g-grass)" />
        <rect width={w} height={h} fill="url(#va-p-grass)" />
        <ellipse cx={cx} cy={y + 20} rx={w * 0.46} ry={80} fill="var(--va-path)" fillOpacity={0.35} />
        <g transform={`translate(${cx} ${y}) scale(1.45)`}>{children}</g>
      </svg>
      <figcaption style={{ textAlign: 'center', padding: '6px 0 0', color: 'var(--va-text)', fontSize: 15 }}>{title}</figcaption>
    </figure>
  );
}

const ROWS: Array<{ name: string; art: ReactNode; y?: number }> = [
  { name: 'Tavern (the inn)', art: <Tavern />, y: 300 },
  { name: 'Chapel', art: <Chapel />, y: 330 },
  { name: 'Herbalist hut', art: <HerbalistHut />, y: 300 },
  { name: 'Schoolhouse', art: <Schoolhouse />, y: 300 },
  { name: 'Cottage (shell)', art: <Cottage />, y: 310 },
];

export function BuildingPreview(): JSX.Element {
  return (
    <main style={{ background: 'var(--va-bg)', color: 'var(--va-text)', minHeight: '100vh', padding: '16px 20px', fontFamily: 'system-ui, sans-serif' }} data-daypart={time}>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <ArtDefs />
      </svg>
      <h1 style={{ fontSize: 22, margin: '0 0 4px' }}>Art pass 3: buildings</h1>
      <p style={{ margin: '0 0 14px', color: 'var(--va-text-muted)' }}>
        The buildings as drawn in the village (art pass 3, approved by Ivan). Theme {document.documentElement.getAttribute('data-theme') ?? 'system'}, time of day {time}.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: only !== null ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 16, maxWidth: 1100 }}>
        {ROWS.filter((_, i) => only === null || String(i) === only).map((r) => (
          <Tile key={r.name} title={r.name} y={r.y}>
            {r.art}
          </Tile>
        ))}
      </div>
    </main>
  );
}
