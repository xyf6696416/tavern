<template>
  <nav v-if="showNav" class="nav-bar" :class="themeClass">
    <router-link
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="nav-item"
      active-class="nav-active"
    >
      <span class="nav-icon">{{ tab.icon }}</span>
      <span class="nav-label">{{ tab.label }}</span>
      <span v-if="tab.badge && tab.badge > 0" class="nav-dot">{{ tab.badge > 99 ? '99+' : tab.badge }}</span>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'
import { useDmStore } from '../stores/dm'

const route = useRoute()
const app = useAppStore()
const dm = useDmStore()

const themeClass = computed(() => app.theme === 'dark' ? 'dark' : 'light')
const showNav = computed(() => {
  const meta = route.meta
  return !meta?.isSubPage && !meta?.isTitleScreen
})

const tabs = computed(() => [
  { icon: '🏠', label: '首页', to: '/', badge: 0 },
  { icon: '♡', label: '匹配', to: '/match', badge: 0 },
  { icon: '▶', label: '直播', to: '/live', badge: 0 },
  { icon: '✉', label: '私信', to: '/dm', badge: dm.badges['dm'] || 0 },
  { icon: '☺', label: '我的', to: '/profile', badge: 0 },
])
</script>

<style scoped>
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 6px 0 env(safe-area-inset-bottom, 6px);
  background: var(--ml-nav-bg);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--ml-divider);
  flex-shrink: 0;
}

.nav-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-decoration: none;
  padding: 4px 12px;
  border-radius: 8px;
  transition: background 0.2s ease;
}
.nav-item:hover {
  background: var(--ml-primary-dim);
}

.nav-icon {
  font-size: 18px;
  line-height: 1;
}

.nav-label {
  font-size: 10px;
  color: var(--ml-nav-inactive);
  font-weight: 500;
  transition: color 0.2s ease;
}

.nav-active .nav-label {
  color: var(--ml-nav-active);
  font-weight: 700;
}

.nav-dot {
  position: absolute;
  top: 0;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--ml-primary);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  letter-spacing: 0;
}
</style>
