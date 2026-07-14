import { z } from 'zod';

/**
 * ══════════════════════════════════════════════════
 * schema.ts — 伊莉雅 MVU 变量结构定义 (zod 4)
 * ══════════════════════════════════════════════════
 *
 * 来源：伊莉雅新/世界书/📋变量阶段总表.txt
 *
 * 设计原则：
 * - 所有数值字段用 z.coerce.number() 兼容增量更新
 * - 用 z.transform() 做数值钳制（而非 z.min()/z.max()）
 * - 用 z.prefault() 设置默认值（而非 z.default()）
 * - 复合对象整体 .prefault({}) 兼容 JSON Patch remove
 * - Schema.parse(Schema.parse(input)) === Schema.parse(input)
 * ================================================ */

// ── 女性角色共用数值字段（范围 0~100） ──────────
const FemaleStats = z.object({
  好感度: z.coerce.number().transform(v => _.clamp(Math.round(v), 0, 100)).prefault(25),
  疲劳: z.coerce.number().transform(v => _.clamp(Math.round(v), 0, 100)).prefault(10),
  欲望: z.coerce.number().transform(v => _.clamp(Math.round(v), 0, 100)).prefault(5),
  意志: z.coerce.number().transform(v => _.clamp(Math.round(v), 0, 100)).prefault(80),
  理智: z.coerce.number().transform(v => _.clamp(Math.round(v), 0, 100)).prefault(90),
  魔力值: z.coerce.number().transform(v => _.clamp(Math.round(v), 0, 100)).prefault(60),
}).prefault({});

// ── 特质属性（特殊范围） ──────────────────────────
const FemaleTraits = z.object({
  堕落度: z.coerce.number().transform(v => _.clamp(Math.round(v), 1, 4)).prefault(1),
  药物依赖度: z.coerce.number().transform(v => _.clamp(Math.round(v), 0, 10)).prefault(0),
  奴化进程: z.coerce.number().transform(v => _.clamp(Math.round(v), 0, 10)).prefault(0),
  善恶平衡: z.coerce.number().transform(v => _.clamp(Math.round(v), 0, 12)).prefault(10),
}).prefault({});

// ── 女性角色文本字段 ──────────────────────────────
const FemaleText = z.object({
  外称: z.string().prefault(""),
  里称: z.string().prefault(""),
  地点: z.string().prefault("穗群原学园·教室"),
  对user的看法: z.string().prefault(""),
  对士郎的看法: z.string().prefault(""),
  内心: z.string().prefault(""),
  穿搭: z.string().prefault("水手服校服"),
  体位: z.string().prefault("站立"),
  小穴: z.string().prefault("🌸 处女状态，无性经验"),
  胸部: z.string().prefault("🍒 尚未发育的平坦胸部"),
  肛门: z.string().prefault("🍑 放松状态，无特殊反应"),
  接受精液ml: z.string().prefault("0ml"),
  最近性行为: z.string().prefault("💏 无"),
  开发记录: z.record(z.string(), z.string()).prefault({}),
  _flags: z.record(z.string(), z.boolean()).prefault({}),
}).prefault({});

// ── 女性角色完整结构 ──────────────────────────────
const FemaleCharacter = z.object({
  ...FemaleStats.shape,
  ...FemaleTraits.shape,
  ...FemaleText.shape,
}).prefault({});

// ── 士郎结构 ──────────────────────────────────────
const Shirou = z.object({
  地点: z.string().prefault("穗群原学园·教室"),
  阳具: z.string().prefault("🍆 疲软状态，正常尺寸"),
  最近性行为: z.string().prefault("💏 无"),
  对伊莉雅的信任度: z.coerce.number().transform(v => _.clamp(Math.round(v), 0, 100)).prefault(95),
  对美游的信任度: z.coerce.number().transform(v => _.clamp(Math.round(v), 0, 100)).prefault(95),
  对小黑的信任度: z.coerce.number().transform(v => _.clamp(Math.round(v), 0, 100)).prefault(95),
  见伊莉雅: z.string().prefault(""),
  见美游: z.string().prefault(""),
  见小黑: z.string().prefault(""),
}).prefault({});

// ── user 结构 ──────────────────────────────────────
const User = z.object({
  地点: z.string().prefault("教室"),
  阳具: z.string().prefault("🍆 疲软状态，正常尺寸"),
  最近性行为: z.string().prefault("💏 无"),
}).prefault({});

// ── 世界时间结构 ──────────────────────────────────
const World = z.object({
  当前日期: z.string().prefault("2026/07/01"),
  当前时间: z.enum(["早晨","上午","中午","下午","傍晚","夜晚","深夜"]).prefault("早晨"),
  当前星期: z.string().prefault("星期三"),
}).prefault({});

// ── 状态栏（兼容旧数据） ──────────────────────────
const StatusBar = z.object({
  日期和时间: z.string().prefault("--"),
}).prefault({});

// ── 顶层 Schema ────────────────────────────────────
export const Schema = z.object({
  状态栏: StatusBar,
  世界: World,
  伊莉雅: FemaleCharacter,
  美游: FemaleCharacter,
  小黑: FemaleCharacter,
  士郎: Shirou,
  user: User,
}).prefault({});

export type Schema = z.output<typeof Schema>;

/**
 * 各角色初始值差异化配置
 */
export const INITIAL_VALUES: Record<string, Partial<z.input<typeof FemaleCharacter>>> = {
  伊莉雅: {
    好感度: 30, 疲劳: 10, 欲望: 5, 意志: 85, 理智: 95, 魔力值: 70, 善恶平衡: 10,
    外称: "天真活泼的魔法少女", 里称: "无垢的纯洁处子",
    对user的看法: "亲近的学长", 对士郎的看法: "担心、愧疚",
  },
  美游: {
    好感度: 25, 疲劳: 5, 欲望: 3, 意志: 95, 理智: 100, 魔力值: 65, 善恶平衡: 11,
    外称: "冷静沉稳的文学少女", 里称: "压抑情感的优等生",
    对user的看法: "友好的同班同学", 对士郎的看法: "喜欢的恋人",
  },
  小黑: {
    好感度: 20, 疲劳: 20, 欲望: 10, 意志: 70, 理智: 80, 魔力值: 55, 善恶平衡: 8,
    外称: "慵懒随性的影之少女", 里称: "渴望魔力的饥渴野兽",
    对user的看法: "有趣的同学", 对士郎的看法: "我的Master",
  },
};