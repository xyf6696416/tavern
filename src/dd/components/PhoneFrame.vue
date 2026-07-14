<template>
  <!-- 全屏模式：直接渲染手机界面 (由App.vue全屏布局) -->
  <div v-if="fullscreen" class="phone-fullscreen">
    <PhoneStatusBar />
    <PhoneHeader />
    <div class="phone-content">
      <router-view />
    </div>
    <NavBar />
    <FloatingBall />
  </div>

  <!-- PC 右侧面板模式 -->
  <template v-else>
    <div class="phone-panel">
      <PhoneStatusBar />
      <PhoneHeader />
      <div class="phone-content"><router-view /></div>
      <NavBar />
    </div>
  </template>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ fullscreen?: boolean }>(), { fullscreen: false })
</script>

<style scoped>
/* ── 全屏模式 ── */
.phone-fullscreen {
  width: 100%;
  height: 100%;
  background: var(--ml-phone-bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── PC 右侧面板 ── */
.phone-panel {
  width: 100%;
  height: 100%;
  background: var(--ml-phone-bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}

.phone-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}
</style>
