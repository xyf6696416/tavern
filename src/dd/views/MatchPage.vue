<template>
  <div class="match-container">
    <!-- Loading -->
    <SkeletonBox v-if="loading" :count="3" height="160" />

    <!-- Error -->
    <ErrorState
      v-else-if="error"
      :message="error"
      @retry="loadData"
    />

    <!-- Empty -->
    <EmptyState
      v-else-if="profiles.length === 0"
      message="附近没有新的人了"
      icon="🦋"
    />

    <!-- 卡片堆叠 -->
    <template v-else>
      <div class="card-stack">
        <div
          v-for="(profile, i) in visibleProfiles"
          :key="profile.id"
          class="match-card"
          :class="cardClass(i)"
          :style="cardStyle(i)"
          @click="goDetail(profile)"
        >
          <!-- 头像区域 -->
          <div class="match-header">
            <div class="match-avatar">{{ profile.avatar || getDefaultAvatar(i) }}</div>
            <div class="match-info">
              <div class="match-name">
                {{ profile.nickname || profile.nick || '匿名' }}
                <span v-if="profile.vip && profile.vip !== '无'" class="match-vip">{{ profile.vip }}</span>
              </div>
              <div class="match-meta">
                {{ profile.age || '?' }}岁 · {{ profile.distance || '??km' }}
              </div>
            </div>
            <span v-if="isOnline(profile.active)" class="match-online" />
          </div>

          <!-- 个人介绍 -->
          <div v-if="profile.bio" class="match-bio">{{ profile.bio }}</div>

          <!-- 标签 -->
          <div v-if="profile.tags" class="match-tags">
            <span v-for="tag in splitTags(profile.tags)" :key="tag" class="match-tag">{{ tag }}</span>
          </div>

          <!-- 操作按钮 -->
          <div class="match-actions" @click.stop>
            <button class="match-btn match-btn-skip" @click="skipProfile(i)">
              ✕
            </button>
            <button class="match-btn match-btn-like" @click="likeProfile(i)">
              ♥
            </button>
          </div>
        </div>
      </div>

      <!-- 无更多卡片 -->
      <div v-if="visibleProfiles.length === 0 && !loading" class="all-done">
        <div class="all-done-icon">✨</div>
        <div class="all-done-text">今天已浏览完毕</div>
        <button class="all-done-refresh" @click="resetProfiles">重新推荐</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSocialStore } from '../stores/social'
import { useAppStore } from '../stores/app'
import SkeletonBox from '../components/SkeletonBox.vue'
import ErrorState from '../components/ErrorState.vue'
import EmptyState from '../components/EmptyState.vue'
import { usePageRefresh } from '../composables/usePageRefresh'

const router = useRouter()
const social = useSocialStore()
const appStore = useAppStore()

const loading = ref(true)
const error = ref('')
const profiles = ref<any[]>([])
const swiping = ref(-1)
const swipeDir = ref('')
const allDone = ref(false)

const visibleProfiles = computed(() => profiles.value)

function getDefaultAvatar(i: number) {
  const avatars = ['🌙', '💫', '🌸', '🦊', '🐱', '🦄']
  return avatars[i % avatars.length]
}

function isOnline(active: string): boolean {
  return active?.includes('刚刚') || active?.includes('分钟')
}

function splitTags(tags: string): string[] {
  return tags.split(/[,，]/).map(s => s.trim()).filter(Boolean)
}

function cardClass(i: number) {
  return {
    'card-swiping': swiping.value === i && swipeDir.value === 'right',
    'card-swiping-left': swiping.value === i && swipeDir.value === 'left',
  }
}

function cardStyle(i: number) {
  if (swiping.value === i && swipeDir.value === 'right') {
    return { transform: 'translateX(200px) rotate(15deg)', opacity: 0, transition: 'all 0.4s ease' }
  }
  if (swiping.value === i && swipeDir.value === 'left') {
    return { transform: 'translateX(-200px) rotate(-15deg)', opacity: 0, transition: 'all 0.4s ease' }
  }
  return {}
}

function goDetail(profile: any) {
  const id = profile.nickname || profile.id || 'unknown'
  router.push(`/match/${id}`)
}

async function skipProfile(i: number) {
  swiping.value = i
  swipeDir.value = 'left'
  await new Promise(r => setTimeout(r, 400))
  profiles.value.splice(i, 1)
  swiping.value = -1
  swipeDir.value = ''
  appStore.addToast('已跳过', 'info')
}

async function likeProfile(i: number) {
  const p = profiles.value[i]
  swiping.value = i
  swipeDir.value = 'right'
  await new Promise(r => setTimeout(r, 400))
  profiles.value.splice(i, 1)
  swiping.value = -1
  swipeDir.value = ''
  appStore.addToast(`❤️ 已喜欢 ${p.nickname || p.nick || ''}`, 'success')
}

function resetProfiles() {
  allDone.value = false
  loadData()
}

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const p = usePageRefresh()
    await p.refreshPage('match')
    profiles.value = social.matches || []
  } catch (e: any) {
    error.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.match-container {
  max-width: 400px;
  margin: 0 auto;
}

.card-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.match-card {
  background: var(--ml-bg-card);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid var(--ml-divider);
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.match-card:hover {
  box-shadow: 0 2px 12px var(--ml-shadow);
}

.match-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.match-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--ml-bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.match-info {
  flex: 1;
}

.match-name {
  font-size: 16px;
  color: var(--ml-text);
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
}

.match-vip {
  font-size: 10px;
  color: var(--ml-gold);
  background: var(--ml-gold-glow);
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 600;
}

.match-meta {
  font-size: 12px;
  color: var(--ml-text-label);
  margin-top: 4px;
}

.match-online {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ml-green);
  flex-shrink: 0;
  box-shadow: 0 0 6px var(--ml-green-dim);
}

.match-bio {
  background: var(--ml-bg-input);
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 13px;
  color: var(--ml-text-secondary);
  line-height: 1.6;
  margin-bottom: 14px;
}

.match-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.match-tag {
  font-size: 11px;
  background: var(--ml-bg-input);
  color: var(--ml-primary);
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 500;
}

.match-actions {
  display: flex;
  justify-content: center;
  gap: 32px;
}

.match-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
  border: none;
}

.match-btn:hover {
  transform: scale(1.1);
}

.match-btn:active {
  transform: scale(0.9);
}

.match-btn-skip {
  background: var(--ml-bg-input);
  color: var(--ml-text-secondary);
  border: 2px solid var(--ml-divider);
}

.match-btn-skip:hover {
  border-color: var(--ml-text-label);
}

.match-btn-like {
  background: linear-gradient(135deg, var(--ml-primary), #FF8A9E);
  color: #fff;
  box-shadow: 0 2px 12px var(--ml-primary-glow);
}

.match-btn-like:hover {
  box-shadow: 0 4px 20px var(--ml-primary-glow);
}

/* ── 操作完成 ── */
.all-done {
  text-align: center;
  padding: 40px 20px;
}

.all-done-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.all-done-text {
  font-size: 14px;
  color: var(--ml-text-secondary);
  margin-bottom: 16px;
}

.all-done-refresh {
  padding: 10px 24px;
  border-radius: 8px;
  border: 1px solid var(--ml-primary);
  background: var(--ml-primary-dim);
  color: var(--ml-primary);
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  transition: all 0.2s;
}

.all-done-refresh:hover {
  background: linear-gradient(135deg, var(--ml-primary), #FF8A9E);
  color: #fff;
  border-color: transparent;
}
</style>