<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast-list">
        <div
          v-for="toast in app.toasts"
          :key="toast.id"
          class="toast-item"
          :class="`toast-${toast.type}`"
          @click="app.removeToast(toast.id)"
        >
          <span class="toast-icon">{{ iconMap[toast.type] }}</span>
          <span class="toast-message">{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useAppStore } from '../stores/app'

const app = useAppStore()

const iconMap: Record<string, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
  max-width: 360px;
}

.toast-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  background: var(--ml-bg-card);
  box-shadow: 0 4px 16px var(--ml-shadow-lg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  cursor: pointer;
  pointer-events: auto;
  font-size: 13px;
  color: var(--ml-text);
  border-left: 3px solid transparent;
  animation: toastIn 0.3s ease;
}

.toast-success {
  border-left-color: var(--ml-green);
}
.toast-error {
  border-left-color: var(--ml-primary);
}
.toast-info {
  border-left-color: var(--ml-blue);
}
.toast-warning {
  border-left-color: var(--ml-amber);
}

.toast-icon {
  font-size: 16px;
  flex-shrink: 0;
}
.toast-message {
  flex: 1;
  line-height: 1.4;
}

/* 列表过渡 */
.toast-list-enter-active,
.toast-list-leave-active {
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.toast-list-enter-from {
  transform: translateX(100%);
  opacity: 0;
}
.toast-list-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
.toast-list-move {
  transition: transform 0.3s ease;
}
</style>