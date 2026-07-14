<template>
  <div class="story-drawer" :class="{ open: open }">
    <div class="drawer-handle" @click="open = !open">
      <span class="handle-bar" />
    </div>
    <Transition name="drawer-content">
      <div v-if="open" class="drawer-body">
        <p
          v-for="(para, i) in paragraphs"
          :key="i"
          class="drawer-para"
          :class="{ 'drawer-dialogue': isDialogue(para) }"
        >
          {{ para }}
        </p>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  text: string
}>()

const open = ref(false)

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
.story-drawer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 500;
  border-radius: 20px 20px 0 0;
  background: var(--ml-bg-card);
  box-shadow: 0 -4px 24px var(--ml-shadow);
  transition: transform 0.3s ease;
  max-height: 50vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.story-drawer:not(.open) {
  transform: translateY(calc(100% - 32px));
}

.drawer-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  cursor: pointer;
  flex-shrink: 0;
}

.handle-bar {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--ml-text-label);
  opacity: 0.5;
}

.drawer-body {
  padding: 0 16px 16px;
  overflow-y: auto;
  flex: 1;
}

.drawer-para {
  font-size: 0.9rem;
  line-height: 1.7;
  margin-bottom: 10px;
  color: var(--ml-text);
  word-break: break-word;
}

.drawer-dialogue {
  color: var(--ml-primary);
  padding-left: 10px;
  border-left: 2px solid var(--ml-primary);
}

/* 内容过渡 */
.drawer-content-enter-active,
.drawer-content-leave-active {
  transition: opacity 0.25s ease;
}
.drawer-content-enter-from,
.drawer-content-leave-to {
  opacity: 0;
}
</style>