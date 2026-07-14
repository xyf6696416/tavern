<template>
  <div class="exp-selector" v-if="visible">
    <div class="es-header">
      <span class="es-title">😊 选择表情</span>
      <button class="es-close" @click="$emit('close')">✕</button>
    </div>
    <div class="es-tags">
      <button v-for="expr in expressions" :key="expr" class="es-tag" :class="{ active: expr === current }" @click="$emit('select', expr)">
        {{ getExpressionIcon(expr) }} {{ expr }}
      </button>
    </div>
    <div class="es-current" v-if="current">
      当前表情：<strong>{{ current }}</strong>
    </div>
  </div>
</template>

<script setup lang="ts">
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

function getExpressionIcon(expr: string): string {
  return EMOJI_MAP[expr] ?? '😐'
}

defineProps<{
  expressions: string[]
  current: string
  visible: boolean
}>()

defineEmits<{
  select: [expression: string]
  close: []
}>()
</script>

<style scoped>
.exp-selector {
  padding: 8px 12px;
  background: color-mix(in srgb, #6BB8D4 6%, transparent);
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, #6BB8D4 15%, transparent);
  margin: 4px 0;
}
.es-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.es-title {
  font-size: 11px;
  font-weight: 700;
  color: #6BB8D4;
  letter-spacing: 1px;
}
.es-close {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid var(--gold-dim);
  background: transparent;
  color: var(--text-label);
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  transition: all 0.2s;
}
.es-close:hover {
  background: #6BB8D4;
  color: #fff;
  border-color: #6BB8D4;
}
.es-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-height: 140px;
  overflow-y: auto;
}
.es-tag {
  padding: 3px 10px;
  border-radius: 14px;
  border: 1.5px dashed var(--gold-dim);
  background: rgba(255,255,255,0.6);
  color: var(--text-body);
  font-size: 11px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  white-space: nowrap;
}
.es-tag:hover {
  border-style: solid;
  border-color: #6BB8D4;
  background: color-mix(in srgb, #6BB8D4 6%, transparent);
}
.es-tag.active {
  border-style: solid;
  border-color: #6BB8D4;
  background: linear-gradient(135deg, #6BB8D4, #4ECDC4);
  color: #fff;
  font-weight: 600;
}
.es-current {
  margin-top: 6px;
  font-size: 10px;
  color: var(--text-label);
  text-align: center;
}
.es-current strong {
  color: #6BB8D4;
}
</style>