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
[data-qzd-page]{display:flex;flex-direction:column;gap:16px;padding:2px 2px 8px;max-width:680px;}
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
[data-qzd-input]{width:100%;box-sizing:border-box;padding:7px 9px;border-radius:8px;font-size:12px;
  border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));
  background:var(--dsw-alias-bg-overlay,rgba(128,128,128,.12));color:inherit;font-family:inherit;}
[data-qzd-input]:focus{outline:none;border-color:#3b82f6;}
[data-qzd-num]{width:88px;text-align:center;}
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

          h('div', { 'data-qzd-sec': '' },
            h('div', { 'data-qzd-h': '' }, '开关'),
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

          h('div', { 'data-qzd-sec': '' },
            h('div', { 'data-qzd-h': '' }, '目标会话'),
            h('div', { 'data-qzd-note': '' }, '勾选后，到点会在其中一个「活着且空闲」的会话里主动开一轮。'),
            proactiveSessions.length === 0 ? h('div', { 'data-qzd-note': '' }, '（拿不到会话清单，可在配置里直接填会话 ID）') : null,
            ...proactiveSessions.map((s) => {
              const checked = (cfg.proactiveTargetSessions || []).some((id) => id === s.id);
              const toggle = (on) => {
                const cur = new Set(cfg.proactiveTargetSessions || []);
                if (on) cur.add(s.id); else cur.delete(s.id);
                patch({ proactiveTargetSessions: [...cur] }, '目标会话');
              };
              return h('div', { 'data-qzd-row': '', key: s.id },
                h('div', { 'data-qzd-grow': '' },
                  h('div', { 'data-qzd-label': '' }, s.title || s.id),
                  h('div', { 'data-qzd-note': '' }, `${s.status ?? 'idle'} · ${s.id}`)),
                h(Switch, { on: checked, onChange: toggle }));
            })),

          h('div', { 'data-qzd-sec': '' },
            h('div', { 'data-qzd-h': '' }, '节奏'),
            h(NumRow, {
              label: '基础间隔（分钟）', value: cfg.proactiveIntervalMin, min: 1, max: 1440,
              note: '每隔这么久尝试一次；评估分越高，实际间隔越短（最低缩到 30%）。',
              onCommit: (v) => patch({ proactiveIntervalMin: Number(v) }, '基础间隔'),
            }),
            h(NumRow, {
              label: '掷骰命中线（0~100）', value: cfg.proactiveChance, min: 0, max: 100,
              note: '到点掷 0~100，≤ 此值才真正回复。',
              onCommit: (v) => patch({ proactiveChance: Number(v) }, '命中线'),
            })),

          h('div', { 'data-qzd-sec': '' },
            h('div', { 'data-qzd-h': '' }, '回复风格'),
            h('div', { 'data-qzd-note': '' }, '可选补充，加到主动回复的触发语境里。'),
            h('textarea', {
              'data-qzd-input': '', rows: 3, value: cfg.proactivePrompt || '',
              placeholder: '例如：语气轻松一点，别追问太多。',
              onChange: (e) => patch({ proactivePrompt: e.target.value }, '回复风格'),
            })),

          (st.proactive?.log && st.proactive.log.length) ? h('div', { 'data-qzd-sec': '' },
            h('div', { 'data-qzd-h': '' }, '最近记录'),
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
