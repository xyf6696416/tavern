<template>
  <Teleport to="body">
    <div v-if="visible" class="overlay" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal-title">🔓 开盒</div>
        <SkeletonBox v-if="loading" :count="4" height="60" />
        <div v-else-if="data" class="data-grid">
          <div><span class="label">昵称</span><span>{{ data.nick }}</span></div>
          <div><span class="label">年龄</span><span>{{ data.age }}</span></div>
          <div><span class="label">职业</span><span>{{ data.occupation }}</span></div>
          <div><span class="label">身高</span><span>{{ data.height }}</span></div>
          <div><span class="label">身材</span><span>{{ data.figure }}</span></div>
          <div><span class="label">性格</span><span>{{ data.drive }}</span></div>
          <div><span class="label">标签</span><span>{{ data.tags }}</span></div>
          <div><span class="label">敏感点</span><span>{{ data.sensitive }}</span></div>
          <div><span class="label">偏好</span><span>{{ data.preference }}</span></div>
        </div>
        <button class="close-btn" @click="$emit('close')">关闭</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDmStore } from '../stores/dm'
import SkeletonBox from '../components/SkeletonBox.vue'

const props = defineProps<{ visible: boolean; contactId: string; contactName: string }>()
defineEmits(['close'])
const dm = useDmStore()
const loading = ref(false)
const data = computed(() => dm.unboxCache[props.contactId] || null)

watch(() => props.visible, (v) => {
  if (v && !data.value) loading.value = true
  else loading.value = false
})
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: var(--ml-overlay);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}
.modal {
  background: var(--ml-bg-card);
  border-radius: 14px;
  padding: 20px;
  max-width: 340px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px var(--ml-shadow-lg);
  animation: fadeIn 0.2s ease;
}
.modal-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 14px;
  text-align: center;
}
.data-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.data-grid > div {
  display: flex;
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px solid var(--ml-divider);
}
.data-grid > div:last-child {
  border-bottom: none;
}
.label {
  color: var(--ml-text-secondary);
  font-size: 0.8rem;
  min-width: 56px;
  flex-shrink: 0;
}
.close-btn {
  width: 100%;
  margin-top: 16px;
  padding: 10px;
  background: linear-gradient(135deg, var(--ml-primary), #FF8A9E);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-family: inherit;
  transition: opacity 0.15s;
}
.close-btn:hover {
  opacity: 0.9;
}
</style>
