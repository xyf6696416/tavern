<template>
  <div class="creation-screen" :class="themeClass">
    <!-- 背景粒子 -->
    <div class="particles">
      <div v-for="n in 20" :key="n" class="particle" :style="particleStyle(n)" />
    </div>

    <!-- 页面标题 -->
    <div class="page-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1 class="page-title">创 建 世 界</h1>
      <p class="page-subtitle">一切从这里开始</p>
    </div>

    <!-- 角色创建表单 -->
    <div class="form-scroll">
      <div class="form-section">
        <div class="section-label">👤 角色设定</div>
        <div class="form-group">
          <label class="form-label">角色姓名</label>
          <input v-model="charName" class="form-input" placeholder="例：小雨" maxlength="20" />
        </div>
        <div class="form-group">
          <label class="form-label">角色简介</label>
          <textarea v-model="charBio" class="form-textarea" rows="3" placeholder="简单的介绍，让AI了解你的角色..." maxlength="200" />
          <span class="char-count">{{ charBio.length }}/200</span>
        </div>
        <div class="form-row">
          <div class="form-group half">
            <label class="form-label">性别</label>
            <select v-model="charGender" class="form-select">
              <option value="男">男</option>
              <option value="女">女</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div class="form-group half">
            <label class="form-label">年龄</label>
            <input v-model.number="charAge" type="number" class="form-input" min="1" max="99" placeholder="18" />
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="section-label">🎯 初始设定</div>
        <div class="form-group">
          <label class="form-label">开局场景</label>
          <select v-model="startScene" class="form-select">
            <option value="bar">酒吧邂逅</option>
            <option value="party">派对相遇</option>
            <option value="app">APP匹配</option>
            <option value="blind">相亲介绍</option>
            <option value="custom">自定义</option>
          </select>
        </div>
        <div v-if="startScene === 'custom'" class="form-group">
          <label class="form-label">自定义场景描述</label>
          <textarea v-model="customScene" class="form-textarea" rows="2" placeholder="描述你想开始的场景..." maxlength="100" />
        </div>
      </div>

      <div class="form-section">
        <div class="section-label">⚙️ 游戏难度</div>
        <div class="difficulty-options">
          <div
            v-for="d in difficulties"
            :key="d.value"
            class="diff-card"
            :class="{ active: difficulty === d.value }"
            @click="difficulty = d.value"
          >
            <div class="diff-icon">{{ d.icon }}</div>
            <div class="diff-info">
              <div class="diff-name">{{ d.label }}</div>
              <div class="diff-desc">{{ d.desc }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="action-bar">
        <button class="btn btn-ghost" @click="goBack">取消</button>
        <button class="btn btn-primary" :disabled="!canCreate || isCreating" @click="handleCreate">
          <span v-if="isCreating" class="btn-spinner" />
          <span v-else>开始新世界</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { useMlifeInject } from '../composables/useMlifeInject'

const router = useRouter()
const appStore = useAppStore()
const mlifeInject = useMlifeInject()

const themeClass = computed(() => appStore.theme === 'dark' ? 'dark' : 'light')

// 表单
const charName = ref('')
const charBio = ref('')
const charGender = ref('女')
const charAge = ref(18)
const startScene = ref('bar')
const customScene = ref('')
const difficulty = ref('normal')
const isCreating = ref(false)

const difficulties = [
  { value: 'easy', icon: '🌙', label: '简单', desc: '顺风顺水，易推进' },
  { value: 'normal', icon: '⭐', label: '普通', desc: '有挑战才有乐趣' },
  { value: 'hard', icon: '🔥', label: '困难', desc: '拒绝才是日常' },
]

const canCreate = computed(() => charName.value.trim().length > 0 && (startScene.value !== 'custom' || customScene.value.trim().length > 0))

function particleStyle(n: number) {
  const seed = (n * 89 + 37) % 100
  return {
    width: `${1.5 + (n % 3)}px`,
    height: `${1.5 + (n % 3)}px`,
    left: `${seed}%`,
    bottom: '-10px',
    animationDelay: `${(n * 0.41) % 6}s`,
    animationDuration: `${5 + (n % 3) * 3}s`,
    opacity: 0.1 + (n % 3) * 0.08,
  }
}

function goBack() {
  router.push('/')
}

async function handleCreate() {
  if (!canCreate.value || isCreating.value) return
  isCreating.value = true

  try {
    // 保存角色设定
    const config = {
      charName: charName.value.trim(),
      charBio: charBio.value.trim(),
      charGender: charGender.value,
      charAge: charAge.value,
      startScene: startScene.value === 'custom' ? customScene.value.trim() : startScene.value,
      difficulty: difficulty.value,
    }
    localStorage.setItem('dd_creation_config', JSON.stringify(config))

    // 生成初始消息
    const sceneGreetings: Record<string, string> = {
      bar: '你走进一家灯光暧昧的酒吧，吧台边一个身影吸引了你的目光……',
      party: '朋友拉着你参加派对，音乐震耳欲聋，有人在角落朝你举杯微笑。',
      app: '手机屏幕亮起，一个匹配通知弹了出来——你们互相点了喜欢。',
      blind: '咖啡店里，朋友介绍的"那个人"已经坐在靠窗的位置等你。',
    }

    const greeting = config.startScene.startsWith('自定义')
      ? config.startScene
      : sceneGreetings[config.startScene] || '故事开始了……'

    // 组装初始 prompt：角色设定 + 场景 + 要求
    const initPrompt = [
      `[角色设定]`,
      `- 姓名：${config.charName}`,
      `- 性别：${config.charGender}`,
      `- 年龄：${config.charAge}`,
      `- 简介：${config.charBio || '无'}`,
      `- 难度：${config.difficulty}`,
      ``,
      `[初始场景]`,
      greeting,
      ``,
      `请以以上设定开始故事，注意：`,
      `1. 输出格式使用 ==mlife_data== 包含初始状态`,
      `2. 叙事正文在 data block 之前`,
      `3. 角色状态数值根据难度初始化`,
    ].join('\n')

    // 注入给 AI（走完整对话 → 创建第一条消息楼层）
    const narrative = await mlifeInject.injectToAI(initPrompt)

    // 设置开篇叙事
    if (narrative && typeof (window as any).__mlife_setStory === 'function') {
      ;(window as any).__mlife_setStory(narrative)
    }

    appStore.addToast('🎉 世界创建成功！', 'success')
    router.push('/home')
  } catch (e) {
    console.error('[Creation] 创建失败:', e)
    appStore.addToast('创建失败，请重试', 'error')
  } finally {
    isCreating.value = false
  }
}
</script>

<style scoped>
.creation-screen {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background: linear-gradient(160deg, #0a0a14 0%, #12121a 30%, #1a1a2e 60%, #0f0f1a 100%);
}

.creation-screen.light {
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
  90% { opacity: 0.4; }
  100% { transform: translateY(-100vh) scale(0.3); opacity: 0; }
}

/* ── 页面标题 ── */
.page-header {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 24px 20px 12px;
  width: 100%;
  flex-shrink: 0;
}

.back-btn {
  position: absolute;
  left: 12px;
  top: 24px;
  background: none;
  border: none;
  color: var(--ml-text-secondary, #888);
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: color 0.2s, background 0.2s;
}

.back-btn:hover {
  color: var(--ml-primary);
  background: var(--ml-primary-dim);
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--ml-text, #e8e8e8);
  letter-spacing: 6px;
  margin-bottom: 6px;
}

.light .page-title {
  color: #1a1a2e;
}

.page-subtitle {
  font-size: 12px;
  color: var(--ml-text-secondary, #9a9a9f);
  letter-spacing: 3px;
  font-weight: 300;
}

/* ── 表单区域 ── */
.form-scroll {
  position: relative;
  z-index: 1;
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 100px;
}

.form-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.light .form-section {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 0, 0, 0.06);
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ml-primary);
  margin-bottom: 12px;
  letter-spacing: 1px;
}

.form-group {
  margin-bottom: 12px;
  position: relative;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 12px;
  color: var(--ml-text-secondary, #888);
  margin-bottom: 4px;
  font-weight: 500;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--ml-text, #e8e8e8);
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.light .form-input,
.light .form-textarea,
.light .form-select {
  background: rgba(0, 0, 0, 0.03);
  border-color: rgba(0, 0, 0, 0.1);
  color: #1a1a2e;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  border-color: var(--ml-primary);
  box-shadow: 0 0 0 3px var(--ml-primary-dim);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: var(--ml-text-label, #666);
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.char-count {
  position: absolute;
  right: 8px;
  bottom: 8px;
  font-size: 11px;
  color: var(--ml-text-label, #555);
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-group.half {
  flex: 1;
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}

/* ── 难度选择 ── */
.difficulty-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.diff-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition: all 0.2s;
}

.light .diff-card {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 0, 0, 0.06);
}

.diff-card:hover {
  border-color: var(--ml-primary-dim);
}

.diff-card.active {
  border-color: var(--ml-primary);
  background: var(--ml-primary-dim);
  box-shadow: 0 0 12px var(--ml-primary-glow);
}

.diff-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.diff-info {
  flex: 1;
}

.diff-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ml-text, #e8e8e8);
}

.light .diff-name {
  color: #1a1a2e;
}

.diff-desc {
  font-size: 12px;
  color: var(--ml-text-secondary, #888);
  margin-top: 2px;
}

/* ── 操作栏 ── */
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2;
  display: flex;
  gap: 10px;
  padding: 12px 20px;
  background: rgba(10, 10, 20, 0.92);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.light .action-bar {
  background: rgba(245, 240, 232, 0.92);
  border-top-color: rgba(0, 0, 0, 0.06);
}

.btn {
  flex: 1;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: opacity 0.2s, transform 0.1s;
}

.btn:active {
  transform: scale(0.98);
}

.btn-primary {
  background: linear-gradient(135deg, var(--ml-primary), #FF8A9E);
  color: #fff;
  box-shadow: 0 4px 16px var(--ml-primary-glow);
}

.btn-primary:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-ghost {
  background: rgba(255, 255, 255, 0.05);
  color: var(--ml-text-secondary, #888);
}

.light .btn-ghost {
  background: rgba(0, 0, 0, 0.05);
}

.btn-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>