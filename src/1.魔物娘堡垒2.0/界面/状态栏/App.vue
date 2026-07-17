<template>
  <!-- 创建角色界面（楼层=0时直接显示） -->
  <CharacterCreate v-if="screen === 'create'" @done="screen = 'game'" />

  <!-- 主游戏界面（楼层>0时显示） -->
  <div v-else class="fortress-card">
    <div class="header">
      <div class="header-icon">⬥</div>
      <div class="header-title">魔物娘堡垒2.0</div>
      <div class="header-icon">⬥</div>
    </div>

    <div class="corruption-banner">
      <span class="corruption-label">侵蚀度</span>
      <div class="progress-bar corruption-bar">
        <div class="fill" :style="{ width: store.data.世界.侵蚀度 + '%', background: erosionGradient }"></div>
        <span class="label">{{ store.data.世界.侵蚀度 }}% — {{ store.data.世界.$侵蚀阶段 || store.data.世界.侵蚀阶段 }}</span>
      </div>
    </div>

    <nav class="tab-nav">
      <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </nav>

    <div class="panel-container">
      <OverviewPanel v-if="activeTab === 'overview'" />
      <ExplorationPanel v-if="activeTab === 'explore'" />
      <NpcPanel v-if="activeTab === 'npc'" />
      <InventoryPanel v-if="activeTab === 'inventory'" />
      <CombatPanel v-if="activeTab === 'combat'" />
    </div>

    <div class="footer">
      <span class="footer-text">❖ 诺亚之城 · 最后的堡垒 ❖</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import CharacterCreate from './components/CharacterCreate.vue';
import OverviewPanel from './components/OverviewPanel.vue';
import ExplorationPanel from './components/ExplorationPanel.vue';
import NpcPanel from './components/NpcPanel.vue';
import InventoryPanel from './components/InventoryPanel.vue';
import CombatPanel from './components/CombatPanel.vue';
import { useDataStore } from './store';

const store = useDataStore();

const screen = ref<'create' | 'game'>('create');
const activeTab = useLocalStorage<string>('mfm:active_tab', 'overview');

const tabs = [
  { id: 'overview', label: '概览', icon: '📊' },
  { id: 'explore', label: '探索', icon: '🗺️' },
  { id: 'npc', label: '人物', icon: '👤' },
  { id: 'inventory', label: '背包', icon: '🎒' },
  { id: 'combat', label: '战斗', icon: '⚔️' },
];

const erosionGradient = computed(() => {
  const v = store.data.世界.侵蚀度;
  if (v < 30) return `linear-gradient(90deg, #3b82f6, #6366f1)`;
  if (v < 60) return `linear-gradient(90deg, #6366f1, #a855f7)`;
  return `linear-gradient(90deg, #a855f7, #dc2626)`;
});
</script>

<style lang="scss" scoped>
.fortress-card {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  background: linear-gradient(180deg, var(--c-bg-card) 0%, var(--c-bg-dark) 100%);
  border: 2px solid var(--c-border);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.15), inset 0 0 60px rgba(0,0,0,0.3);
  font-family: var(--font-body);
  color: var(--c-text-primary);
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 10px 12px;
  background: linear-gradient(90deg, transparent, var(--c-bg-elevated), transparent);
  border-bottom: 1px solid var(--c-border);
}
.header-icon { color: var(--c-gold-dim); font-size: 16px; }
.header-title {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: bold;
  color: var(--c-gold);
  letter-spacing: 3px;
  text-shadow: 0 0 10px rgba(212, 168, 67, 0.3);
}

.corruption-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(0,0,0,0.3);
  border-bottom: 1px solid var(--c-border);
}
.corruption-label {
  font-family: var(--font-display);
  font-size: 11px;
  color: var(--c-corruption);
  font-weight: bold;
  white-space: nowrap;
  letter-spacing: 1px;
}
.corruption-bar { flex: 1; height: 16px; }
.corruption-bar .fill { background: linear-gradient(90deg, #3b82f6, #a855f7, #dc2626); }
.corruption-bar .label { font-size: 11px; }

.tab-nav {
  display: flex;
  background: var(--c-bg-dark);
  border-bottom: 2px solid var(--c-border);
}
.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 7px 4px;
  border: none;
  background: transparent;
  color: var(--c-text-muted);
  font-family: var(--font-body);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}
.tab-btn:hover { color: var(--c-text-secondary); background: rgba(139, 92, 246, 0.1); }
.tab-btn.active { color: var(--c-gold); background: var(--c-bg-elevated); }
.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 20%;
  right: 20%;
  height: 2px;
  background: var(--c-gold);
  box-shadow: 0 0 6px var(--c-gold);
}
.tab-icon { font-size: 14px; }
.tab-label { font-size: 11px; font-weight: bold; }

.panel-container { min-height: 200px; padding: 8px; }

.footer {
  padding: 6px;
  text-align: center;
  border-top: 1px solid var(--c-border);
  background: rgba(0,0,0,0.2);
}
.footer-text {
  font-family: var(--font-display);
  font-size: 10px;
  color: var(--c-text-muted);
  letter-spacing: 2px;
}
</style>