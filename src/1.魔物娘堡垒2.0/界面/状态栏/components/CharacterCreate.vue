<template>
  <div class="create-screen">
    <canvas ref="bgCanvas" class="bg-canvas"></canvas>
    <div class="glow-orb glow-orb-1"></div>
    <div class="glow-orb glow-orb-2"></div>

    <div class="create-content">
      <!-- 顶部装饰 -->
      <div class="ornament-row">
        <span class="orn-sym">⬥</span>
        <span class="orn-line"></span>
        <span class="orn-sym">⬥</span>
        <span class="orn-line"></span>
        <span class="orn-sym">⬥</span>
      </div>

      <!-- 步骤指示器 -->
      <div class="step-indicator">
        <div v-for="(s, i) in steps" :key="i" class="step-dot" :class="{ active: step === i, done: step > i }">
          <span class="step-num">{{ i + 1 }}</span>
        </div>
        <div class="step-line" :style="{ width: ((step) / (steps.length - 1)) * 100 + '%' }"></div>
      </div>

      <!-- 过渡容器 -->
      <div class="step-panel-wrapper">
        <!-- ════ 第1步：性别 ════ -->
        <div v-if="step === 0" key="step0" class="step-panel">
          <h2 class="step-title">选择你的性别</h2>
          <p class="step-desc">一团光芒在你面前分裂，呈现出两种形态。</p>
          <div class="card-row">
            <button v-for="g in genders" :key="g.value" class="pick-card" :class="{ selected: form.性别 === g.value }" @click="form.性别 = g.value; nextStep()">
              <span class="pick-icon">{{ g.icon }}</span>
              <span class="pick-label">{{ g.label }}</span>
            </button>
          </div>
        </div>

        <!-- ════ 第2步：种族 + 职业 ════ -->
        <div v-if="step === 1" key="step1" class="step-panel">
          <h2 class="step-title">种族与职业</h2>
          <p class="step-desc">另一团光芒幻化出不同的影像。</p>

          <div class="section-label">种族</div>
          <div class="card-row">
            <button v-for="r in races" :key="r.value" class="pick-card pick-sm" :class="{ selected: form.种族 === r.value }" @click="form.种族 = r.value">
              <span class="pick-icon">{{ r.icon }}</span>
              <span class="pick-label">{{ r.label }}</span>
            </button>
          </div>

          <div class="section-label" style="margin-top:10px">职业</div>
          <div class="card-row">
            <button v-for="j in jobs" :key="j.value" class="pick-card pick-sm" :class="{ selected: form.职业 === j.value }" @click="form.职业 = j.value">
              <span class="pick-icon">{{ j.icon }}</span>
              <span class="pick-label">{{ j.label }}</span>
            </button>
          </div>

          <button class="btn-next" :disabled="!form.种族 || !form.职业" @click="nextStep()">下一步 →</button>
        </div>

        <!-- ════ 第3步：开局 + 地点 ════ -->
        <div v-if="step === 2" key="step2" class="step-panel">
          <h2 class="step-title">开局与降临</h2>
          <p class="step-desc">一团光芒展现了你降临的起步与坐标。</p>

          <div class="section-label">开局类型</div>
          <div class="card-row">
            <button v-for="s in starts" :key="s.value" class="pick-card pick-sm" :class="{ selected: form.开局 === s.value }" @click="form.开局 = s.value">
              <span class="pick-icon">{{ s.icon }}</span>
              <span class="pick-label">{{ s.label }}</span>
            </button>
          </div>

          <div class="section-label" style="margin-top:10px">降临地点</div>
          <div class="location-grid">
            <button v-for="loc in locations" :key="loc.value" class="pick-card pick-loc" :class="{ selected: form.地点 === loc.value }" @click="form.地点 = loc.value">
              <span class="loc-icon">{{ loc.icon }}</span>
              <span class="loc-name">{{ loc.label }}</span>
              <span class="loc-tag" :class="loc.tagClass">{{ loc.tag }}</span>
            </button>
          </div>

          <button class="btn-next" :disabled="!form.开局 || !form.地点" @click="nextStep()">下一步 →</button>
        </div>

        <!-- ════ 第4步：韵律 + 确认 ════ -->
        <div v-if="step === 3" key="step3" class="step-panel">
          <h2 class="step-title">灵魂韵律</h2>
          <p class="step-desc">"每个灵魂都有其独特的韵律…请选择与你共鸣的韵律。"</p>

          <div class="tag-grid">
            <button v-for="t in rhythms" :key="t" class="tag-btn" :class="{ selected: form.韵律.includes(t) }" @click="toggleRhythm(t)">
              {{ t }}
            </button>
          </div>

          <div class="confirm-panel">
            <div class="confirm-title">确认角色设定</div>
            <div class="confirm-grid">
              <div class="cf-row"><span class="cf-label">姓名</span><span class="cf-val">{{ playerName }}</span></div>
              <div class="cf-row"><span class="cf-label">性别</span><span class="cf-val">{{ form.性别 }}</span></div>
              <div class="cf-row"><span class="cf-label">种族</span><span class="cf-val">{{ form.种族 }}</span></div>
              <div class="cf-row"><span class="cf-label">职业</span><span class="cf-val">{{ form.职业 }}</span></div>
              <div class="cf-row"><span class="cf-label">开局</span><span class="cf-val">{{ startLabel }}（Lv.{{ levelMap[form.开局] }}）</span></div>
              <div class="cf-row"><span class="cf-label">降临</span><span class="cf-val">{{ form.地点 }}</span></div>
              <div class="cf-row"><span class="cf-label">韵律</span><span class="cf-val">{{ form.韵律.length > 0 ? form.韵律.join('、') : '无' }}</span></div>
            </div>

            <button class="btn-commit" :disabled="sending" @click="confirmCreate">
              <span class="commit-icon">⬥</span>
              <span class="commit-label">降临诺亚之城</span>
              <span class="commit-icon">⬥</span>
            </button>
          </div>
        </div>
      </Transition>

      <!-- 底部装饰 -->
        <span class="orn-sym">⬥</span>
        <span class="orn-line"></span>
        <span class="orn-sym">⬥</span>
        <span class="orn-line"></span>
        <span class="orn-sym">⬥</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';

const emit = defineEmits<{ done: [] }>();

// ── 步骤 ──
const steps = ['性别', '种族+职业', '开局+地点', '韵律+确认'];
const step = ref(0);

function nextStep() {
  if (step.value < 3) step.value++;
}

// ── 玩家名 ──
const playerName = computed(() => {
  try {
    return (window as any).SillyTavern?.name1 || '冒险者';
  } catch { return '冒险者'; }
});

// ── 表单数据 ──
const form = ref({
  性别: '',
  种族: '',
  职业: '',
  开局: '',
  地点: '',
  韵律: [] as string[],
});

// ── 选项数据 ──
const genders = [
  { icon: '🚹', label: '男性', value: '男' },
  { icon: '🚺', label: '女性', value: '女' },
  { icon: '⚧️', label: '扶她', value: '扶她' },
];

const races = [
  { icon: '🧑', label: '人类', value: '人类' },
  { icon: '🧝', label: '精灵', value: '精灵' },
  { icon: '🕊️', label: '光明魔物娘', value: '光明魔物娘' },
];

const jobs = [
  { icon: '⚔️', label: '战士类\n（佣兵/刺客/勇者）', value: '战士类' },
  { icon: '🔮', label: '法师类\n（法师/牧师/圣女）', value: '法师类' },
  { icon: '🏹', label: '猎魔人\n（阴阳师/魔法少女/巫女/驱魔师）', value: '猎魔人' },
  { icon: '👑', label: '政客\n（市长/警察/军队）', value: '政客' },
];

const starts = [
  { icon: '🌱', label: '贫瘠开局', value: '贫瘠' },
  { icon: '📖', label: '普通开局', value: '普通' },
  { icon: '💰', label: '豪华开局', value: '豪华' },
  { icon: '🔥', label: '传奇开局', value: '传奇' },
];

const levelMap: Record<string, number> = { 贫瘠: 1, 普通: 10, 豪华: 20, 传奇: 30 };
const moneyMap: Record<string, number> = { 贫瘠: 200, 普通: 500, 豪华: 2000, 传奇: 5000 };
const powerMap: Record<string, number> = { 贫瘠: 10, 普通: 50, 豪华: 150, 传奇: 300 };
const startLabel = computed(() => {
  const s = starts.find(x => x.value === form.value.开局);
  return s ? s.label : '';
});

const locations = [
  { icon: '⛪', label: '安全区（教堂/协会）', value: '安全区', tag: '安全', tagClass: 'safe' },
  { icon: '🏛️', label: '诺亚之心广场', value: '诺亚之心广场', tag: '安全', tagClass: 'safe' },
  { icon: '🌙', label: '月隐神社', value: '月隐神社', tag: '中立', tagClass: 'pseudo' },
  { icon: '🍷', label: '红月酒吧', value: '红月酒吧', tag: '危险', tagClass: 'danger' },
  { icon: '🏥', label: '诺亚医院', value: '诺亚医院', tag: '危险', tagClass: 'danger' },
  { icon: '🕯️', label: '光明神殿', value: '光明神殿', tag: '中立', tagClass: 'pseudo' },
  { icon: '🌹', label: '魅魔之巢', value: '魅魔之巢', tag: '危险', tagClass: 'danger' },
  { icon: '🏠', label: '温暖之家', value: '温暖之家', tag: '危险', tagClass: 'danger' },
  { icon: '🌿', label: '迷失乐园', value: '迷失乐园', tag: '危险', tagClass: 'danger' },
  { icon: '💧', label: '欲望下水道', value: '欲望下水道', tag: '危险', tagClass: 'danger' },
  { icon: '🏚️', label: '恶魔公馆', value: '恶魔公馆', tag: '危险', tagClass: 'danger' },
  { icon: '🌾', label: '丰饶牧场', value: '丰饶牧场', tag: '危险', tagClass: 'danger' },
  { icon: '🔬', label: '崩坏实验室', value: '崩坏实验室', tag: '危险', tagClass: 'danger' },
  { icon: '🕸️', label: '堕落虫窟', value: '堕落虫窟', tag: '危险', tagClass: 'danger' },
  { icon: '🎲', label: '随机地点', value: '随机', tag: '随机', tagClass: 'special' },
];

const rhythms = [
  '母性崇拜', '足控', '腋控', '气味癖', '虫类恐惧症', '声音诱惑',
  '触手亲和', '巨物崇拜/恐惧', '皮物迷恋', '体液迷恋', '催眠易感',
  '疼痛爱好者', '羞耻暴露癖', '人偶化倾向', '禁闭空间偏好', '圣洁玷污欲',
  '家畜化愿望', '年龄倒退偏好', '雌堕向往', '灌肠/排泄控制', '乳首开放',
  '恋物癖', '药物敏感',
];

function toggleRhythm(t: string) {
  const idx = form.value.韵律.indexOf(t);
  if (idx >= 0) {
    form.value.韵律.splice(idx, 1);
  } else {
    form.value.韵律.push(t);
  }
}

// ── 发送 ──
const sending = ref(false);

async function confirmCreate() {
  if (sending.value) return;
  sending.value = true;

  try {
    // 1. 读取第0层变量
    const initialData = Mvu.getMvuData({ type: 'message', message_id: 0 });
    const statData = _.cloneDeep(_.get(initialData, 'stat_data', {}));

    // 2. 覆盖玩家选择
    _.set(statData, '主角.姓名', playerName.value);
    _.set(statData, '主角.性别', form.value.性别);
    _.set(statData, '主角.种族', form.value.种族);
    _.set(statData, '主角.职业', form.value.职业);
    _.set(statData, '主角.阵营', '光明');
    _.set(statData, '主角.等级', levelMap[form.value.开局]);
    _.set(statData, '主角.金钱', moneyMap[form.value.开局]);
    _.set(statData, '主角.战斗力', powerMap[form.value.开局]);
    _.set(statData, '主角.状态', form.value.韵律.join('、'));
    _.set(statData, '世界.当前地点', form.value.地点);

    // 3. 组装确认文本填入输入框
    const summary = [
      `【角色设定确认】`,
      `姓名：${playerName.value}`,
      `性别：${form.value.性别}`,
      `种族：${form.value.种族}`,
      `职业：${form.value.职业}`,
      `阵营：光明`,
      `等级：${levelMap[form.value.开局]} | 金钱：${moneyMap[form.value.开局]} | 战斗力：${powerMap[form.value.开局]}`,
      `韵律：${form.value.韵律.length > 0 ? form.value.韵律.join('、') : '无'}`,
      `降临地点：${form.value.地点}`,
      ``,
      `请确认以上信息，输入"开始游戏"开启你的冒险！`,
    ].join('\n');

    const $textarea = $('#tavern_send_input, #send_textarea, textarea.send_textarea').first();
    if ($textarea.length) {
      $textarea.val(summary).trigger('input');
    }

    // 4. 创建第0层消息（只写变量，不写开场白）
    await createChatMessages([{
      role: 'assistant',
      message: '',
      data: { stat_data: statData },
    }]);

    // 5. 跳转游戏界面
    emit('done');
  } catch (e) {
    console.error('创建角色失败:', e);
    toastr.error('创建角色失败，请重试');
  } finally {
    sending.value = false;
  }
}

// ── 背景粒子 ──
const bgCanvas = ref<HTMLCanvasElement>();
onMounted(() => {
  const canvas = bgCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const resize = () => { canvas.width = canvas.parentElement?.clientWidth || 760; canvas.height = canvas.parentElement?.clientHeight || 520; };
  resize();
  window.addEventListener('resize', resize);
  const particles: any[] = [];
  for (let i = 0; i < 40; i++) {
    particles.push({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 0.5, alpha: Math.random() * 0.3 + 0.05, pulse: Math.random() * Math.PI * 2,
    });
  }
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.pulse += 0.015;
      const a = p.alpha * (0.5 + 0.5 * Math.sin(p.pulse));
      if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(139, 92, 246, ${a})`; ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
});
</script>

<style lang="scss" scoped>
.create-screen {
  width: 100%; max-width: 760px; margin: 0 auto;
  background: linear-gradient(180deg, #1a0f1e 0%, #0d0710 50%, #1a0f1e 100%);
  border: 2px solid var(--c-border);
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.15), inset 0 0 80px rgba(0,0,0,0.5);
  font-family: var(--font-body); color: var(--c-text-primary);
  overflow: hidden; position: relative; min-height: 480px;
  display: flex; flex-direction: column; align-items: center;
}
.bg-canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
.glow-orb {
  position: absolute; border-radius: 50%; filter: blur(60px); pointer-events: none; z-index: 0;
}
.glow-orb-1 { width: 300px; height: 300px; background: radial-gradient(circle, rgba(139, 92, 246, 0.12), transparent); top: -80px; right: -80px; animation: orbFloat1 8s ease-in-out infinite; }
.glow-orb-2 { width: 250px; height: 250px; background: radial-gradient(circle, rgba(212, 168, 67, 0.08), transparent); bottom: -60px; left: -60px; animation: orbFloat2 10s ease-in-out infinite; }
@keyframes orbFloat1 { 0%,100%{transform:translate(0,0)scale(1)} 33%{transform:translate(-30px,30px)scale(1.1)} 66%{transform:translate(20px,50px)scale(0.9)} }
@keyframes orbFloat2 { 0%,100%{transform:translate(0,0)scale(1)} 33%{transform:translate(30px,-20px)scale(1.15)} 66%{transform:translate(-20px,-40px)scale(0.85)} }

.create-content { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; padding: 20px; gap: 10px; width: 100%; }

.ornament-row { display: flex; align-items: center; gap: 8px; }
.orn-sym { color: var(--c-gold-dim); font-size: 14px; animation: ornPulse 2s ease-in-out infinite; }
.orn-line { width: 60px; height: 1px; background: linear-gradient(90deg, transparent, var(--c-gold-dim), transparent); }
@keyframes ornPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }

/* ── 步骤指示器 ── */
.step-indicator { display: flex; align-items: center; gap: 0; position: relative; width: 200px; height: 24px; margin: 4px 0; }
.step-line { position: absolute; top: 50%; left: 12px; right: 12px; height: 2px; background: var(--c-border); transition: width 0.4s ease; z-index: 0; }
.step-dot {
  position: relative; z-index: 1; width: 24px; height: 24px; border-radius: 50%;
  background: var(--c-bg-dark); border: 2px solid var(--c-border);
  display: flex; align-items: center; justify-content: center; cursor: default;
  transition: all 0.3s; margin: 0 auto;
}
.step-dot.active { border-color: var(--c-gold); background: var(--c-bg-elevated); box-shadow: 0 0 8px rgba(212,168,67,0.3); }
.step-dot.done { border-color: var(--c-gold-dim); background: var(--c-gold-dim); }
.step-num { font-size: 11px; font-weight: bold; color: var(--c-text-muted); }
.step-dot.active .step-num { color: var(--c-gold); }
.step-dot.done .step-num { color: #1a0f1e; }

/* ── 步骤过渡 ── */
.step-fade-enter-active, .step-fade-leave-active { transition: all 0.25s ease; }
.step-fade-enter-from { opacity: 0; transform: translateX(20px); }
.step-fade-leave-to { opacity: 0; transform: translateX(-20px); }

.step-panel { width: 100%; max-width: 600px; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 8px 0; }
.step-title { font-family: var(--font-display); font-size: 20px; color: var(--c-gold); letter-spacing: 3px; text-shadow: 0 0 15px rgba(212,168,67,0.3); text-align: center; }
.step-desc { font-size: 12px; color: var(--c-text-secondary); text-align: center; font-style: italic; margin-bottom: 4px; }
.section-label { font-size: 11px; color: var(--c-text-muted); text-transform: uppercase; letter-spacing: 2px; align-self: flex-start; margin-bottom: 2px; }

/* ── 卡片选择 ── */
.card-row { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; width: 100%; }
.pick-card {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 12px 16px; background: rgba(0,0,0,0.2); border: 2px solid var(--c-border);
  cursor: pointer; transition: all 0.2s; font-family: var(--font-body);
  min-width: 100px; flex: 1;
}
.pick-card:hover { border-color: var(--c-border-bright); background: rgba(139,92,246,0.1); }
.pick-card.selected { border-color: var(--c-gold); background: rgba(212,168,67,0.1); box-shadow: 0 0 12px rgba(212,168,67,0.2); }
.pick-sm { padding: 10px 12px; min-width: 80px; }
.pick-icon { font-size: 24px; }
.pick-label { font-size: 12px; color: var(--c-text-primary); font-weight: bold; text-align: center; white-space: pre-line; line-height: 1.3; }

/* ── 地点网格 ── */
.location-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 6px; width: 100%; }
.pick-loc { padding: 8px; min-width: 0; flex-direction: row; flex-wrap: wrap; gap: 4px; }
.loc-icon { font-size: 16px; }
.loc-name { font-size: 11px; font-weight: bold; flex: 1; text-align: left; }
.loc-tag { font-size: 9px; padding: 1px 4px; border-radius: 2px; font-weight: bold; }
.loc-tag.safe { background: rgba(34,197,94,0.2); color: #4ade80; border: 1px solid #22c55e; }
.loc-tag.pseudo { background: rgba(234,179,8,0.2); color: #eab308; border: 1px solid #eab308; }
.loc-tag.danger { background: rgba(220,38,38,0.2); color: #f87171; border: 1px solid #dc2626; }
.loc-tag.special { background: rgba(168,85,247,0.2); color: #c084fc; border: 1px solid #a855f7; }

/* ── 下一步按钮 ── */
.btn-next {
  margin-top: 10px; padding: 8px 24px; border: 2px solid var(--c-gold-dim);
  background: transparent; color: var(--c-gold); font-family: var(--font-display);
  font-size: 14px; cursor: pointer; transition: all 0.2s; letter-spacing: 2px;
}
.btn-next:hover:not(:disabled) { background: rgba(212,168,67,0.1); border-color: var(--c-gold); box-shadow: 0 0 12px rgba(212,168,67,0.2); }
.btn-next:disabled { opacity: 0.3; cursor: not-allowed; }

/* ── 韵律标签 ── */
.tag-grid { display: flex; flex-wrap: wrap; gap: 5px; justify-content: center; width: 100%; }
.tag-btn {
  padding: 5px 10px; font-size: 11px; border: 1px solid var(--c-border);
  background: rgba(0,0,0,0.15); color: var(--c-text-secondary); cursor: pointer;
  transition: all 0.2s; font-family: var(--font-body); border-radius: 2px;
}
.tag-btn:hover { border-color: var(--c-border-bright); color: var(--c-text-primary); }
.tag-btn.selected { border-color: var(--c-purple); background: rgba(139,92,246,0.2); color: var(--c-text-primary); }

/* ── 确认面板 ── */
.confirm-panel {
  width: 100%; max-width: 400px; margin-top: 8px;
  background: rgba(0,0,0,0.25); border: 1px solid var(--c-border); padding: 12px;
}
.confirm-title { font-family: var(--font-display); font-size: 13px; color: var(--c-gold); text-align: center; letter-spacing: 2px; margin-bottom: 8px; }
.confirm-grid { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
.cf-row { display: flex; padding: 4px 8px; background: rgba(0,0,0,0.15); font-size: 12px; }
.cf-label { color: var(--c-text-muted); min-width: 50px; letter-spacing: 1px; }
.cf-val { flex: 1; text-align: right; color: var(--c-text-primary); font-weight: bold; }

.btn-commit {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 10px; border: 2px solid var(--c-gold-dim);
  background: linear-gradient(135deg, rgba(212,168,67,0.1), rgba(212,168,67,0.05));
  cursor: pointer; transition: all 0.3s; font-family: var(--font-display);
}
.btn-commit:hover:not(:disabled) { border-color: var(--c-gold); background: linear-gradient(135deg, rgba(212,168,67,0.2), rgba(212,168,67,0.1)); box-shadow: 0 0 15px rgba(212,168,67,0.2); }
.btn-commit:disabled { opacity: 0.3; cursor: not-allowed; }
.commit-icon { color: var(--c-gold-dim); font-size: 14px; }
.commit-label { font-size: 16px; color: var(--c-gold); letter-spacing: 4px; font-weight: bold; }
</style>