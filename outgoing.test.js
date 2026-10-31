// 发送出口（tools/execute → 语音条）的行为测试：不出网、不碰真实桥接。
// 用一个最小的 ctx 假件把 index.js 的 apply() 跑起来，只验证「接管哪些调用」，
// 以及合成失败时绝不谎报成功。
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

const realFetch = globalThis.fetch;
let requests = [];
globalThis.fetch = async (...args) => { requests.push(args); throw new Error('mock synthesis failure'); };
after(() => { globalThis.fetch = realFetch; });

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qzd-voice-'));
fs.mkdirSync(path.join(root, 'state'), { recursive: true });
fs.writeFileSync(path.join(root, 'config.json'), JSON.stringify({ consolePort: 3199, socialV2: { mode: 'reserved2', voice: { enabled: true, dir: 'audio' }, tools: { sendVoice: true } } }));
fs.writeFileSync(path.join(root, 'state', 'sessions.json'), JSON.stringify({ sessions: { 'private:1': 'session-a', 'private:2': 'session-b' } }));
fs.writeFileSync(path.join(root, 'state', 'console-token'), 'ct');
fs.writeFileSync(path.join(root, 'state', 'social-v2.json'), JSON.stringify({ conversations: { 'private:1': { agentToken: 'tok-a' } } }));

const handlers = new Map();
const definitions = new Map();
const ctx = {
  logger: { info() {}, warn() {}, error() {} },
  effect(fn) { const d = fn(); return () => (typeof d === 'function' ? d() : undefined); },
  on(name, fn) { handlers.set(name, [...(handlers.get(name) ?? []), fn]); return () => { const l = handlers.get(name) ?? []; handlers.set(name, l.filter(f => f !== fn)); }; },
  webServer: { register(route) { this.route = route; } },
  tools: { register(def) { definitions.set(def.name, def); return () => definitions.delete(def.name); }, execute: async () => ({}) },
  agents: { get() {}, list: () => [], inject() {} },
  sessions: { get() {} },
  sessionTitle: { of: () => '' },
  llm: {},
  agentDefaultModel: { currentSelection: () => ({ provider: 'x', model: 'y' }) },
};

const mod = await import('./index.js');

/** 换个发送方式/概率来测。 */
const applyAs = (mode, chance) => {
  fs.rmSync(path.join(root, 'state', 'fish-enhance-config.json'), { force: true });
  mod.apply(ctx, {
    bridgeRoot: root, voiceEnabled: true, voiceDryRun: false, voiceMode: mode, voiceChance: chance,
    voiceApiKey: 'bad-key', voiceVoiceId: 'voc_test', voiceTargetSessions: ['session-a'],
  });
  // 本插件把配置原样落盘（含 cordis 里传进来的值），每次 apply 等于重开一个实例：
  // 先把上一轮写下的 state 清掉，免得这次的 voiceMode 被上一轮的 auto 挡掉。
  fs.rmSync(path.join(root, 'state', 'fish-enhance-config.json'), { force: true });
  // 每次 apply 都会再挂一个钩子，老钩子（dispose 没被 ctx.effect 调过）还在数组里，
  // 所以取最新的那个——也就是本次 apply 挂上的。
  const hook = (handlers.get('tools/execute') ?? []).at(-1);
  assert.ok(hook, `要挂上发送出口（${mode}）`);
  return (exec, next) => hook(exec, next);
};

const run = applyAs('auto', 100);
const passed = () => { let hit = false; const next = (v) => { hit = true; return v; }; return [next, () => hit]; };

test('不在生效范围里的会话：原样放行', async () => {
  const [next, was] = passed();
  await run({ name: 'qq_send_message', agent: { id: 'session-b' }, arguments: { key: 'private:2', message: 'hi' } }, next);
  assert.equal(was(), true);
});

test('不是发送工具的调用：原样放行', async () => {
  const [next, was] = passed();
  await run({ name: 'qq_get_recent_messages', agent: { id: 'session-a' }, arguments: { key: 'private:1' } }, next);
  assert.equal(was(), true);
});

test('key 和会话对不上：原样放行', async () => {
  const [next, was] = passed();
  await run({ name: 'qq_send_message', agent: { id: 'session-a' }, arguments: { key: 'private:9', message: 'hi' } }, next);
  assert.equal(was(), true);
});

test('合成失败：返回 isError，绝不谎报成功也不悄悄发文字', async () => {
  const [next, was] = passed();
  const r = await run({ name: 'qq_send_message', agent: { id: 'session-a' }, arguments: { key: 'private:1', message: '在干嘛' }, signal: undefined }, next);
  assert.equal(was(), false, '不能放行成文字');
  assert.equal(r.isError, true);
  assert.match(String(r.content[0].text), /失败/);
});

test('空正文：原样放行', async () => {
  const [next, was] = passed();
  await run({ name: 'qq_send_message', agent: { id: 'session-a' }, arguments: { key: 'private:1', message: '   ' } }, next);
  assert.equal(was(), true);
});

test('概率 0 无记号：仍按概率放行文字', async () => {
  const runIt = applyAs('auto', 0);
  const [next, was] = passed();
  await runIt({ name: 'qq_send_message', agent: { id: 'session-a' }, arguments: { key: 'private:1', message: '在的' } }, next);
  assert.equal(was(), true);
});

test('概率 100 无记号：仍接管合成', async () => {
  const runIt = applyAs('auto', 100);
  const [next, was] = passed();
  const r = await runIt({ name: 'qq_send_message', agent: { id: 'session-a' }, arguments: { key: 'private:1', message: '在的' } }, next);
  assert.equal(was(), false);
  assert.equal(r.isError, true);
});

test('总开关关闭：不提示语音且不绕过总闸', async () => {
  applyAs('auto', 0);
  fs.rmSync(path.join(root, 'state', 'fish-enhance-config.json'), { force: true });
  mod.apply(ctx, { bridgeRoot: root, voiceEnabled: false, voiceApiKey: 'bad-key', voiceVoiceId: 'voc_test' });
  const original = { kind: 'enter', messages: [] };
  const r = await handlers.get('agent/pre-step').at(-1)({ agent: { id: 'session-a' }, turn: 6 }, async () => original);
  assert.equal(r, original);
  const [next, was] = passed();
  await handlers.get('tools/execute').at(-1)({ name: 'qq_send_message', agent: { id: 'session-a' }, arguments: { key: 'private:1', message: '在的' } }, next);
  assert.equal(was(), true);
});

test('掷中：接管合成并发送，只发一条语音', async () => {
  const runIt = applyAs('auto', 100);
  const failFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, opts) => {
    calls.push({ url: String(url), body: JSON.parse(opts.body) });
    if (String(url).includes('/text-to-speech/')) return new Response(Buffer.from('RIFF-mock-audio'));
    return Response.json({ ok: true, verified: true, messageId: 789 });
  };
  try {
    const [next, was] = passed();
    const r = await runIt({ name: 'qq_send_message', agent: { id: 'session-a' }, arguments: { key: 'private:1', message: '在的' } }, next);
    assert.equal(was(), false);
    assert.equal(r.isError, false);
    const result = JSON.parse(r.value.content[0].text);
    assert.equal(result.delivery, 'voice');
    assert.equal(result.verified, true);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].body.text, '在的');
  } finally { globalThis.fetch = failFetch; }
});

test('测试发送均经过 mock，不请求真实 API', () => { assert.ok(requests.length > 0); });

test('旧 self 模式值在新配置文件内规范化到 auto', () => {
  fs.writeFileSync(path.join(root, 'state', 'fish-enhance-config.json'), JSON.stringify({ voiceMode: 'self', voiceChance: 23 }));
  mod.apply(ctx, { bridgeRoot: root });
  const cfg = JSON.parse(fs.readFileSync(path.join(root, 'state', 'fish-enhance-config.json')));
  assert.equal(cfg.voiceMode, 'auto');
  assert.equal(cfg.voiceChance, 23);
});


const patchLiveConfig = async (patch) => {
  const req = Readable.from([JSON.stringify(patch)]);
  req.method = 'POST'; req.url = '/api/qzone-diary/config';
  let status;
  await ctx.webServer.route.handler(req, { writeHead(code) { status = code; }, end() {} });
  assert.equal(status, 200);
};

test('100改10后发送出口立即按10重新判定，不复用旧命中', async () => {
  const runIt = applyAs('auto', 100);
  const pre = handlers.get('agent/pre-step').at(-1);
  await pre({ agent: { id: 'session-a' }, turn: 50 }, async () => ({ kind: 'enter', messages: [] }));
  await patchLiveConfig({ voiceChance: 10 });
  const old = Math.random; Math.random = () => 0.9;
  try {
    const [next, was] = passed();
    await runIt({ name: 'qq_send_message', agent: { id: 'session-a' }, arguments: { key: 'private:1', message: '普通文字' } }, next);
    assert.equal(was(), true);
  } finally { Math.random = old; }
});

test('同一turn的新QQ来信重掷，语音提示注入不重复掷骰', async () => {
  const runIt = applyAs('auto', 10);
  const pre = handlers.get('agent/pre-step').at(-1);
  const event = handlers.get('session/event').filter(fn => fn.name === 'voiceEventHandler').at(-1);
  assert.ok(event);
  const old = Math.random; let count = 0;
  Math.random = () => (++count === 1 ? 0.01 : 0.9);
  try {
    const payload = { agent: { id: 'session-a' }, turn: 60 };
    await pre(payload, async () => ({ kind: 'enter', messages: [] }));
    event({ id: 'session-a' }, { type: 'user/message', data: { source: { kind: 'voice-chat' } } });
    await pre(payload, async () => ({ kind: 'enter', messages: [] }));
    assert.equal(count, 1);
    event({ id: 'session-a' }, { type: 'user/message', data: { source: { kind: 'user' } } });
    await pre(payload, async () => ({ kind: 'enter', messages: [] }));
    assert.equal(count, 2);
    const [next, was] = passed();
    await runIt({ name: 'qq_send_message', agent: { id: 'session-a' }, arguments: { key: 'private:1', message: '第二次回复' } }, next);
    assert.equal(was(), true);
  } finally { Math.random = old; }
});
