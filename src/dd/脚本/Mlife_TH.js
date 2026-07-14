/* ═══════════════════════════════════════════
   Mlife_TH.js — 魅途 酒馆助手脚本
   处理：首条消息开始游戏 / 全屏进入 / 状态刷新
   ═══════════════════════════════════════════ */

// 魅途 dist HTML URL（开发用 Live Server，生产环境替换为实际 URL）
const MLIFE_DIST_URL = 'http://localhost:5500/dist/%E9%AD%85%E9%80%94/'

/**
 * 点击开始游戏 → 加载魅途 SPA
 */
function enterMlife() {
  console.info('[魅途] 加载中...')
  const btn = document.querySelector('.mlife-start-btn')
  const container = document.querySelector('.mlife-frame-container')
  if (!btn || !container) return

  // 显示加载提示
  btn.textContent = '⏳ 加载中...'
  btn.disabled = true
  btn.style.opacity = '0.6'

  // 创建 iframe 加载 dist HTML
  const iframe = document.createElement('iframe')
  iframe.src = MLIFE_DIST_URL
  iframe.style.width = '100%'
  iframe.style.height = '100vh'
  iframe.style.border = 'none'
  iframe.style.borderRadius = '12px'

  // 加载完成后隐藏按钮，显示 iframe
  iframe.onload = function() {
    btn.style.display = 'none'
    container.style.display = 'block'
    container.appendChild(iframe)
    console.info('[魅途] 加载完成')
  }
  iframe.onerror = function() {
    btn.textContent = '❌ 加载失败，点击重试'
    btn.disabled = false
    btn.style.opacity = '1'
  }
}

/**
 * 等待 DOM 就绪后绑定开始按钮事件
 */
function initStartButton() {
  const btn = document.querySelector('.mlife-start-btn')
  if (btn) {
    btn.addEventListener('click', enterMlife)
    console.info('[魅途] 开始按钮已绑定')
  }
}

// 监听新消息事件，自动绑定开始按钮
if (typeof $ !== 'undefined') {
  $(document).on('new_message_processed', function() {
    setTimeout(initStartButton, 500)
  })
}

// 也支持直接调用
window.enterMlife = enterMlife
