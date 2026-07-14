<template>
  <div class="recruit-container">
    <div class="recruit-header">
      <div class="header-icon">💎</div>
      <div><div class="header-title">黑金之选</div><div class="header-subtitle">招募广场</div></div>
      <button class="post-btn" @click="$router.push('/recruit/post')">✏️ 发布</button>
      <button class="manage-btn" @click="$router.push('/recruit/manage')">📊 管理</button>
    </div>
    <div class="filter-bar">
      <span v-for="f in allFilters" :key="f" class="filter-tag" :class="{ active: activeFilter === f }" @click="activeFilter = f">{{ f }}</span>
    </div>
    <div class="recruit-list">
      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else-if="filtered.length === 0" class="empty-state">暂无符合条件的招募</div>
      <div v-for="(r, i) in filtered" :key="i" class="recruit-card" :class="{ 'locked-card': r.status?.includes('锁定') }" @click="$router.push(`/recruit/${i}`)">
        <div class="card-row-top">
          <span class="type-icon">{{ r.typeIcon || r.type }}</span>
          <span class="card-title">{{ r.title }}</span>
          <span v-if="r.status?.includes('锁定')" class="lock-icon">🔒</span>
          <span class="card-status" :class="r.status?.includes('锁定') ? 'locked' : 'active'">{{ r.status || '招募中' }}</span>
        </div>
        <div v-if="r.tags" class="card-tags"><span v-for="tag in r.tags.split(',').map((t:string)=>t.trim())" :key="tag" class="play-tag">{{ tag }}</span></div>
        <div class="card-row-bottom"><span class="applicant-count">{{ r.applicants ? `已有${r.applicants}人报名` : '已有0人报名' }}</span><span class="card-reward">{{ r.budget || r.reward || '' }}</span></div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRecruitStore } from '../stores/recruit'
const recruit = useRecruitStore()
const loading = ref(true)
const allFilters = ['全部', '单人约会', '多人聚会', '角色扮演', '道具play', '露出任务', '调教', '摄影', '特殊类型']
const activeFilter = ref('全部')
const list = computed(() => recruit.list)
const filtered = computed(() => activeFilter.value === '全部' ? list.value : list.value.filter(r => (r.type || '').includes(activeFilter.value)))
import { onMounted } from 'vue'
import { usePageRefresh } from '../composables/usePageRefresh'
onMounted(async () => { try { const p = usePageRefresh(); await p.refreshPage('recruit') } catch {} loading.value = false })
</script>
<style scoped>
.recruit-container {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  background: var(--ml-bg);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px var(--ml-shadow-lg);
  border: 1px solid var(--ml-divider);
}
.recruit-header {
  background: var(--ml-bg-card);
  padding: 16px 20px;
  border-bottom: 1px solid var(--ml-divider);
  display: flex;
  align-items: center;
  gap: 10px;
}
.header-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--ml-gold), var(--ml-gold-dim));
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.header-title {
  font-size: 1.05em;
  font-weight: 600;
  color: var(--ml-text);
}
.header-subtitle {
  font-size: 0.75em;
  color: var(--ml-text-secondary);
  flex: 1;
}
.post-btn {
  padding: 6px 14px;
  background: linear-gradient(135deg, var(--ml-gold), var(--ml-gold-dim));
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.8em;
  font-weight: 600;
  cursor: pointer;
}
.manage-btn {
  padding: 6px 14px;
  background: transparent;
  color: var(--ml-gold);
  border: 1px solid var(--ml-gold);
  border-radius: 6px;
  font-size: 0.8em;
  font-weight: 500;
  cursor: pointer;
}
.filter-bar {
  padding: 10px 16px;
  background: var(--ml-bg-card);
  border-bottom: 1px solid var(--ml-divider);
  display: flex;
  flex-wrap: wrap;
  gap: 6px 8px;
}
.filter-tag {
  padding: 4px 12px;
  border-radius: 14px;
  font-size: 0.75em;
  white-space: nowrap;
  background: var(--ml-bg-input);
  color: var(--ml-text-secondary);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}
.filter-tag:hover {
  color: var(--ml-text);
}
.filter-tag.active {
  background: var(--ml-gold-glow);
  color: var(--ml-gold);
  border-color: var(--ml-gold);
}
.recruit-list {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--ml-bg);
}
.recruit-card {
  background: var(--ml-bg-card);
  border-radius: 12px;
  padding: 14px 16px;
  border: 1px solid var(--ml-divider);
  transition: all 0.2s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.recruit-card:hover {
  background: var(--ml-bg-hover);
  border-color: var(--ml-gold-glow);
}
.recruit-card.locked-card {
  border-left: 3px solid var(--ml-gold);
}
.card-row-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.type-icon {
  font-size: 1.1em;
  flex-shrink: 0;
}
.card-title {
  font-size: 0.95em;
  font-weight: 600;
  color: var(--ml-text);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-status {
  font-size: 0.65em;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
  flex-shrink: 0;
}
.card-status.active {
  background: rgba(34, 197, 94, 0.1);
  color: var(--ml-green);
}
.card-status.locked {
  background: rgba(59, 130, 246, 0.1);
  color: var(--ml-blue);
}
.lock-icon {
  color: var(--ml-gold);
}
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.play-tag {
  font-size: 0.68em;
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--ml-bg-input);
  color: var(--ml-text-label);
  border: 1px solid var(--ml-divider);
}
.card-row-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 4px;
  border-top: 1px solid var(--ml-divider);
}
.applicant-count {
  font-size: 0.7em;
  color: var(--ml-text-label);
}
.card-reward {
  font-size: 0.85em;
  font-weight: 600;
  color: var(--ml-gold);
}
.empty-state {
  text-align: center;
  padding: 32px 20px;
  color: var(--ml-text-label);
  font-size: 0.85em;
}
</style>
