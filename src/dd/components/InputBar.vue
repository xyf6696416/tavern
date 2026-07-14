<template>
  <div class="input-bar">
    <input
      v-model="text"
      class="input-field"
      placeholder="输入消息..."
      :disabled="sending"
      @keyup.enter="handleSend"
    />
    <button
      class="send-btn"
      :disabled="!text.trim() || sending"
      @click="handleSend"
    >
      <span v-if="sending" class="send-spinner" />
      <span v-else>发送</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  sending?: boolean
}>()

const emit = defineEmits<{
  send: [text: string]
}>()

const text = ref('')

function handleSend() {
  if (!text.value.trim() || props.sending) return
  emit('send', text.value.trim())
  text.value = ''
}
</script>

<style scoped>
.input-bar {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: var(--ml-bg-card);
  border-top: 1px solid var(--ml-divider);
  flex-shrink: 0;
}

.input-field {
  flex: 1;
  padding: 10px 16px;
  border: 1.5px solid var(--ml-phone-border);
  border-radius: 24px;
  background: var(--ml-bg-input);
  color: var(--ml-text);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.input-field:focus {
  border-color: var(--ml-primary);
  box-shadow: 0 0 0 3px var(--ml-primary-dim);
}
.input-field::placeholder {
  color: var(--ml-text-label);
}
.input-field:disabled {
  opacity: 0.5;
}

.send-btn {
  padding: 10px 20px;
  border-radius: 24px;
  border: none;
  background: linear-gradient(135deg, var(--ml-primary), #FF8A9E);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  box-shadow: 0 2px 8px var(--ml-primary-glow);
}
.send-btn:hover:not(:disabled) {
  opacity: 0.92;
  transform: scale(1.02);
}
.send-btn:active:not(:disabled) {
  transform: scale(0.97);
}
.send-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.send-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>