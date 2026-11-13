import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ART_DEF_IDS } from './ArtDefs';
import { LANTERN_SPOTS, PIPELINE_STOPS, SCENE, gridToScene } from './layout';
import { PATH_EDGES, PATH_NODES, pathNetwork, routeAlongPaths } from './network';
import { SPECIALIST_ANCHORS, SPECIALIST_ORIGINS, SPECIALIST_PLACES, SPECIALIST_RINGS } from './specialists/specialists';

const spots = [
  { id: 'flowbro', ...gridToScene(3, 2) },
  { id: 'agent-village', ...gridToScene(-3, 2) },
];

describe('path network', () => {
  const net = pathNetwork(spots);
  it('has only known nodes in its edges, all inside the viewBox', () => {
    for (const [a, b] of net.edges) {
      expect(net.nodes[a], a).toBeDefined();
      expect(net.nodes[b], b).toBeDefined();
    }
    for (const [k, p] of Object.entries(net.nodes)) {
      expect(p.x, k).toBeGreaterThan(0);
      expect(p.x, k).toBeLessThan(SCENE.width);
      expect(p.y, k).toBeGreaterThan(0);
      expect(p.y, k).toBeLessThan(SCENE.height);
    }
  });
  it('contains every required stop and each project door', () => {
    for (const k of ['gate', 'plaza', 'plaza-n', 'plaza-e', 'plaza-w', 'plaza-s', 'hall', 'quest-board', 'chronicle', 'tavern', 'chapel', 'well', 'herbalist', 'schoolhouse']) expect(PATH_NODES[k], k).toBeDefined();
    expect(net.nodes['door:flowbro']).toBeDefined();
    expect(net.nodes['door:agent-village']).toBeDefined();
    expect(PATH_EDGES.length).toBeGreaterThan(20);
  });
  it('is connected: every node is reachable from the gate', () => {
    for (const k of Object.keys(net.nodes)) {
      const r = routeAlongPaths(net, 'gate', k);
      expect(r.length, k).toBeGreaterThan(0);
    }
  });
  it('routes tavern to town hall along paths, ending at the hall steps', () => {
    const r = routeAlongPaths(net, 'tavern', 'hall');
    expect(r.length).toBeGreaterThan(3);
    expect(r[r.length - 1]).toEqual(PATH_NODES.hall);
  });
  it('returns [] for unknown ids', () => {
    expect(routeAlongPaths(net, 'gate', 'nowhere')).toEqual([]);
  });
});

describe('specialists', () => {
  it('stand inside the viewBox with at least 3 work spots', () => {
    for (const p of SPECIALIST_PLACES) {
      const o = SPECIALIST_ORIGINS[p];
      const ring = SPECIALIST_RINGS[p];
      expect(SPECIALIST_ANCHORS[p].workSpots.length).toBeGreaterThanOrEqual(3);
      expect(o.x + ring.x).toBeGreaterThanOrEqual(0);
      expect(o.x + ring.x + ring.w).toBeLessThanOrEqual(SCENE.width);
      expect(o.y + ring.y).toBeGreaterThanOrEqual(0);
      expect(o.y + ring.y + ring.h).toBeLessThanOrEqual(SCENE.height);
    }
  });
  it('keep clear of the needs-you card area', () => {
    for (const p of SPECIALIST_PLACES) {
      const o = SPECIALIST_ORIGINS[p];
      const r = SPECIALIST_RINGS[p];
      const hit = o.x + r.x < 1000 && o.x + r.x + r.w > 600 && o.y + r.y < 300 && o.y + r.y + r.h > 40;
      expect(hit, p).toBe(false);
    }
  });
  it('pipeline stops and lanterns are inside the viewBox', () => {
    for (const p of [...Object.values(PIPELINE_STOPS), ...LANTERN_SPOTS]) {
      expect(p.x).toBeGreaterThan(20);
      expect(p.x).toBeLessThan(SCENE.width - 20);
      expect(p.y).toBeGreaterThan(20);
      expect(p.y).toBeLessThan(SCENE.height);
    }
  });
});

/* ---- day-part palettes: the scene must keep the focus ring visible (>= 3:1) and sign text readable ---- */
const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
const lum = (h: string): number => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * (c[0] ?? 0) + 0.7152 * (c[1] ?? 0) + 0.0722 * (c[2] ?? 0);
};
const ratio = (a: string, b: string): number => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return ((x ?? 0) + 0.05) / ((y ?? 0) + 0.05);
};
const hexes = (block: string): Record<string, string> => Object.fromEntries([...block.matchAll(/--va-([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1] as string, m[2] as string]));
const blockAfter = (head: string): string => {
  const i = css.indexOf(head);
  expect(i, head).toBeGreaterThan(-1);
  return css.slice(i, css.indexOf('}', i));
};

describe('day-part palettes', () => {
  const light = hexes(blockAfter(':root {'));
  const dark = { ...light, ...hexes(blockAfter(':root[data-theme="dark"] {')) };
  for (const part of ['dawn', 'day', 'dusk', 'night']) {
    it(`${part}: focus ring >= 3:1 on grass, path and plaza in both themes`, () => {
      const l = hexes(blockAfter(`[data-daypart="${part}"] {`));
      const d = hexes(blockAfter(`:root[data-theme="dark"][data-daypart="${part}"] {`));
      for (const k of ['grass', 'grass-3', 'path', 'plaza']) {
        expect(ratio(light.focus as string, l[k] as string), `light ${part} ${k}`).toBeGreaterThanOrEqual(3);
        expect(ratio(dark.focus as string, d[k] as string), `dark ${part} ${k}`).toBeGreaterThanOrEqual(3);
      }
    });
  }
  it('registers the changing tokens for smooth transitions', () => {
    expect(css).toContain("@property --va-grass { syntax: '<color>'; inherits: true;");
    expect(css).toContain("@property --va-lamp { syntax: '<number>'; inherits: true;");
    expect(css).toMatch(/@media \(prefers-reduced-motion: no-preference\) \{\s*\[data-daypart\]\.va-daypart-ready \{\s*transition-property/);
  });
});

/* ---- art pass (T31): shared defs and painted-layer tokens ---- */
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.tsx') ? [p] : [];
  });
const artDir = new URL('.', import.meta.url).pathname;

describe('shared defs', () => {
  const defsSrc = readFileSync(join(artDir, 'ArtDefs.tsx'), 'utf8');
  const defined = [...defsSrc.matchAll(/<(?:linearGradient|radialGradient|pattern) id="(va-[\w-]+)"/g)].map((m) => m[1] as string);
  it('has unique ids, each listed in ART_DEF_IDS and vice versa', () => {
    expect(new Set(defined).size).toBe(defined.length);
    expect([...defined].sort()).toEqual([...ART_DEF_IDS].sort());
    expect(new Set(ART_DEF_IDS).size).toBe(ART_DEF_IDS.length);
  });
  it('defines every id the art components reference (url(#va-...), U(...) and g(...))', () => {
    const used = new Set<string>();
    for (const f of walk(artDir)) {
      if (f.endsWith('ArtDefs.tsx')) continue;
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/url\(#(va-[\w-]+)\)/g)) used.add(m[1] as string);
      for (const m of src.matchAll(/\bU\('([\w-]+)'\)/g)) used.add(`va-${m[1]}`);
      for (const m of src.matchAll(/\bg\('(g-[\w-]+)'\)/g)) used.add(`va-${m[1]}`);
    }
    for (const id of used) expect(ART_DEF_IDS as readonly string[], id).toContain(id);
    expect(used.size).toBeGreaterThan(10);
  });
  it('defines the material patterns that FaceTex and RoofFx build ids from', () => {
    for (const id of ['stone', 'plaster', 'logs', 'planks', 'thatch', 'tiles', 'slate']) expect(ART_DEF_IDS as readonly string[], id).toContain(`va-p-${id}`);
  });
  it('has no per-instance useId gradients left in the art', () => {
    for (const f of walk(artDir)) expect(readFileSync(f, 'utf8'), f).not.toContain('useId');
  });
  it('defines the painted-layer tokens in light, dark and the OS dark block', () => {
    for (const k of ['tex-opacity', 'sheen-opacity', 'ao-opacity', 'tex-dark', 'tex-light', 'vignette', 'blush', 'flower-1']) {
      expect(blockAfter(':root {'), k).toContain(`--va-${k}:`);
      expect(blockAfter(':root[data-theme="dark"] {'), k).toContain(`--va-${k}:`);
      expect(css.slice(css.indexOf('@media (prefers-color-scheme: dark)'))).toContain(`--va-${k}:`);
    }
  });
});

describe('textured ground keeps the focus ring at 3:1 (area-averaged, polarity per theme)', () => {
  const nums = (head: string): Record<string, number> => Object.fromEntries([...blockAfter(head).matchAll(/--va-([\w-]+):\s*([\d.]+);/g)].map((m) => [m[1] as string, parseFloat(m[2] as string)]));
  const light = hexes(blockAfter(':root {'));
  const dark = { ...light, ...hexes(blockAfter(':root[data-theme="dark"] {')) };
  const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mixc = (top: string, bottom: number[], a: number) => bottom.map((c, i) => c * (1 - a) + (rgb(top)[i] ?? 0) * a);
  const lumRgb = (c: number[]) => {
    const l = c.map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * (l[0] ?? 0) + 0.7152 * (l[1] ?? 0) + 0.0722 * (l[2] ?? 0);
  };
  const ratioRgb = (a: number[], b: number[]) => {
    const [x, y] = [lumRgb(a), lumRgb(b)].sort((p, q) => q - p);
    return ((x ?? 0) + 0.05) / ((y ?? 0) + 0.05);
  };
  for (const theme of ['light', 'dark'] as const) {
    const n = theme === 'light' ? nums(':root {') : { ...nums(':root {'), ...nums(':root[data-theme="dark"] {') };
    for (const part of ['dawn', 'day', 'dusk', 'night']) {
      it(`${theme} ${part}`, () => {
        const t = theme === 'light' ? { ...light, ...hexes(blockAfter(`[data-daypart="${part}"] {`)) } : { ...dark, ...hexes(blockAfter(`:root[data-theme="dark"][data-daypart="${part}"] {`)) };
        const D = (n['tex-opacity'] ?? 0) * (n['tex-dark'] ?? 0);
        const L = (n['tex-opacity'] ?? 0) * (n['tex-light'] ?? 0);
        const layer = (c: number[], col: string, cov: number, op: number) => mixc(col, c, cov * op);
        const ground = (base: string) => layer(layer(layer(rgb(base), t['grass-2'] as string, 0.14, D), t['grass-3'] as string, 0.2, L), t.shade as string, 0.03, 0.35 * D);
        const path = layer(layer(rgb(t.path as string), t['path-edge'] as string, 0.1, D), t.highlight as string, 0.14, 0.6 * L);
        const plaza = layer(layer(layer(rgb(t.plaza as string), t['plaza-2'] as string, 0.2, n['tex-opacity'] ?? 0), t.highlight as string, 0.25, 0.2 * L), t.shade as string, 0.3, 0.08 * D);
        const vign = (c: number[]) => mixc(t.shadow as string, c, (n['ao-opacity'] ?? 0) * (n.vignette ?? 0) * 0.55);
        for (const c of [ground(t.grass as string), ground(t['grass-3'] as string), path, plaza]) {
          expect(ratioRgb(rgb(t.focus as string), c)).toBeGreaterThanOrEqual(3);
          expect(ratioRgb(rgb(t.focus as string), vign(c))).toBeGreaterThanOrEqual(3);
        }
      });
    }
  }
});
