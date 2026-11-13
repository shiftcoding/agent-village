import { useCallback, useEffect, useState } from 'react';

/** localStorage wrapped in try/catch: private mode, disabled storage and quota errors are all ignored. */
export function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: the setting just lasts for this visit */
  }
}

export type ThemeSetting = 'auto' | 'light' | 'dark';
export type MotionSetting = 'auto' | 'reduce';
export type ViewSetting = 'village' | 'list';

export function useStored<T extends string>(key: string, fallback: T, allowed: readonly T[]): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    const raw = readStored(key);
    return raw !== null && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
  });
  const set = useCallback(
    (v: T) => {
      setValue(v);
      writeStored(key, v);
    },
    [key],
  );
  return [value, set];
}

/** Reflect the toggles on <html>: data-theme (absent = follow the system) and data-motion="reduce". */
export function useDocumentSettings(theme: ThemeSetting, motion: MotionSetting): void {
  useEffect(() => {
    const el = document.documentElement;
    if (theme === 'auto') el.removeAttribute('data-theme');
    else el.setAttribute('data-theme', theme);
  }, [theme]);
  useEffect(() => {
    const el = document.documentElement;
    if (motion === 'reduce') el.setAttribute('data-motion', 'reduce');
    else el.removeAttribute('data-motion');
  }, [motion]);
}
