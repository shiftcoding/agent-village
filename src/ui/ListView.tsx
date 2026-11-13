import { forwardRef } from 'react';
import { ArtDefs, ClassIcon, SignalIcon } from '../art';
import { pipelineOf, pipelineSummary } from '../data/pipeline';
import type { Village } from '../data/types';
import { placeName, specialistTip } from './describe';
import { BUILDING_LABEL, CLASS_LABEL, PLACE_LABEL, STAGE_LABEL, fmtStamp, sortHealth, tagStateText, taskKey, xpSourceText } from './format';
import { agentOfPlace, specialistPlaces } from './layout';
import { referenceNotes } from './Legend';
import { CopyPromptButton } from './CopyPromptButton';
import { agentPrompt, needsYouKeys, needsYouLabel, needsYouPrompt } from './answerPrompt';
import { PipelineTable, overallText } from './Panels';

/** Plain semantic tables with the same data as the scene. Reads well with a screen reader and without colour. */
export const ListView = forwardRef<HTMLHeadingElement, { village: Village; xp: boolean }>(function ListView({ village, xp }, headingRef) {
  const nameOf = (id: string): string => village.projects.find((p) => p.id === id)?.name ?? id;
  const places = specialistPlaces(village);
  const pipeline = pipelineOf(village);
  const needsKeys = needsYouKeys(village.needsYou);
  return (
    <div className="va-list" id="list-view">
      {/* The scene (Ground) carries the shared art defs; in the list view they are mounted here so legend swatches paint. Not display:none, or gradients/filters would not resolve. */}
      <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
        <ArtDefs />
      </svg>
      <h2 ref={headingRef} tabIndex={-1} className="va-list-title">
        List view
      </h2>

      <section aria-labelledby="lv-projects">
        <h3 id="lv-projects">Projects</h3>
        <div className="va-table-wrap">
          <table className="va-table">
            <caption className="va-sr">Projects with stage, overall progress and health signals</caption>
            <thead>
              <tr>
                <th scope="col">Project</th>
                <th scope="col">Building</th>
                <th scope="col">Stage</th>
                <th scope="col">Overall</th>
                <th scope="col">Signals</th>
                <th scope="col">Done this week</th>
                <th scope="col">Updated</th>
              </tr>
            </thead>
            <tbody>
              {village.projects.map((p) => (
                <tr key={p.id}>
                  <th scope="row">{p.name}</th>
                  <td>{p.plot === 'ok' ? BUILDING_LABEL[p.building] : p.plot === 'no-folder' ? 'Plot: no folder set' : 'Plot: no progress file yet'}</td>
                  <td>{p.progress ? STAGE_LABEL[p.progress.stage] : 'unknown'}</td>
                  <td>{p.progress ? overallText(p) : 'unknown'}</td>
                  <td>
                    {p.health.length === 0 ? (
                      'none'
                    ) : (
                      <ul className="va-chips">
                        {sortHealth(p.health).map((s) => (
                          <li key={s.kind}>
                            <SignalIcon kind={s.kind} size={18} /> {s.label}
                            <span className="va-sr">: {s.detail}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td>{p.doneThisWeek}</td>
                  <td>{fmtStamp(p.progress?.updated ?? null)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {referenceNotes(village).map((n) => (
          <p key={n} className="va-muted">
            {n}
          </p>
        ))}
      </section>

      <section aria-labelledby="lv-needs">
        <h3 id="lv-needs">Needs you ({village.needsYou.length})</h3>
        {village.needsYou.length === 0 ? (
          <p>Nothing is waiting on you.</p>
        ) : (
          <div className="va-table-wrap">
            <table className="va-table">
              <caption className="va-sr">Open items waiting on you, newest first</caption>
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Project</th>
                  <th scope="col">Raised by</th>
                  <th scope="col">Answer</th>
                </tr>
              </thead>
              <tbody>
                {village.needsYou.map((n, i) => (
                  <tr key={needsKeys[i]}>
                    <td>{n.text}</td>
                    <td>{n.projectName}</td>
                    <td>{n.raisedBy ?? 'unknown'}</td>
                    <td>
                      <CopyPromptButton prompt={needsYouPrompt(n, village.projects)} label="Copy answer prompt" ariaLabel={`Copy answer prompt for: ${needsYouLabel(n)}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="lv-agents">
        <h3 id="lv-agents">Agents ({village.agents.length})</h3>
        <div className="va-table-wrap">
          <table className="va-table">
            <caption className="va-sr">Every agent with class, state, location and open tasks</caption>
            <thead>
              <tr>
                <th scope="col">Agent</th>
                <th scope="col">Class</th>
                <th scope="col">State</th>
                <th scope="col">Location</th>
                <th scope="col">Open tasks</th>
                <th scope="col">Done this week</th>
                {xp && <th scope="col">Level (XP)</th>}
                {xp && <th scope="col">Tasks done</th>}
                <th scope="col">Message</th>
              </tr>
            </thead>
            <tbody>
              {village.agents.map((a) => (
                <tr key={a.name}>
                  <th scope="row">{a.name}</th>
                  <td>
                    <span className="va-inline">
                      <ClassIcon villageClass={a.villageClass} size={18} /> {CLASS_LABEL[a.villageClass]}
                    </span>
                  </td>
                  <td>
                    <span className="va-inline">
                      <SignalIcon kind={a.villageClass === 'stranger' ? 'stranger' : a.state} size={18} /> {tagStateText(a)}
                    </span>
                  </td>
                  <td>{placeName(a, village)}</td>
                  <td>{a.tasks.length === 0 ? 'none' : a.tasks.map((t) => `${nameOf(t.projectId)} ${t.id} ${t.title} (${t.status})`).join('; ')}</td>
                  <td>{a.doneThisWeek}</td>
                  {xp && <td>{`Level ${a.level} (${a.xp} XP)`}</td>}
                  {xp && <td>{a.tasksDone}</td>}
                  <td>
                    <CopyPromptButton prompt={agentPrompt(a, village.projects)} label="Copy prompt" ariaLabel={`Copy prompt for ${a.name}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {xp && <p className="va-muted">{xpSourceText(village)}. Levels only show progress; there are no rankings, streaks or penalties.</p>}
      </section>

      <section aria-labelledby="lv-places">
        <h3 id="lv-places">Specialist places</h3>
        {places.length === 0 ? (
          <p>No specialist agents in the village.</p>
        ) : (
          <div className="va-table-wrap">
            <table className="va-table">
              <caption className="va-sr">Specialist buildings, who works there and what they are doing</caption>
              <thead>
                <tr>
                  <th scope="col">Place</th>
                  <th scope="col">Who works here</th>
                  <th scope="col">Right now</th>
                </tr>
              </thead>
              <tbody>
                {places.map((pl) => {
                  const a = agentOfPlace(village, pl);
                  return (
                    <tr key={pl}>
                      <th scope="row">{PLACE_LABEL[pl]}</th>
                      <td>{a ? `${a.name} (${CLASS_LABEL[a.villageClass]})` : 'nobody'}</td>
                      <td>{specialistTip(pl, village).replace(`${PLACE_LABEL[pl]}: `, '')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="lv-pipeline">
        <h3 id="lv-pipeline">Content pipeline</h3>
        <p>{pipelineSummary(pipeline)}</p>
        <PipelineTable pipeline={pipeline} />
      </section>

      <section aria-labelledby="lv-quests">
        <h3 id="lv-quests">Quest board ({village.questBoard.length})</h3>
        {village.questBoard.length === 0 ? (
          <p>No todo tasks.</p>
        ) : (
          <div className="va-table-wrap">
            <table className="va-table">
              <caption className="va-sr">Todo tasks grouped by project</caption>
              <thead>
                <tr>
                  <th scope="col">Project</th>
                  <th scope="col">ID</th>
                  <th scope="col">Task</th>
                  <th scope="col">Agent</th>
                  <th scope="col">Notes</th>
                </tr>
              </thead>
              <tbody>
                {village.questBoard.map((q, i) => (
                  <tr key={`${taskKey(q.task)}-${i}`}>
                    <td>{q.projectName}</td>
                    <td>{q.task.id}</td>
                    <td>{q.task.title}</td>
                    <td>{q.task.agent || 'nobody'}</td>
                    <td>{q.task.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="lv-chronicle">
        <h3 id="lv-chronicle">Chronicle (latest {village.chronicle.length})</h3>
        <div className="va-table-wrap">
          <table className="va-table">
            <caption className="va-sr">Latest log lines across projects, newest first</caption>
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">Project</th>
                <th scope="col">Agent</th>
                <th scope="col">What happened</th>
              </tr>
            </thead>
            <tbody>
              {village.chronicle.map((l, i) => (
                <tr key={i}>
                  <td>{fmtStamp(l.timestamp)}</td>
                  <td>{l.projectName}</td>
                  <td>{l.agent ?? 'unknown'}</td>
                  <td>{l.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="lv-tally">
        <h3 id="lv-tally">Weekly tally</h3>
        <div className="va-table-wrap">
          <table className="va-table">
            <caption className="va-sr">Tasks done this week per project. No rankings.</caption>
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
        </div>
      </section>
    </div>
  );
});
