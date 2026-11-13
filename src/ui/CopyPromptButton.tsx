import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';

/** Lets deep components speak through the app's single polite status region. */
export const AnnounceContext = createContext<(msg: string) => void>(() => undefined);

const COPIED_MS = 2500;
export const COPIED_ANNOUNCE = 'Copied. Paste it into Claude Code.';
export const MANUAL_ANNOUNCE = 'Could not copy automatically. The prompt is shown in a text box and selected. Press Control C, or Command C on a Mac, to copy it.';

type Phase = 'idle' | 'copied' | 'manual';

function Glyph({ check }: { check: boolean }): JSX.Element {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      {check ? (
        <path d="M4 12.5 L9.5 18 L20 6.5" />
      ) : (
        <>
          <rect x={8} y={3} width={12} height={14} rx={2} />
          <path d="M16 20 H6 a2 2 0 0 1 -2 -2 V8" />
        </>
      )}
    </svg>
  );
}

interface Props {
  /** Full prompt text, built by answerPrompt.ts. */
  prompt: string;
  /** Visible text, e.g. "Copy answer prompt". */
  label: string;
  /** Accessible name; must start with the visible label. */
  ariaLabel: string;
}

/**
 * Copies a prompt to the clipboard (the only thing it does). Falls back to a read-only, pre-selected textarea
 * when the clipboard is unavailable or refused. A sibling control: it never wraps or overlays the item, and its
 * clicks never reach the item's own handler.
 */
export function CopyPromptButton({ prompt, label, ariaLabel }: Props): JSX.Element {
  const say = useContext(AnnounceContext);
  const helpId = useId();
  const [phase, setPhase] = useState<Phase>('idle');
  const timer = useRef<number | null>(null);
  const alive = useRef(true);
  const area = useRef<HTMLTextAreaElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const sayRef = useRef(say);
  sayRef.current = say;

  const clearTimer = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  }, []);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      clearTimer();
    };
  }, [clearTimer]);

  // Focus and select the fallback text once it is on screen (an effect, never a layout effect, and no state set here).
  useEffect(() => {
    if (phase !== 'manual') return;
    const el = area.current;
    if (!el) return;
    el.focus();
    el.select();
  }, [phase]);

  const manual = (): void => {
    clearTimer();
    setPhase('manual');
    sayRef.current(MANUAL_ANNOUNCE);
  };
  const done = (): void => {
    if (!alive.current) return;
    clearTimer();
    setPhase('copied');
    sayRef.current(COPIED_ANNOUNCE);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      if (alive.current) setPhase((p) => (p === 'copied' ? 'idle' : p));
    }, COPIED_MS);
  };

  const onClick = (e: MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    try {
      const clip = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
      if (!clip || typeof clip.writeText !== 'function') {
        manual();
        return;
      }
      clip.writeText(prompt).then(done, () => {
        if (alive.current) manual();
      });
    } catch {
      manual();
    }
  };

  const hide = (e: MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    close();
  };
  const close = (): void => {
    if (!alive.current) return;
    setPhase('idle');
    button.current?.focus();
  };
  // Escape closes only the fallback (focus back to the Copy button), not a dialog around it.
  const onAreaKey = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key !== 'Escape') return;
    e.stopPropagation();
    e.preventDefault();
    close();
  };

  const copied = phase === 'copied';
  return (
    // Clicks inside (including the textarea) must not reach a clickable card around this control.
    <div className="va-copy" onClick={(e) => e.stopPropagation()}>
      <button ref={button} type="button" className="va-btn va-copy-btn" aria-label={ariaLabel} onClick={onClick}>
        <Glyph check={copied} />
        <span>{copied ? 'Copied' : label}</span>
      </button>
      {phase === 'manual' && (
        <div className="va-copy-manual">
          <p id={helpId} className="va-copy-help">Copy this prompt manually: press Ctrl+C, or Command+C on Mac. Esc closes it.</p>
          <textarea ref={area} readOnly rows={5} className="va-copy-area" value={prompt} aria-label="Prompt to copy" aria-describedby={helpId} onKeyDown={onAreaKey} />
          <button type="button" className="va-btn va-copy-btn" onClick={hide}>
            Hide prompt
          </button>
        </div>
      )}
    </div>
  );
}
