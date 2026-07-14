<template>
  <div class="panel">
    <div class="panel-title">
      <span>👤 人物关系</span>
      <span class="badge">{{ store.data.世界.当前地点 }}</span>
    </div>

    <!-- 附近重要人物（列表） -->
    <div v-if="store.data.附近重要人物.length > 0" class="section">
      <div class="section-subtitle">📍 附近人物</div>
      <div class="nearby-list">
        <div v-for="(p, i) in store.data.附近重要人物" :key="i" class="nearby-item">
          <span class="nearby-name">{{ p.姓名 }}</span>
          <span class="nearby-status">{{ p.状态 }}</span>
          <button class="btn btn-xs" @click="setAsInteract(p.姓名)">👾 互动</button>
        </div>
      </div>
    </div>
    <div v-else class="empty-section">
      <div class="section-subtitle">📍 附近人物</div>
      <div class="empty-state">当前区域没有记录附近人物</div>
    </div>

    <!-- 当前互动对象 -->
    <div v-if="store.data.当前互动对象.姓名" class="section">
      <div class="section-subtitle">👾 当前互动: {{ store.data.当前互动对象.姓名 }}</div>
      <div class="interact-card">
        <div class="int-grid">
          <div><span class="int-label">阵营</span> {{ store.data.当前互动对象.阵营 }}</div>
          <div><span class="int-label">种族</span> {{ store.data.当前互动对象.种族 }}</div>
          <div><span class="int-label">性别</span> {{ store.data.当前互动对象.性别 }}</div>
          <div><span class="int-label">等级</span> {{ store.data.当前互动对象.等级 }}</div>
        </div>
        <div class="int-hp-row">
          <span class="int-label">❤️ HP</span>
          <div class="progress-bar">
            <div class="fill" :style="{ width: npcHpPct + '%', background: 'var(--c-crimson-bright)' }"></div>
            <span class="label">{{ store.data.当前互动对象.生命值 }}/{{ store.data.当前互动对象.最大生命值 }}</span>
          </div>
          <span class="int-val">⚡ {{ store.data.当前互动对象.战斗力 }}</span>
        </div>
        <div class="int-favor-row">
          <span class="int-label">💗 好感</span>
          <div class="progress-bar">
            <div class="fill" :style="{ width: store.data.当前互动对象.好感度 + '%', background: favorBarColor }"></div>
            <span class="label">{{ store.data.当前互动对象.好感度 }}/100</span>
          </div>
        </div>
        <div class="int-details">
          <div><span class="int-label">临时状态</span> {{ store.data.当前互动对象.临时状态 || '无' }}</div>
          <div><span class="int-label">永久状态</span> {{ store.data.当前互动对象.永久状态 || '无' }}</div>
          <div><span class="int-label">恶堕</span> {{ store.data.当前互动对象.恶堕程度 || '未记录' }}</div>
          <div><span class="int-label">形态</span> {{ store.data.当前互动对象.恶堕倾向形态 || '未知' }}</div>
          <div><span class="int-label">飞升</span> {{ store.data.当前互动对象.飞升 || '无' }}</div>
          <div><span class="int-label">想法</span> {{ store.data.当前互动对象.想法 || '...' }}</div>
        </div>
        <div class="int-actions">
          <button class="btn btn-xs" @click="adjNpcHp(-5)">HP−5</button>
          <button class="btn btn-xs" @click="adjNpcHp(5)">HP+5</button>
          <button class="btn btn-xs" @click="adjNpcFavor(-5)">好感−5</button>
          <button class="btn btn-xs" @click="adjNpcFavor(5)">好感+5</button>
          <button class="btn btn-xs btn-danger" @click="clearInteract">清除</button>
        </div>
      </div>
    </div>

    <!-- 社交关系 -->
    <div v-if="store.data.主角.社交关系.length > 0" class="section">
      <div class="section-subtitle">🤝 社交关系</div>
      <div class="relation-list">
        <div v-for="rel in store.data.主角.社交关系" :key="rel.姓名" class="relation-item">
          <span class="rel-name">{{ rel.姓名 }}</span>
          <span class="rel-role">{{ rel.关系 }}</span>
          <div class="progress-bar rel-bar">
            <div class="fill" :style="{ width: rel.好感 + '%', background: favorColor(rel.好感) }"></div>
            <span class="label">{{ rel.好感 }}/100</span>
          </div>
          <span class="rel-desc">{{ rel.描述 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../store';

const store = useDataStore();

const npcHpPct = computed(() =>
  Math.round((store.data.当前互动对象.生命值 / Math.max(1, store.data.当前互动对象.最大生命值)) * 100)
);
const favorBarColor = computed(() => {
  const v = store.data.当前互动对象.好感度;
  if (v < 30) return 'var(--c-corruption)';
  if (v < 60) return '#eab308';
  return 'var(--c-hp-green)';
});

function favorColor(v: number) {
  if (v < 30) return 'var(--c-corruption)';
  if (v < 60) return '#eab308';
  return 'var(--c-hp-green)';
}

function setAsInteract(name: string) {
  store.data.当前互动对象.姓名 = name;
  // 保留其他字段不变，只设置姓名
}

function adjNpcHp(delta: number) {
  const newVal = store.data.当前互动对象.生命值 + delta;
  store.data.当前互动对象.生命值 = Math.max(0, Math.min(newVal, store.data.当前互动对象.最大生命值));
}
function adjNpcFavor(delta: number) {
  const newVal = store.data.当前互动对象.好感度 + delta;
  store.data.当前互动对象.好感度 = Math.max(0, Math.min(100, newVal));
}
function clearInteract() {
  store.data.当前互动对象 = {
    姓名: '', 阵营: '中立', 种族: '', 性别: '', 等级: 1,
    生命值: 100, 最大生命值: 100, 战斗力: 10,
    临时状态: '', 永久状态: '', 好感度: 0,
    雌堕程度: '', 恶堕程度: '', 恶堕倾向形态: '', 飞升: '无',
    想法: '', 外貌描写: '',
  } as any;
}
</script>

<style lang="scss" scoped>
.section { margin-bottom: 10px; }
.section-subtitle {
  font-size: 11px;
  font-weight: bold;
  color: var(--c-text-secondary);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.empty-section { margin-bottom: 10px; }
.empty-state {
  text-align: center;
  padding: 12px;
  color: var(--c-text-muted);
  font-size: 12px;
  font-style: italic;
  border: 1px dashed var(--c-border);
}

.nearby-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.nearby-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  background: rgba(0,0,0,0.15);
  border-left: 3px solid var(--c-purple);
  font-size: 12px;
}
.nearby-name { font-weight: bold; color: var(--c-gold); white-space: nowrap; }
.nearby-status { color: var(--c-text-secondary); flex: 1; }

.interact-card {
  background: rgba(34, 197, 94, 0.05);
  border: 1px solid rgba(34, 197, 94, 0.3);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.int-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  font-size: 12px;
  color: var(--c-text-secondary);
}
.int-label {
  color: var(--c-text-muted);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-right: 4px;
}
.int-hp-row, .int-favor-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.int-hp-row .progress-bar, .int-favor-row .progress-bar { flex: 1; height: 12px; }
.int-val { font-weight: bold; font-size: 13px; color: var(--c-gold); min-width: 40px; }
.int-details {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 12px;
  color: var(--c-text-secondary);
}
.int-actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.relation-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.relation-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  background: rgba(0,0,0,0.15);
  border: 1px solid var(--c-border);
  font-size: 12px;
}
.rel-name { font-weight: bold; color: var(--c-gold); white-space: nowrap; min-width: 50px; }
.rel-role { color: var(--c-border-bright); font-size: 11px; min-width: 40px; }
.rel-bar { flex: 1; height: 10px; max-width: 120px; }
.rel-desc { color: var(--c-text-secondary); font-size: 11px; flex: 1; }
</style>