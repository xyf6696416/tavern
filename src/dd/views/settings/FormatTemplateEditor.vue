<template>
  <div class="editor-page">
    <button class="back-btn" @click="$router.back()">← 设置</button>
    <div class="title">格式化模板配置</div>
    <label>页面</label>
    <select v-model="page" class="page-select">
      <option v-for="p in pages" :key="p" :value="p">{{ pageLabels[p] || p }}</option>
    </select>
    <label>模板</label>
    <textarea v-model="content" rows="12" class="template-area"></textarea>
    <div class="btns">
      <button class="reset-btn" @click="reset">恢复默认</button>
      <button class="save-btn" @click="save">保存</button>
    </div>
    <div class="hint">💡 提示：{变量} 在运行时替换为实际数据</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAppStore } from '../../stores/app'
import { DEFAULT_FORMAT_TEMPLATES } from '../../types/mlife'

const appStore = useAppStore()
const pages = Object.keys(DEFAULT_FORMAT_TEMPLATES)
const pageLabels: Record<string, string> = {
  home: '🏠 首页', match: '♡ 匹配', matchDetail: '♡ 匹配详情',
  dm: '✉ 私信', dmContacts: '✉ 私信联系人', live: '▶ 直播列表',
  liveRoom: '▶ 直播间', recruit: '💎 招募广场', recruitDetail: '💎 招募详情',
  recruitPost: '✏️ 发布招募', recruitManage: '📊 我的管理',
  profile: '☺ 个人中心', selfie: '📸 福利自拍', chat: '💬 闲聊灌水',
  resource: '📦 资源分享', goddess: '👑 女神夜话', unbox: '🔓 开盒', user: '👤 账号',
}
const page = ref('home')
const content = ref(appStore.getFormatTemplate('home') || DEFAULT_FORMAT_TEMPLATES.home)

watch(page, (p) => { content.value = appStore.getFormatTemplate(p) || DEFAULT_FORMAT_TEMPLATES[p] || '' })
function save() { appStore.saveFormatTemplate(page.value, content.value); appStore.addToast('保存成功', 'success') }
function reset() { appStore.resetFormatTemplate(page.value); content.value = DEFAULT_FORMAT_TEMPLATES[page.value] || ''; appStore.addToast('已恢复默认', 'info') }
</script>

<style scoped>
.editor-page { padding: 4px 0; }
.back-btn { background: none; border: none; color: var(--ml-primary); font-size: 0.9rem; cursor: pointer; margin-bottom: 12px; padding: 0; }
.title { font-weight: 600; margin-bottom: 14px; }
label { display: block; font-size: 0.8rem; color: var(--ml-text-secondary); margin: 10px 0 4px; }
select, textarea { width: 100%; padding: 8px; border: 1px solid var(--ml-divider); border-radius: 6px; background: var(--ml-bg-input); color: var(--ml-text); font-size: 0.85rem; font-family: monospace; }
textarea { resize: vertical; line-height: 1.5; }
.btns { display: flex; gap: 10px; margin-top: 12px; }
.reset-btn { flex: 1; padding: 10px; background: var(--ml-bg-input); color: var(--ml-text); border: none; border-radius: 8px; cursor: pointer; }
.save-btn { flex: 1; padding: 10px; background: var(--ml-primary); color: #fff; border: none; border-radius: 8px; cursor: pointer; }
.hint { margin-top: 12px; font-size: 0.8rem; color: var(--ml-text-secondary); }
</style>
