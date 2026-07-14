<template>
  <div class="title-screen">
    <!-- 背景粒子动画 -->
    <canvas ref="bgCanvas" class="bg-canvas"></canvas>

    <!-- 装饰光晕 -->
    <div class="glow-orb glow-orb-1"></div>
    <div class="glow-orb glow-orb-2"></div>

    <!-- 主内容 -->
    <div class="title-content">
      <!-- 顶部装饰 -->
      <div class="title-ornament top">
        <span class="ornament-symbol">⬥</span>
        <span class="ornament-line"></span>
        <span class="ornament-symbol">⬥</span>
        <span class="ornament-line"></span>
        <span class="ornament-symbol">⬥</span>
      </div>

      <!-- 标题 -->
      <div class="title-main">
        <h1 class="title-text">
          <span class="title-line title-sub">诺亚之城</span>
          <span class="title-line title-primary">魔物娘堡垒</span>
          <span class="title-line title-version">— F A L L E N  C I T A D E L —</span>
        </h1>
      </div>

      <!-- 副标题/引语 -->
      <p class="title-tagline">
        在欲望的深渊中<br class="mobile-break"/>
        寻找最后的救赎
      </p>

      <!-- 开始按钮 -->
      <button class="start-btn" @click="handleStart">
        <span class="btn-border"></span>
        <span class="btn-content">
          <span class="btn-icon">⚔️</span>
          <span class="btn-label">开始游戏</span>
        </span>
        <span class="btn-glow"></span>
      </button>

      <!-- 底部装饰 -->
      <div class="title-ornament bottom">
        <span class="ornament-symbol">⬥</span>
        <span class="ornament-line"></span>
        <span class="ornament-symbol">⬥</span>
        <span class="ornament-line"></span>
        <span class="ornament-symbol">⬥</span>
      </div>

      <!-- 侵蚀度指示器 -->
      <div class="erosion-indicator">
        <div class="erosion-label">当前侵蚀度</div>
        <div class="erosion-bar-track">
          <div class="erosion-bar-fill" ref="erosionBar"></div>
        </div>
        <div class="erosion-value">
          <span class="erosion-num" ref="erosionNum">15</span>
          <span class="erosion-pct">%</span>
        </div>
      </div>
    </div>

    <!-- 底部版权 -->
    <div class="title-footer">
      <span>❖ 诺亚之城 · 最后的堡垒 ❖</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

const emit = defineEmits<{
  start: [];
}>();

const bgCanvas = ref<HTMLCanvasElement>();
const erosionBar = ref<HTMLElement>();
const erosionNum = ref<HTMLElement>();

// ── 背景粒子动画 ──
let animationId = 0;
onMounted(() => {
  initParticles();
  animateErosion();
});

function initParticles() {
  const canvas = bgCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const resize = () => {
    canvas.width = canvas.parentElement?.clientWidth || 760;
    canvas.height = canvas.parentElement?.clientHeight || 500;
  };
  resize();
  window.addEventListener('resize', resize);

  const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; pulse: number }[] = [];
  const count = 60;
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2.5 + 0.5,
      alpha: Math.random() * 0.4 + 0.1,
      pulse: Math.random() * Math.PI * 2,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const time = Date.now() / 1000;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.pulse += 0.02;
      const currentAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212, 168, 67, ${currentAlpha})`;
      ctx.fill();

      // 发光
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212, 168, 67, ${currentAlpha * 0.08})`;
      ctx.fill();
    });

    // 连线
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(212, 168, 67, ${0.06 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    animationId = requestAnimationFrame(draw);
  }
  draw();
}

// ── 侵蚀度动画 ──
function animateErosion() {
  const target = 15;
  let current = 0;
  const duration = 2000;
  const start = Date.now();

  function tick() {
    const elapsed = Date.now() - start;
    const progress = Math.min(elapsed / duration, 1);
    // easeOutCubic
    const eased = 1 - Math.pow(1 - progress, 3);
    current = Math.round(target * eased);

    if (erosionBar.value) {
      erosionBar.value.style.width = current + '%';
    }
    if (erosionNum.value) {
      erosionNum.value.textContent = String(current);
    }

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }
  tick();
}

// ── 开始游戏 ──
async function handleStart() {
  const btn = document.querySelector('.start-btn');
  btn?.classList.add('clicked');

  // 点击动效延迟
  await new Promise(r => setTimeout(r, 600));

  emit('start');
}
</script>

<style lang="scss" scoped>
.title-screen {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  background: linear-gradient(180deg, #1a0f1e 0%, #0d0710 50%, #1a0f1e 100%);
  border: 2px solid var(--c-border);
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.15), inset 0 0 80px rgba(0,0,0,0.5);
  font-family: var(--font-body);
  color: var(--c-text-primary);
  overflow: hidden;
  position: relative;
  min-height: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* ── 背景粒子画布 ── */
.bg-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

/* ── 光晕 ── */
.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
  z-index: 0;
}
.glow-orb-1 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.12), transparent);
  top: -80px;
  left: -80px;
  animation: orbFloat1 8s ease-in-out infinite;
}
.glow-orb-2 {
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(212, 168, 67, 0.08), transparent);
  bottom: -60px;
  right: -60px;
  animation: orbFloat2 10s ease-in-out infinite;
}

@keyframes orbFloat1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, 30px) scale(1.1); }
  66% { transform: translate(-20px, 50px) scale(0.9); }
}
@keyframes orbFloat2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-30px, -20px) scale(1.15); }
  66% { transform: translate(20px, -40px) scale(0.85); }
}

/* ── 主内容 ── */
.title-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  gap: 16px;
}

/* ── 装饰 ── */
.title-ornament {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ornament-symbol {
  color: var(--c-gold-dim);
  font-size: 14px;
  animation: ornamentPulse 2s ease-in-out infinite;
}
.ornament-line {
  width: 60px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--c-gold-dim), transparent);
}

@keyframes ornamentPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* ── 标题 ── */
.title-main {
  text-align: center;
  margin: 8px 0;
}
.title-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.title-line {
  display: block;
}
.title-sub {
  font-family: var(--font-display);
  font-size: 14px;
  color: var(--c-text-muted);
  letter-spacing: 8px;
  text-transform: uppercase;
}
.title-primary {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: bold;
  color: var(--c-gold);
  letter-spacing: 6px;
  text-shadow:
    0 0 20px rgba(212, 168, 67, 0.4),
    0 0 60px rgba(212, 168, 67, 0.15),
    0 2px 4px rgba(0,0,0,0.5);
  animation: titleGlow 3s ease-in-out infinite;
}
.title-version {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--c-text-muted);
  letter-spacing: 6px;
  margin-top: 4px;
}

@keyframes titleGlow {
  0%, 100% { text-shadow: 0 0 20px rgba(212, 168, 67, 0.4), 0 0 60px rgba(212, 168, 67, 0.15), 0 2px 4px rgba(0,0,0,0.5); }
  50% { text-shadow: 0 0 30px rgba(212, 168, 67, 0.6), 0 0 80px rgba(212, 168, 67, 0.25), 0 2px 4px rgba(0,0,0,0.5); }
}

/* ── 引语 ── */
.title-tagline {
  font-size: 13px;
  color: var(--c-text-secondary);
  text-align: center;
  line-height: 1.6;
  letter-spacing: 2px;
  font-style: italic;
  opacity: 0.8;
}

/* ── 开始按钮 ── */
.start-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 8px 0;
  background: transparent;
  border: none;
  cursor: pointer;
  outline: none;
  width: 220px;
  height: 52px;
  transition: transform 0.3s ease;
}
.start-btn:hover {
  transform: scale(1.05);
}
.start-btn:active {
  transform: scale(0.97);
}
.start-btn.clicked {
  animation: btnClick 0.6s ease forwards;
}
@keyframes btnClick {
  0% { transform: scale(1); opacity: 1; }
  40% { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0; }
}

.btn-border {
  position: absolute;
  inset: 0;
  border: 2px solid var(--c-gold-dim);
  clip-path: polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px);
  transition: all 0.3s ease;
}
.start-btn:hover .btn-border {
  border-color: var(--c-gold);
  box-shadow: 0 0 15px rgba(212, 168, 67, 0.3), inset 0 0 15px rgba(212, 168, 67, 0.1);
}

.btn-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  z-index: 1;
}
.btn-icon {
  font-size: 18px;
  animation: btnIconFloat 2s ease-in-out infinite;
}
.btn-label {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: bold;
  color: var(--c-gold);
  letter-spacing: 4px;
  text-shadow: 0 0 10px rgba(212, 168, 67, 0.3);
}

@keyframes btnIconFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.btn-glow {
  position: absolute;
  inset: -4px;
  background: radial-gradient(ellipse at center, rgba(212, 168, 67, 0.15), transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}
.start-btn:hover .btn-glow {
  opacity: 1;
}

/* ── 侵蚀度指示器 ── */
.erosion-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  padding: 6px 12px;
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--c-border);
  border-radius: 3px;
}
.erosion-label {
  font-size: 10px;
  color: var(--c-corruption);
  font-weight: bold;
  letter-spacing: 1px;
  white-space: nowrap;
}
.erosion-bar-track {
  width: 120px;
  height: 6px;
  background: var(--c-bg-dark);
  border: 1px solid var(--c-border);
  border-radius: 2px;
  overflow: hidden;
}
.erosion-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #a855f7, #dc2626);
  border-radius: 1px;
  transition: width 0.1s linear;
  width: 0%;
}
.erosion-value {
  font-size: 12px;
  font-weight: bold;
  color: var(--c-text-primary);
  min-width: 36px;
  text-align: right;
}
.erosion-pct {
  color: var(--c-text-muted);
  font-size: 10px;
}

/* ── 底部 ── */
.title-footer {
  position: relative;
  z-index: 2;
  padding: 8px;
  margin-top: 8px;
  font-family: var(--font-display);
  font-size: 10px;
  color: var(--c-text-muted);
  letter-spacing: 2px;
  opacity: 0.6;
}

/* ── 响应式 ── */
.mobile-break {
  display: none;
}
@media (max-width: 480px) {
  .title-primary { font-size: 24px; letter-spacing: 4px; }
  .title-sub { font-size: 11px; letter-spacing: 4px; }
  .title-version { font-size: 9px; letter-spacing: 3px; }
  .title-tagline { font-size: 11px; }
  .start-btn { width: 180px; height: 44px; }
  .btn-label { font-size: 14px; }
  .mobile-break { display: block; }
  .erosion-bar-track { width: 80px; }
}
</style>