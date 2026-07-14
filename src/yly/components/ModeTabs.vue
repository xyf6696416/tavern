<template>
  <div class="modes">
    <button v-for="mode in modes" :key="mode.id" class="mode-btn" :class="{ active: current === mode.id }" @click="$emit('switch', mode.id)">
      <IllyaIcon :name="mode.icon" :size="18" :color="mode.color" class="mode-svg" />
      <span class="mode-label">{{ mode.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { BottomMode } from '../脚本/store';
import IllyaIcon from './IllyaIcon.vue';

defineProps<{
  current: BottomMode
}>()

defineEmits<{
  switch: [mode: BottomMode]
}>()

const modes: { id: BottomMode; label: string; icon: string; color: string }[] = [
  { id: 'tools', label: '工具', icon: 'tools', color: '#C71585' },
  { id: 'options', label: '选项', icon: 'options', color: '#C71585' },
  { id: 'move', label: '移动', icon: 'move', color: '#C71585' },
]
</script>

<style scoped>
.modes { display: flex; gap: 0; border-bottom: 1px solid var(--gold-dim); }
.mode-btn { flex: 1; padding: 8px 0 6px; border: none; border-bottom: 2px solid transparent; background: transparent; color: var(--text-label); cursor: pointer; font-size: 11px; font-family: inherit; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 4px; min-height: 36px; }
.mode-btn:hover { color: var(--text-body); background: rgba(255, 215, 0, 0.04); }
.mode-btn.active { color: var(--c-illya); border-bottom-color: var(--c-illya); font-weight: 600; }
.mode-svg { line-height: 1; }
@media (max-width: 768px) { .mode-btn { min-height: 44px; font-size: 13px; padding: 10px 0 8px; } }
</style>