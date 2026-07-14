/**
 * ══════════════════════════════════════════════════
 * 脚本/变量校验/index.ts — 数值校验与业务逻辑
 * ══════════════════════════════════════════════════
 *
 * 功能：监听 VARIABLE_UPDATE_ENDED 事件，对更新后的变量做额外校验
 *
 * 校验规则（基于 📋变量阶段总表.txt）：
 * 1. 好感度单次变动不超过 ±5
 * 2. 数值字段单次变动不超过 ±15（除特殊事件外）
 * 3. 未出场角色不更新数值字段
 * 4. 记录好感度突破里程碑事件
 * 5. 堕落度变化需要剧情铺垫（无法直接检测，由 AI 自觉）
 * ================================================ */

$(() => {
  console.info('[伊莉雅MVU] 变量校验脚本已加载');

  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (new_variables, old_variables) => {
    const FEMALE_CHARS = ['伊莉雅', '美游', '小黑'];
    const NUMERIC_FIELDS = ['好感度', '疲劳', '欲望', '意志', '理智', '魔力值'];
    const TRAIT_FIELDS = ['堕落度', '药物依赖度', '奴化进程', '善恶平衡'];

    // ── 规则1: 好感度单次变动不超过 ±5 ──
    FEMALE_CHARS.forEach(name => {
      NUMERIC_FIELDS.forEach(field => {
        const oldVal = _.get(old_variables, `stat_data.${name}.${field}`);
        const newVal = _.get(new_variables, `stat_data.${name}.${field}`);
        if (oldVal === undefined || newVal === undefined) return;
        if (typeof oldVal !== 'number' || typeof newVal !== 'number') return;

        const diff = newVal - oldVal;
        // 好感度限制 ±5，其他数值限制 ±15
        const limit = field === '好感度' ? 5 : 15;
        if (Math.abs(diff) > limit) {
          const clamped = oldVal + Math.sign(diff) * limit;
          _.set(new_variables, `stat_data.${name}.${field}`, clamped);
          console.info(`[伊莉雅MVU] ${name}.${field} 变动 ${diff} 超出限制，已钳制为 ±${limit}`);
        }
      });

      // ── 规则2: 特质字段变动限制 ──
      TRAIT_FIELDS.forEach(field => {
        const oldVal = _.get(old_variables, `stat_data.${name}.${field}`);
        const newVal = _.get(new_variables, `stat_data.${name}.${field}`);
        if (oldVal === undefined || newVal === undefined) return;
        if (typeof oldVal !== 'number' || typeof newVal !== 'number') return;

        const diff = newVal - oldVal;
        // 特质字段单次变动不超过 ±3
        if (Math.abs(diff) > 3) {
          const clamped = oldVal + Math.sign(diff) * 3;
          _.set(new_variables, `stat_data.${name}.${field}`, clamped);
          console.info(`[伊莉雅MVU] ${name}.${field} 变动 ${diff} 超出限制，已钳制为 ±3`);
        }
      });
    });

    // ── 规则3: 记录好感度里程碑 ──
    FEMALE_CHARS.forEach(name => {
      const oldVal = _.get(old_variables, `stat_data.${name}.好感度`);
      const newVal = _.get(new_variables, `stat_data.${name}.好感度`);
      if (oldVal === undefined || newVal === undefined) return;

      const milestones = [50, 80, 100];
      milestones.forEach(m => {
        if (oldVal < m && newVal >= m) {
          console.info(`[伊莉雅MVU] 🎉 ${name} 好感度突破 ${m}!`);
          // 在 flags 中记录
          const flags = _.get(new_variables, `stat_data.${name}._flags`, {});
          flags[`好感度突破${m}`] = true;
          _.set(new_variables, `stat_data.${name}._flags`, flags);
        }
      });
    });
  });
});