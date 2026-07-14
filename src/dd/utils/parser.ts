import type { DataUpdates } from '../types/mlife'

/**
 * 分离叙事与数据块
 */
export function splitResponse(text: string): { narrative: string; dataBlock: string | null } {
  const m = text.match(/==mlife_data==\n([\s\S]*?)\n==\/mlife_data==/)
  if (!m) return { narrative: text, dataBlock: null }
  return {
    narrative: text.replace(/==mlife_data==[\s\S]*?==\/mlife_data==/, '').trim(),
    dataBlock: m[1].trim(),
  }
}

/**
 * 解析数据块 → 返回结构化更新
 */
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

/**
 * 提取所有数据块（兼容新旧格式）
 */
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