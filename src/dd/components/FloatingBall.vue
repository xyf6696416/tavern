<template>
  <div
    v-if="showBall"
    class="floating-ball"
    :class="{ 'ball-dragging': dragging }"
    :style="ballStyle"
    @mousedown="startDrag"
    @touchstart.prevent="startTouchDrag"
    @click.stop="handleClick"
  >
    <span class="ball-icon">💎</span>
    <div class="ball-glow" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'

const app = useAppStore()
const route = useRoute()
const showBall = computed(() => !route.meta?.isTitleScreen)

const dragging = ref(false)
const offsetX = ref(0)
const offsetY = ref(0)
const posX = ref(app.ballPosition.x)
const posY = ref(app.ballPosition.y)

const ballStyle = computed(() => ({
  left: `${posX.value}px`,
  top: `${posY.value}px`,
}))

function savePosition() {
  app.ballPosition.x = posX.value
  app.ballPosition.y = posY.value
  try {
    localStorage.setItem('mlife_ball_pos', JSON.stringify({ x: posX.value, y: posY.value }))
  } catch {}
}

function startDrag(e: MouseEvent) {
  dragging.value = true
  offsetX.value = e.clientX - posX.value
  offsetY.value = e.clientY - posY.value
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function startTouchDrag(e: TouchEvent) {
  const touch = e.touches[0]
  dragging.value = true
  offsetX.value = touch.clientX - posX.value
  offsetY.value = touch.clientY - posY.value
  document.addEventListener('touchmove', onTouchDrag, { passive: false })
  document.addEventListener('touchend', stopTouchDrag)
}

function onDrag(e: MouseEvent) {
  posX.value = e.clientX - offsetX.value
  posY.value = e.clientY - offsetY.value
  clampPosition()
}

function onTouchDrag(e: TouchEvent) {
  const touch = e.touches[0]
  posX.value = touch.clientX - offsetX.value
  posY.value = touch.clientY - offsetY.value
  clampPosition()
}

function stopDrag() {
  dragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  savePosition()
}

function stopTouchDrag() {
  dragging.value = false
  document.removeEventListener('touchmove', onTouchDrag)
  document.removeEventListener('touchend', stopTouchDrag)
  savePosition()
}

function clampPosition() {
  const maxX = window.innerWidth - 56
  const maxY = window.innerHeight - 56
  posX.value = Math.max(0, Math.min(maxX, posX.value))
  posY.value = Math.max(0, Math.min(maxY, posY.value))
}

function handleClick() {
  if (!dragging.value) {
    app.togglePhone()
  }
}

onMounted(() => {
  posX.value = app.ballPosition.x
  posY.value = app.ballPosition.y
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onTouchDrag)
  document.removeEventListener('touchend', stopTouchDrag)
})
</script>

<style scoped>
.floating-ball {
  position: fixed;
  z-index: 999;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--ml-primary), #FF8A9E);
  box-shadow: 0 4px 16px var(--ml-primary-glow);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  user-select: none;
  transition: box-shadow 0.2s ease, transform 0.1s;
}
.floating-ball:hover {
  box-shadow: 0 4px 24px var(--ml-primary-glow), 0 0 0 1px var(--ml-primary-dim);
}
.floating-ball:active {
  cursor: grabbing;
}
.ball-dragging {
  transition: none !important;
}
.ball-icon {
  font-size: 22px;
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
}
.ball-glow {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--ml-primary-glow), transparent 70%);
  animation: ballPulse 2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes ballPulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 1; }
}
</style>