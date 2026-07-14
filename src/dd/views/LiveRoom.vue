<template>
  <div class="live-container">
    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner" />
      <span>正在加载直播间...</span>
    </div>

    <!-- Error -->
    <ErrorState
      v-else-if="error"
      :message="error"
      @retry="loadData"
    />

    <!-- 直播间 -->
    <div v-else-if="room" class="live-card">
      <!-- 场景区 -->
      <div v-if="room.content" class="live-scene">
        <span class="scene-label">🔴 LIVE</span>
        {{ room.content }}
      </div>

      <!-- 主播信息 -->
      <div class="live-info">
        <div class="live-header">
          <div class="live-streamer">
            <div class="live-avatar">{{ room.avatar || '🎥' }}</div>
            <div class="live-name">{{ room.nick }}<span class="live-level">{{ room.level }}</span></div>
          </div>
          <div class="live-status">{{ room.status }}</div>
        </div>
        <div v-if="room.title" class="live-title">{{ room.title }}</div>
        <div class="live-viewers">👁 {{ room.viewers || 0 }} 人观看</div>
      </div>

      <!-- 弹幕区 -->
      <div v-if="room.danmaku" class="live-danmaku">
        <div class="live-danmaku-title">弹 幕</div>
        <div class="live-danmaku-list">
          <div v-for="(dm, i) in danmakuList" :key="i" class="danmaku-item">
            <span class="dm-name">{{ dm.name }}:</span> {{ dm.text }}
          </div>
        </div>
      </div>

      <!-- 礼物区 -->
      <div v-if="giftList.length" class="live-gifts">
        <div v-for="(g, i) in giftList" :key="i" class="gift-item">🎁 {{ g }}</div>
      </div>

      <!-- 底部操作 -->
      <div class="live-actions">
        <button class="action-btn" @click="sendGift">🎁 送礼</button>
        <button class="action-btn" @click="followRoom">❤️ {{ followed ? '已关注' : '关注' }}</button>
        <button class="action-btn secondary" @click="$router.back()">退出</button>
      </div>
    </div>

    <!-- 房间不存在 -->
    <EmptyState
      v-else
      message="直播间不存在或已关闭"
      icon="📡"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSocialStore } from '../stores/social'
import { useAppStore } from '../stores/app'
import ErrorState from '../components/ErrorState.vue'
import EmptyState from '../components/EmptyState.vue'
import { usePageRefresh } from '../composables/usePageRefresh'

const social = useSocialStore()
const appStore = useAppStore()

const loading = ref(true)
const error = ref('')
const followed = ref(false)

const room = computed(() => social.liveRoom)

const danmakuList = computed(() => {
  if (!room.value?.danmaku) return []
  if (typeof room.value.danmaku === 'string') return [{ name: '', text: room.value.danmaku }]
  return room.value.danmaku
})

const giftList = computed(() => {
  if (!room.value?.gifts) return []
  return Array.isArray(room.value.gifts) ? room.value.gifts : [room.value.gifts]
})

function sendGift() {
  appStore.addToast('🎉 感谢打赏！', 'success')
}

function followRoom() {
  followed.value = !followed.value
  appStore.addToast(followed.value ? '已关注主播' : '已取消关注', 'info')
}

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const p = usePageRefresh()
    await p.refreshPage('liveRoom')
  } catch (e: any) {
    error.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.live-container {
  max-width: 480px;
  margin: 0 auto;
}

.live-card {
  background: var(--ml-bg-card);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--ml-divider);
}

.live-scene {
  background: var(--ml-bg);
  padding: 16px 18px;
  font-size: 14px;
  color: var(--ml-text);
  line-height: 1.9;
  min-height: 80px;
  border-bottom: 1px solid var(--ml-divider);
}

.scene-label {
  display: block;
  font-size: 10px;
  color: var(--ml-primary);
  margin-bottom: 8px;
  letter-spacing: 2px;
  font-weight: 700;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

.live-info { padding: 10px 14px; }
.live-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.live-streamer { display: flex; align-items: center; gap: 8px; }
.live-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--ml-bg-input); display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
.live-name { font-size: 14px; color: var(--ml-text); font-weight: bold; }
.live-level { font-size: 10px; color: var(--ml-primary); margin-left: 6px; background: var(--ml-primary-dim); padding: 1px 6px; border-radius: 3px; }
.live-status { font-size: 10px; color: var(--ml-primary); background: var(--ml-primary-dim); padding: 3px 8px; border-radius: 4px; font-weight: 600; }
.live-title { font-size: 13px; color: var(--ml-text-secondary); margin-bottom: 4px; }
.live-viewers { font-size: 11px; color: var(--ml-text-label); }

.live-danmaku { border-top: 1px solid var(--ml-divider); padding: 10px 14px; }
.live-danmaku-title { font-size: 9px; color: var(--ml-text-label); margin-bottom: 6px; letter-spacing: 3px; }
.live-danmaku-list { display: flex; flex-direction: column; gap: 4px; }
.danmaku-item { font-size: 12px; color: var(--ml-text-secondary); line-height: 1.6; }
.danmaku-item .dm-name { color: var(--ml-blue); }

.live-gifts { padding: 6px 14px 12px; display: flex; flex-wrap: wrap; gap: 8px; }
.gift-item { font-size: 11px; color: var(--ml-gold); background: var(--ml-gold-glow); padding: 4px 10px; border-radius: 6px; border: 1px solid var(--ml-phone-border); }

/* ── 底部操作 ── */
.live-actions {
  display: flex;
  gap: 8px;
  padding: 12px 14px;
  border-top: 1px solid var(--ml-divider);
}

.action-btn {
  flex: 1;
  padding: 8px 14px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, var(--ml-primary), #FF8A9E);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.15s, transform 0.1s;
}

.action-btn:hover {
  opacity: 0.9;
}

.action-btn:active {
  transform: scale(0.97);
}

.action-btn.secondary {
  background: var(--ml-bg-input);
  color: var(--ml-text-secondary);
}

/* ── Loading ── */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
  color: var(--ml-text-label);
  font-size: 13px;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2.5px solid var(--ml-divider);
  border-top-color: var(--ml-primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>