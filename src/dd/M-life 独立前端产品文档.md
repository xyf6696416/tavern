# M-life 独立前端产品文档

> **版本**: 2.2 | **日期**: 2026-07-09 | **状态**: 最终版

---

## 第一章：产品概述

M-life 是一款运行在 SillyTavern 角色卡中的 **AI 驱动社交软件模拟器**。用户扮演一个使用约炮软件「M-life」的用户，在仿手机界面中刷帖子、匹配用户、私信聊天、发布招募，所有内容由 AI 动态生成。

**一句话：** 在手机上假装用约炮软件，实际上在跟 AI 聊天。

### 1.1 设计关键词

- **沉浸感** — 模拟真实手机 App 操作体验
- **平行叙事** — 故事正文 & 手机界面同时可见，互相驱动
- **双端适配** — PC 端右侧划入手机框，手机端全屏覆盖
- **零外部依赖** — 所有 CSS/JS 内联，单 HTML 文件部署
- **纯前端缓存** — 所有数据在 Pinia 中，酒馆只存叙事正文

### 1.2 入口

加载角色卡后，页面右下角出现一个 💎 悬浮球：
- **拖拽** — 按住拖到屏幕任意位置
- **点击** — 打开/关闭 M-life 主界面（PC：右侧划入；移动端：全屏覆盖）
- **位置记忆** — localStorage 记住位置

---

## 第二章：架构与数据流

### 2.1 核心循环

#### 完整对话（用户发送消息）

```
用户操作手机界面 → 发送消息
  ↓
① Pinia 持有全部数据缓存（帖子/私信/招募/账号…）
② 前端将整个 Pinia 状态序列化 → 格式化模板渲染 → 注入给 AI
③ AI 回复 = 叙事正文 + 尾部 ==mlife_data== 结构化块
④ 前端提取 ==mlife_data== 块 → 解析 → 更新 Pinia
⑤ 移除数据块，纯叙事正文写入消息楼层、显示到 StoryPane
⑥ 回到 ①，等待下一轮用户操作
```

#### 操作类动作决策树

| 操作类别 | 具体动作 | 走什么链路 | 说明 |
|---------|---------|-----------|------|
| **消息发送** | 输入框发消息、私信聊天发消息 | 完整对话 | 这是"用户发送消息"行为，走 `useMlifeInject` |
| **页面切换** | 切换 Tab、翻页、刷首页、刷匹配、刷直播、刷私信列表 | 页面刷新 | 走 `usePageRefresh`，不写入消息楼层 |
| **UI 操作** | 切换主题、拖拽悬浮球、展开/收起手机框、切换 Tab 高亮 | 纯前端本地 | 只改 appStore，不碰 API |
| **互动操作** | 点赞帖子、评论帖子 | 完整对话 | 这些操作本质是"用户做了某事"，需注入 AI 让叙事推进 |
| **招募操作** | 发布招募、报名招募、取消招募 | 完整对话 | 发布表单提交 → 组装 prompt → 走完整对话注入 AI |
| **招募管理** | 翻页查看管理列表 | 页面刷新 | 只是查看状态，不走叙事 |
| **开盒** | 点击开盒按钮 → 确认扣费 | 页面刷新 | 不写楼层，只请求开盒数据。扣费金额在前端本地扣除后，将变更状态注入给 AI |
| **签到** | 点击签到按钮 | 完整对话 | 签到是用户行为，需 AI 确认并返回奖励结果 |

#### 手机页面刷新（独立 API 请求，不走正文）

```
用户在手机框内切换页面 / 刷首页 / 刷匹配 / 刷直播 / 刷私信
  ↓
① 前端将当前 Pinia 状态 + 目标页面的硬编码提示词 → 组合成一条精简 prompt
② 走酒馆 API 接口发送（不写入消息楼层，不触发完整对话）
③ AI 只返回 ==mlife_data== 数据块（无叙事正文）
④ 前端解析 → 更新 Pinia → 渲染目标页面
⑤ Pinia 缓存该页面数据，下次切换或刷新时不重复请求
```

### 2.2 两种请求对比

| 维度 | 完整对话 | 手机页面刷新 |
|------|---------|-------------|
| 触发 | 用户发送消息 | 翻页/刷新/切换 Tab |
| 注入内容 | Pinia 全状态 + 格式化模板 | Pinia 全状态 + 页面硬编码提示词 |
| AI 返回 | 叙事正文 + `==mlife_data==` | 仅 `==mlife_data==` |
| 写入楼层 | ✅ 写入 | ❌ 不写入 |
| 写入 StoryPane | ✅ 显示 | ❌ 不显示 |
| 写入 Pinia | ✅ 更新 | ✅ 更新 |
| 缓存策略 | 无（完整对话） | 该页面数据缓存，切回不重复请求 |

### 2.3 页面刷新提示词（硬编码）

每个页面走独立 API 时注入的提示词，**直接提取自旧世界书 `UI模板_*.txt`**，格式转换参考第十五章字段映射。注入时在提示词末尾追加当前 Pinia 状态序列化。

> 注意：以下内容为 UI 模板的原始语义保留，**键值对名称和输出格式**将在第十五章统一映射为 `==mlife_data==` 行格式。

#### 首页刷新

来源：`UI模板_首页.txt` — 当{{user}}正在浏览M-life首页/信息流时。

```
生成 M-life 首页信息流动态，每次输出3-5条动态，动态类型随机混合：纯文字帖、图片帖、擦边帖、日常帖。

每条动态包含：
- 发帖人的真实状态和动机（隐藏描述，不显示在界面上）
- 头像
- 昵称
- 等级（Lv1-Lv5）
- VIP（无/白银/黄金/黑金）
- 发帖时间
- 板块（福利自拍/闲聊灌水/资源分享）
- 正文（口语化，符合成人社交软件氛围）
- 图片描述（具体描述拍摄角度穿着光线环境）
- 付费（无/需XX M币解锁）
- 点赞数、评论数、转发数
- 热评（可选，高互动帖附带1-2条）

多图帖用图片1、图片2...图片N区分。

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}
```

#### 匹配刷新

来源：`UI模板_约炮匹配.txt` — 当{{user}}正在使用约炮匹配功能时。

```
生成 M-life 匹配候选人卡片，每次展示1-3张。

每张卡片包含：
- 匹配对象的真实状态（照骗程度、注册时长、真实目的等）（隐藏描述）
- 头像
- 昵称
- VIP（无/白银/黄金/黑金）
- 年龄
- 距离（X.X km）
- 活跃状态（刚刚活跃/X分钟前/X小时前）
- 简介（口语化）
- 标签（从平台标签池选取）

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}
```

#### 匹配详情刷新

来源：`UI模板_匹配详情.txt` — 当{{user}}查看某张匹配卡片的详情时。

```
生成 M-life 匹配对象详情信息。

包含完整个人信息、多张照片、个人简介、标签。

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}
```

#### 直播列表刷新

来源：`UI模板_直播列表.txt` — 当{{user}}正在浏览直播列表时。

```
生成 M-life 直播列表，每次展示3-4个直播间摘要。

每个直播间包含：
- 主播真实状态（直播动机、平时做什么、真实性格等）（隐藏描述）
- 主播头像
- 主播昵称
- 主播等级（Lv1-Lv5）
- 观看人数
- 直播标题（口语化）
- 直播状态（正在直播/即将开播/回放）
- 预览（直播间当前画面摘要描述，50字以内：穿着、姿势、环境、正在做什么）

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}
```

#### 直播间刷新

来源：`UI模板_直播间.txt` — 当{{user}}进入某个直播间时。

```
生成 M-life 直播间详情内容。

包含主播信息、观看人数、直播状态、当前直播内容描述、弹幕。

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}
```

#### 私信联系人刷新

来源：`UI模板_私信联系人.txt` — 当{{user}}查看私信联系人列表时。

```
生成 M-life 私信联系人列表。

每个联系人包含：
- 头像
- 昵称
- 等级
- 最新消息摘要
- 最后消息时间
- 未读消息数

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}
```

#### 私信聊天刷新

来源：`UI模板_私信.txt` — 当{{user}}查看某个私信对话时。

```
生成 M-life 私信对话内容，按时间线排列。

每条消息包含：
- 发送方（对方/{{user}}）
- 发送时间
- 消息类型（文字/语音/图片）
- 消息内容（文字内容/语音转文字/图片描述）
- 对方发送消息时的状态描述（隐藏描述）
- 已读/未读状态

每条消息用分隔符分开，按时间线排列。

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}
```

#### 个人中心刷新

来源：`UI模板_个人中心.txt` — 当{{user}}查看自己的个人主页时。

```
生成 M-life 个人主页信息。

包含头像、昵称、等级、VIP、获赞数、粉丝数、关注数、M币余额、签到状态。

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}
```

#### 福利自拍刷新

来源：`UI模板_福利自拍.txt` — 当{{user}}浏览福利自拍板块时。

```
生成 M-life 福利自拍板块内容，每次输出多条帖子。

每条帖子包含：
- 发帖人信息（昵称、等级）
- 发帖时间
- 正文
- 图片描述
- 付费解锁价格
- 点赞数、评论数

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}
```

#### 闲聊灌水刷新

来源：`UI模板_闲聊灌水.txt` — 当{{user}}浏览闲聊灌水板块时。

```
生成 M-life 闲聊灌水板块内容，每次输出多条帖子。

每条帖子包含发帖人信息、正文、互动数据。

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}
```

#### 资源分享刷新

来源：`UI模板_资源分享.txt` — 当{{user}}浏览资源分享板块时。

```
生成 M-life 资源分享板块内容，每次输出多条帖子。

每条帖子包含发帖人信息、正文、资源链接、付费价格、互动数据。

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}
```

#### 女神夜话刷新

来源：`UI模板_女神夜话.txt` — 当{{user}}浏览女神夜话板块时。

```
生成 M-life 女神夜话板块内容，每次输出多条帖子。

每条帖子包含发帖人信息、正文、图片、付费价格、互动数据。

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}
```

#### 招募广场刷新

来源：`UI模板_黑金之选_招募广场.txt` — 当{{user}}进入黑金之选板块/浏览招募广场时。

```
生成 M-life 招募广场帖子列表，每次输出10-20条招募帖。

每条招募帖包含：
- 发布者真实意图、招募背景、当前报名情况（隐藏描述）
- 代号、信用分
- 类型图标（📍单人约会/👥多人聚会/🎭角色扮演/🔗道具play/📸摄影/👁露出任务/⛓调教/🔞特殊类型）
- 标题（15字以内）
- 报酬（M币/人）
- 标签
- 状态（招募中/已锁定）
- 报名人数

按发布时间倒序排列。已锁定状态标注锁定标识。

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}
```

#### 招募详情刷新

来源：`UI模板_黑金之选_招募详情.txt` — 当{{user}}查看某条招募帖的详情时。

```
生成 M-life 招募详情信息。

包含完整的招募内容、发布者信息、要求描述、当前报名列表。

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}
```

#### 发布招募结果刷新

来源：`UI模板_黑金之选_发布招募.txt` — 当{{user}}发布一条新招募后。

```
生成 M-life 招募发布结果通知。

包含发布状态、发布后的信息确认。

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}
```

#### 我的管理刷新

来源：`UI模板_黑金之选_我的管理.txt` — 当{{user}}查看自己发布的招募管理页时。

```
生成 M-life 我的招募管理列表。

列出所有已发布的招募帖及其当前状态、报名人数。

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}
```

#### 开盒刷新

来源：`UI模板_开盒.txt` — 当{{user}}对某个匹配对象执行开盒操作时。

```
生成 M-life 开盒资料信息。

包含对方真实身份信息：职业、三围、身高、身材、性格驱动、标签、敏感点、偏好。

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}
```

### 2.5 数据归宿

| 数据 | 存放位置 | 生命周期 | 说明 |
|------|---------|---------|------|
| 账号/M币/等级 | Pinia store.user | 页面会话 | 每轮注入给 AI |
| 帖子/匹配/直播 | Pinia store.social | 页面会话 | 每次重新生成 |
| 私信历史 | Pinia store.dm.contacts[].messages | 页面会话 | 完整对话 AI 可见 |
| 招募状态 | Pinia store.recruit | 页面会话 | 所有招募帖+状态 |
| 开盒资料 | Pinia store.dm.unboxCache | 页面会话 | 防重复扣费 |
| 已开盒 ID | Pinia + localStorage 快照 | 跨会话 | 见第七章 |
| 主题/球位置 | localStorage | 永久 | 纯 UI 偏好 |
| 叙事正文 | 酒馆消息楼层 | 永久 | 用户可见的唯一内容 |

**不需要的：**
- ❌ chat 级变量（无数据需跨楼层持久化）
- ❌ MVU stat_data（废弃）
- ❌ localStorage 存业务数据（仅关键字段快照见 7.1）
- ❌ 楼层中的结构化标记

### 2.6 私信发送链路

用户在私信聊天窗口输入消息 → 点发送 → 走 **完整对话**（`useMlifeInject`）：

```
用户在 DmChat.vue 输入消息 → 点发送
  ↓
① 组装 prompt = 当前 Pinia 全状态 + 格式化模板 + 用户输入
② 走酒馆 API 完整对话（写入消息楼层）
③ AI 回复叙事（描述对方回复的表情/语气/反应）+ ==mlife_data==
④ ==mlife_data== 中 [list:dm:{contactId}] 更新该联系人消息列表
⑤ 纯叙事写入楼层，消息列表更新到聊天窗口
```

> **注意**：私信发送是"用户发送消息"行为，必须走完整对话让 AI 推进叙事。不走页面刷新。

### 2.7 Toast 消息触发场景清单

| 场景 | Toast 文案 | 触发方 | 优先级 |
|------|-----------|--------|--------|
| 签到成功 | "签到成功 +XXX M币" | AI 完整对话返回 `[notice]` | 高 |
| 签到失败（已签到） | "今日已签到" | 前端本地判断 | 中 |
| 余额变动 | "获得/消费 XXX M币" | AI 完整对话/页面刷新返回 `[user] balance` | 低 |
| 等级提升 | "恭喜升级 LvX 🎉" | AI 返回 `[notice] type: levelup` | 高 |
| 匹配成功 | "有新的匹配对象！" | 页面刷新返回 `[list:match]` | 中 |
| 开盒成功 | "开盒成功！-50 M币" | 前端本地扣费后显示 | 高 |
| 开盒失败（余额不足） | "M币不足，无法开盒" | 前端本地判断 | 高 |
| 招募发布成功 | "招募发布成功" | AI 完整对话返回 `[recruit_post]` | 高 |
| 招募发布失败 | "发布失败：XXX" | AI 完整对话返回 `[recruit_post]` | 高 |
| 报名成功 | "已报名，等待发布者筛选" | 前端本地 | 中 |
| 网络错误 | "网络错误，请重试" | 前端 API 调用失败 | 高 |
| 操作失败 | "操作失败，请稍后再试" | 前端解析失败 | 低 |

### 2.8 数据块在回复中的位置

```
AI 实际回复：
──────────────────────────────
你打开 M-life，首页刷新出几条新动态：

晚安小鹿 Lv4 23:41
"睡不着 有人陪我聊天吗"
♥ 247 💬 89

打游戏的废物 Lv2 23:55
"有没有人一起开黑"
♥ 3 💬 1

==mlife_data==
[list:home]
--
nick: 晚安小鹿 | Lv4
time: 23:41
body: 睡不着 有人陪我聊天吗
likes: 247 | comments: 89
--
nick: 打游戏的废物 | Lv2
time: 23:55
body: 有没有人一起开黑
likes: 3 | comments: 1
--

[badges]
match: 1
==/mlife_data==
──────────────────────────────

用户看到的消息楼层：
──────────────────────────────
你打开 M-life，首页刷新出几条新动态：

晚安小鹿 Lv4 23:41
"睡不着 有人陪我聊天吗"
♥ 247 💬 89

打游戏的废物 Lv2 23:55
"有没有人一起开黑"
♥ 3 💬 1
──────────────────────────────
```

---

## 第三章：布局设计

### 3.1 PC 端（> 900px）— 右侧划入

```
┌────────────────────────────┬────────────────────────┐
│                            │                        │
│                            │   ← 💎 悬浮球触发     │
│   故事正文区域               │     右侧手机框滑入     │
│   (max-width: 520px)       │                        │
│                            │   M-life 手机界面       │
│   2025年9月15号，周一...     │   ┌────────────────┐  │
│                            │   │ 🔋 9:41   ☀️  │  │
│   ┌──────────────────┐     │   ├────────────────┤  │
│   │ AI 回复消息       │     │   │ M-life    🔔  │  │
│   └──────────────────┘     │   ├────────────────┤  │
│                            │   │                │  │
│   ┌──────────────────┐     │   │ 页面内容        │  │
│   │ 用户输入框 + 发送  │     │   │                │  │
│   └──────────────────┘     │   ├────────────────┤  │
│                            │   │ 🏠♡▶✉☺       │  │
│                            │   └────────────────┘  │
└────────────────────────────┴────────────────────────┘
```

| 元素 | 尺寸 |
|------|------|
| 故事正文 | max-width: 520px, 居中 |
| 手机框 | 375px × 100vh |
| 动画 | 300ms ease translateX |

**交互：**
- 点击 💎 → 手机框从右侧滑入
- 点击手机框外部 / ✕ → 手机框滑出
- 再次点击 💎 → 切换展开/收起

### 3.2 窄屏（500-900px）— 整页替换

```
默认：正文全屏
💎 点击 → 整页替换为 M-life（无故事区）
✕ 或 ← → 回到正文
```

### 3.3 移动端（< 500px）— 全屏沉浸

```
M-life 覆盖整个视口
顶部下滑 → 故事 Drawer 半屏展开
Drawer 下滑关闭 → 回到全屏手机
```

### 3.4 iframe 嵌入 — 紧凑入口

```
┌──────────────────────┐
│ 💎 [M-life 展开 ▸]    │
│                      │
│  ─── 动态预览 ──      │
│  帖子: 睡不着有人...   │
└──────────────────────┘

点击 → parent.$('body').load(GAME_URL) 全屏展开

**退出全屏**：设置页中提供"退出 M-life"按钮 → `parent.location.reload()` 回到酒馆页面。
```
```

### 3.5 响应式断点总表

| 断点 | 布局 | 手机框 | 故事区 | 输入框 |
|------|------|--------|--------|--------|
| > 900px | 左右双栏 | 右侧 375px | 居中 520px | 底部全宽 |
| 500-900px | 整页替换 | 💎 点击全屏 | 默认全宽 | 底部固定 |
| < 500px | 全屏沉浸 | 全屏覆盖 | Drawer 上滑 | Drawer 内 |
| iframe | 紧凑入口 | 仅展开按钮 | 片段预览 | 隐藏 |

---

## 第四章：路由与页面

### 4.1 路由表

| 路径 | 页面 | Tab |
|------|------|-----|
| `/home` | 🏠 首页信息流 | ✅ |
| `/match` | ♡ 匹配卡片 | ✅ |
| `/match/:id` | ♡ 匹配详情 | ❌ |
| `/live` | ▶ 直播列表 | ✅ |
| `/live/:id` | ▶ 直播间 | ❌ |
| `/dm` | ✉ 私信联系人 | ✅ |
| `/dm/:id` | ✉ 聊天窗口 | ❌ |
| `/profile` | ☺ 我的主页 | ✅ |
| `/profile/selfie` | 📸 日常自拍 | ❌ |
| `/profile/chat` | 💬 闲聊灌水 | ❌ |
| `/profile/resource` | 📦 资源分享 | ❌ |
| `/profile/goddess` | 👑 女神夜话 | ❌ |
| `/recruit` | 💎 招募广场 | ❌ |
| `/recruit/:id` | 💎 招募详情 | ❌ |
| `/recruit/post` | ✏️ 发布招募 | ❌ |
| `/recruit/manage` | 📊 我的管理 | ❌ |
| `/settings` | ⚙️ 设置 | ❌ |
| `/unbox/:id` | 🔓 开盒 | Modal |

### 4.2 底部导航（5 Tab）

```
🏠 首页  |  ♡ 匹配  |  ▶ 直播  |  ✉ 私信  |  ☺ 我的
```

- 子页面隐藏底部导航
- 私信 Tab 显示未读红点数字
- 匹配 Tab 在有新匹配时显示红点

### 4.3 招募操作完整链路

#### 用户发布招募

```
用户在 RecruitPost.vue 填写表单 → 点"发布"
  ↓
① 前端组装 prompt：
   - 当前 Pinia 全状态 + 格式化模板
   - 用户填写的表单数据（标题/类型/报酬/要求等）
② 走完整对话（useMlifeInject）
③ AI 回复叙事（描述发布过程/反应）+ ==mlife_data==
④ ==mlife_data== 中 [recruit_post] 返回发布结果
   result: success / failed
   message: 具体描述
⑤ 发布成功 → 刷新招募广场列表（走页面刷新）
   发布失败 → Toast 显示失败原因
```

#### 用户报名招募

```
用户在 RecruitDetail.vue 点"报名" → 弹确认框 → 确认
  ↓
① 前端本地操作：更新 store.recruit.detail.applicants + 1
② Toast 显示"已报名，等待发布者筛选"
③ 不需要走 API 请求，报名是一个本地操作
④ 下次完整对话时，AI 会收到变更后的招募状态
```

#### 用户取消招募（发布者取消自己的招募帖）

```
用户在 RecruitManage.vue 点"取消" → 弹确认框 → 确认
  ↓
① 前端组装 prompt：
   - "{{user}}取消了招募#{code}"
   - 当前 Pinia 全状态
② 走完整对话
③ AI 回复叙事（说明取消后的后果）+ ==mlife_data==
④ [recruit_manage] 更新该招募状态为"已取消"
```

#### 招募报名列表管理（发布者筛选应征者）

```
在招募详情底部查看报名列表
  ↓
① 报名列表走页面刷新（[recruit_detail] 中附带的 applicants 列表）
② 发布者点击某个应征者 → 走私信聊天（完整对话）
③ 发布者确认人选：
   → 前端发 prompt 告知 AI "确认应征者 XXX"
   → AI 回复叙事 + [recruit_detail] 更新状态为"已锁定"
```

---

## 第五章：==mlife_data== 数据块格式规范

### 5.1 总语法

```
==mlife_data==
字段名: 值
字段2: 值2

[section_name]
字段: 值
字段: 值

[list:page_type]
--
条目1字段: 值
条目1字段2: 值
--
条目2字段: 值
--

[badges]
tab名: 数字
==/mlife_data==
```

**规则：**
- `==mlife_data==` / `==/mlife_data==` 包裹
- 顶层字段直接 `key: value`
- `[section_name]` 命名段
- `[list:xxx]` 列表，`--` 分隔条目
- `[badges]` 底部 Tab 红点
- 坏一行跳一行，不崩 UI
- AI **只需输出有变化的部分**

### 5.2 所有数据块定义

#### 全局账号 `[user]`

**输入侧**（前端→AI，每次注入全部状态）：

```
账号: 残酷月光 | Lv3 | 白银VIP | M币: 370
经验: 480/600
签到: 已签 | 连续5天
获赞: 128 | 粉丝: 36 | 关注: 24
今日匹配: 2/3 | 今日发帖: 1/8
招募中: 1 | 已报名: 3
已开盒: xm001
```

**输出侧**（AI→前端，仅变更时输出）：

```
==mlife_data==
[user]
balance: 370
signin: 已签
signin_streak: 6
==/mlife_data==
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `account` | string | 完整格式：`昵称 \| LvX \| VIP \| M币: N` |
| `balance` | number | M币余额 |
| `exp` | string | `当前/上限` |
| `vip` | string | 无/白银/黄金/黑金 |
| `level` | string | Lv1-Lv5 |
| `signin` | string | 已签/未签 |
| `signin_streak` | number | 连续签到 |
| `likes` | number | 获赞总数 |
| `fans` | number | 粉丝数 |
| `following` | number | 关注数 |
| `match_today` | string | `已用/上限` |
| `post_today` | string | `已发/上限` |
| `recruit_active` | number | 招募中 |
| `recruit_applied` | number | 已报名 |
| `unboxed` | string | 逗号分隔 ID |

#### 首页帖子 `[list:home]`

```
==mlife_data==
[list:home]
--
nick: 晚安小鹿 | Lv4
time: 23:41
body: 睡不着 有人陪我聊天吗
image: 侧躺白吊带，暖黄灯光（可选）
paywall: 无（可选）
likes: 247
comments: 89
shares: 12（可选）
hot: 深夜猎手: 姐姐好美（可选，可重复）
--
nick: 打游戏的废物 | Lv2
time: 23:55
body: 有没有人一起开黑
likes: 3
comments: 1
--

[badges]
match: 1
dm: 3
==/mlife_data==
```

#### 匹配 `[list:match]`

```
==mlife_data==
[list:match]
--
nick: 小鹿乱撞 | 24岁 | 上海
level: Lv3
tags: 温柔, 旅行, 美食
bio: 喜欢摄影和美食
dist: 3km | 刚刚活跃（可选）
--
==/mlife_data==
```

#### 私信 `[list:dm:联系人ID]`

```
==mlife_data==
[list:dm:xm001]
--
role: outgoing
text: 晚上有空吗
--
role: incoming
text: 今晚有空呀，你想去哪里？
--

[badges]
dm: 1
==/mlife_data==
```

| 字段 | 值 |
|------|-----|
| `role` | `outgoing` 或 `incoming` |
| `text` | 消息文本 |

#### 直播列表 `[list:live]`

```
==mlife_data==
[list:live]
--
nick: 甜心宝贝 | Lv4
viewers: 2.3k
tag: 才艺
status: 🟢 直播中 | 已开播 1h
--
==/mlife_data==
```

#### 直播间 `[live_room]`

```
==mlife_data==
[live_room]
nick: 甜心宝贝
viewers: 2.3k
content: 正在唱一首情歌
--
danmaku: 主播好漂亮！🎉
==/mlife_data==
```

#### 招募 `[list:recruit]`

```
==mlife_data==
[list:recruit]
--
title: 周末约会女伴
poster: 小帅 | 💎黑金
budget: 30,000 M币/次
location: 上海 | 周六晚
tags: 温柔, 氛围感, 过夜
status: 招募中 | applicants: 3
--
==/mlife_data==
```

#### 开盒 `[unbox]`

```
==mlife_data==
[unbox]
id: xm001
nick: 小美
age: 26
job: 平面模特
level: Lv4

基本信息
职业: 平面模特
三围: 87-60-89

外表
身高: 168cm
身材: 纤瘦有料

性格
驱动: 渴望被关注
标签: 温柔 · 健谈

NSFW
敏感点: 耳后, 腰侧
偏好: 温柔主导
==/mlife_data==
```

#### 通知 `[notice]`

```
==mlife_data==
[notice]
type: signin          # signin / payment / levelup
result: 成功
balance: 370

[user]
balance: 370
signin: 已签
==/mlife_data==
```

#### 底部 Tab 红点 `[badges]`

`[badges]` 段由 AI 在完整对话或页面刷新时附带输出，前端解析后更新 NavBar 各 Tab 红点：

```
==mlife_data==
[badges]
match: 1
dm: 3
==/mlife_data==
```

| `[badges]` 字段 | 对应 Tab | 红点含义 |
|----------------|---------|---------|
| `match` | ♡ 匹配 | 新匹配候选人 |
| `dm` | ✉ 私信 | 未读消息数 |
| `recruit` | 💎 招募入口 | 招募状态变更通知 |

> **注意**：`[badges]` 只输出有变动的字段，`home`、`live`、`profile` Tab 不需要红点，AI 不应输出这些字段。

---

## 第六章：前端解析器

### 6.1 核心函数

```typescript
// 分离叙事与数据块
function splitResponse(text: string): { narrative: string; dataBlock: string | null } {
  const m = text.match(/==mlife_data==\n([\s\S]*?)\n==\/mlife_data==/)
  if (!m) return { narrative: text, dataBlock: null }
  return {
    narrative: text.replace(/==mlife_data==[\s\S]*?==\/mlife_data==/, '').trim(),
    dataBlock: m[1].trim()
  }
}

// 解析数据块 → 返回结构化更新
function parseMlifeData(block: string): DataUpdates {
  const updates: DataUpdates = {}
  let section = 'meta', listType = '', listItem: any = null

  for (const line of block.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue

    if (t === '--') {                          // 列表条目分隔
      if (listItem && listType) {
        ((updates[listType] ??= []) as any[]).push(listItem)
      }
      listItem = {}
      continue
    }

    const sectionMatch = t.match(/^\[(\w+(?::\w+)*)\]$/)
    if (sectionMatch) {
      // 收尾上一个 listItem
      if (listItem && listType) {
        ((updates[listType] ??= []) as any[]).push(listItem)
        listItem = null
      }
      listType = sectionMatch[1].startsWith('list') ? sectionMatch[1] : ''
      section = sectionMatch[1]
      continue
    }

    const ci = t.indexOf(': ')
    if (ci === -1) { section = t; continue }   // 纯文本段标题

    const k = t.slice(0, ci).trim(), v = t.slice(ci + 2).trim()
    if (listItem) { listItem[k] = v; continue }

    if (section === 'meta') { updates[k] = v; continue }

    ((updates[section] ??= {}) as Record<string, string>)[k] = v
  }

  // 收尾最后一个 listItem
  if (listItem && listType)
    ((updates[listType] ??= []) as any[]).push(listItem)

  return updates
}
```

### 6.2 容错

```
==mlife_data== 块解析失败 → 跳过数据块，保留叙事正文
  旧 Pinia 数据不变，用户看到叙事，手机界面保持上次成功数据
  不降级、不 mock、不崩溃

坏一行 → 跳一行
坏一个条目 → 跳一个条目
坏整个块 → 用户可重试
```

### 6.3 旧格式兼容

```typescript
function extractMlifeBlocks(text: string): MlifeBlock[] {
  const result: MlifeBlock[] = []

  // 1. 新格式 ==mlife_data==
  const r1 = /==mlife_data==\n([\s\S]*?)\n==\/mlife_data==/g
  let m: RegExpExecArray | null
  while ((m = r1.exec(text)) !== null)
    result.push({ format: 'line', content: m[1] })

  // 2. 旧格式 <mlife_app>JSON</mlife_app>（过渡期）
  const r2 = /<mlife_app>([\s\S]*?)<\/mlife_app>/gi
  while ((m = r2.exec(text)) !== null) {
    try { result.push({ format: 'json', content: JSON.parse(m[1]) }) } catch {}
  }

  return result
}
```

---

## 第七章：边界场景

### 7.1 前端刷新后 Pinia 清空

关键字段快照（仅 ~50 字节）：

```typescript
const SNAPSHOT_KEYS = ['balance', 'level', 'vip', 'unboxed']

function saveSnapshot() {
  localStorage.setItem('mlife_snap', JSON.stringify({
    balance: store.user.balance,
    level: store.user.level,
    vip: store.user.vip,
    unboxed: store.dm.unboxedIds,
  }))
}

function loadSnapshot() {
  try {
    const s = JSON.parse(localStorage.getItem('mlife_snap') || '{}')
    if (s.balance != null) store.user.balance = s.balance
    if (s.level) store.user.level = s.level
    if (s.vip) store.user.vip = s.vip
    if (s.unboxed) store.dm.unboxedIds = s.unboxed
  } catch {}
}
```

### 7.2 开盒扣费常量

| 常量 | 值 | 说明 |
|------|-----|------|
| 开盒费用 | **50 M币/次** | 每次开盒扣除 50 M币 |
| 扣费方式 | 前端本地扣除后更新 `store.user.balance` | 不依赖 AI 确认，前端直接扣 |
| 同步机制 | 下次完整对话/页面刷新时，AI 会收到变更后的余额 | AI 可在叙事中提及 |

### 7.3 已开盒防重复扣费

每次 generate 注入 `已开盒: xm001,xh003`。AI 开盒时前端检查 ID 是否已存在：

```typescript
async function onUnbox(id: string) {
  if (store.dm.unboxedIds.includes(id)) {
    if (store.dm.unboxCache[id]) return showUnbox(store.dm.unboxCache[id])
    // 缓存丢失 → 让 AI 重新返回开盒数据但不扣费
  }
  // 正常开盒流程...
}
```

---

## 第八章：组件树与状态矩阵

### 8.1 顶层组件

```
App.vue
├── StoryPane.vue               ← 故事正文（PC 模式）
│   ├── StoryContent.vue
│   ├── SkeletonBox.vue          ← 加载态
│   └── EmptyState.vue           ← 空态
├── PhoneFrame.vue               ← 手机模拟器框（PC 模式）
│   ├── PhoneStatusBar.vue
│   ├── PhoneHeader.vue
│   ├── NavBar.vue               ← 5 Tab
│   └── router-view
├── FloatingBall.vue             ← 💎 悬浮球
├── InputBar.vue                 ← 输入框（PC 模式）
├── StoryDrawer.vue              ← 故事 Drawer（移动端）
├── ToastProvider.vue            ← 全局提示
└── ConfirmModal.vue             ← 确认弹窗
```

### 8.2 页面组件

| 页面 | 组件 | 状态矩阵 |
|------|------|---------|
| 🏠 首页 | `HomePage.vue`, `PostCard.vue` | Loading→Skeleton / Empty→"还没有动态" / Error→重试 / Success→列表 |
| ♡ 匹配 | `MatchPage.vue`, `MatchCard.vue`, `MatchDetail.vue` | Loading→Skeleton / Empty→"今日已用完" / Success→卡片 / Matched→Toast |
| ▶ 直播 | `LiveList.vue`, `LiveRoom.vue`, `DanmakuArea.vue` | Loading→Skeleton / Empty→"无直播" / Error→重试 / Streaming→内容 |
| ✉ 私信 | `DmList.vue`, `DmChat.vue`, `MessageBubble.vue` | Loading→Skeleton / Empty→引导 / Success→列表/气泡 / Sending→发送中 / Error→重发 |
| ☺ 我的 | `ProfilePage.vue`, `SignInButton.vue`, `FeatureEntry.vue` | Loading→Skeleton / Success→主页 / Signed→已签 / VIPLocked→🔒 |
| 💎 招募 | `RecruitList.vue`, `RecruitDetail.vue`, `RecruitPost.vue`, `RecruitManage.vue` | Loading→Skeleton / Empty→"无招募" / FilteredEmpty→提示 / Form→校验 / Submitting→Loading |
| 🔓 开盒 | `UnboxModal.vue` | PriceConfirm→弹窗 / Unlocking→Spinner / Success→信息 / Error→余额不足 |

### 8.3 状态组件触发条件

| 状态 | 组件 | 触发条件 |
|------|------|---------|
| **Loading** | `SkeletonBox.vue` | 页面数据首次加载中（页面刷新 API 调用中），显示 shimmer 骨架屏 |
| **Empty** | `EmptyState.vue` | API 返回空数据。不同页面文案不同：首页→"还没有动态"、匹配→"今日已用完"、直播→"无直播"、私信→"没有联系人，去匹配吧"、招募→"暂无招募" |
| **Error** | `ErrorState.vue` | API 调用失败（网络超时/返回错误）。显示错误信息 + "重试"按钮。重试→重新调用页面刷新 API |
| **Success** | 页面内容 | 数据加载成功，渲染实际内容列表/卡片/详情 |
| **Sending** | 发送按钮置灰 + spinner | 用户在输入框点发送后，等待完整对话返回前 |
| **Submitting** | 表单按钮 loading | 发布招募/修改设置等提交操作进行中 |
| **VIPLocked** | 🔒 图标 + Toast | 用户尝试访问 VIP 功能但未达到对应等级 |
| **Matched** | Toast "匹配成功" | 匹配操作完成后短暂显示 |

---

## 第九章：AI Prompt 设计（世界书条目）

```yaml
- 名称: "M-life 数据输出格式"
  启用: true
  插入位置: 角色定义之后, 顺序 95
  激活策略: { 类型: 蓝灯 }
  内容: |
    ## M-life 结构化数据输出

    每次回复时，在正文末尾用 ==mlife_data== 包裹更新的数据。

    ### 格式
    ==mlife_data==
    [user]                 ← 账号变更（余额/签到/等级）
    balance: 370
    signin: 已签

    [list:home]            ← 首页帖子列表
    --
    nick: 晚安小鹿 | Lv4
    time: 23:41
    body: 睡不着 有人陪我聊天吗
    likes: 247 | comments: 89
    --

    [list:match]           ← 匹配候选人
    [list:live]            ← 直播列表
    [live_room]            ← 直播间
    [list:dm:联系人ID]     ← 私信消息（role: outgoing/incoming）
    [list:recruit]         ← 招募列表
    [unbox]                ← 开盒资料
    [notice]               ← 系统通知（签到/扣费/升级）
    [badges]               ← 底部红点
    ==/mlife_data==

    ### 规则
    - 每行一个 "字段名: 值"
    - 列表用 -- 分隔条目
    - 私信用 role: outgoing/incoming 标记方向
    - 只需输出有变化的部分

    ### 完整对话示例
    ==mlife_data==
    [user]
    balance: 370

    [badges]
    dm: 2
    ==/mlife_data==

    ### 手机页面刷新
    当用户切换 Tab、翻页或刷新页面时，AI 只返回 ==mlife_data== 数据块，不包含叙事正文。
    前端会注入当前 Pinia 状态 + 目标页面的内容提示词（见 2.3 节），AI 仅输出对应页面的结构化数据。
```

---

## 第十章：正则规则

仅需 2 条：

```yaml
# 1. 加载 SPA
- 名称: "[SPA] 加载 M-life 前端"
  启用: true
  查找: /<MlifeApp\s*\/>/g
  文件: 正则\MlifeApp
  作用于: 仅格式显示

# 2. 清理旧楼层
- 名称: "[清理]旧楼层"
  启用: true
  查找: /<StatusPlaceHolderImpl\s*\/>/g
  内容: ""
  作用于: 仅格式提示词
```

---

## 第十一章：主题系统

```css
:root, [data-theme="light"] {
  --ml-primary: #FF4757;
  --ml-bg: #FAFAFA;
  --ml-bg-card: #FFFFFF;
  --ml-bg-header: #FFFFFF;
  --ml-bg-input: #F5F5F5;
  --ml-phone-bg: #FFFFFF;
  --ml-phone-border: #E0E0E0;
  --ml-text: #1A1A1A;
  --ml-text-secondary: #8C8C8C;
  --ml-text-label: #BFBFBF;
  --ml-nav-bg: #FFFFFF;
  --ml-nav-active: #FF4757;
  --ml-nav-inactive: #BFBFBF;
}

[data-theme="dark"] {
  --ml-primary: #FF6B81;
  --ml-bg: #1A1A2E;
  --ml-bg-card: #16213E;
  --ml-bg-header: #16213E;
  --ml-phone-bg: #16213E;
  --ml-phone-border: #2A2A4A;
  --ml-text: #E8E8E8;
  --ml-text-secondary: #9E9E9E;
  --ml-nav-bg: #16213E;
  --ml-nav-active: #FF6B81;
  --ml-nav-inactive: #666666;
}
```

偏好存入 `localStorage('mlife_theme')`，Header 右侧 ☀️/🌙 切换。

---

## 第十二章：动画规范

| 场景 | 动画 | 时长 |
|------|------|------|
| 手机框滑入/出 | translateX | 300ms ease |
| 子页进入/返回 | translateX | 250ms |
| Modal | scale + opacity | 200ms |
| 点赞 | scale 1→1.3→1 | 400ms |
| 骨架屏 | shimmer 扫光 | 1.5s 循环 |
| Toast | 滑入→停留→滑出 | 3.6s |
| Drawer (移动) | translateY | 300ms ease |

---

## 第十三章：实施路线

### Phase 1：框架（3-5 天）

| # | 任务 |
|---|------|
| 1.1 | 脚手架：index.ts, index.html, App.vue, global.css |
| 1.2 | Pinia Store：user, social, dm, recruit, app |
| 1.3 | 核心布局：App.vue（PC 双栏+手机框+悬浮球）+ 响应式 |
| 1.4 | Vue Router + 所有路由 + NavBar |
| 1.5 | 主题系统：CSS 变量 + 切换逻辑 |
| 1.6 | 解析器：splitResponse / parseMlifeData |
| 1.7 | 通用组件：SkeletonBox, EmptyState, ErrorState, Toast, ConfirmModal |
| 1.8 | 酒馆 API 封装：独立页面刷新请求模块 + 页面提示词注入 |
| 1.9 | 正则 + 加载链路验证 |

### Phase 2：核心页面（5-7 天）

| # | 页面 | 天 |
|---|------|----|
| 2.1 | 🏠 首页（HomePage + PostCard + 状态矩阵） | 1.5 |
| 2.2 | ♡ 匹配（MatchPage + MatchCard + MatchDetail） | 1.5 |
| 2.3 | ▶ 直播（LiveList + LiveRoom + 弹幕） | 1.5 |
| 2.4 | ✉ 私信（DmList + DmChat + MessageBubble） | 2 |
| 2.5 | ☺ 我的（ProfilePage + 签到 + 功能入口） | 1 |

### Phase 3：复杂功能（3-4 天）

| # | 功能 | 天 |
|---|------|----|
| 3.1 | 💎 招募广场 + 详情 + 发布表单 | 2 |
| 3.2 | 💎 我的管理 + 应征操作 | 1 |
| 3.3 | 🔓 开盒 Modal + 防重复扣费 | 0.5 |
| 3.4 | 子页面 + 导航集成 | 1 |

### Phase 4：打磨（2-3 天）

| # | 任务 |
|---|------|
| 4.1 | 移动端 Drawer + 手势 + 全屏 |
| 4.2 | 动画集成 |
| 4.3 | 本地快照 + 刷新恢复 |
| 4.4 | 全屏展开 + iframe 适配 |
| 4.5 | 旧格式兼容测试 |

### 总计：13-19 天

---

## 第十四章：世界书与前端模板的关系

### 14.1 旧世界书的处理方式

旧世界书的 18 个 `UI模板_*.txt` 中的**字段定义**被提取到前端硬编码的格式化模板中，输出格式统一转换为 `==mlife_data==` 行格式。

旧世界书文件本身**保留在目录中**（供参考或回退），但前端不再依赖它们：

```
旧世界书 UI模板_*.txt           前端硬编码（格式转换）
─────────────────               ─────────────────
UI模板_首页.txt 中的字段定义  ──→ [list:home] 模板（==mlife_data== 格式）
UI模板_私信.txt 中的字段定义   ──→ [list:dm:xxx] 模板（==mlife_data== 格式）
UI模板_约炮匹配.txt 中的字段定义 ──→ [list:match] 模板（==mlife_data== 格式）
...                            ...
```

### 14.2 数据流（旧）

```
旧世界书 UI模板_*.txt  ← 教 AI 字段定义 + UI 渲染格式（XML 标签）
                            ↓
AI 输出 <mlife_home>...</mlife_home>  ← XML 格式
                            ↓
旧前端解析 XML → 渲染 UI
```

### 14.3 数据流（新）

```
前端硬编码格式化模板    ← 把当前 Pinia 数据按 ==mlife_data== 格式注入给 AI
                            ↓
AI 输出 ==mlife_data==  ← AI 按注入的格式生成
                            ↓
前端解析 → 渲染 UI
```

### 14.4 用户修改模板后的影响

用户在前端设置页修改格式化模板后：
- 修改后的模板存到 `localStorage`
- 前端注入 AI 时使用新格式
- 世界书不需要同步更新

### 14.5 世界书文件清单

Mind 保留的内容策略/行为文件，UI 模板文件保留供参考：

```
E:\tavern_sync_project\角色卡修改用\M-life\世界书\
├── M-life.txt                    ← 世界观
├── 高富帅版{{user}}.txt          ← 角色设定
├── 高富帅版{{user}}的家.txt       ← 角色设定
├── 正常版{{user}}.txt            ← 角色设定
├── 正常版{{user}}的家.txt         ← 角色设定
├── 女性约炮行为逻辑.txt           ← AI 行为
├── 角色生成模板.txt               ← 角色模板
├── 女神夜话.txt                  ← 女神规则
├── 真实性行为规则.txt             ← 成人规则
├── 黑金之选.txt                  ← 招募规则
├── 骚话文风.txt                  ← 文风
├── 体态文风.txt                  ← 文风
├── UI模板_首页.txt               ← 参考（字段已提取到前端）
├── UI模板_约炮匹配.txt            ← 参考
├── UI模板_匹配详情.txt            ← 参考
├── UI模板_直播列表.txt            ← 参考
├── UI模板_直播间.txt              ← 参考
├── UI模板_私信.txt               ← 参考
├── UI模板_私信联系人.txt          ← 参考
├── UI模板_个人中心.txt            ← 参考
├── UI模板_福利自拍.txt            ← 参考
├── UI模板_闲聊灌水.txt            ← 参考
├── UI模板_资源分享.txt            ← 参考
├── UI模板_女神夜话.txt            ← 参考
├── UI模板_黑金之选_招募广场.txt    ← 参考
├── UI模板_黑金之选_招募详情.txt    ← 参考
├── UI模板_黑金之选_发布招募.txt    ← 参考
├── UI模板_黑金之选_我的管理.txt    ← 参考
├── UI模板_开盒.txt               ← 参考
├── mlife输出格式约束.txt          ← 新增：==mlife_data== 格式规范
```

### 14.6 废弃的文件（可删除）

以下文件与**酒馆变量系统**相关，新架构下数据完全由前端 Pinia 管理 + 直接注入酒馆，不再需要这些变量文件：

```
变量列表.yaml                 ← 废弃，前端直接注入
[mvu_update]变量更新规则.yaml  ← 废弃，前端直接注入
[mvu_update]变量输出格式.yaml  ← 废弃，前端直接注入
[initvar]变量初始化勿开.yaml   ← 废弃，前端直接注入
[mvu_update]变量输出格式强调.yaml ← 废弃，前端直接注入
```

### 14.7 新增世界书

新增 `mlife输出格式约束.txt`，内容为 `==mlife_data==` 行格式规范（对应产品文档第五章），**只教 AI 如何输出结构化数据，不包含 UI 渲染描述**。

---

## 第十五章：格式化模板系统

### 15.1 设计原则

- **硬编码默认值** — 所有格式化模板写死在代码中，零配置即可运行
- **localStorage 覆写** — 用户可修改任意页面的模板，刷新后持久保留
- **按需独立覆盖** — 只存有修改的页面，未修改的用默认值

### 15.2 默认模板全集

以下模板硬编码在 `src/constants/formatTemplates.ts` 中，`{变量}` 占位符在运行时替换为实际数据。

**字段来源**：从旧世界书 UI 模板提取所有字段定义，保留完整数据语义。
**输出格式**：统一使用 `==mlife_data==` 行格式（`字段名: 值`），废弃旧的 `<mlife_xxx>` XML 标签格式。

#### 首页 `[list:home]` — 来源：`UI模板_首页.txt`

旧世界书字段 → 新格式映射：
- `[头像]` → `avatar`
- `[昵称]` → `nick`
- `[等级]` → `level`
- `[VIP]` → `vip`
- `[时间]` → `time`
- `[板块]` → `section`
- `[正文]` → `body`
- `[图片]` → `image`
- `[付费]` → `paywall`
- `[点赞]` → `likes`
- `[评论]` → `comments`
- `[转发]` → `shares`
- `[热评1]`/`[热评2]` → `hot`

输出模板：
```
[list:home]
--
nick: {nick} | Lv{level} | {vip}
avatar: {avatar}
time: {time}
section: {section}
body: {body}
image: {image}
paywall: {paywall}
likes: {likes}
comments: {comments}
shares: {shares}
hot: {hot}
--
```

多图时追加 `image2`, `image3`...`imageN`。

#### 匹配 `[list:match]` — 来源：`UI模板_约炮匹配.txt`

旧世界书字段 → 新格式映射：
- `[头像]` → `avatar`
- `[昵称]` → `nick`
- `[VIP]` → `vip`
- `[年龄]` → `age`
- `[距离]` → `dist`
- `[活跃]` → `active`
- `[简介]` → `bio`
- `[标签]` → `tags`

输出模板：
```
[list:match]
--
nick: {nick} | {age}岁 | {city}
avatar: {avatar}
level: Lv{level}
vip: {vip}
tags: {tags}
bio: {bio}
dist: {dist} | {active}
--
```

#### 匹配详情 `[match_detail]` — 来源：`UI模板_匹配详情.txt`

输出模板：
```
[match_detail]
nick: {nick}
avatar: {avatar}
level: Lv{level}
vip: {vip}
age: {age}
city: {city}
dist: {dist}
active: {active}
bio: {bio}
tags: {tags}
photos: {photos}
```

#### 私信 `[list:dm:{contactId}]` — 来源：`UI模板_私信.txt`

旧世界书字段 → 新格式映射：
- `[来]` → `role: incoming`
- `[去]` → `role: outgoing`
- `[对方|昵称|等级|头像emoji]` → 联系人元信息

输出模板：
```
[list:dm:{contactId}]
--
role: {role}
time: {time}
type: {type}
text: {text}
--
```

`type` 为 `text` / `voice` / `image`。语音消息追加 `duration` 字段，图片消息追加 `desc` 字段。

#### 私信联系人列表 `[list:dm_contacts]` — 来源：`UI模板_私信联系人.txt`

输出模板：
```
[list:dm_contacts]
--
nick: {nick} | Lv{level}
avatar: {avatar}
last_msg: {last_msg}
last_time: {last_time}
unread: {unread}
--
```

#### 直播列表 `[list:live]` — 来源：`UI模板_直播列表.txt`

旧世界书字段 → 新格式映射：
- `[主播头像]` → `avatar`
- `[主播昵称]` → `nick`
- `[主播等级]` → `level`
- `[观看人数]` → `viewers`
- `[直播标题]` → `title`
- `[直播状态]` → `status`
- `[预览]` → `preview`

输出模板：
```
[list:live]
--
nick: {nick} | Lv{level}
avatar: {avatar}
viewers: {viewers}
title: {title}
status: {status}
preview: {preview}
--
```

#### 直播间 `[live_room]` — 来源：`UI模板_直播间.txt`

输出模板：
```
[live_room]
nick: {nick}
avatar: {avatar}
viewers: {viewers}
status: {status}
content: {content}
--
danmaku: {danmaku}
```

#### 招募广场 `[list:recruit]` — 来源：`UI模板_黑金之选_招募广场.txt`

旧世界书字段 → 新格式映射：
- `[代号]` → `code`
- `[信用分]` → `credit`
- `[类型图标]` → `type`
- `[标题]` → `title`
- `[报酬]` → `budget`
- `[标签]` → `tags`
- `[状态]` → `status`
- `[报名人数]` → `applicants`

输出模板：
```
[list:recruit]
--
title: {title}
poster: {code} | 💎{vip}
credit: {credit}
type: {type}
budget: {budget}
location: {location} | {time}
tags: {tags}
status: {status} | applicants: {applicants}
--
```

#### 招募详情 `[recruit_detail]` — 来源：`UI模板_黑金之选_招募详情.txt`

输出模板：
```
[recruit_detail]
code: {code}
credit: {credit}
type: {type}
title: {title}
budget: {budget}
location: {location}
time: {time}
tags: {tags}
status: {status}
applicants: {applicants}
description: {description}
requirements: {requirements}
```

#### 发布招募 `[recruit_post]` — 来源：`UI模板_黑金之选_发布招募.txt`

输出模板：
```
[recruit_post]
result: {result}
message: {message}
```

#### 我的管理 `[recruit_manage]` — 来源：`UI模板_黑金之选_我的管理.txt`

输出模板：
```
[list:recruit_manage]
--
code: {code}
title: {title}
type: {type}
status: {status}
applicants: {applicants}
--
```

#### 个人中心 `[profile]` — 来源：`UI模板_个人中心.txt`

输出模板：
```
[profile]
nick: {nick}
avatar: {avatar}
level: Lv{level}
vip: {vip}
signin: {signin}
signin_streak: {signin_streak}
likes: {likes}
fans: {fans}
following: {following}
balance: {balance}
```

#### 福利自拍 `[list:selfie]` — 来源：`UI模板_福利自拍.txt`

输出模板：
```
[list:selfie]
--
nick: {nick} | Lv{level}
avatar: {avatar}
time: {time}
body: {body}
images: {images}
paywall: {paywall}
likes: {likes}
comments: {comments}
--
```

#### 闲聊灌水 `[list:chat]` — 来源：`UI模板_闲聊灌水.txt`

输出模板：
```
[list:chat]
--
nick: {nick} | Lv{level}
avatar: {avatar}
time: {time}
body: {body}
likes: {likes}
comments: {comments}
--
```

#### 资源分享 `[list:resource]` — 来源：`UI模板_资源分享.txt`

输出模板：
```
[list:resource]
--
nick: {nick} | Lv{level}
avatar: {avatar}
time: {time}
body: {body}
resource: {resource}
paywall: {paywall}
likes: {likes}
comments: {comments}
--
```

#### 女神夜话 `[list:goddess]` — 来源：`UI模板_女神夜话.txt`

输出模板：
```
[list:goddess]
--
nick: {nick} | Lv{level}
avatar: {avatar}
time: {time}
body: {body}
image: {image}
paywall: {paywall}
likes: {likes}
comments: {comments}
--
```

#### 开盒 `[unbox]` — 来源：`UI模板_开盒.txt`

输出模板：
```
[unbox]
id: {id}
nick: {nick}
age: {age}
job: {job}
level: Lv{level}

基本信息
occupation: {occupation}
measurements: {measurements}

外表
height: {height}
figure: {figure}

性格
drive: {drive}
tags: {tags}

NSFW
sensitive: {sensitive}
preference: {preference}
```

#### 账号 `[user]`

输出模板：
```
[user]
account: {account}
balance: {balance}
exp: {exp}
vip: {vip}
signin: {signin}
signin_streak: {signin_streak}
likes: {likes}
fans: {fans}
following: {following}
match_today: {match_today}
post_today: {post_today}
recruit_active: {recruit_active}
recruit_applied: {recruit_applied}
unboxed: {unboxed}
```

### 15.2.1 字段映射总表

| 旧世界书字段 | 新格式字段 | 来源文件 |
|-------------|-----------|---------|
| `[头像]` | `avatar` | 首页/匹配/私信联系人 |
| `[昵称]` | `nick` | 全部 |
| `[等级]` | `level` | 首页/匹配/个人中心/直播 |
| `[VIP]` | `vip` | 首页/匹配 |
| `[时间]` | `time` | 首页/私信 |
| `[板块]` | `section` | 首页 |
| `[正文]` | `body` | 首页/自拍/闲聊/资源/女神 |
| `[图片]` | `image` | 首页/女神 |
| `[付费]` | `paywall` | 首页/自拍/资源/女神 |
| `[点赞]` | `likes` | 首页/自拍/闲聊/资源/女神 |
| `[评论]` | `comments` | 首页/自拍/闲聊/资源/女神 |
| `[转发]` | `shares` | 首页 |
| `[热评1]`/`[热评2]` | `hot` | 首页 |
| `[年龄]` | `age` | 匹配 |
| `[距离]` | `dist` | 匹配 |
| `[活跃]` | `active` | 匹配 |
| `[简介]` | `bio` | 匹配 |
| `[标签]` | `tags` | 匹配/招募 |
| `[来]`/`[去]` | `role: incoming/outgoing` | 私信 |
| `[主播头像]` | `avatar` | 直播列表 |
| `[主播昵称]` | `nick` | 直播列表 |
| `[主播等级]` | `level` | 直播列表 |
| `[观看人数]` | `viewers` | 直播列表/直播间 |
| `[直播标题]` | `title` | 直播列表 |
| `[直播状态]` | `status` | 直播列表/直播间 |
| `[预览]` | `preview` | 直播列表 |
| `[代号]` | `code` | 招募 |
| `[信用分]` | `credit` | 招募 |
| `[类型图标]` | `type` | 招募 |
| `[标题]` | `title` | 招募 |
| `[报酬]` | `budget` | 招募 |
| `[状态]` | `status` | 招募 |
| `[报名人数]` | `applicants` | 招募 |



### 15.3 localStorage 存储结构

```typescript
// 键名规则：mlife_format_{page}
// 值：完整的模板字符串

// 示例
localStorage.setItem('mlife_format_home', `[list:home]
--
nick: {nick} | Lv{level}
time: {time}
body: {body}
likes: {likes} | comments: {comments}
--`)

// 只存有修改的页面，未修改的页面不存
```

### 15.4 读取优先级

```typescript
function getFormatTemplate(page: string): string {
  // 1. 优先读 localStorage 用户自定义
  const custom = localStorage.getItem(`mlife_format_${page}`)
  if (custom) return custom

  // 2. 回退到硬编码默认值
  return DEFAULT_FORMAT_TEMPLATES[page]
}
```

### 15.5 配置界面入口

位于 **☺ 我的 → ⚙️ 设置 → 格式化模板**：

```
┌──────────────────────────────────┐
│  ← 设置                          │
│                                  │
│  格式化模板配置                   │
│                                  │
│  页面: [首页 ▼]                  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ [list:home]                 │  │
│  │ --                          │  │
│  │ nick: {nick} | Lv{level}   │  │
│  │ time: {time}                │  │
│  │ body: {body}                │  │
│  │ likes: {likes} | comments:  │  │
│  │ --                          │  │
│  └────────────────────────────┘  │
│                                  │
│  [恢复默认]           [保存]     │
│                                  │
│  💡 提示：{变量} 在运行时替换    │
│  为实际数据。可用变量见右侧说明。 │
└──────────────────────────────────┘
```

### 15.6 刷新恢复流程

```
页面刷新 → Pinia 清空
  ↓
loadSnapshot() → 恢复账号关键字段（balance/level/vip/unboxed）
  ↓
loadFormatTemplates() → 从 localStorage 读取用户自定义模板
  ↓
取不到时用 DEFAULT_FORMAT_TEMPLATES 中的默认值
  ↓
UI 恢复就绪
```

### 15.7 涉及的代码文件

| 文件 | 职责 |
|------|------|
| `src/constants/formatTemplates.ts` | 全部默认模板常量 |
| `src/stores/app.ts` | 添加 `formatTemplates` 状态 + `loadFormatTemplates()` / `saveFormatTemplate()` / `resetFormatTemplate()` |
| `src/composables/useMlifeInject.ts` | 注入 AI 时调用 `getFormatTemplate()` 渲染 |
| `src/utils/formatRenderer.ts` | 模板引擎：`{变量}` 占位符替换 + 多条目循环 |
| `src/views/settings/FormatTemplateEditor.vue` | 配置界面 UI |
| `src/views/SettingsPage.vue` | 添加"格式化模板"入口 |

### 15.8 与第九章世界书的关系

- 世界书条目 `mlife输出格式约束.txt` 负责**教 AI 理解格式**（给 AI 看）
- 前端模板负责**把当前数据格式化成 AI 能读的输入**（给 AI 喂）
- 两者格式一致，前端模板是"实际数据填充版"，世界书是"格式说明版"
- 用户修改前端模板后，建议同步更新世界书条目，否则 AI 可能看不懂自定义格式

---

## 第十六章：所有页面完整玩法闭环链路

本章梳理 M-life 每个功能页面的**完整用户操作链路**，从用户触发操作开始，到最终 UI 反馈结束，涵盖所有分支路径。

---

### 16.1 🏠 首页信息流

```
用户进入首页（/home）
  │
  ├─ 首次进入 → 走页面刷新 → 请求 AI 生成帖子列表
  │     ↓
  │   Loading → SkeletonBox 骨架屏
  │     ↓
  │   ┌─ Success → 渲染帖子列表（PostCard）
  │   │     ↓
  │   │   用户点击帖子 → 无操作（首页帖子不可点击，仅展示）
  │   │   用户点击帖子内图片描述 → 弹窗展示图片描述文本
  │   │   用户点击帖子点赞/评论 → 发完整对话（推进叙事）
  │   │
  │   ├─ Empty → EmptyState "还没有动态"
  │   │     ↓
  │   │   用户下拉刷新 → 重新走页面刷新
  │   │
  │   └─ Error → ErrorState 错误信息 + 重试按钮
  │         ↓
  │       用户点重试 → 重新走页面刷新
  │
  ├─ 切换 Tab 再切回 → 检查缓存
  │     ├─ 缓存未过期（5分钟内） → 直接渲染
  │     └─ 缓存已过期 → 重新走页面刷新
  │
  └─ 用户下拉刷新 → 清除该页缓存 → 走页面刷新
```

**数据流**：
- 页面刷新：`[list:home]` → 更新 `store.social.posts`
- 完整对话：AI 在叙事中提及帖子内容，`[list:home]` 可选更新
- 点赞/评论操作：走完整对话，AI 回复叙事中描述互动结果

---

### 16.2 ♡ 匹配（含匹配详情）

```
用户进入匹配页（/match）
  │
  ├─ 首次进入 → 走页面刷新 → 请求 AI 生成候选人卡片
  │     ↓
  │   Loading → SkeletonBox
  │     ↓
  │   ┌─ Success → 渲染匹配卡片列表（MatchCard）
  │   │     ↓
  │   │   用户点击某张卡片 → 跳转 /match/:id
  │   │     ↓
  │   │   ┌─ 走页面刷新 → 请求 AI 生成匹配详情
  │   │   │     ↓
  │   │   │   Loading → SkeletonBox
  │   │   │     ↓
  │   │   │   ┌─ Success → 渲染匹配详情（MatchDetail）
  │   │   │   │     ↓
  │   │   │   │   ├─ 用户点"发送消息" → 跳转 /dm/:id（私信聊天）
  │   │   │   │   ├─ 用户点"开盒" → 见 16.6 开盒链路
  │   │   │   │   └─ 用户点"返回" → 回到 /match
  │   │   │   │
  │   │   │   ├─ Empty → 数据异常，返回列表
  │   │   │   └─ Error → ErrorState + 重试
  │   │   │
  │   │   └─ 缓存命中 → 直接渲染
  │   │
  │   ├─ Empty → EmptyState "今日已用完"
  │   │     ↓
  │   │   （今日匹配次数耗尽，等待 AI 重置或明日）
  │   │
  │   └─ Error → ErrorState + 重试
  │
  ├─ 缓存命中 → 直接渲染
  │
  └─ 用户下拉刷新 → 清除缓存 → 走页面刷新
```

**数据流**：
- 页面刷新（匹配列表）：`[list:match]` → `store.social.matches`
- 页面刷新（匹配详情）：`[match_detail]` → `store.social.matchDetail`
- 匹配次数：`store.user.match_today`（如 `2/3`），前端本地计数
- 发送消息：跳转 `/dm/:id` → 走私信聊天链路

---

### 16.3 ▶ 直播（含直播间）

```
用户进入直播列表（/live）
  │
  ├─ 首次进入 → 走页面刷新 → 请求 AI 生成直播列表
  │     ↓
  │   Loading → SkeletonBox
  │     ↓
  │   ┌─ Success → 渲染直播列表（LiveList）→ 每个直播间卡片
  │   │     ↓
  │   │   用户点击某直播间 → 跳转 /live/:id
  │   │     ↓
  │   │   ┌─ 走页面刷新 → 请求 AI 生成直播间详情
  │   │   │     ↓
  │   │   │   Loading → SkeletonBox
  │   │   │     ↓
  │   │   │   ┌─ Success → 渲染直播间（LiveRoom）
  │   │   │   │     ↓
  │   │   │   │   ├─ 用户发送弹幕 → 发完整对话（"用户发了弹幕：XXX"）
  │   │   │   │   │     ↓
  │   │   │   │   │   AI 回复叙事（主播反应）+ [live_room] 更新弹幕列表
  │   │   │   │   │
  │   │   │   │   ├─ 用户点"送礼" → 发完整对话（"用户送了 XXX"）
  │   │   │   │   │     ↓
  │   │   │   │   │   AI 回复叙事 + [user] 扣减余额
  │   │   │   │   │
  │   │   │   │   └─ 用户点"返回" → 回到 /live
  │   │   │   │
  │   │   │   ├─ Empty → 数据异常，返回列表
  │   │   │   └─ Error → ErrorState + 重试
  │   │   │
  │   │   └─ 缓存命中 → 直接渲染
  │   │
  │   ├─ Empty → EmptyState "无直播"
  │   └─ Error → ErrorState + 重试
  │
  ├─ 缓存命中 → 直接渲染
  │
  └─ 用户下拉刷新 → 清除缓存 → 走页面刷新
```

**数据流**：
- 页面刷新（直播列表）：`[list:live]` → `store.social.liveList`
- 页面刷新（直播间）：`[live_room]` → `store.social.liveRoom`
- 弹幕/送礼：走完整对话，AI 更新叙事 + 数据块

---

### 16.4 ✉ 私信（含聊天窗口）

```
用户进入私信联系人列表（/dm）
  │
  ├─ 首次进入 → 走页面刷新 → 请求 AI 生成联系人列表
  │     ↓
  │   Loading → SkeletonBox
  │     ↓
  │   ┌─ Success → 渲染联系人列表（DmList）
  │   │     ↓
  │   │   用户点击某个联系人 → 跳转 /dm/:id
  │   │     ↓
  │   │   ┌─ 首次进入该聊天 → 走页面刷新 → 请求 AI 生成聊天历史
  │   │   │     ↓
  │   │   │   Loading → SkeletonBox 消息列表
  │   │   │     ↓
  │   │   │   ┌─ Success → 渲染消息气泡列表（MessageBubble）
  │   │   │   │     ↓
  │   │   │   │   ├─ 用户在输入框输入消息 → 点发送
  │   │   │   │   │     ↓
  │   │   │   │   │   ┌─ 走完整对话
  │   │   │   │   │   │  ① 组装 prompt = 当前 Pinia 全状态 + 格式化模板 + 用户输入
  │   │   │   │   │   │  ② 走酒馆 API 完整对话
  │   │   │   │   │   │  ③ AI 回复叙事（描述对方回复）+ ==mlife_data==
  │   │   │   │   │   │  ④ [list:dm:contactId] 更新消息列表
  │   │   │   │   │   │  ⑤ 纯叙事写入楼层，消息列表更新到聊天窗口
  │   │   │   │   │   │
  │   │   │   │   │   └─ Sending 状态 → 发送按钮置灰 + spinner
  │   │   │   │   │        ↓
  │   │   │   │   │      Success → 消息气泡出现 + 发送按钮恢复
  │   │   │   │   │      Error → Toast "发送失败"
  │   │   │   │   │
  │   │   │   │   ├─ 用户点"开盒" → 见 16.6 开盒链路
  │   │   │   │   └─ 用户点"返回" → 回到 /dm
  │   │   │   │
  │   │   │   ├─ Empty → EmptyState "暂无消息，打个招呼吧"
  │   │   │   └─ Error → ErrorState + 重试
  │   │   │
  │   │   └─ 缓存命中 → 直接渲染历史消息
  │   │
  │   ├─ Empty → EmptyState "没有联系人，去匹配吧"
  │   └─ Error → ErrorState + 重试
  │
  └─ 缓存命中 → 直接渲染
```

**数据流**：
- 页面刷新（联系人列表）：`[list:dm_contacts]` → `store.dm.contacts`
- 页面刷新（聊天历史）：`[list:dm:{contactId}]` → `store.dm.contacts[].messages`
- 发送消息：走完整对话，AI 返回 `[list:dm:{contactId}]` 更新消息
- 红点：`[badges] dm: N` → NavBar 私信 Tab 显示未读数

---

### 16.5 ☺ 我的主页（含子页签）

```
用户进入个人主页（/profile）
  │
  ├─ 首次进入 → 走页面刷新 → 请求 AI 生成个人资料
  │     ↓
  │   Loading → SkeletonBox
  │     ↓
  │   ┌─ Success → 渲染个人主页（ProfilePage）
  │   │     ↓
  │   │   ├─ 用户点"签到" → 走完整对话
  │   │   │     ↓
  │   │   │   ┌─ 前端本地检查：今日是否已签到
  │   │   │   │   ├─ 已签到 → Toast "今日已签到"（不走 API）
  │   │   │   │   └─ 未签到 → 继续
  │   │   │   │
  │   │   │   ├─ 组装 prompt = "{{user}}点击了签到" + 当前 Pinia 全状态
  │   │   │   ├─ 走完整对话
  │   │   │   ├─ AI 回复叙事 + [notice] type: signin + [user] 更新余额和签到状态
  │   │   │   ├─ 前端解析 → 更新 Pinia
  │   │   │   ├─ Toast "签到成功 +XXX M币"
  │   │   │   └─ SignInButton 更新为"已签"
  │   │   │
  │   │   ├─ 用户点"我的帖子" → 跳转 /profile/selfie
  │   │   │     ↓
  │   │   │   走页面刷新 → 渲染帖子列表（PostCard，使用 selfie 数据）
  │   │   │
  │   │   ├─ 用户点"闲聊" → 跳转 /profile/chat
  │   │   ├─ 用户点"资源" → 跳转 /profile/resource
  │   │   ├─ 用户点"女神" → 跳转 /profile/goddess
  │   │   ├─ 用户点"招募管理" → 跳转 /recruit/manage
  │   │   └─ 用户点"设置" → 跳转 /settings
  │   │
  │   ├─ Empty → 数据异常，重新请求
  │   └─ Error → ErrorState + 重试
  │
  └─ 缓存命中 → 直接渲染
```

**数据流**：
- 页面刷新（个人主页）：`[profile]` → `store.user`（部分字段）
- 签到：走完整对话，AI 返回 `[notice]` + `[user]` 更新
- 子页签（selfie/chat/resource/goddess）：走页面刷新，各自用对应模板
- 招募管理：见 16.7 链路

---

### 16.6 🔓 开盒

```
用户在匹配详情（/match/:id）或私信聊天（/dm/:id）中点"开盒"
  │
  ├─ 前端检查：是否已开盒过该 ID
  │     ↓
  ├─ 已开盒（store.dm.unboxedIds.includes(id)）
  │     ↓
  │   ┌─ store.dm.unboxCache[id] 存在 → 直接显示开盒信息（不扣费）
  │   └─ 缓存丢失 → 走页面刷新，请求 AI 重新返回开盒数据（不扣费）
  │
  └─ 未开盒
        ↓
      ConfirmModal 弹窗："开盒需要 50 M币，是否继续？"
        ↓
      ┌─ 用户取消 → 关闭弹窗，不做任何操作
      │
      └─ 用户确认
            ↓
          ┌─ 前端检查余额（store.user.balance >= 50）
          │     ↓
          ├─ 余额不足 → Toast "M币不足，无法开盒" + 弹窗关闭
          │
          └─ 余额充足 → 前端本地操作：
                ↓
              ① 扣除 50 M币：store.user.balance -= 50
              ② 走页面刷新 → 请求 AI 生成开盒数据
              ③ Loading → UnboxModal 显示 spinner
              ④ Success → [unbox] 返回开盒数据
              ⑤ 更新 store.dm.unboxCache[id] = 开盒数据
              ⑥ 更新 store.dm.unboxedIds.push(id)
              ⑦ Toast "开盒成功！-50 M币"
              ⑧ UnboxModal 显示开盒信息
              ⑨ Error → Toast "开盒失败" + 余额回退 50
```

**数据流**：
- 页面刷新：`[unbox]` → `store.dm.unboxCache[id]`
- 扣费：前端本地操作，不依赖 AI
- 快照：开盒后触发 `saveSnapshot()` 保存 `unboxedIds`

---

### 16.7 💎 招募（广场/详情/发布/管理）

#### 招募广场

```
用户进入招募广场（/recruit）
  │
  ├─ 首次进入 → 走页面刷新 → 请求 AI 生成招募列表
  │     ↓
  │   Loading → SkeletonBox
  │     ↓
  │   ┌─ Success → 渲染招募列表（RecruitList）
  │   │     ↓
  │   │   ├─ 用户点击某张卡片 → 跳转 /recruit/:id
  │   │   │     ↓
  │   │   │   ┌─ 走页面刷新 → 请求 AI 生成招募详情
  │   │   │   │     ↓
  │   │   │   │   Loading → SkeletonBox
  │   │   │   │     ↓
  │   │   │   │   ┌─ Success → 渲染招募详情（RecruitDetail）
  │   │   │   │   │     ↓
  │   │   │   │   │   ├─ 用户点"报名"（仅限发布者本人不可报名）
  │   │   │   │   │   │     ↓
  │   │   │   │   │   │   ConfirmModal "确认报名该招募？"
  │   │   │   │   │   │     ↓
  │   │   │   │   │   │   ┌─ 取消 → 关闭
  │   │   │   │   │   │   └─ 确认 → 前端本地操作
  │   │   │   │   │   │         ↓
  │   │   │   │   │   │       ① store.recruit.detail.applicants += 1
  │   │   │   │   │   │       ② Toast "已报名，等待发布者筛选"
  │   │   │   │   │   │
  │   │   │   │   │   ├─ 用户点"私信发布者" → 跳转 /dm/:code
  │   │   │   │   │   └─ 用户点"返回" → 回到 /recruit
  │   │   │   │   │
  │   │   │   │   ├─ Empty → 数据异常，返回列表
  │   │   │   │   └─ Error → ErrorState + 重试
  │   │   │   │
  │   │   │   └─ 缓存命中 → 直接渲染
  │   │   │
  │   │   ├─ 用户点"发布招募" → 跳转 /recruit/post
  │   │   │
  │   │   └─ 用户筛选标签 → 纯前端过滤，不发请求
  │   │
  │   ├─ Empty → EmptyState "暂无招募"
  │   └─ Error → ErrorState + 重试
  │
  ├─ 缓存命中 → 直接渲染
  │
  └─ 用户下拉刷新 → 清除缓存 → 走页面刷新
```

#### 发布招募

```
用户进入发布招募页（/recruit/post）
  │
  ├─ 用户填写表单：
  │   标题（15字内）| 类型 | 执行时间 | 执行地点
  │   时长 | 人数 | 年龄范围 | 身材偏好 | 特殊要求
  │   报酬（最低 10000 M币/人）| 标签
  │
  ├─ 用户点"发布"
  │     ↓
  │   ┌─ 前端校验：必填项是否完整
  │   │   ├─ 不完整 → 表单高亮提示，不走 API
  │   │   └─ 完整 → 继续
  │   │
  │   ├─ 前端校验：balance >= 服务费 + 押金
  │   │   ├─ 不足 → Toast "M币不足，无法发布招募"
  │   │   └─ 充足 → 继续
  │   │
  │   └─ 走完整对话
  │        ↓
  │     ① 组装 prompt = 用户填写的表单数据 + 当前 Pinia 全状态
  │     ② 走完整对话
  │     ③ Submitting → 发布按钮 loading
  │     ④ AI 回复叙事 + [recruit_post] 返回结果
  │     ⑤ ┌─ result: success
  │        │     ↓
  │        │   Toast "招募发布成功"
  │        │   前端本地扣除服务费 + 冻结押金
  │        │   更新 store.recruit.postResult
  │        │   跳转回 /recruit/manage
  │        │
  │        └─ result: failed
  │              ↓
  │            Toast "发布失败：{message}"
  │            Submitting 恢复
  │
  └─ 用户点"取消" → 返回上一页
```

#### 发布者管理招募

```
用户进入我的管理（/recruit/manage）
  │
  ├─ 走页面刷新 → 请求 AI 生成管理列表
  │     ↓
  │   ┌─ Success → 渲染管理列表（RecruitManage）
  │   │     ↓
  │   │   每条招募帖显示：标题 | 类型 | 状态 | 报名人数
  │   │     ↓
  │   │   ├─ 状态为"招募中" → 显示"取消"按钮
  │   │   │     ↓
  │   │   │   ┌─ 用户点"取消" → ConfirmModal "确认取消招募？"
  │   │   │   │     ↓
  │   │   │   │   └─ 确认 → 走完整对话
  │   │   │   │         ↓
  │   │   │   │       ① 组装 prompt = "{{user}}取消了招募#{code}"
  │   │   │   │       ② AI 回复叙事 + [recruit_manage] 更新状态为"已取消"
  │   │   │   │       ③ Toast "招募已取消"
  │   │   │   │
  │   │   │   └─ 取消 → 不操作
  │   │   │
  │   │   ├─ 状态为"招募中" → 显示"查看报名"按钮
  │   │   │     ↓
  │   │   │   ┌─ 用户点"查看报名" → 跳转 /recruit/:id（查看详情底部的报名列表）
  │   │   │   │     ↓
  │   │   │   │   发布者点击某个应征者 → 走私信聊天（完整对话）
  │   │   │   │   发布者确认人选 →
  │   │   │   │     前端发 prompt "确认应征者 XXX"
  │   │   │   │     AI 回复叙事 + [recruit_detail] 更新状态为"已锁定"
  │   │   │   │
  │   │   │   └─ 无报名 → 显示"暂无报名"
  │   │   │
  │   │   └─ 用户点某条招募 → 跳转招募详情
  │   │
  │   ├─ Empty → EmptyState "暂无招募记录"
  │   └─ Error → ErrorState + 重试
  │
  └─ 缓存命中 → 直接渲染
```

---

### 16.8 ⚙️ 设置

```
用户进入设置页（/settings）
  │
  └─ 纯前端本地操作，不走任何 API
        ↓
      ├─ 主题切换（☀️/🌙）
      │     ↓
      │   更新 appStore.theme → 切换 <html data-theme="">
      │   保存到 localStorage('mlife_theme')
      │
      ├─ 格式化模板编辑
      │     ↓
      │   跳转 FormatTemplateEditor.vue
      │     ↓
      │   ├─ 选择页面（下拉框选择）
      │   ├─ 编辑模板文本（textarea）
      │   ├─ 保存 → localStorage.setItem(`mlife_format_{page}`, 内容)
      │   ├─ 恢复默认 → localStorage.removeItem(`mlife_format_{page}`)
      │   └─ 返回设置页
      │
      └─ 退出 M-life（仅全屏模式显示）
            ↓
          ConfirmModal "确认退出 M-life？"
            ↓
          ┌─ 确认 → parent.location.reload()（回到酒馆页面）
          └─ 取消 → 关闭弹窗
```

---

### 16.9 全局交互链路

#### 悬浮球（💎）

```
页面加载 → FloatingBall 出现（位置从 localStorage 恢复）
  │
  ├─ 用户拖拽 → 更新 appStore.ballPosition → 实时跟随鼠标
  │     ↓
  │   拖拽结束 → 保存位置到 localStorage('mlife_ball_pos')
  │
  └─ 用户点击 → 切换 appStore.phoneOpen
        ↓
      ┌─ phoneOpen = true
      │     ↓
      │   ├─ PC 模式：PhoneFrame 从右侧滑入（translateX 300ms）
      │   ├─ 窄屏模式：PhoneFrame 整页替换
      │   └─ 移动端：PhoneFrame 全屏覆盖
      │
      └─ phoneOpen = false
            ↓
          手机框滑出
```

#### 输入框（InputBar）

```
用户在 InputBar 输入消息 → 点发送 / 按 Enter
  │
  ├─ 空内容 → 不做任何操作
  │
  └─ 有内容 → 走完整对话（useMlifeInject）
        ↓
      Sending 状态 → 发送按钮置灰 + spinner
        ↓
      ┌─ Success
      │     ↓
      │   ① 解析 ==mlife_data== 更新 Pinia
      │   ② 纯叙事写入 StoryPane
      │   ③ 清空输入框
      │   ④ 发送按钮恢复
      │   ⑤ 触发 saveSnapshot()
      │
      └─ Error
            ↓
          Toast "网络错误，请重试"
          发送按钮恢复
```

#### 页面刷新（usePageRefresh）

```
任何页面触发刷新请求
  │
  ├─ 检查缓存 → 缓存命中且未过期 → 直接返回缓存数据
  │
  └─ 缓存未命中或已过期
        ↓
      Loading → 显示 SkeletonBox
        ↓
      ┌─ API 调用成功
      │     ↓
      │   ┌─ 解析 ==mlife_data== 成功 → 更新 Pinia → 缓存 → 渲染 Success
      │   └─ 解析失败 → 保留旧数据 → Toast "数据解析失败"
      │
      └─ API 调用失败（网络超时/错误）
            ↓
          ┌─ 首次失败 → 自动重试 1 次
          │     ↓
          │   ┌─ 重试成功 → 更新 Pinia → 缓存 → 渲染
          │   └─ 重试失败 → ErrorState + "重试"按钮
          │
          └─ 用户点"重试" → 重新调用 API
```

---

### 16.10 完整玩法闭环总图

```
用户进入 M-life
  │
  ├─ 日常循环
  │     │
  │     ├─ 首页刷帖子 → 点赞/评论 → 完整对话 → 叙事推进
  │     ├─ 匹配刷人 → 看详情 → 开盒/私信 → 完整对话 → 叙事推进
  │     ├─ 看直播 → 发弹幕/送礼 → 完整对话 → 叙事推进
  │     ├─ 私信聊天 → 发送消息 → 完整对话 → 叙事推进
  │     ├─ 签到 → 完整对话 → 获取奖励 → 叙事推进
  │     └─ 招募 → 看/发布/报名 → 完整对话/本地 → 叙事推进
  │
  ├─ 经济循环
  │     │
  │     ├─ 签到 → +M币
  │     ├─ 开盒 → -50 M币
  │     ├─ 发布招募 → -服务费 -押金
  │     └─ 招募完成 → +报酬
  │
  └─ 数据持久化
        │
        ├─ 每次完整对话后 → saveSnapshot()
        ├─ 开盒后 → saveSnapshot()
        ├─ 签到后 → saveSnapshot()
        └─ 页面刷新后 → Pinia 缓存 5 分钟
```

---

### 16.11 链路设计原则

1. **完整对话为王** — 所有改变"故事"的操作（发消息、点赞、签到、发布招募）走完整对话，让 AI 推进叙事
2. **页面刷新查询** — 所有"查看"操作（翻页、切换 Tab、查详情）走页面刷新，不写楼层
3. **前端本地操作** — 纯 UI 操作（切换主题、拖拽球、报名招募）不走 API，只改 Pinia/localStorage
4. **容错分层** — 解析失败不崩 UI，API 失败自动重试 1 次，余额不足阻止操作并提示
5. **快照保底** — 关键字段（balance/level/vip/unboxed）每轮完整对话后快照到 localStorage，刷新不丢

---

## 第十七章：正文叙事与手机界面的平行驱动

> ⚠️ **核心理解**：正文叙事由酒馆自身的预设配置（角色卡 + 世界书 + 正则）生成，前端不干预正文的产出。前端的职责只是：
> 1. 把 Pinia 状态注入给 AI（作为 prompt 的一部分，让 AI 知道"当前 M-life 数据"）
> 2. 从 AI 回复中剥离 `==mlife_data==` 数据块（不让结构化数据污染正文）
> 3. 把纯叙事正文放回给酒馆，由酒馆渲染到正文框

本章梳理**正文框** 与 **手机界面（PhoneFrame）** 之间的双向驱动关系。M-life 的核心体验是"平行叙事"——用户在同一时间既能看到正文框里的叙事，又能操作手机界面，两者互相影响。

### 17.1 正文与手机的关系概览

```
                    酒馆预设配置
                   （角色卡+世界书+正则）
                         │
                    ┌─────┴─────┐
                    │ 生成叙事正文 │
                    └─────┬─────┘
                         │
                    ┌─────┴─────┐
                    │ 发送给 AI  │
                    └─────┬─────┘
                         │
              ┌──────────┴──────────┐
              │                     │
         ┌────┴────┐          ┌────┴────┐
         │ 叙事正文  │          │ ==mlife  │
         │（纯文字） │          │ _data==  │
         └────┬────┘          └────┬────┘
              │                     │
              ↓                     ↓
        ┌──────────┐        ┌──────────────┐
        │ 酒馆正文框 │        │ 前端解析 →   │
        │（渲染显示）│        │ 更新 Pinia → │
        └──────────┘        │ 手机界面刷新   │
                            └──────────────┘
```

**关键理解**：正文框里显示的内容是**酒馆自己生成的**，前端只做三件事：
1. **注入数据** — 把当前 Pinia 状态塞进 prompt，让 AI 知道"当前 M-life 上有什么"
2. **剥离数据块** — AI 回复后，把 `==mlife_data==` 部分拆走，不让它显示在正文里
3. **更新手机界面** — 解析拆下来的数据块，刷新手机界面

### 17.2 平行叙事结构

```
┌─────────────────────────────────────────────────┐
│                 正文框（酒馆渲染）                   │
│  PC 模式左侧 / 移动端 Drawer                      │
│                                                  │
│  「你躺在沙发上，无聊地刷着手机。                    │
│   打开 M-life，首页刷新出几条新动态：                │
│                                                  │
│    晚安小鹿 Lv4 23:41                             │
│    "睡不着 有人陪我聊天吗"                          │
│    ♥ 247 💬 89                                   │
│                                                  │
│    你点进了小鹿的个人主页，发现她也在线。             │
│    你犹豫了一下，还是点开了私信...」                 │
│                                                  │
│  ┌────────────────────────────────┐              │
│  │ 输入框: ________________ [发送] │              │
│  └────────────────────────────────┘              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│             手机界面（PhoneFrame）                 │
│  PC 模式右侧 / 移动端全屏                          │
│                                                  │
│  ┌─────────────────────────────────┐             │
│  │  🔋 9:41              ☀️  🔔 │             │
│  ├─────────────────────────────────┤             │
│  │  M-life                          │             │
│  ├─────────────────────────────────┤             │
│  │                                 │             │
│  │  用户正在手机界面上操作...        │             │
│  │  （刷首页 / 匹配 / 私信 / 招募）  │             │
│  │                                 │             │
│  ├─────────────────────────────────┤             │
│  │  🏠  ♡  ▶  ✉  ☺              │             │
│  └─────────────────────────────────┘             │
└─────────────────────────────────────────────────┘
```

### 17.3 正文驱动手机（叙事→界面）

AI 在叙事正文中描述的内容，**通过 ==mlife_data== 数据块同步到手机界面**：

| 叙事正文描述 | 数据块 | 手机界面同步 |
|-------------|--------|-------------|
| AI 说"你打开 M-life 首页" | `[list:home]` | 自动切换到 `/home` 页面 |
| AI 说"你收到一条新私信" | `[badges] dm: 1` | 私信 Tab 红点 |
| AI 说"系统提示你签到" | `[profile]` | 个人主页签到按钮高亮 |
| AI 说"你匹配到了一个女生" | `[list:match]` | 匹配列表更新 |
| AI 说"你的余额变动了" | `[user] balance` | 余额显示更新 |
| AI 说"你发布了招募帖" | `[recruit_post]` | 招募状态更新 |

**同步机制**：AI 在完整对话回复中附带 `==mlife_data==` 数据块 → 前端拆走 → 解析 → 更新 Pinia → 手机界面自动刷新。正文框里显示的是**去掉数据块后的纯叙事**，由酒馆原样渲染。

**示例：用户发消息"我打开了匹配页面"**

```
用户输入：我打开了匹配页面
  ↓
走完整对话（useMlifeInject）
  ↓
AI 回复（含叙事 + 数据块）：
  "你打开匹配功能，系统为你推荐了三位候选人……
   第一个是个 24 岁的上海女生，距离你只有 3km……"
  + ==mlife_data==
    [list:match]
    --
    nick: 小鹿乱撞 | 24岁 | 上海
    level: Lv3
    ...
    --
    ==/mlife_data==
  ↓
前端 splitResponse()：
  → 叙事正文 → 放回给酒馆 → 渲染到正文框
  → ==mlife_data== → 解析 → 更新 Pinia → 手机界面匹配列表刷新
```

### 17.4 手机驱动正文（界面→叙事）

用户在手机界面上的操作，**通过完整对话触发 AI 生成新的叙事**：

| 手机界面操作 | 触发方式 | 正文框更新 |
|-------------|---------|-----------|
| 点"发送消息"按钮 | 完整对话 | AI 生成新的叙事正文 |
| 点赞帖子 | 完整对话 | AI 描述"你给 XX 点了个赞" |
| 评论帖子 | 完整对话 | AI 描述"你在 XX 帖子下评论了..." |
| 签到 | 完整对话 | AI 描述"你完成了签到，获得 XXX M币" |
| 私信发消息 | 完整对话 | AI 描述对方回复的表情/语气 |
| 开盒 | 页面刷新 | 正文不更新（不写楼层） |
| 切换 Tab | 页面刷新 | 正文不更新 |
| 直播发弹幕 | 完整对话 | AI 描述主播反应 |
| 招募发布 | 完整对话 | AI 描述"你成功发布了一条招募" |
| 招募报名 | 本地操作 | 正文不更新 |

**核心原则**：
- **正文更新的**：所有触发"完整对话"的操作（发消息、点赞、签到、发弹幕、发布招募）
- **正文不更新的**：所有"页面刷新"或"本地操作"（翻页、切换 Tab、开盒、招募报名）

### 17.5 平行叙事的两种典型体验

#### 模式一：用户在手机界面操作 → 正文推进（沉浸式）

```
场景：用户正在手机界面刷私信
  │
  ├─ 用户在 DmChat 输入"今晚有空吗" → 点发送
  │     ↓
  │  ① 前端组装 prompt = Pinia 全状态 + 格式化模板 + 用户输入
  │  ② 走酒馆完整对话
  │  ③ AI 生成回复（叙事 + ==mlife_data==）
  │  ④ 前端 splitResponse() 拆分
  │     → 叙事正文 → 放回酒馆 → 正文框显示
  │     → ==mlife_data== → 解析 → 更新 Pinia → 聊天窗口刷新
  │
  └─ PC 体验：用户一边看正文框里的故事，一边在手机界面回复
     移动端体验：Drawer 显示正文，操作完 Drawer 收起
```

#### 模式二：AI 叙事推进 → 手机界面同步（引导式）

```
场景：AI 在叙事中描述新事件
  │
  ├─ 酒馆预设配置 → AI 生成回复：
  │   "……这时手机震了一下，你收到一条新匹配通知。"
  │   + ==mlife_data==
  │     [list:match] 更新匹配列表
  │     [badges] match: 1
  │
  ├─ 前端拆分：
  │   → 正文框："……这时手机震了一下，你收到一条新匹配通知。"
  │   → 数据块 → 解析 → 匹配列表更新 + 匹配 Tab 红点
  │
  └─ 用户看到红点 → 点击匹配 Tab → 查看新匹配
      ↓
     用户后续操作又走回模式一
```

### 17.6 正文与手机界面的关系总表

| 维度 | 正文框（酒馆渲染） | 手机界面（PhoneFrame） |
|------|-------------------|----------------------|
| **生成者** | 酒馆预设配置（角色卡+世界书+正则） | 前端（Vue + Pinia） |
| **角色** | 小说的叙事文本 | 可交互的 UI 模拟器 |
| **数据来源** | AI 回复的纯叙事部分 | Pinia 状态 + 页面刷新 |
| **用户操作** | 输入框输入文字 | 点击/滑动/填写表单 |
| **操作触发** | 完整对话 | 完整对话 / 页面刷新 / 本地 |
| **持久化** | 酒馆消息楼层（永久） | Pinia 会话 + localStorage 快照 |
| **PC 布局** | 左侧居中 520px | 右侧 375px |
| **移动端布局** | Drawer 半屏上滑 | 全屏覆盖 |
| **更新频率** | 仅完整对话时更新 | 任意操作即时更新 |
| **内容示例** | "你打开 App，看到一条新动态……" | 帖子列表/匹配卡片/聊天窗口 |
| **容错表现** | 不参与解析，不受前端错误影响 | 解析失败 → 保留旧数据 |
| **用户感知** | "我在看小说" | "我在玩手机" |

### 17.7 正文与手机的操作边界

#### 边界一：正文叙事由酒馆生成

```
前端不参与正文的创作。前端只管：
① 在 prompt 末尾追加 Pinia 状态
② 从 AI 回复中剥离 ==mlife_data==
③ 把纯叙事放回去
```

正文框里最终显示什么，完全取决于**酒馆的角色卡 + 世界书 + 正则配置**。

#### 边界二：手机界面操作触发正文

```
用户点手机界面的"发送"按钮
  ↓
前端组装 prompt → 完整对话
  ↓
AI 回复（由酒馆预设决定叙事风格）
  ↓
前端拆数据块 → 纯叙事放回酒馆 → 正文框更新
```

#### 边界三：纯 UI 操作不触发正文

```
用户在手机界面切换 Tab（首页→匹配→直播→我的）
  ↓
走页面刷新（不走完整对话）
  ↓
正文框不变（还是上次的内容）
  ↓
只有手机界面内容更新
```

### 17.8 正文叙事风格由酒馆配置决定

正文的叙事风格**不由前端控制**，完全取决于酒馆的角色卡设定和世界书。但前端注入的 Pinia 状态会**影响 AI 知道什么**：

```
前端注入给 AI 的 prompt 末尾：
  当前 M-life 数据：
  ==mlife_data==
  [user]
  balance: 420
  signin: 已签
  signin_streak: 6

  [list:home]
  ...
  ==/mlife_data==

  ↓

AI 知道：
- 用户有 420 M 币
- 今天签过到了，连续 6 天
- 首页有这些帖子
- 匹配列表有这些人

  ↓

AI 可以在叙事中提及这些信息：
"你看了看余额，只剩 420 M 币了……
 你决定先签个到……哦你已经签过了，连续 6 天，不错。"
```

### 17.9 正文与手机数据一致性

**问题**：用户先通过手机界面操作（如签到），然后发消息，AI 不知道用户刚签到了怎么办？

**解决**：每次完整对话注入当前 Pinia 全状态，AI 始终知道最新数据：

```
用户操作手机界面签到
  ↓
前端本地：store.user.balance += 50, store.user.signin = "已签"
  ↓
用户在输入框发消息
  ↓
前端组装 prompt = 当前 Pinia 状态（已包含签到结果）
  ↓
AI 知道用户已签到 → 叙事中自然提及
```

**原则**：**正文不滞后于手机界面**——每次完整对话注入的 Pinia 状态都是最新的，包含所有前端本地操作的结果。

### 17.10 正文与手机界面的完整经典循环

```
用户刚加载角色卡
  │
  ├─ 用户在输入框发首条消息
  │     ↓
  │   前端注入 Pinia 初始状态 → 完整对话
  │     ↓
  │   AI 回复（由酒馆预设配置生成）：
  │     "你躺在沙发上，无聊地刷着手机。
  │      打开 M-life，首页刷新出几条新动态……"
  │     + ==mlife_data== [list:home] 帖子列表
  │     ↓
  │   前端剥离数据块：
  │     → 正文框："你躺在沙发上，无聊地刷着手机……"
  │     → 手机界面：首页帖子列表已加载
  │
  ├─ 用户在手机界面刷匹配
  │     ↓
  │   页面刷新 → 匹配列表出现
  │   正文框不变
  │     ↓
  │   用户看到匹配卡片 → 点开详情
  │     ↓
  │   用户点"发送消息" → 跳转私信
  │     ↓
  │   用户在私信输入"你好" → 点发送
  │     ↓
  │   完整对话 → AI 回复：
  │     "你鼓起勇气打了个招呼，对方很快回复了..."
  │     + ==mlife_data== 更新私信记录
  │     ↓
  │   前端剥离数据块：
  │     → 正文框："你鼓起勇气打了个招呼，对方很快回复了..."
  │     → 手机界面：聊天窗口出现对方回复
  │
  ├─ AI 在叙事中推进（由酒馆配置驱动）
  │     ↓
  │   正文框：
  │     "聊了一会儿，她暗示可以见面。
  │      你心跳加速，但看了看余额，只剩 200 M 币了……"
  │     + ==mlife_data== [user] 余额信息
  │     ↓
  │   用户看到正文 → 意识到需要赚钱
  │     ↓
  │   用户在手机界面签到 → 完整对话 → 获取 M 币
  │     ↓
  │   用户继续刷帖子 → 看直播 → 刷匹配
  │   周而复始，叙事一直在推进
  │
  └─ 平行叙事贯穿始终
        ↓
      始终同时存在两条线：
      ① 正文框：酒馆生成的叙事（用户在 M-life 上的经历和感受）
      ② 手机界面：前端渲染的交互界面（用户实际操作的 UI）
      两者通过 ==mlife_data== 数据块互相驱动，互相补充
```

### 17.11 完整数据流总图（纠正版）

```
┌─────────────────────────────────────────────────────────┐
│                    完整对话数据流                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  用户在输入框 / 手机界面触发操作                            │
│         │                                                │
│         ↓                                                │
│  ① 前端组装 prompt：                                      │
│     ┌─ 用户输入内容（如果有）                               │
│     ├─ 当前 M-life 数据（Pinia 全状态 + 格式化模板）        │
│     └─ [注：叙事风格由酒馆预设配置控制，前端不干预]          │
│         │                                                │
│         ↓                                                │
│  ② 走酒馆 API 完整对话                                    │
│     （Sending 状态 → 输入框/按钮置灰）                     │
│         │                                                │
│         ↓                                                │
│  ③ AI 返回（由酒馆预设配置决定叙事内容和风格）：               │
│     ┌─ 叙事正文（纯文字，酒馆角色卡+世界书决定风格）         │
│     └─ ==mlife_data==（结构化数据，前端负责解析）           │
│         │                                                │
│         ↓                                                │
│  ④ 前端 splitResponse()：                                 │
│     ┌─ 叙事正文 → 放回给酒馆 → 酒馆渲染到正文框             │
│     │  （前端不做任何修改，保持原样）                        │
│     └─ ==mlife_data== → parseMlifeData() → 更新 Pinia     │
│              │                                            │
│              ↓                                            │
│        ⑤ 手机界面自动刷新（Pinia 变更驱动）                 │
│              │                                            │
│              ↓                                            │
│        ⑥ saveSnapshot() → 保存关键字段到 localStorage      │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    页面刷新数据流                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  用户在手机界面切换 Tab / 翻页 / 下拉刷新                   │
│         │                                                │
│         ↓                                                │
│  ① 前端组装 prompt：                                      │
│     ┌─ 目标页面硬编码提示词（告诉 AI 要生成什么内容）        │
│     └─ 当前 Pinia 状态                                    │
│         │                                                │
│         ↓                                                │
│  ② 走酒馆 API 页面刷新（不写楼层，不触发完整对话）           │
│         │                                                │
│         ↓                                                │
│  ③ AI 只返回 ==mlife_data==（无叙事正文）                  │
│         │                                                │
│         ↓                                                │
│  ④ 前端解析 → 更新 Pinia → 手机界面刷新                    │
│     正文框不变（页面刷新不产生叙事）                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```
