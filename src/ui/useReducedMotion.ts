import { useSyncExternalStore } from 'react';

/** True when the OS asks for reduced motion OR the in-app Motion toggle set data-motion="reduce" on <html>. */
export function readReducedMotion(): boolean {
  try {
    if (document.documentElement.getAttribute('data-motion') === 'reduce') return true;
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function subscribe(onChange: () => void): () => void {
  let mq: MediaQueryList | null = null;
  let mo: MutationObserver | null = null;
  try {
    if (typeof window.matchMedia === 'function') {
      mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      mq.addEventListener('change', onChange);
    }
    if (typeof MutationObserver !== 'undefined') {
      mo = new MutationObserver(onChange);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
    }
  } catch {
    /* no matchMedia or observer: the value is read once per render */
  }
  return () => {
    mq?.removeEventListener('change', onChange);
    mo?.disconnect();
  };
}

/** One hook for both sources. The snapshot is a boolean, so it never causes render loops. Call it once and pass the value down. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, readReducedMotion, () => false);
}
