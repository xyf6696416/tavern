<template>
  <div class="input-row">
    <input v-model="text" class="input-field" placeholder="编排剧情吧！" @keyup.enter="handleSend" />
    <button class="input-btn" :disabled="!text.trim()" @click="handleSend">发送</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  send: [text: string]
}>()

const text = ref('')

function handleSend() {
  if (text.value.trim()) {
    emit('send', text.value)
    text.value = ''
  }
}
</script>

<style scoped>
.input-row { display: flex; gap: 6px; }
.input-field { flex: 1; padding: 8px 14px; border: 1.5px solid var(--gold-dim); border-radius: 20px; background: rgba(255,255,255,0.8); color: var(--text-body); font-size: 13px; font-family: inherit; outline: none; transition: border-color 0.2s; }
.input-field:focus { border-color: var(--c-illya); }
.input-field::placeholder { color: var(--text-label); font-style: italic; }
.input-btn { padding: 8px 20px; border-radius: 20px; border: none; background: linear-gradient(135deg, var(--c-illya), #D4459A); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; white-space: nowrap; }
.input-btn:hover { opacity: 0.9; transform: scale(1.02); }
.input-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
</style>