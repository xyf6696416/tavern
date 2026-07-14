/* ═══════════════════════════════════════════
   M-life 类型定义
   ═══════════════════════════════════════════ */

// ─── 帖子 ───
export interface Post {
  nick: string
  level: string
  vip?: string
  avatar?: string
  time: string
  section?: string
  body: string
  image?: string
  images?: string
  paywall?: string
  likes: number
  comments: number
  shares?: number
  hot?: string
}

// ─── 匹配 ───
export interface Match {
  nick: string
  age: number
  city: string
  avatar?: string
  level: string
  vip?: string
  tags: string
  bio: string
  dist: string
  active?: string
}

export interface MatchDetail {
  nick: string
  avatar?: string
  level: string
  vip?: string
  age: number
  city: string
  dist: string
  active: string
  bio: string
  tags: string
  photos?: string
}

// ─── 直播 ───
export interface LiveEntry {
  nick: string
  level: string
  avatar?: string
  viewers: string
  title: string
  status: string
  preview: string
}

export interface LiveRoom {
  nick: string
  avatar?: string
  viewers: string
  status: string
  content: string
  danmaku?: string
}

// ─── 私信 ───
export interface Contact {
  id: string
  nick: string
  level: string
  avatar?: string
  lastMsg: string
  lastTime: string
  unread: number
  messages: Message[]
}

export interface Message {
  role: 'outgoing' | 'incoming'
  time: string
  type: 'text' | 'voice' | 'image'
  text: string
  duration?: string
  desc?: string
}

export interface UnboxData {
  id: string
  nick: string
  age: number
  job: string
  level: string
  occupation: string
  measurements: string
  height: string
  figure: string
  drive: string
  tags: string
  sensitive: string
  preference: string
}

// ─── 招募 ───
export interface Recruit {
  code: string
  credit: string
  type: string
  title: string
  budget: string
  location?: string
  time?: string
  tags: string
  status: string
  applicants: number
}

export interface RecruitDetail extends Recruit {
  description: string
  requirements: string
}

// ─── 用户 ───
export interface UserData {
  account: string
  balance: number
  exp: string
  vip: string
  level: string
  signin: string
  signinStreak: number
  likes: number
  fans: number
  following: number
  matchToday: string
  postToday: string
  recruitActive: number
  recruitApplied: number
  unboxed: string[]
}

// ─── 数据更新 ───
export interface DataUpdates {
  [key: string]: any
}

// ─── 格式化模板 ───
export type FormatTemplateKey = keyof typeof DEFAULT_FORMAT_TEMPLATES

// ─── 默认格式化模板 ───
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