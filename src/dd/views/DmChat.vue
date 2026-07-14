<template>
  <div class="dm-container">
    <!-- 头部 -->
    <div class="dm-header">
      <button class="back-btn" @click="$router.back()">←</button>
      <div class="header-avatar">{{ contact?.avatar || '👤' }}</div>
      <div class="header-info">
        <div class="header-name">
          {{ contactName }}
          <span class="header-level">{{ contact?.level || '' }}</span>
        </div>
        <div class="header-status" :class="{ online: isOnline }">
          {{ isOnline ? '在线' : '离线' }}
        </div>
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="dm-messages" ref="msgListRef">
      <!-- Loading -->
      <div v-if="loading" class="msg-status-center">正在加载私信...</div>

      <!-- Empty -->
      <div v-else-if="messages.length === 0" class="msg-status-center">暂无消息，发送第一条吧</div>

      <!-- 消息 -->
      <template v-else>
        <div v-for="(m, i) in messages" :key="i" class="msg-wrapper" :class="m.role">
          <div v-if="m.context" class="msg-context">{{ m.context }}</div>
          <div class="msg-row">
            <div v-if="m.role === 'incoming'" class="msg-avatar">{{ contact?.avatar || '👤' }}</div>
            <div class="msg-bubble">{{ m.text }}</div>
            <div v-if="m.role === 'outgoing'" class="msg-avatar self-avatar">🌙</div>
          </div>
          <div class="msg-footer">
            <span class="msg-time">{{ m.time || '' }}</span>
            <span v-if="m.role === 'outgoing' && m.status" class="msg-status" :class="{ read: m.status === '已读' }">
              {{ m.status === '已读' ? '✓✓' : '✓' }}
            </span>
            <span v-if="m.role === 'outgoing' && m.error" class="msg-error">⚠ 发送失败</span>
          </div>
        </div>

        <!-- 发送中指示 -->
        <div v-if="isSending" class="msg-wrapper outgoing">
          <div class="msg-row">
            <div class="msg-bubble sending-bubble">
              <span class="sending-dot" />
            </div>
            <div class="msg-avatar self-avatar">🌙</div>
          </div>
        </div>
      </template>
    </div>

    <!-- 输入栏 -->
    <div class="dm-input-bar">
      <button class="emoji-btn" @click="toggleEmoji">😊</button>
      <input
        v-model="text"
        class="input-field"
        placeholder="输入消息..."
        @keyup.enter="sendMsg"
      />
      <button class="send-btn" :class="{ 'send-disabled': !text.trim() }" :disabled="!text.trim()" @click="sendMsg" />
    </div>

    <!-- 简单表情面板 -->
    <div v-if="showEmoji" class="emoji-panel">
      <span v-for="e in emojis" :key="e" class="emoji-item" @click="insertEmoji(e)">{{ e }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useDmStore } from '../stores/dm'
import { useAppStore } from '../stores/app'
import { usePageRefresh } from '../composables/usePageRefresh'

const route = useRoute()
const dm = useDmStore()
const app = useAppStore()

const loading = ref(true)
const text = ref('')
const isSending = ref(false)
const showEmoji = ref(false)
const msgListRef = ref<HTMLElement | null>(null)

const contactId = computed(() => route.params.id as string)
const contact = computed(() => dm.contacts.find(c => c.id === contactId.value) || null)
const contactName = computed(() => contact.value?.nick || contactId.value)
const messages = computed(() => dm.messagesMap?.[contactId.value] || [])
const isOnline = computed(() => contact.value !== null)

const emojis = ['😊', '😏', '😘', '😍', '🥰', '😅', '😂', '🤔', '😈', '💋', '❤️', '💕', '🌹', '✨', '🔥', '💦']

function scrollToBottom() {
  nextTick(() => {
    if (msgListRef.value) {
      msgListRef.value.scrollTop = msgListRef.value.scrollHeight
    }
  })
}

function toggleEmoji() {
  showEmoji.value = !showEmoji.value
}

function insertEmoji(e: string) {
  text.value += e
  showEmoji.value = false
}

async function sendMsg() {
  if (!text.value.trim() || isSending.value) return
  const msgText = text.value
  text.value = ''
  isSending.value = true
  showEmoji.value = false

  // 添加发送消息
  dm.addMessage(contactId.value, {
    role: 'outgoing',
    text: msgText,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    status: '发送中',
  })
  scrollToBottom()

  try {
    // 模拟回复
    await new Promise(r => setTimeout(r, 800 + Math.random() * 600))
    dm.addMessage(contactId.value, {
      role: 'incoming',
      text: getAutoReply(msgText),
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    })
    // 更新发送状态为已读
    const msgs = dm.messagesMap?.[contactId.value]
    if (msgs) {
      for (const m of msgs) {
        if (m.role === 'outgoing' && m.status === '发送中') {
          m.status = '已读'
        }
      }
    }
  } catch {
    // 标记最后一条消息失败
    const msgs = dm.messagesMap?.[contactId.value]
    if (msgs) {
      for (const m of msgs) {
        if (m.role === 'outgoing' && m.status === '发送中') {
          m.status = '未送达'
          m.error = true
        }
      }
    }
  } finally {
    isSending.value = false
    scrollToBottom()
  }
}

function getAutoReply(msg: string): string {
  const replies = [
    '嗯嗯~', '好的呢', '嘻嘻', '你真会说话',
    '想见你', '别闹~', '有点意思', '继续说',
    '今天心情不错', '🌙', '下次再聊~',
  ]
  return replies[Math.floor(Math.random() * replies.length)]
}

onMounted(async () => {
  try {
    const p = usePageRefresh()
    await p.refreshPage('dmChat')
  } catch {}
  loading.value = false
  scrollToBottom()
})
</script>

<style scoped>
.dm-container {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  background: var(--ml-bg);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px var(--ml-shadow-lg);
}

.back-btn {
  background: none;
  border: none;
  color: var(--ml-text-secondary);
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
}

.dm-header {
  background: var(--ml-bg-card);
  padding: 12px 16px;
  border-bottom: 1px solid var(--ml-divider);
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--ml-primary), #FF8A9E);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.header-info { flex: 1; }

.header-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ml-text);
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-level {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--ml-primary-dim);
  color: var(--ml-primary);
}

.header-status {
  font-size: 11px;
  color: var(--ml-text-label);
}

.header-status.online {
  color: var(--ml-green);
}

/* ── 消息区域 ── */
.dm-messages {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--ml-bg-card);
  max-height: 400px;
  overflow-y: auto;
}

.msg-status-center {
  text-align: center;
  padding: 40px 20px;
  color: var(--ml-text-label);
  font-size: 13px;
}

.msg-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.msg-wrapper.incoming { align-items: flex-start; }
.msg-wrapper.outgoing { align-items: flex-end; }

.msg-context {
  font-size: 11px;
  color: var(--ml-text-label);
  font-style: italic;
  max-width: 80%;
  padding: 0 8px;
}

.msg-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 85%;
}

.msg-wrapper.outgoing .msg-row { flex-direction: row-reverse; }

.msg-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--ml-bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}

.self-avatar {
  background: linear-gradient(135deg, var(--ml-primary), #FF8A9E);
}

.msg-bubble {
  padding: 8px 12px;
  border-radius: 16px;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}

.msg-wrapper.incoming .msg-bubble {
  background: var(--ml-bg-input);
  color: var(--ml-text);
  border-bottom-left-radius: 4px;
}

.msg-wrapper.outgoing .msg-bubble {
  background: linear-gradient(135deg, var(--ml-primary), #FF8A9E);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.msg-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
}

.msg-time {
  font-size: 10px;
  color: var(--ml-text-label);
}

.msg-status {
  font-size: 10px;
  color: var(--ml-text-label);
}

.msg-status.read {
  color: var(--ml-green);
}

.msg-error {
  font-size: 10px;
  color: var(--ml-primary);
}

/* ── 发送中动画 ── */
.sending-bubble {
  padding: 12px 18px;
  background: linear-gradient(135deg, var(--ml-primary), #FF8A9E);
  color: #fff;
  border-bottom-right-radius: 4px;
  display: flex;
  gap: 4px;
  align-items: center;
}

.sending-dot {
  display: block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  animation: sendingPulse 1s ease-in-out infinite;
}

@keyframes sendingPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

/* ── 输入栏 ── */
.dm-input-bar {
  background: var(--ml-bg);
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-top: 1px solid var(--ml-divider);
}

.emoji-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.input-field {
  flex: 1;
  background: var(--ml-bg-input);
  border: none;
  border-radius: 18px;
  padding: 8px 14px;
  color: var(--ml-text);
  font-size: 12px;
  font-family: inherit;
  outline: none;
}

.send-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--ml-primary), #FF8A9E);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
  position: relative;
  box-shadow: 0 2px 8px var(--ml-primary-glow);
}

.send-btn:hover { transform: scale(1.1); }
.send-btn:active { transform: scale(0.95); }

.send-btn.send-disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
}

.send-btn::before {
  content: "➤";
  color: #fff;
  font-size: 12px;
  margin-left: 2px;
}

/* ── 表情面板 ── */
.emoji-panel {
  background: var(--ml-bg-card);
  border-top: 1px solid var(--ml-divider);
  padding: 10px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.emoji-item {
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: background 0.15s;
}

.emoji-item:hover {
  background: var(--ml-bg-input);
}

.dm-messages::-webkit-scrollbar { width: 4px; }
.dm-messages::-webkit-scrollbar-thumb { background: var(--ml-text-label); border-radius: 2px; }
</style>