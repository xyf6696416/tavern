<template>
  <div class="title-screen" :class="{ 'title-entered': entered }">
    <!-- 背景层：棱镜光晕呼吸 -->
    <div class="ts-bg">
      <div class="ts-bg-orbs">
        <div class="ts-orb ts-orb-1"></div>
        <div class="ts-orb ts-orb-2"></div>
        <div class="ts-orb ts-orb-3"></div>
      </div>
      <div class="ts-bg-grid"></div>
    </div>

    <!-- 棱镜旋转装饰 -->
    <div class="ts-prisms">
      <div class="ts-prism ts-prism-1"></div>
      <div class="ts-prism ts-prism-2"></div>
      <div class="ts-prism ts-prism-3"></div>
      <div class="ts-prism ts-prism-4"></div>
    </div>

    <!-- 主内容区 -->
    <div class="ts-content">
      <!-- 标题 -->
      <div class="ts-title-group" :class="{ 'ts-anim-in': entered }">
        <div class="ts-katakana">プリズマ☆イリヤ</div>
        <h1 class="ts-title">
          <span class="ts-title-star">✦</span>
          魔法少女☆伊莉雅
          <span class="ts-title-star">✦</span>
        </h1>
        <div class="ts-subtitle">Prisma☆Illya — 魔法少女的日常物语</div>
        <div class="ts-prism-line"></div>
      </div>

      <!-- 开始按钮 -->
      <button
        class="ts-start-btn"
        :class="{ 'ts-anim-in': entered }"
        @click="handleStart"
        :disabled="starting"
      >
        <span class="ts-btn-glow"></span>
        <span class="ts-btn-text">{{ starting ? '✦ 加载中...' : '✦ 开始游戏' }}</span>
        <span class="ts-btn-shimmer"></span>
      </button>

      <!-- 底部信息 -->
      <div class="ts-footer" :class="{ 'ts-anim-in': entered }">
        <div class="ts-characters">
          <div
            v-for="char in characters"
            :key="char.id"
            class="ts-char"
            :style="{ '--c': char.color }"
          >
            <span class="ts-char-icon">{{ char.icon }}</span>
            <span class="ts-char-label">{{ char.label }}</span>
          </div>
        </div>
        <div class="ts-divider"></div>
        <div class="ts-version">✦ APP v2.1 — 魔法少女棱镜系统 ✦</div>
      </div>
    </div>

    <!-- 底部粒子（装饰） -->
    <div class="ts-particles">
      <span v-for="i in 12" :key="i" class="ts-particle" :style="particleStyle(i)"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

const emit = defineEmits<{
  start: []
}>()

const entered = ref(false)
const starting = ref(false)

const characters = [
  { id: '伊莉雅', label: '伊莉雅', icon: '♥', color: '#C71585' },
  { id: '美游', label: '美游', icon: '🌙', color: '#D4459A' },
  { id: '小黑', label: '小黑', icon: '🔥', color: '#FF8C00' },
  { id: '士郎', label: '士郎', icon: '🛡️', color: '#6BB8D4' },
  { id: 'user', label: '轻音', icon: '🎵', color: '#66BB6A' },
]

function particleStyle(i: number) {
  const left = ((i * 47 + 13) % 100)
  const delay = (i * 0.4) % 3
  const size = 2 + (i % 3) * 1.5
  return {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    width: `${size}px`,
    height: `${size}px`,
    opacity: 0.3 + (i % 4) * 0.15,
  }
}

function handleStart() {
  starting.value = true
  // 小延迟让按钮动画播放
  setTimeout(() => {
    emit('start')
  }, 400)
}

onMounted(() => {
  // 入场动画：先渲染组件，再触发 CSS 过渡
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      entered.value = true
    })
  })
})
</script>

<style scoped>
/* ═════════════════════════════════════════════
   标题界面 — 魔法少女棱镜系
   固定尺寸 960x640px，不依赖 vh/vw
   ═════════════════════════════════════════════ */

.title-screen {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 960px;
  height: 640px;
  overflow: hidden;
  background: #1a0a18;
  border-radius: 20px;
  box-shadow:
    0 0 60px rgba(212, 65, 142, 0.15),
    0 0 120px rgba(212, 65, 142, 0.08),
    inset 0 0 80px rgba(212, 65, 142, 0.04);
  font-family: 'Inter', system-ui, sans-serif;
  color: #fff;
  z-index: 1000;
}

/* ─── 背景层 ─── */
.ts-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 40%, rgba(212, 65, 142, 0.12) 0%, transparent 60%),
    radial-gradient(ellipse at 20% 80%, rgba(180, 74, 155, 0.08) 0%, transparent 40%),
    radial-gradient(ellipse at 80% 20%, rgba(212, 175, 55, 0.06) 0%, transparent 40%),
    linear-gradient(160deg, #1a0a18 0%, #2a1025 30%, #1f0d1c 60%, #1a0a18 100%);
  animation: tsBgPulse 6s ease-in-out infinite;
}

.ts-bg-orbs {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.ts-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.3;
  animation: tsOrbFloat 8s ease-in-out infinite;
}

.ts-orb-1 {
  width: 300px;
  height: 300px;
  top: -60px;
  left: -60px;
  background: radial-gradient(circle, rgba(212, 65, 142, 0.4), transparent);
  animation-delay: 0s;
}

.ts-orb-2 {
  width: 250px;
  height: 250px;
  bottom: -40px;
  right: -40px;
  background: radial-gradient(circle, rgba(212, 175, 55, 0.3), transparent);
  animation-delay: -3s;
}

.ts-orb-3 {
  width: 200px;
  height: 200px;
  top: 40%;
  left: 60%;
  background: radial-gradient(circle, rgba(180, 74, 155, 0.25), transparent);
  animation-delay: -5s;
}

.ts-bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(212, 65, 142, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(212, 65, 142, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* ─── 棱镜旋转装饰 ─── */
.ts-prisms {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.ts-prism {
  position: absolute;
  border: 1.5px solid rgba(212, 65, 142, 0.15);
  border-radius: 2px;
  animation: tsSpin 20s linear infinite;
}

.ts-prism-1 {
  width: 200px;
  height: 200px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(0deg);
  border-color: rgba(212, 65, 142, 0.08);
  animation-duration: 30s;
}

.ts-prism-2 {
  width: 280px;
  height: 280px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(0deg);
  border-color: rgba(212, 175, 55, 0.06);
  animation-duration: 40s;
  animation-direction: reverse;
}

.ts-prism-3 {
  width: 120px;
  height: 120px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(0deg);
  border-color: rgba(180, 74, 155, 0.12);
  animation-duration: 20s;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}

.ts-prism-4 {
  width: 60px;
  height: 60px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(0deg);
  border-color: rgba(212, 175, 55, 0.15);
  animation-duration: 15s;
  animation-direction: reverse;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}

/* ─── 主内容区 ─── */
.ts-content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2;
  padding: 40px;
}

/* ─── 标题 ─── */
.ts-title-group {
  text-align: center;
  opacity: 0;
  transform: translateY(20px);
  transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.ts-title-group.ts-anim-in {
  opacity: 1;
  transform: translateY(0);
}

.ts-katakana {
  font-size: 14px;
  letter-spacing: 8px;
  color: rgba(212, 175, 55, 0.5);
  font-weight: 400;
  margin-bottom: 12px;
  font-family: 'Inter', sans-serif;
}

.ts-title {
  font-family: 'Playfair Display', serif;
  font-size: 48px;
  font-weight: 700;
  letter-spacing: 4px;
  background: linear-gradient(
    135deg,
    #D4418E 0%,
    #E8A0C0 20%,
    #D4AF37 40%,
    #E8A0C0 60%,
    #D4418E 80%,
    #D4AF37 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: tsShimmer 4s linear infinite;
  line-height: 1.2;
  margin-bottom: 8px;
}

.ts-title-star {
  display: inline-block;
  font-size: 28px;
  animation: tsStarPulse 2s ease-in-out infinite;
  -webkit-text-fill-color: initial;
  color: #D4AF37;
  margin: 0 8px;
}

.ts-subtitle {
  font-size: 14px;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 6px;
  margin-top: 4px;
  font-family: 'Inter', sans-serif;
}

.ts-prism-line {
  width: 80px;
  height: 2px;
  margin: 24px auto 0;
  background: linear-gradient(90deg, transparent, #D4AF37, #D4418E, transparent);
  border-radius: 1px;
  animation: tsLinePulse 3s ease-in-out infinite;
}

/* ─── 开始按钮 ─── */
.ts-start-btn {
  position: relative;
  margin-top: 48px;
  padding: 14px 48px;
  font-size: 16px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  letter-spacing: 3px;
  color: #fff;
  background: rgba(255, 255, 255, 0.04);
  border: 1.5px solid rgba(212, 65, 142, 0.3);
  border-radius: 50px;
  cursor: pointer;
  overflow: hidden;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 0.4s;
  outline: none;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.ts-start-btn.ts-anim-in {
  opacity: 1;
  transform: translateY(0);
}

.ts-start-btn:hover {
  border-color: rgba(212, 65, 142, 0.6);
  background: rgba(212, 65, 142, 0.12);
  box-shadow:
    0 0 20px rgba(212, 65, 142, 0.2),
    0 0 40px rgba(212, 65, 142, 0.1);
  transform: translateY(-2px);
}

.ts-start-btn:active {
  transform: translateY(0);
  box-shadow: 0 0 10px rgba(212, 65, 142, 0.15);
}

.ts-start-btn:disabled {
  cursor: wait;
  opacity: 0.7;
}

.ts-btn-glow {
  position: absolute;
  inset: -2px;
  border-radius: 50px;
  background: linear-gradient(135deg, transparent, rgba(212, 65, 142, 0.15), transparent);
  opacity: 0;
  transition: opacity 0.4s;
}

.ts-start-btn:hover .ts-btn-glow {
  opacity: 1;
}

.ts-btn-text {
  position: relative;
  z-index: 1;
}

.ts-btn-shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.06),
    transparent
  );
  transform: skewX(-20deg);
  transition: left 0.6s;
}

.ts-start-btn:hover .ts-btn-shimmer {
  left: 200%;
  transition: left 0.8s ease-in-out;
}

/* ─── 底部信息 ─── */
.ts-footer {
  position: absolute;
  bottom: 32px;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 0.8s;
}

.ts-footer.ts-anim-in {
  opacity: 1;
  transform: translateY(0);
}

.ts-characters {
  display: flex;
  gap: 16px;
}

.ts-char {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 12px;
  cursor: default;
  transition: all 0.3s;
}

.ts-char:hover {
  background: color-mix(in srgb, var(--c) 10%, transparent);
  transform: translateY(-4px) scale(1.05);
}

.ts-char-icon {
  font-size: 20px;
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--c) 30%, transparent));
  transition: filter 0.3s;
}

.ts-char:hover .ts-char-icon {
  filter: drop-shadow(0 0 12px color-mix(in srgb, var(--c) 60%, transparent));
}

.ts-char-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
  letter-spacing: 1px;
  transition: color 0.3s;
}

.ts-char:hover .ts-char-label {
  color: var(--c);
}

.ts-divider {
  width: 200px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.2), rgba(212, 65, 142, 0.2), transparent);
}

.ts-version {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.25);
  letter-spacing: 2px;
  font-weight: 300;
}

/* ─── 粒子 ─── */
.ts-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.ts-particle {
  position: absolute;
  top: -4px;
  width: 3px;
  height: 3px;
  background: rgba(212, 175, 55, 0.5);
  border-radius: 50%;
  animation: tsFall 8s linear infinite;
}

/* ─── 动画关键帧 ─── */
@keyframes tsBgPulse {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

@keyframes tsOrbFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(20px, -20px) scale(1.05); }
  66% { transform: translate(-10px, 15px) scale(0.95); }
}

@keyframes tsShimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

@keyframes tsStarPulse {
  0%, 100% { opacity: 0.6; transform: scale(0.95); }
  50% { opacity: 1; transform: scale(1.05); }
}

@keyframes tsLinePulse {
  0%, 100% { opacity: 0.4; width: 80px; }
  50% { opacity: 1; width: 120px; }
}

@keyframes tsSpin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes tsFall {
  0% { transform: translateY(-4px) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(640px) rotate(720deg); opacity: 0; }
}

/* ─── 响应式 ─── */
@media (max-width: 1000px) {
  .title-screen {
    width: 100%;
    height: 100%;
    border-radius: 0;
    left: 0;
    top: 0;
    transform: none;
  }
  .ts-title {
    font-size: 36px;
  }
  .ts-characters {
    gap: 10px;
  }
}

@media (max-width: 600px) {
  .ts-title {
    font-size: 28px;
    letter-spacing: 2px;
  }
  .ts-title-star {
    font-size: 20px;
  }
  .ts-start-btn {
    padding: 12px 32px;
    font-size: 14px;
  }
}
</style>