# M-life 独立前端开发文档

> **版本**: 1.1 | **日期**: 2026-07-09 | **基于产品文档**: M-life 独立前端产品文档.md v2.2

---

## 第一章：项目结构与约定

### 1.1 目录结构

```
tavern_helper_template/
├── src/
│   └── 魅途/                        ← M-life 专属目录
│       ├── index.ts                  ← 入口文件，注册 SPA
│       ├── index.html                ← HTML 模板
│       ├── App.vue                   ← 根组件
│       ├── global.css                ← 全局样式 + 主题变量
│       ├── constants/
│       │   ├── formatTemplates.ts    ← 格式化模板硬编码（第十五章）
│       │   └── pagePrompts.ts        ← 页面刷新提示词硬编码（2.3 节）
│       ├── stores/
│       │   ├── user.ts               ← store.user（账号/M币/等级）
│       │   ├── social.ts             ← store.social（帖子/匹配/直播）
│       │   ├── dm.ts                 ← store.dm（私信/联系人/开盒缓存）
│       │   ├── recruit.ts            ← store.recruit（招募）
│       │   └── app.ts               ← store.app（UI 状态/模板配置/快照）
│       ├── router/
│       │   └── index.ts              ← Vue Router 路由表（第四章）
│       ├── composables/
│       │   ├── useMlifeInject.ts     ← 注入 AI：组装 prompt → 发送请求 → 解析
│       │   ├── usePageRefresh.ts     ← 页面刷新：独立 API 请求 → 缓存 → 渲染
│       │   ├── useSnapshot.ts        ← 快照保存/恢复（第七章）
│       │   └── useFullscreen.ts      ← 全屏展开/退出 iframe 适配（8.4 节）
│       ├── utils/
│       │   ├── formatRenderer.ts     ← 模板引擎：{变量} 替换 + 多条目循环
│       │   ├── parser.ts             ← splitResponse / parseMlifeData（第六章）
│       │   └── api.ts               ← 酒馆 API 封装（完整对话 + 页面刷新）
│       ├── views/
│       │   ├── HomePage.vue          ← 🏠 首页
│       │   ├── MatchPage.vue         ← ♡ 匹配
│       │   ├── MatchDetail.vue       ← ♡ 匹配详情
│       │   ├── LiveList.vue          ← ▶ 直播列表
│       │   ├── LiveRoom.vue          ← ▶ 直播间
│       │   ├── DmList.vue            ← ✉ 私信联系人
│       │   ├── DmChat.vue            ← ✉ 聊天窗口
│       │   ├── ProfilePage.vue       ← ☺ 我的主页
│       │   ├── RecruitList.vue       ← 💎 招募广场
│       │   ├── RecruitDetail.vue     ← 💎 招募详情
│       │   ├── RecruitPost.vue       ← ✏️ 发布招募
│       │   ├── RecruitManage.vue     ← 📊 我的管理
│       │   ├── UnboxModal.vue        ← 🔓 开盒弹窗（Modal 不走路由）
│       │   └── settings/
│       │       ├── SettingsPage.vue   ← ⚙️ 设置
│       │       └── FormatTemplateEditor.vue  ← 格式化模板编辑
│       ├── components/
│       │   ├── StoryPane.vue         ← 故事正文
│       │   ├── PhoneFrame.vue        ← 手机模拟器框
│       │   │   ├── PhoneStatusBar.vue  ← 手机状态栏（时间/电量/信号）
│       │   │   └── PhoneHeader.vue     ← 手机头部标题栏（标题 + 🔔 + ☀️/🌙）
│       │   ├── FloatingBall.vue      ← 💎 悬浮球
│       │   ├── InputBar.vue          ← 输入框
│       │   ├── StoryDrawer.vue       ← 移动端故事 Drawer
│       │   ├── NavBar.vue            ← 底部 5 Tab
│       │   ├── ToastProvider.vue     ← 全局提示
│       │   ├── ConfirmModal.vue      ← 确认弹窗
│       │   ├── SkeletonBox.vue       ← 骨架屏
│       │   ├── EmptyState.vue        ← 空态
│       │   ├── ErrorState.vue        ← 错误态
│       │   ├── PostCard.vue          ← 帖子卡片（首页/自拍/闲聊/资源/女神）
│       │   ├── MatchCard.vue         ← 匹配卡片
│       │   ├── MessageBubble.vue     ← 私信消息气泡
│       │   ├── DanmakuArea.vue       ← 直播间弹幕区域
│       │   └── SignInButton.vue      ← 签到按钮（我的主页）
│       └── types/
│           └── mlife.ts              ← M-life 类型定义
├── webpack.config.ts                 ← webpack 配置（已存在）
├── tsconfig.json                     ← TypeScript 配置（已存在）
└── package.json                      ← 依赖管理（已存在）
```

### 1.2 命名约定

| 类别 | 规则 | 示例 |
|------|------|------|
| Store | 文件名 = store 名 | `user.ts`, `social.ts` |
| View | 大驼峰 + Page/Detail 后缀 | `HomePage.vue`, `MatchDetail.vue` |
| Component | 大驼峰 | `PhoneFrame.vue`, `NavBar.vue` |
| Composable | `use` 前缀 + 大驼峰 | `usePageRefresh.ts` |
| Util | 小写下划线 | `formatRenderer.ts`, `parser.ts` |
| CSS 变量 | `--ml-*` | `--ml-primary`, `--ml-bg` |

### 1.3 TypeScript 严格模式

tsconfig.json 已启用严格模式（查看源文件确认）：
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `strict: true`
- `strictBindCallApply: true`

---

## 第二章：核心数据流实现

### 2.1 完整对话流程

```
用户发送消息
    ↓
useMlifeInject.ts
  ① klona(store.$state) → 深拷贝全状态
  ② 遍历 store 状态 → 匹配对应的格式化模板（formatTemplates.ts）
  ③ 拼接 prompt = "当前 M-life 数据：\n==mlife_data==\n{模板渲染结果}\n==/mlife_data=="
  ④ api.sendMessage(prompt) → 走酒馆 API 完整对话
  ⑤ AI 返回叙事正文 + ==mlife_data==
  ⑥ parser.splitResponse() → 分离叙事 + 数据块
  ⑦ parser.parseMlifeData() → 解析数据块 → 更新 Pinia
  ⑧ 纯叙事正文 → 写入消息楼层、显示到 StoryPane
```

**代码位置**：`src/composables/useMlifeInject.ts`

```typescript
// 伪代码骨架
export function useMlifeInject() {
  const store = useMlifeStore()  // 合并所有子 store

  async function injectToAI() {
    // 1. 深拷贝当前状态
    const state = klona(store.$state)

    // 2. 按格式化模板渲染
    const dataBlock = renderAllTemplates(state)

    // 3. 组装 prompt
    const prompt = `当前 M-life 数据：\n==mlife_data==\n${dataBlock}\n==/mlife_data==`

    // 4. 发送
    const response = await api.sendMessage(prompt)

    // 5. 解析
    const { narrative, dataBlock: raw } = splitResponse(response)
    if (raw) {
      const updates = parseMlifeData(raw)
      applyUpdates(updates)
    }

    // 6. 返回纯叙事给酒馆
    return narrative
  }

  return { injectToAI }
}
```

### 2.2 页面刷新流程

```
用户切换 Tab / 翻页 / 刷新
    ↓
usePageRefresh.ts
  ① 检查 Pinia 缓存：该页面数据是否已存在且未过期
     → 已缓存 → 直接渲染，不请求
     → 未缓存 → 继续
  ② 从 pagePrompts.ts 获取目标页面的硬编码提示词
  ③ 拼接 prompt = {页面提示词}\n\n当前状态：\n{Pinia 序列化}
  ④ api.pageRefresh(prompt) → 走酒馆 API 独立请求（不写入楼层）
  ⑤ 解析 ==mlife_data== → 更新 Pinia
  ⑥ 缓存该页面数据
  ⑦ 渲染目标页面
```

**代码位置**：`src/composables/usePageRefresh.ts`

```typescript
// 伪代码骨架
export function usePageRefresh() {
  const store = useMlifeStore()
  const pageCache = ref(new Map<string, { data: any; timestamp: number }>())
  const CACHE_TTL = 5 * 60 * 1000  // 5 分钟缓存

  async function refreshPage(page: string) {
    // 1. 检查缓存
    const cached = pageCache.value.get(page)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data
    }

    // 2. 获取页面提示词
    const prompt = getPagePrompt(page)

    // 3. 拼接当前状态
    const state = klona(store.$state)
    const fullPrompt = `${prompt}\n\n当前状态：\n${serializeState(state)}`

    // 4. 独立 API 请求
    const response = await api.pageRefresh(fullPrompt)

    // 5. 解析
    const { narrative, dataBlock } = splitResponse(response)
    if (dataBlock) {
      const updates = parseMlifeData(dataBlock)
      applyUpdates(updates)
      pageCache.value.set(page, { data: updates, timestamp: Date.now() })
      return updates
    }
  }

  // 切换 Tab 时清除对应页面缓存（用户主动刷新）
  function invalidatePage(page: string) {
    pageCache.value.delete(page)
  }

  return { refreshPage, invalidatePage }
}
```

### 2.3 两条请求的 API 封装

**代码位置**：`src/utils/api.ts`

```typescript
// 伪代码骨架
export const api = {
  // 完整对话：写入消息楼层
  async sendMessage(prompt: string): Promise<string> {
    // 调用酒馆的 /api/v2/chat/completions 或类似端点
    // 参数：prompt, include history
    // 返回：AI 完整回复（叙事 + ==mlife_data==）
  },

  // 页面刷新：不写入楼层，只返回数据
  async pageRefresh(prompt: string): Promise<string> {
    // 调用酒馆的同一 API，但设置生成参数：
    // - 不保存到历史
    // - 不触发正则
    // - 返回结果直接用于解析
    // 具体 API 端点取决于酒馆版本和角色卡配置
  },
}
```

> **注意**：`pageRefresh` 的具体 API 调用方式取决于酒馆的接口能力。如果需要，可改为 WebSocket 或直接调用底层 generate 函数。实际接口参数在实现时确认。

---

## 第三章：格式化模板系统

### 3.1 文件职责

**`src/constants/formatTemplates.ts`**

```typescript
export const DEFAULT_FORMAT_TEMPLATES: Record<string, string> = {
  home: `[list:home]
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
--`,

  match: `[list:match]
--
nick: {nick} | {age}岁 | {city}
avatar: {avatar}
level: Lv{level}
vip: {vip}
tags: {tags}
bio: {bio}
dist: {dist} | {active}
--`,

  matchDetail: `[match_detail]
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
photos: {photos}`,

  dm: `[list:dm:{contactId}]
--
role: {role}
time: {time}
type: {type}
text: {text}
--`,

  dmContacts: `[list:dm_contacts]
--
nick: {nick} | Lv{level}
avatar: {avatar}
last_msg: {last_msg}
last_time: {last_time}
unread: {unread}
--`,

  live: `[list:live]
--
nick: {nick} | Lv{level}
avatar: {avatar}
viewers: {viewers}
title: {title}
status: {status}
preview: {preview}
--`,

  liveRoom: `[live_room]
nick: {nick}
avatar: {avatar}
viewers: {viewers}
status: {status}
content: {content}
--
danmaku: {danmaku}`,

  recruit: `[list:recruit]
--
title: {title}
poster: {code} | 💎{vip}
credit: {credit}
type: {type}
budget: {budget}
location: {location} | {time}
tags: {tags}
status: {status} | applicants: {applicants}
--`,

  recruitDetail: `[recruit_detail]
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
requirements: {requirements}`,

  recruitPost: `[recruit_post]
result: {result}
message: {message}`,

  recruitManage: `[list:recruit_manage]
--
code: {code}
title: {title}
type: {type}
status: {status}
applicants: {applicants}
--`,

  profile: `[profile]
nick: {nick}
avatar: {avatar}
level: Lv{level}
vip: {vip}
signin: {signin}
signin_streak: {signin_streak}
likes: {likes}
fans: {fans}
following: {following}
balance: {balance}`,

  selfie: `[list:selfie]
--
nick: {nick} | Lv{level}
avatar: {avatar}
time: {time}
body: {body}
images: {images}
paywall: {paywall}
likes: {likes}
comments: {comments}
--`,

  chat: `[list:chat]
--
nick: {nick} | Lv{level}
avatar: {avatar}
time: {time}
body: {body}
likes: {likes}
comments: {comments}
--`,

  resource: `[list:resource]
--
nick: {nick} | Lv{level}
avatar: {avatar}
time: {time}
body: {body}
resource: {resource}
paywall: {paywall}
likes: {likes}
comments: {comments}
--`,

  goddess: `[list:goddess]
--
nick: {nick} | Lv{level}
avatar: {avatar}
time: {time}
body: {body}
image: {image}
paywall: {paywall}
likes: {likes}
comments: {comments}
--`,

  unbox: `[unbox]
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
preference: {preference}`,

  user: `[user]
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
unboxed: {unboxed}`,
}

export type FormatTemplateKey = keyof typeof DEFAULT_FORMAT_TEMPLATES
```

### 3.2 模板引擎

**`src/utils/formatRenderer.ts`**

```typescript
// 单条模板渲染：{变量} 替换
export function renderTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = data[key]
    return val != null ? String(val) : ''
  })
}

// 列表模板渲染：多条目循环
export function renderListTemplate(
  template: string,
  items: Record<string, any>[],
  sep: string = '\n--\n',
): string {
  return items.map(item => renderTemplate(template.replace(/^\[list:.*?\]\n/, ''), item)).join(sep)
}

// 全状态渲染：遍历所有 store 类型，用对应模板渲染
export function renderAllTemplates(state: MlifeState): string {
  const parts: string[] = []

  // 账号
  if (state.user) {
    parts.push(`[user]\n${renderTemplate(DEFAULT_FORMAT_TEMPLATES.user.replace(/^\[user\]\n/, ''), state.user)}`)
  }

  // 首页帖子
  if (state.social?.posts?.length) {
    parts.push(renderListTemplate(DEFAULT_FORMAT_TEMPLATES.home, state.social.posts))
  }

  // 匹配
  if (state.social?.matches?.length) {
    parts.push(renderListTemplate(DEFAULT_FORMAT_TEMPLATES.match, state.social.matches))
  }

  // ... 其他类型

  return parts.join('\n\n')
}
```

### 3.3 localStorage 读写

**`src/stores/app.ts`** 中：

```typescript
function loadFormatTemplates(): Record<string, string> {
  const loaded: Record<string, string> = {}
  for (const key of Object.keys(DEFAULT_FORMAT_TEMPLATES)) {
    const stored = localStorage.getItem(`mlife_format_${key}`)
    if (stored) loaded[key] = stored
  }
  return loaded
}

function saveFormatTemplate(page: string, content: string) {
  localStorage.setItem(`mlife_format_${page}`, content)
}

function resetFormatTemplate(page: string) {
  localStorage.removeItem(`mlife_format_${page}`)
}
```

### 3.4 读取优先级

```
① localStorage.getItem(`mlife_format_${page}`) → 用户自定义
② DEFAULT_FORMAT_TEMPLATES[page] → 硬编码默认值
```

---

## 第四章：页面刷新提示词

### 4.1 文件职责

**`src/constants/pagePrompts.ts`**

```typescript
export const PAGE_PROMPTS: Record<string, string> = {
  home: `生成 M-life 首页信息流动态，每次输出3-5条动态，动态类型随机混合：纯文字帖、图片帖、擦边帖、日常帖。

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
{Pinia 序列化数据}`,

  match: `生成 M-life 匹配候选人卡片，每次展示1-3张。

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
{Pinia 序列化数据}`,

  matchDetail: `生成 M-life 匹配对象详情信息。

包含完整个人信息、多张照片、个人简介、标签。

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}`,

  live: `生成 M-life 直播列表，每次展示3-4个直播间摘要。

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
{Pinia 序列化数据}`,

  liveRoom: `生成 M-life 直播间详情内容。

包含主播信息、观看人数、直播状态、当前直播内容描述、弹幕。

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}`,

  dmContacts: `生成 M-life 私信联系人列表。

每个联系人包含：
- 头像
- 昵称
- 等级
- 最新消息摘要
- 最后消息时间
- 未读消息数

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}`,

  dmChat: `生成 M-life 私信对话内容，按时间线排列。

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
{Pinia 序列化数据}`,

  profile: `生成 M-life 个人主页信息。

包含头像、昵称、等级、VIP、获赞数、粉丝数、关注数、M币余额、签到状态。

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}`,

  selfie: `生成 M-life 福利自拍板块内容，每次输出多条帖子。

每条帖子包含：
- 发帖人信息（昵称、等级）
- 发帖时间
- 正文
- 图片描述
- 付费解锁价格
- 点赞数、评论数

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}`,

  chat: `生成 M-life 闲聊灌水板块内容，每次输出多条帖子。

每条帖子包含发帖人信息、正文、互动数据。

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}`,

  resource: `生成 M-life 资源分享板块内容，每次输出多条帖子。

每条帖子包含发帖人信息、正文、资源链接、付费价格、互动数据。

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}`,

  goddess: `生成 M-life 女神夜话板块内容，每次输出多条帖子。

每条帖子包含发帖人信息、正文、图片、付费价格、互动数据。

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}`,

  recruit: `生成 M-life 招募广场帖子列表，每次输出10-20条招募帖。

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
{Pinia 序列化数据}`,

  recruitDetail: `生成 M-life 招募详情信息。

包含完整的招募内容、发布者信息、要求描述、当前报名列表。

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}`,

  recruitPost: `生成 M-life 招募发布结果通知。

包含发布状态、发布后的信息确认。

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}`,

  recruitManage: `生成 M-life 我的招募管理列表。

列出所有已发布的招募帖及其当前状态、报名人数。

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}`,

  unbox: `生成 M-life 开盒资料信息。

包含对方真实身份信息：职业、三围、身高、身材、性格驱动、标签、敏感点、偏好。

输出格式严格使用 ==mlife_data==。

当前状态：
{Pinia 序列化数据}`,
}

export function getPagePrompt(page: string): string {
  return PAGE_PROMPTS[page] || ''
}
```

---

## 第五章：Pinia Store 设计

### 5.1 user Store

```typescript
// src/stores/user.ts
export const useUserStore = defineStore('mlife:user', () => {
  const account = ref('')
  const balance = ref(0)
  const level = ref('Lv1')
  const vip = ref('无')
  const signin = ref('未签')
  const signinStreak = ref(0)
  const likes = ref(0)
  const fans = ref(0)
  const following = ref(0)
  const matchToday = ref('0/3')
  const postToday = ref('0/8')
  const recruitActive = ref(0)
  const recruitApplied = ref(0)
  const unboxed = ref<string[]>([])

  function applyUpdates(data: Record<string, any>) {
    // 从 ==mlife_data== [user] 段更新
  }

  return {
    account, balance, level, vip, signin, signinStreak,
    likes, fans, following, matchToday, postToday,
    recruitActive, recruitApplied, unboxed,
    applyUpdates,
  }
})
```

### 5.2 social Store

```typescript
// src/stores/social.ts
export const useSocialStore = defineStore('mlife:social', () => {
  const posts = ref<Post[]>([])
  const matches = ref<Match[]>([])
  const liveList = ref<LiveEntry[]>([])
  const liveRoom = ref<LiveRoom | null>(null)
  const selfie = ref<Post[]>([])
  const chat = ref<Post[]>([])
  const resource = ref<Post[]>([])
  const goddess = ref<Post[]>([])

  function applySection(section: string, data: any[]) {
    // [list:home] → posts, [list:match] → matches, 以此类推
  }

  return { posts, matches, liveList, liveRoom, selfie, chat, resource, goddess, applySection }
})

interface Post {
  nick: string; level: string; vip?: string; avatar?: string
  time: string; section?: string; body: string
  image?: string; paywall?: string
  likes: number; comments: number; shares?: number
  hot?: string
}

interface Match {
  nick: string; age: number; city: string; avatar?: string
  level: string; vip?: string; tags: string; bio: string
  dist: string; active?: string
}

interface LiveEntry {
  nick: string; level: string; avatar?: string
  viewers: string; title: string; status: string; preview: string
}

interface LiveRoom {
  nick: string; avatar?: string; viewers: string
  status: string; content: string; danmaku?: string
}
```

### 5.3 dm Store

```typescript
// src/stores/dm.ts
export const useDmStore = defineStore('mlife:dm', () => {
  const contacts = ref<Contact[]>([])
  const unboxCache = ref<Record<string, UnboxData>>({})
  const unboxedIds = ref<string[]>([])

  // 已开盒防重复扣费（第七章）
  async function onUnbox(id: string) {
    if (unboxedIds.value.includes(id)) {
      if (unboxCache.value[id]) return unboxCache.value[id]
    }
    // 触发页面刷新请求开盒数据
  }

  return { contacts, unboxCache, unboxedIds, onUnbox }
})

interface Contact {
  nick: string; level: string; avatar?: string
  lastMsg: string; lastTime: string; unread: number
  messages: Message[]
}

interface Message {
  role: 'outgoing' | 'incoming'
  time: string
  type: 'text' | 'voice' | 'image'
  text: string
  duration?: string
  desc?: string
}

interface UnboxData {
  id: string; nick: string; age: number; job: string; level: string
  occupation: string; measurements: string
  height: string; figure: string
  drive: string; tags: string
  sensitive: string; preference: string
}
```

### 5.4 recruit Store

```typescript
// src/stores/recruit.ts
export const useRecruitStore = defineStore('mlife:recruit', () => {
  const list = ref<Recruit[]>([])
  const manage = ref<Recruit[]>([])
  const detail = ref<RecruitDetail | null>(null)
  const postResult = ref<{ result: string; message: string } | null>(null)

  return { list, manage, detail, postResult }
})

interface Recruit {
  code: string; credit: string; type: string
  title: string; budget: string; location?: string
  tags: string; status: string; applicants: number
}

interface RecruitDetail extends Recruit {
  description: string; requirements: string
}
```

### 5.5 app Store

```typescript
// src/stores/app.ts
export const useAppStore = defineStore('mlife:app', () => {
  const theme = ref<'light' | 'dark'>('light')
  const phoneOpen = ref(false)
  const ballPosition = ref({ x: -30, y: 100 })
  const formatTemplates = ref<Record<string, string>>({})

  function loadFromLocalStorage() {
    // 加载主题
    const savedTheme = localStorage.getItem('mlife_theme')
    if (savedTheme) theme.value = savedTheme as 'light' | 'dark'

    // 加载球位置
    const savedPos = localStorage.getItem('mlife_ball_pos')
    if (savedPos) ballPosition.value = JSON.parse(savedPos)

    // 加载格式化模板
    formatTemplates.value = loadFormatTemplates()
  }

  return {
    theme, phoneOpen, ballPosition, formatTemplates,
    loadFromLocalStorage,
    saveFormatTemplate,
    resetFormatTemplate,
  }
})
```


### 5.6 useMlifeStore 组合 Store

由于数据分散在 5 个子 store 中，定义一个组合 Hook 方便一次性访问全部状态：

```typescript
// src/stores/mlife.ts（新增）
import { useUserStore } from './user'
import { useSocialStore } from './social'
import { useDmStore } from './dm'
import { useRecruitStore } from './recruit'
import { useAppStore } from './app'

export function useMlifeStore() {
  const user = useUserStore()
  const social = useSocialStore()
  const dm = useDmStore()
  const recruit = useRecruitStore()
  const app = useAppStore()

  return { user, social, dm, recruit, app }
}

export type MlifeStore = ReturnType<typeof useMlifeStore>
```

**在 composables 中使用**：`const store = useMlifeStore()` 即可访问全部子 store，`klona(store.$state)` 深拷贝全状态注入给 AI。

---

## 第六章：解析器实现

### 6.1 核心解析函数

**代码位置**：`src/utils/parser.ts`

```typescript
export interface DataUpdates {
  [key: string]: any
}

// 分离叙事与数据块
export function splitResponse(text: string): { narrative: string; dataBlock: string | null } {
  const m = text.match(/==mlife_data==\n([\s\S]*?)\n==\/mlife_data==/)
  if (!m) return { narrative: text, dataBlock: null }
  return {
    narrative: text.replace(/==mlife_data==[\s\S]*?==\/mlife_data==/, '').trim(),
    dataBlock: m[1].trim(),
  }
}

// 解析数据块 → 返回结构化更新
export function parseMlifeData(block: string): DataUpdates {
  const updates: DataUpdates = {}
  let section = 'meta'
  let listType = ''
  let listItem: any = null

  for (const line of block.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue

    if (t === '--') {
      if (listItem && listType) {
        ((updates[listType] ??= []) as any[]).push(listItem)
      }
      listItem = {}
      continue
    }

    const sectionMatch = t.match(/^\[(\w+(?::\w+)*)\]$/)
    if (sectionMatch) {
      if (listItem && listType) {
        ((updates[listType] ??= []) as any[]).push(listItem)
        listItem = null
      }
      listType = sectionMatch[1].startsWith('list') ? sectionMatch[1] : ''
      section = sectionMatch[1]
      continue
    }

    const ci = t.indexOf(': ')
    if (ci === -1) { section = t; continue }

    const k = t.slice(0, ci).trim()
    const v = t.slice(ci + 2).trim()
    if (listItem) { listItem[k] = v; continue }
    if (section === 'meta') { updates[k] = v; continue }

    ((updates[section] ??= {}) as Record<string, string>)[k] = v
  }

  if (listItem && listType)
    ((updates[listType] ??= []) as any[]).push(listItem)

  return updates
}

// 应用更新到 Pinia
export function applyUpdates(updates: DataUpdates, store: MlifeStore) {
  // [user] → store.user.applyUpdates
  // [list:home] → store.social.applySection('posts', data)
  // [list:dm:xxx] → store.dm 更新对应联系人消息
  // [badges] → store.dm/其他更新红点
  // [notice] → store.user 更新 + Toast 提示
  // 等等
}
```

### 6.2 容错策略

```typescript
// 解析失败 → 静默跳过，保留旧数据
// 坏一行 → 跳一行
// 坏一个条目 → 跳一个条目
// 坏整个块 → 可重试
```

### 6.3 旧格式兼容

```typescript
// 过渡期兼容 <mlife_app>JSON</mlife_app>
export interface MlifeBlock {
  format: 'line' | 'json'
  content: any
}

export function extractMlifeBlocks(text: string): MlifeBlock[] {
  const result: MlifeBlock[] = []

  // 新格式 ==mlife_data==
  const r1 = /==mlife_data==\n([\s\S]*?)\n==\/mlife_data==/g
  let m: RegExpExecArray | null
  while ((m = r1.exec(text)) !== null)
    result.push({ format: 'line', content: m[1] })

  // 旧格式 <mlife_app>JSON</mlife_app>
  const r2 = /<mlife_app>([\s\S]*?)<\/mlife_app>/gi
  while ((m = r2.exec(text)) !== null) {
    try { result.push({ format: 'json', content: JSON.parse(m[1]) }) } catch {}
  }

  return result
}
```

---

## 第七章：路由与页面映射

### 7.1 路由表

**代码位置**：`src/router/index.ts`

```typescript
import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/home', name: 'home', component: () => import('../views/HomePage.vue') },
  { path: '/match', name: 'match', component: () => import('../views/MatchPage.vue') },
  { path: '/match/:id', name: 'matchDetail', component: () => import('../views/MatchDetail.vue') },
  { path: '/live', name: 'live', component: () => import('../views/LiveList.vue') },
  { path: '/live/:id', name: 'liveRoom', component: () => import('../views/LiveRoom.vue') },
  { path: '/dm', name: 'dm', component: () => import('../views/DmList.vue') },
  { path: '/dm/:id', name: 'dmChat', component: () => import('../views/DmChat.vue') },
  { path: '/profile', name: 'profile', component: () => import('../views/ProfilePage.vue') },
  { path: '/profile/selfie', name: 'selfie', component: () => import('../views/HomePage.vue'), props: { section: 'selfie' } },
  { path: '/profile/chat', name: 'chat', component: () => import('../views/HomePage.vue'), props: { section: 'chat' } },
  { path: '/profile/resource', name: 'resource', component: () => import('../views/HomePage.vue'), props: { section: 'resource' } },
  { path: '/profile/goddess', name: 'goddess', component: () => import('../views/HomePage.vue'), props: { section: 'goddess' } },
  { path: '/recruit', name: 'recruit', component: () => import('../views/RecruitList.vue') },
  { path: '/recruit/:id', name: 'recruitDetail', component: () => import('../views/RecruitDetail.vue') },
  { path: '/recruit/post', name: 'recruitPost', component: () => import('../views/RecruitPost.vue') },
  { path: '/recruit/manage', name: 'recruitManage', component: () => import('../views/RecruitManage.vue') },
  { path: '/settings', name: 'settings', component: () => import('../views/settings/SettingsPage.vue') },
  // unbox 作为 Modal 不走路由，由组件内部控制
]

export default createRouter({
  history: createWebHashHistory(),
  routes,
})
```

### 7.2 页面 ↔ 提示词 ↔ 格式化模板映射

| 路由 | 页面 | 刷新提示词 key | 格式化模板 key |
|------|------|---------------|---------------|
| `/home` | 首页 | `home` | `home` |
| `/match` | 匹配 | `match` | `match` |
| `/match/:id` | 匹配详情 | `matchDetail` | `matchDetail` |
| `/live` | 直播列表 | `live` | `live` |
| `/live/:id` | 直播间 | `liveRoom` | `liveRoom` |
| `/dm` | 私信联系人 | `dmContacts` | `dmContacts` |
| `/dm/:id` | 聊天窗口 | `dmChat` | `dm` |
| `/profile` | 个人中心 | `profile` | `profile` |
| `/profile/selfie` | 福利自拍 | `selfie` | `selfie` |
| `/profile/chat` | 闲聊灌水 | `chat` | `chat` |
| `/profile/resource` | 资源分享 | `resource` | `resource` |
| `/profile/goddess` | 女神夜话 | `goddess` | `goddess` |
| `/recruit` | 招募广场 | `recruit` | `recruit` |
| `/recruit/:id` | 招募详情 | `recruitDetail` | `recruitDetail` |
| `/recruit/post` | 发布招募 | `recruitPost` | `recruitPost` |
| `/recruit/manage` | 我的管理 | `recruitManage` | `recruitManage` |
| `/settings` | 设置 | 无 | 无 |

---

## 第八章：全局组件实现要点

### 8.1 App.vue 布局

**PC 模式（> 900px）**：
```
┌────────────────────────────────┬──────────────────┐
│  <StoryPane />                 │ <FloatingBall /> │
│  (max-width: 520px, 居中)       │                  │
│                                │ <PhoneFrame />   │
│  <InputBar />                  │ (375px × 100vh)  │
│  (底部全宽)                     │ 点击球后右侧滑入 │
└────────────────────────────────┴──────────────────┘
```

**移动模式（< 500px）**：
```
全屏手机界面 <PhoneFrame />
顶部下拉 → <StoryDrawer /> 半屏展开
```

**窄屏（500-900px）**：
```
默认：StoryPane 全屏
💎 点击 → PhoneFrame 全屏替换
```

### 8.2 PhoneFrame.vue

```vue
<template>
  <div class="phone-frame" :class="{ open: appStore.phoneOpen }">
    <!-- 状态栏 → PhoneStatusBar -->
    <!-- 头部 → PhoneHeader (标题 + 🔔 + ☀️/🌙) -->
    <!-- 内容区 → router-view -->
    <!-- 底部导航 → NavBar (5 Tab) -->
    <!-- 关闭按钮 → ✕ -->
  </div>
</template>
```

**PC 模式下点击外部关闭逻辑**：

```typescript
// PhoneFrame.vue 或 App.vue 中
// 点击手机框外部（遮罩层）关闭
function onOverlayClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  // 如果点击的是遮罩层本身（不是手机框内部），关闭
  if (target.classList.contains('phone-overlay')) {
    appStore.phoneOpen = false
  }
}
```

在 PC 双栏布局中，PhoneFrame 外部包裹一层 `.phone-overlay` 遮罩层。点击遮罩层 → 关闭手机框。手机框内部点击不冒泡到遮罩层。

### 8.3 FloatingBall.vue

- 拖拽 → 更新 `appStore.ballPosition`
- 点击 → 切换 `appStore.phoneOpen`
- 位置 → 存入 `localStorage('mlife_ball_pos')`
- 加载 → 从 localStorage 恢复位置

### 8.4 全屏展开机制（参考伊莉雅 VN）

**场景**：M-life 在酒馆 iframe 中嵌入时（紧凑入口模式），点击"全屏展开"后替换整个酒馆页面。

**链路**：

```
tavern helper iframe
  → 紧凑入口显示（💎 + 动态预览）
    → 用户点击"展开"
      → parent.$('body').load(GAME_URL)  [全屏展开]
        → M-life 替换整个酒馆页面，独占浏览器
```

**代码位置**：`composables/useFullscreen.ts` 或 `App.vue`

```typescript
// src/composables/useFullscreen.ts
const GAME_URL = 'http://10.0.0.18:5500/dist/魅途/'

function isInsideIframe(): boolean {
  try {
    return window.self !== window.top
  } catch {
    return true  // 跨域访问被拒绝 → 说明在 iframe 中
  }
}

function expandToFullscreen() {
  if (!isInsideIframe()) return  // 已全屏，无需展开
  // 替换整个酒馆页面
  parent.$('body').load(GAME_URL)
}

function startStory() {
  // 先全屏展开，再直进首页
  expandToFullscreen()
  // 展开后自动进入首页内容
}
```

**紧凑入口模式**（iframe 高度 < 400px 时）：

```vue
<!-- 紧凑模式下的 FloatingBall 展开形态 -->
<div v-if="isInsideIframe && compactMode" class="compact-entry">
  <div class="compact-preview">
    <span class="ball-icon">💎</span>
    <span class="expand-text">M-life 展开 ▸</span>
  </div>
  <div class="compact-feed">
    <!-- 动态预览：最新帖子摘要 -->
    <div class="preview-item">帖子: 睡不着有人...</div>
  </div>
  <button @click="startStory" class="expand-btn">进入 M-life</button>
</div>
```

**已知问题**（参考伊莉雅经验）：
- `parent.$('body').load()` 替换后，酒馆页面完全被 M-life 替代，无法回到酒馆
- 需提供"退出"或"返回酒馆"的入口（M-life 设置页中加一个"退出"按钮 → `parent.location.reload()` 回到酒馆）

### 8.5 退出全屏

```typescript
function exitToTavern() {
  // 重新加载酒馆页面
  parent.location.reload()
}
```

在 **☺ 我的 → ⚙️ 设置** 中添加"退出 M-life"按钮，仅在全屏模式下显示。

### 8.6 状态组件

```vue
<!-- SkeletonBox.vue — shimmer 扫光动画 -->
<!-- EmptyState.vue — "还没有动态" / "今日已用完" / "无直播" -->
<!-- ErrorState.vue — "加载失败" + 重试按钮 -->
<!-- ToastProvider.vue — 全局消息提示，3.6s 自动消失 -->
<!-- ConfirmModal.vue — 确认弹窗（开盒扣费、发送前确认等） -->
```

各状态组件触发条件（详见产品文档 8.3 节）：

| 状态 | 组件 | 触发条件 |
|------|------|---------|
| Loading | `SkeletonBox.vue` | 页面刷新 API 调用中，显示 shimmer 骨架屏 |
| Empty | `EmptyState.vue` | API 返回空数据，文案按页面区分 |
| Error | `ErrorState.vue` | API 调用失败，显示错误 + 重试按钮 |
| Success | 页面内容 | 数据加载成功 |
| Sending | 发送按钮置灰 + spinner | 输入框消息发送中 |
| Submitting | 表单按钮 loading | 发布招募/修改设置等提交操作中 |
| VIPLocked | 🔒 图标 + Toast | 访问 VIP 功能但等级不足 |
| Matched | Toast "匹配成功" | 匹配操作完成后 |

---

## 第九章：快照与刷新恢复

### 9.1 快照保存/恢复

**代码位置**：`src/composables/useSnapshot.ts`

```typescript
const SNAPSHOT_KEYS = ['balance', 'level', 'vip', 'unboxed'] as const

export function useSnapshot() {
  function saveSnapshot() {
    localStorage.setItem('mlife_snap', JSON.stringify({
      balance: userStore.balance,
      level: userStore.level,
      vip: userStore.vip,
      unboxed: dmStore.unboxedIds,
    }))
  }

  function loadSnapshot() {
    try {
      const s = JSON.parse(localStorage.getItem('mlife_snap') || '{}')
      if (s.balance != null) userStore.balance = s.balance
      if (s.level) userStore.level = s.level
      if (s.vip) userStore.vip = s.vip
      if (s.unboxed) dmStore.unboxedIds = s.unboxed
    } catch {}
  }

  return { saveSnapshot, loadSnapshot }
}
```

### 9.2 应用初始化顺序

```typescript
// index.ts 入口文件
async function initMlife() {
  // 1. 创建 Pinia 实例
  // 2. 加载 localStorage 快照（loadSnapshot）
  // 3. 加载格式化模板（loadFormatTemplates）
  // 4. 加载主题/球位置等 UI 偏好（appStore.loadFromLocalStorage）
  // 5. 注册正则（第十章）
  // 6. 挂载 Vue 应用（app.mount）
  // 7. 初次首页刷新（usePageRefresh.refreshPage('home')）
  // 8. 保存快照周期（每次全量对话后 saveSnapshot）
}
```

---

## 第十章：正则规则

### 10.1 两条正则

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

### 10.2 正则文件

在 `tavern_helper_template/src/魅途/` 目录下创建正则文件，输出路径参考已有项目的格式。

---

## 第十一章：实施步骤

### Phase 1：框架（3-5 天）

| # | 任务 | 文件 |
|---|------|------|
| 1.1 | 脚手架：index.ts + index.html + App.vue + global.css | `src/魅途/index.ts`, `index.html`, `App.vue`, `global.css` |
| 1.2 | Pinia Store：user, social, dm, recruit, app + types | `src/魅途/stores/*.ts`, `src/魅途/types/mlife.ts` |
| 1.3 | 核心布局：App.vue PC 双栏 + PhoneFrame + FloatingBall | `App.vue`, `PhoneFrame.vue`, `FloatingBall.vue`, `StoryPane.vue`, `InputBar.vue` |
| 1.4 | Vue Router + 所有路由 + NavBar | `src/魅途/router/index.ts`, `NavBar.vue` |
| 1.5 | 主题系统：CSS 变量 + 切换（第十一章） | `global.css`, `PhoneHeader.vue`（切换按钮） |
| 1.6 | 解析器：splitResponse / parseMlifeData / applyUpdates | `src/魅途/utils/parser.ts` |
| 1.7 | 通用组件：SkeletonBox, EmptyState, ErrorState, Toast, ConfirmModal | `src/魅途/components/*.vue` |
| 1.8 | 酒馆 API 封装 + usePageRefresh + useMlifeInject | `src/魅途/utils/api.ts`, `composables/*.ts` |
| 1.9 | 正则 + 加载链路验证 | `正则\MlifeApp`, `index.ts` init 流程 |

### Phase 2：核心页面（5-7 天）

| # | 页面 | 组件 | 天数 |
|---|------|------|------|
| 2.1 | 🏠 首页 | HomePage.vue, PostCard.vue | 1.5 |
| 2.2 | ♡ 匹配 | MatchPage.vue, MatchCard.vue, MatchDetail.vue | 1.5 |
| 2.3 | ▶ 直播 | LiveList.vue, LiveRoom.vue, DanmakuArea.vue | 1.5 |
| 2.4 | ✉ 私信 | DmList.vue, DmChat.vue, MessageBubble.vue | 2 |
| 2.5 | ☺ 我的 | ProfilePage.vue, SignInButton.vue, FeatureEntry.vue | 1 |

### Phase 3：复杂功能（3-4 天）

| # | 功能 | 组件 | 天数 |
|---|------|------|------|
| 3.1 | 💎 招募广场 + 详情 + 发布表单 | RecruitList, RecruitDetail, RecruitPost | 2 |
| 3.2 | 💎 我的管理 + 应征操作 | RecruitManage | 1 |
| 3.3 | 🔓 开盒 Modal + 防重复扣费 | UnboxModal | 0.5 |
| 3.4 | 子页面 + 导航集成 | 子页面路由 + NavBar | 1 |

### Phase 4：打磨（2-3 天）

| # | 任务 |
|---|------|
| 4.1 | 移动端 StoryDrawer + 手势 + 全屏 |
| 4.2 | 动画集成（第十二章） |
| 4.3 | 本地快照 + 刷新恢复 |
| 4.4 | 全屏展开 + iframe 适配 |
| 4.5 | 旧格式兼容测试 |

### 总计：13-19 天

---

## 第十二章：实际开发中的注意事项

### 12.1 自动导入

项目已配置 `unplugin-auto-import`，Vue API（ref, computed, watch 等）、Pinia（defineStore, storeToRefs）、VueUse 都自动导入，不需要手动 `import`。

### 12.2 TypeScript 严格模式

已启用 `noUnusedLocals` 和 `noUnusedParameters`，开发时注意不要留下未使用的变量。

### 12.3 构建命令

```bash
pnpm build          # 生产构建 → dist/魅途/index.html (~15KB)
pnpm build:dev      # 开发构建 → dist/魅途/index.html (~240KB)
pnpm watch          # 监听模式，自动增量构建
```

### 12.4 热重载

`pnpm watch` 启动后，webpack 会监听 `src/魅途/` 目录的变化，通过 Socket.IO 推送到酒馆页面，酒馆页面自动更新。

### 12.5 入口文件识别

`webpack.config.ts` 会自动扫描 `src/**/index.ts` 作为入口文件。确保 `src/魅途/index.ts` 存在即可。

### 12.6 依赖说明

项目已安装以下 M-life 需要的依赖：
- `vue` ^3.5（框架）
- `pinia` ^3.0（状态管理）
- `vue-router` ^4.6（路由）
- `@vueuse/core` ^13.9（工具库）
- `lodash` ^4.18（工具函数）
- `klona` ^2.0（深拷贝）
- `dedent` ^1.7（模板字符串缩进）

无需额外安装依赖。

### 12.7 CSS 兼容性

CSS 变量 + 动画 + 响应式断点需要浏览器支持。开发文档中使用的 CSS 特性：
- CSS 自定义属性（`--ml-*`）— 所有现代浏览器支持
- `translateX` / `translateY` / `scale` / `opacity` 动画 — 所有现代浏览器支持
- `shimmer` keyframe 动画 — 使用 `@keyframes` + `background: linear-gradient`
- 响应式断点使用 `@media (min-width: ...)` 和 `@media (max-width: ...)`

> 注意：由于输出产物是单 HTML 文件（所有 CSS/JS 内联），不需要额外的 PostCSS 或 autoprefixer 配置。CSS 使用标准语法即可。

### 12.8 快照保存时机

`saveSnapshot()` 在以下时机调用：
- 每次完整对话完成后（`useMlifeInject` 解析完 `==mlife_data==` 后）
- 开盒操作完成后
- 签到操作完成后
- 余额变动后

保存在 `localStorage('mlife_snap')`，约 50 字节。