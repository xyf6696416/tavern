<template>
  <div class="panel combat-panel">
    <!-- 标题 -->
    <div class="panel-title">
      <span>⚔️ 战斗系统</span>
      <span v-if="!isFighting" class="badge">待命中</span>
      <span v-else class="badge">回合 {{ store.data.战斗.回合数 }}</span>
    </div>

    <!-- 非战斗状态：设置敌人 -->
    <div v-if="!isFighting" class="setup-section">
      <div class="setup-grid">
        <div class="setup-field">
          <label>敌人名称</label>
          <input v-model="setupName" class="input" placeholder="魔物娘名称" />
        </div>
        <div class="setup-field">
          <label>等级</label>
          <input v-model.number="setupLevel" class="input input-num" type="number" min="1" />
        </div>
        <div class="setup-field">
          <label>生命值</label>
          <input v-model.number="setupHp" class="input input-num" type="number" min="1" />
        </div>
        <div class="setup-field">
          <label>战斗力</label>
          <input v-model.number="setupPower" class="input input-num" type="number" min="1" />
        </div>
        <div class="setup-field">
          <label>恶堕值</label>
          <input v-model.number="setupCorruption" class="input input-num" type="number" min="0" max="100" />
        </div>
      </div>
      <button class="btn btn-gold" @click="startBattle" :disabled="!setupName">⚔️ 开始战斗</button>
    </div>

    <!-- 战斗中 -->
    <div v-else class="battle-scene">
      <!-- 敌我状态栏 -->
      <div class="combatants">
        <!-- 我方 -->
        <div class="combatant-card ally">
          <div class="combatant-header">
            <span class="combatant-name">{{ store.data.主角.姓名 || '主角' }}</span>
            <span class="combatant-level">Lv.{{ store.data.主角.等级 }}</span>
          </div>
          <div class="combatant-stats">
            <div class="cs-row">
              <span class="cs-label">❤️ HP</span>
              <div class="progress-bar">
                <div class="fill" :style="{ width: playerHpPercent + '%', background: playerHpColor }"></div>
                <span class="label">{{ store.data.主角.生命值 }} / {{ store.data.主角.最大生命值 }}</span>
              </div>
            </div>
            <div class="cs-row">
              <span class="cs-label">⚡ 战力</span>
              <span class="cs-val">{{ store.data.主角.战斗力 }}</span>
            </div>
          </div>
        </div>

        <div class="vs-divider">⚔️</div>

        <!-- 敌方 -->
        <div class="combatant-card enemy">
          <div class="combatant-header">
            <span class="combatant-name">{{ store.data.战斗.敌人 }}</span>
            <span class="combatant-level">Lv.{{ store.data.战斗.敌人等级 }}</span>
          </div>
          <div class="combatant-stats">
            <div class="cs-row">
              <span class="cs-label">❤️ HP</span>
              <div class="progress-bar">
                <div class="fill" :style="{ width: enemyHpPercent + '%', background: enemyHpColor }"></div>
                <span class="label">{{ store.data.战斗.敌人生命值 }} / {{ store.data.战斗.敌人最大生命值 }}</span>
              </div>
            </div>
            <div class="cs-row">
              <span class="cs-label">⚡ 战力</span>
              <span class="cs-val">{{ store.data.战斗.敌人战斗力 }}</span>
            </div>
            <div class="cs-row" v-if="store.data.战斗.敌人恶堕值 > 0">
              <span class="cs-label">💀 恶堕</span>
              <span class="cs-val" style="color:var(--c-corruption)">{{ store.data.战斗.敌人恶堕值 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 行动按钮 -->
      <div class="actions">
        <button class="btn btn-primary" @click="doAction('attack')" :disabled="actionLocked">
          ⚡ 普通攻击
        </button>
        <button class="btn btn-primary" @click="doAction('crit')" :disabled="actionLocked">
          🎯 瞄准要害 (70%)
        </button>
        <button class="btn" @click="doAction('defend')" :disabled="actionLocked">
          🛡️ 防御
        </button>
        <button class="btn btn-danger" @click="doAction('flee')" :disabled="actionLocked">
          🏃 逃跑
        </button>
      </div>

      <!-- 战斗日志 -->
      <div class="log-section" v-if="store.data.战斗.战斗日志.length > 0">
        <div class="section-subtitle">📜 战斗记录</div>
        <div ref="logContainer" class="log-container">
          <div v-for="(entry, i) in store.data.战斗.战斗日志" :key="i" class="log-entry" :class="entryClass(entry)">
            {{ entry }}
          </div>
        </div>
      </div>

      <!-- 结束按钮 -->
      <button v-if="battleEnded" class="btn btn-gold end-btn" @click="endBattle">
        战斗结束 — 结算
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../store';

const store = useDataStore();
const logContainer = ref<HTMLDivElement>();

// ── 设置状态 ──
const setupName = ref('');
const setupLevel = ref(10);
const setupHp = ref(80);
const setupPower = ref(80);
const setupCorruption = ref(0);

// ── 计算属性 ──
const isFighting = computed(() => store.data.战斗.进行中);
const battleEnded = computed(() => store.data.战斗.战斗日志.length > 0 &&
  (store.data.主角.生命值 < 10 || store.data.战斗.敌人生命值 < 10));
const actionLocked = computed(() => battleEnded.value);

const playerHpPercent = computed(() =>
  Math.round((store.data.主角.生命值 / Math.max(1, store.data.主角.最大生命值)) * 100)
);
const enemyHpPercent = computed(() =>
  Math.round((store.data.战斗.敌人生命值 / Math.max(1, store.data.战斗.敌人最大生命值)) * 100)
);
const playerHpColor = computed(() => {
  const p = playerHpPercent.value;
  if (p > 60) return 'var(--c-hp-green)';
  if (p > 30) return '#eab308';
  return 'var(--c-corruption)';
});
const enemyHpColor = computed(() => {
  const p = enemyHpPercent.value;
  if (p > 60) return 'var(--c-hp-green)';
  if (p > 30) return '#eab308';
  return 'var(--c-corruption)';
});

function entryClass(entry: string) {
  if (entry.includes('击败') || entry.includes('逃跑')) return 'log-special';
  if (entry.includes('受到') || entry.includes('受伤')) return 'log-damage';
  if (entry.includes('攻击') || entry.includes('造成')) return 'log-attack';
  if (entry.includes('防御')) return 'log-defend';
  return '';
}

// ── 战斗核心逻辑 ──
function startBattle() {
  if (!setupName.value) return;

  store.data.战斗.进行中 = true;
  store.data.战斗.敌人 = setupName.value;
  store.data.战斗.敌人等级 = setupLevel.value;
  store.data.战斗.敌人生命值 = setupHp.value;
  store.data.战斗.敌人最大生命值 = setupHp.value;
  store.data.战斗.敌人战斗力 = setupPower.value;
  store.data.战斗.敌人恶堕值 = setupCorruption.value;
  store.data.战斗.回合数 = 0;
  store.data.战斗.战斗日志 = [];

  addLog(`⚔️ 战斗开始！${store.data.主角.姓名 || '主角'} VS ${store.data.战斗.敌人}`);
  addLog(`📊 等级差: ${levelDiffText()}`);
}

function doAction(action: string) {
  if (battleEnded.value) return;

  store.data.战斗.回合数++;
  const round = store.data.战斗.回合数;
  const playerLv = store.data.主角.等级;
  const enemyLv = store.data.战斗.敌人等级;
  const diff = playerLv - enemyLv;

  // ── 等级差判定 ──
  if (diff < -20) {
    // 绝对压制：直接战败
    addLog(`💀 【绝对压制】${store.data.战斗.敌人}的等级远超你，你被瞬间击溃！`);
    store.data.主角.生命值 = 0;
    battleEnd();
    return;
  }

  // 敌人行动（简单AI）
  const enemyAction = rollEnemyAction();

  // 玩家行动
  let playerDmg = 0;
  let enemyDmg = 0;
  let playerDefending = false;

  switch (action) {
    case 'attack': {
      // 普通攻击
      const baseDmg = Math.round(store.data.主角.战斗力 / 10);
      const variance = roll(0, 5);
      playerDmg = Math.max(1, baseDmg + variance);
      addLog(`⚡ 你对${store.data.战斗.敌人}发动攻击，造成 ${playerDmg} 点伤害`);
      break;
    }
    case 'crit': {
      // 瞄准要害：70%命中
      if (Math.random() < 0.7) {
        const baseDmg = Math.round(store.data.主角.战斗力 / 10);
        const variance = roll(0, 5);
        playerDmg = Math.round((baseDmg + variance) * 1.5);
        addLog(`🎯 瞄准要害！对${store.data.战斗.敌人}造成 ${playerDmg} 点伤害！`);
      } else {
        addLog(`❌ 瞄准要害失败！攻击被躲开了`);
      }
      break;
    }
    case 'defend': {
      playerDefending = true;
      addLog(`🛡️ 你进入防御姿态，本回合受到伤害减半`);
      break;
    }
    case 'flee': {
      const fleeChance = diff >= 0 ? 0.8 : 0.3;
      if (Math.random() < fleeChance) {
        addLog(`🏃 你成功逃离了战斗！`);
        // 逃跑成功，不写入输入栏，直接结束
        store.data.战斗.战斗日志 = [...store.data.战斗.战斗日志, `🏃 你成功逃离了战斗！`];
        resetBattle();
        return;
      } else {
        addLog(`❌ 逃跑失败！`);
      }
      break;
    }
  }

  // 敌人反击
  if (enemyAction === 'attack') {
    const baseDmg = Math.round(store.data.战斗.敌人战斗力 / 10);
    const variance = roll(0, 5);
    enemyDmg = Math.max(1, baseDmg + variance);

    // 劣势修正（玩家等级比敌人低10-20）
    if (diff <= -10 && diff > -20) {
      const penalty = 5;
      enemyDmg += penalty;
      addLog(`⚠️ 等级劣势：敌人额外造成 ${penalty} 点伤害`);
    }

    if (playerDefending) {
      enemyDmg = Math.max(1, Math.round(enemyDmg / 2));
      addLog(`🛡️ 防御姿态使伤害减半！`);
    }

    store.data.主角.生命值 = Math.max(0, store.data.主角.生命值 - enemyDmg);
    addLog(`💥 ${store.data.战斗.敌人}发起反击，你受到 ${enemyDmg} 点伤害`);
  } else {
    addLog(`🛡️ ${store.data.战斗.敌人}进入防御姿态`);
  }

  // 对敌人造成伤害
  if (playerDmg > 0) {
    store.data.战斗.敌人生命值 = Math.max(0, store.data.战斗.敌人生命值 - playerDmg);
  }

  // 胜负判定
  if (store.data.战斗.敌人生命值 < 10) {
    addLog(`🎉 你击败了${store.data.战斗.敌人}！`);
    battleEnd(true);
    return;
  }
  if (store.data.主角.生命值 < 10) {
    addLog(`💀 你失去了战斗力...`);
    battleEnd(false);
    return;
  }

  // 自动滚动日志
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  });
}

function battleEnd(playerWon?: boolean) {
  // 写入结果到输入栏
  let result = `[战斗结束] ${store.data.主角.姓名 || '主角'} VS ${store.data.战斗.敌人}，`;
  if (playerWon === true) {
    result += '玩家胜利！';
    // 经验奖励
    const expGain = Math.round(store.data.战斗.敌人战斗力 / 5);
    store.data.主角.经验值 += expGain;
    result += ` 获得 ${expGain} 经验值`;
  } else if (playerWon === false) {
    result += '玩家战败...';
  } else {
    result += '战斗终止';
  }

  // 把战斗过程拼接成文本
  const logText = store.data.战斗.战斗日志.join('\n');
  const finalText = `${result}\n\n【战斗报告】\n${logText}`;

  // 写入输入栏
  writeToInput(finalText);
}

function resetBattle() {
  store.data.战斗.进行中 = false;
  store.data.战斗.回合数 = 0;
  store.data.战斗.战斗日志 = [];
}

function endBattle() {
  resetBattle();
}

// ── 工具函数 ──
function roll(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addLog(text: string) {
  store.data.战斗.战斗日志 = [...store.data.战斗.战斗日志, text];
}

function levelDiffText(): string {
  const diff = store.data.主角.等级 - store.data.战斗.敌人等级;
  if (diff > 20) return '绝对优势';
  if (diff > 10) return '优势';
  if (diff >= -10) return '均势';
  if (diff >= -20) return '劣势';
  return '绝对劣势';
}

function rollEnemyAction(): string {
  return Math.random() < 0.6 ? 'attack' : 'defend';
}

function writeToInput(text: string) {
  const $textarea = $('#tavern_send_input, #send_textarea, textarea.send_textarea').first();
  if ($textarea.length) {
    $textarea.val(text).trigger('input');
  }
  store.data.战斗._待发送结果 = text;
}
</script>

<style lang="scss" scoped>
.combat-panel {
  // 战斗特有的红色调边框
  border: 1px solid var(--c-crimson);
  box-shadow: inset 0 0 30px rgba(139, 0, 0, 0.1);
}

.setup-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.setup-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.setup-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.setup-field label {
  font-size: 10px;
  color: var(--c-text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.input {
  padding: 4px 8px;
  background: var(--c-bg-dark);
  border: 1px solid var(--c-border);
  color: var(--c-text-primary);
  font-family: var(--font-body);
  font-size: 12px;
  outline: none;
}
.input:focus { border-color: var(--c-crimson-bright); }
.input-num { max-width: 80px; }

/* 战斗场景 */
.combatants {
  display: flex;
  align-items: stretch;
  gap: 8px;
  margin-bottom: 10px;
}
.combatant-card {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--c-border);
  border-radius: 4px;
}
.combatant-card.ally {
  background: rgba(34, 197, 94, 0.05);
  border-color: rgba(34, 197, 94, 0.3);
}
.combatant-card.enemy {
  background: rgba(220, 38, 38, 0.05);
  border-color: rgba(220, 38, 38, 0.3);
}
.combatant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.combatant-name {
  font-weight: bold;
  font-size: 13px;
}
.combatant-level {
  font-size: 11px;
  color: var(--c-text-muted);
}
.combatant-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cs-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.cs-label {
  font-size: 11px;
  min-width: 32px;
  color: var(--c-text-secondary);
}
.cs-val {
  font-weight: bold;
  font-size: 13px;
  color: var(--c-gold);
}
.cs-row .progress-bar {
  flex: 1;
  height: 12px;
}

.vs-divider {
  display: flex;
  align-items: center;
  font-size: 20px;
  color: var(--c-crimson-bright);
  padding: 0 4px;
}

/* 行动按钮 */
.actions {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.actions .btn {
  flex: 1;
  min-width: 80px;
  padding: 6px 8px;
  font-size: 12px;
}

/* 日志 */
.log-section {
  margin-top: 8px;
}
.section-subtitle {
  font-size: 11px;
  font-weight: bold;
  color: var(--c-text-secondary);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.log-container {
  max-height: 160px;
  overflow-y: auto;
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--c-border);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.log-entry {
  font-size: 11px;
  font-family: var(--font-mono);
  padding: 2px 4px;
  border-left: 3px solid var(--c-text-muted);
}
.log-entry.log-attack { border-left-color: var(--c-exp-blue); color: #93c5fd; }
.log-entry.log-damage { border-left-color: var(--c-corruption); color: #fca5a5; }
.log-entry.log-defend { border-left-color: var(--c-hp-green); color: #86efac; }
.log-entry.log-special { border-left-color: var(--c-gold); color: var(--c-gold); font-weight: bold; }

.end-btn {
  width: 100%;
  margin-top: 8px;
  padding: 8px;
  font-size: 14px;
}
</style>