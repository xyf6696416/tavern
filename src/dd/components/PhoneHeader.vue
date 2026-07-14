<template>
  <div v-if="showHeader" class="phone-header" :class="themeClass">
    <div class="header-left">
      <button v-if="isSubPage" class="header-btn back-btn" @click="goBack">
        <span>←</span>
      </button>
      <h1 class="header-title">{{ pageTitle }}</h1>
    </div>
    <div class="header-actions">
      <button class="header-btn" @click="toggleTheme">
        <span>{{ app.theme === 'dark' ? '☀️' : '🌙' }}</span>
      </button>
      <button class="header-btn header-bell" @click="handleBell">
        <span>🔔</span>
        <span v-if="totalBadges > 0" class="bell-badge">{{ totalBadges }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'
import { useDmStore } from '../stores/dm'

const router = useRouter()
const route = useRoute()
const app = useAppStore()
const dm = useDmStore()

const themeClass = computed(() => app.theme === 'dark' ? 'dark' : 'light')
const isSubPage = computed(() => route.meta?.isSubPage === true)
const showHeader = computed(() => !route.meta?.isTitleScreen)
const pageTitle = computed(() => (route.meta?.title as string) || 'M-life')
const totalBadges = computed(() => {
  return Object.values(dm.badges).reduce((sum, v) => sum + v, 0)
})

function toggleTheme() {
  app.toggleTheme()
}

function goBack() {
  router.back()
}

function handleBell() {
  app.addToast(`你有 ${totalBadges.value} 条新消息`, 'info')
}
</script>

<style scoped>
.phone-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  flex-shrink: 0;
  background: var(--ml-bg-header);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--ml-divider);
}

.phone-header.light {
  color: var(--ml-text);
}
.phone-header.dark {
  color: var(--ml-text);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.back-btn {
  font-size: 18px;
  font-weight: 700;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--ml-text);
  padding: 4px;
  border-radius: 6px;
  transition: background 0.15s;
  font-family: inherit;
  line-height: 1;
}
.back-btn:hover {
  background: var(--ml-bg-input);
}

.header-title {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.header-btn {
  position: relative;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: var(--ml-bg-input);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  transition: background 0.2s ease, transform 0.15s ease;
}
.header-btn:hover {
  background: var(--ml-primary-dim);
  transform: scale(1.05);
}
.header-btn:active {
  transform: scale(0.95);
}

.bell-badge {
  position: absolute;
  top: -1px;
  right: -1px;
  min-width: 15px;
  height: 15px;
  padding: 0 3px;
  border-radius: 7.5px;
  background: var(--ml-primary);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  letter-spacing: 0;
}
</style>
