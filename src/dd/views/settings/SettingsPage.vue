<template>
  <div class="settings-page">
    <button class="back-btn" @click="$router.back()">← 返回</button>
    <div class="title">⚙️ 设置</div>
    <div class="section">
      <div class="item" @click="appStore.toggleTheme()">主题切换 <span>{{ appStore.theme === 'light' ? '☀️ 浅色' : '🌙 深色' }}</span></div>
      <div class="item" @click="$router.push('/settings/format')">格式化模板 <span>→</span></div>
    </div>
    <div class="section">
      <div class="item danger" @click="confirmExit" v-if="isIframe">退出 M-life <span>🚪</span></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAppStore } from '../../stores/app'
import { exitToTavern, isInsideIframe } from '../../composables/useFullscreen'

const appStore = useAppStore()
const isIframe = ref(false)

function confirmExit() {
  if (confirm('确认退出 M-life？')) exitToTavern()
}

onMounted(() => { isIframe.value = isInsideIframe() })
</script>

<style scoped>
.settings-page {
  padding: 4px 0;
}
.back-btn {
  background: none;
  border: none;
  color: var(--ml-primary);
  font-size: 0.9rem;
  cursor: pointer;
  margin-bottom: 12px;
  padding: 0;
  font-family: inherit;
}
.title {
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 16px;
}
.section {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-bottom: 16px;
}
.item {
  padding: 14px 12px;
  background: var(--ml-bg-card);
  cursor: pointer;
  font-size: 0.9rem;
  border-radius: 8px;
  margin-bottom: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.15s;
}
.item:hover {
  background: var(--ml-bg-hover);
}
.item span {
  color: var(--ml-text-secondary);
  font-size: 0.85rem;
}
.item.danger {
  color: var(--ml-primary);
}
</style>
