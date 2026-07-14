<template>
  <div class="match-card">
    <div class="match-avatar-row">
      <span class="match-avatar">{{ match.avatar || '👤' }}</span>
      <span v-if="match.vip" class="match-vip-badge">{{ match.vip }}</span>
    </div>
    <div class="match-info">
      <div class="match-name-row">
        <span class="match-nick">{{ match.nick }}</span>
        <span class="match-age">{{ match.age }}岁</span>
        <span class="match-level">{{ match.level }}</span>
      </div>
      <div class="match-detail">
        <span class="match-city">{{ match.city }}</span>
        <span class="match-dist">{{ match.dist }}</span>
        <span v-if="match.active" class="match-active">{{ match.active }}</span>
      </div>
      <div v-if="match.tags" class="match-tags">
        <span
          v-for="(tag, i) in tagList"
          :key="i"
          class="match-tag"
        >{{ tag }}</span>
      </div>
      <p class="match-bio">{{ match.bio }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Match } from '../types/mlife'

const props = defineProps<{
  match: Match
}>()

const tagList = computed(() => {
  return props.match.tags
    .split(/[,，、]/)
    .map(s => s.trim())
    .filter(Boolean)
})
</script>

<style scoped>
.match-card {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: var(--ml-bg-card);
  border-radius: 14px;
  box-shadow: 0 1px 4px var(--ml-shadow);
  margin-bottom: 10px;
  transition: box-shadow 0.2s ease, transform 0.1s ease;
  cursor: pointer;
}
.match-card:hover {
  box-shadow: 0 2px 12px var(--ml-shadow);
}

.match-avatar-row {
  position: relative;
  flex-shrink: 0;
}

.match-avatar {
  display: block;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--ml-bg-input);
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.match-vip-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  font-size: 10px;
  background: linear-gradient(135deg, var(--ml-gold), var(--ml-gold-dim));
  color: #fff;
  padding: 1px 5px;
  border-radius: 6px;
  font-weight: 700;
  white-space: nowrap;
}

.match-info {
  flex: 1;
  min-width: 0;
}

.match-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.match-nick {
  font-size: 15px;
  font-weight: 700;
  color: var(--ml-text);
}

.match-age {
  font-size: 12px;
  color: var(--ml-text-secondary);
}

.match-level {
  font-size: 11px;
  color: var(--ml-text-secondary);
  background: var(--ml-bg-input);
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.match-detail {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--ml-text-secondary);
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.match-dist,
.match-active {
  color: var(--ml-text-label);
}

.match-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}

.match-tag {
  font-size: 11px;
  color: var(--ml-primary);
  background: var(--ml-primary-dim);
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.match-bio {
  font-size: 13px;
  color: var(--ml-text-secondary);
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>