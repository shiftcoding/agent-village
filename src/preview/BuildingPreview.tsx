import type { ReactNode } from 'react';
import { ArtDefs, Chapel, HerbalistHut, Tavern } from '../art';
import { Cottage } from '../art/v3/Cottage';
import { Inn } from '../art/v3/Inn';
import { StoneChapel } from '../art/v3/StoneChapel';

/**
 * Dev-only page (preview.html, served by `npm run dev` at /preview.html; not part of the village build): the current
 * building art next to the art pass 3 designs, so Ivan can approve them before they replace anything in the village.
 * ?theme=light|dark and ?time=day|dawn|dusk|night pick the palette.
 */

const params = new URLSearchParams(window.location.search);
const theme = params.get('theme');
if (theme === 'light' || theme === 'dark') document.documentElement.setAttribute('data-theme', theme);
const time = params.get('time') ?? 'day';
/** ?only=0|1|2 shows one row, ?new=1 only the new design (bigger, for close inspection). */
const only = params.get('only');
const newOnly = params.get('new') === '1';

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

const ROWS: Array<{ name: string; now: ReactNode; next: ReactNode; y?: number }> = [
  { name: 'Inn (replaces the tavern)', now: <Tavern />, next: <Inn />, y: 300 },
  { name: 'Cottage (shell for the specialist houses)', now: <HerbalistHut />, next: <Cottage />, y: 310 },
  { name: 'Stone chapel', now: <Chapel />, next: <StoneChapel />, y: 330 },
];

export function BuildingPreview(): JSX.Element {
  return (
    <main style={{ background: 'var(--va-bg)', color: 'var(--va-text)', minHeight: '100vh', padding: '16px 20px', fontFamily: 'system-ui, sans-serif' }} data-daypart={time}>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <ArtDefs />
      </svg>
      <h1 style={{ fontSize: 22, margin: '0 0 4px' }}>Art pass 3 preview: buildings</h1>
      <p style={{ margin: '0 0 14px', color: 'var(--va-text-muted)' }}>
        Left: the village today. Right: the new designs. Theme {document.documentElement.getAttribute('data-theme') ?? 'system'}, time of day {time}.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: newOnly ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 16, maxWidth: 1100 }}>
        {ROWS.filter((_, i) => only === null || String(i) === only).flatMap((r) => [
          newOnly ? null : (
            <Tile key={`${r.name}-now`} title={`Today: ${r.name}`} y={r.y}>
              {r.now}
            </Tile>
          ),
          <Tile key={`${r.name}-next`} title={`New: ${r.name}`} y={r.y}>
            {r.next}
          </Tile>,
        ])}
      </div>
    </main>
  );
}
