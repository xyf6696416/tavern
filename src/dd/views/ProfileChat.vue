<template>
  <div class="chat-container">
    <SkeletonBox v-if="loading" :count="4" height="120" />
    <ErrorState v-else-if="error" :message="error" @retry="loadData" />
    <EmptyState v-else-if="posts.length === 0" message="暂无闲聊帖子" icon="💬" />
    <template v-else>
      <div v-for="(p, i) in posts" :key="i" class="chat-card">
        <div class="chat-header">
          <div class="chat-avatar">{{ p.avatar || '👤' }}</div>
          <div class="chat-user-info">
            <div class="chat-username">{{ p.nick || '匿名' }}<span class="chat-badge">{{ p.level || '' }}{{ p.vip && p.vip !== '无' ? ' · ' + p.vip : '' }}</span></div>
            <div class="chat-meta">{{ p.time }} · 闲聊灌水</div>
          </div>
        </div>
        <div class="chat-body">{{ p.body }}</div>
        <div v-if="p.poll && p.poll !== '无'" class="chat-poll">
          <div class="chat-poll-title">📊 投票</div>
          <div v-for="opt in pollOptions(p.poll)" :key="opt[0]" class="chat-poll-option">
            <span>{{ opt[0] }}</span><span class="chat-poll-pct">{{ opt[1] }}</span>
          </div>
          <div v-if="pollCount(p.poll)" class="chat-poll-count">共{{ pollCount(p.poll) }}人参与</div>
        </div>
        <div class="chat-actions">
          <span :class="{ active: liked[i] }" @click="toggleLike(i)">{{ liked[i] ? '❤️' : '🤍' }} {{ p.likes || 0 }}</span>
          <span>💬 {{ p.comments || 0 }}</span>
          <span>🔁 {{ p.shares || 0 }}</span>
        </div>
        <div v-if="p.hot1 || p.hot2 || p.hot3" class="chat-hot-comments">
          <div class="chat-hot-title">🔥 热评</div>
          <div v-for="h in hotList(p)" :key="h" class="chat-hot-item"><span class="name">{{ h.split(':')[0] }}:</span> {{ h.split(':').slice(1).join(':') }}</div>
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

function pollOptions(poll: string) {
  return poll.split(',').filter(p => p.includes(':') && !p.includes('参与人数')).map(p => {
    const i = p.lastIndexOf(':')
    return [p.slice(0, i).trim(), p.slice(i + 1).trim()]
  })
}
function pollCount(poll: string) {
  const m = poll.match(/参与人数[：:](\d+)/)
  return m ? m[1] : ''
}
function hotList(p: any) {
  return [p.hot1, p.hot2, p.hot3].filter((h: string) => h && h !== '无')
}
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
    await p.refreshPage('chat')
    posts.value = social.chatPosts || []
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
.chat-container { max-width: 480px; margin: 0 auto; display: flex; flex-direction: column; gap: 10px; }
.chat-card { background: var(--ml-bg-card); border-radius: 12px; padding: 14px 16px; border: 1px solid var(--ml-divider); }
.chat-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.chat-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--ml-bg-input); display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
.chat-user-info { flex: 1; }
.chat-username { font-size: 13px; color: var(--ml-text); display: flex; align-items: center; gap: 6px; }
.chat-badge { font-size: 10px; color: var(--ml-primary); background: var(--ml-primary-dim); padding: 1px 6px; border-radius: 8px; }
.chat-meta { font-size: 11px; color: var(--ml-text-label); margin-top: 2px; }
.chat-body { font-size: 14px; color: var(--ml-text); line-height: 1.7; margin-bottom: 10px; }
.chat-poll { background: var(--ml-bg-input); border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; }
.chat-poll-title { font-size: 11px; color: var(--ml-text-label); margin-bottom: 6px; }
.chat-poll-option { display: flex; justify-content: space-between; align-items: center; padding: 7px 12px; background: var(--ml-bg-card); border-radius: 6px; margin-bottom: 4px; font-size: 13px; color: var(--ml-text); }
.chat-poll-pct { color: var(--ml-primary); font-size: 12px; font-weight: 600; }
.chat-poll-count { font-size: 11px; color: var(--ml-text-secondary); margin-top: 4px; }
.chat-actions { display: flex; gap: 18px; padding-top: 10px; border-top: 1px solid var(--ml-divider); font-size: 12px; color: var(--ml-text-secondary); }
.chat-actions span { cursor: pointer; transition: color 0.15s; }
.chat-actions span:hover { color: var(--ml-primary); }
.chat-actions .active { color: var(--ml-primary); }
.chat-hot-comments { margin-top: 10px; padding: 10px; background: var(--ml-bg); border-radius: 8px; }
.chat-hot-title { font-size: 11px; color: var(--ml-text-label); margin-bottom: 6px; }
.chat-hot-item { font-size: 12px; color: var(--ml-text-secondary); line-height: 1.8; }
.chat-hot-item .name { color: var(--ml-primary); }
</style>