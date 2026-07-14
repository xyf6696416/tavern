<template>
  <div class="panel">
    <div class="panel-title">
      <span>🗺️ 诺亚之城 · 区域一览</span>
      <span class="badge">{{ unlockedCount }}/{{ allLocations.length }} 已解锁</span>
    </div>

    <!-- 快速传送 -->
    <div class="teleport-hint" v-if="store.data.世界.当前地点 !== '诺亚之心广场'">
      <span>📍 当前位于 <strong>{{ store.data.世界.当前地点 }}</strong></span>
      <button class="btn btn-sm btn-gold" @click="teleportTo('诺亚之心广场')">↩ 返回广场</button>
    </div>

    <!-- 地点网格 -->
    <div class="location-grid">
      <div
        v-for="loc in sortedLocations" :key="loc.name"
        class="location-card"
        :class="{ locked: !loc.unlocked, active: loc.name === store.data.世界.当前地点 }"
      >
        <div class="loc-header">
          <span class="loc-icon">{{ loc.unlocked ? (loc.name === store.data.世界.当前地点 ? '📍' : '🔓') : '🔒' }}</span>
          <span class="loc-name">{{ loc.name }}</span>
          <span class="loc-tag" :class="loc.tagClass">{{ loc.tag }}</span>
        </div>

        <div v-if="loc.unlocked" class="loc-details">
          <div class="loc-progress">
            <span class="loc-progress-label">探索</span>
            <div class="progress-bar loc-bar">
              <div class="fill" :style="{ width: loc.exploration + '%', background: 'var(--c-exp-blue)' }"></div>
              <span class="label">{{ loc.exploration }}%</span>
            </div>
          </div>
          <div class="loc-progress">
            <span class="loc-progress-label">恶堕</span>
            <div class="progress-bar loc-bar">
              <div class="fill" :style="{ width: loc.corruption + '%', background: 'var(--c-corruption)' }"></div>
              <span class="label">{{ loc.corruption }}%</span>
            </div>
          </div>
          <div v-if="loc.note" class="loc-note">{{ loc.note }}</div>
        </div>
        <div v-else class="loc-locked-msg">未解锁 — 通过剧情探索发现</div>

        <div class="loc-actions" v-if="loc.unlocked">
          <button class="btn btn-xs btn-primary" :disabled="loc.name === store.data.世界.当前地点" @click="teleportTo(loc.name)">
            传送
          </button>
          <button class="btn btn-xs" @click="adjustExploration(loc.name, 5)">探索+5</button>
          <button class="btn btn-xs btn-danger" @click="adjustCorruption(loc.name, 1)">恶堕+1</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../store';

const store = useDataStore();

const allLocations = [
  { name: '诺亚之心广场', tag: '安全区', tagClass: 'safe' },
  { name: '猎魔协会分部', tag: '安全区', tagClass: 'safe' },
  { name: '蒸汽动力集市', tag: '安全区', tagClass: 'safe' },
  { name: '智慧之所', tag: '安全区', tagClass: 'safe' },
  { name: '光明神殿', tag: '伪安全', tagClass: 'pseudo' },
  { name: '圣火训练场', tag: '伪安全', tagClass: 'pseudo' },
  { name: '迷失乐园', tag: '堕落节点', tagClass: 'danger' },
  { name: '温暖之家', tag: '堕落节点', tagClass: 'danger' },
  { name: '魅魔之巢', tag: '堕落节点', tagClass: 'danger' },
  { name: '欲望下水道', tag: '堕落节点', tagClass: 'danger' },
  { name: '堕落苗床', tag: '堕落节点', tagClass: 'danger' },
  { name: '诺亚医院', tag: '堕落节点', tagClass: 'danger' },
  { name: '红月酒吧', tag: '堕落节点', tagClass: 'danger' },
  { name: '月隐神社', tag: '堕落节点', tagClass: 'danger' },
  { name: '魔女之馆', tag: '堕落节点', tagClass: 'danger' },
  { name: '恶魔公馆', tag: '堕落节点', tagClass: 'danger' },
  { name: '丰饶牧场', tag: '堕落节点', tagClass: 'danger' },
  { name: '诺亚幼儿园', tag: '堕落节点', tagClass: 'danger' },
  { name: '崩坏实验室', tag: '堕落节点', tagClass: 'danger' },
  { name: '极乐身体工坊', tag: '堕落节点', tagClass: 'danger' },
  { name: '堕落虫窟', tag: '堕落节点', tagClass: 'danger' },
  { name: '遗忘记忆博物馆', tag: '堕落节点', tagClass: 'danger' },
  { name: '秘密服装店', tag: '堕落节点', tagClass: 'danger' },
  { name: '虚空虫洞', tag: '随机裂隙', tagClass: 'special' },
];

const sortedLocations = computed(() => {
  const states = store.data.地点状态;
  return allLocations.map(loc => {
    const st = states[loc.name];
    return {
      ...loc,
      unlocked: st?.已解锁 ?? (loc.name === '诺亚之心广场'),
      exploration: st?.探索度 ?? 0,
      corruption: st?.恶堕进度 ?? 0,
      note: st?.备注 ?? '',
    };
  });
});

const unlockedCount = computed(() => sortedLocations.value.filter(l => l.unlocked).length);

function teleportTo(name: string) {
  if (name === store.data.世界.当前地点) return;
  const oldLoc = store.data.世界.当前地点;
  store.data.世界.当前地点 = name;
  writeToInput(`[换区] 从 ${oldLoc} 传送到 ${name}`);
}

function adjustExploration(loc: string, delta: number) {
  const st = store.data.地点状态[loc];
  if (!st) {
    store.data.地点状态[loc] = { 已解锁: true, 探索度: delta, 恶堕进度: 0, 备注: '' };
  } else {
    st.探索度 = Math.min(100, Math.max(0, st.探索度 + delta));
  }
}
function adjustCorruption(loc: string, delta: number) {
  const st = store.data.地点状态[loc];
  if (!st) return;
  st.恶堕进度 = Math.min(100, Math.max(0, st.恶堕进度 + delta));
}

function writeToInput(text: string) {
  const $textarea = $('#tavern_send_input, #send_textarea, textarea.send_textarea').first();
  if ($textarea.length) {
    $textarea.val(text).trigger('input');
  }
  store.data.战斗._待发送结果 = text;
}
</script>

<style lang="scss" scoped>
.teleport-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  margin-bottom: 8px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  font-size: 12px;
  border-radius: 3px;
}
.teleport-hint strong { color: var(--c-gold); }

.location-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 6px;
}

.location-card {
  background: var(--c-bg-elevated);
  border: 1px solid var(--c-border);
  padding: 8px;
  transition: all 0.2s;
}
.location-card:hover { border-color: var(--c-border-bright); }
.location-card.active {
  border-color: var(--c-gold);
  box-shadow: 0 0 8px rgba(212, 168, 67, 0.2);
}
.location-card.locked {
  opacity: 0.5;
  filter: grayscale(0.6);
}

.loc-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.loc-icon { font-size: 14px; }
.loc-name { font-weight: bold; font-size: 12px; flex: 1; }
.loc-tag { font-size: 9px; padding: 1px 5px; border-radius: 2px; font-weight: bold; }
.loc-tag.safe { background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid #22c55e; }
.loc-tag.pseudo { background: rgba(234, 179, 8, 0.2); color: #eab308; border: 1px solid #eab308; }
.loc-tag.danger { background: rgba(220, 38, 38, 0.2); color: #f87171; border: 1px solid #dc2626; }
.loc-tag.special { background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid #a855f7; }

.loc-details { display: flex; flex-direction: column; gap: 4px; margin-bottom: 6px; }
.loc-progress { display: flex; align-items: center; gap: 4px; }
.loc-progress-label { font-size: 10px; color: var(--c-text-muted); min-width: 24px; }
.loc-bar { height: 10px; }
.loc-note { font-size: 10px; color: var(--c-text-secondary); font-style: italic; margin-top: 2px; }
.loc-locked-msg { font-size: 10px; color: var(--c-text-muted); font-style: italic; padding: 4px 0; margin-bottom: 4px; }
.loc-actions { display: flex; gap: 4px; flex-wrap: wrap; }
</style>