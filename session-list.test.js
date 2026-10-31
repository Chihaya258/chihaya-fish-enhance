import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function makeResponse() {
  return {
    status: 0,
    body: '',
    writeHead(status) { this.status = status; },
    end(body) { this.body = String(body || ''); },
  };
}

function makeHarness() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qzd-session-list-'));
  fs.mkdirSync(path.join(root, 'state'), { recursive: true });
  fs.writeFileSync(path.join(root, 'config.json'), JSON.stringify({
    consolePort: 3199,
    socialV2: { mode: 'reserved2', voice: { enabled: true }, tools: {} },
  }));
  fs.writeFileSync(path.join(root, 'state', 'sessions.json'), JSON.stringify({
    sessions: { 'private:1': 'session-a', 'private:2': 'session-b', 'private:3': 'session-c' },
  }));
  fs.writeFileSync(path.join(root, 'state', 'console-token'), 'ct');
  fs.writeFileSync(path.join(root, 'state', 'social-v2.json'), JSON.stringify({ conversations: {} }));

  const routes = [];
  const sessions = { list: () => [{ id: 'session-a' }, { id: 'session-c' }] };
  const registry = { archivedSessionIds: ['session-c'] };
  const ctx = {
    logger: { info() {}, warn() {}, error() {} },
    effect(fn) { const dispose = fn(); return () => (typeof dispose === 'function' ? dispose() : undefined); },
    on() { return () => {}; },
    webServer: { register(route) { routes.push(route); } },
    tools: { register() { return () => {}; }, execute: async () => ({}) },
    agents: { list: () => [{ id: 'session-b' }] },
    sessions,
    sessionTitle: { of: () => '' },
    workspaceRegistry: registry,
    get(name) { return name === 'sessions' ? sessions : name === 'workspaceRegistry' ? registry : undefined; },
    llm: {},
    agentDefaultModel: { currentSelection: () => ({ provider: 'x', model: 'y' }) },
  };
  return { root, ctx, routes };
}

const { apply } = await import('./index.js');

test('session pickers only expose current, non-archived workspace sessions', async () => {
  const { root, ctx, routes } = makeHarness();
  apply(ctx, { bridgeRoot: root, proactiveTargetSessions: ['session-b'], voiceTargetSessions: [] });
  const route = routes.at(-1);
  assert.ok(route);

  const proactiveRes = makeResponse();
  await route.handler({ method: 'GET', url: '/api/qzone-diary/proactive-sessions' }, proactiveRes);
  const proactive = JSON.parse(proactiveRes.body).sessions;
  assert.deepEqual(proactive.map(s => s.id), ['session-a']);
  assert.equal(proactive[0].archived, false);

  const voiceRes = makeResponse();
  await route.handler({ method: 'GET', url: '/api/qzone-diary/voice/sessions' }, voiceRes);
  const voice = JSON.parse(voiceRes.body).sessions;
  assert.deepEqual(voice.map(s => s.id), ['session-a']);
});
