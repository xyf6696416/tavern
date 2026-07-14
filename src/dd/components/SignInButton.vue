<template>
  <button class="signin-btn" @click="$emit('signin')">
    <span class="signin-icon">📅</span>
    <span class="signin-text">{{ signin }}</span>
    <span v-if="streak > 0" class="signin-streak">🔥 {{ streak }}天</span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  signin?: string
  streak?: number
}>()

defineEmits<{
  signin: []
}>()
</script>

<style scoped>
.signin-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1.5px solid var(--ml-primary);
  background: var(--ml-primary-dim);
  color: var(--ml-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.signin-btn:hover {
  background: linear-gradient(135deg, var(--ml-primary), #FF8A9E);
  color: #fff;
  border-color: transparent;
}
.signin-btn:active {
  transform: scale(0.97);
}

.signin-icon {
  font-size: 16px;
}

.signin-streak {
  font-size: 12px;
  opacity: 0.8;
}
</style>