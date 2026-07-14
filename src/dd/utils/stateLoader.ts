/* ═══════════════════════════════════════════
   utils/stateLoader.ts — 从消息楼层恢复全量状态
   ═══════════════════════════════════════════

   启动时从最新楼层读取 ==mlife_data== 恢复所有 Pinia 状态。
   消息历史本身就是数据库 —— 每次 AI 回复都包含完整状态快照。

   流程：
     1. getChatMessages(-1) → 读最新楼层
     2. splitResponse() → 提取 ==mlife_data==
     3. parseMlifeData() → 解析数据块
     4. applyUpdates() → 写入 Pinia stores

   独款模式：降级到 STARTUP_DATA（演示用静态数据）
   ═══════════════════════════════════════════ */

import { splitResponse, parseMlifeData } from './parser'
import { applyUpdates } from './applyUpdates'

/** 是否在酒馆内运行 */
const isStandalone = typeof TavernHelper === 'undefined'

/**
 * 从最新消息楼层恢复全量状态
 * 返回 true 表示恢复成功，false 表示无历史数据（新游戏）
 */
export async function loadStateFromMessages(): Promise<boolean> {
  // 独款模式：不读楼层，由外部用 STARTUP_DATA 填充
  if (isStandalone) {
    console.info('[StateLoader] 独款模式，跳过楼层读取')
    return false
  }

  try {
    // 尝试读取最新楼层
    const messages = await TavernHelper.getChatMessages(-1)
    if (!messages || messages.length === 0) {
      console.info('[StateLoader] 无历史消息，新游戏')
      return false
    }

    const latest = messages[0]
    const text = latest.message || latest.text || ''

    // 提取 ==mlife_data== 数据块
    const { dataBlock } = splitResponse(text)
    if (!dataBlock) {
      console.info('[StateLoader] 最新楼层无数据块，视为新游戏')
      return false
    }

    // 解析并应用
    const updates = parseMlifeData(dataBlock)
    applyUpdates(updates)
    console.info('[StateLoader] 从楼层恢复全量状态成功')

    return true
  } catch (e) {
    console.warn('[StateLoader] 楼层读取失败:', e)
    return false
  }
}

/**
 * 首次运行时初始化默认状态
 * 只有在完全没有历史数据时才调用（即新游戏的第一条消息之前）
 */
export function initDefaultState() {
  console.info('[StateLoader] 初始化默认状态...')
  // stores 的默认值已在 defineStore 中设置（balance:0, level:Lv1, vip:无 等）
  // 此处不需要额外操作，Pinia 的默认 ref 值即可
}
