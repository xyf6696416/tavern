<template>
  <div class="detail-container">
    <button class="back-btn" @click="$router.back()">← 返回</button>
    <div v-if="loading" class="loading">加载中...</div>
    <template v-else-if="detail">
      <div class="publisher-bar">
        <div class="publisher-avatar">💎</div>
        <div class="publisher-info">
          <div class="publisher-code">{{ detail.code }}</div>
          <div class="publisher-meta"><span class="meta-item">信用分 {{ detail.credit }}</span></div>
        </div>
      </div>
      <div class="section"><div class="section-title">📋 发布信息</div>
        <div class="info-grid">
          <div class="info-cell full"><div class="info-label">招募标题</div><div class="info-value">{{ detail.type || '' }} {{ detail.title }}</div></div>
          <div class="info-cell"><div class="info-label">状态</div><span class="status-badge" :class="statusClass(detail.status)">{{ detail.status || '招募中' }}</span></div>
          <div class="info-cell"><div class="info-label">报名</div><div class="info-value">{{ detail.applicants }}人</div></div>
          <div class="info-cell"><div class="info-label">时间</div><div class="info-value">{{ detail.time || '' }}</div></div>
          <div class="info-cell"><div class="info-label">地点</div><div class="info-value">{{ detail.location || '线上' }}</div></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">📝 详细要求</div>
        <div v-if="detail.description" class="req-block"><div class="req-label">描述</div><div class="req-value">{{ detail.description }}</div></div>
        <div v-if="detail.requirements" class="req-block"><div class="req-label">特殊要求</div><div class="req-value">{{ detail.requirements }}</div></div>
      </div>
      <div class="section"><div class="section-title">💰 报酬</div>
        <div class="reward-row"><span class="reward-label">预算</span><span class="reward-value gold">{{ detail.budget }}</span></div>
      </div>
      <div class="action-bar">
        <button class="btn btn-primary" @click="apply">✋ 报名应征</button>
        <button class="btn btn-secondary" @click="$router.push(`/dm/${detail.code}`)">私信发布者</button>
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRecruitStore } from '../stores/recruit'
import { useAppStore } from '../stores/app'
const store = useRecruitStore(); const app = useAppStore()
const loading = ref(true)
const detail = computed(() => store.detail)
function statusClass(s: string) { if (!s) return 'active'; if (s.includes('锁定')) return 'locked'; if (s.includes('完成')) return 'done'; if (s.includes('取消')) return 'cancel'; return 'active' }
function apply() { app.addToast('已报名，等待发布者筛选', 'success') }
onMounted(async () => { try { const { usePageRefresh } = await import('../composables/usePageRefresh'); const p = usePageRefresh(); await p.refreshPage('recruitDetail') } catch {} loading.value = false })
</script>
<style scoped>
.detail-container {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  background: var(--ml-bg);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px var(--ml-shadow-lg);
  border: 1px solid var(--ml-divider);
}
.back-btn {
  background: none;
  border: none;
  color: var(--ml-gold);
  font-size: 0.9rem;
  cursor: pointer;
  padding: 12px 16px 4px;
  display: block;
}
.publisher-bar {
  padding: 16px 20px;
  background: var(--ml-bg-card);
  border-bottom: 1px solid var(--ml-divider);
  display: flex;
  align-items: center;
  gap: 12px;
}
.publisher-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--ml-gold), var(--ml-gold-dim));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.publisher-info { flex: 1; }
.publisher-code {
  font-size: 0.95em;
  font-weight: 600;
  color: var(--ml-text);
}
.publisher-meta {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}
.meta-item {
  font-size: 0.72em;
  color: var(--ml-text-secondary);
}
.section {
  padding: 16px 20px;
  background: var(--ml-bg-card);
  border-bottom: 1px solid var(--ml-divider);
}
.section-title {
  font-size: 0.75em;
  font-weight: 600;
  color: var(--ml-gold);
  letter-spacing: 1px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.info-cell {
  background: var(--ml-bg);
  border-radius: 8px;
  padding: 10px 12px;
  border: 1px solid var(--ml-divider);
}
.info-cell.full { grid-column: 1 / -1; }
.info-label {
  font-size: 0.7em;
  color: var(--ml-text-label);
  margin-bottom: 4px;
}
.info-value {
  font-size: 0.85em;
  color: var(--ml-text);
  font-weight: 500;
}
.status-badge {
  display: inline-block;
  font-size: 0.72em;
  padding: 3px 10px;
  border-radius: 4px;
  font-weight: 500;
}
.status-badge.active { background: rgba(34, 197, 94, 0.1); color: var(--ml-green); }
.status-badge.locked { background: rgba(59, 130, 246, 0.1); color: var(--ml-blue); }
.status-badge.done { background: rgba(34, 197, 94, 0.1); color: var(--ml-green); }
.status-badge.cancel { background: rgba(156, 163, 175, 0.1); color: #9ca3af; }
.req-block {
  background: var(--ml-bg);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid var(--ml-divider);
  margin-bottom: 8px;
}
.req-label {
  font-size: 0.7em;
  color: var(--ml-text-label);
  margin-bottom: 4px;
}
.req-value {
  font-size: 0.85em;
  color: var(--ml-text);
}
.reward-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}
.reward-row:last-child { border-bottom: none; }
.reward-label {
  font-size: 0.8em;
  color: var(--ml-text-secondary);
}
.reward-value {
  font-size: 0.85em;
  font-weight: 600;
  color: var(--ml-text);
}
.reward-value.gold {
  color: var(--ml-gold);
  font-size: 1em;
}
.action-bar {
  padding: 16px 20px;
  background: var(--ml-bg);
  display: flex;
  gap: 10px;
}
.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.85em;
  font-weight: 600;
  border: none;
  cursor: pointer;
  flex: 1;
  text-align: center;
}
.btn-primary {
  background: linear-gradient(135deg, var(--ml-gold), var(--ml-gold-dim));
  color: #fff;
}
.btn-secondary {
  background: var(--ml-bg-input);
  color: var(--ml-text);
  border: 1px solid var(--ml-divider);
}
.loading { text-align: center; padding: 40px; color: var(--ml-text-label); }
</style>
