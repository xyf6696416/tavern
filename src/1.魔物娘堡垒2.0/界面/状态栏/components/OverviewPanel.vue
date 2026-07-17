<template>
  <div class="panel">
    <!-- 时间地点 -->
    <div class="meta-bar">
      <span><span class="meta-icon">🕰️</span> {{ store.data.世界.当前时间 }}</span>
      <span><span class="meta-icon">📍</span> {{ store.data.世界.当前地点 }}</span>
    </div>

    <!-- 侵蚀度 -->
    <div class="panel-title" style="margin-top:0">
      <span>💀 诺亚之城侵蚀度</span>
      <span class="badge stage-badge" :class="erosionStageClass">{{ store.data.世界.$侵蚀阶段 || store.data.世界.侵蚀阶段 }}</span>
    </div>
    <div class="corruption-bar">
      <div class="progress-bar">
        <div class="fill" :style="{ width: store.data.世界.侵蚀度 + '%', background: erosionColor }"></div>
        <span class="label">{{ store.data.世界.侵蚀度 }}%</span>
      </div>
    </div>

    <!-- 主角状态 -->
    <div class="panel-title">
      <span>👤 {{ store.data.主角.姓名 || '主角' }}</span>
      <span class="badge">Lv.{{ store.data.主角.等级 }} · {{ store.data.主角.阵营 }} · {{ store.data.主角.种族 }}</span>
    </div>

    <div class="stats-grid">
      <!-- HP -->
      <div class="stat-row">
        <span class="stat-label">❤️ HP</span>
        <div class="progress-bar">
          <div class="fill" :style="{ width: hpPercent + '%', background: hpColor }"></div>
          <span class="label">{{ store.data.主角.生命值 }} / {{ store.data.主角.最大生命值 }}</span>
        </div>
        <div class="adj-group">
          <button class="btn btn-xs btn-primary" @click="adjustHP(-5)">−5</button>
          <button class="btn btn-xs btn-primary" @click="adjustHP(-1)">−1</button>
          <button class="btn btn-xs btn-primary" @click="adjustHP(1)">+1</button>
          <button class="btn btn-xs btn-primary" @click="adjustHP(5)">+5</button>
        </div>
      </div>

      <!-- EXP -->
      <div class="stat-row">
        <span class="stat-label">⭐ EXP</span>
        <div class="progress-bar">
          <div class="fill" :style="{ width: expPercent + '%', background: 'var(--c-exp-blue)' }"></div>
          <span class="label">{{ store.data.主角.经验值 }} / {{ store.data.主角.下一级经验 }}</span>
        </div>
        <div class="adj-group">
          <button class="btn btn-xs" @click="adjustExp(10)">+10</button>
          <button class="btn btn-xs" @click="adjustExp(50)">+50</button>
        </div>
      </div>

      <!-- 战力 + 金钱 -->
      <div class="stat-row">
        <span class="stat-label">⚔️ 战力</span>
        <span class="stat-value">{{ store.data.主角.战斗力 }}</span>
        <div class="adj-group">
          <button class="btn btn-xs" @click="adjustCombat(5)">+5</button>
          <button class="btn btn-xs" @click="adjustCombat(10)">+10</button>
        </div>
        <span style="margin:0 8px;color:var(--c-text-muted)">|</span>
        <span class="stat-label">💰 金钱</span>
        <span class="stat-value">{{ store.data.主角.金钱 }}</span>
        <div class="adj-group">
          <button class="btn btn-xs btn-gold" @click="adjustMoney(100)">+100</button>
          <button class="btn btn-xs btn-gold" @click="adjustMoney(-100)">−100</button>
        </div>
      </div>
    </div>

    <!-- 堕落进度 -->
    <div class="panel-title" style="margin-top:8px">
      <span>💀 堕落进度</span>
      <span class="badge stage-badge" :class="corruptionStageClass">{{ store.data.主角.$恶堕阶段 }}</span>
    </div>
    <div class="stats-grid">
      <div class="stat-row">
        <span class="stat-label">🔮 恶堕值</span>
        <div class="progress-bar">
          <div class="fill" :style="{ width: store.data.主角.恶堕值 + '%', background: corruptionColor }"></div>
          <span class="label">{{ store.data.主角.恶堕值 }}/100</span>
        </div>
        <div class="adj-group">
          <button class="btn btn-xs btn-danger" @click="adjustCorruption(1)">+1</button>
          <button class="btn btn-xs btn-danger" @click="adjustCorruption(5)">+5</button>
          <button class="btn btn-xs" @click="adjustCorruption(-1)">−1</button>
        </div>
      </div>
      <div class="stat-row">
        <span class="stat-label">🌸 雌堕值</span>
        <span class="stat-value stage-tag" :class="femStageClass">{{ store.data.主角.$雌堕阶段 }}</span>
        <div class="progress-bar" style="flex:1">
          <div class="fill" :style="{ width: store.data.主角.雌堕值 + '%', background: femColor }"></div>
          <span class="label">{{ store.data.主角.雌堕值 }}/100</span>
        </div>
        <div class="adj-group">
          <button class="btn btn-xs btn-danger" @click="adjustFem(1)">+1</button>
          <button class="btn btn-xs btn-danger" @click="adjustFem(5)">+5</button>
          <button class="btn btn-xs" @click="adjustFem(-1)">−1</button>
        </div>
      </div>
    </div>

    <!-- 状态标签 -->
    <div v-if="store.data.主角.状态 || store.data.主角.永久状态" class="status-tags">
      <span v-if="store.data.主角.状态" class="tag tag-temp">{{ store.data.主角.状态 }}</span>
      <span v-if="store.data.主角.永久状态" class="tag tag-perm">{{ store.data.主角.永久状态 }}</span>
    </div>

    <!-- 持有道具 -->
    <div v-if="store.data.主角.持有道具" class="info-line">
      <span class="info-label">📦 持有道具:</span>
      <span class="info-text">{{ store.data.主角.持有道具 }}</span>
    </div>

    <!-- 社交关系 -->
    <div v-if="store.data.主角.社交关系.length > 0" class="panel-title" style="margin-top:8px">
      <span>🤝 社交关系</span>
    </div>
    <div v-if="store.data.主角.社交关系.length > 0" class="relation-list">
      <div v-for="rel in store.data.主角.社交关系" :key="rel.姓名" class="relation-item">
        <span class="rel-name">{{ rel.姓名 }}</span>
        <span class="rel-role">{{ rel.关系 }}</span>
        <span class="rel-favor" :style="{ color: favorColor(rel.好感) }">{{ rel.好感 }}/100</span>
        <span class="rel-desc">{{ rel.描述 }}</span>
      </div>
    </div>

    <!-- 当前任务 -->
    <div v-if="store.data.世界.当前任务.length > 0" class="panel-title" style="margin-top:8px">
      <span>📋 当前任务</span>
    </div>
    <div v-if="store.data.世界.当前任务.length > 0" class="task-list">
      <div v-for="(task, i) in store.data.世界.当前任务" :key="i" class="task-item">
        <span class="task-title">{{ task.标题 }}</span>
        <span class="task-goal">{{ task.目标 }}</span>
      </div>
    </div>

    <!-- 主要线索 -->
    <div v-if="store.data.世界.主要线索" class="info-line">
      <span class="info-label">🔍 线索:</span>
      <span class="info-text">{{ store.data.世界.主要线索 }}</span>
    </div>

    <!-- 附近重要人物 -->
    <div v-if="store.data.附近重要人物.length > 0" class="panel-title" style="margin-top:8px">
      <span>📍 附近人物</span>
    </div>
    <div v-if="store.data.附近重要人物.length > 0" class="nearby-list">
      <div v-for="(p, i) in store.data.附近重要人物" :key="i" class="nearby-item">
        <span class="nearby-name">{{ p.姓名 }}</span>
        <span class="nearby-status">{{ p.状态 }}</span>
      </div>
    </div>

    <!-- 当前互动对象 -->
    <div v-if="store.data.当前互动对象.姓名" class="panel-title" style="margin-top:8px">
      <span>👾 互动对象: {{ store.data.当前互动对象.姓名 }}</span>
    </div>
    <div v-if="store.data.当前互动对象.姓名" class="npc-card">
      <div class="npc-meta">
        <span>{{ store.data.当前互动对象.阵营 }} · {{ store.data.当前互动对象.种族 }} · Lv.{{ store.data.当前互动对象.等级 }}</span>
        <span>⚡ {{ store.data.当前互动对象.战斗力 }}</span>
      </div>
      <div class="npc-hp-row">
        <span class="stat-label">❤️ HP</span>
        <div class="progress-bar">
          <div class="fill" :style="{ width: npcHpPercent + '%', background: 'var(--c-crimson-bright)' }"></div>
          <span class="label">{{ store.data.当前互动对象.生命值 }}/{{ store.data.当前互动对象.最大生命值 }}</span>
        </div>
      </div>
      <div class="npc-details">
        <div><span class="info-label">好感度:</span> {{ store.data.当前互动对象.好感度 }}/100 <span class="stage-tag" :class="favorStageClass">{{ store.data.当前互动对象.$好感阶段 }}</span></div>
        <div><span class="info-label">恶堕:</span> {{ store.data.当前互动对象.恶堕程度 || '未记录' }}</div>
        <div><span class="info-label">想法:</span> {{ store.data.当前互动对象.想法 }}</div>
      </div>
      <div class="adj-group" style="margin-top:4px">
        <button class="btn btn-xs" @click="adjNpcHp(-5)">HP−5</button>
        <button class="btn btn-xs" @click="adjNpcHp(5)">HP+5</button>
        <button class="btn btn-xs" @click="adjNpcFavor(-5)">好感−5</button>
        <button class="btn btn-xs" @click="adjNpcFavor(5)">好感+5</button>
      </div>
    </div>

    <!-- 不为人知的事件 -->
    <div v-if="store.data.世界.不为人知的事件" class="info-line" style="margin-top:6px">
      <span class="info-label">🌑 秘事:</span>
      <span class="info-text" style="color:var(--c-text-muted);font-style:italic">{{ store.data.世界.不为人知的事件 }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../store';

const store = useDataStore();

// ── 计算属性 ──
const hpPercent = computed(() =>
  Math.round((store.data.主角.生命值 / Math.max(1, store.data.主角.最大生命值)) * 100)
);
const expPercent = computed(() =>
  Math.round((store.data.主角.经验值 / Math.max(1, store.data.主角.下一级经验)) * 100)
);
const npcHpPercent = computed(() =>
  Math.round((store.data.当前互动对象.生命值 / Math.max(1, store.data.当前互动对象.最大生命值)) * 100)
);

const hpColor = computed(() => {
  const p = hpPercent.value;
  if (p > 60) return 'var(--c-hp-green)';
  if (p > 30) return '#eab308';
  return 'var(--c-corruption)';
});
const erosionColor = computed(() => {
  const v = store.data.世界.侵蚀度;
  if (v < 30) return 'linear-gradient(90deg, #3b82f6, #6366f1)';
  if (v < 60) return 'linear-gradient(90deg, #6366f1, #a855f7)';
  return 'linear-gradient(90deg, #a855f7, #dc2626)';
});
const corruptionColor = computed(() => {
  const v = store.data.主角.恶堕值;
  if (v < 30) return 'var(--c-exp-blue)';
  if (v < 60) return 'var(--c-purple)';
  return 'var(--c-corruption)';
});
const femColor = computed(() => {
  const v = store.data.主角.雌堕值;
  if (v < 30) return '#f472b6';
  if (v < 60) return '#ec4899';
  return '#be185d';
});

function favorColor(v: number) {
  if (v < 30) return 'var(--c-corruption)';
  if (v < 60) return '#eab308';
  return 'var(--c-hp-green)';
}

// ── 调整函数 ──
function adjustHP(delta: number) {
  const newVal = store.data.主角.生命值 + delta;
  store.data.主角.生命值 = Math.max(0, Math.min(newVal, store.data.主角.最大生命值));
}
function adjustExp(delta: number) {
  const newVal = store.data.主角.经验值 + delta;
  const next = store.data.主角.下一级经验;
  if (newVal >= next) {
    store.data.主角.等级 += 1;
    store.data.主角.经验值 = newVal - next;
    store.data.主角.下一级经验 = Math.round(next * 1.2);
    store.data.主角.最大生命值 += 10;
    store.data.主角.生命值 = store.data.主角.最大生命值;
    store.data.主角.战斗力 = Math.round(store.data.主角.战斗力 * 1.1);
    toastr.success(`🎉 升级！当前等级 Lv.${store.data.主角.等级}`);
  } else {
    store.data.主角.经验值 = newVal;
  }
}
function adjustCombat(delta: number) {
  store.data.主角.战斗力 = Math.max(0, store.data.主角.战斗力 + delta);
}
function adjustMoney(delta: number) {
  store.data.主角.金钱 = Math.max(0, store.data.主角.金钱 + delta);
}
function adjustCorruption(delta: number) {
  store.data.主角.恶堕值 = Math.max(0, Math.min(100, store.data.主角.恶堕值 + delta));
}
function adjustFem(delta: number) {
  store.data.主角.雌堕值 = Math.max(0, Math.min(100, store.data.主角.雌堕值 + delta));
}
function adjNpcHp(delta: number) {
  const newVal = store.data.当前互动对象.生命值 + delta;
  store.data.当前互动对象.生命值 = Math.max(0, Math.min(newVal, store.data.当前互动对象.最大生命值));
}
function adjNpcFavor(delta: number) {
  const newVal = store.data.当前互动对象.好感度 + delta;
  store.data.当前互动对象.好感度 = Math.max(0, Math.min(100, newVal));
}

// ── 阶段样式 ──
const erosionStageClass = computed(() => {
  const s = store.data.世界.$侵蚀阶段;
  if (s === '轻度腐化') return 'stage-mild';
  if (s === '中度腐化') return 'stage-moderate';
  if (s === '重度腐化') return 'stage-severe';
  return 'stage-critical';
});
const corruptionStageClass = computed(() => {
  const s = store.data.主角.$恶堕阶段;
  if (s === '纯洁期' || s === '潜伏期') return 'stage-mild';
  if (s === '觉醒期' || s === '显性期') return 'stage-moderate';
  return 'stage-critical';
});
const femStageClass = computed(() => {
  const s = store.data.主角.$雌堕阶段;
  if (s === '无感期' || s === '萌芽期') return 'stage-mild';
  if (s === '发育期' || s === '接受期') return 'stage-moderate';
  return 'stage-critical';
});
const favorStageClass = computed(() => {
  const s = store.data.当前互动对象.$好感阶段;
  if (s === '陌生') return 'stage-mild';
  if (s === '认识' || s === '友好') return 'stage-moderate';
  return 'stage-good';
});
</script>

<style lang="scss" scoped>
.meta-bar {
  display: flex;
  justify-content: space-between;
  padding: 4px 0 8px;
  font-size: 11px;
  color: var(--c-text-secondary);
  border-bottom: 1px dashed var(--c-border);
  margin-bottom: 8px;
  gap: 8px;
  flex-wrap: wrap;
}
.meta-icon { margin-right: 4px; }

.corruption-bar { margin-bottom: 8px; }
.corruption-bar .progress-bar { height: 16px; }

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.stat-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.stat-label {
  min-width: 44px;
  font-size: 12px;
  color: var(--c-text-secondary);
  white-space: nowrap;
}
.stat-value {
  font-weight: bold;
  font-size: 14px;
  color: var(--c-gold);
  min-width: 40px;
}
.stat-row .progress-bar {
  flex: 1;
  height: 14px;
}

.status-tags {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.tag {
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 3px;
  font-weight: bold;
}
.tag-temp {
  background: rgba(234, 179, 8, 0.2);
  border: 1px solid #eab308;
  color: #eab308;
}
.tag-perm {
  background: rgba(168, 85, 247, 0.2);
  border: 1px solid var(--c-purple);
  color: var(--c-purple);
}

.info-line {
  display: flex;
  gap: 6px;
  padding: 4px 6px;
  background: rgba(0,0,0,0.15);
  border-left: 3px solid var(--c-border-bright);
  margin-top: 4px;
  font-size: 12px;
}
.info-label {
  font-weight: bold;
  color: var(--c-gold);
  white-space: nowrap;
}
.info-text {
  color: var(--c-text-secondary);
}

.relation-list, .nearby-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.relation-item, .nearby-item {
  display: flex;
  gap: 8px;
  padding: 3px 6px;
  background: rgba(0,0,0,0.15);
  border-left: 3px solid var(--c-purple);
  font-size: 12px;
  align-items: center;
}
.rel-name, .nearby-name {
  font-weight: bold;
  color: var(--c-gold);
  white-space: nowrap;
}
.rel-role {
  color: var(--c-border-bright);
  font-size: 11px;
}
.rel-favor {
  font-weight: bold;
  font-size: 12px;
}
.rel-desc, .nearby-status {
  color: var(--c-text-secondary);
  flex: 1;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.task-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 6px;
  background: rgba(0,0,0,0.15);
  border-left: 3px solid var(--c-gold-dim);
  font-size: 12px;
}
.task-title {
  font-weight: bold;
  color: var(--c-gold);
}
.task-goal {
  color: var(--c-text-secondary);
  font-size: 11px;
}

.npc-card {
  background: rgba(34, 197, 94, 0.05);
  border: 1px solid rgba(34, 197, 94, 0.3);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.npc-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--c-text-secondary);
}
.npc-hp-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.npc-hp-row .progress-bar {
  flex: 1;
  height: 12px;
}
.npc-details {
  font-size: 11px;
  color: var(--c-text-secondary);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* ── 阶段标签样式 ── */
.stage-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 2px;
  font-weight: bold;
}
.stage-mild {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  border: 1px solid #22c55e;
}
.stage-moderate {
  background: rgba(234, 179, 8, 0.2);
  color: #eab308;
  border: 1px solid #eab308;
}
.stage-severe {
  background: rgba(168, 85, 247, 0.2);
  color: #c084fc;
  border: 1px solid #a855f7;
}
.stage-critical {
  background: rgba(220, 38, 38, 0.2);
  color: #f87171;
  border: 1px solid #dc2626;
}
.stage-good {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  border: 1px solid #22c55e;
}
.stage-tag {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 2px;
  font-weight: bold;
  white-space: nowrap;
}
</style>