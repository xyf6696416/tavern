<template>
  <div class="feed-container">
    <!-- Loading 状态 -->
    <template v-if="loading">
      <div v-for="n in 3" :key="n" class="post-card skeleton-card">
        <div class="post-header">
          <div class="skeleton skeleton-circle" />
          <div class="skeleton-lines">
            <div class="skeleton skeleton-line w-40" />
            <div class="skeleton skeleton-line w-24" />
          </div>
        </div>
        <div class="skeleton skeleton-line w-full mb-8" />
        <div class="skeleton skeleton-line w-3/4 mb-8" />
        <div class="skeleton skeleton-image" />
      </div>
    </template>

    <!-- 错误状态 -->
    <ErrorState
      v-else-if="error"
      :message="error"
      @retry="loadData"
    />

    <!-- 空状态 -->
    <EmptyState
      v-else-if="posts.length === 0"
      message="暂无动态，去邂逅页面看看吧"
      icon="📭"
    />

    <!-- 数据列表 -->
    <template v-else>
      <div v-for="(post, i) in posts" :key="i" class="post-card">
        <!-- 帖子头部 -->
        <div class="post-header">
          <div class="post-avatar">{{ post.avatar || '👤' }}</div>
          <div class="post-user-info">
            <div class="post-username">
              {{ post.nick || '匿名' }}
              <span class="post-badge">{{ post.level || '' }}</span>
            </div>
            <div class="post-meta">{{ post.time || '刚刚' }} · {{ post.section || '综合' }}</div>
          </div>
        </div>

        <!-- 帖子正文 -->
        <div class="post-body">{{ post.body || post.content || '' }}</div>

        <!-- 图片占位 -->
        <div v-if="post.image" class="post-image">
          <span>🖼️ {{ post.image }}</span>
          <span v-if="post.paywall && post.paywall !== '无'" class="post-paywall">🔒 {{ post.paywall }}</span>
        </div>

        <!-- 投票 -->
        <div v-if="post.poll && post.poll !== '无'" class="post-poll">
          <div class="post-poll-title">📊 投票</div>
          <div v-for="opt in pollOptions(post.poll)" :key="opt[0]" class="post-poll-option">
            <span>{{ opt[0] }}</span>
            <span class="poll-pct">{{ opt[1] }}</span>
          </div>
          <div v-if="pollCount(post.poll)" class="post-poll-count">{{ pollCount(post.poll) }}人参与</div>
        </div>

        <!-- 操作栏 -->
        <div class="post-actions">
          <span :class="{ 'action-active': liked[i] }" @click="toggleLike(i)">
            {{ liked[i] ? '❤️' : '🤍' }} {{ post.likes || 0 }}
          </span>
          <span>💬 {{ post.comments || 0 }}</span>
          <span>🔁 {{ post.shares || 0 }}</span>
        </div>

        <!-- 热评 -->
        <div v-if="post.hot1 || post.hot2 || post.hot3" class="hot-comments">
          <div class="hot-comments-title">🔥 热评</div>
          <div v-for="h in hotList(post)" :key="h" class="hot-comment-item">
            <span class="name">{{ h.split(':')[0] }}:</span> {{ h.split(':').slice(1).join(':') }}
          </div>
        </div>
      </div>

      <!-- 加载更多 -->
      <div v-if="hasMore" class="load-more" @click="loadMore">
        {{ loadingMore ? '加载中...' : '加载更多' }}
      </div>
      <div v-else class="load-end">—— 已经到底了 ——</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSocialStore } from '../stores/social'
import ErrorState from '../components/ErrorState.vue'
import EmptyState from '../components/EmptyState.vue'
import { usePageRefresh } from '../composables/usePageRefresh'

const social = useSocialStore()
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const hasMore = ref(true)
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

function hotList(post: any) {
  return [post.hot1, post.hot2, post.hot3].filter((h: string) => h && h !== '无')
}

function toggleLike(i: number) {
  liked.value[i] = !liked.value[i]
  if (liked.value[i]) {
    posts.value[i].likes = (posts.value[i].likes || 0) + 1
  } else {
    posts.value[i].likes = Math.max(0, (posts.value[i].likes || 0) - 1)
  }
}

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const p = usePageRefresh()
    await p.refreshPage('home')
    posts.value = social.posts || []
    liked.value = posts.value.map(() => false)
    hasMore.value = posts.value.length > 0
  } catch (e: any) {
    error.value = e?.message || '加载失败，请检查网络'
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  // 模拟加载更多
  await new Promise(r => setTimeout(r, 800))
  loadingMore.value = false
  hasMore.value = false // 目前没有分页，直接到底
}

onMounted(loadData)
</script>

<style scoped>
.feed-container {
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ── 骨架屏 ── */
.skeleton-card {
  pointer-events: none;
}

.skeleton-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skeleton-line {
  height: 12px;
  border-radius: 4px;
}

.skeleton-image {
  width: 100%;
  height: 80px;
  border-radius: 8px;
  margin-top: 8px;
}

.w-40 { width: 120px; }
.w-24 { width: 72px; }
.w-full { width: 100%; }
.w-3\/4 { width: 75%; }
.mb-8 { margin-bottom: 8px; }

/* ── 帖子卡片 ── */
.post-card {
  background: var(--ml-bg-card);
  border-radius: 12px;
  padding: 14px 16px;
  border: 1px solid var(--ml-divider);
}

.post-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.post-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--ml-bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.post-user-info {
  flex: 1;
  min-width: 0;
}

.post-username {
  font-size: 13px;
  color: var(--ml-text);
  display: flex;
  align-items: center;
  gap: 6px;
}

.post-badge {
  font-size: 10px;
  color: var(--ml-primary);
  background: var(--ml-primary-dim);
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: 500;
}

.post-meta {
  font-size: 11px;
  color: var(--ml-text-label);
  margin-top: 2px;
}

.post-body {
  font-size: 14px;
  color: var(--ml-text);
  line-height: 1.7;
  margin-bottom: 10px;
  word-break: break-word;
}

.post-image {
  background: var(--ml-bg-input);
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--ml-text-secondary);
  line-height: 1.6;
  text-align: center;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
}

.post-paywall {
  display: inline-block;
  background: var(--ml-primary);
  color: #fff;
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 10px;
}

/* ── 投票 ── */
.post-poll {
  background: var(--ml-bg-input);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 10px;
}

.post-poll-title {
  font-size: 11px;
  color: var(--ml-text-label);
  margin-bottom: 6px;
}

.post-poll-option {
  display: flex;
  justify-content: space-between;
  padding: 6px 10px;
  background: var(--ml-bg-card);
  border-radius: 6px;
  margin-bottom: 4px;
  font-size: 13px;
  color: var(--ml-text);
}

.poll-pct {
  color: var(--ml-primary);
  font-weight: 600;
}

.post-poll-count {
  font-size: 11px;
  color: var(--ml-text-secondary);
  margin-top: 4px;
}

/* ── 操作栏 ── */
.post-actions {
  display: flex;
  gap: 18px;
  padding-top: 10px;
  border-top: 1px solid var(--ml-divider);
  font-size: 12px;
  color: var(--ml-text-secondary);
  cursor: default;
}

.post-actions span {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: color 0.15s;
}

.post-actions span:hover {
  color: var(--ml-primary);
}

.post-actions .action-active {
  color: var(--ml-primary);
}

/* ── 热评 ── */
.hot-comments {
  margin-top: 10px;
  padding: 10px;
  background: var(--ml-bg);
  border-radius: 8px;
}

.hot-comments-title {
  font-size: 11px;
  color: var(--ml-text-label);
  margin-bottom: 6px;
}

.hot-comment-item {
  font-size: 12px;
  color: var(--ml-text-secondary);
  line-height: 1.8;
}

.hot-comment-item .name {
  color: var(--ml-primary);
}

/* ── 加载更多 ── */
.load-more {
  text-align: center;
  padding: 14px;
  color: var(--ml-primary);
  font-size: 13px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.load-more:hover {
  opacity: 0.7;
}

.load-end {
  text-align: center;
  padding: 14px;
  color: var(--ml-text-label);
  font-size: 12px;
}
</style>