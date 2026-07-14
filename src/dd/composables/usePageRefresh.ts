/* ═══════════════════════════════════════════
   composables/usePageRefresh.ts — 页面刷新 Composable
   ═══════════════════════════════════════════

   流程：检查缓存 → 获取页面提示词 → api.pageRefresh
         → 解析 → 更新 Pinia → 缓存
   ═══════════════════════════════════════════ */

import { klona } from 'klona'
import { useAppStore } from '../stores/app'
import { serializeAllState } from '../stores/mlife'
import { useMlifeStore } from '../stores/mlife'
import { getPagePrompt } from '../constants/pagePrompts'
import { splitResponse, parseMlifeData } from '../utils/parser'
import { applyUpdates } from '../utils/applyUpdates'
import * as api from '../utils/api'

const CACHE_TTL = 5 * 60 * 1000 // 5 分钟缓存

export function usePageRefresh() {
  const app = useAppStore()

  /**
   * 刷新指定页面的数据
   * @param page 页面 key（对应 pagePrompts.ts 中的 key）
   * @param pageId 可选 — 页面附加标识（如 matchDetail 的 id）
   * @param force 是否强制刷新（跳过缓存）
   * @returns 解析后的数据更新
   */
  async function refreshPage(page: string, pageId?: string | boolean, force?: boolean): Promise<Record<string, any> | null> {
    // 兼容重载: refreshPage('home', true) / refreshPage('matchDetail', 'some-id')
    if (typeof pageId === 'boolean') {
      force = pageId
      pageId = undefined
    }

    // 1. 检查缓存
    if (!force) {
      const cached = app.pageCache.get(page)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return klona(cached.data)
      }
    }

    // 2. 获取页面提示词
    let prompt = getPagePrompt(page)
    if (!prompt) {
      console.warn(`[M-life] 未知页面: ${page}，无提示词`)
      return null
    }

    // 2a. 如果有 pageId，拼入提示词上下文
    if (pageId) {
      prompt = `目标 ID: ${pageId}\n\n${prompt}`
    }

    // 3. 序列化当前状态
    const state = serializeAllState()
    const stateStr = JSON.stringify(state, null, 2)

    // 4. 组装完整 prompt
    const fullPrompt = `${prompt}\n\n当前状态：\n${stateStr}`

    // 5. 走页面刷新 API
    const response = await api.pageRefresh(fullPrompt)

    // 6. 解析
    const { narrative, dataBlock: raw } = splitResponse(response)

    if (raw) {
      const updates = parseMlifeData(raw)

      // 7. 应用更新到各 store（使用公共函数）
      applyUpdates(updates)

      // 8. 缓存
      app.pageCache.set(page, { data: updates, timestamp: Date.now() })

      // 9. 保存快照
      const { useSnapshot } = await import('./useSnapshot')
      useSnapshot().saveSnapshot()

      return updates
    }

    return null
  }

  /**
   * 清除指定页面的缓存
   */
  function invalidatePage(page: string) {
    app.pageCache.delete(page)
  }

  /**
   * 清除所有页面缓存
   */
  function clearAllCache() {
    app.pageCache = new Map()
  }

  return { refreshPage, invalidatePage, clearAllCache }
}