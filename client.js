window.__ModuleLoader__.load({
  id: 'chihaya-fish-enhance',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const API = '/api/qzone-diary';
    const asJson = async (res) => {
      if (res.ok) return res.json();
      throw new Error('HTTP ' + res.status);
    };
    const jget = async (p) => asJson(await fetch(API + p, { credentials: 'same-origin' }));
    const jpost = async (p, body) => asJson(await fetch(API + p, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body || {}),
    }));

    const CSS = `
[data-qzd-page]{display:flex;flex-direction:column;gap:14px;padding:2px 2px 8px;max-width:680px;}
[data-qzd-card]{display:flex;flex-direction:column;gap:10px;padding:18px 16px;border-radius:12px;
  border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.12));
  background:var(--dsw-alias-bg-overlay,rgba(128,128,128,.06));}
[data-qzd-card-title]{font-size:18px;font-weight:600;line-height:1.4;margin-bottom:2px;}
[data-qzd-para]{font-size:13.5px;line-height:1.75;color:var(--dsw-alias-label-secondary,#c9ccd1);}
[data-qzd-hint]{font-size:12.5px;line-height:1.7;color:var(--dsw-alias-label-tertiary,#9aa0a6);}
[data-qzd-warn]{font-size:12.5px;line-height:1.7;color:#e05252;}
[data-qzd-ok]{font-size:12.5px;line-height:1.7;color:#22a06b;}
[data-qzd-field]{display:flex;flex-direction:column;gap:7px;}
[data-qzd-flabel]{font-size:14.5px;font-weight:500;line-height:1.5;}
[data-qzd-inline]{display:flex;align-items:center;flex-wrap:wrap;gap:8px;}
[data-qzd-unit]{font-size:12.5px;color:var(--dsw-alias-label-tertiary,#9aa0a6);}
[data-qzd-summary]{font-size:13px;line-height:1.7;padding:10px 12px;border-radius:9px;
  background:var(--dsw-alias-bg-overlay,rgba(128,128,128,.1));}
[data-qzd-sec]{display:flex;flex-direction:column;gap:8px;}
[data-qzd-h]{font-size:11px;font-weight:600;letter-spacing:.04em;color:var(--dsw-alias-label-tertiary,#9aa0a6);}
[data-qzd-row]{display:flex;align-items:center;gap:10px;}
[data-qzd-grow]{flex:1;min-width:0;}
[data-qzd-label]{font-size:13px;}
[data-qzd-note]{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary,#9aa0a6);}
[data-qzd-sub]{margin-left:14px;padding-left:12px;border-left:2px solid var(--dsw-alias-border-l2,rgba(255,255,255,.1));display:flex;flex-direction:column;gap:10px;}
[data-qzd-badge]{font-size:11px;padding:2px 7px;border-radius:6px;
  background:var(--dsw-alias-bg-overlay,rgba(128,128,128,.14));color:var(--dsw-alias-label-secondary,#c9ccd1);}
[data-qzd-sw]{flex:none;width:38px;height:22px;border-radius:11px;border:0;cursor:pointer;position:relative;
  background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.35));transition:background .15s;padding:0;}
[data-qzd-sw][data-on]{background:#3b82f6;}
[data-qzd-sw] i{position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .15s;display:block;}
[data-qzd-sw][data-on] i{left:19px;}
[data-qzd-sw][disabled]{opacity:.45;cursor:default;}
[data-qzd-input]{width:100%;box-sizing:border-box;padding:11px 13px;border-radius:10px;font-size:14px;
  border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.16));
  background:var(--dsw-alias-bg-overlay,rgba(128,128,128,.08));color:inherit;font-family:inherit;}
[data-qzd-input]:focus{outline:none;border-color:#3b82f6;}
[data-qzd-num]{width:120px;text-align:left;}
select[data-qzd-input]{width:auto;min-width:150px;max-width:230px;flex:0 0 auto;}
[data-qzd-btn]{padding:7px 12px;border-radius:8px;font-size:12px;cursor:pointer;font-family:inherit;
  border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.16));
  background:var(--dsw-alias-bg-overlay,rgba(128,128,128,.14));color:inherit;}
[data-qzd-btn]:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.24));}
[data-qzd-btn][data-primary]{background:#3b82f6;border-color:#3b82f6;color:#fff;}
[data-qzd-btn][disabled]{opacity:.5;cursor:default;}
[data-qzd-msg]{font-size:11px;line-height:16px;padding:7px 9px;border-radius:8px;word-break:break-all;
  background:var(--dsw-alias-bg-overlay,rgba(128,128,128,.12));color:var(--dsw-alias-label-tertiary,#9aa0a6);}
[data-qzd-msg][data-warn]{color:#f59e0b;}
[data-qzd-msg][data-good]{color:#22c55e;}
[data-qzd-pre]{margin:6px 0 0;padding:8px 9px;border-radius:8px;max-height:200px;overflow:auto;font-size:11px;
  line-height:15px;white-space:pre-wrap;word-break:break-all;
  background:var(--dsw-alias-bg-overlay,rgba(0,0,0,.25));color:var(--dsw-alias-label-secondary,#c9ccd1);}
[data-qzd-nav]{display:flex;gap:6px;flex-wrap:wrap;padding-bottom:4px;border-bottom:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.1));}
[data-qzd-tab]{padding:7px 11px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary,#c9ccd1);cursor:pointer;font:inherit;font-size:12px;}
[data-qzd-tab]:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.18));}
[data-qzd-tab][data-active]{background:#3b82f6;color:#fff;}
[data-qzd-feature]{display:flex;flex-direction:column;gap:12px;padding:4px 2px;}
[data-qzd-card]{padding:12px;border-radius:10px;background:var(--dsw-alias-bg-overlay,rgba(128,128,128,.12));}
[data-qzd-card-title]{font-size:14px;font-weight:600;margin-bottom:5px;}
[data-qzd-picker]{display:flex;flex-direction:column;gap:8px;position:relative;}
[data-qzd-chips]{display:flex;flex-wrap:wrap;gap:6px;}
[data-qzd-chip]{display:inline-flex;align-items:center;gap:4px;max-width:100%;padding:4px 6px 4px 10px;border-radius:7px;font-size:12px;
  background:var(--dsw-alias-bg-overlay,rgba(128,128,128,.18));color:var(--dsw-alias-label-secondary,#c9ccd1);}
[data-qzd-chip-t]{max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
[data-qzd-chip-x]{border:0;background:transparent;color:inherit;cursor:pointer;font-size:13px;line-height:1;padding:0 3px;border-radius:4px;opacity:.75;}
[data-qzd-chip-x]:hover{opacity:1;background:rgba(128,128,128,.28);}
[data-qzd-drop]{position:absolute;top:100%;left:0;z-index:20;margin-top:6px;width:min(380px,100%);padding:8px;border-radius:10px;
  display:flex;flex-direction:column;gap:6px;box-shadow:0 8px 24px rgba(0,0,0,.35);
  background:var(--dsw-alias-bg-elevated,#24262b);border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));}
[data-qzd-droplist]{max-height:200px;overflow:auto;display:flex;flex-direction:column;gap:2px;}
[data-qzd-dropitem]{display:flex;flex-direction:column;gap:3px;text-align:left;width:100%;padding:8px 10px;border:0;border-radius:7px;
  background:transparent;color:inherit;cursor:pointer;font:inherit;font-size:13px;}
[data-qzd-dropitem]:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.22));}
[data-qzd-dropitem-t]{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
`;

    function Switch({ on, onChange, disabled }) {
      return h('button', {
        'data-qzd-sw': '', 'data-on': on ? '' : undefined,
        disabled: Boolean(disabled), title: on ? '已开' : '已关',
        onClick: () => { if (!disabled) onChange(!on) },
      }, h('i'));
    }
    function ToggleRow({ label, note, on, onChange, disabled }) {
      return h('div', { 'data-qzd-row': '' },
        h('div', { 'data-qzd-grow': '' },
          h('div', { 'data-qzd-label': '' }, label),
          note ? h('div', { 'data-qzd-note': '' }, note) : null),
        h(Switch, { on, onChange, disabled }));
    }
    function NumRow({ label, note, value, min, max, onCommit }) {
      return h('div', { 'data-qzd-sub': '' },
        h('div', { 'data-qzd-row': '' },
          h('div', { 'data-qzd-grow': '' },
            h('div', { 'data-qzd-label': '' }, label),
            note ? h('div', { 'data-qzd-note': '' }, note) : null),
          h('input', {
            'data-qzd-input': '', 'data-qzd-num': '', type: 'number', min, max,
            value: value == null ? '' : value,
            onChange: (e) => onCommit(e.target.value),
            onBlur: (e) => {
              const n = Math.max(min, Math.min(max, Number(e.target.value) || min));
              onCommit(String(n));
            },
          })));
    }

    const VIS_LABEL = { 1: '公开', 4: '好友可见', 64: '仅自己' };

    // ── 卡片式布局原语（对齐 dsh-speak-up 的视觉：分组卡片 + 标签/输入框/彩色说明）──
    function Card({ title, children }) {
      return h('div', { 'data-qzd-card': '' },
        title ? h('div', { 'data-qzd-card-title': '' }, title) : null,
        children);
    }
    function Para({ children }) {
      return h('div', { 'data-qzd-para': '' }, children);
    }
    function Hint({ children }) {
      return h('div', { 'data-qzd-hint': '' }, children);
    }
    function Warn({ children }) {
      return h('div', { 'data-qzd-warn': '' }, children);
    }
    function Ok({ children }) {
      return h('div', { 'data-qzd-ok': '' }, children);
    }
    // 标签在上、输入框在下的标准字段
    function Field({ label, hint, children }) {
      return h('div', { 'data-qzd-field': '' },
        h('div', { 'data-qzd-flabel': '' }, label),
        children,
        hint ? h(Hint, null, hint) : null);
    }
    // 纯数字框（宽 140，独立一行）
    function NumInput({ value, min, max, onCommit, unit }) {
      return h('div', { 'data-qzd-inline': '' },
        h('input', {
          'data-qzd-input': '', 'data-qzd-num': '', type: 'number', min, max,
          value: value == null ? '' : value,
          onChange: (e) => onCommit(e.target.value),
          onBlur: (e) => {
            const n = Math.max(min, Math.min(max, Number(e.target.value) || min));
            onCommit(String(n));
          },
        }),
        unit ? h('span', { 'data-qzd-unit': '' }, unit) : null);
    }

    // 目标会话选择器：一个下拉框，选中后以标签形式列在下面，不再一次列一大堆。
    function SessionPicker({ sessions, selected, onChange }) {
      const [open, setOpen] = React.useState(false);
      const [q, setQ] = React.useState('');
      const sel = selected || [];
      const selSet = new Set(sel);
      const label = (s) => s.title || `（还没起名）${s.id.slice(-8)}`;
      const pool = sessions.filter((s) => !selSet.has(s.id));
      const kw = q.trim().toLowerCase();
      const list = kw ? pool.filter((s) => (label(s) + ' ' + s.id).toLowerCase().includes(kw)) : pool;
      const add = (s) => { onChange([...sel, s.id]); setOpen(false); setQ(''); };
      const remove = (id) => onChange(sel.filter((x) => x !== id));
      const byId = new Map(sessions.map((s) => [s.id, s]));
      return h('div', { 'data-qzd-picker': '' },
        sel.length ? h('div', { 'data-qzd-chips': '' },
          ...sel.map((id) => {
            const s = byId.get(id);
            return h('span', { 'data-qzd-chip': '', key: id },
              h('span', { 'data-qzd-chip-t': '' }, s ? label(s) : id),
              h('button', {
                'data-qzd-chip-x': '', title: '移除', onClick: () => remove(id),
              }, '×'));
          })) : null,
        h('div', { 'data-qzd-row': '' },
          h('button', { 'data-qzd-btn': '', onClick: () => setOpen((v) => !v) },
            sel.length ? `已选 ${sel.length} 个 · 点此增删` : '选择会话…'),
          open ? h('div', { 'data-qzd-drop': '' },
            h('input', {
              'data-qzd-input': '', autoFocus: true, placeholder: '搜索标题或 id…', value: q,
              onChange: (e) => setQ(e.target.value),
              onKeyDown: (e) => { if (e.key === 'Escape') { setOpen(false); setQ(''); } },
            }),
            h('div', { 'data-qzd-droplist': '' },
              list.length === 0
                ? h('div', { 'data-qzd-note': '', style: { padding: '6px 8px' } }, pool.length ? '没匹配到' : '（没有更多可选会话）')
                : list.map((s) => h('button', {
                  'data-qzd-dropitem': '', key: s.id, onClick: () => add(s),
                },
                  h('div', { 'data-qzd-dropitem-t': '' }, label(s)),
                  h('div', { 'data-qzd-note': '' }, `${s.archived ? '已归档 · ' : ''}${s.alive ? (s.status === 'idle' ? '空闲' : s.status) : '没活着'}`))))) : null),
      );
    }

    function Panel() {
      const [st, setSt] = React.useState(null);
      const [msg, setMsg] = React.useState('');
      const [tone, setTone] = React.useState('');
      const [busy, setBusy] = React.useState('');
      const [activeFeature, setActiveFeature] = React.useState('qzone');
      const [proactiveSessions, setProactiveSessions] = React.useState([]);

      React.useEffect(() => {
        let alive = true;
        const loadSessions = async () => {
          try {
            const r = await jget('/proactive-sessions');
            if (alive && r?.ok) setProactiveSessions(r.sessions || []);
          } catch { /* 拿不到清单就算了 */ }
        };
        loadSessions();
        const t = setInterval(loadSessions, 15000);
        return () => { alive = false; clearInterval(t); };
      }, []);

      const say = (t, tn) => { setMsg(t); setTone(tn || ''); };

      React.useEffect(() => {
        let alive = true;
        const tick = async () => {
          try { const d = await jget('/status'); if (alive && d?.ok) setSt(d); }
          catch { /* 网络抖动下次再问 */ }
        };
        tick();
        const t = setInterval(tick, 8000);
        return () => { alive = false; clearInterval(t); };
      }, []);

      const cfg = st?.config;
      const patch = async (p, what) => {
        setBusy(JSON.stringify(p));
        try {
          const r = await jpost('/config', p);
          if (r?.config) setSt((old) => ({ ...old, config: r.config }));
          say(what ? `${what}：已保存` : '已保存', 'good');
        } catch (e) { say(String(e?.message ?? e), 'warn'); }
        finally { setBusy(''); }
      };

      const onPreview = async () => {
        setBusy('preview'); say('正在写随笔并评估…', '');
        try {
          const r = await jpost('/preview', {});
          if (!r?.ok) { say(r?.error || '没生成出来', 'warn'); return; }
          if (!r.text && r.note) { say(r.note, ''); return; }
          const pct = Math.round((r.score ?? 0) * 100);
          say(`已生成草稿（值得发送程度 ${pct}%，还没发布）`, 'good');
          const d = await jget('/status'); if (d?.ok) setSt(d);
        } catch (e) { say(String(e?.message ?? e), 'warn'); }
        finally { setBusy(''); }
      };
      const onPublish = async (draftId) => {
        setBusy('publish'); say('发布中…', '');
        try {
          const r = await jpost('/publish', { draftId });
          if (!r?.ok) { say(r?.error || '发布失败', 'warn'); return; }
          say('已发布到 QQ 空间', 'good');
          const d = await jget('/status'); if (d?.ok) setSt(d);
        } catch (e) { say(String(e?.message ?? e), 'warn'); }
        finally { setBusy(''); }
      };
      const onReconcile = async (confirmed) => {
        const p = st?.pending;
        if (!p) return;
        setBusy('reconcile');
        try {
          const r = await jpost('/reconcile', { draftId: p.draftId, confirmedPublished: confirmed });
          if (!r?.ok) { say(r?.error || '恢复失败', 'warn'); return; }
          say(confirmed ? '已标记为已发布' : '已确认未发布', 'good');
          const d = await jget('/status'); if (d?.ok) setSt(d);
        } catch (e) { say(String(e?.message ?? e), 'warn'); }
        finally { setBusy(''); }
      };

      if (!st || !cfg) return h('div', { 'data-qzd-page': '' }, h('div', { 'data-qzd-note': '' }, '读设置中…'));

      return h('div', { 'data-qzd-page': '' },
        h('style', null, CSS),
        h('nav', { 'data-qzd-nav': '', 'aria-label': '机器人功能' },
          h('button', { 'data-qzd-tab': '', 'data-active': activeFeature === 'qzone' ? '' : undefined, onClick: () => setActiveFeature('qzone') }, 'QQ 空间'),
          h('button', { 'data-qzd-tab': '', 'data-active': activeFeature === 'proactive' ? '' : undefined, onClick: () => setActiveFeature('proactive') }, '主动回复'),
          h('button', { 'data-qzd-tab': '', 'data-active': activeFeature === 'overview' ? '' : undefined, onClick: () => setActiveFeature('overview') }, '功能总览'),
        ),
        activeFeature === 'overview' ? h('div', { 'data-qzd-feature': '' },
          h('div', { 'data-qzd-card': '' },
            h('div', { 'data-qzd-card-title': '' }, 'QQ 机器人加强插件'),
            h('div', { 'data-qzd-note': '' }, '这里将集中管理机器人的扩展功能。当前已接入 QQ 空间与主动回复，后续可继续添加消息、群管理、定时任务等功能。'),
          ),
          h('div', { 'data-qzd-card': '' },
            h('div', { 'data-qzd-card-title': '' }, '当前功能'),
            h('div', { 'data-qzd-label': '' }, 'QQ 空间随笔'),
            h('div', { 'data-qzd-note': '' }, '从机器人近期发言整理随笔草稿，并按计划和概率发布。'),
            h('div', { 'data-qzd-label': '' }, '主动回复'),
            h('div', { 'data-qzd-note': '' }, '到点主动搭话，并用大模型评估对话完毕性与紧急性来动态缩短回复间隔。'),
          ),
        ) : null,
        activeFeature === 'proactive' ? h('div', { 'data-qzd-feature': '' },
          h('div', { 'data-qzd-row': '' },
            h('span', { 'data-qzd-badge': '' }, st.proactive?.enabled ? '主动回复已开' : '主动回复关'),
            st.proactive?.lastEval ? h('span', { 'data-qzd-badge': '' }, `最近评估：完毕 ${Math.round((st.proactive.lastEval.completeness ?? 0) * 100)}% / 紧急 ${Math.round((st.proactive.lastEval.urgency ?? 0) * 100)}%`) : null),
          st.proactive?.nextProactiveAt ? h('div', { 'data-qzd-note': '' }, `下次主动回复尝试：${new Date(st.proactive.nextProactiveAt).toLocaleString('zh-CN', { hour12: false })}`) : null,

          h(Card, { title: '开关' },
            h(Para, null, '主动搭话的总闸与演练档。这两个都开/关掉，其他格子填什么都不会生效。'),
            h(ToggleRow, {
              label: '允许主动回复',
              note: '关着 = 完全不主动搭话（默认）。',
              on: Boolean(cfg.proactiveEnabled),
              onChange: (v) => patch({ proactiveEnabled: v }, '主动回复'),
            }),
            h(ToggleRow, {
              label: '试运行',
              note: '开着 = 掷中也只记账、不真发（默认），先看几轮再关。',
              on: Boolean(cfg.proactiveDryRun),
              onChange: (v) => patch({ proactiveDryRun: v }, '试运行'),
            })),

          h(Card, { title: '骰子' },
            h(Para, null, '每轮掷一个 0~100 的数，比命中线小就开口。命中线 = （峰时或谷时的那格命中线）× 时机因子，再加上攒下来的没中加成。'),
            h(Field, {
              label: '掷骰子间隔（分钟）',
              hint: '默认 30。范围 1~1440；改完保存，下一轮就按新间隔走（不用重启）。',
            },
              h(NumInput, {
                value: cfg.proactiveIntervalMin, min: 1, max: 1440,
                onCommit: (v) => patch({ proactiveIntervalMin: Number(v) }, '基础间隔'),
              })),
            h(Field, {
              label: '搭话冷却（分钟）',
              hint: '自己刚开过口之后，这么多分钟内不再开口（默认 20）。0 = 不冷却（刚开口过也照投）。',
            },
              h(NumInput, {
                value: cfg.proactiveCooldownMin, min: 0, max: 1440,
                onCommit: (v) => patch({ proactiveCooldownMin: Number(v) }, '冷却'),
              })),
            h(Field, {
              label: '没中加成（百分点）',
              hint: '每没掷中一次，下一次命中线加这么多（默认 10）。填 0 = 关掉这个功能（一分都不加）。',
            },
              h(NumInput, {
                value: cfg.proactiveMissBonus, min: 0, max: 100,
                onCommit: (v) => patch({ proactiveMissBonus: Number(v) }, '没中加成'),
              })),
            h(Field, {
              label: '加成上限（百分点）',
              hint: '加成最多加到这么多（默认 40）。',
            },
              h(NumInput, {
                value: cfg.proactiveMissBonusMax, min: 0, max: 100,
                onCommit: (v) => patch({ proactiveMissBonusMax: Number(v) }, '加成上限'),
              })),
            h(Para, null, '掷中（含试运行掷中）就清零，从头开始；连着没中就一次一次往上加，加到上限为止。'),
            h(Para, null, '这两格只影响自动的定时掷骰；手动按钮（演练/真发）不掷骰子，也不动这个计数器。'),
            h(Warn, null, `「连着没中」这个数只记在内存里：DSH 一重启就回到 0。当前连没中 ${st.proactive?.missStreak ?? 0} 次。`),
            h(Field, {
              label: '安静时段（起 / 止，小时）',
              hint: '默认 1 ~ 8 点不掷（含 1 点、不含 8 点）。跨午夜也行（比如 23 ~ 7）。',
            },
              h('div', { 'data-qzd-inline': '' },
                h(NumInput, {
                  value: cfg.proactiveQuietStart ?? 1, min: 0, max: 23,
                  onCommit: (v) => patch({ proactiveQuietStart: Number(v) }, '安静起'),
                }),
                h('span', { 'data-qzd-unit': '' }, '点 ~'),
                h(NumInput, {
                  value: cfg.proactiveQuietEnd ?? 8, min: 0, max: 23,
                  onCommit: (v) => patch({ proactiveQuietEnd: Number(v) }, '安静止'),
                }),
                h('span', { 'data-qzd-unit': '' }, '点'))),
            h(Warn, null, `两个数字填成一样（比如 8 和 8）= 不启用安静时段：整天都可能掷骰子。现在是 ${cfg.proactiveQuietStart ?? 1}~${cfg.proactiveQuietEnd ?? 8} 点。`)),

          h(Card, { title: '对话评估（聊到什么程度了 → 决定多快再开口）' },
            h(Para, null, '每一轮对话结束后，让大模型看一眼刚才聊的内容，给两个 0~1 的分：'),
            h(Para, null, '· 完毕性 —— 对方话是不是说完了、这个话题是不是收尾了。· 紧急性 —— 现在是不是需要赶紧接一句。'),
            h(Para, null, '两个分越高，下一次主动开口的间隔就越短（最多缩到下面那个幅度）。'),
            h(ToggleRow, {
              label: '开启对话评估',
              note: '关着 = 不做评估，永远按「掷骰子间隔」那格走，不缩短。',
              on: cfg.proactiveEvalEnabled !== false,
              onChange: (v) => patch({ proactiveEvalEnabled: v }, '对话评估'),
            }),
            h(Field, {
              label: '评估缩短幅度（%）',
              hint: '综合分 = （完毕性 + 紧急性）÷ 2。综合分 0 → 间隔不缩；综合分 1 → 间隔缩到基础间隔的 (100 − 这个数)%。默认 70（即最快缩到 30%）。',
            },
              h(NumInput, {
                value: cfg.proactiveEvalShrink ?? 70, min: 0, max: 100,
                onCommit: (v) => patch({ proactiveEvalShrink: Number(v) }, '缩短幅度'),
              })),
            h(Ok, null, '√ 同一轮对话只评一次：对方回复之前不会再评，对方一开口就重新计一次。'),
            h('div', { 'data-qzd-summary': '' },
              `最近一次评估：${st.proactive?.lastEval
                ? `完毕性 ${Math.round((st.proactive.lastEval.completeness ?? 0) * 100)}% · 紧急性 ${Math.round((st.proactive.lastEval.urgency ?? 0) * 100)}% · 综合 ${Math.round((st.proactive.lastEval.score ?? 0) * 100)}%`
                : '还没评过'}　→　当前实际间隔 ${st.proactive?.effectiveIntervalMin ?? cfg.proactiveIntervalMin} 分钟（基础 ${cfg.proactiveIntervalMin} 分钟）`),
            h(Warn, null, '评估要花一次很短的模型调用。嫌费就把上面那格关掉，间隔就不受分数影响了。')),

          h(Card, { title: '时机因子（刚聊过就少开口，冷太久了就多开口）' },
            h('div', { 'data-qzd-flabel': '' }, '近：刚聊过 → 命中线 ×' + (cfg.proactiveNearFactor ?? 0.15)),
            h('div', { 'data-qzd-inline': '' },
              h(NumInput, {
                value: cfg.proactiveNearMin, min: 1, max: 1440,
                onCommit: (v) => patch({ proactiveNearMin: Number(v) }, '近阈值'),
              }),
              h('span', { 'data-qzd-unit': '' }, '分钟内 → ×'),
              h(NumInput, {
                value: cfg.proactiveNearFactor, min: 0, max: 10, step: 0.05,
                onCommit: (v) => patch({ proactiveNearFactor: Number(v) }, '近因子'),
              })),
            h(Hint, null, '距对方上次说话不到这个分钟数 → 命中线乘这个因子（更难开口）。默认 20 分钟 ×0.15。'),
            h('div', { 'data-qzd-flabel': '' }, '远：冷太久 → 命中线 ×' + (cfg.proactiveFarFactor ?? 1.5)),
            h('div', { 'data-qzd-inline': '' },
              h(NumInput, {
                value: cfg.proactiveFarMin, min: 1, max: 10080,
                onCommit: (v) => patch({ proactiveFarMin: Number(v) }, '远阈值'),
              }),
              h('span', { 'data-qzd-unit': '' }, '分钟以上 → ×'),
              h(NumInput, {
                value: cfg.proactiveFarFactor, min: 0, max: 10, step: 0.05,
                onCommit: (v) => patch({ proactiveFarFactor: Number(v) }, '远因子'),
              })),
            h(Hint, null, '超过这个分钟数没说话 → 命中线乘这个因子（更容易开口）。默认 360 分钟（6 小时）×1.5。'),
            h(Para, null, '中间那一段：命中线 ×1（既不加也不减）。最后会夹在 0~100。')),

          h(Card, { title: '峰谷分时（贵的时候少开口，便宜的时候多开口）' },
            h(Para, null, '时段是固定的，不用你填；只有这两个数字要你定：'),
            h(Field, {
              label: '峰时命中线（%）',
              hint: '每轮掷一个 0~100 的数，掷到命中线以下才开口；掷在上面就不开。这是峰时的基础命中线（峰时 = 周一~周五 9:00~12:00、14:00~18:00，贵）。默认 20 —— 贵的时候少开口。',
            },
              h(NumInput, {
                value: cfg.proactivePeakChance, min: 0, max: 100,
                onCommit: (v) => patch({ proactivePeakChance: Number(v) }, '峰时命中线'),
              })),
            h(Field, {
              label: '谷时命中线（%）',
              hint: '这是谷时的基础命中线（其余全是谷时：午休 12:00~14:00、18:00 到次日 9:00、周六周日全天，便宜）。默认 50。',
            },
              h(NumInput, {
                value: cfg.proactiveChance, min: 0, max: 100,
                onCommit: (v) => patch({ proactiveChance: Number(v) }, '谷时命中线'),
              })),
            h(Field, {
              label: '按哪个时区算峰谷',
              hint: `峰谷是按这个时区算的。机器不在东八区时，这里填 Asia/Shanghai，峰谷就不会按你的本地时间错判。写成别的 IANA 名字也行（比如 Europe/Berlin）；写得不对会当没填。当前：${st.proactive?.nowPeak ? '峰时' : '谷时'}${st.proactive?.quiet ? ' · 安静时段中（不掷）' : ''}。`,
            },
              h('input', {
                'data-qzd-input': '', style: { maxWidth: '260px' }, value: cfg.proactivePeakTz || '',
                placeholder: '留空 = 本机时区',
                onChange: (e) => patch({ proactivePeakTz: e.target.value }, '峰谷时区'),
              })),
            h(Para, null, '最终命中线 = 这格（看是峰时还是谷时）× 时机因子 + 攒下来的没中加成（最后夹在 0~100）。'),
            h(Warn, null, '两个数字填成一样 = 不分峰谷，全天一个命中线'),
            (() => {
              const qs = cfg.proactiveQuietStart ?? 1, qe = cfg.proactiveQuietEnd ?? 8;
              if (qs === qe) return null;
              const overlapsValley = qs > qe || qs >= 18 || qe <= 9;
              if (!overlapsValley) return null;
              return h(Warn, null, `注意：安静时段会盖住谷时 —— 你现在安静时段是 ${qs}~${qe} 点，那段时间根本不掷，谷时命中线再高也用不上。`);
            })()),

          h(Card, { title: '目标会话' },
            h(Para, null, '勾了谁，就会在谁自己的会话里自己开口。勾几个都行；一次掷中只在其中一个里开口（随机挑一个活着、又不忙的）。'),
            h(Ok, null, '√ 勾选/取消一点就生效（自动保存，不用再按保存）'),
            h('div', { 'data-qzd-summary': '' },
              `已勾 ${(cfg.proactiveTargetSessions || []).length} 个：${(cfg.proactiveTargetSessions || []).length ? (cfg.proactiveTargetSessions || []).map((id) => { const s = proactiveSessions.find((x) => x.id === id); return s ? s.title || id.slice(-8) : id.slice(-8) }).join('、') : '（还没勾）'}。其中 ${(cfg.proactiveTargetSessions || []).filter((id) => proactiveSessions.some((x) => x.id === id && x.alive)).length} 个现在活着`),
            h('div', { 'data-qzd-flabel': '', style: { marginTop: '4px' } }, '现在开着的会话（点一下 = 勾上/取消，立刻生效）：'),
            h(SessionPicker, {
              sessions: proactiveSessions,
              selected: cfg.proactiveTargetSessions || [],
              onChange: (list) => patch({ proactiveTargetSessions: list }, '目标会话'),
            })),

          h(Card, { title: '触发文案' },
            h(Para, null, '这段话会作为「你自己心里冒出的念头」送进会话，不是对方说的话。'),
            h('textarea', {
              'data-qzd-input': '', rows: 3, value: cfg.proactiveTriggerText || '',
              placeholder: '例如：好久没人跟我说话了，我该主动去打个招呼。',
              onChange: (e) => patch({ proactiveTriggerText: e.target.value }, '触发文案'),
            })),
          h(Card, { title: '风格补充（可选）' },
            h(Para, null, '追加在触发文案后面。'),
            h('textarea', {
              'data-qzd-input': '', rows: 2, value: cfg.proactivePrompt || '',
              placeholder: '例如：语气轻松一点，别追问太多。',
              onChange: (e) => patch({ proactivePrompt: e.target.value }, '风格补充'),
            })),

          (st.proactive?.log && st.proactive.log.length) ? h(Card, { title: '最近记录' },
            ...st.proactive.log.slice().reverse().map((l, i) => h('div', { 'data-qzd-pre': '', key: i }, `${new Date(l.at).toLocaleString('zh-CN', { hour12: false })}　${l.text}`))) : null,
        ) : null,
        activeFeature !== 'qzone' ? null : h(React.Fragment, null,
        h('div', { 'data-qzd-row': '' },
          h('span', { 'data-qzd-badge': '' }, `今天已发 ${st.todayPosts ?? 0} / ${cfg.maxPerDay} 条`),
          h('span', { 'data-qzd-badge': '' }, `累计 ${st.totalPosts ?? 0} 条`),
          h('span', { 'data-qzd-badge': '' }, cfg.publishEnabled ? '发布已开' : '发布关')),
        st.nextAttemptAt ? h('div', { 'data-qzd-note': '' }, `下次尝试：${new Date(st.nextAttemptAt).toLocaleString('zh-CN', { hour12: false })}`) : null,

        h('div', { 'data-qzd-sec': '' },
          h('div', { 'data-qzd-h': '' }, '发布'),
          h(ToggleRow, {
            label: '允许发布到 QQ 空间',
            note: '关着 = 只存草稿、绝不真发（默认）。打开后才可能发出去。',
            on: Boolean(cfg.publishEnabled),
            onChange: (v) => patch({ publishEnabled: v }, '允许发布'),
          }),
          h('div', { 'data-qzd-row': '' },
            h('div', { 'data-qzd-grow': '' },
              h('div', { 'data-qzd-label': '' }, '谁可见'),
              h('div', { 'data-qzd-note': '' }, '默认「好友可见」。')),
            h('select', {
              'data-qzd-input': '', value: String(cfg.visibility ?? 4),
              onChange: (e) => patch({ visibility: Number(e.target.value) }, '可见范围'),
            },
              h('option', { value: '4' }, '好友可见（默认）'),
              h('option', { value: '1' }, '公开'),
              h('option', { value: '64' }, '仅自己')))),

        h('div', { 'data-qzd-sec': '' },
          h('div', { 'data-qzd-h': '' }, '什么时候发'),
          h('div', { 'data-qzd-note': '' }, '每隔一段时间，针对上次发说说到现在之间新聊到的话题，写一两句随笔，再按「值得发送程度」的概率掷骰决定发不发。'),
          h(NumRow, {
            label: '间隔（小时）', value: cfg.intervalHours, min: 1, max: 168,
            note: '每隔这么久尝试一次。默认 8 小时。',
            onCommit: (v) => patch({ intervalHours: Number(v) }, '间隔'),
          }),
          h(NumRow, {
            label: '随机噪声（分钟）', value: cfg.randomJitterMinutes, min: 0, max: 1440,
            note: '在间隔基础上加随机偏移，让发的时间不那么机械。',
            onCommit: (v) => patch({ randomJitterMinutes: Number(v) }, '随机噪声'),
          }),
          h(NumRow, {
            label: '每天最多发几条', value: cfg.maxPerDay, min: 1, max: 30,
            note: '全局每日上限，防止刷屏。',
            onCommit: (v) => patch({ maxPerDay: Number(v) }, '每日上限'),
          })),

        h('div', { 'data-qzd-sec': '' },
          h('div', { 'data-qzd-h': '' }, '写什么'),
          h(NumRow, {
            label: '随笔最长多少字', value: cfg.maxChars, min: 20, max: 300,
            note: '一两句话的短随笔。',
            onCommit: (v) => patch({ maxChars: Number(v) }, '长度'),
          })),

        h('div', { 'data-qzd-sec': '' },
          h('div', { 'data-qzd-h': '' }, '手动写一条'),
          h('div', { 'data-qzd-row': '' },
            h('button', { 'data-qzd-btn': '', 'data-primary': '', disabled: busy === 'preview', onClick: onPreview },
              busy === 'preview' ? '写草稿中…' : '现在写一条草稿'),
            h('span', { 'data-qzd-note': '' }, '生成并评估发送概率，但不发布。')),

          (st.pending) ? h('div', { 'data-qzd-msg': '', 'data-warn': '' },
            '有一条发布结果不确定。请到 QQ 空间确认后点：',
            h('div', { 'data-qzd-row': '', style: { marginTop: 8 } },
              h('button', { 'data-qzd-btn': '', disabled: busy === 'reconcile', onClick: () => onReconcile(true) }, '确实发了'),
              h('button', { 'data-qzd-btn': '', disabled: busy === 'reconcile', onClick: () => onReconcile(false) }, '没发出去'))) : null,

          (st.drafts && st.drafts.length) ? h('div', { 'data-qzd-sec': '' },
            h('div', { 'data-qzd-h': '' }, '最近草稿'),
            ...st.drafts.map((d) => h('div', { 'data-qzd-sub': '', key: d.id },
              h('div', { 'data-qzd-note': '' }, `${VIS_LABEL[d.visibility] ?? d.visibility}　发送程度 ${Math.round((d.score ?? 0) * 100)}%　${new Date(d.createdAt).toLocaleString('zh-CN', { hour12: false })}`),
              h('div', { 'data-qzd-pre': '' }, d.content),
              h('div', { 'data-qzd-row': '' },
                h('button', { 'data-qzd-btn': '', 'data-primary': '', disabled: busy === 'publish' || !cfg.publishEnabled, onClick: () => onPublish(d.id) },
                  busy === 'publish' ? '发布中…' : '发布这条'))))) : null),

        ),

        msg ? h('div', { 'data-qzd-msg': '', 'data-good': tone === 'good' ? '' : undefined, 'data-warn': tone === 'warn' ? '' : undefined }, msg) : null,
      );
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        const slots = ctx.get('slots');
        slots.inject('settings.section', () => slots.register(
          { name: 'settings.section', id: 'qzone-diary', order: 55, label: 'QQ机器人加强插件' },
          () => h(Panel),
        ));
      },
    };
  },
});
