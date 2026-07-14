<template>
  <div class="skeleton-box">
    <div
      v-for="i in count"
      :key="i"
      class="skeleton-block"
      :style="blockStyle"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  width?: string
  height?: string
  count?: number
  borderRadius?: string
}>(), {
  width: '100%',
  height: '16px',
  count: 1,
  borderRadius: '6px',
})

const blockStyle = computed(() => ({
  width: props.width,
  height: props.height,
  borderRadius: props.borderRadius,
}))
</script>

<style scoped>
.skeleton-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-block {
  background: linear-gradient(90deg, var(--ml-divider) 25%, var(--ml-bg-input) 50%, var(--ml-divider) 75%);
  background-size: 200px 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6px;
}
</style>