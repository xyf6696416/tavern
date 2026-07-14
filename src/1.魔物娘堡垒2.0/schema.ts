export const Schema = z.object({
  // ── 世界状态 ──
  世界: z.object({
    当前时间: z.string().prefault("圣历9年 5月4日 8时00分"),
    当前地点: z.string().prefault("诺亚之心广场"),
    侵蚀度: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(15),
    侵蚀阶段: z.string().prefault("轻度腐化"),
    当前任务: z.array(z.object({
      标题: z.string(),
      目标: z.string(),
    })).prefault([]),
    主要线索: z.string().prefault(""),
    不为人知的事件: z.string().prefault(""),
  }).prefault({ 当前时间: "圣历9年 5月4日 8时00分", 当前地点: "诺亚之心广场", 侵蚀度: 15, 侵蚀阶段: "轻度腐化", 当前任务: [], 主要线索: "", 不为人知的事件: "" }),

  // ── 主角状态（user_status） ──
  主角: z.object({
    姓名: z.string().prefault(""),
    阵营: z.string().prefault("光明"),
    种族: z.string().prefault("人类"),
    性别: z.string().prefault("男性"),
    金钱: z.coerce.number().transform(v => Math.max(0, Math.round(v))).prefault(500),
    等级: z.coerce.number().transform(v => Math.max(1, Math.round(v))).prefault(1),
    生命值: z.coerce.number().transform(v => _.clamp(Math.round(v), 0, 999)).prefault(100),
    最大生命值: z.coerce.number().transform(v => Math.max(1, Math.round(v))).prefault(100),
    经验值: z.coerce.number().transform(v => Math.max(0, Math.round(v))).prefault(0),
    下一级经验: z.coerce.number().transform(v => Math.max(1, Math.round(v))).prefault(100),
    战斗力: z.coerce.number().transform(v => Math.max(0, Math.round(v))).prefault(10),
    状态: z.string().prefault(""),
    永久状态: z.string().prefault(""),
    职业: z.string().prefault(""),
    社交关系: z.array(z.object({
      姓名: z.string(),
      关系: z.string(),
      好感: z.coerce.number().transform(v => _.clamp(v, 0, 100)),
      描述: z.string(),
    })).prefault([]),
    雌堕程度: z.string().prefault(""),
    恶堕程度: z.string().prefault(""),
    恶堕值: z.coerce.number().transform(v => _.clamp(Math.round(v), 0, 100)).prefault(0),
    雌堕值: z.coerce.number().transform(v => _.clamp(Math.round(v), 0, 100)).prefault(0),
    user恶堕倾向形态: z.string().prefault(""),
    持有道具: z.string().prefault(""),
    // 性癖展现
    外貌描写: z.string().prefault(""),
    变化: z.string().prefault(""),
  }).prefault({ 等级: 1, 生命值: 100, 最大生命值: 100, 战斗力: 10, 金钱: 500 }),

  // ── 当前互动对象（normal_status，当前交互的NPC） ──
  当前互动对象: z.object({
    姓名: z.string().prefault(""),
    阵营: z.string().prefault("中立"),
    种族: z.string().prefault(""),
    性别: z.string().prefault(""),
    等级: z.coerce.number().transform(v => Math.max(1, Math.round(v))).prefault(1),
    生命值: z.coerce.number().transform(v => _.clamp(Math.round(v), 0, 999)).prefault(100),
    最大生命值: z.coerce.number().transform(v => Math.max(1, Math.round(v))).prefault(100),
    战斗力: z.coerce.number().transform(v => Math.max(0, Math.round(v))).prefault(10),
    临时状态: z.string().prefault(""),
    永久状态: z.string().prefault(""),
    好感度: z.coerce.number().transform(v => _.clamp(Math.round(v), 0, 100)).prefault(0),
    雌堕程度: z.string().prefault(""),
    恶堕程度: z.string().prefault(""),
    恶堕倾向形态: z.string().prefault(""),
    飞升: z.string().prefault("无"),
    想法: z.string().prefault(""),
    外貌描写: z.string().prefault(""),
  }).prefault({ 等级: 1, 生命值: 100, 最大生命值: 100, 战斗力: 10 }),

  // ── 附近重要人物（world_status中的列表，支持多人） ──
  附近重要人物: z.array(z.object({
    姓名: z.string(),
    状态: z.string(),
  })).prefault([]),

  // ── 地点状态 ──
  地点状态: z.record(z.string().describe("地点名"), z.object({
    已解锁: z.boolean(),
    探索度: z.coerce.number().transform(v => _.clamp(Math.round(v), 0, 100)),
    恶堕进度: z.coerce.number().transform(v => _.clamp(Math.round(v), 0, 100)),
    备注: z.string(),
  })).prefault({}),

  // ── 战斗 ──
  战斗: z.object({
    进行中: z.boolean().prefault(false),
    敌人: z.string().prefault(""),
    敌人等级: z.coerce.number().transform(v => Math.max(1, Math.round(v))).prefault(1),
    敌人生命值: z.coerce.number().transform(v => Math.max(0, Math.round(v))).prefault(100),
    敌人最大生命值: z.coerce.number().transform(v => Math.max(1, Math.round(v))).prefault(100),
    敌人战斗力: z.coerce.number().transform(v => Math.max(0, Math.round(v))).prefault(10),
    敌人恶堕值: z.coerce.number().transform(v => _.clamp(Math.round(v), 0, 100)).prefault(0),
    回合数: z.coerce.number().transform(v => Math.max(0, Math.round(v))).prefault(0),
    战斗日志: z.array(z.string()).prefault([]),
    _待发送结果: z.string().prefault(""),
  }).prefault({}),
});
export type Schema = z.output<typeof Schema>;