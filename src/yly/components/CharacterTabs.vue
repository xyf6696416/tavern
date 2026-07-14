<template>
  <div class="tabs">
    <button
      v-for="c in CHARACTER_LIST"
      :key="c.id"
      class="tab"
      :class="{ active: c.id === currentId }"
      :style="{ '--tab-color': c.color }"
      @click="$emit('switch', c.id)"
    >
      <IllyaIcon :name="getIcon(c.id)" :size="20" :color="c.color" class="tab-svg" />
      <span class="tab-label">{{ c.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import IllyaIcon from './IllyaIcon.vue'
import { CHARACTER_LIST } from '../bridge/variables'

// 本地用 IllyaIcon name 覆盖 emoji
const CHAR_ICONS: Record<string, string> = {
  '伊莉雅': 'illya',
  '美游': 'miyu',
  '小黑': 'kuro',
  '士郎': 'shirou',
  'user': 'user',
}

defineProps<{
  charIds: string[]
  currentId: string
}>()

defineEmits<{
  switch: [charId: string]
}>()

function getIcon(charId: string): string {
  return CHAR_ICONS[charId] ?? 'star'
}
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 2px;
  padding: 8px 6px 5px;
  border-bottom: 1px solid var(--gold-dim);
  flex-wrap: wrap;
}

.tab {
  flex: 1;
  min-width: 40px;
  padding: 4px 2px 3px;
  border: 1.5px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--text-label);
  cursor: pointer;
  text-align: center;
  font-size: 10px;
  transition: all 0.2s;
  font-family: inherit;
}
.tab:hover {
  background: color-mix(in srgb, var(--tab-color) 10%, transparent);
  border-color: color-mix(in srgb, var(--tab-color) 30%, transparent);
}
.tab.active {
  background: color-mix(in srgb, var(--tab-color) 12%, transparent);
  border-color: color-mix(in srgb, var(--tab-color) 40%, transparent);
  color: var(--tab-color);
  font-weight: 600;
}

.tab-svg { display: block; margin: 0 auto; }
.tab-label { font-size: 9px; margin-top: 1px; display: block; }

@media (max-width: 768px) {
  .tabs { padding: 6px 4px 4px; }
  .tab { min-width: 36px; padding: 3px 1px; }
  .tab-icon { font-size: 14px; }
  .tab-label { font-size: 8px; }
}
</style>