<template>
  <div class="message-bubble" :class="message.role">
    <div class="bubble-content">
      <p class="bubble-text">{{ message.text }}</p>
      <span class="bubble-time">{{ message.time }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Message } from '../types/mlife'

defineProps<{
  message: Message
}>()
</script>

<style scoped>
.message-bubble {
  display: flex;
  margin-bottom: 10px;
}

.message-bubble.outgoing {
  justify-content: flex-end;
}

.message-bubble.incoming {
  justify-content: flex-start;
}

.bubble-content {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 18px;
  position: relative;
}

.outgoing .bubble-content {
  background: linear-gradient(135deg, var(--ml-primary), #FF8A9E);
  color: #fff;
  border-bottom-right-radius: 4px;
  box-shadow: 0 2px 8px var(--ml-primary-glow);
}

.incoming .bubble-content {
  background: var(--ml-bg-input);
  color: var(--ml-text);
  border-bottom-left-radius: 4px;
}

.bubble-text {
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
  margin-bottom: 4px;
}

.bubble-time {
  font-size: 10px;
  opacity: 0.6;
  display: block;
  text-align: right;
}
</style>