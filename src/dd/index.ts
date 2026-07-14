/* ═══════════════════════════════════════════
   index.ts — M-life 前端入口文件
   ═══════════════════════════════════════════

   挂载链路：
     酒馆消息楼层包含 iframe 加载 dist/dd/index.html
     → 本脚本执行，挂载 Vue SPA

   初始化顺序：
     1. 创建 Pinia + Vue Router
     2. 读最新楼层 → 恢复全量状态（消息历史=数据库）
     3. 没有楼层 → 视为新游戏 → 初始化默认状态
     4. 挂载 Vue 应用
     5. 路由到 '/' → 显示 TitleScreen

   数据持久化：
     - 每次 AI 回复的 ==mlife_data== 包含完整状态
     - 最新消息楼层就是权威数据源
     - 不需要额外的 localStorage 或快照
     - 重复加载同一楼层是幂等的

   注意：type="module" 脚本自动延迟到 DOM 解析完成后执行
   ═══════════════════════════════════════════ */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAppStore } from './stores/app'
import { useUserStore } from './stores/user'
import { useSocialStore } from './stores/social'
import { useDmStore } from './stores/dm'
import { useRecruitStore } from './stores/recruit'
import { loadStateFromMessages } from './utils/stateLoader'
import { STARTUP_DATA } from './utils/startupData'
import './global.css'

/**
 * 独款模式降级：用 STARTUP_DATA 填充初始数据
 */
function loadStandaloneData() {
  const d = STARTUP_DATA

  // 开场叙事正文
  if (d.context.rii_story) {
    setTimeout(() => {
      if (typeof (window as any).__mlife_setStory === 'function') {
        ;(window as any).__mlife_setStory(d.context.rii_story)
      }
    }, 100)
  }

  // user
  const user = useUserStore()
  Object.assign(user, {
    account: d.user.account,
    balance: d.user.balance,
    exp: d.user.exp,
    level: d.user.level,
    vip: d.user.vip,
    signin: d.user.signin,
    signinStreak: d.user.signinStreak,
    likes: d.user.likes,
    fans: d.user.fans,
    following: d.user.following,
    matchToday: d.user.matchToday,
    postToday: d.user.postToday,
    recruitActive: d.user.recruitActive,
    recruitApplied: d.user.recruitApplied,
    unboxed: d.user.unboxed,
  })

  // social
  const social = useSocialStore()
  social.posts = [...d.social.posts]
  social.matches = [...d.social.matches]
  social.matchDetail = d.social.matchDetail ? { ...d.social.matchDetail } : null
  social.liveList = [...d.social.liveList]
  social.liveRoom = d.social.liveRoom ? { ...d.social.liveRoom } : null
  social.selfie = [...d.social.selfie]
  social.chatPosts = [...d.social.chatPosts]
  social.resource = [...d.social.resource]
  social.goddess = [...d.social.goddess]

  // dm
  const dm = useDmStore()
  dm.contacts = d.dm.contacts.map(c => ({ ...c, messages: [...(c.messages || [])] }))
  dm.unboxCache = { ...d.dm.unboxCache }
  dm.unboxedIds = [...d.dm.unboxedIds]
  dm.badges = { ...d.dm.badges }

  // recruit
  const recruit = useRecruitStore()
  recruit.list = [...d.recruit.list]
  recruit.detail = d.recruit.detail ? { ...d.recruit.detail } : null
  recruit.manage = [...d.recruit.manage]

  console.info('[M-life] 开场数据已加载（独款模式）')
}

async function initMlife() {
  // 1. 创建 Vue 应用
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)

  // 2. 从最新消息楼层恢复全量状态（消息历史=数据库）
  const restored = await loadStateFromMessages()

  if (!restored) {
    const isStandalone = typeof TavernHelper === 'undefined'
    if (isStandalone) {
      // 独款模式：用静态 mock 数据
      loadStandaloneData()
    }
    // 酒馆新游戏：store 使用 defineStore 的默认值
    // （balance:0, level:Lv1, vip:无, ...）
  }

  // 3. 加载 UI 偏好（主题、球位置）
  const appStore = useAppStore()
  appStore.loadFromLocalStorage()

  // 4. 挂载
  app.mount('#app')
  console.info('[M-life] 已挂载')

  // 5. 卸载时清理
  window.addEventListener('pagehide', () => {
    app.unmount()
    console.info('[M-life] 已卸载')
  })
}

initMlife()