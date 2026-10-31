// 发送出口（tools/execute → 语音条）的行为测试：不出网、不碰真实桥接。
// 用一个最小的 ctx 假件把 index.js 的 apply() 跑起来，只验证「接管哪些调用」，
// 以及合成失败时绝不谎报成功。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qzd-voice-'));
fs.mkdirSync(path.join(root, 'state'), { recursive: true });
fs.writeFileSync(path.join(root, 'config.json'), JSON.stringify({ consolePort: 3199, socialV2: { mode: 'reserved2', voice: { enabled: true, dir: 'audio' }, tools: { sendVoice: true } } }));
fs.writeFileSync(path.join(root, 'state', 'sessions.json'), JSON.stringify({ sessions: { 'private:1': 'session-a', 'private:2': 'session-b' } }));
fs.writeFileSync(path.join(root, 'state', 'console-token'), 'ct');
fs.writeFileSync(path.join(root, 'state', 'social-v2.json'), JSON.stringify({ conversations: { 'private:1': { agentToken: 'tok-a' } } }));

const handlers = new Map();
const ctx = {
  logger: { info() {}, warn() {}, error() {} },
  effect(fn) { const d = fn(); return () => (typeof d === 'function' ? d() : undefined); },
  on(name, fn) { handlers.set(name, [...(handlers.get(name) ?? []), fn]); return () => { const l = handlers.get(name) ?? []; handlers.set(name, l.filter(f => f !== fn)); }; },
  webServer: { register() {} },
  tools: { register() {}, execute: async () => ({}) },
  agents: { get() {}, list: () => [], inject() {} },
  sessions: { get() {} },
  sessionTitle: { of: () => '' },
  llm: {},
  agentDefaultModel: { currentSelection: () => ({ provider: 'x', model: 'y' }) },
};

const mod = await import('./index.js');

/** 换个发送方式来测；chance 用来验证「AI 自决」不受概率影响。 */
const applyAs = (mode, chance) => {
  mod.apply(ctx, {
    bridgeRoot: root, voiceEnabled: true, voiceDryRun: false, voiceMode: mode, voiceChance: chance,
    voiceApiKey: 'bad-key', voiceVoiceId: 'voc_test', voiceTargetSessions: ['session-a'],
  });
  // 本插件把配置原样落盘（含 cordis 里传进来的值），每次 apply 等于重开一个实例：
  // 先把上一轮写下的 state 清掉，免得这次的 voiceMode 被上一轮的 auto 挡掉。
  fs.rmSync(path.join(root, 'state', 'qzone-diary-config.json'), { force: true });
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

// —— AI 自决：正文带 [[语音]] 就一定发，跟概率、发送方式都无关 ——
const withMarker = (mode, chance) => applyAs(mode, chance);

test('self 模式：没记号 → 打字', async () => {
  const runSelf = withMarker('self', 100);
  const [next, was] = passed();
  // 按住随机数，确保「概率 100% 掷中」这条路径也被走过（self 模式下它必须被忽略）
  const realRandom = Math.random;
  Math.random = () => 0;
  try {
    await runSelf({ name: 'qq_send_message', agent: { id: 'session-a' }, arguments: { key: 'private:1', message: '在的' } }, next);
  } finally { Math.random = realRandom; }
  assert.equal(was(), true, '没记号就该原样发文字，哪怕概率 100%');
});

test('概率 0 也拦不住 [[语音]]：接管并走合成（合成失败=isError，不发文字）', async () => {
  for (const mode of ['auto', 'self', 'after']) {
    const runIt = withMarker(mode, 0);
    const [next, was] = passed();
    const r = await runIt({ name: 'qq_send_message', agent: { id: 'session-a' }, arguments: { key: 'private:1', message: '[[语音]] 我来了' } }, next);
    assert.equal(was(), false, `${mode}：带记号不能放行成文字`);
    assert.equal(r.isError, true, `${mode}：合成失败要报错`);
    assert.match(String(r.content[0].text), /失败/);
  }
});

test('带记号的正文超过字数上限：不发语音，也不和文字重复发', async () => {
  const runSelf = withMarker('self', 50);
  const [next, was] = passed();
  const long = '[[语音]] ' + '很长的句子'.repeat(120);
  await runSelf({ name: 'qq_send_message', agent: { id: 'session-a' }, arguments: { key: 'private:1', message: long } }, next);
  assert.equal(was(), true, '内容不适合念就退回文字');
});
