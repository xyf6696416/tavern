<template>
  <div v-if="visible" class="bsm-overlay" @click.self="$emit('close')">
    <div class="bsm-panel" :style="{ '--c': color }">
      <div class="bsm-handle">
        <span class="bsm-handle-bar"></span>
      </div>
      <div class="bsm-header">
        <span class="bsm-title" :style="{ color }">{{ title }}</span>
        <button class="bsm-close-btn" @click="$emit('close')">&#x2715;</button>
      </div>
      <div class="bsm-body">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '' },
  color: { type: String, default: '#C71585' },
})
defineEmits(['close'])
</script>

<style scoped>
.bsm-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.bsm-panel {
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  background: #fff;
  border-radius: 20px 20px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 24px rgba(0,0,0,0.12);
  animation: slideUp 0.3s ease;
}
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.bsm-handle {
  display: flex;
  justify-content: center;
  padding: 8px 0 4px;
}
.bsm-handle-bar {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--gold-dim);
}
.bsm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px 12px;
  border-bottom: 1px solid var(--gold-dim);
}
.bsm-title {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.bsm-close-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--gold-dim);
  background: transparent;
  color: var(--text-label);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  transition: all 0.2s;
}
.bsm-close-btn:hover {
  background: var(--c-illya);
  color: #fff;
  border-color: var(--c-illya);
}
.bsm-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px 20px;
}
</style>