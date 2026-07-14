/* ═══════════════════════════════════════════════════
   store.ts — 伊莉雅主界面状态管理（MVU 版本）
   ═══════════════════════════════════════════════════ */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  autoFix,
  schedulePostAiVerify,
  startPolling,
  verify,
  type VerifyResult
} from '../bridge/verify'
import { Schema } from '../schema'

/** 剧情偏向 toggle */
export interface PlotBias {
  forceExit: boolean
  encourage: boolean
  forbidNsfw: boolean
  forbidDespair: boolean
}

/** 底部模式 */
export type BottomMode = 'tools' | 'options' | 'move'

/** AI 选项 */
export interface Choice {
  text: string
}

/** 伊莉雅的服装列表 */
export const ILLYA_OUTFITS = [
  '魔法少女服', '制服', '私服', '睡衣', '水着',
  '卫宫邸服', '校服', '运动服', '体操服', '泳装',
  '连衣裙', '女仆装', '浴衣', '圣诞服', '兔女郎',
  '学园泳衣', '战斗服', '斗篷', '和服', '雨衣',
]

/** 伊莉雅的表情列表 */
export const ILLYA_EXPRESSIONS = [
  '微笑', '高兴', '调皮', '害羞', '撒娇',
  '生气', '哭泣', '害怕', '惊讶', '认真',
  '发呆', '黑化微笑', '空洞', '性奋',
]

/** 性格标签 */
export const PERSONALITY_TAGS: Record<string, string[]> = {
  '伊莉雅': ['天真烂漫', '调皮捣蛋', '喜欢撒娇', '正义感强', '怕寂寞'],
  '美游': ['文静内向', '温柔体贴', '喜欢读书', '坚定意志', '害羞'],
  '小黑': ['活泼奔放', '大胆直率', '喜欢恶作剧', '黏人', '保护欲强'],
  '士郎': ['正义的伙伴', '老好人', '厨艺精湛', '滥好人', '固执'],
  'user': ['自由探索', '随心所欲'],
}

export const APP_VERSION = 'v2.1'

export const CHARACTER_LIST = [
  { id: '伊莉雅', label: '伊莉雅', icon: '♥', color: '#C71585' },
  { id: '美游', label: '美游', icon: '🌙', color: '#D4459A' },
  { id: '小黑', label: '小黑', icon: '🔥', color: '#FF8C00' },
  { id: '士郎', label: '士郎', icon: '🛡️', color: '#6BB8D4' },
  { id: 'user', label: '轻音', icon: '🎵', color: '#66BB6A' },
]

export const DEV_STAGES = [
  { key: '1-探索', label: '探索初期', pct: 25 },
  { key: '2-适应', label: '适应期', pct: 50 },
  { key: '3-沉溺', label: '快感认知', pct: 75 },
  { key: '4-完成', label: '完全开发', pct: 100 },
]

export const useGameStore = defineStore('illyaGame', () => {
  /* ─── 核心数据 ─── */

  /** 完整 stat_data — 通过 MVU 变量读取 */
  const statData = ref<Record<string, any>>({})

  /** 数据是否就绪 */
  const ready = ref(false)

  /** 当前选中角色 ID */
  const currentCharId = ref('伊莉雅')

  /** 底部控制栏模式 */
  const currentMode = ref<BottomMode>('options')

  /** 剧情偏向 */
  const plotBias = ref<PlotBias>({
    forceExit: false,
    encourage: false,
    forbidNsfw: false,
    forbidDespair: false,
  })

  /* ─── 衣装 & 表情 ─── */

  const currentOutfit = ref('魔法少女服')
  const currentExpression = ref('微笑')
  const showOutfitPanel = ref(false)
  const showExpressionPanel = ref(false)

  /* ─── 游戏阶段 ─── */

  /** 是否显示标题界面 */
  const showTitle = ref(true)

  /** 游戏阶段 */
  const gamePhase = ref<'title' | 'playing'>('title')

  /** 从标题界面进入主界面 */
  function startGame() {
    gamePhase.value = 'playing'
    showTitle.value = false
    // 进入主界面后初始化数据
    init()
  }

  const showTutorial = ref(localStorage.getItem('illya_tutorial_dismissed') !== 'true')
  const tutorialStep = ref(0)

  /* ─── 对话状态 ─── */

  const storyText = ref('')
  const choices = ref<Choice[]>([])
  const isAiLoading = ref(false)
  const typingComplete = ref(false)

  /* ─── 活动区域/设施列表 ─── */

  const areas = {
    school: {
      label: '穗群原学园',
      icon: '🏫',
      facilities: [
        { id: 'classroom', label: '教室', icon: '📚' },
        { id: 'rooftop', label: '天台', icon: '🌤️' },
        { id: 'library', label: '图书馆', icon: '📖' },
        { id: 'playground', label: '操场', icon: '⚽' },
        { id: 'cafeteria', label: '食堂', icon: '🍞' },
      ],
    },
    dormitory: {
      label: '宿舍区',
      icon: '🏠',
      facilities: [
        { id: 'girls_dorm', label: '女生宿舍', icon: '💝' },
        { id: 'boys_dorm', label: '男生宿舍', icon: '💙' },
      ],
    },
    shopping: {
      label: '商店街',
      icon: '🏪',
      facilities: [
        { id: 'street', label: '商业街', icon: '🛍️' },
        { id: 'arcade', label: '游戏厅', icon: '🎮' },
      ],
    },
    emiya_house: {
      label: '卫宫邸',
      icon: '🏡',
      facilities: [
        { id: 'living_room', label: '客厅', icon: '🛋️' },
        { id: 'dojo', label: '道场', icon: '⚔️' },
      ],
    },
  }

  /* ─── 计算属性 ─── */

  const currentChar = computed(() => statData.value[currentCharId.value] ?? {})

  const charIds = computed(() => {
    const exclude = ['世界', '_变量', '_flags', '状态栏']
    return Object.keys(statData.value).filter(k => !exclude.includes(k))
  })

  const currentCharLabel = computed(() => {
    return CHARACTER_LIST.find(c => c.id === currentCharId.value)?.label ?? currentCharId.value
  })

  const currentCharIcon = computed(() => {
    return CHARACTER_LIST.find(c => c.id === currentCharId.value)?.icon ?? '♥'
  })

  const currentCharColor = computed(() => {
    return CHARACTER_LIST.find(c => c.id === currentCharId.value)?.color ?? '#C71585'
  })

  /** 全局状态栏（日期时间） — 优先从 世界 字段读取，兼容旧 状态栏 字段 */
  const statusBar = computed(() => {
    const w = statData.value['世界']
    if (w && w.当前日期) {
      return {
        日期和时间: `⏰ ${w.当前日期 ?? '--'} ${w.当前星期 ?? ''} ${w.当前时间 ?? ''}`
      }
    }
    // 兼容旧格式
    const old = statData.value['状态栏']
    return old ?? { 日期和时间: '--' }
  })

  /** 当前角色的开发记录 */
  const devRecords = computed(() => currentChar.value['开发记录'] ?? {})

  /** 列表是否显示校验状态指示器 */
  const showVerifyIndicator = ref(false)

  /** 最近一次校验结果 */
  const lastVerifyResult = ref<VerifyResult | null>(null)

  /** 校验状态摘要 */
  const verifySummary = computed(() => {
    const r = lastVerifyResult.value
    if (!r) return { text: '未校验', status: 'idle' }
    if (!r.hasDiff) return { text: `✓ ${r.matchFields}/${r.totalFields}`, status: 'ok' }
    const critical = r.diffs.filter(d => d.severity === 'critical').length
    const warnings = r.diffs.filter(d => d.severity === 'warning').length
    if (critical > 0) return { text: `✗ ${critical}严重+${warnings}警告`, status: 'error' }
    if (warnings > 0) return { text: `⚠ ${warnings}处差异`, status: 'warn' }
    return { text: `ℹ ${r.diffs.length}处`, status: 'info' }
  })
  const personalityTags = computed(() => PERSONALITY_TAGS[currentCharId.value] ?? [])

  /* ─── 方法 ─── */

  /** 初始化：通过 MVU 框架读取 stat_data，启动交叉验证 */
  async function init() {
    try {
      if (typeof Mvu !== 'undefined' && typeof Mvu.getMvuData !== 'undefined') {
        const variables = Mvu.getMvuData({ type: 'message', message_id: getCurrentMessageId() });
        const raw = _.get(variables, 'stat_data', {});
        statData.value = Schema.parse(raw);
        console.info('[伊莉雅界面] MVU stat_data 已加载并校验');
      } else {
        const vars = getVariables({ type: 'message' });
        statData.value = Schema.parse(_.get(vars, 'stat_data', {}));
      }

      // 启动交叉验证：先做一次全量校验
      const result = verify(statData.value);
      lastVerifyResult.value = result;

      // 如果有差异，自动修复
      if (result.hasDiff) {
        const { fixed, newData } = autoFix(statData.value);
        if (fixed) statData.value = newData;
      }

      // 启动定时轮询
      startPolling(
        () => statData.value,
        (newData) => { statData.value = newData },
      );

      // 设置日志回调
      const { setLogCallback } = await import('../bridge/verify');
      setLogCallback((entry) => {
        if (entry.level === 'warn' || entry.level === 'error') {
          console.info(`[交叉验证] ${entry.level}: ${entry.message}`);
        }
      });
    } catch (e) {
      console.warn('[伊莉雅界面] 读取 stat_data 失败', e);
    }
    ready.value = true;
  }

  /** 切换到指定角色 */
  function switchCharacter(charId: string) {
    if (charId !== currentCharId.value && statData.value[charId]) {
      currentCharId.value = charId
      // 切换到新角色时，从穿搭字段尝试匹配服装预设
      const outfitFromData = statData.value[charId]?.穿搭 ?? ''
      const matched = ILLYA_OUTFITS.find(o => outfitFromData.includes(o))
      currentOutfit.value = matched ?? '魔法少女服'
      currentExpression.value = '微笑'
    }
  }

  function setOutfit(outfit: string) { currentOutfit.value = outfit }
  function setExpression(expression: string) { currentExpression.value = expression }

  /** 从 stat_data 的 穿搭 字段同步前端服装选择器 */
  function syncOutfitFromStatData() {
    const outfitText = currentChar.value?.穿搭 ?? ''
    if (!outfitText) return
    const matched = ILLYA_OUTFITS.find(o => outfitText.includes(o))
    if (matched) currentOutfit.value = matched
  }

  function toggleOutfitPanel() {
    showOutfitPanel.value = !showOutfitPanel.value
    if (showOutfitPanel.value) showExpressionPanel.value = false
  }

  function toggleExpressionPanel() {
    showExpressionPanel.value = !showExpressionPanel.value
    if (showExpressionPanel.value) showOutfitPanel.value = false
  }

  function nextTutorialStep() {
    if (tutorialStep.value < 2) {
      tutorialStep.value++
    } else {
      showTutorial.value = false
    }
  }

  function dismissTutorial() {
    showTutorial.value = false
    try { localStorage.setItem('illya_tutorial_dismissed', 'true') } catch {}
  }

  function setMode(mode: BottomMode) { currentMode.value = mode }

  function toggleBias(key: keyof PlotBias) { plotBias.value[key] = !plotBias.value[key] }

  function resetBias() {
    plotBias.value = { forceExit: false, encourage: false, forbidNsfw: false, forbidDespair: false }
  }

  /** 选择选项 → 触发 AI 生成 */
  async function selectChoice(index: number) {
    if (index < 0 || index >= choices.value.length) return
    const chosenText = choices.value[index]?.text ?? ''
    await triggerAI(`[选择了: ${chosenText}]\n请根据选择继续故事`)
  }

  /** 发送自定义输入 → 触发 AI 生成 */
  async function sendCustomInput(input: string) {
    if (!input.trim()) return
    await triggerAI(`[玩家行动]: ${input}`)
  }

  /** 地点移动 → 触发 AI 生成 */
  async function moveTo(areaId: string, facilityId: string) {
    await triggerAI(`[移动]: 前往 ${areaId}·${facilityId}\n请描述到达后的场景`)
  }

  /** 核心 AI 生成逻辑 */
  async function triggerAI(userPrompt: string) {
    isAiLoading.value = true
    storyText.value = ''
    typingComplete.value = false

    try {
      const charState = JSON.stringify(statData.value, null, 2)
      const biasStr = buildBiasString()
      const prompt = `${biasStr}[当前角色: ${currentCharId.value}]\n[角色状态]:\n${charState}\n\n${userPrompt}`

      const response = await generateStory(prompt)
      const { story, choices: parsedChoices, rawUpdate } = await parseAndApplyMvuUpdate(response)

      storyText.value = story || response
      if (parsedChoices.length > 0) {
        choices.value = parsedChoices.map(text => ({ text }))
      }

      // 如果 MVU 解析成功，重新读取最新变量并做延迟校验
      if (rawUpdate && typeof Mvu !== 'undefined') {
        try {
          const freshVars = Mvu.getMvuData({ type: 'message', message_id: getCurrentMessageId() });
          statData.value = Schema.parse(_.get(freshVars, 'stat_data', {}));

          // 同步穿搭：AI 更新了 穿搭 字段时，自动匹配前端预设服装
          syncOutfitFromStatData();

          // AI 生成后延迟校验
          schedulePostAiVerify(
            () => statData.value,
            (newData) => { statData.value = newData },
          );
        } catch {}
      }
    } catch (e) {
      console.error('[伊莉雅界面] AI 生成异常', e)
      storyText.value = '（伊莉雅歪着头看着你）「学长，怎么了？」'
    } finally {
      isAiLoading.value = false
      typingComplete.value = true
    }
  }

  function buildBiasString(): string {
    const b = plotBias.value
    const flags: string[] = []
    if (b.forceExit) flags.push('[指令: 强制结束当前事件]')
    if (b.encourage) flags.push('[指令: 鼓励涩涩内容]')
    if (b.forbidNsfw) flags.push('[指令: 禁止涩涩内容]')
    if (b.forbidDespair) flags.push('[指令: 抑制绝望走向]')
    return flags.length > 0 ? flags.join('\n') + '\n' : ''
  }

  return {
    statData, ready, currentCharId, currentMode, plotBias,
    storyText, choices, isAiLoading, typingComplete,
    areas,
    currentOutfit, currentExpression, showOutfitPanel, showExpressionPanel,
    showTitle, gamePhase, startGame,
    showTutorial, tutorialStep, showVerifyIndicator, lastVerifyResult, verifySummary,
    currentChar, charIds, currentCharLabel, currentCharIcon, currentCharColor,
    statusBar, devRecords, personalityTags,
    init, switchCharacter, setMode, toggleBias, resetBias,
    selectChoice, sendCustomInput, moveTo,
    triggerAI,
    setOutfit, setExpression, toggleOutfitPanel, toggleExpressionPanel,
    syncOutfitFromStatData,
    nextTutorialStep, dismissTutorial,
  }
})

// 辅助函数（在 triggerAI 中使用，避免循环依赖）
import { generateStory, parseAndApplyMvuUpdate } from '../bridge/tavern'
