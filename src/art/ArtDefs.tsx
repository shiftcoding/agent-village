/**
 * Shared SVG <defs> for the painted look (design.md section 12). Rendered ONCE per document, inside `Ground`
 * (which the scene mounts once), so no component carries its own gradient or pattern copies.
 *
 * Ids are stable, prefixed `va-g-` (gradients) and `va-p-` (patterns), and listed in `ART_DEF_IDS`
 * (tested for uniqueness in art.test.ts). All colours are CSS custom properties, so the defs follow the
 * theme and the day part; strengths come from --va-tex-opacity, --va-sheen-opacity and --va-ao-opacity.
 *
 * Layering rule: components keep their FLAT token fill and draw a gradient or pattern as a separate
 * low-opacity overlay on top. If these defs are not mounted (e.g. a legend swatch outside the scene) the art
 * simply falls back to the flat fills: nothing disappears.
 */

/** Tiny deterministic PRNG so the texture tiles are identical on every render. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function grassClumps(): { dark: string; light: string; speck: string } {
  const r = rng(7);
  let dark = '';
  let light = '';
  let speck = '';
  for (let i = 0; i < 46; i++) {
    const x = r() * 160;
    const y = 8 + r() * 150;
    const h = 4 + r() * 5;
    const lean = (r() - 0.5) * 4;
    const d = `M${x.toFixed(1)},${y.toFixed(1)} q${(lean * 0.4).toFixed(1)},${(-h * 0.6).toFixed(1)} ${lean.toFixed(1)},${(-h).toFixed(1)} M${(x + 2.2).toFixed(1)},${y.toFixed(1)} q${(lean * 0.2).toFixed(1)},${(-h * 0.5).toFixed(1)} ${(lean * 0.5 + 1).toFixed(1)},${(-h * 0.8).toFixed(1)}`;
    if (i % 3 === 0) light += d;
    else dark += d;
  }
  for (let i = 0; i < 34; i++) speck += `M${(r() * 160).toFixed(1)},${(r() * 160).toFixed(1)} l0.1,0.1`;
  return { dark, light, speck };
}

function flowerDots(): Array<{ x: number; y: number; k: 1 | 2 | 3 }> {
  const r = rng(31);
  return Array.from({ length: 9 }, (_, i) => ({ x: 20 + r() * 280, y: 20 + r() * 280, k: ((i % 3) + 1) as 1 | 2 | 3 }));
}

function dirtSpecks(): { dark: string; light: string } {
  const r = rng(5);
  let dark = '';
  let light = '';
  for (let i = 0; i < 16; i++) {
    const x = r() * 48;
    const y = r() * 48;
    const w = 0.8 + r() * 1.8;
    const d = `M${x.toFixed(1)},${y.toFixed(1)} h${w.toFixed(1)}`;
    if (i % 3 === 0) light += d;
    else dark += d;
  }
  return { dark, light };
}

const CLUMPS = grassClumps();
const FLOWERS = flowerDots();
const DIRT = dirtSpecks();
const TEX = { opacity: 'var(--va-tex-opacity)' } as const;
/** Ground marks have a polarity per theme (tokens --va-tex-dark / --va-tex-light): see tokens.css and design.md section 12. */
const TEX_DARK = { opacity: 'calc(var(--va-tex-opacity) * var(--va-tex-dark))' } as const;
const TEX_LIGHT = { opacity: 'calc(var(--va-tex-opacity) * var(--va-tex-light))' } as const;
/** Roof planes run along the ground a-axis (slope +0.5): skew the pattern rows onto them. */
const ROOF_SKEW = 'skewY(26.565)';

/** Every id defined below, without the leading `#`. */
export const ART_DEF_IDS = [
  'va-g-grass',
  'va-g-sky',
  'va-g-vignette',
  'va-g-lit',
  'va-g-dim',
  'va-g-ao-base',
  'va-g-ao-top',
  'va-g-corner',
  'va-g-contact',
  'va-g-sphere',
  'va-g-cloth',
  'va-g-lampglow',
  'va-g-flame',
  'va-p-grass',
  'va-p-mottle',
  'va-p-flowers',
  'va-p-dirt',
  'va-p-cobble',
  'va-p-stone',
  'va-p-logs',
  'va-p-planks',
  'va-p-plaster',
  'va-p-thatch',
  'va-p-tiles',
  'va-p-slate',
  'va-p-slate-r',
] as const;

export type ArtDefId = (typeof ART_DEF_IDS)[number];

const hi = (k: number) => ({ stopColor: 'var(--va-highlight)', stopOpacity: `calc(var(--va-sheen-opacity) * ${k})` });
const sh = (k: number) => ({ stopColor: 'var(--va-shade)', stopOpacity: `calc(var(--va-shade-opacity) * ${k})` });
const ao = (k: number) => ({ stopColor: 'var(--va-shadow)', stopOpacity: `calc(var(--va-ao-opacity) * ${k})` });

export function ArtDefs(): JSX.Element {
  return (
    <defs>
      {/* ---------- gradients ---------- */}
      <linearGradient id="va-g-grass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--va-grass-3)" />
        <stop offset="0.5" stopColor="var(--va-grass)" />
        <stop offset="1" stopColor="var(--va-grass-2)" />
      </linearGradient>
      <radialGradient id="va-g-sky" cx="50%" cy="38%" r="55%">
        <stop offset="0" stopColor="var(--va-sky-glow)" style={{ stopOpacity: 'var(--va-sky-glow-opacity)' }} />
        <stop offset="1" stopColor="var(--va-sky-glow)" stopOpacity={0} />
      </radialGradient>
      {/* soft darkening towards the scene edges: depth without covering anything */}
      <radialGradient id="va-g-vignette" cx="50%" cy="50%" r="72%">
        <stop offset="0.6" stopColor="var(--va-shadow)" stopOpacity={0} />
        <stop offset="1" stopColor="var(--va-shadow)" style={{ stopOpacity: 'calc(var(--va-ao-opacity) * var(--va-vignette) * 0.55)' }} />
      </radialGradient>
      {/* left (lit) faces and roof planes: sheen from the top left */}
      <linearGradient id="va-g-lit" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" style={hi(1)} />
        <stop offset="0.55" style={hi(0.25)} />
        <stop offset="1" stopColor="var(--va-highlight)" stopOpacity={0} />
      </linearGradient>
      {/* right (shaded) faces: darker towards the bottom */}
      <linearGradient id="va-g-dim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={sh(0.4)} />
        <stop offset="1" style={sh(1.1)} />
      </linearGradient>
      {/* ambient occlusion: where a wall meets the ground, under eaves, in the inner corner */}
      <linearGradient id="va-g-ao-base" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" style={ao(1)} />
        <stop offset="0.3" style={ao(0.28)} />
        <stop offset="0.6" stopColor="var(--va-shadow)" stopOpacity={0} />
      </linearGradient>
      <linearGradient id="va-g-ao-top" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={ao(0.75)} />
        <stop offset="0.22" stopColor="var(--va-shadow)" stopOpacity={0} />
      </linearGradient>
      <linearGradient id="va-g-corner" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0.82" stopColor="var(--va-shadow)" stopOpacity={0} />
        <stop offset="1" style={ao(0.7)} />
      </linearGradient>
      {/* soft contact shadow under buildings and characters */}
      <radialGradient id="va-g-contact" cx="50%" cy="50%" r="50%">
        <stop offset="0" stopColor="var(--va-shadow)" style={{ stopOpacity: 'calc(var(--va-shadow-opacity) * 1.6)' }} />
        <stop offset="0.6" stopColor="var(--va-shadow)" style={{ stopOpacity: 'calc(var(--va-shadow-opacity) * 0.9)' }} />
        <stop offset="1" stopColor="var(--va-shadow)" stopOpacity={0} />
      </radialGradient>
      {/* volume for round things (tree crowns, heads, hands): highlight top left, shade bottom right */}
      <radialGradient id="va-g-sphere" cx="0.36" cy="0.3" r="0.78">
        <stop offset="0" style={hi(1.3)} />
        <stop offset="0.45" stopColor="var(--va-highlight)" stopOpacity={0} />
        <stop offset="1" style={sh(1.4)} />
      </radialGradient>
      {/* clothing and limbs: lit on the left, shaded on the right */}
      <linearGradient id="va-g-cloth" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" style={hi(0.9)} />
        <stop offset="0.4" stopColor="var(--va-highlight)" stopOpacity={0} />
        <stop offset="0.62" stopColor="var(--va-shade)" stopOpacity={0} />
        <stop offset="1" style={sh(1.5)} />
      </linearGradient>
      <radialGradient id="va-g-lampglow">
        <stop offset="0" stopColor="var(--va-glow)" stopOpacity={0.55} />
        <stop offset="1" stopColor="var(--va-glow)" stopOpacity={0} />
      </radialGradient>
      <radialGradient id="va-g-flame" cx="50%" cy="80%" r="70%">
        <stop offset="0" stopColor="var(--va-lightning)" />
        <stop offset="1" stopColor="var(--va-glow)" />
      </radialGradient>

      {/* ---------- ground patterns ---------- */}
      <pattern id="va-p-grass" width="160" height="160" patternUnits="userSpaceOnUse">
        <g fill="none" strokeLinecap="round">
          <path d={CLUMPS.dark} stroke="var(--va-grass-2)" strokeWidth="1.5" style={TEX_DARK} />
          <path d={CLUMPS.light} stroke="var(--va-grass-3)" strokeWidth="1.5" style={TEX_LIGHT} />
          <path d={CLUMPS.dark} stroke="var(--va-grass-3)" strokeWidth="1.1" strokeOpacity="0.8" transform="translate(-1.2 -0.6)" style={TEX_LIGHT} />
          <path d={CLUMPS.speck} stroke="var(--va-shade)" strokeOpacity="0.35" strokeWidth="1.2" style={TEX_DARK} />
        </g>
      </pattern>
      {/* big soft painterly patches so the meadow is not one flat colour */}
      <pattern id="va-p-mottle" width="400" height="400" patternUnits="userSpaceOnUse">
        <g style={TEX_LIGHT}>
          <ellipse cx="70" cy="80" rx="90" ry="46" fill="var(--va-grass-3)" fillOpacity="0.3" />
          <ellipse cx="180" cy="300" rx="110" ry="50" fill="var(--va-grass-3)" fillOpacity="0.26" />
          <ellipse cx="350" cy="130" rx="60" ry="30" fill="var(--va-grass-3)" fillOpacity="0.24" />
        </g>
        <g style={TEX_DARK}>
          <ellipse cx="270" cy="140" rx="70" ry="38" fill="var(--va-grass-2)" fillOpacity="0.3" />
          <ellipse cx="350" cy="350" rx="50" ry="28" fill="var(--va-grass-2)" fillOpacity="0.26" />
          <ellipse cx="20" cy="260" rx="60" ry="30" fill="var(--va-grass-2)" fillOpacity="0.22" />
        </g>
      </pattern>
      <pattern id="va-p-flowers" width="320" height="320" patternUnits="userSpaceOnUse">
        <g style={{ opacity: 'calc(var(--va-tex-opacity) * var(--va-tex-light) * 0.7)' }}>
          {FLOWERS.map((f, i) => (
            <g key={i} transform={`translate(${f.x.toFixed(1)} ${f.y.toFixed(1)})`}>
              <circle r="1.7" cx="-1.8" fill={`var(--va-flower-${f.k})`} />
              <circle r="1.7" cx="1.8" fill={`var(--va-flower-${f.k})`} />
              <circle r="1.7" cy="-1.8" fill={`var(--va-flower-${f.k})`} />
              <circle r="1.7" cy="1.8" fill={`var(--va-flower-${f.k})`} />
              <circle r="1" fill="var(--va-flower-3)" />
            </g>
          ))}
        </g>
      </pattern>
      <pattern id="va-p-dirt" width="48" height="48" patternUnits="userSpaceOnUse">
        <g fill="none" strokeLinecap="round" strokeWidth="1.6">
          <path d={DIRT.dark} stroke="var(--va-path-edge)" style={TEX_DARK} />
          <path d={DIRT.light} stroke="var(--va-highlight)" strokeOpacity="0.6" style={TEX_LIGHT} />
          <path d={DIRT.dark} stroke="var(--va-highlight)" strokeOpacity="0.5" transform="translate(1 1)" style={TEX_LIGHT} />
        </g>
      </pattern>
      {/* plaza paving: running-bond flagstones laid on the ground plane (2:1 projection) */}
      <pattern id="va-p-cobble" width="56" height="56" patternUnits="userSpaceOnUse" patternTransform="matrix(0.9 0.45 -0.9 0.45 0 0)">
        <g style={TEX_LIGHT}>
          <rect x="0" y="0" width="28" height="14" fill="var(--va-highlight)" fillOpacity="0.2" />
          <rect x="14" y="28" width="28" height="14" fill="var(--va-highlight)" fillOpacity="0.14" />
        </g>
        <g style={TEX_DARK}>
          <rect x="28" y="14" width="28" height="14" fill="var(--va-shade)" fillOpacity="0.08" />
          <rect x="0" y="42" width="14" height="14" fill="var(--va-shade)" fillOpacity="0.09" />
          <rect x="42" y="42" width="14" height="14" fill="var(--va-shade)" fillOpacity="0.09" />
        </g>
        <g style={TEX} fill="none" stroke="var(--va-plaza-2)" strokeWidth="1.4">
          <path d="M0,0 H56 M0,14 H56 M0,28 H56 M0,42 H56" />
          <path d="M28,0 V14 M0,14 V28 M56,14 V28 M14,28 V42 M42,28 V42 M28,42 V56" />
        </g>
      </pattern>

      {/* ---------- material patterns (drawn as overlays on flat token fills) ---------- */}
      <pattern id="va-p-stone" width="48" height="24" patternUnits="userSpaceOnUse">
        <g style={TEX}>
          <g fill="none" stroke="var(--va-outline)" strokeOpacity="0.5" strokeWidth="0.8">
            <path d="M0,12 H48 M0,24 H48" />
            <path d="M12,0 V12 M36,0 V12 M24,12 V24 M0,12 V24 M48,12 V24" />
          </g>
          <path d="M1,1 H11 M13,1 H35 M37,1 H47 M25,13 H47 M1,13 H23" stroke="var(--va-highlight)" strokeOpacity="0.55" strokeWidth="1" fill="none" />
          <path d="M5,8 l1,0 M20,6 l1,0 M42,7 l1,0 M10,19 l1,0 M32,20 l1,0" stroke="var(--va-shade)" strokeOpacity="0.5" strokeWidth="1.3" strokeLinecap="round" />
        </g>
      </pattern>
      <pattern id="va-p-logs" width="56" height="7" patternUnits="userSpaceOnUse">
        <g style={TEX} fill="none" strokeLinecap="round">
          <path d="M0,0.7 H56" stroke="var(--va-wood-light)" strokeWidth="1" strokeOpacity="0.8" />
          <path d="M0,6.5 H56" stroke="var(--va-wood-dark)" strokeWidth="1.2" strokeOpacity="0.8" />
          <path d="M4,3 q6,-1 12,0 M26,4 q8,-1 14,0 M44,2.6 q5,1 9,0" stroke="var(--va-wood-dark)" strokeWidth="0.6" strokeOpacity="0.55" />
        </g>
      </pattern>
      <pattern id="va-p-planks" width="12" height="48" patternUnits="userSpaceOnUse">
        <g style={TEX} fill="none" strokeLinecap="round">
          <path d="M0.5,0 V48" stroke="var(--va-wood-dark)" strokeWidth="1" strokeOpacity="0.8" />
          <path d="M1.6,0 V48" stroke="var(--va-wood-light)" strokeWidth="0.7" strokeOpacity="0.6" />
          <path d="M4,4 V16 M8,22 V38 M5,30 V44 M9,2 V10" stroke="var(--va-wood-dark)" strokeWidth="0.55" strokeOpacity="0.5" />
        </g>
      </pattern>
      <pattern id="va-p-plaster" width="36" height="36" patternUnits="userSpaceOnUse">
        <g style={TEX}>
          <path d="M3,5 l.1,0 M17,9 l.1,0 M29,4 l.1,0 M8,22 l.1,0 M24,18 l.1,0 M32,30 l.1,0 M13,32 l.1,0 M4,14 l.1,0" stroke="var(--va-shade)" strokeOpacity="0.45" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M10,12 l.1,0 M22,27 l.1,0 M30,13 l.1,0 M6,30 l.1,0" stroke="var(--va-highlight)" strokeOpacity="0.8" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M2,19 q8,-3 16,0 M20,33 q7,-2 14,0" stroke="var(--va-shade)" strokeOpacity="0.18" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </g>
      </pattern>

      {/* ---------- roof patterns: rows skewed onto the roof plane ---------- */}
      <pattern id="va-p-thatch" width="20" height="14" patternUnits="userSpaceOnUse" patternTransform={ROOF_SKEW}>
        <g style={TEX} fill="none" strokeLinecap="round">
          <path d="M0,0.6 H20" stroke="var(--va-thatch-dark)" strokeWidth="1.2" strokeOpacity="0.8" />
          <path d="M2,1 L3.4,13 M6,1 L7,13 M10,1 L11.6,13 M14,1 L15,13 M18,1 L19.4,13" stroke="var(--va-thatch-dark)" strokeWidth="0.8" strokeOpacity="0.55" />
          <path d="M4,2 L5,12 M8.4,2 L9.2,12 M12.2,2 L13.4,12 M16.4,2 L17.4,12" stroke="var(--va-highlight)" strokeWidth="0.9" strokeOpacity="0.5" />
        </g>
      </pattern>
      <pattern id="va-p-tiles" width="18" height="12" patternUnits="userSpaceOnUse" patternTransform={ROOF_SKEW}>
        <g style={TEX} fill="none" strokeLinecap="round">
          <path d="M0,6 Q4.5,0.5 9,6 Q13.5,0.5 18,6" stroke="var(--va-roof-dark)" strokeWidth="1.2" strokeOpacity="0.8" />
          <path d="M-4.5,12 Q0,6.5 4.5,12 Q9,6.5 13.5,12 Q18,6.5 22.5,12" stroke="var(--va-roof-dark)" strokeWidth="1.2" strokeOpacity="0.8" />
          <path d="M1.5,4.6 Q4.5,1.6 7.5,4.6 M10.5,4.6 Q13.5,1.6 16.5,4.6" stroke="var(--va-highlight)" strokeWidth="0.9" strokeOpacity="0.5" />
        </g>
      </pattern>
      <pattern id="va-p-slate" width="16" height="10" patternUnits="userSpaceOnUse" patternTransform={ROOF_SKEW}>
        <g style={TEX} fill="none" strokeLinecap="round">
          <path d="M0,5 H16 M0,10 H16" stroke="var(--va-slate-dark)" strokeWidth="1.1" strokeOpacity="0.85" />
          <path d="M8,0 V5 M0,5 V10 M16,5 V10" stroke="var(--va-slate-dark)" strokeWidth="0.9" strokeOpacity="0.7" />
          <path d="M1,1 H7 M9,1 H15 M-7,6 H-1 M1,6 H7 M9,6 H15" stroke="var(--va-highlight)" strokeWidth="0.8" strokeOpacity="0.4" />
        </g>
      </pattern>
      {/* mirrored slate for roof planes that rise to the right (town hall wing) */}
      <pattern id="va-p-slate-r" width="16" height="10" patternUnits="userSpaceOnUse" patternTransform="skewY(-26.565)">
        <g style={TEX} fill="none" strokeLinecap="round">
          <path d="M0,5 H16 M0,10 H16" stroke="var(--va-slate-dark)" strokeWidth="1.1" strokeOpacity="0.85" />
          <path d="M8,0 V5 M0,5 V10 M16,5 V10" stroke="var(--va-slate-dark)" strokeWidth="0.9" strokeOpacity="0.7" />
          <path d="M1,1 H7 M9,1 H15 M-7,6 H-1 M1,6 H7 M9,6 H15" stroke="var(--va-highlight)" strokeWidth="0.8" strokeOpacity="0.4" />
        </g>
      </pattern>
    </defs>
  );
}
