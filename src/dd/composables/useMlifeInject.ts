/* ═══════════════════════════════════════════
   composables/useMlifeInject.ts — AI 注入 Composable
   ═══════════════════════════════════════════

   流程：klona(store.$state) → renderAllTemplates → 组装 prompt
         → api.sendMessage → splitResponse → parseMlifeData → applyUpdates
         所有数据统一通过 ==mlife_data== 从 AI 回复中解析
   ═══════════════════════════════════════════ */

import { klona } from 'klona'
import { useMlifeStore } from '../stores/mlife'
import { serializeAllState } from '../stores/mlife'
import { renderAllTemplates } from '../utils/formatRenderer'
import { splitResponse, parseMlifeData } from '../utils/parser'
import { applyUpdates } from '../utils/applyUpdates'
import * as api from '../utils/api'
import { useAppStore } from '../stores/app'

export function useMlifeInject() {
  const app = useAppStore()

  /**
   * 将当前 Pinia 全状态注入给 AI，走完整对话
   * @param userInput 用户输入内容
   * @returns 纯叙事正文（已剥离 ==mlife_data==）
   */
  async function injectToAI(userInput: string = ''): Promise<string> {
    app.isSending = true

    try {
      // 1. 深拷贝当前全状态
      const store = useMlifeStore()
      const state = klona(serializeAllState())

      // 2. 按格式化模板渲染
      const dataBlock = renderAllTemplates(state)

      // 3. 组装 prompt
      const prompt = userInput
        ? `${userInput}\n\n当前 M-life 数据：\n==mlife_data==\n${dataBlock}\n==/mlife_data==`
        : `当前 M-life 数据：\n==mlife_data==\n${dataBlock}\n==/mlife_data==`

      // 4. 发送完整对话
      const response = await api.sendMessage(prompt)

      // 5. 分离叙事与数据块
      const { narrative, dataBlock: raw } = splitResponse(response)

      if (raw) {
        // 6. 解析数据块
        const updates = parseMlifeData(raw)
        // 7. 应用更新到各 store（==mlife_data== 路径）
        applyUpdates(updates)
      }

      // 8. 保存快照
      const { useSnapshot } = await import('./useSnapshot')
      useSnapshot().saveSnapshot()

      // 9. 返回纯叙事
      return narrative
    } finally {
      app.isSending = false
    }
  }

  return { injectToAI }
}