import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './global.css'

/**
 * 伊莉雅主界面入口 — MVU 模式
 *
 * 初始化顺序：
 * 1. 立即挂载 Vue SPA → 显示标题界面
 * 2. 用户点击"开始游戏" → 等待 MVU 框架初始化
 * 3. 等待消息楼层变量 stat_data 就绪
 * 4. 进入主界面
 *
 * 注意：前端界面在 iframe 中运行，使用 type="module" 脚本
 */

$(async () => {
  // 1. 创建并挂载 Vue 应用（立即显示标题界面）
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  app.mount('#app')
  console.info('[伊莉雅界面] 已挂载（标题界面）')

  // 2. 卸载时清理
  $(window).on('pagehide', () => {
    app.unmount()
    console.info('[伊莉雅界面] 已卸载')
  })
})