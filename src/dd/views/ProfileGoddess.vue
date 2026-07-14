<template>
  <div class="goddess-container">
    <div class="board-header">
      <div class="board-title">
        <div class="board-icon">🌙</div>
        <div><div class="board-name">女神夜话</div><div class="board-subtitle">真实经历 · 女性视角</div></div>
      </div>
    </div>
    <div class="posts-area">
      <SkeletonBox v-if="loading" :count="3" height="200" />
      <ErrorState v-else-if="error" :message="error" @retry="loadData" />
      <template v-else>
        <div v-for="(post, pi) in posts" :key="pi" class="post-card">
          <div class="post-card-header">
            <div class="post-avatar">🌙</div>
            <div class="post-meta">
              <div class="post-codename">{{ post.codename || '夜话女孩#' + pi }}</div>
              <div class="post-time-row">
                <span>📅 {{ post.expTime || '' }}</span>
                <span>🕐 {{ post.time || '' }}</span>
              </div>
            </div>
          </div>
          <div class="object-card">
            <div class="object-row">
              <span class="object-name">{{ post.objectName || 'X先生' }}</span>
              <span class="object-body">{{ post.objectBody || '' }}</span>
            </div>
            <div class="object-scores">
              <div class="object-score-item">颜值<span class="score-num" :class="scoreClass(post.looks)">{{ post.looks || '-' }}</span></div>
              <div class="object-score-item">卫生<span class="score-num" :class="scoreClass(post.hygiene)">{{ post.hygiene || '-' }}</span></div>
            </div>
          </div>
          <div v-if="post.place || post.vibe" class="section-block">
            <div class="section-header"><span class="section-icon">🍽️</span><span class="section-label">约会</span><span class="section-meta">{{ post.place || '' }} · {{ post.duration || '' }}</span></div>
            <div class="section-detail">{{ post.vibe || '' }}</div>
          </div>
          <div v-if="post.foreplayDetail" class="section-block">
            <div class="section-header"><span class="section-icon">💋</span><span class="section-label">前戏</span><span class="section-meta">{{ post.foreplayDuration || '' }} · 技术<span class="score-inline" :class="scoreClass(post.foreplaySkill)">{{ post.foreplaySkill || '-' }}分</span></span></div>
          </div>
          <div v-if="post.sexDetail" class="section-block">
            <div class="section-header"><span class="section-icon">🔥</span><span class="section-label">正戏</span><span class="section-meta">{{ post.sexDuration || '' }} · 技术<span class="score-inline" :class="scoreClass(post.sexSkill)">{{ post.sexSkill || '-' }}分</span></span></div>
          </div>
          <div v-if="post.afterAttitude" class="section-block">
            <div class="section-header"><span class="section-icon">🌅</span><span class="section-label">事后</span><span class="section-meta">{{ post.afterOvernight === '是' ? '过夜' : post.afterOvernight === '否' ? '未过夜' : '' }}</span></div>
            <div class="section-detail">{{ post.afterAttitude }}</div>
          </div>
          <div class="verdict-block">
            <div class="verdict-header">
              <span class="verdict-total" :class="scoreClass(post.score)">{{ post.score || '-' }}</span>
              <span style="font-size:11px;color:var(--text-dimmer)">/ 10</span>
            </div>
            <div v-if="post.summary" class="verdict-summary">"{{ post.summary }}"</div>
          </div>
          <div v-if="post.tags" class="tags-row">
            <span v-for="tag in parseTags(post.tags)" :key="tag" class="tag" :class="tagType(tag)">{{ tag }}</span>
          </div>
          <div class="actions-row">
            <span :class="{ 'action-active': liked[pi] }" @click="toggleLike(pi)">{{ liked[pi] ? '❤️' : '🤍' }} <span class="action-count">{{ post.likes || 0 }}</span></span>
            <span>💬 <span class="action-count">{{ post.comments || 0 }}</span></span>
            <span>🤝 <span class="action-count">{{ post.feels || 0 }}</span></span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSocialStore } from '../stores/social'
import SkeletonBox from '../components/SkeletonBox.vue'
import ErrorState from '../components/ErrorState.vue'
import { usePageRefresh } from '../composables/usePageRefresh'

const social = useSocialStore()
const loading = ref(true)
const error = ref('')
const liked = ref<boolean[]>([])
const posts = ref<any[]>([])

function scoreClass(v: string) {
  const n = parseInt(v)
  if (isNaN(n)) return ''
  if (n >= 8) return 'high'
  if (n >= 5) return 'mid'
  return 'low'
}

function parseTags(t: string) {
  return t.split(',').map(s => s.trim()).filter(Boolean)
}

function tagType(label: string) {
  const pos = ['技术好','前戏足','有耐心','体力好','尺寸满意','态度温柔','事后贴心','颜值在线','身材好','会说话','节奏舒服','能让人高潮']
  const neg = ['技术差','没前戏','自顾自','秒射','不讲卫生','态度冷淡','完事就跑','照骗','只顾自己爽','节奏乱','一言难尽']
  if (pos.includes(label)) return 'positive'
  if (neg.includes(label)) return 'negative'
  return 'neutral'
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
    await p.refreshPage('goddess')
    posts.value = social.goddess || []
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
.goddess-container { --purple-main: #667eea; --purple-light: #764ba2; --purple-glow: rgba(102,126,234,0.2); --pink-accent: #ff6b9d; --bg-dark: #0a0a14; --bg-main: #12121a; --bg-card: #161625; --text-main: #e5e7eb; --text-dim: #9ca3af; --text-dimmer: #6b7280; --border: rgba(102,126,234,0.12); --border-light: #1e1e30; --green: #34d399; --yellow: #fbbf24; --red: #f87171; --tag-bg: rgba(102,126,234,0.1); --tag-text: #a5b4fc; --score-high: #34d399; --score-mid: #fbbf24; --score-low: #f87171; }
.goddess-container { width: 100%; max-width: 520px; margin: 0 auto; background: var(--bg-dark); border-radius: 14px; overflow: hidden; box-shadow: 0 2px 20px rgba(0,0,0,0.35); }
.board-header { background: linear-gradient(135deg,#0f0f1a,#1a1a2e); padding: 14px 18px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
.board-title { display: flex; align-items: center; gap: 10px; }
.board-icon { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg,#667eea,#764ba2); display: flex; align-items: center; justify-content: center; font-size: 18px; }
.board-name { font-size: 16px; font-weight: 700; color: var(--text-main); }
.board-subtitle { font-size: 11px; color: var(--text-dimmer); }
.posts-area { padding: 10px; display: flex; flex-direction: column; gap: 10px; }
.post-card { background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-light); overflow: hidden; }
.post-card-header { padding: 12px 16px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.04); }
.post-avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg,#667eea,#764ba2); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.post-meta { flex: 1; }
.post-codename { font-size: 14px; font-weight: 600; color: var(--text-main); }
.post-time-row { font-size: 11px; color: var(--text-dimmer); margin-top: 2px; display: flex; gap: 12px; }
.object-card { margin: 10px 16px; padding: 10px 14px; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); }
.object-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-dim); }
.object-name { font-weight: 600; color: var(--text-main); font-size: 14px; }
.object-scores { display: flex; gap: 14px; margin-top: 6px; }
.object-score-item { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text-dimmer); }
.score-num { font-weight: 700; font-size: 16px; }
.score-num.high { color: var(--score-high); }
.score-num.mid { color: var(--score-mid); }
.score-num.low { color: var(--score-low); }
.section-block { padding: 8px 16px; border-bottom: 1px solid rgba(255,255,255,0.03); }
.section-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.section-icon { font-size: 14px; }
.section-label { font-size: 13px; font-weight: 600; color: var(--purple-main); }
.section-meta { font-size: 11px; color: var(--text-dimmer); margin-left: auto; }
.section-meta .score-inline { font-weight: 700; font-size: 13px; margin-left: 6px; }
.section-detail { font-size: 13px; color: var(--text-dim); line-height: 1.7; }
.verdict-block { margin: 0 16px 10px; padding: 12px 14px; background: linear-gradient(135deg,rgba(102,126,234,0.06),rgba(118,75,162,0.06)); border-radius: 8px; border: 1px solid rgba(102,126,234,0.1); }
.verdict-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.verdict-total { font-size: 28px; font-weight: 800; }
.verdict-total.high { color: var(--score-high); }
.verdict-total.mid { color: var(--score-mid); }
.verdict-total.low { color: var(--score-low); }
.verdict-summary { font-size: 13px; color: var(--text-dim); line-height: 1.6; font-style: italic; }
.tags-row { padding: 0 16px 10px; display: flex; flex-wrap: wrap; gap: 6px; }
.tag { font-size: 11px; padding: 3px 10px; border-radius: 10px; background: var(--tag-bg); color: var(--tag-text); border: 1px solid rgba(102,126,234,0.15); }
.tag.positive { background: rgba(52,211,153,0.1); color: var(--green); border-color: rgba(52,211,153,0.2); }
.tag.negative { background: rgba(248,113,113,0.1); color: var(--red); border-color: rgba(248,113,113,0.2); }
.tag.neutral { background: rgba(251,191,36,0.1); color: var(--yellow); border-color: rgba(251,191,36,0.2); }
.actions-row { padding: 10px 16px; border-top: 1px solid rgba(255,255,255,0.04); display: flex; gap: 20px; font-size: 12px; color: var(--text-dimmer); }
.actions-row span { display: flex; align-items: center; gap: 4px; cursor: pointer; transition: color 0.15s; }
.actions-row span:hover { color: var(--purple-main); }
.actions-row .action-active { color: var(--pink-accent); }
.action-count { font-weight: 600; }
</style>