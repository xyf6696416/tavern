<template>
  <div v-if="showStatusBar" class="status-bar" :class="themeClass">
    <span class="status-time">{{ time }}</span>
    <div class="status-icons">
      <span class="status-signal">▂▄▆█</span>
      <span class="status-battery">🔋</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'

const app = useAppStore()
const route = useRoute()
const showStatusBar = computed(() => !route.meta?.isTitleScreen)
const themeClass = computed(() => app.theme === 'dark' ? 'dark' : 'light')

const time = ref('')
let timer: ReturnType<typeof setInterval> | null = null

function updateTime() {
  const now = new Date()
  time.value = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 60000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 20px 4px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
  letter-spacing: 0.3px;
}

.status-bar.light {
  color: var(--ml-text);
  background: transparent;
}
.status-bar.dark {
  color: var(--ml-text);
  background: transparent;
}

.status-icons {
  display: flex;
  align-items: center;
  gap: 6px;
}
.status-signal {
  letter-spacing: 1px;
  opacity: 0.5;
  font-size: 10px;
}
.status-battery {
  font-size: 12px;
}
</style>