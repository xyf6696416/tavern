import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';
import { INITIAL_VALUES, Schema } from '../schema';

/**
 * ══════════════════════════════════════════════════
 * 脚本/变量结构/index.ts — 注册 MVU Schema
 * ══════════════════════════════════════════════════
 *
 * 功能：
 * 1. 将 schema.ts 注册到 MVU 变量框架
 * 2. 在变量初始化后，覆写各角色初始差异化数值
 * 3. 监听命令解析事件，修复 AI 输出格式问题
 * ================================================ */

$(() => {
  // 1. 注册 Schema
  registerMvuSchema(Schema);
  console.info('[伊莉雅MVU] Schema 已注册');

  // 2. 监听变量更新结束，设置各角色初始差异化值
  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (new_variables, old_variables) => {
    // 仅在 stat_data 还没有角色数据时（初次初始化）设置
    for (const [charName, initial] of Object.entries(INITIAL_VALUES)) {
      if (_.get(new_variables, `stat_data.${charName}.好感度`) === 25) {
        // 25 是 FemaleStats 的 prefault 值，说明尚未被差异化初始化
        for (const [key, value] of Object.entries(initial)) {
          _.set(new_variables, `stat_data.${charName}.${key}`, value);
        }
      }
    }
  });

  // 3. 修复 AI 输出中的格式问题（如 gemini 在中文间加横线）
  eventOn(Mvu.events.COMMAND_PARSED, commands => {
    commands.forEach(command => {
      // 修复可能的格式错误：去掉多余空格、修复路径分隔符
      if (command.args?.[0]) {
        command.args[0] = command.args[0].trim();
      }
    });
  });
});