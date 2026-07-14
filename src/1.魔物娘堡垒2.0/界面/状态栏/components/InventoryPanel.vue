<template>
  <div class="panel">
    <div class="panel-title">
      <span>🎒 背包</span>
      <span class="badge">{{ itemCount }} 件</span>
    </div>

    <div v-if="!_.isEmpty(store.data.主角.物品栏)" class="inventory-list">
      <div v-for="(item, name) in store.data.主角.物品栏" :key="name" class="inv-item">
        <div class="inv-icon">{{ getIcon(name as string) }}</div>
        <div class="inv-info">
          <span class="inv-name">{{ name }}</span>
          <span class="inv-desc">{{ item.描述 }}</span>
        </div>
        <span class="inv-count">x{{ item.数量 }}</span>
        <div class="inv-actions">
          <button class="btn btn-xs" @click="adjustItem(name as string, 1)">+1</button>
          <button class="btn btn-xs" @click="adjustItem(name as string, -1)">−1</button>
          <button class="btn btn-xs btn-danger" @click="removeItem(name as string)">×</button>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
      🕸️ 背包空空如也...
    </div>

    <!-- 添加物品 -->
    <div class="add-section">
      <div v-if="showAdd" class="add-form">
        <input v-model="newName" class="input" placeholder="物品名" @keydown.enter="confirmAdd" />
        <input v-model="newDesc" class="input" placeholder="描述" @keydown.enter="confirmAdd" />
        <input v-model.number="newQty" class="input input-num" type="number" min="1" placeholder="数量" />
        <button class="btn btn-sm btn-primary" @click="confirmAdd">添加</button>
        <button class="btn btn-sm" @click="showAdd = false">取消</button>
      </div>
      <button v-else class="btn btn-sm" @click="openAdd">+ 添加物品</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { useDataStore } from '../store';

const store = useDataStore();

const itemCount = computed(() => _.size(store.data.主角.物品栏));
const showAdd = ref(false);
const newName = ref('');
const newDesc = ref('');
const newQty = ref(1);

function getIcon(name: string): string {
  if (name.includes('药') || name.includes('剂')) return '🧪';
  if (name.includes('武器') || name.includes('剑') || name.includes('刀')) return '⚔️';
  if (name.includes('防具') || name.includes('甲') || name.includes('盾')) return '🛡️';
  if (name.includes('书') || name.includes('卷') || name.includes('图')) return '📜';
  if (name.includes('钥匙') || name.includes('钥')) return '🔑';
  if (name.includes('钱') || name.includes('币') || name.includes('金')) return '💰';
  if (name.includes('药水') || name.includes('圣') || name.includes('净')) return '✨';
  if (name.includes('魔') || name.includes('暗') || name.includes('堕')) return '💀';
  return '📦';
}

function adjustItem(name: string, delta: number) {
  const item = store.data.主角.物品栏[name];
  if (!item) return;
  const newQty = item.数量 + delta;
  if (newQty <= 0) {
    delete store.data.主角.物品栏[name];
  } else {
    item.数量 = newQty;
  }
}

function removeItem(name: string) {
  delete store.data.主角.物品栏[name];
}

function openAdd() {
  showAdd.value = true;
  newName.value = '';
  newDesc.value = '';
  newQty.value = 1;
}

function confirmAdd() {
  const name = newName.value.trim();
  if (!name) return;
  if (store.data.主角.物品栏[name]) {
    store.data.主角.物品栏[name].数量 += newQty.value;
  } else {
    store.data.主角.物品栏[name] = { 描述: newDesc.value.trim() || '未知物品', 数量: newQty.value };
  }
  showAdd.value = false;
}
</script>

<style lang="scss" scoped>
.inventory-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.inv-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(0,0,0,0.15);
  border: 1px solid var(--c-border);
  border-radius: 3px;
  transition: border-color 0.2s;
}
.inv-item:hover { border-color: var(--c-border-bright); }
.inv-icon {
  font-size: 18px;
  width: 28px;
  text-align: center;
}
.inv-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.inv-name {
  font-weight: bold;
  font-size: 12px;
}
.inv-desc {
  font-size: 10px;
  color: var(--c-text-secondary);
}
.inv-count {
  font-size: 12px;
  font-weight: bold;
  color: var(--c-gold);
  min-width: 30px;
  text-align: center;
}
.inv-actions {
  display: flex;
  gap: 3px;
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: var(--c-text-muted);
  font-size: 13px;
}

.add-section {
  margin-top: 8px;
}
.add-form {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.input {
  flex: 1;
  min-width: 80px;
  padding: 4px 8px;
  background: var(--c-bg-dark);
  border: 1px solid var(--c-border);
  color: var(--c-text-primary);
  font-family: var(--font-body);
  font-size: 12px;
  outline: none;
}
.input:focus { border-color: var(--c-border-bright); }
.input-num { max-width: 60px; }
</style>