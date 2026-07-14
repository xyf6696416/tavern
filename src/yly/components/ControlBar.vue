<template>
  <div class="bar">
    <ModeTabs :current="store.currentMode" @switch="store.setMode" />
    <div v-if="store.currentMode === 'options'" class="bar-content">
      <PlotBias :bias="store.plotBias" @toggle="store.toggleBias" @reset="store.resetBias" />
      <ChoicePanel :choices="store.choices" @select="store.selectChoice" />
      <UserInput @send="store.sendCustomInput" />
    </div>
    <div v-else-if="store.currentMode === 'move'" class="bar-content">
      <LocationNav :areas="store.areas" @move="store.moveTo" />
    </div>
    <div v-else class="bar-content bar-tools">
      <button class="tool-btn" @click="store.saveToTavern">
        <IllyaIcon name="save" :size="16" color="#C71585" /> 保存
      </button>
      <button class="tool-btn" @click="store.resetBias">
        <IllyaIcon name="reset" :size="16" color="#D4459A" /> 重置
      </button>
      <button class="tool-btn" @click="$emit('openBodyStatus')">
        <IllyaIcon name="body-status" :size="16" color="#6BB8D4" /> 状态
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '../脚本/store'
import ChoicePanel from './ChoicePanel.vue'
import IllyaIcon from './IllyaIcon.vue'
import LocationNav from './LocationNav.vue'
import ModeTabs from './ModeTabs.vue'
import PlotBias from './PlotBias.vue'
import UserInput from './UserInput.vue'

const store = useGameStore()

defineEmits<{
  openBodyStatus: []
}>()
</script>

<style scoped>
.bar { border-top: 1px solid var(--gold-dim); background: var(--bg-card); backdrop-filter: blur(8px); }
.bar-content { padding: 6px 10px; max-height: 200px; overflow-y: auto; }
.bar-tools { display: flex; gap: 6px; flex-wrap: wrap; padding: 8px 10px; }
.tool-btn { padding: 8px 18px; border-radius: 20px; border: 1.5px solid var(--gold-dim); background: rgba(255,255,255,0.6); color: var(--text-body); font-size: 12px; cursor: pointer; font-family: inherit; transition: all 0.2s; min-height: 36px; }
.tool-btn:hover { background: var(--gold); border-color: var(--gold); color: #8B0060; }
@media (max-width: 768px) { .bar-content { padding: 8px 12px; max-height: 260px; } .tool-btn { flex: 1; text-align: center; min-height: 40px; font-size: 13px; } }
</style>