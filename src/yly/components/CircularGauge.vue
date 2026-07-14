<template>
  <div class="gauge" :style="{ '--gauge-color': color }">
    <svg class="gauge-svg" viewBox="0 0 120 120">
      <circle class="gauge-track" cx="60" cy="60" r="52" fill="none" stroke-width="10" />
      <circle class="gauge-fill" cx="60" cy="60" r="52" fill="none" stroke-width="10" stroke-linecap="round" :stroke-dasharray="circumference" :stroke-dashoffset="dashOffset" :stroke="color" />
      <g transform="translate(38,26) scale(1.1)">
        <component :is="iconComponent" />
      </g>
      <text x="60" y="74" text-anchor="middle" dominant-baseline="central" class="gauge-value" font-size="20" font-weight="700" :fill="color">{{ value }}</text>
      <text x="60" y="90" text-anchor="middle" dominant-baseline="central" class="gauge-max" font-size="9" fill="#9B8A9B">/ {{ max }}</text>
    </svg>
    <span class="gauge-label">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import IllyaIcon from './IllyaIcon.vue'

const props = withDefaults(defineProps<{
  value: number
  max: number
  label?: string
  iconName?: string
  color?: string
}>(), {
  label: '',
  iconName: '',
  color: 'var(--c-illya)',
})

const circumference = 2 * Math.PI * 52

const ratio = computed(() => {
  if (props.max <= 0) return 0
  return Math.min(props.value / props.max, 1)
})

const dashOffset = computed(() => circumference * (1 - ratio.value))

const iconComponent = computed(() => {
  if (!props.iconName) return null
  return h(IllyaIcon, { name: props.iconName, size: 36, color: props.color })
})
</script>

<style scoped lang="scss">
.gauge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.gauge-svg {
  width: 64px;
  height: 64px;
}
.gauge-track {
  stroke: rgba(155, 138, 155, 0.15);
}
.gauge-fill {
  transform: rotate(-90deg);
  transform-origin: center;
  transition: stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  filter: drop-shadow(0 0 3px color-mix(in srgb, var(--gauge-color) 40%, transparent));
}
.gauge-value {
  font-variant-numeric: tabular-nums;
}
.gauge-label {
  font-size: 9px;
  font-weight: 600;
  color: var(--text-label);
  letter-spacing: 0.5px;
  text-align: center;
  line-height: 1.1;
}
</style>