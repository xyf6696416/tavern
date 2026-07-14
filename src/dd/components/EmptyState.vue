<template>
  <div class="empty-state">
    <span class="empty-icon">{{ icon }}</span>
    <p class="empty-message">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  message?: string
  icon?: string
}>(), {
  message: '暂无数据',
  icon: '📭',
})
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  gap: 12px;
}

.empty-icon {
  font-size: 2.8rem;
  opacity: 0.4;
}

.empty-message {
  font-size: 14px;
  color: var(--ml-text-label);
  text-align: center;
}
</style>