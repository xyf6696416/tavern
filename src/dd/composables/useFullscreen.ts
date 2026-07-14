/* ═══════════════════════════════════════════
   composables/useFullscreen.ts — 全屏展开 Composable

   用于 iframe 嵌入模式下的全屏展开/退出
   ═══════════════════════════════════════════ */

/** M-life 开发服务器 URL（用于全屏展开替换父页面） */
const GAME_URL = 'http://localhost:5500/dist/魅途/'

/**
 * 判断是否在 iframe 中
 */
export function isInsideIframe(): boolean {
  try {
    return window.self !== window.top
  } catch {
    // 跨域访问被拒绝 → 说明在 iframe 中
    return true
  }
}

/**
 * 全屏展开：用 M-life 替换整个酒馆页面
 * 仅在 iframe 模式下生效
 */
export function expandToFullscreen(): void {
  if (!isInsideIframe()) return

  try {
    // 替换整个父页面
    parent.$('body').load(GAME_URL)
  } catch (e) {
    console.error('[M-life] 全屏展开失败', e)
  }
}

/**
 * 进入 M-life：先全屏展开，再进入首页
 */
export function startStory(): void {
  expandToFullscreen()
}

/**
 * 退出 M-life：重载父页面（回到酒馆）
 * 仅在 iframe 模式下生效
 */
export function exitToTavern(): void {
  if (!isInsideIframe()) return

  try {
    parent.location.reload()
  } catch (e) {
    console.error('[M-life] 退出失败', e)
  }
}