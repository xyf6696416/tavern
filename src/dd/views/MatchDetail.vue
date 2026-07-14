<template>
  <div class="detail-card">
    <div class="detail-header-bar"></div>
    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner" />
      <span>正在加载详情...</span>
    </div>

    <!-- Error -->
    <ErrorState
      v-else-if="error"
      :message="error"
      @retry="loadData"
    />

    <template v-else-if="data">
      <div class="photo-area">
        <div class="photo-frame">
          <div class="photo-placeholder">
            <div class="photo-emoji">📷</div>
            <div class="photo-desc">{{ data.photo || '暂无照片' }}</div>
          </div>
        </div>
      </div>
      <div class="user-header">
        <span class="user-nickname">{{ data.nickname || '未知用户' }}</span>
        <span v-if="data.vip && data.vip !== '无'" class="vip-badge" :class="vipClass(data.vip)">{{ data.vip }}</span>
        <span class="user-age-distance">{{ data.age || '?' }}岁 · {{ data.distance || '?' }}</span>
      </div>
      <div class="status-row">
        <span><span class="status-dot" :class="activeClass(data.active)"></span>{{ data.active || '未知' }}</span>
        <span>{{ data.level || '' }}</span>
        <span>{{ data.registered || '' }}</span>
        <span>{{ data.purpose || '' }}</span>
      </div>
      <div v-if="data.bio" class="bio-section"><div class="bio-text">{{ data.bio }}</div></div>
      <div v-if="tags.length" class="tags-section">
        <span v-for="(tag, i) in tags" :key="i" class="tag-pill" :class="{ alt: i % 2 === 1 }">{{ tag }}</span>
      </div>
      <div class="divider"></div>
      <div class="details-section">
        <div class="section-title">详细资料</div>
        <div class="detail-grid">
          <div v-if="data.bodyType" class="detail-item"><div class="detail-label">体型</div><div class="detail-value">{{ data.bodyType }}</div></div>
          <div v-if="data.height" class="detail-item"><div class="detail-label">身高</div><div class="detail-value">{{ data.height }}</div></div>
          <div v-if="data.face" class="detail-item"><div class="detail-label">面容</div><div class="detail-value">{{ data.face }}</div></div>
          <div v-if="data.features" class="detail-item detail-full"><div class="detail-label">特征</div><div class="detail-value">{{ data.features }}</div></div>
          <div v-if="data.dailyStyle" class="detail-item"><div class="detail-label">日常风格</div><div class="detail-value">{{ data.dailyStyle }}</div></div>
          <div v-if="data.dateStyle" class="detail-item"><div class="detail-label">约会风格</div><div class="detail-value">{{ data.dateStyle }}</div></div>
        </div>
      </div>
      <div class="action-bar">
        <div class="btn-primary" @click="startChat">💬 发私信</div>
        <div class="btn-secondary" @click="$router.back()">返回</div>
      </div>
    </template>

    <EmptyState
      v-else
      message="用户不存在"
      icon="👤"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSocialStore } from '../stores/social'
import { useAppStore } from '../stores/app'
import ErrorState from '../components/ErrorState.vue'
import EmptyState from '../components/EmptyState.vue'
import { usePageRefresh } from '../composables/usePageRefresh'

const router = useRouter()
const route = useRoute()
const social = useSocialStore()
const appStore = useAppStore()

const loading = ref(true)
const error = ref('')
const data = computed(() => social.matchDetail)

const tags = computed(() =>
  data.value?.tags
    ? data.value.tags.split(/[,，]/).map((t: string) => t.trim()).filter(Boolean)
    : []
)

function vipClass(v: string) {
  if (v.includes('黑金')) return 'vip-blackgold'
  if (v.includes('黄金')) return 'vip-gold'
  if (v.includes('白银')) return 'vip-silver'
  return ''
}

function activeClass(a: string) {
  if (!a) return 'dot-offline'
  if (a.includes('刚刚')) return 'dot-online'
  if (a.includes('分钟')) return 'dot-recent'
  return 'dot-offline'
}

function startChat() {
  const name = data.value?.nickname || 'unknown'
  appStore.addToast(`开始与 ${name} 聊天`, 'info')
  router.push(`/dm/${name}`)
}

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const p = usePageRefresh()
    await p.refreshPage('matchDetail', route.params.id as string)
  } catch (e: any) {
    error.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.detail-card { max-width: 420px; margin: 0 auto; background: var(--ml-bg-card); border-radius: 16px; overflow: hidden; border: 1px solid var(--ml-divider); box-shadow: 0 8px 32px var(--ml-shadow-lg); }
.detail-header-bar { height: 4px; background: linear-gradient(90deg, var(--ml-primary), #FF8A9E, var(--ml-primary)); }
.photo-area { padding: 20px 20px 0; }
.photo-frame { width: 100%; aspect-ratio: 3/4; max-height: 360px; border-radius: 10px; background: var(--ml-bg-input); border: 1px solid var(--ml-divider); display: flex; align-items: center; justify-content: center; overflow: hidden; }
.photo-placeholder { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; }
.photo-emoji { font-size: 48px; opacity: 0.5; margin-bottom: 12px; }
.photo-desc { font-size: 13px; color: var(--ml-text-label); line-height: 1.7; font-style: italic; }
.user-header { padding: 16px 20px 12px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.user-nickname { font-size: 20px; font-weight: 600; color: var(--ml-text); }
.user-age-distance { font-size: 14px; color: var(--ml-text-secondary); }
.vip-badge { display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; letter-spacing: 1px; }
.vip-silver { background: rgba(192,192,192,0.15); color: #c0c0c0; border: 1px solid rgba(192,192,192,0.3); }
.vip-gold { background: rgba(212,175,55,0.15); color: #d4af37; border: 1px solid rgba(212,175,55,0.3); }
.vip-blackgold { background: rgba(180,130,255,0.15); color: #b482ff; border: 1px solid rgba(180,130,255,0.3); }
.status-row { padding: 0 20px 8px; display: flex; gap: 16px; font-size: 12px; color: var(--ml-text-label); flex-wrap: wrap; }
.status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 5px; vertical-align: middle; }
.dot-online { background: var(--ml-green); box-shadow: 0 0 6px var(--ml-green-dim); }
.dot-recent { background: var(--ml-gold); box-shadow: 0 0 6px var(--ml-gold-glow); }
.dot-offline { background: #6b7280; }
.bio-section { padding: 8px 20px 12px; }
.bio-text { font-size: 14px; color: var(--ml-text-secondary); line-height: 1.6; padding: 10px 14px; background: var(--ml-bg-input); border-radius: 8px; border-left: 2px solid var(--ml-primary-dim); }
.tags-section { padding: 0 20px 12px; display: flex; flex-wrap: wrap; gap: 8px; }
.tag-pill { display: inline-block; font-size: 11px; padding: 4px 12px; border-radius: 20px; background: var(--ml-primary-dim); color: var(--ml-primary); border: 1px solid transparent; }
.tag-pill.alt { background: rgba(100,140,255,0.1); color: var(--ml-blue); border: 1px solid rgba(100,140,255,0.2); }
.divider { margin: 0 20px; height: 1px; background: var(--ml-divider); }
.details-section { padding: 14px 20px 8px; }
.section-title { font-size: 11px; letter-spacing: 2px; color: var(--ml-text-label); margin-bottom: 10px; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.detail-item { background: var(--ml-bg-input); border-radius: 8px; padding: 10px 12px; }
.detail-label { font-size: 10px; color: var(--ml-text-label); letter-spacing: 1px; margin-bottom: 4px; }
.detail-value { font-size: 13px; color: var(--ml-text); font-weight: 500; }
.detail-full { grid-column: 1 / -1; }
.action-bar { padding: 16px 20px 20px; display: flex; gap: 10px; }
.btn-primary, .btn-secondary { flex: 1; padding: 12px 0; border-radius: 10px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; text-align: center; font-family: inherit; transition: all 0.15s; }
.btn-primary { background: linear-gradient(135deg, var(--ml-primary), #FF8A9E); color: #fff; }
.btn-primary:hover { box-shadow: 0 4px 16px var(--ml-primary-glow); }
.btn-primary:active { transform: scale(0.98); }
.btn-secondary { border: 1px solid var(--ml-divider); background: var(--ml-bg-input); color: var(--ml-text-secondary); }

.loading { text-align: center; padding: 40px 20px; display: flex; flex-direction: column; align-items: center; gap: 12px; color: var(--ml-text-label); font-size: 14px; }
.loading-spinner { width: 24px; height: 24px; border: 2.5px solid var(--ml-divider); border-top-color: var(--ml-primary); border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>