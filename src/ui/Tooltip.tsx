import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type FocusEvent, type PointerEvent, type ReactNode, type RefObject } from 'react';

export interface Tip {
  /** 'focus': opened only by keyboard focus. It never intercepts the pointer (see .va-tip-focus), so it cannot cover neighbours. */
  src: 'pointer' | 'focus';
  text: string;
  x: number;
  y: number;
}

/** Next tip state. Returns the SAME object when nothing changed, so a repeated focus or hover never re-renders (no update loops). */
export function nextTip(cur: Tip | null, text: string, x: number, y: number, fromPointer: boolean): Tip {
  const src = fromPointer ? 'pointer' : 'focus';
  return cur && cur.src === src && cur.text === text && (fromPointer || (cur.x === x && cur.y === y)) ? cur : { src, text, x, y };
}

interface TipApi {
  show: (text: string, x: number, y: number, fromPointer: boolean, owner?: Element | null) => void;
  /** The label of the element that owns the open tip changed: update the text in place. */
  refresh: (owner: Element, text: string) => void;
  /** Hide the tip while its owner is busy (a walking character). */
  hideFor: (owner: Element) => void;
  /** Pointer left the trigger: close after a short grace period unless the pointer reaches the tooltip. */
  leave: () => void;
  /** Focus left the trigger: close now. */
  blur: () => void;
}

const Ctx = createContext<TipApi>({ show: () => undefined, refresh: () => undefined, hideFor: () => undefined, leave: () => undefined, blur: () => undefined });

/**
 * One shared tooltip (WCAG 1.4.13): opens on pointer hover and keyboard focus, stays open while the pointer is
 * over the trigger or the tooltip, and Escape dismisses it until the pointer leaves or focus moves.
 * The trigger carries the same text as its aria-label, so the tooltip is hidden from assistive tech (no double
 * reading) and is never the only way to get the information.
 */
export function TooltipProvider({ children }: { children: ReactNode }): JSX.Element {
  const [tip, setTip] = useState<Tip | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const dismissed = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const owner = useRef<Element | null>(null);

  const cancel = (): void => {
    if (timer.current !== undefined) window.clearTimeout(timer.current);
    timer.current = undefined;
  };
  const show = useCallback((text: string, x: number, y: number, fromPointer: boolean, who?: Element | null) => {
    cancel();
    if (dismissed.current) return;
    owner.current = who ?? null;
    // while hovering, keep the tooltip where it opened so the pointer can travel onto it
    // keep the same object when nothing changed, so a repeated focus or hover never re-renders (no update loops)
    setTip((cur) => nextTip(cur, text, x, y, fromPointer));
  }, []);
  const leave = useCallback(() => {
    cancel();
    timer.current = window.setTimeout(() => {
      dismissed.current = false;
      owner.current = null;
      setTip(null);
    }, 200);
  }, []);
  const blur = useCallback(() => {
    cancel();
    dismissed.current = false;
    owner.current = null;
    setTip(null);
  }, []);
  // Same-object guards keep these from ever looping: nothing changes, nothing re-renders.
  const refresh = useCallback((who: Element, text: string) => {
    if (owner.current !== who) return;
    setTip((cur) => (cur && cur.text !== text ? { ...cur, text } : cur));
  }, []);
  const hideFor = useCallback((who: Element) => {
    if (owner.current !== who) return;
    cancel();
    setTip((cur) => (cur ? null : cur));
  }, []);
  const api = useMemo(() => ({ show, refresh, hideFor, leave, blur }), [show, refresh, hideFor, leave, blur]);

  // Position the tip on the DOM node directly. Keeping the position in React state made this layout effect
  // schedule a sync re-render, which re-applied queued tip updates as new objects and looped forever.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!tip || !el) return;
    const r = el.getBoundingClientRect();
    const margin = 8;
    let left = tip.x - r.width / 2;
    let top = tip.y - r.height - 6;
    if (top < margin) top = tip.y + 14;
    left = Math.max(margin, Math.min(left, window.innerWidth - r.width - margin));
    top = Math.max(margin, Math.min(top, window.innerHeight - r.height - margin));
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }, [tip]);

  useEffect(() => {
    if (!tip) return undefined;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        dismissed.current = true;
        setTip(null);
      }
    };
    const onScroll = (): void => setTip(null);
    // A press anywhere drops a focus-only tip (the pointer moves on to another control); hover tips follow the pointer.
    const onDown = (): void => setTip((cur) => (cur && cur.src === 'focus' ? null : cur));
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('pointerdown', onDown, true);
    };
  }, [tip]);

  return (
    <Ctx.Provider value={api}>
      {children}
      {tip && (
        <div
          ref={ref}
          className={tip.src === 'focus' ? 'va-tip va-tip-focus' : 'va-tip'}
          aria-hidden="true"
          style={{ left: -9999, top: -9999 }}
          onPointerEnter={cancel}
          onPointerLeave={leave}
        >
          {tip.text}
        </div>
      )}
    </Ctx.Provider>
  );
}

function handlers(api: TipApi, text: string) {
  return {
    onPointerEnter: (e: PointerEvent<Element>) => {
      if (e.pointerType === 'touch') return;
      api.show(text, e.clientX, e.clientY, true, e.currentTarget);
    },
    onPointerLeave: () => api.leave(),
    onFocus: (e: FocusEvent<Element>) => {
      const r = e.currentTarget.getBoundingClientRect();
      api.show(text, r.left + r.width / 2, r.top, false, e.currentTarget);
    },
    onBlur: () => api.blur(),
  };
}

/** Event handlers that show `text` on hover and focus. Spread onto any element. */
export function useTip(text: string) {
  return handlers(useContext(Ctx), text);
}

/** Tip handlers for lists where hooks cannot be called per item: returns a factory. */
export function useTipFactory() {
  const api = useContext(Ctx);
  return useCallback((text: string) => handlers(api, text), [api]);
}

/**
 * Keeps the tooltip of `ref`'s element honest: when its label changes while the tip is open the text updates in place,
 * and while `walking` the tip is hidden; on arrival it is shown again if the element still has keyboard focus
 * (position re-read from the DOM node). Only passive effects; every state change is guarded.
 */
export function useTipSync(text: string, ref: RefObject<Element>, walking: boolean): void {
  const api = useContext(Ctx);
  const latest = useRef(text);
  latest.current = text;
  const was = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (el) api.refresh(el, text);
  }, [api, ref, text]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (walking) api.hideFor(el);
    else if (was.current && document.activeElement === el) {
      const r = el.getBoundingClientRect();
      api.show(latest.current, r.left + r.width / 2, r.top, false, el);
    }
    was.current = walking;
  }, [api, ref, walking]);
}
