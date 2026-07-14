<template>
  <div class="mlife-app" :data-theme="appStore.theme">
    <!-- ===== 标题界面（全屏覆盖） ===== -->
    <router-view v-if="isTitleScreen" name="title" />

    <!-- ===== 主界面：左正文 + 右手机 ===== -->
    <template v-else>
      <!-- 左侧：正文 -->
      <div class="story-column">
        <StoryPane :text="storyText" :is-loading="storyLoading" :is-empty="!storyText" />
        <InputBar :sending="isSending" @send="handleSend" />
      </div>

      <!-- 右侧：手机面板（可滑动收起） -->
      <div class="phone-column" :class="{ 'phone-collapsed': !phoneOpen }">
        <PhoneFrame :fullscreen="false" />
        <button class="phone-toggle" @click="togglePhone">
          {{ phoneOpen ? '▶' : '◀' }}
        </button>
      </div>
    </template>

    <ToastProvider />

    <Teleport to="body">
      <div v-if="confirmState.visible" class="confirm-overlay" @click.self="confirmCancel">
        <div class="confirm-modal">
          <div class="confirm-title">{{ confirmState.title }}</div>
          <div class="confirm-message">{{ confirmState.message }}</div>
          <div class="confirm-buttons">
            <button class="confirm-btn cancel" @click="confirmCancel">取消</button>
            <button class="confirm-btn ok" @click="confirmOk">确定</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from './stores/app'
import StoryPane from './components/StoryPane.vue'
import InputBar from './components/InputBar.vue'
import PhoneFrame from './components/PhoneFrame.vue'
import ToastProvider from './components/ToastProvider.vue'
import { useMlifeInject } from './composables/useMlifeInject'

const appStore = useAppStore()
const route = useRoute()
const isTitleScreen = computed(() => route.meta?.isTitleScreen === true)

const storyText = ref('')
const storyLoading = ref(false)
const isSending = ref(false)
const phoneOpen = ref(true)

if (typeof window !== 'undefined') {
  (window as any).__mlife_setStory = (text: string) => { storyText.value = text }
}

const mlifeInject = useMlifeInject()

function togglePhone() {
  phoneOpen.value = !phoneOpen.value
}

async function handleSend(text: string) {
  storyLoading.value = true
  try {
    const narrative = await mlifeInject.injectToAI(text)
    if (narrative) storyText.value = narrative
  } catch (e) {
    console.error('[M-life] 发送失败:', e)
    appStore.addToast('发送失败，请重试', 'error')
  } finally { storyLoading.value = false }
}

const confirmState = reactive({ visible: false, title: '', message: '', resolve: null as ((val: boolean) => void) | null })
function confirmCancel() { confirmState.resolve?.(false); confirmState.visible = false }
function confirmOk() { confirmState.resolve?.(true); confirmState.visible = false }
;(window as any).__mlifeConfirm = (t: string, m: string): Promise<boolean> =>
  new Promise(r => { confirmState.title = t; confirmState.message = m; confirmState.visible = true; confirmState.resolve = r })

onMounted(() => appStore.loadFromLocalStorage())
</script>

<style scoped>
.mlife-app {
  position: fixed; inset: 0;
  background: var(--ml-bg);
  color: var(--ml-text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans SC', sans-serif;
  overflow: hidden;
  display: flex;
  flex-direction: row;
}

/* ── 左侧：正文（自适应填充） ── */
.story-column {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow-y: auto;
}

/* ── 右侧：手机面板（可滑动收起） ── */
.phone-column {
  width: 375px;
  height: 100%;
  flex-shrink: 0;
  border-left: 1px solid var(--ml-phone-border);
  overflow: hidden;
  position: relative;
  transition: width 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.phone-column.phone-collapsed {
  width: 0;
  border-left: none;
}

.phone-toggle {
  position: absolute;
  left: -28px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 48px;
  border: 1px solid var(--ml-phone-border);
  border-right: none;
  border-radius: 8px 0 0 8px;
  background: var(--ml-bg-card);
  color: var(--ml-text-secondary);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: background 0.2s;
}
.phone-toggle:hover {
  background: var(--ml-bg-hover);
}

@media (max-width: 780px) {
  .story-column { display: none; }
  .phone-column { width: 100%; }
  .phone-column.phone-collapsed { width: 0; }
  .phone-toggle { display: none; }
}

/* ── Confirm ── */
.confirm-overlay { position:fixed;inset:0;background:var(--ml-overlay);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:10000 }
.confirm-modal { background:var(--ml-bg-card);border-radius:14px;padding:24px;max-width:320px;width:90%;box-shadow:0 8px 32px var(--ml-shadow) }
.confirm-title { font-size:1.1rem;font-weight:700;margin-bottom:10px }
.confirm-message { font-size:.9rem;color:var(--ml-text-secondary);margin-bottom:20px;line-height:1.6 }
.confirm-buttons { display:flex;gap:10px;justify-content:flex-end }
.confirm-btn { padding:8px 20px;border-radius:8px;border:none;font-size:.85rem;font-weight:600;cursor:pointer;transition:opacity .15s }
.confirm-btn.cancel { background:var(--ml-bg-input);color:var(--ml-text-secondary) }
.confirm-btn.ok { background:var(--ml-primary);color:#fff }
</style>