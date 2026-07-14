<template>
  <div class="error-state">
    <span class="error-icon">⚠️</span>
    <p class="error-message">{{ message }}</p>
    <button class="error-retry" @click="$emit('retry')">
      重试
    </button>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  message?: string
}>(), {
  message: '加载失败，请重试',
})

defineEmits<{
  retry: []
}>()
</script>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  gap: 12px;
}

.error-icon {
  font-size: 2.8rem;
  opacity: 0.5;
}

.error-message {
  font-size: 14px;
  color: var(--ml-text-secondary);
  text-align: center;
  line-height: 1.6;
}

.error-retry {
  padding: 8px 24px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, var(--ml-primary), #FF8A9E);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.15s ease, transform 0.1s ease;
}
.error-retry:hover {
  opacity: 0.9;
}
.error-retry:active {
  transform: scale(0.97);
}
</style>