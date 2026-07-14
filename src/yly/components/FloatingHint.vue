<template>
  <Transition name="hint-slide">
    <div v-if="visible" class="hint-banner">
      <div class="hint-body">
        <div class="hint-dots">
          <span v-for="i in 3" :key="i" class="hint-dot" :class="{ active: step === i - 1 }"></span>
        </div>
        <div class="hint-content">
          <template v-if="step === 0">
            <span class="hint-icon">🔧</span>
            <span class="hint-text"><strong>工具</strong> — 剧情偏好、特殊开关都在这里</span>
          </template>
          <template v-else-if="step === 1">
            <span class="hint-icon">📋</span>
            <span class="hint-text"><strong>选项</strong> — 当前的三条回复和自定义输入</span>
          </template>
          <template v-else>
            <span class="hint-icon">🚶</span>
            <span class="hint-text"><strong>移动</strong> — 看看有什么想去的地方</span>
          </template>
        </div>
        <div class="hint-actions">
          <button class="hint-btn" @click="$emit('next')">{{ step < 2 ? '下一步 →' : '知道了' }}</button>
          <button class="hint-btn hint-btn-ghost" @click="$emit('dismiss')">不再提示</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  step: number
}>()

defineEmits<{
  next: []
  dismiss: []
}>()
</script>

<style scoped>
.hint-banner { position: fixed; bottom: 56px; left: 50%; transform: translateX(-50%); z-index: 150; max-width: 480px; width: calc(100% - 24px); }
.hint-body { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: rgba(255,255,255,0.95); border-radius: 14px; border: 1px solid var(--gold-dim); box-shadow: 0 4px 20px rgba(0,0,0,0.10); backdrop-filter: blur(8px); }
.hint-dots { display: flex; flex-direction: column; gap: 3px; flex-shrink: 0; }
.hint-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold-dim); transition: all 0.3s; }
.hint-dot.active { height: 14px; border-radius: 3px; background: linear-gradient(180deg, var(--c-illya), #D4459A); }
.hint-content { flex: 1; display: flex; align-items: center; gap: 6px; min-width: 0; }
.hint-icon { font-size: 1.2rem; flex-shrink: 0; }
.hint-text { font-size: 11px; color: var(--text-body); line-height: 1.3; }
.hint-text strong { color: var(--c-illya); }
.hint-actions { display: flex; gap: 4px; flex-shrink: 0; }
.hint-btn { padding: 4px 10px; border-radius: 12px; border: none; background: linear-gradient(135deg, var(--c-illya), #D4459A); color: #fff; font-size: 10px; font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap; transition: all 0.2s; }
.hint-btn:hover { opacity: 0.9; }
.hint-btn-ghost { background: transparent; color: var(--text-label); font-weight: 400; font-size: 10px; padding: 4px 8px; }
.hint-btn-ghost:hover { color: var(--text-body); }
.hint-slide-enter-active, .hint-slide-leave-active { transition: all 0.3s ease; }
.hint-slide-enter-from, .hint-slide-leave-to { opacity: 0; transform: translateX(-50%) translateY(20px); }
@media (max-width: 768px) { .hint-banner { bottom: 64px; width: calc(100% - 16px); } .hint-body { padding: 6px 10px; flex-wrap: wrap; gap: 4px; } .hint-dots { flex-direction: row; width: 100%; justify-content: center; } .hint-dot { width: 24px; height: 4px; border-radius: 2px; } .hint-dot.active { width: 36px; height: 4px; } .hint-content { width: 100%; } }
</style>