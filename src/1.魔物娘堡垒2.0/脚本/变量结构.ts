import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';
import { Schema } from '../schema';

// 注册到角色卡聊天变量，随角色卡加载
$(() => {
  registerMvuSchema(Schema);
});