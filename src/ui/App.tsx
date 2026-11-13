import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { sourceKey, sourceLine, transitionMessage, type DataState, type SourceKey } from './dataSource';
import { useVillageData } from './useVillageData';
import { AnnounceContext } from './CopyPromptButton';
import { Dialog } from './Dialog';
import { MoveAnnouncer, movedAgents } from './announce';
import type { Village } from '../data/types';
import { Legend, NOW_HINT, TIME_HINT, referenceNotes } from './Legend';
import { ListView } from './ListView';
import { LogList, buildPanel } from './Panels';
import type { OpenPanel, PanelId } from './panelTypes';
import { Scene } from './Scene';
import { readStored, useDocumentSettings, useStored, writeStored, type MotionSetting, type ThemeSetting, type ViewSetting } from './settings';
import { TooltipProvider } from './Tooltip';
import { useDayPart } from './useDayPart';
import { useReducedMotion } from './useReducedMotion';
import { DayPartIcon } from '../art';

const THEMES = ['auto', 'light', 'dark'] as const;
const MOTIONS = ['auto', 'reduce'] as const;
const VIEWS = ['village', 'list'] as const;

function Radios<T extends string>({ legend, value, onChange, options }: { legend: string; value: T; onChange: (v: T) => void; options: Array<[T, string]> }): JSX.Element {
  return (
    <fieldset className="va-radios">
      <legend>{legend}</legend>
      {options.map(([v, label]) => (
        <label key={v}>
          <input type="radio" name={`va-${legend}`} checked={value === v} onChange={() => onChange(v)} />
          {label}
        </label>
      ))}
    </fieldset>
  );
}

interface OpenState {
  panel: PanelId;
  returnTo: Element | null;
}

export function App(): JSX.Element {
  const data = useVillageData();
  if (!data) {
    return (
      <div id="va-shell">
        <main className="va-main">
          <h1 id="va-title" tabIndex={-1}>Agent Village</h1>
          <p className="va-muted">Loading the village...</p>
        </main>
      </div>
    );
  }
  return <VillageView data={data} />;
}

function NoticeLabel({ kind }: { kind: 'fallback' | 'stale' }): JSX.Element {
  const stale = kind === 'stale';
  return (
    <span className="va-notice-label">
      <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
        {stale ? (
          <>
            <path d="M12 3 L22 20 H2 Z" />
            <path d="M12 9.5 V14" />
            <circle cx={12} cy={17} r={0.6} fill="currentColor" />
          </>
        ) : (
          <>
            <circle cx={12} cy={12} r={9} />
            <path d="M12 11 V17" />
            <circle cx={12} cy={7.5} r={0.6} fill="currentColor" />
          </>
        )}
      </svg>
      {stale ? 'Out of date:' : 'Sample data:'}
    </span>
  );
}

function VillageView({ data }: { data: DataState }): JSX.Element {
  const village = data.village;
  const [view, setView] = useStored<ViewSetting>('va.view', 'village', VIEWS);
  const [theme, setTheme] = useStored<ThemeSetting>('va.theme', 'auto', THEMES);
  const [motion, setMotion] = useStored<MotionSetting>('va.motion', 'auto', MOTIONS);
  const [xp, setXp] = useState<boolean>(() => {
    const raw = readStored('va.xp');
    return raw === 'on' ? true : raw === 'off' ? false : village.xpEnabled;
  });
  const [open, setOpen] = useState<OpenState | null>(null);
  const listHeading = useRef<HTMLHeadingElement>(null);

  useDocumentSettings(theme, motion);
  const reduced = useReducedMotion();
  const dayPart = useDayPart(village);

  const onOpen = useCallback<OpenPanel>((panel, trigger) => setOpen({ panel, returnTo: trigger }), []);
  const close = useCallback(() => setOpen(null), []);

  const toggleXp = (on: boolean): void => {
    setXp(on);
    writeStored('va.xp', on ? 'on' : 'off');
  };

  const [announce, setAnnounce] = useState('');
  // Stable speaker for deep components. A repeated message gets a trailing space so the live region text still changes.
  const speak = useCallback((msg: string) => setAnnounce((cur) => (cur === msg ? `${msg} ` : msg)), []);
  // Announce only transitions of the data source (live, stale, fixtures), once each. Never the data itself.
  const key = sourceKey(data);
  const prevKey = useRef<SourceKey | null>(null);
  useEffect(() => {
    const msg = transitionMessage(prevKey.current, key);
    prevKey.current = key;
    if (msg) setAnnounce(msg);
  }, [key]);
  // Screen reader parity for walking: one polite message (at most one per 10 s) when agents changed place.
  // Not on the first load and not on unchanged polls (movedAgents is empty then).
  const prevVillage = useRef<Village | null>(null);
  const announcer = useRef<MoveAnnouncer | null>(null);
  useEffect(() => {
    const a = new MoveAnnouncer(setAnnounce, { now: () => Date.now(), set: (fn, ms) => window.setTimeout(fn, ms), clear: (id) => window.clearTimeout(id) });
    announcer.current = a;
    return () => a.dispose();
  }, []);
  useEffect(() => {
    const prev = prevVillage.current;
    prevVillage.current = village;
    if (prev !== village) announcer.current?.push(movedAgents(prev, village));
  }, [village]);
  const changeView = (v: ViewSetting): void => {
    setView(v);
    setAnnounce(v === 'list' ? 'List view shown' : 'Village view shown');
  };
  const skipToChronicle = (e: MouseEvent): void => {
    e.preventDefault();
    document.getElementById('chron-title')?.focus();
  };
  const skipToList = (e: MouseEvent): void => {
    e.preventDefault();
    changeView('list');
    window.setTimeout(() => listHeading.current?.focus(), 0);
  };

  const content = open ? buildPanel(open.panel, village, xp) : null;
  // A panel whose id vanished after an update closes (the Dialog returns focus to its opener, or the title).
  const gone = open !== null && open.panel.kind !== 'legend' && content === null;
  useEffect(() => {
    if (gone) {
      setOpen(null);
      setAnnounce('That item is no longer in the village data.');
    }
  }, [gone]);
  const notes = referenceNotes(village);
  const override = village.projects.some((p) => p.referenceSource === 'override');

  return (
    <TooltipProvider>
     <AnnounceContext.Provider value={speak}>
      <div id="va-shell">
        <a className="va-skip" href="#list-view" onClick={skipToList}>
          Switch to list view
        </a>
        {view === 'village' && (
          <a className="va-skip" href="#chron-title" onClick={skipToChronicle}>
            Skip the scene, go to chronicle
          </a>
        )}
        <header className="va-toolbar">
          <h1 id="va-title" tabIndex={-1}>
            Agent Village
          </h1>
          <div className="va-controls">
            <div role="group" aria-label="View" className="va-seg">
              <button type="button" aria-pressed={view === 'village'} onClick={() => changeView('village')}>
                Village
              </button>
              <button type="button" aria-pressed={view === 'list'} onClick={() => changeView('list')}>
                List
              </button>
            </div>
            <Radios legend="Theme" value={theme} onChange={setTheme} options={[['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']]} />
            <Radios legend="Motion" value={motion} onChange={setMotion} options={[['auto', 'Auto'], ['reduce', 'Reduce']]} />
            <label className="va-check">
              <input type="checkbox" checked={xp} onChange={(e) => toggleXp(e.target.checked)} />
              XP and levels
            </label>
            <button type="button" className="va-btn" aria-haspopup="dialog" onClick={(e) => onOpen({ kind: 'legend' }, e.currentTarget)}>
              Legend and signals
            </button>
          </div>
        </header>

        <main className="va-main">
          <p className="va-source">{sourceLine(data)}</p>
          <p className="va-daypart">
            <DayPartIcon kind={dayPart.part} size={24} /> <span>{dayPart.label}</span>
            {dayPart.pinned ? <span className="va-muted"> (previewing ?time= in the URL)</span> : null}
          </p>
          {data.notice && (
            <p className={`va-note-box va-source-notice va-source-${data.notice.kind}`}>
              <NoticeLabel kind={data.notice.kind} /> {data.notice.text}
            </p>
          )}
          {override && (
            <p className="va-note-box">
              Viewing the village as of the time in the URL (?now=). Remove it to go back to the real times.
            </p>
          )}
          {village.warnings.length > 0 && (
            <details className="va-warnings">
              <summary>Data notes ({village.warnings.length})</summary>
              <ul>
                {village.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </details>
          )}
          {view === 'village' ? (
            <>
              <Scene village={village} onOpen={onOpen} xp={xp} dayPart={dayPart.part} reduced={reduced} />
              <section className="va-chronicle" aria-labelledby="chron-title">
                <h2 id="chron-title" tabIndex={-1}>Chronicle: latest {village.chronicle.length} log lines</h2>
                <LogList entries={village.chronicle} withProject />
              </section>
              <p className="va-footnote">
                {notes.join(' ')} {notes.length ? NOW_HINT : ''} {TIME_HINT}
              </p>
            </>
          ) : (
            <ListView ref={listHeading} village={village} xp={xp} />
          )}
        </main>
      </div>

      {open && open.panel.kind === 'legend' && (
        <Dialog titleId="va-dialog-title" title="Legend and signals" onClose={close} returnTo={open.returnTo} wide>
          <Legend village={village} dayPartLabel={dayPart.label} />
        </Dialog>
      )}
      {open && content && (
        <Dialog titleId="va-dialog-title" title={content.title} onClose={close} returnTo={open.returnTo}>
          {content.body}
        </Dialog>
      )}
      {/* Outside #va-shell: the shell is inert while a dialog is open, and announcements must still be heard. */}
      <div role="status" aria-live="polite" className="va-sr">
        {announce}
      </div>
     </AnnounceContext.Provider>
    </TooltipProvider>
  );
}
