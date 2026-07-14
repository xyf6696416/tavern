<template>
  <div class="title-screen" :class="themeClass">
    <!-- 背景装饰粒子 -->
    <div class="particles">
      <div v-for="n in 30" :key="n" class="particle" :style="particleStyle(n)" />
    </div>

    <!-- 顶部光晕 -->
    <div class="glow-top" />

    <!-- 主内容 -->
    <div class="content">
      <!-- Logo 区域 -->
      <div class="logo-section">
        <div class="logo-icon">
          <span class="logo-emoji">💎</span>
          <div class="logo-ring" />
        </div>
        <h1 class="game-title">{{ gameName || '未命名世界' }}</h1>
        <p class="subtitle">—— 魅途 · 故事由此开始 ——</p>
      </div>

      <!-- 信息卡片 -->
      <div class="info-card">
        <div class="info-row">
          <span class="info-label">✧ 作者</span>
          <input
            ref="authorInput"
            v-model="authorName"
            class="info-input"
            placeholder="输入你的名字..."
            maxlength="20"
            @input="onAuthorInput"
            @keydown.enter="focusNext"
          />
        </div>
        <div class="divider" />
        <div class="info-row">
          <span class="info-label">✧ 世界</span>
          <input
            ref="gameNameInput"
            v-model="gameName"
            class="info-input"
            placeholder="输入角色卡的名字..."
            maxlength="30"
            @input="onGameNameInput"
            @keydown.enter="handleStart"
          />
        </div>
      </div>

      <!-- 开始按钮 -->
      <button
        class="start-btn"
        :class="{ 'btn-ready': canStart, 'btn-pulse': canStart, 'btn-loading': isStarting }"
        :disabled="!canStart || isStarting"
        @click="handleStart"
      >
        <span v-if="isStarting" class="btn-spinner" />
        <span v-else class="btn-text">开 始 游 戏</span>
        <span v-if="!isStarting" class="btn-arrow">→</span>
        <div class="btn-glow" />
      </button>

      <!-- 底部信息 -->
      <div class="footer-info">
        <p class="credit">Powered by M-life Engine</p>
        <p class="version">v2.0.0</p>
        <div class="links">
          <a class="link" href="#" @click.prevent="appStore.addToast('🌐 社区建设中...', 'info')">社区</a>
          <span class="link-dot">·</span>
          <a class="link" href="#" @click.prevent="appStore.addToast('📖 文档建设中...', 'info')">文档</a>
          <span class="link-dot">·</span>
          <a class="link" href="#" @click.prevent="appStore.addToast('📧 contact@mlife.app', 'info')">联系</a>
        </div>
      </div>
    </div>

    <!-- 底部装饰线 -->
    <div class="bottom-line" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { expandToFullscreen } from '../composables/useFullscreen'

const router = useRouter()
const appStore = useAppStore()

const themeClass = computed(() => appStore.theme === 'dark' ? 'dark' : 'light')

const authorName = ref('')
const gameName = ref('')
const isStarting = ref(false)
const authorInput = ref<HTMLInputElement | null>(null)
const gameNameInput = ref<HTMLInputElement | null>(null)

const canStart = computed(() => authorName.value.trim().length > 0 && gameName.value.trim().length > 0)

function onAuthorInput() {
  // 自动保存
  try { localStorage.setItem('dd_author', authorName.value.trim()) } catch {}
}

function onGameNameInput() {
  try { localStorage.setItem('dd_game_name', gameName.value.trim()) } catch {}
}

function focusNext() {
  gameNameInput.value?.focus()
}

// 粒子使用固定值避免闪烁
const PARTICLE_CONFIGS = Array.from({ length: 30 }, (_, i) => {
  const seed = (i * 137 + 42) % 100
  return {
    width: 2 + (i % 4),
    left: ((seed * 7 + i * 13) % 100),
    delay: (i * 0.37) % 8,
    duration: 6 + (i % 5) * 2,
    opacity: 0.15 + (i % 4) * 0.08,
  }
})

function particleStyle(n: number) {
  const cfg = PARTICLE_CONFIGS[n - 1]
  return {
    width: `${cfg.width}px`,
    height: `${cfg.width}px`,
    left: `${cfg.left}%`,
    bottom: '-10px',
    animationDelay: `${cfg.delay}s`,
    animationDuration: `${cfg.duration}s`,
    opacity: cfg.opacity,
  }
}

async function handleStart() {
  if (!canStart.value || isStarting.value) return
  isStarting.value = true

  // 保存作者名和游戏名到 localStorage
  try {
    localStorage.setItem('dd_author', authorName.value.trim())
    localStorage.setItem('dd_game_name', gameName.value.trim())
  } catch {}

  try {
    // 判断是否在 iframe 中（嵌入酒馆）
    const isIframe = (() => {
      try { return window.self !== window.top } catch { return true }
    })()

    if (isIframe) {
      // 全屏展开：替换整个酒馆页面
      expandToFullscreen()

      // 短暂延迟后跳转到首页（全屏展开后页面会重新加载，所以这里只是保留逻辑）
      setTimeout(() => {
        router.push('/home')
      }, 500)
    } else {
      // 独立模式：直接跳转
      // 检测楼层
      const chatMessages = await TavernHelper.getChatMessages('0-{{lastMessageId}}')
      if (chatMessages && chatMessages.length > 0) {
        router.push('/home')
      } else {
        router.push('/create')
      }
    }
  } catch (e) {
    appStore.addToast('检测楼层失败，进入创建页面', 'warning')
    router.push('/create')
  } finally {
    isStarting.value = false
  }
}

onMounted(() => {
  // 读取已保存的内容
  try {
    const savedAuthor = localStorage.getItem('dd_author')
    const savedGame = localStorage.getItem('dd_game_name')
    if (savedAuthor) authorName.value = savedAuthor
    if (savedGame) gameName.value = savedGame
  } catch {}
})
</script>

<style scoped>
.title-screen {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(160deg, #0a0a14 0%, #12121a 30%, #1a1a2e 60%, #0f0f1a 100%);
}

.title-screen.light {
  background: linear-gradient(160deg, #f5f0e8 0%, #faf5ee 30%, #f0ece4 60%, #f5f0e8 100%);
}

/* ── 粒子 ── */
.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.particle {
  position: absolute;
  border-radius: 50%;
  background: var(--ml-primary);
  animation: particleFloat linear infinite;
}

@keyframes particleFloat {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 0.6; }
  100% { transform: translateY(-100vh) scale(0.3); opacity: 0; }
}

/* ── 顶部光晕 ── */
.glow-top {
  position: absolute;
  top: -120px;
  left: 50%;
  transform: translateX(-50%);
  width: 400px;
  height: 240px;
  background: radial-gradient(ellipse, rgba(255, 71, 87, 0.12), transparent 70%);
  pointer-events: none;
}

/* ── 主内容 ── */
.content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 20px;
  width: 320px;
}

/* ── Logo ── */
.logo-section {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  position: relative;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-emoji {
  font-size: 36px;
  position: relative;
  z-index: 1;
  animation: logoFloat 3s ease-in-out infinite;
}

.logo-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(255, 71, 87, 0.3);
  animation: ringPulse 2.5s ease-in-out infinite;
}

.logo-ring::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1px solid rgba(255, 71, 87, 0.1);
  animation: ringPulse 2.5s ease-in-out infinite 0.5s;
}

@keyframes logoFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes ringPulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.12); opacity: 1; }
}

.game-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--ml-text, #e8e8e8);
  letter-spacing: 3px;
  text-shadow: 0 2px 12px rgba(255, 71, 87, 0.3);
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.light .game-title {
  color: #1a1a2e;
  text-shadow: 0 2px 8px rgba(255, 71, 87, 0.15);
}

.subtitle {
  font-size: 12px;
  color: var(--ml-text-secondary, #9a9a9f);
  letter-spacing: 4px;
  font-weight: 300;
}

/* ── 信息卡片 ── */
.info-card {
  width: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 16px 18px;
  backdrop-filter: blur(8px);
  transition: border-color 0.3s, box-shadow 0.3s;
}

.light .info-card {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 0, 0, 0.08);
}

.info-card:focus-within {
  border-color: var(--ml-primary);
  box-shadow: 0 0 20px var(--ml-primary-glow);
}

.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}

.info-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ml-primary);
  min-width: 44px;
  flex-shrink: 0;
}

.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 8px 0;
}

.light .divider {
  background: rgba(0, 0, 0, 0.06);
}

.info-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 14px;
  color: var(--ml-text, #e8e8e8);
  font-family: inherit;
  padding: 6px 0;
  transition: color 0.2s;
}

.light .info-input {
  color: #1a1a2e;
}

.info-input::placeholder {
  color: var(--ml-text-label, #666);
  font-size: 13px;
}

.info-input:focus {
  color: var(--ml-text, #e8e8e8);
}

/* ── 开始按钮 ── */
.start-btn {
  position: relative;
  width: 100%;
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255, 71, 87, 0.15), rgba(255, 107, 129, 0.1));
  color: var(--ml-text-secondary, #9a9a9f);
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  cursor: not-allowed;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  letter-spacing: 4px;
}

.btn-text {
  position: relative;
  z-index: 1;
}

.btn-arrow {
  position: relative;
  z-index: 1;
  font-size: 18px;
  transition: transform 0.3s;
}

.btn-glow {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  opacity: 0;
  transition: opacity 0.4s;
  pointer-events: none;
}

.start-btn.btn-ready {
  cursor: pointer;
  background: linear-gradient(135deg, var(--ml-primary), #FF8A9E);
  color: #fff;
  box-shadow: 0 4px 24px var(--ml-primary-glow);
}

.start-btn.btn-ready:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 32px var(--ml-primary-glow);
}

.start-btn.btn-ready:hover .btn-arrow {
  transform: translateX(4px);
}

.start-btn.btn-ready:active {
  transform: translateY(0);
  box-shadow: 0 2px 16px var(--ml-primary-glow);
}

.start-btn.btn-pulse {
  animation: btnPulse 2.5s ease-in-out infinite;
}

@keyframes btnPulse {
  0%, 100% { box-shadow: 0 4px 24px var(--ml-primary-glow); }
  50% { box-shadow: 0 4px 40px var(--ml-primary-glow); }
}

/* ── Loading spinner ── */
.btn-spinner {
  width: 20px;
  height: 20px;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── 底部信息 ── */
.footer-info {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}

.credit {
  font-size: 11px;
  color: var(--ml-text-label, #666);
  letter-spacing: 2px;
}

.version {
  font-size: 10px;
  color: var(--ml-text-label, #555);
  letter-spacing: 1px;
}

.links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 4px;
}

.link {
  font-size: 11px;
  color: var(--ml-text-secondary, #888);
  text-decoration: none;
  transition: color 0.2s;
  cursor: pointer;
}

.link:hover {
  color: var(--ml-primary);
}

.link-dot {
  font-size: 10px;
  color: var(--ml-text-label, #555);
}

/* ── 底部装饰线 ── */
.bottom-line {
  position: absolute;
  bottom: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 71, 87, 0.2), transparent);
}
</style>