import { describe, expect, it } from 'vitest';
import { agentPrompt, needsYouLabel, needsYouPrompt, oneLine } from './answerPrompt';

const projects = [
  { id: 'flowbro', name: 'FlowBro', path: null, isFixture: true },
  { id: 'agent-village', name: 'Agent Village', path: '~/src/agent-village', isFixture: false },
  { id: 'empty', name: 'Empty', path: null, isFixture: false },
];
const task = (projectId: string, id: string, title: string, status = 'doing') => ({ projectId, id, title, agent: 'x', status: status as 'doing', rawStatus: status, notes: '' });

describe('needsYouPrompt', () => {
  it('builds the three-line prompt with the folder', () => {
    const p = needsYouPrompt({ projectId: 'agent-village', text: 'Decide: PixiJS or SVG?', raisedBy: 'ui-designer' }, projects);
    expect(p).toBe('Answer for Agent Village (raised by ui-designer): Decide: PixiJS or SVG?\nProject folder: ~/src/agent-village\nMy decision: ');
  });
  it('says not set for sample data and for a project with no folder', () => {
    expect(needsYouPrompt({ projectId: 'flowbro', text: 't', raisedBy: 'a' }, projects)).toContain('Project folder: not set (sample data)');
    expect(needsYouPrompt({ projectId: 'empty', text: 't', raisedBy: 'a' }, projects)).toContain('Project folder: not set\n');
  });
  it('handles a missing agent and an unknown project without undefined/null', () => {
    for (const raisedBy of [null, '', '  ']) {
      const p = needsYouPrompt({ projectId: 'nope', projectName: 'Ghost', text: 'Q', raisedBy }, projects);
      expect(p).toBe('Answer for Ghost (raised by an unknown agent): Q\nProject folder: not set\nMy decision: ');
      expect(p).not.toMatch(/undefined|null/);
    }
  });
  it('keeps special characters, flattens newlines and cuts very long text', () => {
    const p = needsYouPrompt({ projectId: 'flowbro', text: 'Use "quotes", `ticks` | pipes\n\n  and\tunicode \u{1F600} é', raisedBy: 'a\nb' }, projects);
    expect(p.split('\n')).toHaveLength(3);
    expect(p).toContain('Use "quotes", `ticks` | pipes and unicode \u{1F600} é');
    expect(p).toContain('(raised by a b)');
    const long = needsYouPrompt({ projectId: 'flowbro', text: 'x'.repeat(5000), raisedBy: 'a' }, projects);
    expect(long.length).toBeLessThan(700);
    expect(long).toContain('…');
  });
  it('never throws on bad input', () => {
    expect(() => needsYouPrompt(null as never, null as never)).not.toThrow();
    expect(needsYouPrompt({ projectId: 'flowbro', text: undefined as never, raisedBy: 5 as never }, projects)).toContain('(no text)');
  });
  it('label is short and never empty', () => {
    expect(needsYouLabel({ text: 'y'.repeat(200) }).length).toBeLessThanOrEqual(60);
    expect(needsYouLabel({ text: ' ' })).toBe('this item');
  });
});

describe('agentPrompt', () => {
  it('lists projects, folders and tasks', () => {
    const p = agentPrompt({ name: 'ui-designer', tasks: [task('flowbro', 'T3', 'Bro faces'), task('agent-village', 'T31', 'Art pass', 'review'), task('flowbro', 'T4', 'Icons', 'blocked')] }, projects);
    expect(p).toBe(
      [
        'Message for agent ui-designer.',
        'Project: FlowBro',
        'Folder: not set (sample data)',
        'Tasks:',
        '- T3: Bro faces (doing)',
        '- T4: Icons (blocked)',
        'Project: Agent Village',
        'Folder: ~/src/agent-village',
        'Tasks:',
        '- T31: Art pass (review)',
        'My message: ',
      ].join('\n'),
    );
  });
  it('is clean for an agent with no tasks', () => {
    expect(agentPrompt({ name: 'tavern-guest', tasks: [] }, projects)).toBe('Message for agent tavern-guest.\nOpen tasks: none\nMy message: ');
  });
  it('falls back to the id for an unknown project and caps long task lists', () => {
    const many = Array.from({ length: 20 }, (_, i) => task('zzz', `T${i}`, `Title ${i}`));
    const p = agentPrompt({ name: 'a', tasks: many }, projects);
    expect(p).toContain('Project: zzz\nFolder: not set\n');
    expect(p).toContain('...and 8 more tasks');
    expect(p.endsWith('My message: ')).toBe(true);
  });
  it('is safe with special characters and never throws', () => {
    const p = agentPrompt({ name: 'we`ird\nname', tasks: [task('flowbro', 'T1', 'A | B\n`code` "q"')] }, projects);
    expect(p).toContain('Message for agent we`ird name.');
    expect(p).toContain('- T1: A | B `code` "q" (doing)');
    expect(() => agentPrompt(null as never, null as never)).not.toThrow();
  });
});

describe('oneLine', () => {
  it('collapses whitespace and control characters', () => {
    expect(oneLine('a\r\n\tb\u0000c  d')).toBe('a b c d');
    expect(oneLine(undefined)).toBe('');
  });
});
