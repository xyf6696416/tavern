<template>
  <div class="loading">
    <div class="loading-stars">
      <span v-for="i in 5" :key="i" class="star" :style="starStyle(i)"></span>
    </div>
    <p class="loading-text">
      <span class="loading-char">{{ charLabel }}</span>
      <span class="loading-thinking">正在思考...</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../脚本/store'

const store = useGameStore()

const charLabel = computed(() => {
  return store.currentCharName || '伊莉雅'
})

function starStyle(i: number) {
  return {
    left: 30 + i * 15 + '%',
    animationDelay: i * 0.3 + 's',
  }
}
</script>

<style scoped>
.loading { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; background: linear-gradient(135deg, #1a0a1a, #2d0a2d); }
.loading-stars { position: relative; width: 200px; height: 60px; }
.star { position: absolute; width: 12px; height: 12px; border-radius: 50%; background: #FFD700; box-shadow: 0 0 10px #FFD700, 0 0 20px rgba(255, 215, 0, 0.5); animation: starPulse 1.5s ease-in-out infinite; }
@keyframes starPulse { 0%, 100% { transform: scale(0.3); opacity: 0.3; } 50% { transform: scale(1.2); opacity: 1; } }
.loading-text { display: flex; gap: 6px; font-size: 1rem; letter-spacing: 2px; }
.loading-char { color: #FFB6C1; font-weight: 600; }
.loading-thinking { color: rgba(255, 255, 255, 0.6); animation: thinkingPulse 1.5s ease-in-out infinite; }
@keyframes thinkingPulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
</style>