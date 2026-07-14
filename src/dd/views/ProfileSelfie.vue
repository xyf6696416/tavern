<template>
  <div class="selfie-container">
    <SkeletonBox v-if="loading" :count="4" height="120" />
    <ErrorState v-else-if="error" :message="error" @retry="loadData" />
    <EmptyState v-else-if="posts.length === 0" message="暂无福利自拍" icon="📸" />
    <template v-else>
      <div v-for="(p, i) in posts" :key="i" class="selfie-card">
        <div class="selfie-header">
          <div class="selfie-avatar">{{ p.avatar || '👤' }}</div>
          <div class="selfie-user-info">
            <div class="selfie-username">{{ p.nick || '匿名' }}<span class="selfie-badge">{{ p.level || '' }}{{ p.vip && p.vip !== '无' ? ' · ' + p.vip : '' }}</span></div>
            <div class="selfie-meta">{{ p.time }} · 福利自拍</div>
          </div>
        </div>
        <div v-if="p.caption || p.body" class="selfie-caption">{{ p.caption || p.body }}</div>
        <div class="selfie-image" v-if="p.image">
          <span>🖼️ {{ p.image }}</span>
          <span v-if="p.paywall && p.paywall !== '无'" class="selfie-paywall">🔒 {{ p.paywall }}</span>
        </div>
        <div class="selfie-actions">
          <span :class="{ active: liked[i] }" @click="toggleLike(i)">{{ liked[i] ? '❤️' : '🤍' }} {{ p.likes || 0 }}</span>
          <span>💬 {{ p.comments || 0 }}</span>
          <span>🔁 {{ p.shares || 0 }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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
    await p.refreshPage('selfie')
    posts.value = social.selfie || []
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
.selfie-container { max-width: 480px; margin: 0 auto; display: flex; flex-direction: column; gap: 10px; }
.selfie-card { background: var(--ml-bg-card); border-radius: 12px; padding: 14px 16px; border: 1px solid var(--ml-divider); }
.selfie-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.selfie-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--ml-bg-input); display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
.selfie-user-info { flex: 1; }
.selfie-username { font-size: 13px; color: var(--ml-text); display: flex; align-items: center; gap: 6px; }
.selfie-badge { font-size: 10px; color: var(--ml-primary); background: var(--ml-primary-dim); padding: 1px 6px; border-radius: 8px; }
.selfie-meta { font-size: 11px; color: var(--ml-text-label); margin-top: 2px; }
.selfie-caption { font-size: 14px; color: var(--ml-text); line-height: 1.6; margin-bottom: 10px; }
.selfie-image { background: var(--ml-bg-input); border-radius: 8px; padding: 14px; margin-bottom: 10px; font-size: 13px; color: var(--ml-text-secondary); text-align: center; min-height: 100px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 8px; }
.selfie-paywall { display: inline-block; background: var(--ml-primary); color: #fff; font-size: 11px; padding: 3px 10px; border-radius: 10px; }
.selfie-actions { display: flex; gap: 18px; padding-top: 10px; border-top: 1px solid var(--ml-divider); font-size: 12px; color: var(--ml-text-secondary); }
.selfie-actions span { cursor: pointer; transition: color 0.15s; }
.selfie-actions span:hover { color: var(--ml-primary); }
.selfie-actions .active { color: var(--ml-primary); }
</style>