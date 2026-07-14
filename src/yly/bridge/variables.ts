/* ═══════════════════════════════════════════════════
   bridge/variables.ts — 变量工具函数
   从 stat_data 中读取/写入特定角色的字段
   ═══════════════════════════════════════════════════ */

import { klona } from 'klona'
import { DEV_STAGES } from '../脚本/store'

/**
 * 从 stat_data 中获取指定角色的所有字段
 */
export function getCharacterData(data: Record<string, any>, charId: string): Record<string, any> {
  return data[charId] ?? {}
}

/**
 * 更新 stat_data 中某个角色的某个字段
 * 返回新对象（不修改原对象）
 */
export function setCharacterField(
  data: Record<string, any>,
  charId: string,
  field: string,
  value: any,
): Record<string, any> {
  const copy = klona(data)
  if (!copy[charId]) copy[charId] = {}
  copy[charId][field] = value
  return copy
}

/**
 * 获取 stat_data 中所有角色 ID 列表
 */
export function getCharacterIds(data: Record<string, any>): string[] {
  const exclude = ['状态栏', '_变量']
  return Object.keys(data).filter(k => !exclude.includes(k))
}

/**
 * 从 stat_data 中提取全局状态栏信息
 */
export function getStatusBar(data: Record<string, any>): { 日期和时间: string } {
  return data['状态栏'] ?? { 日期和时间: '--' }
}

/**
 * 获取开发阶段百分比
 */
export function getDevStagePercent(stage: string): number {
  return DEV_STAGES.find(s => s.key === stage)?.pct ?? 0
}