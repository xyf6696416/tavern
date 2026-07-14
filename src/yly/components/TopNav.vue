<template>
  <div class="topnav">
    <button
      v-for="item in navItems"
      :key="item.id"
      class="topnav-btn"
      :class="{ active: active === item.id }"
      :style="{ '--nav-color': item.color }"
      @click="handleClick(item.id)"
    >
      <IllyaIcon :name="item.icon" :size="18" :color="item.color" class="topnav-icon" />
      <span class="topnav-label">{{ item.label }}</span>
    </button>

    <!-- 状态栏日期时间 -->
    <span class="topnav-statusbar" v-if="statusText">
      {{ statusText }}
    </span>

    <!-- 交叉验证状态指示器 -->
    <span
      v-if="store.showVerifyIndicator && store.verifySummary.status !== 'idle'"
      class="verify-badge"
      :class="'verify-' + store.verifySummary.status"
      :title="`数据一致性: ${store.lastVerifyResult ? '前端↔后端' : '未校验'}`"
    >
      {{ store.verifySummary.text }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../脚本/store';
import IllyaIcon from './IllyaIcon.vue';

const store = useGameStore()

defineProps<{
  active?: string
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const navItems = [
  { id: 'body-status', label: '状态', icon: 'body-status', color: '#C71585' },
  { id: 'story-record', label: '记录', icon: 'story', color: '#D4459A' },
  { id: 'outfit', label: '衣装', icon: 'outfit', color: '#FF8C00' },
  { id: 'expression', label: '表情', icon: 'expression', color: '#6BB8D4' },
]

function handleClick(id: string) {
  // 统一用 emit，父组件决定操作
  emit('select', id)
}

const statusText = computed(() => {
  const bar = store.statusBar
  if (!bar || !bar['日期和时间']) return ''
  return `✦ ${bar['日期和时间']}`
})
</script>

<style scoped>
.topnav {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 8px;
  background: var(--bg-card);
  border-bottom: 1px solid rgba(212, 65, 142, 0.15);
  backdrop-filter: blur(8px);
  min-height: 36px;
}

.topnav-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid transparent;
  border-radius: 14px;
  background: transparent;
  color: var(--text-label);
  font-size: 11px;
  cursor: pointer;
  font-family: var(--font-body);
  transition: all 0.2s;
  white-space: nowrap;
  min-height: 28px;
  letter-spacing: 0.3px;
}

.topnav-btn:hover {
  background: color-mix(in srgb, var(--nav-color, var(--c-illya)) 8%, transparent);
  border-color: color-mix(in srgb, var(--nav-color, var(--c-illya)) 25%, transparent);
  color: var(--text-body);
}

.topnav-btn.active {
  background: color-mix(in srgb, var(--nav-color, var(--c-illya)) 12%, transparent);
  border-color: color-mix(in srgb, var(--nav-color, var(--c-illya)) 35%, transparent);
  color: var(--nav-color, var(--c-illya));
  font-weight: 600;
}

.topnav-icon { line-height: 1; }
.topnav-label { font-size: 11px; letter-spacing: 0.5px; }

.topnav-statusbar {
  margin-left: auto;
  font-size: 10px;
  color: var(--text-label);
  letter-spacing: 0.5px;
  white-space: nowrap;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

/* 移动端：只显示图标，文字隐藏 */
@media (max-width: 768px) {
  .topnav { padding: 2px 4px; min-height: 32px; gap: 1px; }
  .topnav-btn { padding: 4px 6px; min-width: 32px; justify-content: center; }
  .topnav-label { display: none; }
  .topnav-icon { font-size: 16px; }
  .topnav-statusbar { font-size: 8px; }
}

/* 交叉验证状态指示器 */
.verify-badge {
  margin-left: 4px;
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 8px;
  white-space: nowrap;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  cursor: help;
}
.verify-ok {
  background: rgba(76, 175, 80, 0.12);
  color: #4CAF50;
  border: 1px solid rgba(76, 175, 80, 0.25);
}
.verify-warn {
  background: rgba(255, 152, 0, 0.12);
  color: #FF9800;
  border: 1px solid rgba(255, 152, 0, 0.25);
}
.verify-error {
  background: rgba(244, 67, 54, 0.12);
  color: #F44336;
  border: 1px solid rgba(244, 67, 54, 0.25);
  animation: pulse-error 1.5s ease-in-out infinite;
}
.verify-info {
  background: rgba(33, 150, 243, 0.10);
  color: #2196F3;
  border: 1px solid rgba(33, 150, 243, 0.20);
}
@keyframes pulse-error {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>