<template>
  <div class="portrait" :style="{ '--c': charColor }">
    <span class="portrait-fallback">{{ charIcon }}</span>
    <div class="portrait-badge">
      <span class="portrait-badge-item" title="当前衣装">👗 {{ currentOutfit }}</span>
      <span class="portrait-badge-divider">·</span>
      <span class="portrait-badge-item" title="当前表情">{{ exprIcon }} {{ currentExpression }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CHARACTER_LIST } from '../bridge/variables'

const props = defineProps<{
  charId: string
  charColor: string
  currentOutfit: string
  currentExpression: string
}>()

const EMOJI_MAP: Record<string, string> = {
  'neutral': '😐',
  'smile': '🙂',
  'happy': '😊',
  'laugh': '😄',
  'blush': '😳',
  'sad': '😢',
  'cry': '😭',
  'angry': '😠',
  'surprise': '😮',
  'shock': '😱',
  'love': '😍',
  'wink': '😉',
  'thinking': '🤔',
  'sleepy': '😴',
  'embarrassed': '😅',
  'pout': '😤',
  'tease': '😏',
  'worried': '😟',
  'pain': '😣',
  'pleasure': '😌',
}

const charIcon = computed(() => {
  const entry = CHARACTER_LIST.find(c => c.id === props.charId)
  return entry?.icon ?? '?'
})

const exprIcon = computed(() => {
  return EMOJI_MAP[props.currentExpression] ?? '😐'
})
</script>

<style scoped>
.portrait {
  position: absolute;
  bottom: 12px;
  right: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  pointer-events: none;
}
.portrait-fallback {
  width: 90px;
  height: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  filter: drop-shadow(0 0 8px color-mix(in srgb, var(--c) 30%, transparent));
  background: color-mix(in srgb, var(--c) 6%, transparent);
  border-radius: 16px;
  border: 1.5px solid color-mix(in srgb, var(--c) 15%, transparent);
  opacity: 0.7;
  transition: opacity 0.3s;
}
.portrait:hover .portrait-fallback {
  opacity: 1;
}
.portrait-badge {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 9px;
  color: var(--text-label);
  background: rgba(255,255,255,0.85);
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid var(--gold-dim);
  backdrop-filter: blur(4px);
  white-space: nowrap;
  max-width: 180px;
}
.portrait-badge-item {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 72px;
}
.portrait-badge-divider {
  color: var(--gold-dim);
}
</style>