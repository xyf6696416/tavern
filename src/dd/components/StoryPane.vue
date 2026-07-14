<template>
  <div class="story-pane">
    <!-- 骨架屏加载 -->
    <div v-if="isLoading" class="story-skeleton">
      <div v-for="i in 4" :key="i" class="skeleton-line" :style="{ width: `${60 + i * 10}%` }" />
    </div>
    <!-- 空状态 -->
    <div v-else-if="isEmpty" class="story-empty">
      <span class="story-empty-icon">💬</span>
      <p class="story-empty-text">等待故事开始...</p>
    </div>
    <!-- 正文 -->
    <div v-else class="story-content">
      <p
        v-for="(para, i) in paragraphs"
        :key="i"
        class="story-para"
        :class="{ 'story-dialogue': isDialogue(para) }"
      >
        {{ para }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  text: string
  isLoading?: boolean
  isEmpty?: boolean
}>()

const paragraphs = computed(() => {
  return props.text
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
})

function isDialogue(line: string): boolean {
  return line.startsWith('「') || /^[（(]/.test(line)
}
</script>

<style scoped>
.story-pane {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: var(--ml-bg-card);
  border-radius: 12px;
  box-shadow: 0 2px 12px var(--ml-shadow);
}

/* 骨架屏 */
.story-skeleton {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 0;
}
.skeleton-line {
  height: 14px;
  background: linear-gradient(90deg, var(--ml-divider) 25%, var(--ml-bg-input) 50%, var(--ml-divider) 75%);
  background-size: 200px 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

/* 空状态 */
.story-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: var(--ml-text-label);
}
.story-empty-icon {
  font-size: 2.4rem;
  opacity: 0.5;
}
.story-empty-text {
  font-size: 0.9rem;
}

/* 正文 */
.story-content {
  max-width: 100%;
}
.story-para {
  font-size: 0.95rem;
  line-height: 1.8;
  margin-bottom: 12px;
  color: var(--ml-text);
  word-break: break-word;
}
.story-dialogue {
  color: var(--ml-primary);
  padding-left: 12px;
  border-left: 2px solid var(--ml-primary);
}
</style>