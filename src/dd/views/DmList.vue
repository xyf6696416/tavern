<template>
  <div class="dm-page">
    <SkeletonBox v-if="loading" :count="4" height="64" />
    <EmptyState v-else-if="contacts.length === 0" message="没有联系人，去匹配吧" icon="💌" />
    <div v-else class="contact-list">
      <div v-for="c in contacts" :key="c.id" class="contact-item" @click="goChat(c.id)">
        <div class="c-avatar">{{ c.avatar || '👤' }}</div>
        <div class="c-info">
          <div class="c-name">{{ c.nick }} <span class="c-lv">{{ c.level }}</span></div>
          <div class="c-msg">{{ c.lastMsg }}</div>
        </div>
        <div class="c-right">
          <div class="c-time">{{ c.lastTime }}</div>
          <span v-if="c.unread" class="c-badge">{{ c.unread }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDmStore } from '../stores/dm'
import SkeletonBox from '../components/SkeletonBox.vue'
import EmptyState from '../components/EmptyState.vue'
import { usePageRefresh } from '../composables/usePageRefresh'

const router = useRouter(); const dm = useDmStore()
const loading = ref(true)
const contacts = computed(() => dm.contacts)
function goChat(id: string) { router.push(`/dm/${id}`) }

onMounted(async () => { try { const p = usePageRefresh(); await p.refreshPage('dmContacts') } catch {} loading.value = false })
</script>

<style scoped>
.contact-list { display: flex; flex-direction: column; gap: 2px; }
.contact-item { display: flex; align-items: center; gap: 10px; padding: 12px 8px; background: var(--ml-bg-card); border-radius: 8px; cursor: pointer; margin-bottom: 4px; }
.c-avatar { font-size: 2rem; }
.c-info { flex: 1; }
.c-name { font-weight: 600; font-size: 0.9rem; }
.c-lv { font-size: 0.7rem; color: var(--ml-text-secondary); }
.c-msg { font-size: 0.78rem; color: var(--ml-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }
.c-right { text-align: right; }
.c-time { font-size: 0.7rem; color: var(--ml-text-label); }
.c-badge { display: inline-block; background: var(--ml-primary); color: #fff; font-size: 0.65rem; padding: 1px 6px; border-radius: 10px; margin-top: 3px; }
</style>
