// 离线单元测试：只测纯函数，不碰网络和磁盘。
// 跑：node --test tts.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSpeechBody, cleanForSpeech, describeError, MAX_TEXT_CHARS } from './tts.js';
import { composeInstructions, rollVoice } from './index.js';

test('buildSpeechBody：只带用户真填了的字段', () => {
  const { body, warnings } = buildSpeechBody({ speed: 3, guidanceScale: 0.2, useSpeakerBoost: true }, '你好');
  assert.equal(body.text, '你好');
  assert.equal(body.speed, undefined);            // 语速在 voice_settings 里
  assert.deepEqual(body.voice_settings, { speed: 2, guidance_scale: 1, use_speaker_boost: true });
  assert.equal(body.model_id, undefined);         // 留空 = 自动
  assert.equal(body.language_code, undefined);
  assert.deepEqual(warnings, []);
});

test('buildSpeechBody：语言代码不合法只警告、不拦', () => {
  const { body, warnings } = buildSpeechBody({ languageCode: 'zh-CN' }, 'hi');
  assert.equal(body.language_code, undefined);
  assert.equal(warnings.length, 1);
});

test('buildSpeechBody：合法语言代码要小写两位', () => {
  const { body } = buildSpeechBody({ languageCode: 'ZH', modelId: ' m1 ' }, 'hi');
  assert.equal(body.language_code, 'zh');
  assert.equal(body.model_id, 'm1');
});

test('cleanForSpeech：抹掉 markdown / 链接 / @ / 表情标签', () => {
  const out = cleanForSpeech('**你好**啊 [doge]\n- 第一点\n> 引用\n见 https://x.y/z 和 `code` @张三');
  assert.ok(!out.includes('*'));
  assert.ok(!out.includes('https://'));
  assert.ok(!out.includes('@'));
  assert.ok(!out.includes('[doge]'));
  assert.ok(out.includes('你好'));
  assert.ok(out.includes('第一点'));
});

test('cleanForSpeech：全空的东西洗完也是空', () => {
  assert.equal(cleanForSpeech('```\ncode\n```\nhttps://a.b'), '');
  assert.ok(MAX_TEXT_CHARS >= 1000);
});

test('describeError：JSON 错误体抠一句话', () => {
  assert.equal(describeError('{"detail":"voice not found"}'), 'voice not found');
  assert.equal(describeError('{"error":{"message":"bad key"}}'), 'bad key');
  assert.equal(describeError('<html><body>502 Bad Gateway</body></html>'), '502 Bad Gateway');
  assert.equal(describeError(''), '');
});

test('composeInstructions：默认指令 → 风格 → 这一条', () => {
  const text = composeInstructions({ voiceInstructions: '自然说话', voiceStyleProfile: '句子短' }, '压低声音');
  assert.ok(text.indexOf('自然说话') < text.indexOf('句子短'));
  assert.ok(text.indexOf('句子短') < text.indexOf('压低声音'));
  assert.equal(composeInstructions({}, ''), '');
});

test('rollVoice：开关/密钥/音色缺一个都不掷', () => {
  const base = { voiceEnabled: true, voiceApiKey: 'k', voiceVoiceId: 'v', voiceChance: 50 };
  assert.equal(rollVoice({ ...base, voiceEnabled: false }).speak, false);
  assert.equal(rollVoice({ ...base, voiceApiKey: '' }).speak, false);
  assert.equal(rollVoice({ ...base, voiceVoiceId: ' ' }).speak, false);
});

test('rollVoice：概率边界', () => {
  const base = { voiceEnabled: true, voiceApiKey: 'k', voiceVoiceId: 'v' };
  assert.equal(rollVoice({ ...base, voiceChance: 0 }, () => 0).speak, false);
  assert.equal(rollVoice({ ...base, voiceChance: 100 }, () => 0.999).speak, true);
  assert.equal(rollVoice({ ...base, voiceChance: 30 }, () => 0.29).speak, true);
  assert.equal(rollVoice({ ...base, voiceChance: 30 }, () => 0.31).speak, false);
});
