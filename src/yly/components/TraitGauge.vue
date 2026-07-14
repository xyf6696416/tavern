<template>
  <div class="trait">
    <div class="trait-head">
      <IllyaIcon :name="iconName" :size="14" :color="iconColor" />
      <span class="trait-label">{{ label }}</span>
    </div>
    <div class="trait-bar">
      <div v-for="i in segments" :key="i" class="trait-seg" :class="{ filled: i <= filledSegments }" :style="segStyle(i)"></div>
    </div>
    <span class="trait-val">{{ value }}/{{ max }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import IllyaIcon from './IllyaIcon.vue'

const props = withDefaults(defineProps<{
  value: number
  max: number
  label?: string
  iconName?: string
  iconColor?: string
  color?: string
}>(), {
  label: '',
  iconName: '',
  iconColor: 'var(--c-illya)',
  color: 'var(--c-illya)',
})

const segments = computed(() => Math.min(props.max, 12))

const filledSegments = computed(() =>
  Math.min(Math.max(Math.round(props.value), 0), props.max)
)

function segStyle(i: number): Record<string, string> {
  const t = (i - 1) / Math.max(segments.value - 1, 1)
  const hue = Math.round(330 - t * 50)
  const color = `hsl(${hue}, 70%, 55%)`
  return { '--seg-color': color }
}
</script>

<style scoped lang="scss">
.trait {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 0;
}
.trait-head {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 54px;
}
.trait-label {
  font-size: 9px;
  color: var(--text-label);
  font-weight: 500;
  white-space: nowrap;
}
.trait-bar {
  display: flex;
  gap: 2px;
  flex: 1;
}
.trait-seg {
  flex: 1;
  height: 8px;
  border-radius: 3px;
  background: rgba(155, 138, 155, 0.12);
  transition: all 0.3s ease;
}
.trait-seg.filled {
  background: var(--seg-color, var(--c-illya));
  box-shadow: 0 0 4px color-mix(in srgb, var(--seg-color, var(--c-illya)) 30%, transparent);
}
.trait-val {
  min-width: 22px;
  text-align: right;
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
}
</style>