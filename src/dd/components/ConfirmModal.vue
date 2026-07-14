<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="visible" class="modal-overlay" @click.self="$emit('cancel')">
        <div class="modal-box">
          <h3 class="modal-title">{{ title }}</h3>
          <p class="modal-message">{{ message }}</p>
          <div class="modal-actions">
            <button class="modal-btn modal-btn-cancel" @click="$emit('cancel')">
              {{ cancelText }}
            </button>
            <button class="modal-btn modal-btn-confirm" @click="$emit('confirm')">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  visible: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
}>(), {
  title: '确认',
  message: '确定执行此操作？',
  confirmText: '确定',
  cancelText: '取消',
})

defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 5000;
  background: var(--ml-overlay);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  width: 300px;
  padding: 24px;
  border-radius: 16px;
  background: var(--ml-bg-card);
  box-shadow: 0 8px 32px var(--ml-shadow-lg);
  animation: fadeIn 0.2s ease;
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--ml-text);
  margin-bottom: 8px;
}

.modal-message {
  font-size: 14px;
  color: var(--ml-text-secondary);
  line-height: 1.6;
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.modal-btn {
  padding: 8px 20px;
  border-radius: 8px;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.15s ease, transform 0.1s ease;
}
.modal-btn:hover {
  opacity: 0.85;
}
.modal-btn:active {
  transform: scale(0.97);
}

.modal-btn-cancel {
  background: var(--ml-bg-input);
  color: var(--ml-text-secondary);
}

.modal-btn-confirm {
  background: linear-gradient(135deg, var(--ml-primary), #FF8A9E);
  color: #fff;
}

/* 过渡 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-from .modal-box,
.modal-fade-leave-to .modal-box {
  transform: scale(0.95);
}
</style>