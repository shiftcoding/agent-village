import { useEffect, useLayoutEffect, useRef } from 'react';
import type { PathNetwork } from '../art';
import { WalkRunner, type Pt, type RunnerEnv, type WalkView } from './walk';

const browserEnv: RunnerEnv = {
  now: () => performance.now(),
  request: (cb) => window.requestAnimationFrame(cb),
  cancel: (id) => window.cancelAnimationFrame(id),
};

export interface WalkerOptions {
  x: number;
  y: number;
  /** Path network; read when a walk starts (the latest value is used). */
  net: PathNetwork;
  reduced: boolean;
  /** The elements whose `transform` follows the walker (visual sprite and focusable hit group). First = the sprite. */
  els: () => Array<SVGGElement | undefined>;
  /** `{flip}` while walking (start and facing changes), null on arrival or when the character goes away. */
  onState: (view: WalkView | null) => void;
  /** The character stands still at p (ref write in the Scene, no state). */
  onSettle: (p: Pt) => void;
}

/**
 * Headless walker for one character (renders nothing). When the destination (x,y) changes it walks along the paths:
 *  - rAF writes the `transform` attribute of every element from `els()` (no React state per frame, no layout reads);
 *  - `onState` fires only at the start, when the facing flips at a bend, and on arrival;
 *  - the same destination (compared as numbers) does nothing, so polls never restart anything;
 *  - reduced motion: no walk, the sprite is simply there with a 200 ms opacity cross-fade.
 * Unmounting mid-walk cancels the frame loop and reports `null`, so the Scene never keeps a stale "walking" entry.
 */
export function useWalker(o: WalkerOptions): void {
  const latest = useRef(o);
  latest.current = o;
  const runner = useRef<WalkRunner | null>(null);
  if (runner.current === null) {
    runner.current = new WalkRunner(
      { x: o.x, y: o.y },
      {
        apply: (p) => {
          const t = `translate(${p.x} ${p.y})`;
          for (const el of latest.current.els()) el?.setAttribute('transform', t);
        },
        onState: (v) => latest.current.onState(v),
        onSettle: (p) => latest.current.onSettle(p),
      },
      browserEnv,
    );
  }

  // Where the character starts (a ref write in the Scene).
  useLayoutEffect(() => {
    latest.current.onSettle({ x: o.x, y: o.y });
    // mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Layout effect: it only writes DOM attributes and refs (no React state), so the old position is restored
  // before the browser paints the new destination.
  useLayoutEffect(() => {
    const r = runner.current as WalkRunner;
    const res = r.moveTo({ x: o.x, y: o.y }, o.net, o.reduced);
    if (res === 'jump' && o.reduced) {
      const el = o.els()[0];
      if (el && typeof el.animate === 'function') el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
    }
    // The destination alone drives this effect; the network and reduced flag are read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o.x, o.y]);

  useEffect(() => {
    if (o.reduced) runner.current?.finish();
  }, [o.reduced]);

  useEffect(
    () => () => {
      runner.current?.cancel();
      latest.current.onState(null);
    },
    [],
  );
}
