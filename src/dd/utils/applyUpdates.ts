/* ═══════════════════════════════════════════
   utils/applyUpdates.ts — 公共数据更新分发
   ═══════════════════════════════════════════

   被 usePageRefresh 和 useMlifeInject 共同使用，
   确保页面刷新与完整对话注入走同一套更新逻辑。
   ═══════════════════════════════════════════ */

import { useMlifeStore } from '../stores/mlife'
import { useAppStore } from '../stores/app'

/**
 * 应用数据更新到各个 Pinia store
 * 根据 updates 中的 section 分发到对应的 store
 */
export function applyUpdates(updates: Record<string, any>) {
  const store = useMlifeStore()

  // [user] → store.user.applyUpdates
  if (updates.user) {
    store.user.applyUpdates(updates.user)
  }

  // [profile] → store.user (部分字段)
  if (updates.profile) {
    store.user.applyUpdates(updates.profile)
  }

  // [list:*] 列表类型 → 通过 social.applySection / dm / recruit 分发
  for (const key of Object.keys(updates)) {
    if (key.startsWith('list:')) {
      if (key === 'list:home' || key === 'list:match' || key === 'list:selfie' ||
          key === 'list:chat' || key === 'list:resource' || key === 'list:goddess' ||
          key === 'list:live') {
        store.social.applySection(key, updates[key])
      } else if (key.startsWith('list:dm_contacts')) {
        store.dm.applyContacts(updates[key])
      } else if (key.startsWith('list:dm:')) {
        const contactId = key.split(':')[2]
        store.dm.applyMessages(contactId, updates[key])
      } else if (key === 'list:recruit') {
        store.recruit.applyList(updates[key])
      } else if (key === 'list:recruit_manage') {
        store.recruit.applyManage(updates[key])
      }
    }
  }

  // 单对象 section
  if (updates.match_detail) {
    store.social.applySingle('match_detail', updates.match_detail)
  }
  if (updates.live_room) {
    store.social.applySingle('live_room', updates.live_room)
  }
  if (updates.recruit_detail) {
    store.recruit.applyDetail(updates.recruit_detail)
  }
  if (updates.recruit_post) {
    store.recruit.applyPostResult(updates.recruit_post)
  }
  if (updates.unbox) {
    store.dm.applyUnbox(updates.unbox)
  }

  // [badges]
  if (updates.badges) {
    store.dm.applyBadges(updates.badges)
  }

  // [notice] — 显示 toast 通知
  if (updates.notice) {
    const notice = updates.notice
    if (notice.type === 'signin' || notice.type === 'payment' || notice.type === 'levelup') {
      const appStore = useAppStore()
      appStore.addToast(notice.message || `${notice.type} 成功`, 'info')
    }
  }
}