# chihaya-fish-enhance（QQ 机器人加强插件）

面向 QQ 机器人的可扩展加强插件。目前已包含「QQ 空间随笔」功能：让机器人从自己的近期发言里，自动整理一两句草稿；启用发布后，按「值得发送程度」的概率掷骰决定发不发。Web 设置页已按功能拆分，后续可继续添加更多机器人能力。

> 仅供上传/分发准备用的源码快照，不含 `node_modules`。

---

## 功能概览

| 动作 | 说明 |
|---|---|
| `preview` | 从上次发布以来新增的机器人发言里，生成一条随笔并评估发送概率（不发布） |
| `post` | 收到指令时，机器人主动把自己写好的说说发出去（只受每日上限和发布闸约束） |
| `publish` | 按草稿 ID 发布某条草稿 |
| `status` | 查看计划、草稿、今日/累计发布数、下次尝试时间 |
| `reconcile` | 发布结果不确定时（网络/网关异常），人工到空间确认后回填，避免重复发 |

调度：每隔 `intervalHours` 小时（加 `randomJitterMinutes` 随机噪声）尝试一次，生成随笔后按 `score` 概率掷骰，命中且 `publishEnabled` 开启时才真正发布。

安全默认：**总发布闸默认关闭**（`publishEnabled: false`，只存草稿不真发），可见范围默认「好友可见」（`visibility: 4`）。

---

## 文件结构

```
qzone-diary/
├── index.js            # 宿主端：模型工具 + 调度循环 + HTTP 设置页 API
├── client.js           # 客户端：机器人加强插件设置页（功能总览 + QQ 空间子菜单）
├── cordis.patch.yml    # bundle 补丁：注册插件并写入默认配置
├── icon.svg            # 插件图标
├── package.json        # 包元信息（name: @local/qzone-diary）
└── locale/
    ├── zh.json         # 中文元信息
    └── en.json         # 英文元信息
```

---

## 依赖

- **运行时依赖**：无（纯 Node 内置 `fs` / `path` / `crypto`）。
- **peerDependency**：`@deepseek-ai/schemastery >= 3.18.0`（仅用于 `Config` schema，由宿主提供）。

> 本仓库未包含 `node_modules`。本地原目录里 `node_modules/@deepseek-ai/schemastery` 只是指向宿主 `/opt/dsh/node_modules/...` 的符号链接，属于 peer 依赖，上传时无需携带。

---

## 配置项

| 键 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `bridgeRoot` | string | `/opt/qq-bridge` | QQ 桥接目录（须绝对路径） |
| `publishEnabled` | boolean | `false` | 总发布闸，关闭时只存草稿 |
| `intervalHours` | number | `8` | 调度尝试间隔（1–168 小时） |
| `randomJitterMinutes` | number | `180` | 间隔随机噪声（0–1440 分钟） |
| `maxPerDay` | number | `3` | 每日发布上限（1–30） |
| `maxChars` | number | `100` | 随笔最长字数（20–300） |
| `visibility` | 1\|4\|64 | `4` | 1=公开，4=好友，64=仅自己 |
| `sourceKeys` | string[] | `[]` | 素材会话（`private:QQ` / `group:群号`）；空时用桥接管理员私聊 |
| `adminSessionIds` | string[] | `[]` | 额外允许管理日记的 DSH 会话 ID |
| `prompt` | string | `''` | 随笔风格补充（≤2000 字） |

---

## 配置与状态落盘

桥接目录下（`bridgeRoot` 指向的 `/opt/qq-bridge`）：

| 路径 | 内容 |
|---|---|
| `config.json` | 桥接配置（只读） |
| `state/social-v2.json` | 素材来源：机器人近期发言（只读） |
| `state/sessions.json` | 会话映射，用于鉴权（只读） |
| `state/qzone-diary.json` | 日记状态：草稿、已发布、下次尝试时间、pending |
| `state/qzone-diary-config.json` | 热配置（设置页改动的持久化，旧字段自动映射） |

---

## 鉴权

- 仅允许 **QQ 管理员私聊**（`private:<ownerQQ>`）及 `adminSessionIds` 里配置的管理会话调用模型工具 `qzone_diary`。
- HTTP 设置页 API 走 `/api/qzone-diary/*`，由宿主 webServer 提供。

---

## 发布接口约定

发布时向 QQ 桥接的 SnowLuma 网关发起：

```
POST {snowluma.httpUrl}/send_qzone_msg
Authorization: Bearer {accessToken}
{ "content": "...", "ugc_right": <visibility> }
```

预期响应：`{ status: "ok", retcode: 0, data: { tid } }`。

---

## 安装（本机 DSH，参考《DSH 开发手册》）

```bash
# 1. 放入插件目录
cp -r qzone-diary /root/.dsh/plugins/qzone-diary

# 2. 注册进 web profile（bundle 里写包名 @local/qzone-diary）
cd /root/.dsh/profiles/web
node -e "
const fs=require('fs');
const p=JSON.parse(fs.readFileSync('package.json','utf8'));
p.dependencies['@local/qzone-diary']='link:/root/.dsh/plugins/qzone-diary';
p.dsh.profile.bundles.push('@local/qzone-diary');
fs.writeFileSync('package.json', JSON.stringify(p,null,2)+'\n');
"
ln -sfn /root/.dsh/plugins/qzone-diary node_modules/@local/qzone-diary

# 3. 重启
systemctl restart dsh-web

# 4. 工具白名单：qzone_diary 需在 QQ 桥接 qq-tool-restrict.mjs 放行
#    （SAFE_PREFIXES 加 qzone_ 前缀，或 SAFE_EXACT 加 qzone_diary）
```

> 注意：插件注册了模型工具 `qzone_diary`，需过 QQ 桥接白名单那道闸（见开发手册「QQ 桥接工具白名单」一节）。

---

## 版本

- 当前 `package.json` 版本：`1.1.0`
- 包名：`@local/qzone-diary`（`private: true`）
