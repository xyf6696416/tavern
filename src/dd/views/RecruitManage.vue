<template>
  <div class="manage-container">
    <div class="manage-header">
      <div class="header-icon">💎</div>
      <div><div class="header-title">我的管理</div><div class="header-subtitle">黑金之选</div></div>
    </div>
    <div class="tab-bar">
      <div v-for="t in tabs" :key="t" class="tab-item" :class="{ active: activeTab === t }" @click="activeTab = t">{{ t }}</div>
    </div>
    <div class="filter-bar">
      <span v-for="f in filters" :key="f" class="filter-tag" :class="{ active: activeFilter === f }" @click="activeFilter = f">{{ f }}</span>
    </div>
    <div class="order-list">
      <div v-if="loading" class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">加载中...</div></div>
      <div v-else-if="list.length === 0" class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">暂无{{ activeTab === '我发布的' ? '发布的招募' : '报名的订单' }}</div></div>
      <div v-for="(r, i) in list" :key="i" class="order-card">
        <div class="order-top">
          <div class="order-left"><span class="order-icon">{{ r.typeIcon || r.type }}</span><span class="order-title">{{ r.title }}</span></div>
          <span class="status-badge" :class="statusClass(r.status)">{{ r.status || '招募中' }}</span>
        </div>
        <div class="order-meta"><span>🕐 {{ r.time || '' }}</span><span class="gold">{{ r.budget || '' }}</span></div>
        <div v-if="r.applicants" class="order-progress">报名: {{ r.applicants }}人</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRecruitStore } from '../stores/recruit'
const store = useRecruitStore()
const loading = ref(true)
const activeTab = ref('我发布的')
const activeFilter = ref('全部')
const tabs = ['我发布的', '我报名的']
const filters = ['全部', '招募中', '已锁定', '已完成', '已取消']
const list = computed(() => store.manage)
function statusClass(s: string) { if (s?.includes('招募中')) return 'active'; if (s?.includes('锁定')) return 'locked'; if (s?.includes('完成')) return 'done'; if (s?.includes('取消')) return 'cancel'; return 'active' }
onMounted(async () => { try { const { usePageRefresh } = await import('../composables/usePageRefresh'); const p = usePageRefresh(); await p.refreshPage('recruitManage') } catch {} loading.value = false })
</script>
<style scoped>
.manage-container { --gold-main: #c9a96e; --gold-glow: rgba(201,169,110,0.2); --gold-dim: #8b7340; --bg-dark: #121214; --bg-main: #1a1a1f; --bg-card: #222228; --bg-card-hover: #2a2a32; --text-main: #e5e5e7; --text-dim: #9a9a9f; --text-dimmer: #6a6a70; --border: rgba(201,169,110,0.12); --recruit-header: linear-gradient(135deg,#1a1a1f,#222228); }
[data-theme="light"] .manage-container { --bg-dark: #f5f5f0; --bg-main: #ffffff; --bg-card: #f9f9f6; --bg-card-hover: #f0efe8; --text-main: #1a1a1f; --text-dim: #6b6b70; --text-dimmer: #9a9a9f; --border: rgba(201,169,110,0.2); --recruit-header: linear-gradient(135deg,#f5f0e8,#faf5ee); }
.manage-container { width: 100%; max-width: 480px; margin: 0 auto; background: var(--bg-dark); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.4); border: 1px solid var(--border); }
.manage-header { background: var(--recruit-header); padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; }
.header-icon { width: 36px; height: 36px; background: linear-gradient(135deg,var(--gold-main),var(--gold-dim)); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.header-title { font-size: 1em; font-weight: 600; color: var(--text-main); }
.header-subtitle { font-size: 0.75em; color: var(--text-dim); }
.tab-bar { display: flex; background: var(--bg-main); border-bottom: 1px solid var(--border); }
.tab-item { flex: 1; padding: 12px 0; text-align: center; font-size: 0.85em; font-weight: 500; color: var(--text-dim); cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
.tab-item.active { color: var(--gold-main); border-bottom-color: var(--gold-main); }
.filter-bar { padding: 10px 16px; background: var(--bg-main); border-bottom: 1px solid var(--border); display: flex; gap: 6px; overflow-x: auto; }
.filter-tag { padding: 3px 10px; border-radius: 12px; font-size: 0.7em; white-space: nowrap; background: var(--bg-card); color: var(--text-dim); border: 1px solid transparent; cursor: pointer; }
.filter-tag.active { color: var(--gold-main); border-color: var(--gold-main); background: var(--gold-glow); }
.order-list { padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; background: var(--bg-main); }
.order-card { background: var(--bg-card); border-radius: 10px; padding: 14px; border: 1px solid var(--border); }
.order-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px; }
.order-left { display: flex; align-items: center; gap: 8px; }
.order-icon { font-size: 1.1em; }
.order-title { font-size: 0.9em; font-weight: 600; color: var(--text-main); }
.status-badge { font-size: 0.68em; padding: 3px 8px; border-radius: 4px; font-weight: 500; white-space: nowrap; }
.status-badge.active { background: rgba(52,211,153,0.1); color: #34d399; }
.status-badge.locked { background: rgba(96,165,250,0.1); color: #60a5fa; }
.status-badge.done { background: rgba(52,211,153,0.1); color: #34d399; }
.status-badge.cancel { background: rgba(156,163,175,0.1); color: #9ca3af; }
.order-meta { display: flex; gap: 12px; margin-bottom: 8px; }
.order-meta span { font-size: 0.72em; color: var(--text-dim); }
.order-meta .gold { color: var(--gold-main); font-weight: 600; }
.order-progress { font-size: 0.75em; color: var(--text-dimmer); padding: 6px 10px; background: rgba(255,255,255,0.02); border-radius: 6px; }
.empty-state { padding: 40px 20px; text-align: center; }
.empty-icon { font-size: 36px; margin-bottom: 12px; opacity: 0.5; }
.empty-text { font-size: 0.85em; color: var(--text-dimmer); }
</style>
