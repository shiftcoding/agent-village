import { describe, expect, it } from 'vitest';
import flowbro from '../../fixtures/flowbro/docs/progress.md?raw';
import userTest from '../../fixtures/flowbro/docs/user-tests/2026-11-20-first-open-paper-walkthrough.md?raw';
import review from '../../fixtures/flowbro/docs/reviews/2026-11-20-code-review.md?raw';
import { parseFindings, parseProgress, parseUserTest } from './parse';

describe('parseProgress: FlowBro fixture', () => {
  const p = parseProgress(flowbro, 'flowbro');
  it('reads the header', () => {
    expect(p.name).toBe('FlowBro');
    expect(p.stage).toBe('architecture');
    expect(p.overall).toBe(22);
    expect(p.overallSource).toBe('file');
    expect(p.updated).toBe('2026-11-20 16:40');
    expect(p.updatedTime).not.toBeNull();
  });
  it('reads sections', () => {
    expect(p.needsYou).toHaveLength(3);
    expect(p.needsYou[0]?.raisedBy).toBe('product-manager');
    expect(p.needsYou[0]?.text).not.toMatch(/raised by/);
    expect(p.milestones).toHaveLength(7);
    expect(p.tasks).toHaveLength(14);
    expect(p.log).toHaveLength(8);
    expect(p.log[0]?.agent).toBe('orchestrator');
    expect(p.warnings).toEqual([]);
  });
});

describe('parseProgress: tolerance', () => {
  it('never throws on garbage and says why', () => {
    for (const g of [null, undefined, '', '   ', 'garbage \u0000 ###', '|||', '## Tasks\n|', 42 as unknown as string]) {
      const p = parseProgress(g, 'x');
      expect(p.stage).toBe('unknown');
      expect(p.overall).toBeNull();
      expect(p.tasks).toEqual([]);
      expect(p.warnings.length).toBeGreaterThan(0);
    }
  });
  it('keeps checked needs-you items out', () => {
    const p = parseProgress('# Progress: X\n\n## Needs you\n- [x] done thing (raised by a)\n- [ ] open thing (raised by b)\n', 'x');
    expect(p.needsYou).toHaveLength(1);
    expect(p.needsYou[0]?.raisedBy).toBe('b');
  });
  it('handles unknown status, case, column order and missing columns', () => {
    const md = [
      '# Progress: X',
      '## Tasks',
      '| Status | ID |  Agent  | Task |',
      '|---|---|---|---|',
      '| DONE | T1 | a | one |',
      '| Waiting | T2 | b | two |',
      '| doing | T3 | | three |',
    ].join('\n');
    const p = parseProgress(md, 'x');
    expect(p.tasks.map((t) => t.status)).toEqual(['done', 'unknown', 'doing']);
    expect(p.tasks[1]?.rawStatus).toBe('Waiting');
    expect(p.tasks[0]?.agent).toBe('a');
    expect(p.tasks[0]?.title).toBe('one');
    expect(p.tasks[0]?.notes).toBe('');
    expect(p.warnings.some((w) => w.includes('Waiting'))).toBe(true);
  });
  it('computes overall when missing or invalid', () => {
    const rows = '## Tasks\n| ID | Task | Agent | Status |\n|---|---|---|---|\n| T1 | a | x | done |\n| T2 | b | x | todo |\n';
    for (const head of ['# Progress: X\n', '# Progress: X\nOverall: 150%\n', '# Progress: X\nOverall: lots\n']) {
      const p = parseProgress(`${head}${rows}`, 'x');
      expect(p.overall).toBe(50);
      expect(p.overallSource).toBe('computed');
    }
  });
  it('tolerates log lines without agent or time', () => {
    const p = parseProgress('## Log\n- 2026-11-20 10:00 a: with both\n- a: no time\n- 2026-11-20 10:00 only text\n- plain\n', 'x');
    expect(p.log.map((l) => [l.agent, l.time !== null])).toEqual([
      ['a', true],
      ['a', false],
      [null, true],
      [null, false],
    ]);
  });
});

describe('parseProgress: log agents and pipes', () => {
  it('only treats kebab-case lowercase words as agents', () => {
    const p = parseProgress('## Log\n- 2026-11-20 10:00 Note: x\n- 2026-11-20 10:00 T6: y\n- 2026-11-20 10:00 qa-expert: z\n', 'x');
    expect(p.log.map((l) => l.agent)).toEqual([null, null, 'qa-expert']);
    expect(p.log[0]?.text).toBe('Note: x');
  });
  it('respects escaped pipes in table cells', () => {
    const p = parseProgress('## Tasks\n| ID | Task | Agent | Status |\n|---|---|---|---|\n| T1 | a \\| b | x | todo |\n', 'x');
    expect(p.tasks[0]?.title).toBe('a | b');
    expect(p.tasks[0]?.status).toBe('todo');
  });
});

describe('parseUserTest', () => {
  it('reads the fixture', () => {
    const r = parseUserTest(userTest, '2026-11-20-first-open-paper-walkthrough.md', 'flowbro');
    expect(r.date).toBe('2026-11-20');
    expect(r.personas).toHaveLength(4);
    expect(r.blockers).toHaveLength(1);
  });
  it('takes the date from the filename and treats "none" as empty', () => {
    const r = parseUserTest('## Blockers\n- None\n', '2026-10-01-x.md', 'p');
    expect(r.date).toBe('2026-10-01');
    expect(r.blockers).toEqual([]);
  });
  it('never throws', () => {
    expect(parseUserTest(null, 'x.md', 'p').blockers).toEqual([]);
    expect(parseUserTest(undefined, undefined as unknown as string, 'p').date).toBeNull();
  });
});

describe('parseFindings', () => {
  it('reads open and closed findings', () => {
    const f = parseFindings(review, 'r.md', 'flowbro');
    expect(f).toHaveLength(2);
    expect(f[0]).toMatchObject({ taskId: 'T1', open: true, raisedBy: 'code-reviewer' });
    expect(f[0]?.text).toMatch(/^Focus ring/);
    expect(f[1]?.open).toBe(false);
  });
  it('never throws', () => {
    expect(parseFindings(null, 'r.md', 'p')).toEqual([]);
    expect(parseFindings('- [ ] no task id here', 'r.md', 'p')[0]?.taskId).toBeNull();
  });
});
