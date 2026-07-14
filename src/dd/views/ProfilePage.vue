<template>
  <div class="profile-page">
    <SkeletonBox v-if="loading" :count="3" height="60" />
    <div v-else class="profile-card">
      <div class="avatar">👤</div>
      <div class="name">{{ user.account || 'M-life 用户' }}</div>
      <div class="vip-row">
        <span class="vip-badge" :class="'vip-' + user.vip">💎 {{ user.vip || '普通用户' }}</span>
        <span class="level">{{ user.level || 'Lv1' }}</span>
      </div>
      <div class="balance">💰 M币: <strong class="amount">{{ user.balance }}</strong></div>
      <div class="stat-row">
        <span>❤️ {{ user.likes }}</span>
        <span>👥 {{ user.fans }}</span>
        <span>👀 {{ user.following }}</span>
      </div>
      <SignInButton @signin="doSignin" />
    </div>
    <div class="feature-list">
      <div class="feature-item" @click="goFeature('selfie')">
        <span class="fi-icon">📸</span>
        <span class="fi-label">福利自拍</span>
        <span v-if="isVipLocked('selfie')" class="fi-lock">🔒</span>
        <span class="fi-arrow">→</span>
      </div>
      <div class="feature-item" @click="goFeature('chat')">
        <span class="fi-icon">💬</span>
        <span class="fi-label">闲聊灌水</span>
        <span v-if="isVipLocked('chat')" class="fi-lock">🔒</span>
        <span class="fi-arrow">→</span>
      </div>
      <div class="feature-item" @click="goFeature('resource')">
        <span class="fi-icon">📦</span>
        <span class="fi-label">资源分享</span>
        <span v-if="isVipLocked('resource')" class="fi-lock">🔒</span>
        <span class="fi-arrow">→</span>
      </div>
      <div class="feature-item" @click="goFeature('goddess')">
        <span class="fi-icon">👑</span>
        <span class="fi-label">女神夜话</span>
        <span v-if="isVipLocked('goddess')" class="fi-lock">🔒</span>
        <span class="fi-arrow">→</span>
      </div>
      <div class="feature-item" @click="$router.push('/recruit')">
        <span class="fi-icon">💎</span>
        <span class="fi-label">黑金之选</span>
        <span class="fi-count" v-if="user.recruitActive">({{ user.recruitActive }})</span>
        <span class="fi-arrow">→</span>
      </div>
      <div class="feature-item" @click="$router.push('/settings')">
        <span class="fi-icon">⚙️</span>
        <span class="fi-label">设置</span>
        <span class="fi-arrow">→</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useAppStore } from '../stores/app'
import SignInButton from '../components/SignInButton.vue'
import SkeletonBox from '../components/SkeletonBox.vue'
import { usePageRefresh } from '../composables/usePageRefresh'

const router = useRouter()
const user = useUserStore()
const app = useAppStore()
const loading = ref(true)

const VIP_LOCKED_FEATURES: Record<string, string> = {
  selfie: '白银',
  chat: '白银',
  resource: '白银',
  goddess: '黄金',
}

function isVipLocked(feature: string): boolean {
  const required = VIP_LOCKED_FEATURES[feature]
  if (!required) return false
  const tierOrder = ['无', '白银', '黄金', '黑金']
  return tierOrder.indexOf(user.vip) < tierOrder.indexOf(required)
}

function goFeature(name: string) {
  if (isVipLocked(name)) {
    app.addToast(`需要${VIP_LOCKED_FEATURES[name]}VIP才能访问`, 'warning')
    return
  }
  router.push(`/profile/${name}`)
}

function doSignin() {
  if (user.signin === '已签') { app.addToast('今日已签到', 'warning'); return }
  user.signin = '已签'; user.signinStreak++; user.balance += 50
  app.addToast('签到成功 +50 M币', 'success')
}

onMounted(async () => { try { const p = usePageRefresh(); await p.refreshPage('profile') } catch {} loading.value = false })
</script>

<style scoped>
.profile-page { padding: 4px 0; }
.profile-card { text-align: center; padding: 24px 16px; background: var(--ml-bg-card); border-radius: 12px; margin-bottom: 12px; }
.avatar { font-size: 3.2rem; margin-bottom: 8px; }
.name { font-size: 1.15rem; font-weight: 600; margin-bottom: 6px; }
.vip-row { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px; }
.vip-badge { font-size: 0.8rem; padding: 2px 10px; border-radius: 6px; font-weight: 600; }
.vip-badge.vip-黑金 { background: linear-gradient(135deg, #FFD700, #FFA500); color: #1A1A1A; }
.vip-badge.vip-黄金 { background: #FFD700; color: #1A1A1A; }
.vip-badge.vip-白银 { background: #E8E8E8; color: #666; }
.vip-badge.vip-无 { background: var(--ml-bg-input); color: var(--ml-text-label); }
.level { font-size: 0.85rem; color: var(--ml-text-secondary); }
.balance { font-size: 0.95rem; margin: 8px 0; }
.balance strong { color: var(--ml-primary); }
.stat-row { display: flex; justify-content: center; gap: 24px; font-size: 0.85rem; color: var(--ml-text-secondary); margin: 10px 0; }
.feature-list { display: flex; flex-direction: column; gap: 1px; }
.feature-item {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 12px; background: var(--ml-bg-card);
  cursor: pointer; font-size: 0.9rem; border-radius: 8px; margin-bottom: 4px;
  transition: background 0.15s;
}
.feature-item:hover { background: var(--ml-bg-input); }
.fi-icon { font-size: 1.1rem; }
.fi-label { flex: 1; }
.fi-lock { font-size: 0.8rem; color: var(--ml-text-label); }
.fi-count { font-size: 0.8rem; color: var(--ml-text-secondary); }
.fi-arrow { color: var(--ml-text-label); font-size: 0.85rem; }
</style>
