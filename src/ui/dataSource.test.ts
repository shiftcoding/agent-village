import { describe, expect, it } from 'vitest';
import type { Village } from '../data/types';
import { VILLAGE_FILE_FORMAT } from '../data/villageFile';
import { MISSING_TEXT, fixturesState, nextDataState, sourceKey, sourceLine, transitionMessage, type DataEnv } from './dataSource';

function village(tag: string): Village {
  return { generatedAt: '2026-11-13T10:00:00.000Z', xpEnabled: false, timezone: 'Europe/Amsterdam', xpSource: 'snapshot', xpSince: null, pipeline: [], projects: [], agents: [], needsYou: [], questBoard: [], chronicle: [], weeklyTally: [], warnings: [tag] };
}
const env: DataEnv = { nowFor: () => null, fixtures: () => village('fixtures') };

function fileText(generatedAt: string, tag = 'live'): string {
  return JSON.stringify({
    format: VILLAGE_FILE_FORMAT,
    generatedAt,
    village: { ...village(tag), generatedAt },
    inputs: { config: { timezone: 'Europe/Amsterdam', xpEnabled: false, projects: [] }, installedAgents: null, sources: {}, loadWarnings: [] },
  });
}

describe('nextDataState', () => {
  it('missing file: fixtures and a not-found notice', () => {
    const s = nextDataState(null, { kind: 'missing' }, env);
    expect(s.source).toBe('fixtures');
    expect(s.notice).toEqual({ kind: 'fallback', text: MISSING_TEXT });
    expect(sourceLine(s)).toBe('Bundled sample data (fixtures)');
  });
  it('dev-server index.html answer counts as missing', () => {
    expect(nextDataState(null, { kind: 'ok', text: '<!doctype html><html>' }, env).notice?.text).toBe(MISSING_TEXT);
  });
  it('invalid json: fixtures and the reason', () => {
    const s = nextDataState(null, { kind: 'ok', text: '{nope' }, env);
    expect(s.source).toBe('fixtures');
    expect(s.notice?.text).toContain('not valid JSON');
    const t = nextDataState(null, { kind: 'ok', text: '{"format":"x"}' }, env);
    expect(t.notice?.text).toContain('unknown format');
  });
  it('network error: fixtures with the message', () => {
    expect(nextDataState(null, { kind: 'error', message: 'boom' }, env).notice?.text).toContain('boom');
  });
  it('valid: live, no notice, time line in Amsterdam', () => {
    const s = nextDataState(null, { kind: 'ok', text: fileText('2026-11-13T10:05:00.000Z') }, env);
    expect(s.source).toBe('live');
    expect(s.notice).toBeNull();
    expect(sourceLine(s)).toBe('Live data from npm run sync, updated 11:05');
  });
  it('unchanged content returns the same object', () => {
    const t = fileText('2026-11-13T10:05:00.000Z');
    const a = nextDataState(null, { kind: 'ok', text: t }, env);
    expect(nextDataState(a, { kind: 'ok', text: t }, env)).toBe(a);
    const f = nextDataState(null, { kind: 'missing' }, env);
    expect(nextDataState(f, { kind: 'missing' }, env)).toBe(f);
  });
  it('valid then invalid keeps the last good data with a stale notice, then recovers', () => {
    const t = fileText('2026-11-13T10:05:00.000Z');
    const a = nextDataState(null, { kind: 'ok', text: t }, env);
    const b = nextDataState(a, { kind: 'ok', text: '{broken' }, env);
    expect(b.source).toBe('live');
    expect(b.village).toBe(a.village);
    expect(b.notice?.kind).toBe('stale');
    expect(nextDataState(b, { kind: 'ok', text: '{broken' }, env)).toBe(b);
    expect(nextDataState(b, { kind: 'missing' }, env).village).toBe(a.village);
    const c = nextDataState(b, { kind: 'ok', text: t }, env);
    expect(c.notice).toBeNull();
    expect(c.village).toBe(a.village);
    const d = nextDataState(c, { kind: 'ok', text: fileText('2026-11-13T10:06:00.000Z') }, env);
    expect(d.village).not.toBe(a.village);
  });
  it('fixtures recover to live when the file turns valid', () => {
    const f = nextDataState(null, { kind: 'missing' }, env);
    expect(nextDataState(f, { kind: 'ok', text: fileText('2026-11-13T10:05:00.000Z') }, env).source).toBe('live');
  });
  it('forced fixtures have no notice', () => {
    expect(fixturesState(env, null).notice).toBeNull();
  });
});

describe('transitionMessage', () => {
  it('announces only changes, never the first state', () => {
    expect(transitionMessage(null, 'fixtures')).toBeNull();
    expect(transitionMessage('live', 'live')).toBeNull();
    expect(transitionMessage('live', 'stale')).toContain('lost');
    expect(transitionMessage('live', 'fixtures')).toContain('sample');
    expect(transitionMessage('stale', 'live')).toContain('restored');
    expect(transitionMessage('fixtures', 'live')).toContain('now available');
    expect(sourceKey(fixturesState(env, null))).toBe('fixtures');
  });
});
