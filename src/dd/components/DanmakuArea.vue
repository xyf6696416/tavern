<template>
  <div class="danmaku-area">
    <div
      v-for="(item, i) in danmakuList"
      :key="i"
      class="danmaku-item"
    >
      <span class="danmaku-text">{{ item }}</span>
    </div>
    <div v-if="!danmakuList.length" class="danmaku-empty">
      暂无弹幕
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  danmaku?: string
}>()

const danmakuList = computed(() => {
  if (!props.danmaku) return []
  return props.danmaku
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
})
</script>

<style scoped>
.danmaku-area {
  padding: 8px;
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.danmaku-item {
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  animation: fadeIn 0.3s ease;
  align-self: flex-start;
  max-width: 90%;
}

.danmaku-text {
  font-size: 13px;
  color: #fff;
  word-break: break-word;
}

.danmaku-empty {
  font-size: 12px;
  color: var(--ml-text-label);
  text-align: center;
  padding: 20px;
}
</style>