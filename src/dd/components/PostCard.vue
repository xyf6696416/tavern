<template>
  <div class="post-card">
    <!-- 头部 -->
    <div class="post-header">
      <div class="post-user">
        <span class="post-avatar">{{ post.avatar || '👤' }}</span>
        <div class="post-meta">
          <span class="post-nick">{{ post.nick }}</span>
          <span class="post-level">{{ post.level }}</span>
          <span v-if="post.vip" class="post-vip">{{ post.vip }}</span>
        </div>
      </div>
      <span class="post-time">{{ post.time }}</span>
    </div>

    <!-- 板块标签 -->
    <span v-if="post.section" class="post-section">{{ post.section }}</span>

    <!-- 正文 -->
    <p class="post-body">{{ post.body }}</p>

    <!-- 图片描述 -->
    <p v-if="post.image" class="post-image-desc">🖼 {{ post.image }}</p>

    <!-- 多图 -->
    <p v-if="post.images" class="post-image-desc">🖼 {{ post.images }}</p>

    <!-- 付费墙 -->
    <div v-if="post.paywall" class="post-paywall">
      <span>🔒 {{ post.paywall }}</span>
    </div>

    <!-- 互动栏 -->
    <div class="post-actions">
      <span class="post-action">❤ {{ post.likes }}</span>
      <span class="post-action">💬 {{ post.comments }}</span>
      <span v-if="post.shares != null" class="post-action">↗ {{ post.shares }}</span>
    </div>

    <!-- 热门评论 -->
    <p v-if="post.hot" class="post-hot">🔥 {{ post.hot }}</p>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '../types/mlife'

defineProps<{
  post: Post
}>()
</script>

<style scoped>
.post-card {
  padding: 14px 16px;
  background: var(--ml-bg-card);
  border-radius: 12px;
  box-shadow: 0 1px 4px var(--ml-shadow);
  margin-bottom: 10px;
  transition: box-shadow 0.2s ease, transform 0.1s ease;
}
.post-card:hover {
  box-shadow: 0 2px 12px var(--ml-shadow);
}

.post-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.post-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.post-avatar {
  font-size: 20px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--ml-bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.post-nick {
  font-size: 14px;
  font-weight: 600;
  color: var(--ml-text);
}

.post-level {
  font-size: 11px;
  color: var(--ml-text-secondary);
  background: var(--ml-bg-input);
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.post-vip {
  font-size: 11px;
  color: var(--ml-gold);
  font-weight: 600;
}

.post-time {
  font-size: 11px;
  color: var(--ml-text-label);
}

.post-section {
  display: inline-block;
  font-size: 11px;
  color: var(--ml-primary);
  background: var(--ml-primary-dim);
  padding: 2px 8px;
  border-radius: 4px;
  margin-bottom: 8px;
  font-weight: 500;
}

.post-body {
  font-size: 14px;
  line-height: 1.7;
  color: var(--ml-text);
  margin-bottom: 8px;
  word-break: break-word;
}

.post-image-desc {
  font-size: 12px;
  color: var(--ml-text-secondary);
  background: var(--ml-bg-input);
  padding: 6px 10px;
  border-radius: 8px;
  margin-bottom: 8px;
}

.post-paywall {
  font-size: 13px;
  color: var(--ml-primary);
  background: var(--ml-primary-dim);
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  text-align: center;
  font-weight: 600;
}

.post-actions {
  display: flex;
  gap: 16px;
  padding-top: 8px;
  border-top: 1px solid var(--ml-divider);
}

.post-action {
  font-size: 12px;
  color: var(--ml-text-secondary);
  cursor: pointer;
  transition: color 0.2s;
}
.post-action:hover {
  color: var(--ml-primary);
}

.post-hot {
  font-size: 12px;
  color: var(--ml-text-secondary);
  background: var(--ml-bg-input);
  padding: 6px 10px;
  border-radius: 8px;
  margin-top: 8px;
  line-height: 1.5;
}
</style>