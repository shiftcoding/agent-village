import { describe, expect, it } from 'vitest';
import { loadVillage, parseNowParam } from './loader';
import { parseWallTime } from './time';

describe('loadVillage', () => {
  it('loads both v1 projects', () => {
    const v = loadVillage();
    expect(v.projects.map((p) => p.id)).toEqual(['flowbro', 'agent-village']);
    expect(v.projects[0]?.plot).toBe('ok');
    expect(v.projects[0]?.progress?.overall).toBe(22);
    expect(v.projects[0]?.userTests).toHaveLength(1);
    expect(v.projects[0]?.findings).toHaveLength(2);
    expect(v.agents).toHaveLength(21);
  });
});

describe('parseNowParam', () => {
  it('parses ?now=', () => {
    expect(parseNowParam('?now=2026-11-28T09:00', 'Europe/Amsterdam')).toBe(parseWallTime('2026-11-28 09:00', 'Europe/Amsterdam'));
  });
  it('returns null otherwise', () => {
    expect(parseNowParam('', 'Europe/Amsterdam')).toBeNull();
    expect(parseNowParam('?now=yesterday', 'Europe/Amsterdam')).toBeNull();
  });
});
