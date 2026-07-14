<template>
  <div class="text">
    <p v-for="(para, i) in paragraphs" :key="i" class="text-para" :class="{ 'text-dialogue': isDialogue(para) }">
      {{ para }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  text: string
}>()

const paragraphs = computed(() => {
  return props.text
    .split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 0)
})

function isDialogue(para: string): boolean {
  return para.startsWith('「') || para.startsWith('(') || para.startsWith('（')
}
</script>

<style scoped>
.text { max-width: 680px; margin: 0 auto; }
.text-para { font-size: 0.95rem; line-height: 1.8; margin-bottom: 12px; color: var(--text-body); word-break: break-word; }
.text-dialogue { color: #5a3a4a; padding-left: 12px; border-left: 2px solid var(--gold); }
</style>