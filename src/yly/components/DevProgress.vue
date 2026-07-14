<template>
  <div class="dev" v-if="entries.length > 0">
    <h4 class="dev-title">✦ 开发进度</h4>
    <div v-for="e in entries" :key="e.part" class="dev-row">
      <span class="dev-part">{{ e.part }}</span>
      <span class="dev-bar-wrap">
        <span
          class="dev-bar"
          :style="{ width: e.pct + '%', background: barGradient(e.pct) }"
        ></span>
      </span>
      <span class="dev-stage">{{ e.stage }}</span>
    </div>
  </div>
  <!-- 空状态 -->
  <div v-else class="dev dev-empty">
    <h4 class="dev-title">✦ 开发进度</h4>
    <p class="dev-none">— 暂无记录 —</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getDevStagePercent } from '../bridge/variables';
import { DEV_STAGES } from '../脚本/store';

const props = defineProps<{
  devRecords: Record<string, any>
  charColor: string
}>()

interface DevEntry {
  part: string
  stage: string
  pct: number
}

const entries = computed<DevEntry[]>(() => {
  const records = props.devRecords
  if (!records || typeof records !== 'object') return []
  return Object.entries(records)
    .filter(([_, v]) => {
      if (!v) return false
      const raw = typeof v === 'string' ? v : (v['等级'] ?? '')
      return raw !== '待初始化' && raw !== ''
    })
    .map(([part, v]) => {
      const stage = typeof v === 'string' ? v : (v['等级'] ?? '?')
      const pct = getDevStagePercent(stage)
      const label = DEV_STAGES.find(s => s.key === stage)?.label ?? stage
      return { part, stage: label, pct }
    })
})
</script>

<style scoped>
.dev {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--gold-dim);
}
.dev-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--c-illya);
  margin-bottom: 8px;
  letter-spacing: 1px;
}
.dev-empty .dev-none {
  font-size: 11px;
  color: var(--text-label);
  text-align: center;
  padding: 8px 0;
}

.dev-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
  font-size: 11px;
}

.dev-part {
  min-width: 52px;
  white-space: nowrap;
  font-weight: 500;
  font-size: 10px;
  color: var(--text-body);
}

.dev-bar-wrap {
  flex: 1;
  height: 8px;
  background: rgba(255, 215, 0, 0.08);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(255, 215, 0, 0.12);
}

.dev-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.dev-stage {
  min-width: 52px;
  text-align: right;
  font-size: 10px;
  color: var(--text-label);
}
</style>