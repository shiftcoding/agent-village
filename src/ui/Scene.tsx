import { memo, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type MutableRefObject, type Ref, type RefObject } from 'react';
import {
  BuildBurst,
  CHRONICLE_TEXT_RECT,
  CartographersWorkshop,
  Chapel,
  Character,
  ChronicleScroll,
  ClassIcon,
  Fireworks,
  Gatehouse,
  Ground,
  HEARTH_LODGE_ANCHORS,
  HearthLodge,
  HerbalistHut,
  PIPELINE_STOPS,
  PipelineCart,
  PipelineTrack,
  Plot,
  QUEST_BOARD_NOTE_RECT,
  QuestBoard,
  SCENE,
  SPECIALIST_RINGS,
  BUILDING_RINGS,
  TAVERN_RING,
  GATEHOUSE_RING,
  Schoolhouse,
  SignalIcon,
  TALLY_TEXT_RECT,
  Tavern,
  TallySign,
  TownHall,
  Troupe,
  VillageWell,
  WORKSHOP_ANCHORS,
  pathNetwork,
  type PathNetwork,
  type SignalIconKind,
} from '../art';
import { pipelineOf } from '../data/pipeline';
import type { PipelineStop, PipelineStopId, Project, QuestNote, SpecialistPlace, Stage, Village } from '../data/types';
import type { DayPartName } from '../data/daylight';
import { agentTip, needsYouTip, pipelineStopTip, projectTip, specialistTip } from './describe';
import { CLASS_LABEL, fmtStamp, taskKey, truncate } from './format';
import { FIREWORKS_MS, GrowthController, releasedKey, shouldFireworks } from './growth';
import { layoutTags, placeCharacters, projectSpotsOf, structures, type Box, type PlacedChar, type Structure, type TagLayout } from './layout';
import { measureText, UI_FONT } from './measure';
import type { OpenPanel, PanelId } from './panelTypes';
import { activeStops, pipelineTrackPoints } from './pipelineRoute';
import { readStored, writeStored } from './settings';
import { CopyPromptButton } from './CopyPromptButton';
import { needsYouKeys, needsYouLabel, needsYouPrompt } from './answerPrompt';
import { sameVillage } from './sameVillage';
import { stableOrder } from './stableOrder';
import { signalPills, type Pill } from './strips';
import { useTip, useTipFactory, useTipSync } from './Tooltip';
import { useWalker } from './useWalker';
import { willWalk, type Pt, type WalkView } from './walk';

/* ------------------------------------------------------------ small building blocks */

function Ring({ x, y, w, h }: { x: number; y: number; w: number; h: number }): JSX.Element {
  return (
    <g className="va-ring" aria-hidden="true" pointerEvents="none">
      <rect x={x} y={y} width={w} height={h} rx={8} className="va-ring-under" />
      <rect x={x} y={y} width={w} height={h} rx={8} className="va-ring-line" />
    </g>
  );
}

interface FocusableProps {
  /** Same text for aria-label and the hover/focus tooltip. */
  label: string;
  panel: PanelId;
  onOpen: OpenPanel;
  ring: Box;
  /** Local transform for the group. */
  at?: { x: number; y: number };
  /** Transparent hit area over the ring box (characters). */
  hit?: boolean;
  className?: string;
  id?: string;
  /** Ref to the group (characters: the walker writes its transform). */
  gRef?: Ref<SVGGElement>;
  /** True while this control's character walks: its tooltip hides and comes back on arrival if still focused. */
  walking?: boolean;
  children: ReactNode;
}

/** A keyboard-reachable SVG control: Tab to focus, Enter or Space to open, visible ring, tooltip on hover and focus. */
function Focusable({ label, panel, onOpen, ring, at, hit, className, id, gRef, walking, children }: FocusableProps): JSX.Element {
  const tip = useTip(label);
  const inner = useRef<SVGGElement | null>(null);
  const setRef = useCallback(
    (el: SVGGElement | null) => {
      inner.current = el;
      if (typeof gRef === 'function') gRef(el);
      else if (gRef) (gRef as MutableRefObject<SVGGElement | null>).current = el;
    },
    [gRef],
  );
  useTipSync(label, inner, walking === true);
  const open = (el: Element): void => onOpen(panel, el);
  const onKeyDown = (e: KeyboardEvent<SVGGElement>): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open(e.currentTarget);
    }
  };
  return (
    <g
      id={id}
      ref={setRef}
      className={`va-focusable${className ? ` ${className}` : ''}`}
      transform={at ? `translate(${at.x} ${at.y})` : undefined}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-haspopup="dialog"
      onClick={(e) => open(e.currentTarget)}
      onKeyDown={onKeyDown}
      {...tip}
    >
      {hit && <rect x={ring.x} y={ring.y} width={ring.w} height={ring.h} fill="transparent" />}
      {children}
      <Ring x={ring.x} y={ring.y} w={ring.w} h={ring.h} />
    </g>
  );
}

/* ------------------------------------------------------------ project buildings */


const ProjectArt = memo(function ProjectArt({ p, stage, overall }: { p: Project; stage?: Stage; overall?: number | null }): JSX.Element {
  if (p.plot === 'no-folder') return <Plot kind="no-folder" />;
  if (p.plot === 'no-progress') return <Plot kind="no-progress" />;
  const pr = p.progress;
  const props = {
    stage: stage ?? pr?.stage ?? ('unknown' as const),
    overall: overall !== undefined ? overall : (pr?.overall ?? null),
    signals: p.health.map((h) => h.kind),
    needsYouCount: pr?.needsYou.length ?? 0,
    signText: p.name,
    // Fireworks are mounted once by ProjectNode (a change to released, or the first time this viewer sees it).
    fireworks: false,
  };
  if (p.building === 'hearth-lodge') return <HearthLodge {...props} />;
  if (p.building === 'cartographers-workshop') return <CartographersWorkshop {...props} />;
  return <Plot kind="unknown" signText={p.name} />;
});

/**
 * One project building with its growth effects. Only this component re-renders during a tween or cross-fade.
 *  - same `building` stage, new overall: the overall passed to the art tweens (1.5 s) and a build burst plays once;
 *  - stage change: old art cross-fades into the new art (0.8 s) and a build burst plays once;
 *  - reduced motion: overall jumps, no burst, stage change cross-fades quickly;
 *  - released (a change, or the first time this viewer sees it): fireworks once for about 3 s, then unmounted.
 * The controller is a plain object updated idempotently in render (no setState in render); a rAF loop re-renders
 * this component while something animates and stops when it is done.
 */
function ProjectNode({ p, reduced }: { p: Project; reduced: boolean }): JSX.Element {
  const stage: Stage = p.progress?.stage ?? 'unknown';
  const overall = p.progress?.overall ?? null;
  const ctlRef = useRef<GrowthController | null>(null);
  if (ctlRef.current === null) ctlRef.current = new GrowthController(stage, overall, p.plot, () => performance.now());
  const ctl = ctlRef.current;
  ctl.observe(stage, overall, p.plot, reduced);
  const version = ctl.version;
  const [, setFrame] = useState(0);
  useEffect(() => {
    if (!ctl.busy) return undefined;
    let id = 0;
    const step = (): void => {
      const busy = ctl.tick(performance.now());
      setFrame((n) => n + 1);
      if (busy) id = window.requestAnimationFrame(step);
    };
    id = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(id);
  }, [ctl, version]);

  const [fw, setFw] = useState(false);
  const prevStage = useRef<Stage | null>(null);
  useEffect(() => {
    const prev = prevStage.current;
    if (prev === stage) return; // no change (also the second run of a StrictMode effect replay)
    prevStage.current = stage;
    if (shouldFireworks(prev, stage, readStored(releasedKey(p.id)) !== null)) {
      writeStored(releasedKey(p.id), '1');
      setFw(true);
    }
  }, [stage, p.id]);
  useEffect(() => {
    if (!fw) return undefined;
    const t = window.setTimeout(() => setFw(false), FIREWORKS_MS);
    return () => window.clearTimeout(t);
  }, [fw]);

  const fade = ctl.fadeInfo();
  const lodge = p.building === 'hearth-lodge';
  const roof = lodge ? HEARTH_LODGE_ANCHORS.roof : WORKSHOP_ANCHORS.roof;
  return (
    <>
      {fade && (
        <g opacity={1 - fade.p} pointerEvents="none">
          <ProjectArt p={p} stage={fade.fromStage} overall={fade.fromOverall} />
        </g>
      )}
      <g opacity={fade ? fade.p : undefined}>
        <ProjectArt p={p} overall={ctl.overallAt()} />
      </g>
      {!reduced && ctl.burst && p.plot === 'ok' && (
        <g pointerEvents="none">
          <BuildBurst key={version} at={{ x: 0, y: 6 }} width={lodge ? 200 : 160} />
        </g>
      )}
      {fw && p.plot === 'ok' && (
        <g pointerEvents="none">
          <Fireworks at={{ x: roof.x, y: roof.y - 40 }} />
        </g>
      )}
    </>
  );
}

const SPECIALIST_ART: Record<SpecialistPlace, () => JSX.Element> = {
  chapel: () => <Chapel />,
  well: () => <VillageWell />,
  herbalist: () => <HerbalistHut />,
  schoolhouse: () => <Schoolhouse />,
};

/** Small scroll icon for the pipeline count tag. */
function ScrollIcon({ size }: { size: number }): JSX.Element {
  return (
    <svg x={0} y={0} width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <rect x={1} y={3} width={14} height={10} rx={3} fill="var(--va-parchment)" stroke="var(--va-text)" strokeWidth={1.2} />
      <path d="M4 7 H12 M4 10 H9" stroke="var(--va-ink)" strokeWidth={1.3} strokeLinecap="round" fill="none" />
    </svg>
  );
}

interface CartGeo {
  stop: PipelineStop;
  at: Pt;
  badge: Box;
  /** Box (local to the cart) of the cart plus its count tag. */
  ring: Box;
}

function cartGeometry(stops: PipelineStop[], font: number, at: (s: PipelineStopId) => Pt): CartGeo[] {
  const h = font + 10;
  const icon = font;
  return stops.map((stop) => {
    const text = String(stop.count);
    const w = Math.ceil(7 + icon + 5 + measureText(text, font, true) + 8);
    // Above the cart; the town hall cart stands in front of the chronicle board, so its tag goes to the left.
    const badge: Box = stop.stop === 'town-hall' ? { x: -30 - w, y: -h - 2, w, h } : { x: -w / 2, y: -34 - h, w, h };
    const minX = Math.min(-28, badge.x);
    const maxX = Math.max(20, badge.x + badge.w);
    const minY = Math.min(-32, badge.y);
    const ring: Box = { x: minX - 5, y: minY - 5, w: maxX - minX + 10, h: 8 - minY + 10 };
    return { stop, at: at(stop.stop), badge, ring };
  });
}

function PipelineCartButton({ geo, onOpen, font, structure }: { geo: CartGeo; onOpen: OpenPanel; font: number; structure: Structure }): JSX.Element {
  const { badge: b, stop } = geo;
  const icon = font;
  return (
    <Focusable label={pipelineStopTip(stop)} panel={{ kind: 'pipeline' }} onOpen={onOpen} at={structure} ring={geo.ring} className="va-cart">
      <PipelineCart />
      <g aria-hidden="true">
        <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={7} className="va-tag-bg" />
        <g transform={`translate(${b.x + 7} ${b.y + (b.h - icon) / 2})`}>
          <ScrollIcon size={icon} />
        </g>
        <text x={b.x + 7 + icon + 5} y={b.y + b.h / 2 + font * 0.35} fontSize={font} fontWeight={700} className="va-tag-name">
          {stop.count}
        </text>
      </g>
    </Focusable>
  );
}

function SignalPill({ pill }: { pill: Pill }): JSX.Element {
  const tipFor = useTipFactory();
  const { box: b } = pill;
  const font = Math.round(b.h - 10);
  const icon = font + 2;
  return (
    <g className="va-pill" transform={`translate(${b.x} ${b.y})`} {...tipFor(pill.tip)}>
      <rect width={b.w} height={b.h} rx={b.h / 2} className="va-pill-bg" />
      {pill.icon && (
        <g transform={`translate(7 ${(b.h - icon) / 2})`}>
          <SignalIcon kind={pill.icon} size={icon} />
        </g>
      )}
      <text x={pill.icon ? icon + 13 : 10} y={b.h / 2 + font * 0.35} fontSize={font} className="va-pill-text">
        {pill.label}
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ quest board notes */

interface NoteSlot {
  note: QuestNote | null;
  overflow: number;
  x: number;
  y: number;
}

const NOTE_W = 40;
const NOTE_H = 24;
const NOTE_GAP = 2;

function noteSlots(village: Village): NoteSlot[] {
  const r = QUEST_BOARD_NOTE_RECT;
  const perRow = 4;
  const maxRows = 3;
  const rows: QuestNote[][] = [];
  for (const p of village.projects) {
    const mine = village.questBoard.filter((q) => q.task.projectId === p.id);
    for (let i = 0; i < mine.length; i += perRow) rows.push(mine.slice(i, i + perRow));
  }
  const out: NoteSlot[] = [];
  rows.slice(0, maxRows).forEach((row, ri) => {
    row.forEach((note, ci) => out.push({ note, overflow: 0, x: r.x + 1 + ci * (NOTE_W + NOTE_GAP), y: r.y + 2 + ri * (NOTE_H + NOTE_GAP) }));
  });
  const hidden = rows.slice(maxRows).reduce((n, row) => n + row.length, 0);
  if (hidden > 0) {
    const last = out.pop();
    const extra = last?.note ? 1 : 0;
    if (last) out.push({ note: null, overflow: hidden + extra, x: last.x, y: last.y });
  }
  return out;
}

export function noteTip(q: QuestNote): string {
  const who = q.task.agent ? `${q.task.agent} (${CLASS_LABEL[q.villageClass]})` : 'nobody assigned';
  return `Quest note, ${q.projectName} ${q.task.id}: ${q.task.title}. Assigned to ${who}. Status: todo.`;
}

function QuestNoteButton({ slot, onOpen, structure }: { slot: NoteSlot; onOpen: OpenPanel; structure: Structure }): JSX.Element {
  const q = slot.note;
  const label = q ? noteTip(q) : `${slot.overflow} more quest notes. Open the quest board to see them all.`;
  const panel: PanelId = q ? { kind: 'quest-note', key: taskKey(q.task) } : { kind: 'quest-board' };
  return (
    <Focusable label={label} panel={panel} onOpen={onOpen} ring={{ x: slot.x - 3, y: slot.y - 3, w: NOTE_W + 6, h: NOTE_H + 6 }} at={structure} className="va-note">
      <rect x={slot.x} y={slot.y} width={NOTE_W} height={NOTE_H} rx={2} className="va-note-bg" />
      {q ? (
        <>
          <circle cx={slot.x + 11} cy={slot.y + NOTE_H / 2} r={9} className="va-chip" />
          <g transform={`translate(${slot.x + 3} ${slot.y + NOTE_H / 2 - 8})`}>
            <ClassIcon villageClass={q.villageClass} size={16} />
          </g>
          <text x={slot.x + 22} y={slot.y + NOTE_H / 2 + 4.5} fontSize={12} fontWeight={700} className="va-note-text">
            {truncate(q.task.id, 3)}
          </text>
        </>
      ) : (
        <text x={slot.x + NOTE_W / 2} y={slot.y + NOTE_H / 2 + 4.5} fontSize={12} fontWeight={700} textAnchor="middle" className="va-note-text">
          +{slot.overflow}
        </text>
      )}
    </Focusable>
  );
}

/* ------------------------------------------------------------ needs-you card */

/**
 * The notice card is HTML in a foreignObject, pinned over the upper part of the town hall (the pediment
 * stays visible below it). The art's own notice rect (224 x 108) is too small for four items at a readable
 * size, so the card is wider and grows upward from a fixed bottom edge. Five or more items use two columns.
 */
const CARD_BOTTOM = SCENE.townHall.y - 76;
const CARD_MAX_H = CARD_BOTTOM - 8;

export interface CardGeometry {
  w: number;
  cols: 1 | 2 | 3;
  /** False when even three columns would be taller than the space above the hall: the scene then shows the HTML block instead. */
  fits: boolean;
}

type CardItem = { text: string; projectName?: string; raisedBy?: string | null };

/** Rough card height in scene units, including each item's meta line and its copy button (about 1.9 lines tall). */
export function estimateHeight(items: CardItem[], fontPx: number, w: number, cols: number): number {
  const colW = (w - 60) / cols - 24;
  const perLine = Math.max(10, colW / (fontPx * 0.52));
  const heights = items.map((n) => {
    const meta = `${n.projectName ?? ''}, raised by ${n.raisedBy ?? 'unknown'}`.length;
    return (Math.ceil(n.text.length / perLine) + Math.ceil(meta / perLine)) * fontPx * 1.25 + fontPx * 1.5 + 10;
  });
  const total = heights.reduce((a, b) => a + b, 0);
  return fontPx * 2.2 + 30 + (cols === 1 ? total : Math.ceil(total / cols) + Math.max(0, ...heights) / 2);
}

/** Fewest columns (1 to 3) that fit above the hall's pediment, otherwise three wide columns (the card then scrolls). Grows with the text size. */
export function cardGeometry(items: CardItem[], fontPx: number): CardGeometry {
  const k = Math.max(1, fontPx / 16);
  const widths = { 1: Math.min(1500, Math.round(540 * k)), 2: Math.min(1560, Math.round(860 * k)), 3: Math.min(1560, Math.round(1200 * k)) } as const;
  if (items.length <= 1) return { w: widths[1], cols: 1, fits: true };
  for (const cols of [1, 2] as const) if (estimateHeight(items, fontPx, widths[cols], cols) <= CARD_MAX_H) return { w: widths[cols], cols, fits: true };
  return { w: widths[3], cols: 3, fits: estimateHeight(items, fontPx, widths[3], 3) <= CARD_MAX_H };
}

function NeedsContent({ items, village }: { items: Village['needsYou']; village: Village }): JSX.Element {
  const keys = needsYouKeys(items);
  return (
    <>
      <h3 id="va-needs-title" className="va-needs-title">
        Needs you <span className="va-needs-count">{items.length}</span>
      </h3>
      {items.length === 0 ? (
        <p className="va-needs-empty">Nothing is waiting on you.</p>
      ) : (
        <ol className="va-needs-list">
          {items.map((n, i) => (
            <li key={keys[i]}>
              <span className="va-needs-text">{n.text}</span>
              <span className="va-needs-meta">
                {n.projectName}, raised by {n.raisedBy ?? 'unknown'}
              </span>
              <CopyPromptButton prompt={needsYouPrompt(n, village.projects)} label="Copy answer prompt" ariaLabel={`Copy answer prompt for: ${needsYouLabel(n)}`} />
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

/** Identifies one (data, text size) combination, so a measured overflow resets by itself when either changes. */
function overflowKey(items: Array<{ projectId: string; text: string }>, fontPx: number): string {
  return `${fontPx}|${items.map((n) => `${n.projectId}:${n.text}`).join('\n')}`;
}

function NeedsYouCard({ village, onOpen, fontPx, height, onHeight, onOverflow }: { village: Village; onOpen: OpenPanel; fontPx: number; height: number; onHeight: (h: number) => void; onOverflow: (key: string) => void }): JSX.Element {
  const items = village.needsYou;
  const { w, cols } = cardGeometry(items, fontPx);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const report = (): void => {
      onHeight(Math.ceil(el.offsetHeight));
      // Measured truth: content taller than the space above the hall means the card clips, so the block takes over for this size and data.
      // An open copy fallback (textarea) legitimately makes the card scroll: never let it switch card/block (that would unmount the button and its state).
      if (!el.querySelector('.va-copy-manual') && el.scrollHeight > el.clientHeight + 2) onOverflow(overflowKey(items, fontPx));
    };
    report();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onHeight, onOverflow, items, fontPx]);
  return (
    <foreignObject x={SCENE.townHall.x - w / 2} y={CARD_BOTTOM - height} width={w} height={height + 8} className="va-card-fo">
      <div
        ref={ref}
        className={`va-needs${cols > 1 ? ` va-needs-${cols}col` : ''}`}
        role="region"
        aria-labelledby="va-needs-title"
        style={{ fontSize: fontPx, maxHeight: CARD_MAX_H }}
        onClick={() => onOpen({ kind: 'town-hall' }, document.getElementById('va-town-hall'))}
      >
        <NeedsContent items={items} village={village} />
      </div>
    </foreignObject>
  );
}

/* ------------------------------------------------------------ the scene */

interface SceneProps {
  village: Village;
  onOpen: OpenPanel;
  /** Show levels ("Lv 2" on name tags). */
  xp: boolean;
  /** Time of day: sets data-daypart on the scene wrapper (the CSS recolours the scene and fades 2.5 s). */
  dayPart: DayPartName;
  reduced: boolean;
}

const NO_VIEWS: ReadonlyMap<string, WalkView> = new Map();

function sortY(c: PlacedChar, views: ReadonlyMap<string, WalkView>, settled: Map<string, Pt>): number {
  return views.has(c.key) ? (settled.get(c.key)?.y ?? c.y) : c.y;
}

const NARROW = 700;

function rootPx(): number {
  try {
    return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  } catch {
    return 16;
  }
}

function useWidth(): [RefObject<HTMLDivElement>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(1280);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setW(el.clientWidth || 1280);
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => setW(el.clientWidth || 1280));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

function SceneView({ village, onOpen, xp, dayPart, reduced }: SceneProps): JSX.Element {
  const [wrap, width] = useWidth();
  // The palette transition (tokens.css) only applies once this class is set, one frame after the first paint, so the
  // first load shows the current day part at once and only real day-part changes fade.
  useEffect(() => {
    const id = window.requestAnimationFrame(() => wrap.current?.classList.add('va-daypart-ready'));
    return () => window.cancelAnimationFrame(id);
  }, [wrap]);
  const scale = Math.max(0.2, width / SCENE.width);
  // Name tags and notices stay at least ~12.5 px on screen: scale the SVG units up when the scene is small.
  const target = (12.5 * rootPx()) / 16; // follows the browser's default font size
  const font = Math.max(15, Math.min(30, Math.ceil(target / scale)));
  const fontPx = font;
  const narrow = width < NARROW;
  // When the card cannot show every item and button above the hall, use the plain HTML block (like narrow screens) instead of clipping.
  // Touch screens (coarse pointer) also get the block: its buttons are 44 px tall, which the card's size estimate does not allow for.
  const coarse = useMemo(() => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches, []);
  const [overflowed, setOverflowed] = useState<string | null>(null);
  const blockCard = narrow || coarse || !cardGeometry(village.needsYou, fontPx).fits || overflowed === overflowKey(village.needsYou, fontPx);

  const order = useMemo(() => structures(village), [village]);
  const chars = useMemo(() => placeCharacters(village), [village]);
  const pipeline = useMemo(() => pipelineOf(village), [village]);
  const projectSpots = useMemo(() => projectSpotsOf(village), [village]);
  const net = useMemo<PathNetwork>(() => pathNetwork(projectSpots), [projectSpots]);
  const trackPoints = useMemo(() => pipelineTrackPoints(net, pipeline), [net, pipeline]);
  const carts = useMemo(() => cartGeometry(activeStops(pipeline), font, (id) => PIPELINE_STOPS[id]), [pipeline, font]);
  const pills = useMemo(() => village.projects.map((p) => ({ p, pills: signalPills(p, font, measureText) })), [village, font]);

  // Walking. Each character has two persistent elements: a visual sprite (aria-hidden, y-sorted so front characters
  // draw over back ones) and a focusable hit group (stable DOM order, so React never moves a focused node). A headless
  // walker per character writes the transform of both from rAF.
  const [views, setViews] = useState<ReadonlyMap<string, WalkView>>(NO_VIEWS);
  const [, setTick] = useState(0);
  const settled = useRef(new Map<string, Pt>());
  const sprites = useRef(new Map<string, SVGGElement>());
  const hits = useRef(new Map<string, SVGGElement>());
  const onState = useCallback((key: string, v: WalkView | null) => {
    setViews((prev) => {
      const cur = prev.get(key);
      if ((cur === undefined && v === null) || (cur && v && cur.flip === v.flip)) return prev;
      const next = new Map(prev);
      if (v) next.set(key, v);
      else next.delete(key);
      return next;
    });
  }, []);
  const onSettle = useCallback((key: string, p: Pt) => {
    const before = settled.current.get(key);
    settled.current.set(key, p);
    // An instant move (no walk) must still re-render once, so a tag hidden for a move that never walked comes back.
    // Deferred to a frame: never a state update from an effect.
    if (before && willWalk(before, p, false)) window.requestAnimationFrame(() => setTick((n) => n + 1));
  }, []);
  const hitOrderRef = useRef<string[]>([]);
  const hitOrder = useMemo(
    () => stableOrder(hitOrderRef.current, [...chars].sort((p, q) => p.y - q.y || p.x - q.x || p.key.localeCompare(q.key)).map((c) => c.key)),
    [chars],
  );
  useEffect(() => {
    hitOrderRef.current = hitOrder;
  }, [hitOrder]);
  const charByKey = useMemo(() => new Map(chars.map((c) => [c.key, c])), [chars]);
  // Sprites re-sort by y whenever a walk ends (a walking sprite keeps the y of the place it left until it arrives).
  const spriteOrder = [...chars].sort((p, q) => sortY(p, views, settled.current) - sortY(q, views, settled.current) || p.x - q.x || p.key.localeCompare(q.key));
  const [cardH, setCardH] = useState(() => Math.min(CARD_MAX_H, Math.ceil(estimateHeight(village.needsYou, fontPx, cardGeometry(village.needsYou, fontPx).w, cardGeometry(village.needsYou, fontPx).cols))));
  const cardW = cardGeometry(village.needsYou, fontPx).w;
  const obstacles = useMemo<Box[]>(
    () => [
      ...pills.flatMap((x) => x.pills.map((pl) => pl.box)),
      // pipeline carts and their count tags
      ...carts.flatMap((g) => [
        { x: g.at.x + g.badge.x, y: g.at.y + g.badge.y, w: g.badge.w, h: g.badge.h },
        { x: g.at.x - 26, y: g.at.y - 32, w: 50, h: 36 },
      ]),
      ...(blockCard ? [] : [{ x: SCENE.townHall.x - cardW / 2, y: CARD_BOTTOM - cardH, w: cardW, h: cardH }]),
      // sign boards in the square: tags must not cover their text
      { x: SCENE.tally.x - 76, y: SCENE.tally.y - 132, w: 152, h: 140 },
      { x: SCENE.chronicle.x - 98, y: SCENE.chronicle.y - 192, w: 196, h: 200 },
      { x: SCENE.questBoard.x - 118, y: SCENE.questBoard.y - 184, w: 236, h: 190 },
    ],
    [pills, carts, cardH, cardW, blockCard],
  );
  const tags = useMemo(() => layoutTags(chars, font, measureText, obstacles, undefined, xp), [chars, font, obstacles, xp]);
  const slots = useMemo(() => noteSlots(village), [village]);

  const needsTip = needsYouTip(village);
  const board = village.questBoard.length;
  const newest = village.chronicle[0];
  const chronicleTip = village.chronicle.length
    ? `Chronicle: the latest ${village.chronicle.length} log lines across projects. Newest ${fmtStamp(newest?.timestamp ?? null)}.`
    : 'Chronicle: no log lines yet.';
  const tallyTip = `Weekly tally: ${village.weeklyTally.map((t) => `${t.projectName} ${t.done}`).join(', ') || 'no projects'} tasks done this week. No rankings between agents.`;
  const boardTip = board === 0 ? 'Quest board: no todo tasks.' : `Quest board: ${board} todo ${board === 1 ? 'task' : 'tasks'}, grouped by project.`;

  const renderStructure = (s: Structure): JSX.Element | null => {
    const at = { x: s.x, y: s.y };
    if (s.id.startsWith('specialist:')) {
      const place = s.id.slice('specialist:'.length) as SpecialistPlace;
      return (
        <Focusable key={s.id} label={specialistTip(place, village)} panel={{ kind: 'place', id: place }} onOpen={onOpen} at={at} ring={SPECIALIST_RINGS[place]}>
          {SPECIALIST_ART[place]()}
        </Focusable>
      );
    }
    if (s.id.startsWith('cart:')) {
      const geo = carts.find((g) => `cart:${g.stop.stop}` === s.id);
      return geo ? <PipelineCartButton key={s.id} geo={geo} onOpen={onOpen} font={font} structure={s} /> : null;
    }
    switch (s.id) {
      case 'town-hall':
        return (
          <Focusable key={s.id} id="va-town-hall" label={needsTip} panel={{ kind: 'town-hall' }} onOpen={onOpen} at={at} ring={{ x: -140, y: -350, w: 350, h: 400 }}>
            <TownHall />
            {blockCard && (
              <g className="va-ink-text" textAnchor="middle" aria-hidden="true" pointerEvents="none">
                <text x={0} y={-128} fontSize={22} fontWeight={700}>
                  {village.needsYou.length === 0 ? 'Nothing waits' : `Needs you: ${village.needsYou.length}`}
                </text>
                <text x={0} y={-100} fontSize={17}>
                  {village.needsYou.length === 0 ? 'on you' : 'See the list above'}
                </text>
              </g>
            )}
          </Focusable>
        );
      case 'quest-board':
        return (
          <g key={s.id}>
            <Focusable label={boardTip} panel={{ kind: 'quest-board' }} onOpen={onOpen} at={at} ring={{ x: -118, y: -184, w: 236, h: 204 }}>
              <QuestBoard />
            </Focusable>
            {slots.map((slot, i) => {
              // Stable key: project id + task id. The index only breaks ties between duplicates.
              const base = slot.note ? taskKey(slot.note.task) : 'more';
              const dup = slots.slice(0, i).filter((o) => (o.note ? taskKey(o.note.task) : 'more') === base).length;
              return <QuestNoteButton key={dup ? `${base}#${dup}` : base} slot={slot} onOpen={onOpen} structure={s} />;
            })}
          </g>
        );
      case 'chronicle': {
        const r = CHRONICLE_TEXT_RECT;
        return (
          <Focusable key={s.id} label={chronicleTip} panel={{ kind: 'chronicle' }} onOpen={onOpen} at={at} ring={{ x: -98, y: -192, w: 196, h: 218 }}>
            <ChronicleScroll />
            <g aria-hidden="true">
              <text x={0} y={r.y + 36} textAnchor="middle" fontSize={22} fontWeight={800} className="va-ink-text">
                {village.chronicle.length} lines
              </text>
              <text x={0} y={r.y + 58} textAnchor="middle" fontSize={13} className="va-ink-text">
                Newest
              </text>
              <text x={0} y={r.y + 76} textAnchor="middle" fontSize={13} className="va-ink-text">
                {fmtStamp(newest?.timestamp ?? null)}
              </text>
            </g>
          </Focusable>
        );
      }
      case 'tally': {
        const r = TALLY_TEXT_RECT;
        const rows = village.weeklyTally.slice(0, village.weeklyTally.length > 3 ? 2 : 3);
        const more = village.weeklyTally.length - rows.length;
        return (
          <Focusable key={s.id} label={tallyTip} panel={{ kind: 'tally' }} onOpen={onOpen} at={at} ring={{ x: -76, y: -132, w: 152, h: 160 }}>
            <TallySign />
            <g aria-hidden="true">
              {rows.map((t, i) => (
                <g key={t.projectId}>
                  <text x={r.x + 6} y={r.y + 17 + i * 16} fontSize={13} className="va-ink-text">
                    {truncate(t.projectName, 14)}
                  </text>
                  <text x={r.x + r.width - 6} y={r.y + 17 + i * 16} fontSize={14} fontWeight={800} textAnchor="end" className="va-ink-text">
                    {t.done}
                  </text>
                </g>
              ))}
              {more > 0 && (
                <text x={r.x + 6} y={r.y + 17 + rows.length * 16} fontSize={12} className="va-ink-text">
                  +{more} more
                </text>
              )}
            </g>
          </Focusable>
        );
      }
      case 'tavern': {
        const n = village.agents.filter((a) => a.location.kind === 'tavern').length;
        return (
          <Focusable key={s.id} label={`Tavern: ${n} ${n === 1 ? 'agent rests' : 'agents rest'} here. Agents with no open tasks go to the tavern.`} panel={{ kind: 'place', id: 'tavern' }} onOpen={onOpen} at={at} ring={TAVERN_RING}>
            <Tavern />
          </Focusable>
        );
      }
      case 'gatehouse': {
        const n = village.agents.filter((a) => a.location.kind === 'gatehouse').length;
        return (
          <Focusable key={s.id} label={`Gatehouse: ${n} ${n === 1 ? 'agent waits' : 'agents wait'} for code review. Nothing passes unchecked.`} panel={{ kind: 'place', id: 'gatehouse' }} onOpen={onOpen} at={at} ring={GATEHOUSE_RING}>
            <Gatehouse />
          </Focusable>
        );
      }
      default: {
        const p = village.projects.find((x) => `project:${x.id}` === s.id);
        if (!p) return null;
        const ring = p.plot !== 'ok' ? BUILDING_RINGS.plot : ((BUILDING_RINGS as Record<string, Box>)[p.building] ?? BUILDING_RINGS.plot);
        return (
          <Focusable key={s.id} label={projectTip(p)} panel={{ kind: 'project', id: p.id }} onOpen={onOpen} at={at} ring={ring as Box}>
            <ProjectNode p={p} reduced={reduced} />
          </Focusable>
        );
      }
    }
  };

  return (
    <div ref={wrap} className="va-scene-wrap" data-daypart={dayPart}>
      {blockCard && <NeedsBlock village={village} onOpen={onOpen} />}
      <p id="va-scene-desc" className="va-sr">
        Tab moves through the town hall, buildings (including the chapel, well, herbalist's hut and schoolhouse) and town square pieces from the top of the scene downwards, then the content pipeline carts, then the characters. Characters keep their place in the Tab order while they walk. Enter or Space opens details. The list view has the same information as tables.
        {narrow ? ' On narrow screens the list view is easier to use.' : ''}
      </p>
      <svg
        className="va-scene"
        viewBox={`0 0 ${SCENE.width} ${SCENE.height}`}
        role="group"
        aria-label="Agent Village scene"
        aria-describedby="va-scene-desc"
        style={{ fontFamily: UI_FONT }}
      >
        <Ground projectSpots={projectSpots} />
        {trackPoints.length >= 2 && <PipelineTrack points={trackPoints} />}
        {order.filter((s) => !s.id.startsWith('cart:')).map(renderStructure)}
        {/* Carts sit above every building (still y sorted among themselves): the town hall cart would otherwise hide behind the chronicle board. */}
        {order.filter((s) => s.id.startsWith('cart:')).map(renderStructure)}
        <g className="va-sprites" aria-hidden="true" pointerEvents="none">
          {spriteOrder.map((c) => (
            <CharacterSprite key={c.key} c={c} view={views.get(c.key) ?? null} registry={sprites.current} />
          ))}
        </g>
        <g className="va-hits">
          {hitOrder.map((key) => {
            const c = charByKey.get(key);
            return c ? <CharacterHit key={key} c={c} village={village} onOpen={onOpen} xp={xp} walking={views.has(key)} registry={hits.current} /> : null;
          })}
        </g>
        {chars.map((c) => (
          <CharacterWalker key={c.key} c={c} net={net} reduced={reduced} sprites={sprites.current} hits={hits.current} onState={onState} onSettle={onSettle} />
        ))}
        <g className="va-tags" aria-hidden="true" pointerEvents="none">
          {tags.map((t) => (
            <Tag key={t.key} t={t} font={font} hidden={views.has(t.key) || willWalk(settled.current.get(t.key), t.feet, reduced)} />
          ))}
        </g>
        <g className="va-strips">
          {pills.flatMap((x) => x.pills.map((pl, i) => {
            const base = `${x.p.id}:${pl.icon ?? 'none'}:${pl.label}`;
            const dup = x.pills.slice(0, i).filter((o) => `${x.p.id}:${o.icon ?? 'none'}:${o.label}` === base).length;
            return <SignalPill key={dup ? `${base}#${dup}` : base} pill={pl} />;
          }))}
        </g>
        {!blockCard && <NeedsYouCard village={village} onOpen={onOpen} fontPx={fontPx} height={cardH} onHeight={setCardH} onOverflow={setOverflowed} />}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------ characters and tags */

function useRegistered(registry: Map<string, SVGGElement>, key: string): (el: SVGGElement | null) => void {
  return useCallback(
    (el: SVGGElement | null) => {
      if (el) registry.set(key, el);
      else registry.delete(key);
    },
    [registry, key],
  );
}

/** The drawing of one character (decorative). Its transform is the destination; a walk overrides it from rAF. */
const CharacterSprite = memo(CharacterSpriteView, (a, b) => a.c === b.c && a.registry === b.registry && !!a.view === !!b.view && a.view?.flip === b.view?.flip);

function CharacterSpriteView({ c, view, registry }: { c: PlacedChar; view: WalkView | null; registry: Map<string, SVGGElement> }): JSX.Element {
  const a = c.agent;
  const ref = useRegistered(registry, c.key);
  const pose = view ? 'walk' : c.pose;
  return (
    <g ref={ref} transform={`translate(${c.x} ${c.y})`}>
      {a.personas?.length ? (
        <Troupe personas={a.personas} pose={pose} alert={c.alert} />
      ) : (
        <Character villageClass={a.villageClass} pose={pose} alert={c.alert} sleepy={view ? false : c.sleepy} mug={view ? false : c.mug} flip={view?.flip} />
      )}
    </g>
  );
}

/** The keyboard and pointer target of one character: transparent hit area plus focus ring, in a stable DOM order. */
function CharacterHit({ c, village, onOpen, xp, walking, registry }: { c: PlacedChar; village: Village; onOpen: OpenPanel; xp: boolean; walking: boolean; registry: Map<string, SVGGElement> }): JSX.Element {
  const a = c.agent;
  const half = c.width / 2 + 4;
  const top = c.alert ? -114 : -88;
  const ref = useRegistered(registry, c.key);
  return (
    <Focusable
      gRef={ref}
      label={agentTip(a, village, xp)}
      panel={{ kind: 'agent', name: a.name }}
      onOpen={onOpen}
      at={{ x: c.x, y: c.y }}
      ring={{ x: -half, y: top, w: half * 2, h: 6 - top + 2 }}
      hit
      walking={walking}
      className="va-char-btn"
    >
      {null}
    </Focusable>
  );
}

/** Renders nothing: moves the character's sprite and hit group along the paths when its place changes. */
function CharacterWalker({ c, net, reduced, sprites, hits, onState, onSettle }: { c: PlacedChar; net: PathNetwork; reduced: boolean; sprites: Map<string, SVGGElement>; hits: Map<string, SVGGElement>; onState: (key: string, v: WalkView | null) => void; onSettle: (key: string, p: Pt) => void }): null {
  const key = c.key;
  useWalker({
    x: c.x,
    y: c.y,
    net,
    reduced,
    els: () => [sprites.get(key), hits.get(key)],
    onState: (v) => onState(key, v),
    onSettle: (p) => onSettle(key, p),
  });
  return null;
}

function Tag({ t, font, hidden }: { t: TagLayout; font: number; hidden: boolean }): JSX.Element {
  const { box: b } = t;
  const f2 = Math.round(font * 0.94);
  const f3 = Math.round(font * 0.82);
  const icon = f2 + 2;
  const icoKind: SignalIconKind = t.icon;
  const nearX = Math.max(b.x + 8, Math.min(b.x + b.w - 8, t.feet.x));
  const badgeX = b.x + 7 + t.nameW + 6;
  const badgeY = b.y + 5 + font * 0.82 - font * 0.3 - (f3 + 4) / 2;
  return (
    <g className={`va-tag${hidden ? ' va-tag-hidden' : ''}`}>
      {t.moved && <path d={`M${t.feet.x},${t.feet.y - 2} L${nearX},${b.y}`} className="va-leader" />}
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={7} className="va-tag-bg" />
      {t.level === null ? (
        <text x={b.x + b.w / 2} y={b.y + 5 + font * 0.82} fontSize={font} fontWeight={700} textAnchor="middle" className="va-tag-name">
          {t.line1}
        </text>
      ) : (
        <>
          <text x={b.x + 7} y={b.y + 5 + font * 0.82} fontSize={font} fontWeight={700} className="va-tag-name">
            {t.line1}
          </text>
          <rect x={badgeX} y={badgeY} width={t.badgeW} height={f3 + 4} rx={(f3 + 4) / 2} className="va-level-bg" />
          <text x={badgeX + t.badgeW / 2} y={badgeY + (f3 + 4) / 2 + f3 * 0.35} fontSize={f3} fontWeight={700} textAnchor="middle" className="va-level-text">
            {t.level}
          </text>
        </>
      )}
      <g transform={`translate(${b.x + 7} ${b.y + 8 + font})`}>
        <SignalIcon kind={icoKind} size={icon} />
      </g>
      <text x={b.x + 7 + icon + 4} y={b.y + 8 + font + f2 * 0.84} fontSize={f2} className="va-tag-state">
        {t.line2}
      </text>
    </g>
  );
}

/** Narrow screens: the same Needs you content as a plain HTML block above the scene, at normal text size. */
export function NeedsBlock({ village, onOpen }: { village: Village; onOpen: OpenPanel }): JSX.Element {
  return (
    <div className="va-needs va-needs-block" role="region" aria-labelledby="va-needs-title">
      <NeedsContent items={village.needsYou} village={village} />
      <button type="button" className="va-btn" aria-haspopup="dialog" onClick={(e) => onOpen({ kind: 'town-hall' }, e.currentTarget)}>
        Open town hall details
      </button>
    </div>
  );
}

/**
 * The scene only re-renders when something it shows changed: the once-a-minute day-part label (App re-renders for it)
 * and watch-mode rewrites that only change `generatedAt` leave it alone.
 */
export const Scene = memo(
  SceneView,
  (a, b) => a.onOpen === b.onOpen && a.xp === b.xp && a.dayPart === b.dayPart && a.reduced === b.reduced && sameVillage(a.village, b.village),
);
