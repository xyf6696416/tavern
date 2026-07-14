/* ═══════════════════════════════════════════════════
   bridge/tavern.ts — TavernHelper API 桥接（MVU 版本）
   ═══════════════════════════════════════════════════ */

import { getMockStatData, getMockAIResponse } from '../../util/mock'

/**
 * 从酒馆消息楼层变量读取 stat_data
 * 使用 MVU 框架的 Mvu.getMvuData 接口
 */
export async function loadStatData(): Promise<Record<string, any>> {
  if (typeof Mvu === 'undefined' || typeof Mvu.getMvuData === 'undefined') {
    console.info('[伊莉雅界面] 独立模式 — 使用预览数据')
    return getMockStatData()
  }

  try {
    const variables = Mvu.getMvuData({ type: 'message', message_id: getCurrentMessageId() });
    const raw = _.get(variables, 'stat_data', {});
    console.info('[伊莉雅界面] 通过 MVU 加载 stat_data 成功')
    return raw
  } catch (e) {
    console.warn('[伊莉雅界面] MVU 读取失败，降级到 getVariables')
    try {
      const vars = getVariables({ type: 'message' })
      return _.get(vars, 'stat_data', {})
    } catch {
      return getMockStatData()
    }
  }
}

/**
 * 将 stat_data 写回酒馆消息楼层变量
 * 使用 MVU 框架的 Mvu.replaceMvuData 接口
 */
export function flushStatData(data: Record<string, any>): void {
  try {
    if (typeof Mvu !== 'undefined' && typeof Mvu.replaceMvuData !== 'undefined') {
      Mvu.replaceMvuData(data, { type: 'message', message_id: getCurrentMessageId() });
    } else {
      const vars = getVariables({ type: 'message' })
      _.set(vars, 'stat_data', data)
      replaceVariables(vars, { type: 'message' })
    }
  } catch (e) {
    console.error('[伊莉雅界面] 写回变量失败', e)
  }
}

/**
 * AI generate 调用（带超时）
 * 使用 MVU 的 parseMessage 解析 AI 回复中的 MVU 命令
 */
export async function generateStory(prompt: string, timeoutMs = 30000): Promise<string> {
  if (typeof TavernHelper === 'undefined' || typeof TavernHelper.generate === 'undefined') {
    return getMockAIResponse()
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await TavernHelper.generate({
      userInput: prompt,
      signal: controller.signal,
    })
    return response
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      console.warn('[伊莉雅界面] AI 生成超时，降级 mock')
      return getMockAIResponse()
    }
    console.error('[伊莉雅界面] AI 生成失败', e)
    return getMockAIResponse()
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * 解析 AI 回复中的 MVU 变量更新命令并应用到当前楼层
 * 返回 { story, choices } 提取后的文本和选项
 */
export async function parseAndApplyMvuUpdate(aiResponse: string): Promise<{
  story: string;
  choices: string[];
  rawUpdate: any;
}> {
  let story = aiResponse;
  const choices: string[] = [];
  let rawUpdate = null;

  // 1. 提取 MVU 命令并让 MVU 框架解析
  if (typeof Mvu !== 'undefined' && typeof Mvu.parseMessage !== 'undefined') {
    try {
      const oldData = Mvu.getMvuData({ type: 'message', message_id: getCurrentMessageId() });
      const parsed = await Mvu.parseMessage(aiResponse, oldData);
      rawUpdate = parsed;
      // 写回楼层
      await Mvu.replaceMvuData(parsed, { type: 'message', message_id: getCurrentMessageId() });
    } catch (e) {
      console.warn('[伊莉雅界面] MVU parseMessage 失败', e);
    }
  }

  // 2. 提取选项（📋 分隔的选项）
  const choiceMatch = story.match(/---\s*\n📋(.+)/);
  if (choiceMatch) {
    story = story.replace(/---\s*\n📋.+$/, '').trim();
    choices.push(...choiceMatch[1].split('|').map((c: string) => c.trim()));
  }

  // 3. 移除 <UpdateVariable> 块
  story = story.replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/g, '').trim();
  // 移除 <thinking> 块
  story = story.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();

  return { story, choices, rawUpdate };
}