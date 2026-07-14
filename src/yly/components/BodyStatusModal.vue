<template>
  <div v-if="visible" class="bsm-overlay" @click.self="$emit('close')">
    <div class="bsm" :style="{ '--c': charColor }">
      <div class="bsm-header">
        <span class="bsm-name" :style="{ color: charColor }">{{ charLabel }}</span>
        <button class="bsm-close" @click="$emit('close')">✕</button>
      </div>
      <div class="bsm-body">
        <!-- 基本信息 -->
        <div class="bsm-section">
          <div class="bsm-section-title">✦ 基本信息</div>
          <div class="bsm-grid">
            <div class="bsm-field">
              <span class="bsm-label">📍 地点</span>
              <span class="bsm-val">{{ charData?.地点 ?? '--' }}</span>
            </div>
            <div class="bsm-field">
              <span class="bsm-label">💭 内心</span>
              <span class="bsm-val bsm-italic">{{ charData?.内心 ?? '--' }}</span>
            </div>
            <div class="bsm-field">
              <span class="bsm-label">👗 穿搭</span>
              <span class="bsm-val">{{ charData?.穿搭 ?? '--' }}</span>
            </div>
            <div class="bsm-field">
              <span class="bsm-label">💏 最近性行为</span>
              <span class="bsm-val">{{ charData?.['最近性行为'] ?? '--' }}</span>
            </div>
          </div>
        </div>

        <!-- 身体状态（仅女性角色） -->
        <div v-if="isFemale" class="bsm-section">
          <div class="bsm-section-title">✦ 身体状态</div>
          <div class="bsm-body-grid">
            <div v-for="part in bodyParts" :key="part.key" class="bsm-part-box">
              <span class="bsm-part-icon">{{ part.icon }}</span>
              <span class="bsm-part-label">{{ part.label }}</span>
              <span class="bsm-part-val">{{ getBodyField(part.key) }}</span>
            </div>
          </div>
          <div class="bsm-grid bsm-grid-3col" style="margin-top: 8px;">
            <div class="bsm-stat">
              <span class="bsm-stat-val">{{ charData?.体位 ?? '--' }}</span>
              <span class="bsm-stat-label">体位</span>
            </div>
            <div class="bsm-stat">
              <span class="bsm-stat-val">{{ getSemenVolume }}</span>
              <span class="bsm-stat-label">接受精液</span>
            </div>
            <div class="bsm-stat">
              <span class="bsm-stat-val">{{ charData?.['对user的看法'] ?? '--' }}</span>
              <span class="bsm-stat-label">对轻音</span>
            </div>
          </div>
        </div>

        <!-- 好感度 / 信任度 -->
        <div class="bsm-section">
          <div class="bsm-section-title">✦ 亲密关系</div>
          <div class="bsm-grid">
            <div v-for="c in CHARACTER_LIST" :key="c.id" class="bsm-field" :class="{ 'bsm-full': c.id === 'user' || c.id === '士郎' }">
              <span class="bsm-label">{{ c.label }}</span>
              <span class="bsm-val">{{ getIntimacyField(c.id) }}</span>
            </div>
          </div>
        </div>

        <!-- 开发进度 -->
        <div class="bsm-section">
          <div class="bsm-section-title">✦ 开发进度</div>
          <div v-if="devEntries.length > 0">
            <div v-for="e in devEntries" :key="e.part" class="bsm-dev-row">
              <span class="bsm-dev-part">{{ e.part }}</span>
              <span class="bsm-dev-bar-wrap">
                <span class="bsm-dev-bar" :style="{ width: e.pct + '%', background: devBarGradient(e.pct) }"></span>
              </span>
              <span class="bsm-dev-stage">{{ e.stage }}</span>
            </div>
          </div>
          <div v-else class="bsm-field">
            <span class="bsm-val bsm-italic">暂无记录</span>
          </div>
        </div>

        <!-- 士郎信任度 -->
        <div v-if="charId === '士郎'" class="bsm-section">
          <div class="bsm-section-title">✦ 士郎信任度</div>
          <div class="bsm-grid">
            <div v-for="f in trustFields" :key="f.label" class="bsm-field">
              <span class="bsm-label">{{ f.label }}</span>
              <span class="bsm-val">{{ f.value }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { devBarGradient } from '../../util/colors';
import { getDevStagePercent } from '../bridge/variables';
import { CHARACTER_LIST, DEV_STAGES } from '../脚本/store';

const props = defineProps<{
  visible: boolean
  charData: Record<string, any>
  charId: string
  charLabel: string
  charColor: string
}>()

defineEmits<{
  close: []
}>()

const isFemale = computed(() => ['伊莉雅', '美游', '小黑'].includes(props.charId))

/** 身体部位定义 */
const bodyParts = [
  { key: '小穴', label: '小穴', icon: '🌸' },
  { key: '胸部', label: '胸部', icon: '🍒' },
  { key: '肛门', label: '肛门', icon: '🍑' },
] as const

function getBodyField(key: string): string {
  return props.charData?.[key] ?? '--'
}

/** 接受精液量 */
const getSemenVolume = computed(() => props.charData?.['接受精液ml'] ?? '--')

/** 好感度字段映射 */
function getIntimacyField(id: string): string {
  if (id === 'user') {
    return props.charData?.['对user的看法'] ?? '--'
  }
  if (id === '士郎') {
    return props.charData?.['对士郎的看法'] ?? '--'
  }
  // 当前角色自己的好感度数值
  if (['伊莉雅', '美游', '小黑'].includes(id)) {
    // 如果当前角色和目标角色一致，显示好感度数值
    if (props.charId === id) {
      return props.charData?.['好感度'] !== undefined ? String(props.charData['好感度']) + '%' : '--'
    }
    // 跨角色不显示好感度（其他角色的好感度不在此展示）
    return '--'
  }
  return '--'
}

/** 开发条目 */
interface DevEntry {
  part: string
  stage: string
  pct: number
}

const devEntries = computed<DevEntry[]>(() => {
  const records = props.charData?.['开发记录']
  if (!records || typeof records !== 'object') return []
  return Object.entries(records)
    .filter(([_, v]) => {
      if (!v) return false
      const raw = typeof v === 'string' ? v : (v as any)['等级'] ?? ''
      return raw !== '待初始化' && raw !== ''
    })
    .map(([part, v]) => {
      const stageKey = typeof v === 'string' ? v : (v as any)['等级'] ?? '?'
      const pct = getDevStagePercent(stageKey)
      const stage = DEV_STAGES.find(s => s.key === stageKey)?.label ?? stageKey
      return { part, stage, pct }
    })
})

/** 士郎的三个信任度 */
const trustFields = computed(() => {
  if (props.charId !== '士郎' || !props.charData) return []
  return [
    { label: '对伊莉雅的信任度', value: props.charData['对伊莉雅的信任度'] ?? '--' },
    { label: '对美游的信任度', value: props.charData['对美游的信任度'] ?? '--' },
    { label: '对小黑的信任度', value: props.charData['对小黑的信任度'] ?? '--' },
  ]
})
</script>

<style scoped>
.bsm-overlay { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
.bsm { width: 500px; max-height: 85vh; background: #fff; border-radius: 24px; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); border: 1px solid var(--gold-dim); }
.bsm-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px 12px; border-bottom: 1px solid var(--gold-dim); position: sticky; top: 0; background: #fff; z-index: 1; }
.bsm-name { font-size: 1.2rem; font-weight: 700; letter-spacing: 1px; }
.bsm-close { width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--gold-dim); background: transparent; color: var(--text-label); font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; font-family: inherit; }
.bsm-close:hover { background: var(--c-illya); color: #fff; border-color: var(--c-illya); }
.bsm-body { padding: 16px 20px 20px; }
.bsm-section { margin-bottom: 16px; }
.bsm-section-title { font-size: 11px; font-weight: 700; color: var(--c-illya); letter-spacing: 1px; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,215,0,0.15); }
.bsm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.bsm-grid-3col { grid-template-columns: 1fr 1fr 1fr; }
.bsm-full { grid-column: 1 / -1; }
.bsm-field { display: flex; flex-direction: column; gap: 2px; padding: 6px 10px; background: rgba(255,215,0,0.03); border-radius: 8px; border: 1px solid rgba(255,215,0,0.06); }
.bsm-label { font-size: 10px; font-weight: 600; color: var(--text-label); letter-spacing: 0.5px; }
.bsm-val { font-size: 13px; color: var(--text-body); line-height: 1.4; }
.bsm-italic { font-style: italic; color: var(--text-secondary); }
.bsm-body-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.bsm-part-box { padding: 10px; border-radius: 12px; background: color-mix(in srgb, var(--c) 6%, transparent); border: 1px solid color-mix(in srgb, var(--c) 15%, transparent); text-align: center; }
.bsm-part-icon { font-size: 20px; display: block; margin-bottom: 4px; }
.bsm-part-label { font-size: 10px; font-weight: 600; color: var(--text-label); display: block; margin-bottom: 2px; }
.bsm-part-val { font-size: 11px; color: var(--text-body); display: block; line-height: 1.3; }
.bsm-stat { text-align: center; padding: 10px 6px; background: rgba(255,215,0,0.04); border-radius: 12px; border: 1px solid rgba(255,215,0,0.08); }
.bsm-stat-val { font-size: 14px; font-weight: 700; display: block; color: var(--c-illya); margin-bottom: 2px; }
.bsm-stat-label { font-size: 10px; color: var(--text-label); }
.bsm-dev-row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; font-size: 11px; }
.bsm-dev-part { min-width: 36px; font-weight: 600; font-size: 10px; }
.bsm-dev-bar-wrap { flex: 1; height: 8px; background: rgba(255,215,0,0.08); border-radius: 4px; overflow: hidden; border: 1px solid rgba(255,215,0,0.12); }
.bsm-dev-bar { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
.bsm-dev-stage { min-width: 48px; text-align: right; font-size: 10px; color: var(--text-label); }
.bsm-dev-note { font-size: 9px; color: var(--text-secondary); max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>