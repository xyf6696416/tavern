<template>
  <div class="resource-container">
    <SkeletonBox v-if="loading" :count="4" height="100" />
    <ErrorState v-else-if="error" :message="error" @retry="loadData" />
    <EmptyState v-else-if="posts.length === 0" message="暂无资源分享" icon="📦" />
    <template v-else>
      <div v-for="(p, i) in posts" :key="i" class="resource-card">
        <div class="resource-header">
          <div class="resource-avatar">{{ p.avatar || '📁' }}</div>
          <div class="resource-user-info">
            <div class="resource-username">{{ p.nick || '匿名' }}<span class="resource-badge">{{ p.level || '' }}{{ p.vip && p.vip !== '无' ? ' · ' + p.vip : '' }}</span></div>
            <div class="resource-meta">{{ p.time }} · 资源分享</div>
          </div>
        </div>
        <div v-if="p.title" class="resource-title">{{ p.title }}</div>
        <div v-if="p.desc || p.body" class="resource-desc">{{ p.desc || p.body }}</div>
        <div class="resource-file">
          <div class="resource-file-info">📁 {{ p.fileSize || '' }} · {{ p.fileFormat || '' }}</div>
          <div v-if="p.price === '免费' || !p.price" class="resource-file-free">✅ 免费下载</div>
          <div v-else class="resource-file-price">🔒 {{ p.price }}</div>
        </div>
        <div class="resource-actions">
          <span :class="{ active: liked[i] }" @click="toggleLike(i)">{{ liked[i] ? '❤️' : '🤍' }} {{ p.likes || 0 }}</span>
          <span>💬 {{ p.comments || 0 }}</span>
          <span>⬇️ {{ p.downloads || 0 }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSocialStore } from '../stores/social'
import SkeletonBox from '../components/SkeletonBox.vue'
import ErrorState from '../components/ErrorState.vue'
import EmptyState from '../components/EmptyState.vue'
import { usePageRefresh } from '../composables/usePageRefresh'

const social = useSocialStore()
const loading = ref(true)
const error = ref('')
const liked = ref<boolean[]>([])
const posts = ref<any[]>([])

function toggleLike(i: number) {
  liked.value[i] = !liked.value[i]
  if (liked.value[i]) posts.value[i].likes = (posts.value[i].likes || 0) + 1
  else posts.value[i].likes = Math.max(0, (posts.value[i].likes || 0) - 1)
}

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const p = usePageRefresh()
    await p.refreshPage('resource')
    posts.value = social.resource || []
    liked.value = posts.value.map(() => false)
  } catch (e: any) {
    error.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.resource-container { max-width: 480px; margin: 0 auto; display: flex; flex-direction: column; gap: 10px; }
.resource-card { background: var(--ml-bg-card); border-radius: 12px; padding: 14px 16px; border: 1px solid var(--ml-divider); }
.resource-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.resource-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--ml-bg-input); display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
.resource-user-info { flex: 1; }
.resource-username { font-size: 13px; color: var(--ml-text); display: flex; align-items: center; gap: 6px; }
.resource-badge { font-size: 10px; color: var(--ml-primary); background: var(--ml-primary-dim); padding: 1px 6px; border-radius: 8px; }
.resource-meta { font-size: 11px; color: var(--ml-text-label); margin-top: 2px; }
.resource-title { font-size: 14px; color: var(--ml-text); font-weight: bold; margin-bottom: 6px; }
.resource-desc { font-size: 13px; color: var(--ml-text-secondary); line-height: 1.6; margin-bottom: 10px; }
.resource-file { background: var(--ml-bg-input); border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
.resource-file-info { font-size: 12px; color: var(--ml-text-label); }
.resource-file-price { font-size: 11px; background: var(--ml-primary); color: #fff; padding: 3px 10px; border-radius: 10px; }
.resource-file-free { font-size: 11px; background: var(--ml-green); color: #fff; padding: 3px 10px; border-radius: 10px; }
.resource-actions { display: flex; gap: 18px; padding-top: 10px; border-top: 1px solid var(--ml-divider); font-size: 12px; color: var(--ml-text-secondary); }
.resource-actions span { cursor: pointer; transition: color 0.15s; }
.resource-actions span:hover { color: var(--ml-primary); }
.resource-actions .active { color: var(--ml-primary); }
</style>