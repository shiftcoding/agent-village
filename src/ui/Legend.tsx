import type { ReactNode } from 'react';
import {
  CartographersWorkshop,
  Chapel,
  Character,
  DayPartIcon,
  HerbalistHut,
  PipelineCart,
  Plot,
  Schoolhouse,
  SPECIALIST_RINGS,
  SignalIcon,
  Troupe,
  VillageWell,
  type DayPart,
  type Pose,
  type SignalIconKind,
} from '../art';
import type { HealthKind, SpecialistPlace, Stage, Village, VillageClass } from '../data/types';
import { DEFAULT_PERSONAS_SAMPLE } from './legendData';
import { fmtEpoch, fmtStamp } from './format';

interface StateRow {
  icon: SignalIconKind;
  label: string;
  rule: string;
  art: ReactNode;
}

function CharSample({ cls, pose, alert, sleepy, mug }: { cls: VillageClass; pose: Pose; alert?: boolean; sleepy?: boolean; mug?: boolean }): JSX.Element {
  return (
    <svg className="va-sample" viewBox="-34 -104 68 112" width={68} height={112} aria-hidden="true" focusable="false">
      <Character villageClass={cls} pose={pose} alert={alert} sleepy={sleepy} mug={mug} />
    </svg>
  );
}

const STATES: StateRow[] = [
  { icon: 'doing', label: 'Doing', rule: 'A task with status doing. The agent works at that project\'s building, with its class animation.', art: <CharSample cls="dwarf-smith" pose="work" /> },
  { icon: 'review', label: 'In review', rule: 'A task with status review. The agent waits at the gatehouse beside the paladin.', art: <CharSample cls="ranger" pose="wait" /> },
  { icon: 'blocked', label: 'Blocked', rule: 'A task with status blocked. The agent stands on the town hall steps under a glowing "!". Any agent with a blocked task shows the "!", even while doing something else.', art: <CharSample cls="cleric" pose="stand" alert /> },
  { icon: 'todo', label: 'Todo only', rule: 'Only todo tasks. The agent studies the quest board in the town square.', art: <CharSample cls="cartographer" pose="study" /> },
  { icon: 'idle', label: 'Idle', rule: 'No open tasks. The agent sits at the tavern with a mug.', art: <CharSample cls="jester" pose="rest" mug /> },
  { icon: 'idle', label: 'Idle, zzz', rule: 'Idle, and no log line from this agent for 24 hours. Shown with "zzz".', art: <CharSample cls="jester" pose="rest" mug sleepy /> },
  { icon: 'stranger', label: 'Unknown agent', rule: 'The name in progress.md matches no agent in the roster (a typo or a new agent). Drawn as a hooded stranger.', art: <CharSample cls="stranger" pose="stand" /> },
  {
    icon: 'todo',
    label: 'Masked troupe',
    rule: 'user-simulator. One masked figure per persona, so a troupe of four by default. It takes the pose of its task like any other agent.',
    art: (
      <svg className="va-sample" viewBox="-70 -90 140 100" width={140} height={100} aria-hidden="true" focusable="false">
        <Troupe personas={DEFAULT_PERSONAS_SAMPLE} pose="study" />
      </svg>
    ),
  },
];

function BuildingSample({ kind }: { kind: HealthKind }): JSX.Element {
  const stage: Stage = kind === 'released' ? 'released' : 'testing';
  return (
    <svg className="va-sample" viewBox="-120 -250 240 330" width={120} height={165} aria-hidden="true" focusable="false">
      <CartographersWorkshop stage={stage} overall={80} signals={[kind]} needsYouCount={2} signText="Sample" />
    </svg>
  );
}

function PlotSample({ kind }: { kind: 'no-folder' | 'no-progress' }): JSX.Element {
  return (
    <svg className="va-sample" viewBox="-90 -115 180 180" width={120} height={120} aria-hidden="true" focusable="false">
      <Plot kind={kind} />
    </svg>
  );
}

interface HealthRow {
  icon: SignalIconKind;
  label: string;
  rule: string;
  art: ReactNode;
}

const HEALTH: HealthRow[] = [
  { icon: 'active', label: 'Active', rule: 'A log line in the last 24 hours. Chimney smoke and lit windows.', art: <BuildingSample kind="active" /> },
  { icon: 'needs-you', label: 'Needs you', rule: 'One or more open items under "Needs you". A banner with "!" on the roof and a count badge.', art: <BuildingSample kind="needs-you" /> },
  { icon: 'failing', label: 'Failing', rule: 'A QA or code-review finding is still open on a task marked done. A storm cloud over the building.', art: <BuildingSample kind="failing" /> },
  { icon: 'friction', label: 'User friction', rule: 'A blocker in the latest user-simulator report. A masked figure sits on the doorstep.', art: <BuildingSample kind="friction" /> },
  { icon: 'stale', label: 'Stale', rule: 'No log line for 7 days. Vines creep over the walls.', art: <BuildingSample kind="stale" /> },
  { icon: 'released', label: 'Released', rule: 'Stage is released. A flag flies, fireworks play once.', art: <BuildingSample kind="released" /> },
  { icon: 'no-folder', label: 'No folder set', rule: 'The project has no folder in village.config.json (and no fixture). A staked plot with an empty tag.', art: <PlotSample kind="no-folder" /> },
  { icon: 'no-progress', label: 'No progress file yet', rule: 'The folder has no docs/progress.md. A staked plot with a pointing signpost.', art: <PlotSample kind="no-progress" /> },
];

export function referenceNotes(village: Village): string[] {
  const over = village.projects.find((p) => p.referenceSource === 'override');
  if (over) return [`Times are judged against ${fmtEpoch(over.referenceTime, village.timezone)}, from ?now= in the URL.`];
  const notes: string[] = [];
  for (const p of village.projects) {
    if (p.referenceSource === 'file-updated') {
      notes.push(`${p.name} is a fixture; times are judged against its Updated time (${fmtStamp(p.progress?.updated ?? null)}), not today.`);
    }
  }
  return notes;
}

export const NOW_HINT = 'Add ?now=YYYY-MM-DDTHH:MM to the URL to try another time.';
export const TIME_HINT = 'Add ?time=HH:MM to preview another time of day.';

const PLACES: Array<{ place: SpecialistPlace; label: string; rule: string; art: JSX.Element }> = [
  { place: 'chapel', label: 'Chapel', rule: 'content-safety-reviewer (Cleric) works here while doing a task: the safety review of drafted content.', art: <Chapel /> },
  { place: 'well', label: 'Village well', rule: 'relationship-advisor (Elder counselor) works here while doing a task: advice review.', art: <VillageWell /> },
  { place: 'herbalist', label: "Herbalist's hut", rule: 'womens-health-advisor (Healer) works here while doing a task: advice review.', art: <HerbalistHut /> },
  { place: 'schoolhouse', label: 'Schoolhouse', rule: 'parenting-advisor (Teacher) works here while doing a task: advice review.', art: <Schoolhouse /> },
];

const DAY_PARTS: Array<{ part: DayPart; label: string; rule: string }> = [
  { part: 'dawn', label: 'Dawn', rule: 'From 45 minutes before sunrise to 45 minutes after. Pink light, lamps off.' },
  { part: 'day', label: 'Day', rule: 'Between dawn and dusk.' },
  { part: 'dusk', label: 'Dusk', rule: 'From 45 minutes before sunset to 45 minutes after. Warm light, the town lamps come on.' },
  { part: 'night', label: 'Night', rule: 'The rest of the day. Lamps lit on the town hall, tavern, gatehouse and lanterns. Project buildings light their windows only when they are Active, never because of the clock.' },
];

function PlaceSample({ place, children }: { place: SpecialistPlace; children: JSX.Element }): JSX.Element {
  const r = SPECIALIST_RINGS[place];
  return (
    <svg className="va-sample" viewBox={`${r.x} ${r.y} ${r.w} ${r.h}`} width={Math.min(150, r.w * 0.5)} height={Math.min(150, r.w * 0.5) * (r.h / r.w)} aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

/** Signal gallery: every state and signal with its art, icon, label and trigger rule. */
export function Legend({ village, dayPartLabel }: { village: Village; dayPartLabel?: string }): JSX.Element {
  const notes = referenceNotes(village);
  return (
    <div className="va-legend">
      <p className="va-note-box">
        {notes.length ? notes.join(' ') : 'Times are judged against the current time.'} {NOW_HINT} {TIME_HINT}
      </p>
      <p className="va-muted">Every signal has a shape, a text label and a rule. None of them rely on colour alone. The fixture does not trigger Stale or Released, so they are shown here.</p>

      <h3>Agent states</h3>
      <ul className="va-gallery">
        {STATES.map((s) => (
          <li key={s.label}>
            <div className="va-gallery-art">{s.art}</div>
            <div>
              <p className="va-gallery-label">
                <SignalIcon kind={s.icon} size={24} /> <strong>{s.label}</strong>
              </p>
              <p>{s.rule}</p>
            </div>
          </li>
        ))}
      </ul>

      <h3>Project signals and plots</h3>
      <ul className="va-gallery">
        {HEALTH.map((s) => (
          <li key={s.label}>
            <div className="va-gallery-art">{s.art}</div>
            <div>
              <p className="va-gallery-label">
                <SignalIcon kind={s.icon} size={24} /> <strong>{s.label}</strong>
              </p>
              <p>{s.rule}</p>
            </div>
          </li>
        ))}
      </ul>

      <h3>Specialist places</h3>
      <p className="va-muted">These buildings stand in the village while their agent is in the roster. The agent stands here only while doing a task.</p>
      <ul className="va-gallery">
        {PLACES.map((pl) => (
          <li key={pl.place}>
            <div className="va-gallery-art">
              <PlaceSample place={pl.place}>{pl.art}</PlaceSample>
            </div>
            <div>
              <p className="va-gallery-label">
                <strong>{pl.label}</strong>
              </p>
              <p>{pl.rule}</p>
            </div>
          </li>
        ))}
      </ul>

      <h3>Content pipeline</h3>
      <ul className="va-gallery">
        <li>
          <div className="va-gallery-art">
            <svg className="va-sample" viewBox="-34 -40 68 50" width={102} height={75} aria-hidden="true" focusable="false">
              <PipelineCart />
            </svg>
          </div>
          <div>
            <p className="va-gallery-label">
              <strong>Pipeline cart</strong>
            </p>
            <p>Open work waits at this stop of the content route: the tavern (bro-writer drafts), the chapel, the well, the herbalist's hut and the schoolhouse (reviews), then the town hall (human sign-off). The number on the tag is how many items wait. A cart is drawn only where work is waiting. Dashed cart tracks join the stops from the first to the last one with work.</p>
          </div>
        </li>
      </ul>

      <h3>Time of day</h3>
      <p className="va-muted">The scene follows the time of day at the village location{dayPartLabel ? ` (now: ${dayPartLabel})` : ''}. {TIME_HINT}</p>
      <ul className="va-gallery">
        {DAY_PARTS.map((d) => (
          <li key={d.part}>
            <div className="va-gallery-art">
              <DayPartIcon kind={d.part} size={48} />
            </div>
            <div>
              <p className="va-gallery-label">
                <strong>{d.label}</strong>
              </p>
              <p>{d.rule}</p>
            </div>
          </li>
        ))}
      </ul>

      <h3>Walking, growth and levels</h3>
      <ul className="va-plain-list">
        <li>When data changes, an agent walks along the paths to the new place. The name tag returns on arrival and always says the new state in text. With reduced motion the agent simply appears there.</li>
        <li>A project building grows when its overall progress rises while in the Building stage (a puff of dust once), and changes look when its stage changes. A project that becomes released gets fireworks once.</li>
        <li>XP and levels (optional, in the toolbar): 10 XP per finished task, level up every 3 tasks. Shown as "Lv 2" on the name tag. No streaks, no penalties, no rankings.</li>
      </ul>
    </div>
  );
}
