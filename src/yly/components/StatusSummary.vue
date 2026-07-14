<template>
  <div class="ss" v-if="charData">
    <div class="ss-header">
      <div class="ss-avatar" :style="{ '--c': charColor }">
        <span>{{ charIcon }}</span>
      </div>
      <div class="ss-names">
        <span class="ss-name" :style="{ color: charColor }">{{ charLabel }}</span>
        <span class="ss-title">{{ outerTitle }}</span>
      </div>
    </div>
    <div class="ss-meta">
      <span class="ss-meta-icon">📍</span>
      <span class="ss-meta-text">{{ charData?.地点 ?? '--' }}</span>
      <span class="ss-meta-divider">·</span>
      <span class="ss-meta-icon">💭</span>
      <span class="ss-meta-text ss-mood">{{ shortMood }}</span>
    </div>
    <div class="ss-gauges">
      <CircularGauge v-for="s in humanStats" :key="s.label" :value="s.value" :max="s.max" :label="s.label" :icon-name="s.iconName" :color="s.color" />
    </div>
    <div class="ss-traits">
      <div class="ss-traits-title">✦ 特质</div>
      <TraitGauge v-for="t in traitEntries" :key="t.label" :value="t.value" :max="t.max" :label="t.label" :icon-name="t.iconName" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CircularGauge from './CircularGauge.vue'
import TraitGauge from './TraitGauge.vue'

const props = defineProps<{
  charData: Record<string, any>
  charId: string
  charLabel: string
  charIcon: string
  charColor: string
}>()

function clamp(v: any, min = 0, max = 100): number {
  const n = Number(v)
  if (isNaN(n)) return min
  return Math.min(max, Math.max(min, n))
}

const outerTitle = computed(() => {
  return props.charData?.外称 ?? ''
})

const shortMood = computed(() => {
  const raw = props.charData?.内心 ?? ''
  if (raw === '--') return '--'
  return raw.length > 8 ? raw.slice(0, 8) + '…' : raw
})

const humanStats = computed(() => [
  { label: '疲劳', value: clamp(props.charData?.疲劳), max: 100, iconName: 'fatigue', color: '#9B8A9B' },
  { label: '欲望', value: clamp(props.charData?.欲望), max: 100, iconName: 'desire', color: '#FF69B4' },
  { label: '意志', value: clamp(props.charData?.意志), max: 100, iconName: 'will', color: '#6BB8D4' },
  { label: '理智', value: clamp(props.charData?.理智), max: 100, iconName: 'sanity', color: '#C71585' },
  { label: '魔力', value: clamp(props.charData?.魔力值), max: 100, iconName: 'magic', color: '#FFD700' },
])

const traitEntries = computed(() => [
  { label: '药物依赖', value: clamp(props.charData?.药物依赖度, 0, 10), max: 10, iconName: 'drug' },
  { label: '奴化进程', value: clamp(props.charData?.奴化进程, 0, 10), max: 10, iconName: 'chain' },
  { label: '堕落度', value: clamp(props.charData?.堕落度, 1, 4), max: 4, iconName: 'corrupt' },
  { label: '善恶平衡', value: clamp(props.charData?.善恶平衡, 0, 12), max: 12, iconName: 'balance' },
])
</script>

<style scoped>
.ss { padding: 8px; background: rgba(255, 248, 250, 0.85); border-left: 1px solid rgba(212, 65, 142, 0.15); height: 100%; overflow-y: auto; }
.ss-header { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid var(--gold-dim); }
.ss-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: color-mix(in srgb, var(--c) 15%, transparent); border: 2px solid color-mix(in srgb, var(--c) 30%, transparent); font-size: 0.9rem; flex-shrink: 0; }
.ss-names { min-width: 0; }
.ss-name { font-size: 0.8rem; font-weight: 700; letter-spacing: 0.5px; display: block; line-height: 1.2; }
.ss-title { font-size: 8px; color: var(--text-label); display: block; line-height: 1.1; }
.ss-meta { display: flex; align-items: center; gap: 2px; font-size: 9px; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid var(--gold-dim); flex-wrap: wrap; }
.ss-meta-icon { font-size: 10px; }
.ss-meta-text { color: var(--text-body); line-height: 1.2; }
.ss-meta-divider { color: var(--gold-dim); }
.ss-mood { font-style: italic; color: var(--text-secondary); }
.ss-gauges { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2px; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid var(--gold-dim); justify-items: center; }
.ss-traits-title { font-size: 9px; font-weight: 700; color: var(--c-illya); letter-spacing: 1px; margin-bottom: 3px; }
</style>