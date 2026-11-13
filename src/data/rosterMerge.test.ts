import { describe, expect, it } from 'vitest';
import { resolveRoster } from './rosterMerge';

describe('resolveRoster model', () => {
  it('takes the model from the installed file, not the spec table', () => {
    const { roster } = resolveRoster([{ name: 'react-specialist', model: 'sonnet' }]);
    expect(roster[0]?.model).toBe('Sonnet');
    expect(roster[0]?.villageClass).toBe('enchanter');
  });

  it('shows Inherits when the file has no model line or says inherit', () => {
    const { roster } = resolveRoster([{ name: 'orchestrator' }, { name: 'some-new-agent', model: 'inherit' }]);
    expect(roster.map((a) => a.model)).toEqual(['Inherits', 'Inherits']);
  });
});
