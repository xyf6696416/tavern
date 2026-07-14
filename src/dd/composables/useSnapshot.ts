/* ═══════════════════════════════════════════
   composables/useSnapshot.ts — 快照保存/恢复 Composable
   ═══════════════════════════════════════════

   关键字段快照（balance, level, vip, unboxed）
   保存到 localStorage('mlife_snap')，约 50 字节
   ═══════════════════════════════════════════ */

import { useUserStore } from '../stores/user'
import { useDmStore } from '../stores/dm'

const SNAPSHOT_KEY = 'mlife_snap'

/**
 * 快照保存/恢复
 * 关键字段：balance, level, vip, unboxed
 */
export function useSnapshot() {
  const user = useUserStore()
  const dm = useDmStore()

  /**
   * 保存快照到 localStorage
   */
  function saveSnapshot() {
    try {
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({
        balance: user.balance,
        level: user.level,
        vip: user.vip,
        unboxed: dm.unboxedIds,
      }))
    } catch (e) {
      console.error('[M-life 快照] 保存失败', e)
    }
  }

  /**
   * 从 localStorage 恢复快照
   */
  function loadSnapshot() {
    try {
      const s = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || '{}')
      if (s.balance != null) user.balance = Number(s.balance)
      if (s.level) user.level = String(s.level)
      if (s.vip) user.vip = String(s.vip)
      if (s.unboxed) dm.unboxedIds = [...s.unboxed]
    } catch {
      // 无快照或格式错误，静默跳过
    }
  }

  return { saveSnapshot, loadSnapshot }
}