<template>
  <div class="info">
    <div class="info-avatar" :style="{ '--c': charColor }">
      <span class="info-avatar-text">{{ charIcon }}</span>
    </div>

    <div class="info-header">
      <span class="info-charname" :style="{ color: charColor }">{{ charLabel }}</span>
      <span class="info-subname" v-if="charData?.里称">「{{ charData.里称 }}」</span>
    </div>

    <!-- 字段列表 -->
    <div class="info-fields">
      <!-- 地点 -->
      <div class="info-row">
        <span class="info-label">📍 地点</span>
        <span class="info-value">{{ charData?.地点 ?? '--' }}</span>
      </div>

      <!-- 女性角色专属字段 -->
      <template v-if="isFemale">
        <div class="info-row">
          <span class="info-label">对我</span>
          <span class="info-value">{{ charData?.['对user的看法'] ?? '--' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">对士郎</span>
          <span class="info-value">{{ charData?.['对士郎的看法'] ?? '--' }}</span>
        </div>
      </template>

      <!-- 内心 -->
      <div class="info-row info-inner">
        <span class="info-label">💭 内心</span>
        <span class="info-value">{{ charData?.内心 ?? '--' }}</span>
      </div>

      <!-- 穿搭 -->
      <div class="info-row">
        <span class="info-label">👗 穿搭</span>
        <span class="info-value">{{ charData?.穿搭 ?? '--' }}</span>
      </div>

      <!-- 女性角色 NSFW 字段 -->
      <template v-if="isFemale">
        <div class="info-row">
          <span class="info-label">体位</span>
          <span class="info-value">{{ charData?.体位 ?? '--' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">🌸 小穴</span>
          <span class="info-value">{{ charData?.小穴 ?? '--' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">🍒 胸部</span>
          <span class="info-value">{{ charData?.胸部 ?? '--' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">🍑 肛门</span>
          <span class="info-value">{{ charData?.肛门 ?? '--' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">接精</span>
          <span class="info-value">{{ charData?.['接受精液ml'] ?? '--' }}</span>
        </div>
      </template>

      <!-- 士郎专属 -->
      <template v-if="charId === '士郎'">
        <div class="info-row">
          <span class="info-label">🍆 阳具</span>
          <span class="info-value">{{ charData?.阳具 ?? '--' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">见伊莉雅</span>
          <span class="info-value">{{ charData?.['见伊莉雅'] ?? '--' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">见美游</span>
          <span class="info-value">{{ charData?.['见美游'] ?? '--' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">见小黑</span>
          <span class="info-value">{{ charData?.['见小黑'] ?? '--' }}</span>
        </div>
      </template>

      <!-- user 专属 -->
      <template v-if="charId === 'user'">
        <div class="info-row">
          <span class="info-label">🍆 阳具</span>
          <span class="info-value">{{ charData?.阳具 ?? '--' }}</span>
        </div>
      </template>

      <!-- 最近性行为（所有人共通） -->
      <div class="info-row">
        <span class="info-label">💏 最近</span>
        <span class="info-value">{{ charData?.['最近性行为'] ?? '--' }}</span>
      </div>
    </div>

    <!-- 性格标签 -->
    <div class="info-tags" v-if="personalityTags.length > 0">
      <span class="info-tags-title">✦ 性格</span>
      <div class="info-tags-list">
        <span
          v-for="tag in personalityTags"
          :key="tag"
          class="info-tag"
          :style="{ '--tag-color': charColor }"
        >
          {{ tag }}
        </span>
      </div>
    </div>

    <!-- 核心属性 -->
    <CoreStats :charData="charData" :charId="charId" />

    <!-- 开发记录进度 -->
    <DevProgress :devRecords="charData?.开发记录" :charColor="charColor" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PERSONALITY_TAGS, useGameStore } from '../脚本/store'
import CoreStats from './CoreStats.vue'
import DevProgress from './DevProgress.vue'

const store = useGameStore()

const props = defineProps<{
  charData: Record<string, any>
  charId: string
  charLabel: string
  charIcon: string
  charColor: string
}>()

const isFemale = computed(() => ['伊莉雅', '美游', '小黑'].includes(props.charId))

const personalityTags = computed(() => {
  return PERSONALITY_TAGS[props.charId] ?? []
})
</script>

<style scoped>
.info {
  padding: 12px;
  flex: 1;
  overflow-y: auto;
}

/* ── 性格标签 ── */
.info-tags {
  margin-bottom: 12px;
  padding: 6px 10px;
  background: rgba(212, 65, 142, 0.02);
  border-radius: 12px;
  border: 1px solid rgba(212, 65, 142, 0.08);
}

.info-tags-title {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-label);
  letter-spacing: 1px;
  display: block;
  margin-bottom: 5px;
}

.info-tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.info-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
  background: color-mix(in srgb, var(--tag-color) 10%, transparent);
  color: var(--tag-color, var(--c-illya));
  border: 1px solid color-mix(in srgb, var(--tag-color) 20%, transparent);
  white-space: nowrap;
  font-family: var(--font-body);
}

.info-avatar {
  width: 80px; height: 80px;
  border-radius: 50%;
  margin: 0 auto 10px;
  display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--c) 15%, transparent);
  border: 2px solid color-mix(in srgb, var(--c) 40%, transparent);
  font-size: 2.2rem;
}

.info-header {
  text-align: center;
  margin-bottom: 12px;
}
.info-charname {
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 1px;
}
.info-subname {
  display: block;
  font-size: 10px;
  color: var(--text-label);
  font-style: italic;
  margin-top: 2px;
  letter-spacing: 0.5px;
}

/* ── 字段列表 ── */
.info-fields {
  margin-bottom: 12px;
  background: rgba(212, 65, 142, 0.02);
  border-radius: 12px;
  padding: 4px 10px;
  border: 1px solid rgba(212, 65, 142, 0.08);
}

.info-row {
  display: flex;
  gap: 8px;
  padding: 5px 0;
  font-size: 12px;
  border-bottom: 1px solid rgba(0,0,0,0.03);
}
.info-row:last-child {
  border-bottom: none;
}

.info-label {
  white-space: nowrap;
  flex-shrink: 0;
  color: var(--text-label);
  font-weight: 600;
  min-width: 48px;
}
.info-value {
  flex: 1;
  word-break: break-word;
  line-height: 1.4;
}
.info-inner .info-value {
  font-style: italic;
  color: var(--text-secondary);
}
</style>