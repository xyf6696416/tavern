<template>
  <div class="story">
    <AiLoading v-if="store.isAiLoading" />
    <div v-else-if="!store.storyText && !store.isAiLoading" class="story-empty">
      <p class="story-empty-icon">✦</p>
      <p class="story-empty-text">选择选项或输入内容开始故事</p>
      <p class="story-empty-hint">伊莉雅正在等着你哦~</p>
    </div>
    <template v-else>
      <div class="story-actions-bar">
        <div class="story-actions-left">
          <span class="story-actions-hint">✦ 故事</span>
        </div>
        <div class="story-actions-right">
          <button class="story-action-btn" title="重新生成" @click="handleRegen">
            <IllyaIcon name="regen" :size="18" color="var(--text-label)" />
          </button>
          <button class="story-action-btn" title="进入编辑模式" @click="handleEdit">
            <IllyaIcon name="edit" :size="16" color="var(--text-label)" />
          </button>
          <button class="story-action-btn story-action-outfit" :class="{ on: store.showOutfitPanel }" title="选择衣装" @click="store.toggleOutfitPanel()">
            <IllyaIcon name="outfit" :size="16" color="var(--text-label)" />
          </button>
          <button class="story-action-btn story-action-expr" :class="{ on: store.showExpressionPanel }" title="选择表情" @click="store.toggleExpressionPanel()">
            <IllyaIcon name="expression" :size="16" color="var(--text-label)" />
          </button>
        </div>
      </div>
      <OutfitSelector :outfits="store.outfits" :current="store.currentOutfit" :visible="store.showOutfitPanel" @select="store.setOutfit" @close="store.toggleOutfitPanel()" />
      <ExpressionSelector :expressions="store.expressions" :current="store.currentExpression" :visible="store.showExpressionPanel" @select="store.setExpression" @close="store.toggleExpressionPanel()" />
      <div class="story-scroll">
        <StoryText :text="store.storyText" />
      </div>
    </template>
    <CharacterPortrait :char-id="store.currentCharId" :char-color="store.currentCharColor" :current-outfit="store.currentOutfit" :current-expression="store.currentExpression" />
    <div class="story-scroll-btns" v-if="store.storyText">
      <button class="scroll-btn" title="回到顶部" @click="scrollToTop">
        <IllyaIcon name="arrow-up" :size="16" color="var(--text-label)" />
      </button>
      <button class="scroll-btn" title="去到底部" @click="scrollToBottom">
        <IllyaIcon name="arrow-down" :size="16" color="var(--text-label)" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '../脚本/store'
import AiLoading from './AiLoading.vue'
import CharacterPortrait from './CharacterPortrait.vue'
import ExpressionSelector from './ExpressionSelector.vue'
import IllyaIcon from './IllyaIcon.vue'
import OutfitSelector from './OutfitSelector.vue'
import StoryText from './StoryText.vue'

const store = useGameStore()

function scrollToTop() {
  const el = document.querySelector('.story-scroll')
  if (el) el.scrollTop = 0
}

function scrollToBottom() {
  const el = document.querySelector('.story-scroll')
  if (el) el.scrollTop = el.scrollHeight
}

function handleRegen() {
  store.regenStory()
}

function handleEdit() {
  store.toggleEditMode()
}
</script>

<style scoped>
.story { position: relative; height: 100%; display: flex; flex-direction: column; }
.story-actions-bar { display: flex; align-items: center; justify-content: space-between; padding: 4px 12px; border-bottom: 1px solid var(--gold-dim); background: color-mix(in srgb, var(--c-illya) 2%, transparent); flex-shrink: 0; }
.story-actions-left { display: flex; align-items: center; }
.story-actions-hint { font-size: 10px; font-weight: 600; color: var(--text-label); letter-spacing: 1px; }
.story-actions-right { display: flex; gap: 2px; }
.story-action-btn { width: 28px; height: 28px; border-radius: 50%; border: 1.5px solid transparent; background: transparent; color: var(--text-label); font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; font-family: inherit; }
.story-action-btn:hover { background: color-mix(in srgb, var(--c-illya) 8%, transparent); border-color: var(--gold-dim); color: var(--text-body); }
.story-action-btn.on { background: color-mix(in srgb, var(--c-illya) 12%, transparent); border-color: var(--c-illya); color: var(--c-illya); }
.story-scroll { flex: 1; overflow-y: auto; padding: 24px 32px; }
.story-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: var(--text-label); }
.story-empty-icon { font-size: 3rem; animation: float 3s ease-in-out infinite; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.story-empty-text { font-size: 1.1rem; font-weight: 600; color: var(--text-secondary); }
.story-empty-hint { font-size: 0.85rem; color: var(--text-label); }
.story-scroll-btns { position: absolute; right: 12px; bottom: 80px; display: flex; flex-direction: column; gap: 4px; z-index: 10; }
.scroll-btn { width: 28px; height: 28px; border-radius: 50%; border: 1.5px solid var(--gold-dim); background: rgba(255, 255, 255, 0.85); color: var(--text-label); font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); transition: all 0.2s; font-family: inherit; }
.scroll-btn:hover { background: var(--c-illya); color: #fff; border-color: var(--c-illya); }
</style>