/* ═══════════════════════════════════════════
   utils/api.ts — 酒馆 API 封装
   ═══════════════════════════════════════════ */

/** 是否在独立模式（非酒馆内嵌 iframe）下运行，此时走 mock 降级 */
const isStandalone = typeof TavernHelper === 'undefined'

/**
 * 完整对话：写入消息楼层
 * 调用 TavernHelper.generate，返回 AI 完整回复
 */
export async function sendMessage(prompt: string): Promise<string> {
  if (isStandalone) {
    console.info('[M-life API] 独立模式，sendMessage 降级 mock')
    return mockResponse(prompt)
  }

  const response = await TavernHelper.generate({
    userInput: prompt,
  })
  return response
}

/**
 * 页面刷新：不写入楼层，只返回数据
 * 调用 TavernHelper.generateRaw，不保存到对话历史
 */
export async function pageRefresh(prompt: string): Promise<string> {
  if (isStandalone) {
    console.info('[M-life API] 独立模式，pageRefresh 降级 mock')
    return mockResponse(prompt)
  }

  const response = await TavernHelper.generateRaw({
    userInput: prompt,
  })
  return response
}

/* ─── Mock 降级 ─── */

/**
 * 返回开场数据的 ==mlife_data== 格式字符串
 * 各页面刷新时返回对应页面的 mock 数据
 */
function mockResponse(_prompt: string): string {
  // 统一返回包含所有模块的开场数据
  return `这是 M-life 的模拟回复内容。

==mlife_data==
[user]
account: 夜风中的猫 | Lv3 | 黄金 | M币: 37250
balance: 37250
exp: 1250/6000
level: Lv3
vip: 黄金
signin: 未签
signin_streak: 12
likes: 342
fans: 87
following: 156
match_today: 1/2
post_today: 3/8
recruit_active: 2
recruit_applied: 5
unboxed: 小甜心021,暗夜玫瑰

[list:home]
--
nick: 深夜食堂 | Lv4 | 黑金
avatar: 🍜
time: 23:15
section: 闲聊灌水
body: 深夜了 有人一起恰夜宵吗 我请客 前提是陪我聊到天亮
image: 一锅热气腾腾的麻辣烫，红油浮面，配料丰富
paywall: 无
likes: 847
comments: 234
shares: 56
hot1: 吃货小萌: 啊啊啊这家超好吃！上次吃完拉了两天肚子但还是想去！
hot2: 夜猫子: 下次可以叫上我吗 我出酒
--
nick: 小雨转晴 | Lv2 | 白银
avatar: 🌂
time: 22:50
section: 福利自拍
body: 今天淋了点雨 换了套新买的睡衣 感觉还不错
image: 白色吊带睡裙，微湿长发，滑落的吊带露出肩膀和锁骨
paywall: 需10M币解锁
likes: 1256
comments: 389
shares: 128
--
nick: 茶里茶气 | Lv3 | 黄金
avatar: 🍵
time: 21:30
section: 女神夜话
body: 今天的date对象 聊挺好 结果吃到一半跟我聊前任 下头
paywall: 无
likes: 2341
comments: 567
shares: 89
hot1: 感情分析师: 经典的date聊前任红牌行为
hot2: 吃瓜群众: 求id避雷 私我私我
--
nick: 摄影师阿Ken | Lv5 | 黑金
avatar: 📷
time: 20:00
section: 资源分享
body: 新到一批私房写真套图 日系小清新风格
title: 【写真】夏の記憶·第一弹
file_size: 2.4GB
file_format: ZIP/JPEG
price: 免费
likes: 3456
comments: 892
downloads: 1234
--

[list:match]
--
nick: 甜甜圈公主 | 22岁 | 1.2km
avatar: 🍩
age: 22
dist: 1.2km
active: 刚刚活跃
level: Lv3
vip: 黄金
tags: 美食,逛街,摄影,看电影
bio: 周末喜欢去探店 最近迷上了手冲咖啡 想找人一起打卡新开的甜品店
--
nick: 夜跑达人 | 24岁 | 3.5km
avatar: 🏃
age: 24
dist: 3.5km
active: 5分钟前
level: Lv2
vip: 白银
tags: 运动,户外,音乐,阅读
bio: 每天晚上10点固定夜跑5km

[list:live]
--
主播头像: 🎤
主播昵称: 甜甜Music♪
主播等级: Lv4
观看人数: 1256
直播标题: 今晚来点R&B 点点歌呗~
直播状态: 正在直播
预览: 穿着宽松的白色卫衣，戴着大耳机，调试麦克风
--
主播头像: 💪
主播昵称: 健身教练小刘
主播等级: Lv3
观看人数: 834
直播标题: 夜练专场 跟练一小时燃脂
直播状态: 正在直播
预览: 黑色背心和运动短裤，正在做俯卧撑
--
主播头像: 🎨
主播昵称: 画画的小鱼
主播等级: Lv2
观看人数: 267
直播标题: 摸鱼画画 今日画一条美人鱼~
直播状态: 即将开播
预览:

[list:recruit]
--
title: 周末艺术展+下午茶 找一个有品味的你
poster: NGW#4721 | 💎黄金
credit: 4.8
type: 📍 单人约会
budget: 50000 M币
location: 上海·外滩 | 本周六 14:00
tags: 艺术,看展,下午茶,聊天
status: 招募中 | applicants: 3
--
title: 长期固定CP 古风/现代皆可
poster: ACE#8912 | 💎黄金
credit: 4.5
type: 🎭 角色扮演
budget: 80000 M币
location: 线上
tags: 古风,现代,剧情向,长期
status: 招募中 | applicants: 7
--
title: 私人生日派对 招募4位玩伴
poster: VIP#3301 | 💎黑金
credit: 4.9
type: 👥 多人聚会
budget: 200000 M币/人
location: 深圳·南山 | 下周五 20:00
tags: 派对,高端,私密,社交
status: 已锁定 | applicants: 1
--

[badges]
dm: 3
match: 1
==/mlife_data==`
}
