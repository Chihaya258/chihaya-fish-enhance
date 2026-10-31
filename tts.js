// Breeze Blue 语音合成适配器
// 官方文档：https://docs.breezeblue.ai/guides/text-to-speech
//   合成：POST {base}/text-to-speech/{voice_id}?output_format=wav  → WAV 二进制
//   鉴权：请求头 xi-api-key
// 正文 text / model_id / language_code / instructions / voice_settings{speed,guidance_scale,use_speaker_boost}
//
// 这个模块不做任何 IO 之外的决策：不重试、不截断（付费请求，调用方自己决定要不要发）。

export const DEFAULT_BASE = 'https://api.breeze.blue/v1';
/** Breeze 单次合成的字数上限：默认账户 1000 字，获批账户 2000 字。超出直接报错，不截断。 */
export const MAX_TEXT_CHARS = 1000;

function cleanBase(base) {
  return String(base || DEFAULT_BASE).trim().replace(/\/+$/, '') || DEFAULT_BASE;
}

/**
 * 把设置拼成 Breeze 的请求正文。导出出来是为了离线测试。
 * @returns {{body: object, warnings: string[]}}
 */
export function buildSpeechBody(settings, text) {
  const warnings = [];
  const body = { text: String(text ?? '') };

  const model = String(settings?.modelId ?? settings?.model ?? '').trim();
  if (model) body.model_id = model; // 省略 model_id = 由 Breeze 自动选模型

  const lang = String(settings?.languageCode ?? '').trim().toLowerCase();
  if (/^[a-z]{2}$/.test(lang)) body.language_code = lang;
  else if (lang) warnings.push(`语言代码「${lang}」不是两位 ISO 代码，已忽略（不会拦截合成）`);

  const instructions = String(settings?.instructions ?? '').trim();
  if (instructions) body.instructions = instructions;

  const voice = {};
  const speed = Number(settings?.speed);
  if (Number.isFinite(speed) && speed > 0) voice.speed = Math.max(0.5, Math.min(2, speed));
  const guidance = Number(settings?.guidanceScale);
  if (Number.isFinite(guidance) && guidance > 0) voice.guidance_scale = Math.max(1, Math.min(10, guidance));
  if (settings?.useSpeakerBoost === true) voice.use_speaker_boost = true;
  if (Object.keys(voice).length) body.voice_settings = voice;

  return { body, warnings };
}

/**
 * 合成一段语音，返回 WAV 的 Buffer。
 * 抛出的错误信息尽量只有一句人话，方便直接显示在设置页上。
 */
export async function requestSpeech(settings, text, signal) {
  const speak = String(text ?? '').trim();
  if (!speak) throw new Error('要合成的话是空的。');
  const chars = [...speak].length;
  if (chars > MAX_TEXT_CHARS) throw new Error(`这段要读的话有 ${chars} 字，超过 Breeze 单次上限 ${MAX_TEXT_CHARS} 字，已放弃这条语音（不截断）。`);

  const base = cleanBase(settings?.apiBase ?? settings?.base);
  const voiceId = String(settings?.voiceId ?? '').trim();
  if (!voiceId) throw new Error('还没填音色 ID（voice_id），请到 Breeze 控制台或 GET /v1/voices 取一个。');
  const key = String(settings?.apiKey ?? '').trim();
  if (!key) throw new Error('还没填 Breeze Blue 密钥（xi-api-key）。');

  const { body } = buildSpeechBody(settings, speak);
  const url = `${base}/text-to-speech/${encodeURIComponent(voiceId)}?output_format=wav`;
  const timeout = AbortSignal.timeout(120000);
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'xi-api-key': key },
    body: JSON.stringify(body),
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });

  if (!resp.ok) {
    const raw = await resp.text().catch(() => '');
    throw new Error(`Breeze 合成失败（HTTP ${resp.status}）：${describeError(raw) || '没有返回说明'}`);
  }

  const buf = Buffer.from(await resp.arrayBuffer());
  if (!buf.length) throw new Error('Breeze 返回的音频是空的。');
  const type = String(resp.headers.get('content-type') || '').toLowerCase();
  if (type && !/audio|octet-stream|wav/.test(type)) {
    throw new Error(`Breeze 返回的不是音频（content-type: ${type}）。`);
  }
  return { buffer: buf, bytes: buf.length, chars, model: body.model_id || 'auto' };
}

/** 从各种错误体里抠出一句能看懂的说明。 */
export function describeError(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  try {
    const j = JSON.parse(s);
    const msg = j?.message ?? j?.error?.message ?? j?.error ?? j?.detail;
    if (typeof msg === 'string' && msg.trim()) return msg.trim().slice(0, 300);
    if (Array.isArray(j?.detail) && j.detail[0]) return String(j.detail[0]?.msg ?? '').slice(0, 300);
  } catch { /* 不是 JSON 就原样截断 */ }
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
}

/**
 * 把一段要读的文字洗干净：去掉 markdown、链接、表情标签、@ 之类不适合念出来的东西。
 */
export function cleanForSpeech(text) {
  let s = String(text || '');
  s = s.replace(/```[\s\S]*?```/g, '');
  s = s.replace(/`([^`]*)`/g, '$1');
  s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  s = s.replace(/\[([^\]]*)\]\(([^)]*)\)/g, '$1');
  s = s.replace(/https?:\/\/\S+/g, '');
  s = s.replace(/^\s{0,3}#{1,6}\s*/gm, '');
  s = s.replace(/^\s*[-*+]\s+/gm, '');
  s = s.replace(/^\s*>\s*/gm, '');
  s = s.replace(/[*_~]{1,3}/g, '');
  s = s.replace(/@\S+/g, '');
  s = s.replace(/\[[^\]\n]{1,12}\]/g, ''); // [doge] 这类表情标签
  s = s.replace(/[ \t]+/g, ' ');
  s = s.replace(/\n{2,}/g, '\n');
  return s.trim();
}
