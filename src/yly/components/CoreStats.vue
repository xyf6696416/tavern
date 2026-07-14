<template>
  <div class="stats" v-if="affection !== null || shirouField !== null">
    <!-- 好感度（女性角色）/ 信任度（士郎） -->
    <div v-if="affection !== null" class="stat-row">
      <span class="stat-lbl">{{ isShirou ? '♥ 信任度' : '♥ 好感度' }}</span>
      <span class="stat-bar-wrap">
        <span class="stat-bar" :style="{ width: affection + '%' }"></span>
      </span>
      <span class="stat-num">{{ affection }}%</span>
    </div>

    <!-- 士郎三个信任度（仅在士郎时显示） -->
    <template v-if="isShirou">
      <div v-for="t in trustFields" :key="t.key" class="stat-row stat-sub">
        <span class="stat-lbl">{{ t.label }}</span>
        <span class="stat-bar-wrap">
          <span class="stat-bar" :style="{ width: t.value + '%' }"></span>
        </span>
        <span class="stat-num">{{ t.value }}%</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  charData: Record<string, any>
  charId: string
}>()

const isShirou = computed(() => props.charId === '士郎')

/** 好感度——优先从 stat_data 中读取 `好感度` 数值 */
const affection = computed(() => {
  if (props.charId === '士郎') return null   // 士郎不用好感度，用信任度替代
  if (props.charId === 'user') return null    // user 不用好感度
  const raw = props.charData?.['好感度']
  if (raw !== undefined && raw !== null) {
    const n = Number(raw)
    if (!isNaN(n)) return Math.min(100, Math.max(0, n))
  }
  // stat_data 中没有好感度数值时，不显示假数据
  return null
})

/** 士郎的三个信任度 */
const trustFields = computed(() => {
  if (!isShirou.value || !props.charData) return []
  return [
    { key: '对伊莉雅的信任度', label: '对伊莉雅', value: Number(props.charData['对伊莉雅的信任度'] ?? 0) },
    { key: '对美游的信任度', label: '对美游', value: Number(props.charData['对美游的信任度'] ?? 0) },
    { key: '对小黑的信任度', label: '对小黑', value: Number(props.charData['对小黑的信任度'] ?? 0) },
  ]
})

/** 士郎见闻 */
const shirouField = computed(() => {
  if (!isShirou.value) return null
  return props.charData?.['见伊莉雅'] ?? null
})
</script>

<style scoped>
.stats {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--gold-dim);
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 12px;
}
.stat-sub { opacity: 0.85; }

.stat-lbl {
  white-space: nowrap;
  min-width: 52px;
  font-weight: 600;
  color: var(--text-body);
  font-size: 11px;
}

.stat-bar-wrap {
  flex: 1;
  height: 10px;
  background: rgba(255, 215, 0, 0.10);
  border-radius: 5px;
  overflow: hidden;
  border: 1px solid var(--gold-dim);
}

.stat-bar {
  height: 100%;
  border-radius: 5px;
  display: block;
  transition: width 0.5s ease;
  background: linear-gradient(90deg, #FFD700, #FFC107);
}

.stat-num {
  min-width: 32px;
  text-align: right;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}
</style>