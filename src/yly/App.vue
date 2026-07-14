<template>
  <!-- 标题界面 -->
  <TitleScreen v-if="store.showTitle" @start="store.startGame()" />

  <!-- 主界面 -->
  <div v-else class="illya-app">
    <!-- 全屏氛围背景 -->
    <div class="app-bg"></div>

    <!-- 顶栏导航（新） -->
    <TopNav
      class="app-topnav"
      @select="handleTopNavSelect"
    />

    <!-- 左面板（角色信息） -->
    <SidePanel
      class="app-side"
      @open-body-status="showBodyStatus = true"
    />

    <!-- 主区域（故事） -->
    <StoryArea class="app-main" />

    <!-- 右面板（角色状态摘要 — 可视化仪表盘） -->
    <StatusSummary
      v-if="store.ready && store.currentChar"
      class="app-right"
      :charData="store.currentChar"
      :charId="store.currentCharId"
      :charLabel="store.currentCharLabel"
      :charIcon="store.currentCharIcon"
      :charColor="store.currentCharColor"
    />

    <!-- 底部控制栏 -->
    <ControlBar class="app-bottom" @open-body-status="showBodyStatus = true" />

    <!-- 全屏展开按钮（iframe 嵌入时） -->
    <button v-if="isIframe" class="expand-btn" @click="expandFullscreen" title="全屏展开">
      ⛶
    </button>

    <!-- 版本号（右下角） -->
    <span class="app-version">✦ {{ APP_VERSION }}</span>

    <!-- 身体状态详细弹窗 -->
    <BodyStatusModal
      :visible="showBodyStatus"
      :charData="store.currentChar"
      :charId="store.currentCharId"
      :charLabel="store.currentCharLabel"
      :charColor="store.currentCharColor"
      @close="showBodyStatus = false"
    />

    <!-- 新手引导浮层 -->
    <FloatingHint
      :visible="store.showTutorial"
      :step="store.tutorialStep"
      @next="store.nextTutorialStep()"
      @dismiss="store.dismissTutorial()"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import BodyStatusModal from './components/BodyStatusModal.vue'
import ControlBar from './components/ControlBar.vue'
import FloatingHint from './components/FloatingHint.vue'
import SidePanel from './components/SidePanel.vue'
import StatusSummary from './components/StatusSummary.vue'
import StoryArea from './components/StoryArea.vue'
import TitleScreen from './components/TitleScreen.vue'
import TopNav from './components/TopNav.vue'
import { APP_VERSION, useGameStore } from './脚本/store'

const store = useGameStore()
const isIframe = ref(false)
const showBodyStatus = ref(false)
const showTimeline = ref(false)

const GAME_URL = 'http://10.0.0.18:5500/dist/伊莉雅界面/'

function isInsideIframe(): boolean {
  try { return window.self !== window.top } catch { return true }
}

function handleTopNavSelect(id: string) {
  if (id === 'body-status') showBodyStatus.value = true
  else if (id === 'story-record') showTimeline.value = true
  else if (id === 'outfit') store.toggleOutfitPanel()
  else if (id === 'expression') store.toggleExpressionPanel()
}

function expandFullscreen() {
  try {
    parent.$('body').load(GAME_URL)
  } catch (e) {
    console.warn('[伊莉雅界面] 全屏展开失败', e)
  }
}

onMounted(async () => {
  isIframe.value = isInsideIframe()
  // 标题界面会等待用户点击"开始游戏"，init() 在 startGame() 中调用
  console.info('[伊莉雅界面] 标题界面已加载')
})
</script>

<style scoped>
/* ═══════════════════════════════════════
   主布局 — 纯 CSS Grid，无 flex 嵌套
   ═══════════════════════════════════════ */
.illya-app {
  position: fixed; inset: 0;
  display: grid;
  grid-template-columns: var(--side-width) 1fr var(--right-width);
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "topnav topnav topnav"
    "side   main   right"
    "bottom bottom bottom";
  background: var(--pink-bg);
  font-family: var(--font-ui);
  color: var(--text-body);
  overflow: hidden;
}

/* 全屏氛围背景 */
.app-bg {
  position: fixed; inset: 0;
  background:
    radial-gradient(ellipse at 20% 30%, rgba(255, 182, 193, 0.18) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, rgba(248, 196, 113, 0.10) 0%, transparent 50%),
    linear-gradient(135deg, #FFF5F7, #FFE4EC, #FFD6E0);
  z-index: 0;
  pointer-events: none;
}

/* Grid 区域分配 */
.app-topnav { grid-area: topnav; z-index: 10; }
.app-side   { grid-area: side; overflow-y: auto; z-index: 1; }
.app-main   { grid-area: main; overflow: hidden; z-index: 1; }
.app-right  { grid-area: right; overflow-y: auto; z-index: 1; }
.app-bottom { grid-area: bottom; z-index: 2; }

/* 全屏展开按钮（仅 iframe 中显示） */
.expand-btn {
  position: fixed; top: 8px; left: 8px; z-index: 100;
  width: 36px; height: 36px; border-radius: 50%;
  border: 2px solid var(--gold-dim);
  background: rgba(255,255,255,0.8);
  color: var(--c-illya); font-size: 1.1rem;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
  transition: all 0.2s;
}
.expand-btn:hover {
  background: var(--c-illya);
  color: #fff;
  border-color: var(--c-illya);
}

/* 版本号 */
.app-version {
  position: fixed;
  bottom: 6px;
  right: 8px;
  font-size: 9px;
  color: var(--text-label);
  letter-spacing: 0.5px;
  z-index: 50;
  opacity: 0.6;
  pointer-events: none;
}

@media (max-width: 1024px) {
  .illya-app {
    grid-template-columns: var(--side-width) 1fr;
    grid-template-areas:
      "topnav topnav"
      "side   main"
      "bottom bottom";
  }
  .app-right { display: none; }
}

@media (max-width: 768px) {
  .illya-app {
    grid-template-columns: 1fr;
    grid-template-areas:
      "topnav"
      "main"
      "bottom";
  }
  .app-side { display: none; }
}
</style>