<template>
  <div class="list-container">
    <!-- Loading -->
    <SkeletonBox v-if="loading" :count="4" height="72" />

    <!-- Error -->
    <ErrorState
      v-else-if="error"
      :message="error"
      @retry="loadData"
    />

    <!-- Empty -->
    <EmptyState
      v-else-if="list.length === 0"
      message="当前没有直播"
      icon="📡"
    />

    <!-- 直播列表 -->
    <template v-else>
      <div v-for="(l, i) in list" :key="i" class="list-card" @click="goRoom(i)">
        <div class="list-card-inner">
          <div class="list-avatar">{{ l.avatar || '🎥' }}</div>
          <div class="list-info">
            <div class="list-name-row">
              <span class="list-name">{{ l.nick }}</span>
              <span class="list-level">{{ l.level }}</span>
              <span class="list-status-dot"></span>
            </div>
            <div v-if="l.title" class="list-title">{{ l.title }}</div>
            <div v-if="l.preview" class="list-preview">{{ l.preview }}</div>
          </div>
          <div class="list-meta">
            <div class="list-viewers">👁 {{ l.viewers || 0 }}</div>
            <div class="list-status-tag">{{ l.status || '直播中' }}</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSocialStore } from '../stores/social'
import SkeletonBox from '../components/SkeletonBox.vue'
import ErrorState from '../components/ErrorState.vue'
import EmptyState from '../components/EmptyState.vue'
import { usePageRefresh } from '../composables/usePageRefresh'

const router = useRouter()
const social = useSocialStore()
const loading = ref(true)
const error = ref('')
const list = computed(() => social.liveList)

function goRoom(i: number) {
  router.push(`/live/${i}`)
}

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const p = usePageRefresh()
    await p.refreshPage('live')
  } catch (e: any) {
    error.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.list-container { max-width: 480px; margin: 0 auto; display: flex; flex-direction: column; gap: 8px; }

.list-card { background: var(--ml-bg-card); border-radius: 10px; overflow: hidden; border: 1px solid var(--ml-divider); cursor: pointer; transition: border-color 0.2s, background 0.2s; }
.list-card:hover { border-color: var(--ml-primary-dim); background: var(--ml-bg-hover); }
.list-card-inner { display: flex; padding: 12px 14px; gap: 12px; align-items: center; }

.list-avatar { width: 44px; height: 44px; border-radius: 50%; background: var(--ml-bg-input); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; border: 2px solid var(--ml-divider); }

.list-info { flex: 1; min-width: 0; }
.list-name-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.list-name { font-size: 14px; color: var(--ml-text); font-weight: bold; }
.list-level { font-size: 10px; color: var(--ml-primary); background: var(--ml-primary-dim); padding: 1px 6px; border-radius: 3px; }
.list-status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--ml-primary); flex-shrink: 0; animation: pulse-dot 2s ease-in-out infinite; }
@keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.3} }
.list-title { font-size: 12px; color: var(--ml-text-secondary); margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.list-preview { font-size: 12px; color: var(--ml-text-secondary); line-height: 1.5; }

.list-meta { text-align: right; flex-shrink: 0; }
.list-viewers { font-size: 11px; color: var(--ml-text-label); margin-bottom: 4px; }
.list-status-tag { font-size: 10px; color: var(--ml-primary); background: var(--ml-primary-dim); padding: 2px 6px; border-radius: 4px; }
</style>