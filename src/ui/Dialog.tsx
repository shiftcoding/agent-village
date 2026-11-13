import { useEffect, useRef, type ReactNode } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogProps {
  titleId: string;
  title: string;
  onClose: () => void;
  /** Element that opened the dialog; focus goes back to it on close. */
  returnTo: Element | null;
  wide?: boolean;
  children: ReactNode;
}

/**
 * Modal side panel. role=dialog + aria-modal, labelled by its heading, focus moves in, Tab is trapped,
 * the rest of the page is inert while open, Escape and the backdrop close it, focus returns to the opener.
 */
export function Dialog({ titleId, title, onClose, returnTo, wide, children }: DialogProps): JSX.Element {
  const box = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const shell = document.getElementById('va-shell');
    shell?.setAttribute('inert', '');
    box.current?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab' || !box.current) return;
      const items = Array.from(box.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) {
        e.preventDefault();
        return;
      }
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === box.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      shell?.removeAttribute('inert');
      const target = returnTo instanceof HTMLElement || returnTo instanceof SVGElement ? returnTo : null;
      if (target && target.isConnected) target.focus();
      else document.getElementById('va-title')?.focus();
    };
    // returnTo is fixed for the lifetime of one dialog
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="va-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} className={`va-dialog${wide ? ' va-dialog-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div className="va-dialog-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="va-btn" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="va-dialog-body">{children}</div>
      </div>
    </div>
  );
}
