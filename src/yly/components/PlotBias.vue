<template>
  <div class="bias">
    <span class="bias-title">剧情偏向</span>
    <div class="bias-btns">
      <button v-for="b in biasList" :key="b.key" class="bias-btn" :class="{ on: bias[b.key as keyof typeof bias] }" @click="$emit('toggle', b.key)">
        <IllyaIcon :name="b.icon" :size="14" :color="b.color" /> {{ b.label }}
      </button>
    </div>
    <button class="bias-reset" @click="$emit('reset')" title="重置所有偏向">✕</button>
  </div>
</template>

<script setup lang="ts">
import type { PlotBias } from '../脚本/store';
import IllyaIcon from './IllyaIcon.vue';

defineProps<{
  bias: PlotBias
}>()

defineEmits<{
  toggle: [key: string]
  reset: []
}>()

const biasList = [
  { key: 'forceExit', label: '强制脱出', icon: 'wand', color: '#C71585' },
  { key: 'encourage', label: '鼓励涩涩', icon: 'desire', color: '#FF4081' },
  { key: 'forbidNsfw', label: '不准涩涩', icon: 'will', color: '#4CAF50' },
  { key: 'forbidDespair', label: '抑制绝望', icon: 'fatigue', color: '#FF9800' },
]
</script>

<style scoped>
.bias { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
.bias-title { font-size: 11px; font-weight: 600; color: var(--text-label); white-space: nowrap; }
.bias-btns { display: flex; gap: 4px; flex-wrap: wrap; }
.bias-btn { padding: 4px 10px; border-radius: 14px; border: 1.5px solid var(--gold-dim); background: transparent; color: var(--text-label); font-size: 11px; cursor: pointer; font-family: inherit; transition: all 0.2s; white-space: nowrap; }
.bias-btn:hover { border-color: var(--gold); color: var(--text-body); }
.bias-btn.on { background: linear-gradient(135deg, #FFD700, #FFC107); border-color: #FFD700; color: #8B0060; font-weight: 600; }
.bias-reset { padding: 2px 8px; border-radius: 50%; border: 1px solid transparent; background: transparent; color: var(--text-label); font-size: 12px; cursor: pointer; transition: all 0.2s; font-family: inherit; }
.bias-reset:hover { color: var(--c-illya); border-color: var(--c-illya); }
</style>