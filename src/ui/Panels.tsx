import type { ReactNode } from 'react';
import { ClassIcon, SignalIcon } from '../art';
import { pipelineOf, pipelineSummary } from '../data/pipeline';
import type { Agent, LogEntry, NeedsYouItem, PipelineStop, Project, QuestNote, SpecialistPlace, Task, Village } from '../data/types';
import { CopyPromptButton } from './CopyPromptButton';
import { agentPrompt, needsYouKeys, needsYouLabel, needsYouPrompt } from './answerPrompt';
import { placeName } from './describe';
import { BUILDING_LABEL, CLASS_LABEL, PLACE_LABEL, STAGE_LABEL, STOP_LABEL, buildingName, fmtEpoch, fmtStamp, sortHealth, taskKey, tagStateText, xpSourceText } from './format';
import { agentOfPlace, tavernGuests } from './layout';
import type { PanelId } from './panelTypes';

export interface PanelContent {
  title: string;
  body: ReactNode;
}

/* ------------------------------------------------------------ shared pieces */

export function SignalList({ project }: { project: Project }): JSX.Element {
  const list = sortHealth(project.health);
  if (list.length === 0) return <p>No health signals right now.</p>;
  return (
    <ul className="va-signal-list">
      {list.map((s) => (
        <li key={s.kind}>
          <SignalIcon kind={s.kind} size={22} />
          <span>
            <strong>{s.label}</strong>
            <br />
            <span className="va-muted">{s.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function NeedsList({ items, village }: { items: Array<NeedsYouItem & { projectName?: string }>; village: Village }): JSX.Element {
  if (items.length === 0) return <p>Nothing is waiting on you.</p>;
  const keys = needsYouKeys(items);
  return (
    <ol className="va-plain-list">
      {items.map((n, i) => (
        <li key={keys[i]}>
          {n.text}
          <br />
          <span className="va-muted">
            {n.projectName ? `${n.projectName}, ` : ''}raised by {n.raisedBy ?? 'unknown'}
          </span>
          <CopyPromptButton prompt={needsYouPrompt(n, village.projects)} label="Copy answer prompt" ariaLabel={`Copy answer prompt for: ${needsYouLabel(n)}`} />
        </li>
      ))}
    </ol>
  );
}

export function LogList({ entries, withProject }: { entries: Array<LogEntry & { projectName?: string }>; withProject?: boolean }): JSX.Element {
  if (entries.length === 0) return <p>No log lines yet.</p>;
  return (
    <ol className="va-plain-list">
      {entries.map((l, i) => (
        <li key={i}>
          {l.agent ? `${l.agent}: ` : ''}
          {l.text}
          <span className="va-muted">
            {withProject && l.projectName ? ` · ${l.projectName}` : ''} · {fmtStamp(l.timestamp)}
          </span>
        </li>
      ))}
    </ol>
  );
}

function TaskLine({ t }: { t: Task }): JSX.Element {
  return (
    <li>
      <strong>{t.id}</strong> {t.title} <span className="va-badge">{t.status === 'unknown' && t.rawStatus ? `status: ${t.rawStatus}` : t.status}</span>
      {t.notes ? (
        <>
          <br />
          <span className="va-muted">{t.notes}</span>
        </>
      ) : null}
    </li>
  );
}

function Fields({ rows }: { rows: Array<[string, ReactNode]> }): JSX.Element {
  return (
    <dl className="va-fields">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function overallText(p: Project): string {
  const o = p.progress?.overall;
  if (o == null) return 'unknown';
  const src = p.progress?.overallSource;
  return `${o}% (${src === 'file' ? 'from the progress file' : src === 'computed' ? 'computed: share of tasks done' : 'source unknown'})`;
}

export function referenceText(p: Project, tz: string): string {
  if (p.referenceSource === 'override') return `Times are judged against ${fmtEpoch(p.referenceTime, tz)} (from ?now= in the URL).`;
  if (p.referenceSource === 'file-updated') return `${p.name} is a fixture: times are judged against its Updated time (${fmtStamp(p.progress?.updated ?? null)}), not today.`;
  return 'Times are judged against the current time.';
}

/* ------------------------------------------------------------ panels */

function projectPanel(p: Project, village: Village): PanelContent {
  const pr = p.progress;
  const title = p.name;
  if (!pr) {
    return {
      title,
      body: (
        <>
          <Fields rows={[['Building', buildingName(p)]]} />
          <p>{p.plot === 'no-folder' ? 'No folder is set for this project in village.config.json, so there is nothing to read yet.' : 'This project has no docs/progress.md yet, so there is nothing to read yet.'}</p>
          {village.warnings.filter((w) => w.startsWith(`${p.name}:`)).length > 0 && (
            <ul className="va-plain-list">
              {village.warnings
                .filter((w) => w.startsWith(`${p.name}:`))
                .map((w, i) => (
                  <li key={`${i}-${w}`}>{w}</li>
                ))}
            </ul>
          )}
        </>
      ),
    };
  }
  const open = pr.tasks.filter((t) => t.status !== 'done');
  const byAgent = new Map<string, Task[]>();
  for (const t of open) byAgent.set(t.agent || 'unassigned', [...(byAgent.get(t.agent || 'unassigned') ?? []), t]);
  const recent = [...pr.log]
    .map((l, i) => ({ l, i }))
    .sort((a, b) => (b.l.time ?? -Infinity) - (a.l.time ?? -Infinity) || a.i - b.i)
    .slice(0, 5)
    .map((x) => x.l);
  return {
    title,
    body: (
      <>
        <Fields
          rows={[
            ['Building', BUILDING_LABEL[p.building]],
            ['Stage', STAGE_LABEL[pr.stage]],
            ['Overall', (
              <>
                {overallText(p)}
                {pr.overall != null && <progress className="va-progress" value={pr.overall} max={100} aria-label={`Overall ${pr.overall}%`} />}
              </>
            )],
            ['Updated', fmtStamp(pr.updated)],
            ['Done this week', String(p.doneThisWeek)],
          ]}
        />
        <p className="va-muted">{referenceText(p, village.timezone)}</p>
        <h3>Health signals</h3>
        <SignalList project={p} />
        <h3>Needs you ({pr.needsYou.length})</h3>
        <NeedsList items={[...pr.needsYou].reverse()} village={village} />
        <h3>Milestones</h3>
        {pr.milestones.length === 0 ? (
          <p>No milestones listed.</p>
        ) : (
          <ul className="va-plain-list">
            {pr.milestones.map((m, i) => (
              <li key={i}>
                <span className="va-badge">{m.done ? 'Done' : 'To do'}</span> {m.text}
              </li>
            ))}
          </ul>
        )}
        <h3>Open tasks by agent ({open.length})</h3>
        {open.length === 0 ? (
          <p>No open tasks.</p>
        ) : (
          [...byAgent.entries()].map(([agent, tasks]) => (
            <div key={agent}>
              <h4>{agent}</h4>
              <ul className="va-plain-list">
                {tasks.map((t, i) => (
                  <TaskLine key={`${taskKey(t)}-${i}`} t={t} />
                ))}
              </ul>
            </div>
          ))
        )}
        <h3>Last 5 log lines</h3>
        <LogList entries={recent} />
        {pr.warnings.length > 0 && (
          <>
            <h3>Warnings</h3>
            <ul className="va-plain-list">
              {pr.warnings.map((w, i) => (
                <li key={`${i}-${w}`}>{w}</li>
              ))}
            </ul>
          </>
        )}
      </>
    ),
  };
}

function agentPanel(a: Agent, village: Village, xp: boolean): PanelContent {
  const byProject = new Map<string, Task[]>();
  for (const t of a.tasks) byProject.set(t.projectId, [...(byProject.get(t.projectId) ?? []), t]);
  const nameOf = (id: string): string => village.projects.find((p) => p.id === id)?.name ?? id;
  const d = a.def;
  return {
    title: a.name,
    body: (
      <>
        <p className="va-state-line">
          <SignalIcon kind={a.villageClass === 'stranger' ? 'stranger' : a.state} size={22} /> <strong>{tagStateText(a)}</strong> at {placeName(a, village)}
        </p>
        <Fields
          rows={[
            ['Class', (
              <span className="va-inline">
                <ClassIcon villageClass={a.villageClass} size={20} /> {CLASS_LABEL[a.villageClass]}
              </span>
            )],
            ['Role', d ? d.role : 'Not in the roster. Check the agent name for a typo.'],
            ['Source repo', d ? d.source : 'unknown'],
            ['Model', d ? d.model : 'unknown'],
            ['Look', d ? d.look : 'Hooded grey cloak, faceless, a "?" stitched on the front'],
            ['Tasks done this week', String(a.doneThisWeek)],
            ...(xp
              ? ([
                  ['Level', String(a.level)],
                  ['XP', String(a.xp)],
                  ['Tasks done', String(a.tasksDone)],
                  ['XP source', xpSourceText(village)],
                ] as Array<[string, ReactNode]>)
              : []),
            ...(a.note ? ([['Note', a.note]] as Array<[string, ReactNode]>) : []),
            ...(a.personas?.length ? ([['Troupe personas', a.personas.join(', ')]] as Array<[string, ReactNode]>) : []),
          ]}
        />
        <div>
          <CopyPromptButton prompt={agentPrompt(a, village.projects)} label="Copy prompt" ariaLabel={`Copy prompt for ${a.name}`} />
        </div>
        <h3>Current tasks ({a.tasks.length})</h3>
        {a.tasks.length === 0 ? (
          <p>No open tasks in any project.</p>
        ) : (
          [...byProject.entries()].map(([pid, tasks]) => (
            <div key={pid}>
              <h4>{nameOf(pid)}</h4>
              <ul className="va-plain-list">
                {tasks.map((t, i) => (
                  <TaskLine key={`${taskKey(t)}-${i}`} t={t} />
                ))}
              </ul>
            </div>
          ))
        )}
      </>
    ),
  };
}

function notePanel(q: QuestNote, village: Village): PanelContent {
  const t = q.task;
  return {
    title: `Quest note ${t.id}`,
    body: (
      <>
        <p className="va-muted">{q.projectName}</p>
        <Fields
          rows={[
            ['ID', t.id],
            ['Task', t.title],
            ['Agent', (
              <span className="va-inline">
                <ClassIcon villageClass={q.villageClass} size={20} /> {t.agent || 'nobody assigned'}
                {q.villageClass !== 'stranger' ? ` (${CLASS_LABEL[q.villageClass]})` : ' (not in the roster)'}
              </span>
            )],
            ['Status', t.status === 'unknown' && t.rawStatus ? `${t.status} (written as "${t.rawStatus}")` : t.status],
            ['Notes', t.notes || 'none'],
          ]}
        />
        <p className="va-muted">{village.agents.some((a) => a.name === t.agent) ? 'This agent is studying the quest board.' : ''}</p>
      </>
    ),
  };
}

function groupedQuests(village: Village): JSX.Element {
  if (village.questBoard.length === 0) return <p>No todo tasks.</p>;
  return (
    <>
      {village.projects.map((p) => {
        const mine = village.questBoard.filter((q) => q.task.projectId === p.id);
        if (!mine.length) return null;
        return (
          <div key={p.id}>
            <h3>{p.name}</h3>
            <ul className="va-plain-list">
              {mine.map((q, i) => (
                <li key={`${taskKey(q.task)}-${i}`}>
                  <span className="va-inline">
                    <ClassIcon villageClass={q.villageClass} size={18} /> <strong>{q.task.id}</strong> {q.task.title}
                  </span>
                  <br />
                  <span className="va-muted">
                    {q.task.agent || 'nobody assigned'}
                    {q.task.notes ? ` · ${q.task.notes}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </>
  );
}

const PLACE_RULE: Record<SpecialistPlace, string> = {
  chapel: 'The content-safety-reviewer (Cleric) works here while doing a task: the safety review of drafted content.',
  well: 'The relationship-advisor (Elder counselor) works here while doing a task: advice review of drafted content.',
  herbalist: "The womens-health-advisor (Healer) works here while doing a task: advice review of drafted content.",
  schoolhouse: 'The parenting-advisor (Teacher) works here while doing a task: advice review of drafted content.',
};

/** Pipeline stops as a text table (used by the pipeline panel and the list view). */
export function PipelineTable({ pipeline }: { pipeline: PipelineStop[] }): JSX.Element {
  return (
    <div className="va-table-wrap">
      <table className="va-table">
        <caption className="va-sr">Content pipeline stops in route order with open items</caption>
        <thead>
          <tr>
            <th scope="col">Stop</th>
            <th scope="col">Open</th>
            <th scope="col">Items</th>
          </tr>
        </thead>
        <tbody>
          {pipeline.map((s) => (
            <tr key={s.stop}>
              <th scope="row">{STOP_LABEL[s.stop]}</th>
              <td>{s.count}</td>
              <td>{s.items.length === 0 ? 'nothing waiting' : s.items.map((i) => `${i.projectName} ${i.ref}: ${i.text}`).join('; ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PipelineBody({ village }: { village: Village }): JSX.Element {
  const pipeline = pipelineOf(village);
  return (
    <>
      <p className="va-muted">The route FlowBro content takes: drafted at the tavern, checked at the chapel, reviewed by the advisors, signed off by a human at the town hall. A cart stands at a stop only while open work waits there.</p>
      <p>{pipelineSummary(pipeline)}</p>
      <PipelineTable pipeline={pipeline} />
    </>
  );
}

function specialistPanel(place: SpecialistPlace, village: Village): PanelContent {
  const a = agentOfPlace(village, place);
  const here = a !== undefined && a.location.kind === 'specialist' && a.location.place === place;
  const stop = pipelineOf(village).find((s) => s.stop === place);
  return {
    title: PLACE_LABEL[place],
    body: (
      <>
        <p className="va-muted">{PLACE_RULE[place]}</p>
        {!a ? (
          <p>Nobody works here.</p>
        ) : (
          <p>
            <strong>{a.name}</strong>, {CLASS_LABEL[a.villageClass]}: {here ? 'works here now.' : `not here right now (${tagStateText(a).toLowerCase()} at ${placeName(a, village)}).`}
          </p>
        )}
        {a && here && a.tasks.length > 0 && (
          <ul className="va-plain-list">
            {a.tasks
              .filter((t) => t.status === 'doing')
              .map((t, i) => (
                <TaskLine key={`${taskKey(t)}-${i}`} t={t} />
              ))}
          </ul>
        )}
        <h3>Open work at this stop ({stop?.count ?? 0})</h3>
        {stop && stop.items.length > 0 ? (
          <ul className="va-plain-list">
            {stop.items.map((i, k) => (
              <li key={`${i.projectId}:${i.ref}:${k}`}>
                <strong>{i.projectName} {i.ref}</strong> {i.text} <span className="va-badge">{i.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>Nothing is waiting here.</p>
        )}
      </>
    ),
  };
}

export function buildPanel(panel: PanelId, village: Village, xp: boolean): PanelContent | null {
  switch (panel.kind) {
    case 'project': {
      const p = village.projects.find((x) => x.id === panel.id);
      return p ? projectPanel(p, village) : null;
    }
    case 'agent': {
      const a = village.agents.find((x) => x.name === panel.name);
      return a ? agentPanel(a, village, xp) : null;
    }
    case 'town-hall': {
      const orch = village.agents.find((a) => a.name === 'orchestrator');
      const blocked = village.agents.filter((a) => a.location.kind === 'town-hall-steps' && a.name !== 'orchestrator');
      return {
        title: `Town hall: Needs you (${village.needsYou.length})`,
        body: (
          <>
            <p className="va-muted">Every open decision or blocker waiting on Ivan, newest first. The orchestrator stands on the steps.</p>
            <NeedsList items={village.needsYou} village={village} />
            <h3>On the steps</h3>
            <ul className="va-plain-list">
              {orch && <li>{orch.name}: keeps progress.md and lists what needs you</li>}
              {blocked.map((a) => (
                <li key={a.name}>
                  {a.name}: {tagStateText(a).toLowerCase()}
                </li>
              ))}
              {blocked.length === 0 && <li>No blocked agents.</li>}
            </ul>
          </>
        ),
      };
    }
    case 'quest-board':
      return { title: `Quest board (${village.questBoard.length})`, body: <><p className="va-muted">Open tasks with status todo, grouped by project. The icon is the assigned agent's class.</p>{groupedQuests(village)}</> };
    case 'quest-note': {
      const q = village.questBoard.find((x) => taskKey(x.task) === panel.key);
      return q ? notePanel(q, village) : null;
    }
    case 'chronicle':
      return { title: `Chronicle (latest ${village.chronicle.length})`, body: <LogList entries={village.chronicle} withProject /> };
    case 'tally':
      return {
        title: 'Weekly tally',
        body: (
          <>
            <p className="va-muted">Tasks marked done this week, per project. There are no rankings between agents.</p>
            <table className="va-table">
              <thead>
                <tr>
                  <th scope="col">Project</th>
                  <th scope="col">Done this week</th>
                </tr>
              </thead>
              <tbody>
                {village.weeklyTally.map((t) => (
                  <tr key={t.projectId}>
                    <th scope="row">{t.projectName}</th>
                    <td>{t.done}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ),
      };
    case 'place': {
      if (panel.id !== 'gatehouse' && panel.id !== 'tavern') return specialistPanel(panel.id, village);
      const kind = panel.id;
      const here = kind === 'tavern' ? tavernGuests(village) : village.agents.filter((a) => a.location.kind === kind);
      return {
        title: kind === 'gatehouse' ? 'Gatehouse' : 'Tavern',
        body: (
          <>
            <p className="va-muted">
              {kind === 'gatehouse'
                ? 'The paladin (code-reviewer) checks everything. Agents with a task in review wait here.'
                : 'Agents with no open tasks rest inside the tavern, so they do not crowd the square. The sign shows how many are inside. "zzz" means no log line from that agent for 24 hours.'}
            </p>
            {here.length === 0 ? (
              <p>Nobody is here.</p>
            ) : (
              <ul className="va-plain-list">
                {here.map((a) => (
                  <li key={a.name}>
                    <strong>{a.name}</strong>, {CLASS_LABEL[a.villageClass]}: {tagStateText(a).toLowerCase()}
                    {a.note ? <><br /><span className="va-muted">{a.note}</span></> : null}
                  </li>
                ))}
              </ul>
            )}
          </>
        ),
      };
    }
    case 'pipeline':
      return { title: 'Content pipeline', body: <PipelineBody village={village} /> };
    case 'legend':
      return null;
  }
}

