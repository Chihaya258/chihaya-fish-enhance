// 离线单元测试：只测纯函数，不碰网络和磁盘。
// 跑：node --test tts.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSpeechBody, cleanForSpeech, describeError, MAX_TEXT_CHARS } from './tts.js';
import { extractSpeakMarker, composeInstructions, rollVoice } from './index.js';

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

test('extractSpeakMarker：没有记号就是普通文字', () => {
  const r = extractSpeakMarker('今天天气不错');
  assert.equal(r.speak, false);
  assert.equal(r.text, '今天天气不错');
});

test('extractSpeakMarker：[[语音]] 摘掉并标记', () => {
  const r = extractSpeakMarker('[[语音]] 我来了');
  assert.equal(r.speak, true);
  assert.equal(r.hint, '');
  assert.equal(r.text, '我来了');
});

test('extractSpeakMarker：带临时风格', () => {
  const r = extractSpeakMarker('[[语音·小声嘀咕]] 别告诉他');
  assert.equal(r.speak, true);
  assert.equal(r.hint, '小声嘀咕');
  assert.equal(r.text, '别告诉他');
});

test('extractSpeakMarker：只认一个记号，正文里的方括号不受影响', () => {
  const r = extractSpeakMarker('好的[[语音]] 顺便说 [备注] 这句留着');
  assert.equal(r.speak, true);
  assert.ok(r.text.includes('[备注]'));
});

test('extractSpeakMarker：全角方括号/【】也认', () => {
  for (const s of ['［［语音］］ 在的', '【语音】在的', '[[聲音]] 在的']) {
    const r = extractSpeakMarker(s);
    assert.equal(r.speak, true, s);
    assert.equal(r.text, '在的', s);
  }
});

test('extractSpeakMarker：[[语音：温柔]] 用冒号写语气', () => {
  const r = extractSpeakMarker('[[语音：带着睡意的撒娇]] 再睡五分钟');
  assert.equal(r.speak, true);
  assert.equal(r.hint, '带着睡意的撒娇');
  assert.equal(r.text, '再睡五分钟');
});

test('extractSpeakMarker：英文/小写写法兜底，正文里出现「语音」两个字不会被误判', () => {
  assert.equal(extractSpeakMarker('[voice] hi').speak, true);
  assert.equal(extractSpeakMarker('[语音转文字] 这个功能不错').speak, false);
  assert.equal(extractSpeakMarker('我发条语音给你').speak, false);
});

test('extractSpeakMarker：记号在中间也摘掉，只剩记号时正文为空', () => {
  assert.equal(extractSpeakMarker('先这样 [[语音]] 晚点聊').text, '先这样 晚点聊');
  const only = extractSpeakMarker('[[语音]]');
  assert.equal(only.speak, true);
  assert.equal(only.text, '');
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
