<template>
  <div class="post-container">
    <button class="back-btn" @click="goBack">← 返回</button>
    <div class="post-header">
      <div class="header-icon">💎</div>
      <div class="header-info">
        <div class="header-title">发布招募</div>
        <div class="header-sub">填写以下信息，确认后立即发布</div>
      </div>
    </div>
    <div class="form-body">
      <div class="form-section-title">📋 基本信息</div>
      <div class="form-group">
        <div class="form-label"><span class="required">*</span>招募标题 <span class="counter">{{ form.title.length }}/15</span></div>
        <input v-model="form.title" placeholder="15字以内" maxlength="15" :class="{ 'input-error': showErrors && !form.title }" />
        <span v-if="showErrors && !form.title" class="field-error">请填写招募标题</span>
      </div>
      <div class="form-row">
        <div class="form-group">
          <div class="form-label"><span class="required">*</span>招募类型</div>
          <select v-model="form.type" :class="{ 'input-error': showErrors && !form.type }">
            <option value="">请选择</option>
            <option v-for="t in recruitTypes" :key="t" :value="t">{{ t }}</option>
          </select>
          <span v-if="showErrors && !form.type" class="field-error">请选择招募类型</span>
        </div>
        <div class="form-group">
          <div class="form-label"><span class="required">*</span>人数</div>
          <input v-model.number="form.count" type="number" min="1" max="5" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <div class="form-label"><span class="required">*</span>时间</div>
          <input v-model="form.date" placeholder="例：本周六 19:00" :class="{ 'input-error': showErrors && !form.date }" />
          <span v-if="showErrors && !form.date" class="field-error">请填写时间</span>
        </div>
        <div class="form-group">
          <div class="form-label"><span class="required">*</span>地点</div>
          <input v-model="form.city" placeholder="例：上海·静安" :class="{ 'input-error': showErrors && !form.city }" />
          <span v-if="showErrors && !form.city" class="field-error">请填写地点</span>
        </div>
      </div>
      <div class="form-section-title">🔍 详细要求</div>
      <div class="form-row">
        <div class="form-group">
          <div class="form-label"><span class="required">*</span>年龄范围</div>
          <input v-model="form.ageRange" placeholder="例：20-28岁" :class="{ 'input-error': showErrors && !form.ageRange }" />
          <span v-if="showErrors && !form.ageRange" class="field-error">请填写年龄范围</span>
        </div>
        <div class="form-group">
          <div class="form-label">身材偏好<span class="optional">选填</span></div>
          <input v-model="form.bodyPref" placeholder="不限" />
        </div>
      </div>
      <div class="form-group">
        <div class="form-label">特殊要求<span class="optional">选填</span></div>
        <textarea v-model="form.requirements" rows="3" maxlength="200" placeholder="越具体越容易匹配到合适的人选"></textarea>
      </div>
      <div class="form-section-title">💰 报酬</div>
      <div class="form-group">
        <div class="form-label"><span class="required">*</span>单人报酬（M币）</div>
        <input v-model.number="form.budget" type="number" min="10000" step="1000" placeholder="最低10000" :class="{ 'input-error': showErrors && form.budget < 10000 }" />
        <span v-if="showErrors && form.budget < 10000" class="field-error">最低报酬为 10,000 M币</span>
      </div>
      <div class="calc-section">
        <div class="calc-row">
          <span class="calc-label">总报酬</span>
          <span class="calc-value gold">{{ formatCoin(totalReward) }}</span>
        </div>
        <div class="calc-row">
          <span class="calc-label">平台服务费 (20%)</span>
          <span class="calc-value danger">{{ formatCoin(fee) }}</span>
        </div>
        <div class="calc-row">
          <span class="calc-label">押金 (50%)</span>
          <span class="calc-value gold">{{ formatCoin(deposit) }}</span>
        </div>
        <div class="calc-divider"></div>
        <div class="calc-row">
          <span class="calc-label" style="font-weight:600">合计支出</span>
          <span class="calc-value danger" style="font-size:0.9em">{{ formatCoin(totalCost) }}</span>
        </div>
      </div>
    </div>
    <div class="btn-bar">
      <button class="btn btn-ghost" @click="goBack">取消</button>
      <button class="btn btn-primary" :disabled="submitting" @click="submit">
        <span v-if="submitting" class="btn-spinner" />
        <span v-else>确认发布</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'

const router = useRouter()
const app = useAppStore()

const submitting = ref(false)
const showErrors = ref(false)

const recruitTypes = ['单人约会', '多人聚会', '角色扮演', '道具play', '露出任务', '调教', '摄影', '特殊类型']

const form = reactive({
  title: '', type: '', count: 1, date: '', city: '',
  ageRange: '', bodyPref: '', requirements: '', budget: 0,
})

const canSubmit = computed(() =>
  form.title && form.type && form.date && form.city && form.ageRange && form.budget >= 10000
)

const totalReward = computed(() => form.budget * form.count)
const fee = computed(() => Math.round(totalReward.value * 0.2))
const deposit = computed(() => Math.round(totalReward.value * 0.5))
const totalCost = computed(() => fee.value + deposit.value)

function formatCoin(n: number) {
  if (!n) return '—'
  return n.toLocaleString('zh-CN') + ' M币'
}

function goBack() {
  if (form.title || form.type || form.date) {
    // 有内容时提示确认
    app.addToast('内容未保存，确定离开？', 'warning')
  }
  router.back()
}

async function submit() {
  showErrors.value = true
  if (!canSubmit.value) {
    app.addToast('请填写所有必填项', 'warning')
    return
  }
  submitting.value = true
  await new Promise(r => setTimeout(r, 800))
  app.addToast('✅ 招募发布成功！', 'success')
  submitting.value = false
  router.back()
}
</script>

<style scoped>
.post-container { --gold-main: #c9a96e; --gold-glow: rgba(201,169,110,0.2); --gold-dim: #8b7340; --bg-dark: #121214; --bg-main: #1a1a1f; --bg-card: #222228; --bg-input: #2a2a32; --text-main: #e5e5e7; --text-dim: #9a9a9f; --text-dimmer: #6a6a70; --border: rgba(201,169,110,0.12); --border-input: rgba(255,255,255,0.08); --danger: #f87171; --recruit-header: linear-gradient(135deg,#1a1a1f,#222228); --btn-primary: linear-gradient(135deg,#c9a96e,#8b7340); }
[data-theme="light"] .post-container { --bg-dark: #f5f5f0; --bg-main: #ffffff; --bg-card: #f9f9f6; --bg-input: #f0efe8; --text-main: #1a1a1f; --text-dim: #6b6b70; --text-dimmer: #9a9a9f; --border: rgba(201,169,110,0.2); --border-input: rgba(0,0,0,0.08); --recruit-header: linear-gradient(135deg,#f5f0e8,#faf5ee); --btn-primary: linear-gradient(135deg,#c9a96e,#8b7340); }
.back-btn { background: none; border: none; color: var(--gold-main); font-size: 0.9rem; cursor: pointer; padding: 8px 0; }
.post-container { width: 100%; max-width: 520px; margin: 0 auto; background: var(--bg-dark); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.4); border: 1px solid var(--border); }
.post-header { background: var(--recruit-header); padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; }
.header-icon { width: 36px; height: 36px; background: linear-gradient(135deg,var(--gold-main),var(--gold-dim)); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.header-title { font-size: 1em; font-weight: 600; color: var(--text-main); }
.header-sub { font-size: 0.72em; color: var(--text-dim); }
.form-body { padding: 16px 20px; background: var(--bg-main); }
.form-section-title { font-size: 0.75em; font-weight: 600; color: var(--gold-main); margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 6px; }
.form-group { margin-bottom: 12px; position: relative; }
.form-row { display: flex; gap: 10px; }
.form-row .form-group { flex: 1; }
.form-label { font-size: 0.78em; font-weight: 500; color: var(--text-dim); margin-bottom: 5px; display: flex; align-items: center; gap: 6px; }
.required { color: var(--danger); }
.optional { color: var(--text-dimmer); font-weight: 400; }
.counter { margin-left: auto; color: var(--text-dimmer); font-weight: 400; font-size: 0.9em; }
.field-error { font-size: 0.7em; color: var(--danger); margin-top: 3px; display: block; }
input, select, textarea { width: 100%; background: var(--bg-input); border: 1px solid var(--border-input); border-radius: 8px; padding: 10px 12px; font-size: 0.85em; color: var(--text-main); font-family: inherit; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
input:focus, select:focus, textarea:focus { border-color: var(--gold-main); box-shadow: 0 0 0 3px var(--gold-glow); }
.input-error { border-color: var(--danger) !important; }
textarea { resize: vertical; min-height: 60px; }
select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239a9a9f' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; }
.calc-section { background: var(--bg-card); border-radius: 10px; padding: 12px 14px; border: 1px solid var(--border); margin-top: 8px; }
.calc-row { display: flex; justify-content: space-between; padding: 6px 0; }
.calc-label { font-size: 0.75em; color: var(--text-dim); }
.calc-value { font-size: 0.82em; font-weight: 500; color: var(--text-main); }
.calc-value.gold { color: var(--gold-main); }
.calc-value.danger { color: var(--danger); }
.calc-divider { border-top: 1px solid var(--border); margin: 6px 0; }
.btn-bar { padding: 16px 20px; background: var(--bg-dark); display: flex; gap: 10px; }
.btn { padding: 10px 20px; border-radius: 10px; font-size: 0.85em; font-weight: 600; border: none; cursor: pointer; flex: 1; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px; }
.btn-primary { background: var(--btn-primary); color: #121214; }
.btn-primary:disabled { background: rgba(255,255,255,0.04); color: var(--text-dimmer); cursor: not-allowed; }
.btn-ghost { background: transparent; color: var(--text-dim); }
.btn-spinner { width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.2); border-top-color: #121214; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>