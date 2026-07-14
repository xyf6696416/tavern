<template>
  <div class="side">
    <CharacterTabs
      :charIds="store.charIds"
      :currentId="store.currentCharId"
      @switch="store.switchCharacter"
    />
    <CharacterInfo
      v-if="store.ready && store.currentChar"
      :charData="store.currentChar"
      :charId="store.currentCharId"
      :charLabel="store.currentCharLabel"
      :charIcon="store.currentCharIcon"
      :charColor="store.currentCharColor"
    />
    <div v-else class="side-empty">
      <p>✦ 加载中...</p>
    </div>
    <div class="side-actions">
      <button class="side-action-btn" @click="$emit('openBodyStatus')">
        <IllyaIcon name="body-status" :size="16" color="var(--c-illya)" /> 身体状态
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '../脚本/store';
import CharacterInfo from './CharacterInfo.vue';
import CharacterTabs from './CharacterTabs.vue';
import IllyaIcon from './IllyaIcon.vue';

defineEmits<{
  openBodyStatus: []
}>()

const store = useGameStore()
</script>

<style scoped lang="scss">
.side {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border-right: var(--border-prism);
  overflow-y: auto;
}
.side-empty {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-label);
  font-size: 0.95rem;
}
.side-actions {
  margin-top: auto;
  padding: 8px 10px;
  border-top: 1px solid rgba(212, 65, 142, 0.15);
}
.side-action-btn {
  width: 100%;
  padding: 6px 12px;
  border-radius: 16px;
  border: 1px solid rgba(212, 65, 142, 0.15);
  background: rgba(255,255,255,0.6);
  color: var(--text-body);
  font-size: 11px;
  cursor: pointer;
  font-family: var(--font-body);
  transition: all 0.2s;
  text-align: center;
  letter-spacing: 0.3px;
}
.side-action-btn:hover {
  background: color-mix(in srgb, var(--c-illya) 8%, transparent);
  border-color: var(--c-illya);
}
</style>