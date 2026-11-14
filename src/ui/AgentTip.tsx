import { ClassIcon, SignalIcon, TipIcon } from '../art';
import type { Agent, Village } from '../data/types';
import { agentTipParts } from './describe';

/**
 * T49: the short agent tooltip. One fact per row, each with an icon AND a text label (never an icon alone):
 * name and role, status, the deciding task (id plus a one-line title), the place, extra flags, and a level badge.
 * The tooltip is aria-hidden; the character's aria-label keeps the full sentence, and the agent panel has every detail.
 */
export function AgentTip({ a, village, xp }: { a: Agent; village: Village; xp: boolean }): JSX.Element {
  const t = agentTipParts(a, village, xp);
  return (
    <div className="va-atip">
      <div className="va-atip-head">
        <ClassIcon villageClass={a.villageClass} size={22} />
        <div className="va-atip-who">
          <span className="va-atip-name">{t.name}</span>
          <span className="va-atip-role">{t.role}</span>
        </div>
        {t.level && <span className="va-atip-level">{t.level}</span>}
      </div>
      <div className="va-atip-row">
        <SignalIcon kind={t.status.icon} size={16} />
        <span className="va-atip-status">{t.status.label}</span>
      </div>
      {t.task && (
        <div className="va-atip-row">
          <TipIcon kind="task" size={16} />
          <b className="va-atip-id">{t.task.id}</b>
          <span className="va-atip-title">{t.task.title}</span>
          {t.task.more > 0 && <span className="va-atip-more">+{t.task.more} more</span>}
        </div>
      )}
      <div className="va-atip-row">
        <TipIcon kind="place" size={16} />
        <span>{t.place}</span>
      </div>
      {t.flags.map((f) => (
        <div className="va-atip-row" key={f.label}>
          <SignalIcon kind={f.icon} size={16} />
          <span>{f.label}</span>
        </div>
      ))}
    </div>
  );
}
