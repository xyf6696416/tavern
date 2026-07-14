<template>
  <div class="outfit-selector" v-if="visible">
    <div class="os-header">
      <span class="os-title">👗 选择衣装</span>
      <button class="os-close" @click="$emit('close')">✕</button>
    </div>
    <div class="os-tags">
      <button v-for="outfit in outfits" :key="outfit" class="os-tag" :class="{ active: outfit === current }" @click="$emit('select', outfit)">
        {{ outfit }}
      </button>
    </div>
    <div class="os-current" v-if="current">
      当前：<strong>{{ current }}</strong>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  outfits: string[]
  current: string
  visible: boolean
}>()

defineEmits<{
  select: [outfit: string]
  close: []
}>()
</script>

<style scoped>
.outfit-selector {
  padding: 8px 12px;
  background: color-mix(in srgb, var(--c-illya) 4%, transparent);
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--c-illya) 12%, transparent);
  margin: 4px 0;
}
.os-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.os-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--c-illya);
  letter-spacing: 1px;
}
.os-close {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid var(--gold-dim);
  background: transparent;
  color: var(--text-label);
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  transition: all 0.2s;
}
.os-close:hover {
  background: var(--c-illya);
  color: #fff;
  border-color: var(--c-illya);
}
.os-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-height: 180px;
  overflow-y: auto;
}
.os-tag {
  padding: 3px 10px;
  border-radius: 14px;
  border: 1.5px dashed var(--gold-dim);
  background: rgba(255,255,255,0.6);
  color: var(--text-body);
  font-size: 11px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  white-space: nowrap;
}
.os-tag:hover {
  border-style: solid;
  border-color: var(--c-illya);
  background: color-mix(in srgb, var(--c-illya) 6%, transparent);
}
.os-tag.active {
  border-style: solid;
  border-color: var(--c-illya);
  background: linear-gradient(135deg, var(--c-illya), #D4459A);
  color: #fff;
  font-weight: 600;
}
.os-current {
  margin-top: 6px;
  font-size: 10px;
  color: var(--text-label);
  text-align: center;
}
.os-current strong {
  color: var(--c-illya);
}
</style>