/* ═══════════════════════════════════════════════════
   util/colors.ts — 共享颜色工具函数
   粉金魔法少女系视觉语言
   ═══════════════════════════════════════════════════ */

/**
 * 开发进度/身体状态进度条渐变色
 * 按百分比返回线性渐变背景值
 */
export function devBarGradient(pct: number): string {
  if (pct <= 25) return 'linear-gradient(90deg, #FFB6C1, #FF69B4)'
  if (pct <= 50) return 'linear-gradient(90deg, #FF69B4, #C71585)'
  if (pct <= 75) return 'linear-gradient(90deg, #C71585, #FFD700)'
  return 'linear-gradient(90deg, #FFD700, #FFC107)'
}

/**
 * 角色主题色列表（对应 CHARACTER_LIST 的顺序）
 */
export const CHAR_COLORS = {
  伊莉雅: '#C71585',
  美游: '#D4459A',
  小黑: '#FF8C00',
  士郎: '#6BB8D4',
  user: '#66BB6A',
} as const

export type CharId = keyof typeof CHAR_COLORS