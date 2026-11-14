import flowbro from '../../fixtures/flowbro/docs/progress.md?raw';
import userTest from '../../fixtures/flowbro/docs/user-tests/2026-11-20-first-open-paper-walkthrough.md?raw';
import review from '../../fixtures/flowbro/docs/reviews/2026-11-20-code-review.md?raw';
import cfg from '../../village.config.json';
import { buildVillage } from '../data/model';
import type { VillageConfig } from '../data/types';
import { AgentTip } from '../ui/AgentTip';
import { agentTip } from '../ui/describe';

/**
 * Dev-only (preview.html?tips=1): the agent tooltip before and after T49, for a few fixture agents, so Ivan can
 * compare them without hovering in the village. Each card sits in the real tooltip box (.va-tip).
 */
const config = cfg as unknown as VillageConfig;
const village = buildVillage({
  config: { ...config, projects: config.projects.filter((p) => p.id === 'flowbro') },
  sources: { flowbro: { progress: flowbro, userTests: [{ file: 'u.md', text: userTest }], reviews: [{ file: 'r.md', text: review }] } },
  wallClock: Date.UTC(2026, 10, 13, 12, 0),
});

const PICK = ['privacy-guardian', 'typescript-pro', 'ui-designer', 'accessibility-tester', 'backend-developer', 'user-simulator'];

export function TipPreview({ xp }: { xp: boolean }): JSX.Element {
  const agents = PICK.map((n) => village.agents.find((a) => a.name === n)).filter((a) => a !== undefined);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '14px 24px', maxWidth: 900, alignItems: 'start' }}>
      <h2 style={{ fontSize: 16, margin: 0 }}>Before</h2>
      <h2 style={{ fontSize: 16, margin: 0 }}>After (T49)</h2>
      {agents.flatMap((a) => [
        <div key={`${a.name}-old`} className="va-tip" style={{ position: 'static', width: 'max-content' }}>
          {agentTip(a, village, xp)}
        </div>,
        <div key={`${a.name}-new`} className="va-tip va-tip-rich" style={{ position: 'static', width: 'max-content' }}>
          <AgentTip a={a} village={village} xp={xp} />
        </div>,
      ])}
    </div>
  );
}
