<template>
  <div class="choices" v-if="choices.length > 0">
    <div class="choices-hint">✦ 选择你的行动</div>
    <button v-for="(c, i) in choices" :key="i" class="choice-btn" @click="$emit('select', i)">
      <span class="choice-num">{{ i + 1 }}.</span>
      <span class="choice-text">{{ c.text }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Choice } from '../脚本/store';

defineProps<{
  choices: Choice[]
}>()

defineEmits<{
  select: [index: number]
}>()
</script>

<style scoped>
.choices { margin-bottom: 8px; }
.choices-hint { font-size: 10px; color: var(--text-label); margin-bottom: 6px; letter-spacing: 1px; }
.choice-btn { display: flex; align-items: baseline; gap: 8px; width: 100%; padding: 8px 14px; margin-bottom: 4px; border: 1.5px solid var(--gold-dim); border-radius: 12px; background: rgba(255,255,255,0.6); color: var(--text-body); font-size: 13px; cursor: pointer; text-align: left; font-family: inherit; transition: all 0.2s; }
.choice-btn:hover { border-color: var(--c-illya); background: color-mix(in srgb, var(--c-illya) 5%, transparent); transform: translateX(4px); }
.choice-num { color: var(--c-illya); font-weight: 700; font-size: 12px; flex-shrink: 0; }
.choice-text { flex: 1; line-height: 1.4; }
</style>