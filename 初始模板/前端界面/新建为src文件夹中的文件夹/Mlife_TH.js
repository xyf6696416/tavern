// MLIFE_SELF_CONTAINED
// M-life TH — 自包含脚本，刷新自动生效
(function(){"use strict";
/* ===================== src/constants.js ===================== */
// ===== src/constants.js =====
// 统一持久化 key 表（与《M-life 产品手册 v2.0》§8.1 数据维度对应）
// 通过外层 IIFE 闭包被 MlifeApp / DM_Manager / Launcher 共享。
var STORAGE_KEYS = {
  // —— MlifeApp 主模块（原硬编码字面量，Phase 1 收敛）——
  ACCOUNT: 'mlife_account',
  DM_THREAD: 'mlife_dm_',                         // 主会话线程 key 前缀
  RECRUIT_POSTS: 'mlife_recruit_posts',
  DM_SESS: 'mlife_dm_sess_v1_',                   // 会话数据 key 前缀（与 DM_Manager STORAGE_SESS_PREFIX 同源）
  RECRUIT_APPLICANTS: 'mlife_recruit_applicants_', // 应征者 key 前缀
  RECRUIT_APPLICATIONS: 'mlife_recruit_applications',

  // —— DM_Manager / Launcher 既有常量（纳入统一表，便于后续收敛）——
  DM_INDEX: 'mlife_dm_index_v1',
  DM_UNREAD: 'mlife_dm_unread_v1',
  DM_PERSONA: 'mlife_dm_persona_v1_',             // persona 缓存 key 前缀
  FLOAT_BALL: 'mlifeFloatBallPos',
  THEME: 'mlifeTheme'
};

// 招募 / 应征 状态色（Phase 2 收口：原两处 statusColorMap 取并集）
// 同时被 renderRecruitDetail 与 renderRecruitManage 共用，零行为变更。
var STATUS_COLORS = {
  '招募中':   '#34d399',
  '已报名':   '#60a5fa',
  '已确认':   '#60a5fa',
  '已选中':   '#60a5fa',
  '已完成':   '#34d399',
  '已取消':   '#9ca3af',
  '未选中':   '#6a6a70',
  '争议中':   '#f87171',
  '等待确认': '#fbbf24',
  '已锁定':   '#60a5fa'
};

/* ===================== src/storage.js ===================== */
// ===== src/storage.js =====
// 薄封装：与 window.localStorage 逐字等价，仅做闭包内统一入口。
// 调用点的 try/catch 保持不变，行为零变化。
var mlifeStorage = {
  get: function (k) { return localStorage.getItem(k); },
  set: function (k, v) { localStorage.setItem(k, v); },
  remove: function (k) { localStorage.removeItem(k); }
};

/* ===================== src/escape.js ===================== */
// ===== src/escape.js =====
// HTML 转义（原 app.escapeHtml，731 行）。
// 全量转义 & < > " '，MlifeApp 主模块通过 app.escapeHtml 桥接使用。
// 注：原 DM_Manager 的 esc（子集转义 & < >）经核查零调用点，已于 Phase 2 删除。
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ===================== src/parse.js ===================== */
// ===== src/parse.js =====
// 提取 AI 回复文本，适配不同 API 格式。
// 原 MlifeApp（931）与 DM_Manager（4259）两处实现完全等价，合并为单一定义。
function extractReply(json) {
  if (!json) return '';
  try {
    if (json.choices && json.choices[0]) {
      var c = json.choices[0];
      if (c.message && c.message.content) return c.message.content;
      if (c.text) return c.text;
    }
    if (json.results && json.results[0] && json.results[0].text) {
      return json.results[0].text;
    }
  } catch (_) {}
  return '';
}


// === 自注入（TH iframe type=module 中运行）===
if(window.top&&window.top!==window.self){
  try{
    var _scripts=document.querySelectorAll("script[type=module]");
    for(var _i=0;_i<_scripts.length;_i++){
      var _t=_scripts[_i].textContent||"";
      if(_t.indexOf("MLIFE_SELF_CONTAINED")>=0){
        var _inj=window.top.document.createElement("script");
        _inj.textContent=_t;
        window.top.document.head.appendChild(_inj);
        break;
      }
    }
  }catch(_e){}
  return;
}

// === 主页面执行 ===
if(window.__MLIFE_BOOTLOADED&&typeof window.MlifeApp!=="undefined")return;
window.__MLIFE_BOOTLOADED=true;

// ==================== M-life All-in-One ====================
// Auto-boots: shows a floating diamond, click to open M-life phone UI
// ============================================================

// [1] MlifeApp Engine
        // ============================================================
        // 全局 SPA 引擎 — window.MlifeApp
        // ============================================================
        window.MlifeApp = (function() {
            'use strict';

            var app = {};

            // ---- 状态 ----
            app.config = null;
            app.currentPage = null;
            app.tabCache = {};
            app.__heiJinMode = false; // 黑金之选独立模式标志位
            app.__accountId = null;   // 当前选中账号 ID

            /**
             * 内置账号配置（替代世界书 {{user}} 描述）
             * 每个账号包含完整的 stat_data 覆盖值 + 用户描述文本
             */
            app.ACCOUNTS = [
                {
                    id: 'normal',
                    label: '残酷月光 · 打工人',
                    emoji: '🧑‍💼',
                    desc: (
                        '{{user}}身份锁定: 普通打工人、经济条件一般、单身男性，使用软件排解寂寞。一切互动据此展开。\n\n'
                        + '角色档案:\n'
                        + '  基本信息:\n'
                        + '    姓名: {{user}}\n'
                        + '    年龄: 26岁\n'
                        + '    籍贯: 山东青岛\n'
                        + '    现居: 上海\n'
                        + '    工作: 某国企办公室行政文员\n'
                        + '    月收入: 到手一万出头\n'
                        + '    M-life昵称: 残酷月光\n'
                        + '    M-life等级: Lv3\n'
                        + '  居住: 松江区老小区一居室，月租三千五\n'
                        + '  体态: 176cm，健身三年，肩宽腰窄，有明显线条\n'
                        + '  日常: 下班健身、自己做饭、周末偶尔打球\n'
                        + '  经济: 精打细算，每月剩一两千\n'
                    ),
                    stats: {
                        'M-life_用户': { 用户等级: 'Lv3', VIP类型: '无', 昵称: '残酷月光', 年龄: '26' },
                        'M-life_社交': { 获赞总数: '128', 粉丝数: '46', 关注数: '32', 今日已签到: 'false', 连续签到天数: '0' },
                        'M-life_经济': { M币余额: '320', 累计充值: '500' },
                        'M-life_黑金': { 进行中招募数: '0', 已报名招募数: '0' },
                    }
                },
                {
                    id: 'rich',
                    label: '残酷月光 · 高富帅',
                    emoji: '🕶️',
                    desc: (
                        '{{user}}身份锁定: 高知、经济条件极佳、单身帅气男性，自媒体博主。一切互动据此展开。\n\n'
                        + '角色档案:\n'
                        + '  基本信息:\n'
                        + '    姓名: {{user}}\n'
                        + '    年龄: 26岁\n'
                        + '    工作: 自媒体博主，全网50万粉\n'
                        + '    M-life昵称: 残酷月光\n'
                        + '    M-life等级: Lv5\n'
                        + '  体态: 178cm，肌肉线条流畅，健身房常客\n'
                        + '  居住: 200平大平层，奥迪RS7\n'
                        + '  日常: 拍摄、剪片、健身、做菜放松\n'
                        + '  经济: 商单+家里支持，条件优渥\n'
                    ),
                    stats: {
                        'M-life_用户': { 用户等级: 'Lv5', VIP类型: '黑金', 昵称: '残酷月光', 年龄: '26' },
                        'M-life_社交': { 获赞总数: '8826', 粉丝数: '1200', 关注数: '280', 今日已签到: 'false', 连续签到天数: '0' },
                        'M-life_经济': { M币余额: '3818198', 累计充值: '5000000' },
                        'M-life_黑金': { 进行中招募数: '3', 已报名招募数: '2' },
                    }
                }
            ];

            /**
             * 获取当前选中账号
             */
            function getCurrentAccount() {
                if (!app.__accountId) {
                    try { app.__accountId = mlifeStorage.get(STORAGE_KEYS.ACCOUNT) || 'normal'; } catch(_) { app.__accountId = 'normal'; }
                }
                return app.ACCOUNTS.find(function(a) { return a.id === app.__accountId; }) || app.ACCOUNTS[0];
            }

            /**
             * 切换账号
             */
            app.switchAccount = function(accountId) {
                var account = app.ACCOUNTS.find(function(a) { return a.id === accountId; });
                if (!account) return false;
                app.__accountId = accountId;
                try { mlifeStorage.set(STORAGE_KEYS.ACCOUNT, accountId); } catch(_) {}
                // 清空页面缓存，强制重新渲染
                app.tabCache = {};
                // 回到首页刷新
                app.switchTab('profile');
                return true;
            };

            /**
             * 获取账号覆盖后的变量数据
             * 优先从 Mvu 系统读取，用账号数据覆盖
             * 返回 { stat_data: {...} } 格式
             */
            app.getMergedVars = function() {
                var base = { stat_data: {} };
                // 1. 从 Mvu 系统读（优先）
                try {
                    if (typeof Mvu !== 'undefined' && typeof Mvu.getMvuVariable === 'function') {
                        var rawData = null;
                        try { rawData = Mvu.getMvuData(); } catch(_) {}
                        if (rawData && rawData.stat_data) {
                            base = rawData;
                        }
                    }
                } catch(_) {}
                // 2. 用账号数据覆盖
                var account = getCurrentAccount();
                if (account && account.stats) {
                    var sd = base.stat_data || {};
                    Object.keys(account.stats).forEach(function(key) {
                        sd[key] = Object.assign({}, sd[key] || {}, account.stats[key]);
                    });
                    base.stat_data = sd;
                }
                return base;
            };

            /**
             * 写入变量到 Mvu 系统
             * path: 'M-life_经济.M币余额'
             * value: '500'
             */
            app.setMergedVar = async function(path, value) {
                try {
                    if (typeof Mvu !== 'undefined' && typeof Mvu.setMvuVariable === 'function') {
                        var rawData = null;
                        try { rawData = Mvu.getMvuData(); } catch(_) {}
                        var data = rawData || { stat_data: {} };
                        if (!data.stat_data) data.stat_data = {};
                        await Mvu.setMvuVariable(data, path, value, { reason: 'mlife_update' });
                        return true;
                    }
                } catch(e) {
                    console.warn('[MlifeApp] setMergedVar error:', e);
                }
                return false;
            };

            // 辅助：hex 转 rgb 逗号格式（供 render 函数使用）
            app.hexToRgb = function(hex) {
                var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16) : '0,0,0';
            };

            // ---- JSON 解析辅助 ----
            function parseJsonData() {
                // 查找 textarea 中的 JSON（AI 通过 $1 占位符填入）
                var jsonStr = null;
                var ta = document.getElementById('mlife-json-data');
                if (ta) {
                    jsonStr = ta.value;
                }
                if (!jsonStr) {
                    // 尝试从 data- 属性读取
                    var container = document.getElementById('mlife-app');
                    if (container && container.dataset.json) {
                        jsonStr = container.dataset.json;
                    }
                }
                if (jsonStr) {
                    try {
                        return JSON.parse(jsonStr);
                    } catch (e) {
                        console.warn('[MlifeApp] JSON parse failed:', e);
                        return null;
                    }
                }
                return null;
            }

            // ---- 状态栏更新 ----
            function populateStatusBar() {
                // 独立模式：检查 Mvu 是否可用
                if (typeof Mvu === 'undefined' || typeof Mvu.getMvuVariable !== 'function') {
                    return;
                }
                var allVars = app.getMergedVars();

                function setText(id, path, fallback) {
                    var el = document.getElementById(id);
                    if (!el) return;
                    var val = _.get(allVars, path, fallback);
                    el.textContent = val;
                }

                setText('var-系统-日期', 'stat_data.系统.日期', '--');
                setText('var-系统-时间', 'stat_data.系统.时间', '--');
                setText('var-系统-位置', 'stat_data.系统.位置', '--');
                setText('var-mlife-容貌身材', 'stat_data.M-life.容貌身材', '--');
                setText('var-mlife-妆容配饰', 'stat_data.M-life.妆容配饰', '--');
                setText('var-mlife-穿着打扮', 'stat_data.M-life.穿着打扮', '--');
                setText('var-mlife-身体状态', 'stat_data.M-life.身体状态', '--');
            }

            app.refreshStatus = function() {
                populateStatusBar();
            };

            // ---- 通信封装 ----
            app.action = function(cmd) {
                if (typeof triggerSlash === 'function') {
                    triggerSlash(cmd);
                } else {
                    console.warn('[MlifeApp] triggerSlash not available');
                }
            };

            // ---- 持久化 ----
            app.saveDM = function(contact, data) {
                try {
                    mlifeStorage.set(STORAGE_KEYS.DM_THREAD + contact, JSON.stringify(data));
                } catch (e) {
                    console.warn('[MlifeApp] saveDM failed:', e);
                }
            };


            // ---- 招募帖子持久化 ----
            app.saveRecruitPost = function(post) {
                try {
                    var posts = JSON.parse(mlifeStorage.get(STORAGE_KEYS.RECRUIT_POSTS) || '[]');
                    posts.unshift(post);
                    mlifeStorage.set(STORAGE_KEYS.RECRUIT_POSTS, JSON.stringify(posts));
                    return true;
                } catch(e) {
                    console.warn('[MlifeApp] saveRecruitPost failed:', e);
                    return false;
                }
            };

            app.getRecruitPostById = function(id) {
                var posts = app.getRecruitPosts();
                for (var i = 0; i < posts.length; i++) {
                    if (posts[i].id === id) return posts[i];
                }
                return null;
            };

            app.cancelRecruitPost = function(id) {
                try {
                    var posts = app.getRecruitPosts();
                    for (var i = 0; i < posts.length; i++) {
                        if (posts[i].id === id) {
                            posts[i].status = '已取消';
                            posts[i].progress = '已主动取消';
                            mlifeStorage.set(STORAGE_KEYS.RECRUIT_POSTS, JSON.stringify(posts));
                            return true;
                        }
                    }
                } catch(e) { console.warn('[MlifeApp] cancelRecruitPost error:', e); }
                return false;
            };

            app.reactivateRecruitPost = function(id) {
                try {
                    var posts = app.getRecruitPosts();
                    for (var i = 0; i < posts.length; i++) {
                        if (posts[i].id === id) {
                            posts[i].status = '招募中';
                            posts[i].progress = '已重新发布';
                            mlifeStorage.set(STORAGE_KEYS.RECRUIT_POSTS, JSON.stringify(posts));
                            return true;
                        }
                    }
                } catch(e) { console.warn('[MlifeApp] reactivateRecruitPost error:', e); }
                return false;
            };

            /**
             * 从招募详情页发起私信：创建会话 → 生成人格 → AI 发第一条消息 → 跳转 DM
             */
            app.startDmWithApplicant = async function(applicant, recruitTitle) {
                try {
                    var contact = applicant.contactId || applicant.name;
                    var dm = window.DM_Manager;
                    if (!dm) { console.warn('[MlifeApp] DM_Manager not ready'); return; }

                    // 1. 检查是否已有会话
                    var existing = dm.getSessionMeta(contact);
                    if (existing && existing.msgCount > 0) {
                        // 已有对话 → 直接跳转
                        window.top.MlifeApp.navigate('dm', {contact: contact, avatar: applicant.avatar});
                        return;
                    }

                    // 2. 构建 personaExtra（应征者数据）
                    var personaExtra = {
                        name: applicant.name,
                        age: applicant.age,
                        city: applicant.city,
                        job: applicant.job || '',
                        personality: '温柔体贴',
                        chatStyle: '自然口语化',
                        attitude: '友好',
                        relationship: '刚认识（通过招募「' + (recruitTitle || '') + '」接触）',
                        tags: applicant.tags || [],
                        rating: applicant.rating,
                        bodyType: applicant.bodyType,
                        height: applicant.height,
                        selfIntro: applicant.selfIntro || '',
                        note: applicant.note || ''
                    };

                    // 3. 生成人格底座（buildPersonaPrompt 会自动缓存）
                    var personaPrompt = await dm.getOrCreatePersona(contact, applicant.avatar, personaExtra);

                    // 4. 构建第一句自我介绍
                    var introMessages = [
                        { role: 'system', content: personaPrompt },
                        { role: 'user', content: '你好～我看到你对招募「' + (recruitTitle || '') + '」感兴趣，我们开始聊天吧。请以你的身份主动发一段自我介绍，包括你的名字、基本情况、为什么想来这个招募、你的特点。自然口语化，2-4句话。' }
                    ];

                    // 5. 调 AI 生成自我介绍
                    var firstMsg = '';
                    try {
                        if (typeof dm.dmGenerate === 'function') {
                            firstMsg = await dm.dmGenerate(introMessages, personaPrompt);
                        }
                    } catch(_) {}
                    if (!firstMsg || firstMsg.length < 5) {
                        firstMsg = '你好～我是' + (applicant.name || '') + '，看到你的招募「' + (recruitTitle || '') + '」觉得挺合适的，想了解一下具体情况～';
                    }

                    // 6. 创建会话并写入第一条消息
                    var sess = dm.getOrCreateSession(contact, applicant.avatar);
                    if (sess) {
                        sess.messages.push({ role: 'assistant', content: firstMsg, time: new Date().toLocaleString() });
                        sess.personaPrompt = personaPrompt;
                        sess.updated = new Date().toLocaleString();
                        // 保存会话（DM_Manager 格式）
                        try {
                            var key = contact.toLowerCase().replace(/[^a-z0-9]/g, '_');
                            mlifeStorage.set(STORAGE_KEYS.DM_SESS + key, JSON.stringify(sess));
                        } catch(_) {}
                        // 同时保存到旧格式（renderDM 可读）
                        try {
                            var dmData = {contact: contact, avatar: applicant.avatar, messages: sess.messages || []};
                            mlifeStorage.set(STORAGE_KEYS.DM_THREAD + contact, JSON.stringify(dmData));
                        } catch(_) {}
                    }

                    // 7. 跳转到 DM
                    window.top.MlifeApp.navigate('dm', {contact: contact, avatar: applicant.avatar, fromRecruit: recruitTitle});

                } catch(e) {
                    console.warn('[MlifeApp] startDmWithApplicant error:', e);
                    // 出错时也尝试跳转
                    window.top.MlifeApp.navigate('dm', {contact: applicant.contactId || applicant.name, avatar: applicant.avatar});
                }
            };

            app.renderRecruitDetailLocal = function(postId) {
                var post = app.getRecruitPostById(postId);
                if (!post) {
                    return '<div style="padding:30px;text-align:center;color:var(--ml-text-dim);font-size:14px;">招募已不存在</div>';
                }

                var statusColorMap = STATUS_COLORS;
                var sc = statusColorMap[post.status] || '#9ca3af';
                var sRgb = app.hexToRgb(sc);
                var statusTag = '<span style="font-size:12px;padding:2px 10px;border-radius:4px;background:rgba(' + sRgb + ',0.1);color:' + sc + ';border:1px solid rgba(' + sRgb + ',0.2);font-weight:500;">' + app.escapeHtml(post.status) + '</span>';

                // 应征者列表
                var applicantsHtml = '';
                var applicants = JSON.parse(mlifeStorage.get(STORAGE_KEYS.RECRUIT_APPLICANTS + post.id) || '[]');
                if (applicants.length === 0) {
                    applicantsHtml = '<div style="padding:24px;text-align:center;"><div style="font-size:32px;margin-bottom:8px;opacity:0.5;">📭</div><div style="font-size:13px;color:#6a6a70;">还没有人应征</div><div style="font-size:11px;color:#6a6a70;margin-top:4px;">发布后等待平台推荐应征者</div></div>';
                } else {
                    applicantsHtml = '<div style="display:flex;flex-direction:column;gap:8px;">';
                    for (var ai = 0; ai < applicants.length; ai++) {
                        var a = applicants[ai];
                        var aSc = statusColorMap[a.status] || '#9ca3af';
                        var aRgb = app.hexToRgb(aSc);
                        var aStatusTag = '<span style="font-size:10px;padding:1px 6px;border-radius:3px;background:rgba(' + aRgb + ',0.1);color:' + aSc + ';border:1px solid rgba(' + aRgb + ',0.2);">' + app.escapeHtml(a.status) + '</span>';

                        var tagsHtml = '';
                        if (a.tags && a.tags.length) {
                            tagsHtml = '<div style="display:flex;gap:4px;flex-wrap:wrap;margin:4px 0;">';
                            for (var ti = 0; ti < a.tags.length; ti++) {
                                tagsHtml += '<span style="font-size:10px;padding:1px 6px;border-radius:3px;background:rgba(255,255,255,0.04);color:#9a9a9f;border:1px solid rgba(255,255,255,0.06);">' + app.escapeHtml(a.tags[ti]) + '</span>';
                            }
                            tagsHtml += '</div>';
                        }

                        // 状态为招募中才显示确认/拒绝按钮
                        var actionBtns = '';
                        if (post.status === '招募中') {
                            actionBtns = '<span onclick="if(confirm(\'确认选择' + app.escapeHtml(a.name) + '？\')){MlifeApp.cancelRecruitPost(\'' + post.id + '\');MlifeApp.navigate(\'recruit_manage\');}" style="display:inline-block;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;background:rgba(52,211,153,0.15);color:#34d399;border:1px solid rgba(52,211,153,0.25);font-family:inherit;">✅ 确认</span>'
                            actionBtns = '<span onclick="MlifeApp.startDmWithApplicant(' + JSON.stringify(a).replace(/"/g, '&quot;') + ',' + JSON.stringify(post.title).replace(/"/g, '&quot;') + ')" style="display:inline-block;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;background:rgba(96,165,250,0.1);color:#60a5fa;border:1px solid rgba(96,165,250,0.2);font-family:inherit;">💬 私信</span>'
                                + '<span onclick="MlifeApp.action(\'/send 拒绝 ' + app.escapeHtml(a.name) + '|/trigger\')" style="display:inline-block;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;background:rgba(248,113,113,0.1);color:#f87171;border:1px solid rgba(248,113,113,0.2);font-family:inherit;">❌ 拒绝</span>';
                        } else {
                            actionBtns = '<span onclick="MlifeApp.startDmWithApplicant(' + JSON.stringify(a).replace(/"/g, '&quot;') + ',' + JSON.stringify(post.title).replace(/"/g, '&quot;') + ')" style="display:inline-block;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;background:rgba(96,165,250,0.1);color:#60a5fa;border:1px solid rgba(96,165,250,0.2);font-family:inherit;">💬 私信</span>';
                        }

                        applicantsHtml += '<div style="background:#222228;border:1px solid rgba(201,169,110,0.12);border-radius:10px;padding:12px 14px;">'
                            + '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:4px;">'
                            + '<div style="display:flex;align-items:center;gap:8px;">'
                            + '<span style="font-size:24px;">' + (a.avatar || '👤') + '</span>'
                            + '<div><div style="font-weight:600;font-size:14px;color:#e5e5e7;">' + app.escapeHtml(a.name) + '</div>'
                            + '<div style="font-size:11px;color:#9a9a9f;">' + (a.age || '--') + ' · ' + (a.city || '--') + ' ⭐' + (a.rating || '--') + '</div></div>'
                            + '</div>' + aStatusTag
                            + '</div>'
                            + (a.note ? '<div style="font-size:12px;color:#6a6a70;padding:6px 8px;background:rgba(255,255,255,0.02);border-radius:6px;margin:4px 0;line-height:1.4;">📝 ' + app.escapeHtml(a.note) + '</div>' : '')
                            + tagsHtml
                            + (actionBtns ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">' + actionBtns + '</div>' : '')
                            + '</div>';
                    }
                    applicantsHtml += '</div>';
                }

                // 底部操作按钮
                var bottomBtns = '';
                if (post.status === '招募中') {
                    bottomBtns = '<button onclick="if(confirm(\'确定取消招募「' + app.escapeHtml(post.title) + '」？\')){MlifeApp.cancelRecruitPost(\'' + post.id + '\');MlifeApp.navigate(\'recruit_manage\');}" style="flex:1;padding:10px;border-radius:8px;border:1px solid rgba(248,113,113,0.3);background:rgba(248,113,113,0.1);color:#f87171;font-size:13px;cursor:pointer;font-family:inherit;">取消招募</button>';
                } else if (post.status === '已取消') {
                    bottomBtns = '<button onclick="MlifeApp.reactivateRecruitPost(\'' + post.id + '\');MlifeApp.navigate(\'recruit_manage\');" style="flex:1;padding:10px;border-radius:8px;border:1px solid rgba(52,211,153,0.3);background:rgba(52,211,153,0.1);color:#34d399;font-size:13px;cursor:pointer;font-family:inherit;">重新发布</button>';
                }
                bottomBtns += '<button onclick="MlifeApp.navigate(\'recruit_manage\')" style="flex:1;padding:10px;border-radius:8px;border:1px solid rgba(201,169,110,0.2);background:transparent;color:#9a9a9f;font-size:13px;cursor:pointer;font-family:inherit;">返回</button>';

                // 组装
                var rewardDisplay = post.reward ? '<div style="display:flex;gap:10px;font-size:12px;color:#9a9a9f;"><span>💰 ' + app.escapeHtml(post.reward) + '</span></div>' : '';
                var progressHtml = post.progress ? '<div style="font-size:12px;color:#6a6a70;padding:6px 8px;background:rgba(255,255,255,0.02);border-radius:6px;line-height:1.4;">' + app.escapeHtml(post.progress) + '</div>' : '';

                return '<div style="padding:0;">'
                    + '<div style="background:linear-gradient(135deg,#1a1a1f,#222228);padding:12px 16px;border-bottom:1px solid rgba(201,169,110,0.12);display:flex;align-items:center;gap:10px;">'
                    + '<button onclick="MlifeApp.navigate(\'recruit_manage\')" style="background:none;border:none;color:var(--ml-text-dim);font-size:16px;cursor:pointer;padding:0 2px;font-family:inherit;">←</button>'
                    + '<span style="font-size:18px;">' + (post.typeIcon || '📋') + '</span>'
                    + '<div><div style="font-weight:600;font-size:15px;color:#e5e5e7;">' + app.escapeHtml(post.title) + '</div>'
                    + '<div style="font-size:11px;color:#9a9a9f;">' + (post.recruitType || '') + '</div></div>'
                    + statusTag
                    + '</div>'
                    + '<div style="padding:14px 16px;">'
                    + '<div style="font-size:12px;color:#9a9a9f;margin-bottom:6px;">👤 ' + app.escapeHtml(post.poster || '用户') + ' · 🕐 ' + app.escapeHtml(post.time || '') + '</div>'
                    + rewardDisplay
                    + '<div style="background:#1a1a1f;border-radius:8px;padding:10px 12px;border:1px solid rgba(201,169,110,0.08);margin:8px 0;">'
                    + '<div style="font-size:11px;color:#9a9a9f;margin-bottom:6px;font-weight:600;">详细信息</div>'
                    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;font-size:12px;color:#e5e5e7;">'
                    + (post.count ? '<div><span style="color:#6a6a70;">人数:</span> ' + app.escapeHtml(String(post.count)) + '</div>' : '')
                    + (post.date ? '<div><span style="color:#6a6a70;">日期:</span> ' + app.escapeHtml(post.date) + '</div>' : '')
                    + (post.city ? '<div><span style="color:#6a6a70;">地点:</span> ' + app.escapeHtml(post.city) + '</div>' : '')
                    + (post.duration ? '<div><span style="color:#6a6a70;">时长:</span> ' + app.escapeHtml(post.duration) + '</div>' : '')
                    + (post.ageRange ? '<div><span style="color:#6a6a70;">年龄:</span> ' + app.escapeHtml(post.ageRange) + '</div>' : '')
                    + (post.bodyPref ? '<div><span style="color:#6a6a70;">偏好:</span> ' + app.escapeHtml(post.bodyPref) + '</div>' : '')
                    + '</div>'
                    + (post.specialReq ? '<div style="font-size:12px;color:#e5e5e7;margin-top:6px;"><span style="color:#6a6a70;">特殊要求:</span> ' + app.escapeHtml(post.specialReq) + '</div>' : '')
                    + (post.playTags && post.playTags.length ? '<div style="font-size:12px;color:#c9a96e;margin-top:6px;">🏷 ' + post.playTags.map(function(t){return app.escapeHtml(t)}).join(' · ') + '</div>' : '')
                    + '</div>'
                    + progressHtml
                    + '</div>'
                    + '<div style="padding:8px 16px 4px;border-bottom:1px solid rgba(201,169,110,0.08);"><div style="font-size:13px;font-weight:600;color:#e5e5e7;">应征者 (' + applicants.length + '人)</div></div>'
                    + '<div style="padding:8px 16px;">' + applicantsHtml + '</div>'
                    + '<div style="padding:12px 16px;display:flex;gap:8px;">' + bottomBtns + '</div>'
                    + '</div>';
            };

            app.getRecruitPosts = function() {
                try {
                    return JSON.parse(mlifeStorage.get(STORAGE_KEYS.RECRUIT_POSTS) || '[]');
                } catch(e) {
                    return [];
                }
            };

            app.renderRecruitManage = function(data) {
                var tab = (data && data.tab === '我报名的') ? 'myApplications' : 'myRecruits';
                var allFilters = ['全部', '招募中', '已锁定', '已完成', '已取消'];
                var currentFilter = (data && data._filter) || '全部';

                var myRecruits = app.getRecruitPosts();
                var myApplications = JSON.parse(mlifeStorage.get(STORAGE_KEYS.RECRUIT_APPLICATIONS) || '[]');

                var statusColorMap = STATUS_COLORS;

                function makeStatusTag(status) {
                    var color = statusColorMap[status] || '#9ca3af';
                    var rgb = app.hexToRgb(color);
                    return '<span style="font-size:11px;padding:2px 8px;border-radius:4px;background:rgba(' + rgb + ',0.1);color:' + color + ';border:1px solid rgba(' + rgb + ',0.2);font-weight:500;">' + app.escapeHtml(status) + '</span>';
                }

                function makeItemList(items, emptyText) {
                    if (!items || items.length === 0) {
                        return '<div style="padding:32px 20px;text-align:center;"><div style="font-size:32px;margin-bottom:10px;opacity:0.5;">\ud83d\udccb</div><div style="font-size:14px;color:#6a6a70;">' + app.escapeHtml(emptyText) + '</div></div>';
                    }
                    var filtered = items;
                    if (currentFilter !== '全部') {
                        filtered = [];
                        for (var fi = 0; fi < items.length; fi++) {
                            if (items[fi].status && items[fi].status.indexOf(currentFilter) >= 0) filtered.push(items[fi]);
                        }
                    }
                    var listHtml = '';
                    for (var i = 0; i < filtered.length; i++) {
                        var item = filtered[i];
                        listHtml += '<div onclick="MlifeApp.navigate(\'recruit_detail_local\',{postId:\'' + item.id + '\'})" style="background:#222228;border:1px solid rgba(201,169,110,0.12);border-radius:10px;padding:12px 14px;margin-bottom:8px;cursor:pointer;" onmouseover="this.style.borderColor=\'rgba(201,169,110,0.3)\';this.style.background=\'#2a2a32\'" onmouseout="this.style.borderColor=\'rgba(201,169,110,0.12)\';this.style.background=\'#222228\'">'
                            + '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px;">'
                            + '<div style="display:flex;align-items:center;gap:6px;">'
                            + '<span style="font-size:16px;">' + (item.typeIcon || '\ud83d\udccb') + '</span>'
                            + '<span style="font-weight:600;font-size:14px;color:#e5e5e7;">' + app.escapeHtml(item.title) + '</span>'
                            + (item.id ? '<span style="font-size:10px;color:#6a6a70;margin-left:4px;">#' + app.escapeHtml(item.id) + '</span>' : '')
                            + '</div>'
                            + makeStatusTag(item.status)
                            + '</div>'
                            + (item.poster ? '<div style="font-size:11px;color:#9a9a9f;margin-bottom:4px;">' + app.escapeHtml(item.poster) + '</div>' : '')
                            + (item.recruitType ? '<div style="font-size:11px;color:#6a6a70;margin-bottom:6px;">' + app.escapeHtml(item.recruitType) + '</div>' : '')
                            + '<div style="display:flex;gap:10px;font-size:11px;color:#9a9a9f;margin-bottom:6px;">'
                            + '<span>\ud83d\udd50 ' + app.escapeHtml(item.time || '') + '</span>'
                            + (item.reward ? '<span style="color:#c9a96e;font-weight:600;">' + app.escapeHtml(item.reward) + '</span>' : '')
                            + '</div>'
                            + (item.progress ? '<div style="font-size:12px;color:#6a6a70;padding:6px 8px;background:rgba(255,255,255,0.02);border-radius:6px;line-height:1.4;">' + app.escapeHtml(item.progress) + '</div>' : '')
                            + '</div>';
                    }
                    if (filtered.length === 0) {
                        return '<div style="padding:32px 20px;text-align:center;"><div style="font-size:32px;margin-bottom:10px;opacity:0.5;">\ud83d\udccb</div><div style="font-size:14px;color:#6a6a70;">暂无符合条件的订单</div></div>';
                    }
                    return listHtml;
                }

                var tabHtml = '<div style="display:flex;background:#1a1a1f;border-bottom:1px solid rgba(201,169,110,0.12);">'
                    + '<button onclick="MlifeApp.navigate(\'recruit_manage\',{tab:\'我发布的\',_filter:\'' + currentFilter + '\'})" style="flex:1;padding:10px 0;text-align:center;font-size:14px;font-weight:500;cursor:pointer;background:none;border:none;border-bottom:2px solid ' + (tab === 'myRecruits' ? '#c9a96e' : 'transparent') + ';color:' + (tab === 'myRecruits' ? '#c9a96e' : '#9a9a9f') + ';font-family:inherit;">我发布的</button>'
                    + '<button onclick="MlifeApp.navigate(\'recruit_manage\',{tab:\'我报名的\',_filter:\'' + currentFilter + '\'})" style="flex:1;padding:10px 0;text-align:center;font-size:14px;font-weight:500;cursor:pointer;background:none;border:none;border-bottom:2px solid ' + (tab === 'myApplications' ? '#c9a96e' : 'transparent') + ';color:' + (tab === 'myApplications' ? '#c9a96e' : '#9a9a9f') + ';font-family:inherit;">我报名的</button>'
                    + '</div>';

                var filterHtml = '<div style="padding:8px 12px;background:#1a1a1f;border-bottom:1px solid rgba(201,169,110,0.12);display:flex;gap:6px;overflow-x:auto;">';
                for (var fi = 0; fi < allFilters.length; fi++) {
                    var f = allFilters[fi];
                    filterHtml += '<span onclick="MlifeApp.navigate(\'recruit_manage\',{tab:\'' + (tab === 'myRecruits' ? '我发布的' : '我报名的') + '\',_filter:\'' + f + '\'})" style="padding:3px 10px;border-radius:12px;font-size:11px;white-space:nowrap;cursor:pointer;background:' + (f === currentFilter ? 'rgba(201,169,110,0.15)' : '#222228') + ';color:' + (f === currentFilter ? '#c9a96e' : '#9a9a9f') + ';border:1px solid ' + (f === currentFilter ? '#c9a96e' : 'transparent') + ';">' + f + '</span>';
                }
                filterHtml += '</div>';

                var listHtml = tab === 'myRecruits'
                    ? makeItemList(myRecruits, '暂无发布的招募')
                    : makeItemList(myApplications, '暂无报名的招募');

                return '<div style="padding:0;">'
                    + '<div style="background:linear-gradient(135deg,#1a1a1f,#222228);padding:14px 16px;border-bottom:1px solid rgba(201,169,110,0.12);display:flex;align-items:center;gap:10px;">'
                    + '<span style="font-size:20px;width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#c9a96e,#8b7340);display:flex;align-items:center;justify-content:center;flex-shrink:0;">\ud83d\udc8e</span>'
                    + '<div><div style="font-weight:600;font-size:15px;color:#e5e5e7;">我的管理</div>'
                    + '<div style="font-size:11px;color:#9a9a9f;">黑金之选</div></div></div>'
                    + tabHtml + filterHtml
                    + '<div style="padding:12px 16px;background:#1a1a1f;min-height:200px;">' + listHtml + '</div></div>';
            };

            app.loadDM = function(contact) {
                try {
                    var raw = mlifeStorage.get(STORAGE_KEYS.DM_THREAD + contact);
                    return raw ? JSON.parse(raw) : null;
                } catch (e) {
                    console.warn('[MlifeApp] loadDM failed:', e);
                    return null;
                }
            };

            // ---- Tab 缓存 ----
            app.updateCache = function(page, data) {
                app.tabCache[page] = data;
            };

            app.getCached = function(page) {
                return app.tabCache[page] || null;
            };

            // ---- 页面渲染函数（stub） ----
            function renderStub(title) {
                return '<div style="padding: 20px; text-align: center; border: 1px dashed rgba(0,229,255,0.3); border-radius: 4px;">'
                    + '<span style="color: #008899; letter-spacing: 0.08em;">'
                    + title + '</span></div>';
            }

            app.renderHome = function(data) {
                if (!data || !data.posts || data.posts.length === 0) {
                    return '<div style="padding:30px;text-align:center;color:var(--ml-text-dim);font-size:14px;">暂无动态</div>';
                }

                var posts = data.posts;
                var cards = [];

                for (var i = 0; i < posts.length; i++) {
                    var p = posts[i];
                    var hiddenComment = '<!-- hidden: ' + (p.hidden || '') + ' -->\n';

                    // 头像 + 昵称行
                    var headerHtml = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">'
                        + '<span style="font-size:32px;width:40px;text-align:center;line-height:40px;">' + (p.avatar || '') + '</span>'
                        + '<div style="flex:1;min-width:0;">'
                        + '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">'
                        + '<span style="font-weight:bold;font-size:15px;color:var(--ml-text);">' + app.escapeHtml(p.nick || '') + '</span>'
                        + '<span style="font-size:11px;padding:1px 7px;border-radius:3px;background:#ff6b9d;color:#fff;font-weight:bold;">' + app.escapeHtml(p.level || '') + '</span>'
                        + (p.vip && p.vip !== '无'
                            ? '<span style="font-size:11px;padding:1px 7px;border-radius:3px;background:var(--ml-gold);color:#1a1a1a;font-weight:bold;">' + app.escapeHtml(p.vip) + '</span>'
                            : '')
                        + '</div>'
                        + '<div style="font-size:12px;color:var(--ml-text-dim);margin-top:3px;">'
                        + app.escapeHtml(p.time || '') + ' &middot; ' + app.escapeHtml(p.section || '')
                        + '</div>'
                        + '</div>'
                        + '</div>';

                    // 正文
                    var bodyHtml = p.body
                        ? '<div style="font-size:14px;color:var(--ml-text-main);line-height:1.6;margin-bottom:10px;white-space:pre-wrap;">' + app.escapeHtml(p.body) + '</div>'
                        : '';

                    // 图片描述
                    var imagesHtml = '';
                    if (p.images && p.images.length > 0) {
                        imagesHtml = '<div style="margin-bottom:10px;">';
                        for (var j = 0; j < p.images.length; j++) {
                            var img = p.images[j];
                            imagesHtml += '<div style="background:var(--ml-bg-section);border-radius:8px;padding:10px;margin-bottom:6px;font-size:13px;color:var(--ml-text-aaa);border:1px solid var(--ml-border);border-left:3px solid #ff6b9d;">'
                                + '<span style="color:var(--ml-accent);margin-right:6px;">&#x1F5BC;</span>'
                                + app.escapeHtml(img.desc || '')
                                + '</div>';
                        }
                        imagesHtml += '</div>';
                    }

                    // 付费墙
                    var paywallHtml = '';
                    if (p.paywall && p.paywall !== '无') {
                        paywallHtml = '<div style="margin-bottom:10px;padding:8px 12px;border-radius:8px;background:linear-gradient(135deg,#2a1a1a,#1a1a2e);border:1px solid #ff6b9d;color:var(--ml-accent);font-size:13px;display:flex;align-items:center;gap:8px;">'
                            + '<span>&#x1F512;</span>'
                            + app.escapeHtml(p.paywall)
                            + '</div>';
                    }

                    // 统计行
                    var statsHtml = '<div style="display:flex;gap:16px;margin-bottom:10px;font-size:13px;color:var(--ml-text-dim);">'
                        + '<span style="display:flex;align-items:center;gap:4px;"><span style="color:var(--ml-accent);">&#x2764;</span> ' + p.likes + '</span>'
                        + '<span style="display:flex;align-items:center;gap:4px;"><span style="color:var(--ml-cyan);">&#x1F4AC;</span> ' + p.comments + '</span>'
                        + '<span style="display:flex;align-items:center;gap:4px;"><span style="color:var(--ml-text-dim);">&#x21AA;</span> ' + p.shares + '</span>'
                        + '</div>';

                    // 交互按钮
                    var actionsHtml = '<div style="display:flex;gap:8px;margin-bottom:10px;">'
                        + '<button onclick="MlifeApp.action(\'/send 点赞|献稻制作|触发\')" style="flex:1;padding:8px;border-radius:8px;border:1px solid var(--ml-border);background:var(--ml-bg-card);color:var(--ml-accent);font-size:13px;cursor:pointer;font-family:inherit;transition:background 0.2s;">&#x2764; 点赞</button>'
                        + '<button onclick="MlifeApp.action(\'/send 查看评论|献稻制作|触发\')" style="flex:1;padding:8px;border-radius:8px;border:1px solid var(--ml-border);background:var(--ml-bg-card);color:var(--ml-cyan);font-size:13px;cursor:pointer;font-family:inherit;transition:background 0.2s;">&#x1F4AC; 评论</button>'
                        + '</div>';

                    // 热评
                    var hotCommentsHtml = '';
                    if (p.hotComments && p.hotComments.length > 0) {
                        hotCommentsHtml = '<div style="background:var(--ml-bg-info);border-radius:8px;padding:8px 12px;">';
                        for (var k = 0; k < p.hotComments.length; k++) {
                            var hc = p.hotComments[k];
                            hotCommentsHtml += '<div style="font-size:13px;color:var(--ml-text-ccc);padding:4px 0;' + (k > 0 ? 'border-top:1px solid #1e1e2e;' : '') + '">'
                                + '<span style="color:var(--ml-accent);font-weight:bold;">' + app.escapeHtml(hc.name || '') + '</span>'
                                + '<span style="color:var(--ml-text-dim);margin:0 4px;">:</span>'
                                + '<span>' + app.escapeHtml(hc.text || '') + '</span>'
                                + '</div>';
                        }
                        hotCommentsHtml += '</div>';
                    }

                    // 组装卡片
                    var cardHtml = '<div style="background:var(--ml-bg-card);border:1px solid var(--ml-border);border-radius:12px;padding:14px;margin-bottom:12px;">'
                        + hiddenComment
                        + headerHtml
                        + bodyHtml
                        + imagesHtml
                        + paywallHtml
                        + statsHtml
                        + actionsHtml
                        + hotCommentsHtml
                        + '</div>';

                    cards.push(cardHtml);
                }

                var html = '<div style="padding:0;">' + cards.join('\n') + '</div>';
                MlifeApp.updateCache('home', html);
                return html;
            };

            // ---- HTML 转义辅助 ----
            app.escapeHtml = escapeHtml;  // 实现见 src/escape.js（外层闭包）

            /** 编码 data-person 属性值 */
            app.encPerson = function(data) {
                return encodeURIComponent(JSON.stringify(data));
            };

            /** 解码 data-person 属性值 */
            app.decPerson = function(str) {
                return JSON.parse(decodeURIComponent(str));
            };

            // ---- 用户操作菜单 (ActionSheet) ----
            app.showPersonMenu = function(person) {
                if (!person || !person.contact) return;
                app.closePersonMenu();

                var contact = app.escapeHtml(person.contact);
                var avatar = app.escapeHtml(person.avatar || '👤');
                var nick = app.escapeHtml(person.nick || person.contact);

                var overlay = document.createElement('div');
                overlay.id = 'mlife-action-overlay';
                overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;';
                overlay.onclick = function() { app.closePersonMenu(); };
                document.body.appendChild(overlay);

                var sheet = document.createElement('div');
                sheet.id = 'mlife-action-sheet';
                sheet.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:var(--ml-bg-section);border-radius:16px 16px 0 0;padding:20px 16px;z-index:10000;animation:mlifeSlideUp 0.2s ease;max-width:500px;margin:0 auto;';
                sheet.innerHTML = ''
                    + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid #2a2a3e;">'
                    + '<span style="font-size:40px;width:48px;text-align:center;line-height:48px;">' + avatar + '</span>'
                    + '<div><div style="font-weight:bold;font-size:18px;color:var(--ml-text);">' + nick + '</div></div>'
                    + '</div>'
                    + '<button onclick="MlifeApp.closePersonMenu();MlifeApp.navigate(\'dm\',{contact:\'' + contact + '\',avatar:\'' + avatar + '\'})" style="width:100%;padding:14px;border-radius:12px;border:1px solid #ff6b9d;background:var(--ml-glow-10);color:var(--ml-accent);font-size:16px;cursor:pointer;margin-bottom:8px;font-family:inherit;">💬 发私信</button>'
                    + '<button onclick="MlifeApp.closePersonMenu()" style="width:100%;padding:14px;border-radius:12px;border:none;background:var(--ml-bg-hover);color:var(--ml-text-dim);font-size:16px;cursor:pointer;font-family:inherit;">取消</button>';
                document.body.appendChild(sheet);

                if (!document.getElementById('mlife-sheet-keyframe')) {
                    var style = document.createElement('style');
                    style.id = 'mlife-sheet-keyframe';
                    style.textContent = '@keyframes mlifeSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}';
                    document.head.appendChild(style);
                }
            };

            app.closePersonMenu = function() {
                var overlay = document.getElementById('mlife-action-overlay');
                if (overlay) overlay.remove();
                var sheet = document.getElementById('mlife-action-sheet');
                if (sheet) sheet.remove();
            };

            // ---- DM Tab 红点更新 ----
            app.updateDmTabBadge = function() {
                var total = 0;
                try {
                    if (typeof DM_Manager !== 'undefined' && DM_Manager.getTotalUnread) {
                        total = DM_Manager.getTotalUnread();
                    }
                } catch(_) {}
                var dmTab = document.getElementById('nav-dm');
                if (!dmTab) return;
                var existing = dmTab.querySelector('.badge');
                if (existing) existing.remove();
                if (total > 0) {
                    var badge = document.createElement('span');
                    badge.className = 'badge';
                    badge.textContent = total > 99 ? '99+' : total;
                    badge.style.cssText = 'position:absolute;top:-4px;right:-8px;background:#ff3b30;color:#fff;border-radius:50%;width:18px;height:18px;font-size:11px;text-align:center;line-height:18px;font-weight:bold;z-index:10;';
                    dmTab.style.position = 'relative';
                    dmTab.appendChild(badge);
                }
            };

            // ===================================================================
            // AI 内容生成子系统 — 骨架屏 + API 调用 + 渲染
            // ===================================================================

            /**
             * 注入 shimmer 动画 CSS
             */
            function injectShimmerStyle() {
                if (document.getElementById('mlife-shimmer-style')) return;
                var style = document.createElement('style');
                style.id = 'mlife-shimmer-style';
                style.textContent = [
                    '@keyframes mlifeShimmer{',
                    '0%{background-position:-200% 0}',
                    '100%{background-position:200% 0}',
                    '}',
                    '@keyframes mlifeFadeIn{',
                    'from{opacity:0.6}',
                    'to{opacity:1}',
                    '}',
                    '.mlf-shimmer{',
                    'background:linear-gradient(90deg,#1a1a2e 25%,#2a2a3e 50%,#1a1a2e 75%);',
                    'background-size:200% 100%;',
                    'animation:mlifeShimmer 1.5s infinite;',
                    'border-radius:6px;',
                    '}',
                    '.mlf-shimmer-card{',
                    'background:var(--ml-bg-card);border:1px solid var(--ml-border);border-radius:12px;padding:14px;margin-bottom:12px;',
                    'animation:mlifeFadeIn 0.3s ease;',
                    '}',
                    '.mlf-shimmer-avatar{',
                    'width:40px;height:40px;border-radius:50%;flex-shrink:0;',
                    '}',
                    '.mlf-shimmer-line{height:14px;margin-bottom:8px;}',
                    '.mlf-shimmer-line-sm{height:11px;width:60%;margin-bottom:6px;}',
                    '.mlf-shimmer-img{height:80px;border-radius:8px;margin-bottom:8px;}',
                    '.mlf-shimmer-btn{height:36px;border-radius:8px;flex:1;}',
                    '.mlf-shimmer-tag{height:22px;width:50px;border-radius:4px;display:inline-block;margin-right:6px;}',
                ].join('\n');
                document.head.appendChild(style);
            }

            /**
             * 骨架屏构建器 — 首页 (3 张 shimmer 卡片)
             */
            function skeletonHome() {
                var html = '';
                for (var i = 0; i < 3; i++) {
                    html += '<div class="mlf-shimmer-card">'
                        + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">'
                        + '<div class="mlf-shimmer mlf-shimmer-avatar"></div>'
                        + '<div style="flex:1;min-width:0;">'
                        + '<div class="mlf-shimmer mlf-shimmer-line" style="width:45%;"></div>'
                        + '<div class="mlf-shimmer mlf-shimmer-line-sm"></div>'
                        + '</div></div>'
                        + '<div class="mlf-shimmer mlf-shimmer-line"></div>'
                        + '<div class="mlf-shimmer mlf-shimmer-line" style="width:85%;"></div>'
                        + '<div class="mlf-shimmer mlf-shimmer-img"></div>'
                        + '<div style="display:flex;gap:16px;margin:10px 0;">'
                        + '<div class="mlf-shimmer mlf-shimmer-line" style="width:40px;height:14px;"></div>'
                        + '<div class="mlf-shimmer mlf-shimmer-line" style="width:40px;height:14px;"></div>'
                        + '<div class="mlf-shimmer mlf-shimmer-line" style="width:40px;height:14px;"></div>'
                        + '</div>'
                        + '<div style="display:flex;gap:8px;">'
                        + '<div class="mlf-shimmer mlf-shimmer-btn"></div>'
                        + '<div class="mlf-shimmer mlf-shimmer-btn"></div>'
                        + '</div>'
                        + '</div>';
                }
                return html;
            }

            /**
             * 骨架屏构建器 — 匹配 (2 张 shimmer 卡片)
             */
            function skeletonMatch() {
                var html = '';
                for (var i = 0; i < 2; i++) {
                    html += '<div class="mlf-shimmer-card">'
                        + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">'
                        + '<div class="mlf-shimmer mlf-shimmer-avatar" style="width:48px;height:48px;"></div>'
                        + '<div style="flex:1;min-width:0;">'
                        + '<div class="mlf-shimmer mlf-shimmer-line" style="width:35%;"></div>'
                        + '<div class="mlf-shimmer mlf-shimmer-line-sm" style="width:50%;"></div>'
                        + '</div></div>'
                        + '<div class="mlf-shimmer mlf-shimmer-line" style="width:90%;"></div>'
                        + '<div class="mlf-shimmer mlf-shimmer-line-sm" style="width:40%;"></div>'
                        + '<div style="margin:10px 0;">'
                        + '<span class="mlf-shimmer mlf-shimmer-tag"></span>'
                        + '<span class="mlf-shimmer mlf-shimmer-tag"></span>'
                        + '<span class="mlf-shimmer mlf-shimmer-tag"></span>'
                        + '</div>'
                        + '<div style="display:flex;gap:8px;">'
                        + '<div class="mlf-shimmer mlf-shimmer-btn" style="height:40px;"></div>'
                        + '<div class="mlf-shimmer mlf-shimmer-btn" style="height:40px;"></div>'
                        + '</div>'
                        + '</div>';
                }
                return html;
            }

            /**
             * 错误状态 HTML
             */
            function skeletonError(pageName, errMsg) {
                return '<div style="padding:40px 20px;text-align:center;">'
                    + '<div style="font-size:40px;margin-bottom:12px;">⚠️</div>'
                    + '<div style="color:var(--ml-accent);font-size:15px;font-weight:bold;margin-bottom:6px;">内容加载失败</div>'
                    + '<div style="color:var(--ml-text-dim);font-size:12px;margin-bottom:16px;">' + app.escapeHtml(errMsg || '') + '</div>'
                    + '<button onclick="MlifeApp.__retryGenerate(\'' + pageName + '\')" style="padding:10px 28px;border-radius:10px;border:1px solid #ff6b9d;background:var(--ml-glow-10);color:var(--ml-accent);font-size:14px;cursor:pointer;font-family:inherit;">🔄 重新加载</button>'
                    + '</div>';
            }

            /* extractReply 已移至 src/parse.js（通过外层闭包共享，与 DM_Manager 共用单一定义） */

            /**
             * 调用 tavern 内部 API 生成内容
             * 使用 SillyTavern.getContext().generateRaw 方法
             */
            app.__callApi = async function(systemPrompt) {
                // 使用 SillyTavern 的 generateRaw API（带 30s 超时）
                try {
                    var c = SillyTavern.getContext();
                    if (typeof c.generateRaw === 'function') {
                        var result = await Promise.race([
                            c.generateRaw({
                                prompt: systemPrompt,
                                systemPrompt: '',
                                responseLength: 1500,
                            }),
                            new Promise(function(_, reject) {
                                setTimeout(function() { reject(new Error('generateRaw 超时')); }, 30000);
                            })
                        ]);
                        if (result) return result;
                    }
                } catch (_) {}

                // 回退：直接 fetch
                try {
                    var chatCompletionSource = window.main_api || 'openai';
                    var model;
                    try { if (window.oai_settings && window.oai_settings.model) model = window.oai_settings.model; } catch (_) {}

                    var payload = {
                        messages: [{ role: 'system', content: systemPrompt }],
                        chat_completion_source: chatCompletionSource,
                        max_tokens: 1500,
                        temperature: 0.8,
                        stream: false,
                        use_sysprompt: false,
                    };
                    if (model) payload.model = model;

                    var csrfToken = '';
                    try { csrfToken = window.token || ''; } catch (_) {}

                    var controller = new AbortController();
                    var timeoutId = setTimeout(function() { controller.abort(); }, 30000);

                    var response = await fetch('/api/backends/chat-completions/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
                        cache: 'no-cache',
                        body: JSON.stringify(payload),
                        signal: controller.signal,
                    });
                    clearTimeout(timeoutId);
                    if (!response.ok) return null;
                    var json = await response.json();
                    if (json.error) return null;
                    return extractReply(json);
                } catch (_) {
                    return null;
                }
            };

            /**
             * 从 AI 回复中提取 &lt;mlife_app&gt; 包裹的 JSON
             */
            app.__extractMlifeJson = function(text) {
                if (!text) return null;
                // 三级解析
                var match = text.match(/<mlife_app>([\s\S]*?)<\/mlife_app>/i);
                if (match) {
                    try { return JSON.parse(match[1].trim()); } catch(_) {}
                }
                try { return JSON.parse(text.trim()); } catch(_) {}
                var objMatch = text.match(/\{[\s\S]*?"page"[\s\S]*?"data"[\s\S]*?\}/);
                if (objMatch) {
                    try { return JSON.parse(objMatch[0]); } catch(_) {}
                }
                return null;
            };

            /**
             * 检测 HTML 是否为空状态
             */
            app.__isPageEmpty = function(page, html) {
                if (!html) return true;
                // 如果渲染结果包含"暂无"关键词，视为空状态
                return html.indexOf('暂无') !== -1;
            };

            /**
             * 按名称调用 render 函数
             */
            function renderPageByName(page, data) {
                switch (page) {
                    case 'home': case 'index': return app.renderHome(data);
                    case 'match': return app.renderMatch(data);
                    case 'detail': return app.renderDetail(data);
                    case 'live_list': case 'livelist': return app.renderLiveList(data);
                    case 'live': return app.renderLive(data);
                    case 'goddess': return app.renderGoddess(data);
                    case 'resource': return app.renderResource(data);
                    case 'selfie': return app.renderSelfie(data);
                    case 'chat': return app.renderChat(data);
                    case 'profile': return app.renderProfile(data);
                    case 'recruit_list': case 'recruitlist': return app.renderRecruitList(data);
                    case 'recruit_detail': case 'recruitdetail': return app.renderRecruitDetail(data);
                    case 'recruit_post': case 'recruitpost': return app.renderRecruitPost(data);
                    case 'recruit_manage': case 'recruitmanage': return app.renderRecruitManage(data);
                    case 'unbox': return app.renderUnbox(data);
                    default: return null;
                }
            }

            // 暴露给 app 对象，确保闭包内部也能引用
            app.__renderPageByName = renderPageByName;

            /**
             * 构建 AI 提示词 — 首页
             */
            function buildPromptHome() {
                var ctx = '';
                var account = getCurrentAccount();
                try {
                    var all = app.getMergedVars();
                    var mu = all && all.stat_data;
                    if (mu) {
                        var sys = mu['系统'] || {};
                        var user = mu['M-life_用户'] || {};
                        ctx = '当前时间: ' + (sys.时间 || '未知') + ', 日期: ' + (sys.日期 || '未知') + ', 位置: ' + (sys.位置 || '未知') + '. '
                            + '用户: ' + (user.昵称 || '未知') + ', 等级: ' + (user.用户等级 || 'Lv1') + ', VIP: ' + (user.VIP类型 || '无') + '.';
                        if (account && account.desc) {
                            ctx += '\n\n【用户档案】\n' + account.desc;
                        }
                    }
                } catch (_) {}

                return '你是一个模拟社交软件 M-life 的内容生成器。请生成首页动态信息流。\n\n'
                    + '上下文:\n' + ctx + '\n\n'
                    + '请输出 JSON 格式，用 <mlife_app> 标签包裹。\n\n'
                    + 'JSON 结构:\n'
                    + '{\n'
                    + '  "page": "home",\n'
                    + '  "data": {\n'
                    + '    "posts": [\n'
                    + '      {\n'
                    + '        "hidden": "发帖人真实状态和动机(不显示)",\n'
                    + '        "avatar": "emoji或符号",\n'
                    + '        "nick": "用户昵称",\n'
                    + '        "level": "Lv1-Lv5",\n'
                    + '        "vip": "无/白银/黄金/黑金",\n'
                    + '        "time": "发帖时间",\n'
                    + '        "section": "福利自拍/闲聊灌水/资源分享",\n'
                    + '        "body": "帖子正文，口语化",\n'
                    + '        "images": [{ "desc": "图片描述" }],\n'
                    + '        "paywall": "无/需XX M币解锁",\n'
                    + '        "likes": 0,\n'
                    + '        "comments": 0,\n'
                    + '        "shares": 0,\n'
                    + '        "hotComments": [{ "name": "用户昵称", "text": "热评内容" }]\n'
                    + '      }\n'
                    + '    ]\n'
                    + '  },\n'
                    + '  "status": { "时间": "当前时间描述", "位置": "当前位置描述" },\n'
                    + '  "badges": { "home": 0, "match": 0, "live": 0, "dm": 0, "profile": 0 }\n'
                    + '}\n\n'
                    + '规则:\n'
                    + '- 每次生成 3-5 条帖子\n'
                    + '- 动态类型混合：纯文字帖、图片帖、擦边帖、日常帖、求助帖、吐槽帖、广告帖\n'
                    + '- 约 90% 性暗示/擦边、10% 日常\n'
                    + '- section 只能从 "福利自拍" / "闲聊灌水" / "资源分享" 中选\n'
                    + '- 帖子内容口语化，像真实社交平台\n'
                    + '- 图片 desc 需具体描述拍摄角度、穿着、光线、环境、身体部位\n'
                    + '- 付费内容只描述可见部分，paywall 标注解锁价格\n'
                    + '- 高互动帖可附带 1-2 条 hotComments，没有则留空数组\n'
                    + '- 禁止输出 <thinking> <content> 等标签\n'
                    + '- 只输出 <mlife_app> 包裹的 JSON，不要多余文字';
            }

            /**
             * 构建 AI 提示词 — 匹配
             */
            function buildPromptMatch() {
                var ctx = '';
                var account = getCurrentAccount();
                try {
                    var all = app.getMergedVars();
                    var mu = all && all.stat_data;
                    if (mu) {
                        var sys = mu['系统'] || {};
                        var user = mu['M-life_用户'] || {};
                        ctx = '当前时间: ' + (sys.时间 || '未知') + ', 日期: ' + (sys.日期 || '未知') + ', 位置: ' + (sys.位置 || '未知') + '. '
                            + '用户: ' + (user.昵称 || '未知') + ', 等级: ' + (user.用户等级 || 'Lv1') + ', VIP: ' + (user.VIP类型 || '无') + '.';
                        if (account && account.desc) {
                            ctx += '\n\n【用户档案】\n' + account.desc;
                        }
                    }
                } catch (_) {}

                return '你是一个模拟社交软件 M-life 的内容生成器。请生成约炮匹配推荐卡片。\n\n'
                    + '上下文:\n' + ctx + '\n\n'
                    + '请输出 JSON 格式，用 <mlife_app> 标签包裹。\n\n'
                    + 'JSON 结构:\n'
                    + '{\n'
                    + '  "page": "match",\n'
                    + '  "data": {\n'
                    + '    "cards": [\n'
                    + '      {\n'
                    + '        "hidden": "照骗程度、注册时长、真实目的",\n'
                    + '        "avatar": "emoji头像",\n'
                    + '        "nick": "用户昵称",\n'
                    + '        "age": 0,\n'
                    + '        "distance": "X.Xkm",\n'
                    + '        "active": "刚刚活跃/X分钟前/X小时前",\n'
                    + '        "bio": "一句话简介，口语化",\n'
                    + '        "tags": ["标签1","标签2","标签3"],\n'
                    + '        "vip": "无/白银/黄金/黑金",\n'
                    + '        "likes": 0\n'
                    + '      }\n'
                    + '    ]\n'
                    + '  }\n'
                    + '}\n\n'
                    + '标签池: 线下见面、纯聊天、线上互动、一夜情、长期关系、兴趣交友、饭搭子、游戏搭子、运动搭子、旅行、摄影、美食、音乐、电影、读书、主导型、服从型、切换型、角色扮演、SM、制服\n\n'
                    + '规则:\n'
                    + '- 每次生成 1-3 张卡片\n'
                    + '- 标签从标签池选取\n'
                    + '- 个人简介口语化，符合人物设定\n'
                    + '- 距离和活跃时间要合理\n'
                    + '- 禁止输出 <thinking> <content> 等标签\n'
                    + '- 只输出 <mlife_app> 包裹的 JSON，不要多余文字';
            }

            /**
             * 通用骨架屏 (适用于列表类页面：4张简版 shimmer 卡片)
             */
            function skeletonGeneric() {
                var html = '';
                for (var i = 0; i < 3; i++) {
                    html += '<div class="mlf-shimmer-card">'
                        + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">'
                        + '<div class="mlf-shimmer mlf-shimmer-avatar"></div>'
                        + '<div style="flex:1;min-width:0;">'
                        + '<div class="mlf-shimmer mlf-shimmer-line" style="width:50%;"></div>'
                        + '<div class="mlf-shimmer mlf-shimmer-line-sm" style="width:40%;"></div>'
                        + '</div></div>'
                        + '<div class="mlf-shimmer mlf-shimmer-line"></div>'
                        + '<div class="mlf-shimmer mlf-shimmer-line" style="width:70%;"></div>'
                        + '</div>';
                }
                return html;
            }

            /**
             * 通用 AI 提示词 — 根据 pageName 动态构建
             */
            function buildPromptGeneric(pageName) {
                var ctx = '';
                var account = getCurrentAccount();
                try {
                    var all = app.getMergedVars();
                    var mu = all && all.stat_data;
                    if (mu) {
                        var sys = mu['系统'] || {};
                        var user = mu['M-life_用户'] || {};
                        ctx = '当前时间: ' + (sys.时间 || '未知') + ', 日期: ' + (sys.日期 || '未知') + ', 位置: ' + (sys.位置 || '未知') + '. '
                            + '用户: ' + (user.昵称 || '未知') + ', 等级: ' + (user.用户等级 || 'Lv1') + ', VIP: ' + (user.VIP类型 || '无') + '.';
                        if (account && account.desc) {
                            ctx += '\n\n【用户档案】\n' + account.desc;
                        }
                    }
                } catch (_) {}

                var prompts = {
                    detail: '请生成一个 M-life 用户的详细个人档案数据。\n\n'
                        + 'JSON 结构:\n'
                        + '{"page":"detail","data":{"hidden":"真实状态","avatar":"emoji","nick":"昵称","vip":"无/白银/黄金/黑金","age":0,"distance":"X.Xkm","active":"活跃时间","level":"Lv1-Lv5","registered":"新人/老用户/中间用户","purpose":"目的","bio":"简介","tags":["标签"],"bodyType":"体型","height":"数字cm","faceStyle":"面容风格","features":"特征","dailyStyle":"日常穿着","dateStyle":"约会穿着","images":[{"desc":"描述"}],"matchTime":"匹配时间"}}\n\n'
                        + '规则: 每次输出 1 个详情对象，数据要真实详细。标签从平台标签池选取（线下见面、纯聊天、线上互动、一夜情、长期关系等）。',

                    live_list: '请生成 M-life 直播推荐列表。\n\n'
                        + 'JSON 结构:\n'
                        + '{"page":"live_list","data":{"rooms":[{"hidden":"真实状态","avatar":"emoji","name":"主播名","level":"Lv1-Lv5","status":"直播中/即将开播/回放","viewers":0,"title":"标题","preview":"画面摘要","tags":["标签"],"vip":"无/白银/黄金/黑金"}]}}\n\n'
                        + '规则: 每次 3-4 个直播间，标签从 跳舞/成人/聊天/唱歌/游戏 选。',

                    live: '请生成一个 M-life 直播间的实时数据。\n\n'
                        + 'JSON 结构:\n'
                        + '{"page":"live","data":{"hidden":"真实状态","avatar":"emoji","name":"主播名","level":"Lv1-Lv5","status":"正在直播/即将开播/回放","viewers":0,"title":"标题","scene":"主播在画面中的视觉状态——穿着、姿势、动作、表情、光线等","danmaku":[{"name":"昵称","text":"弹幕内容","vip":"无/白银/黄金/黑金"}],"gifts":[{"name":"昵称","gift":"礼物名","value":"价格"}]}}\n\n'
                        + '规则: 每个直播间需有hidden字段描述主播真实状态。3-6 条弹幕，0-3 个礼物，scene 描述要具体（衣服松紧褶皱、皮肤汗珠、坐姿改变等细节）。',

                    goddess: '请生成 M-life 女神夜话板块的女性用户匿名评价档案。\n\n'
                        + 'JSON 结构:\n'
                        + '{"page":"goddess","data":{"board":{"name":"女神夜话","tab":"热帖/最新/每周精选"},"profiles":[{"avatar":"emoji","nick":"昵称","age":0,"score":5.0,"tags":["标签"],"price":"价格","intro":"简介","reviews":[{"text":"评价内容","author":"昵称"}]}]}}\n\n'
                        + '规则: 每次 1 个档案，5-20 条评价，女性视角真实体验，评价内容要具体详细（写清楚对方做了什么、技术水平、态度、身体反应等），像女生真实反馈口语化。',

                    resource: '请生成 M-life 资源分享板块的帖子列表。\n\n'
                        + 'JSON 结构:\n'
                        + '{"page":"resource","data":{"posts":[{"hidden":"动机","avatar":"emoji","nick":"昵称","level":"Lv1-Lv5","vip":"无/白银/黄金/黑金","time":"时间","title":"标题","body":"正文","size":"文件大小","format":"格式","price":"价格","downloads":0,"comments":0,"likes":0}]}}\n\n'
                        + '规则: 每次 2-4 条资源帖，size/format/price 字段可选。资源类型包括：视频合集、图包、教程、工具推荐、自拍打包。标题要吸引眼球。',

                    selfie: '请生成 M-life 日常自拍板块的帖子列表。\n\n'
                        + 'JSON 结构:\n'
                        + '{"page":"selfie","data":{"posts":[{"hidden":"动机","avatar":"emoji","nick":"昵称","level":"Lv1-Lv5","vip":"无/白银/黄金/黑金","time":"时间","body":"配文","images":[{"desc":"图片描述"}],"paywall":"无/需XX M币解锁","likes":0,"comments":0,"shares":0}]}}\n\n'
                        + '规则: 每次 2-4 条，配文口语化暧昧简短。图片 desc 需具体描写拍摄角度/穿着/露出程度/光线/环境/姿势。支持多图和付费帖，付费帖只描述免费预览图部分。',

                    chat: '请生成 M-life 闲聊灌水板块的帖子列表。\n\n'
                        + 'JSON 结构:\n'
                        + '{"page":"chat","data":{"posts":[{"hidden":"动机","avatar":"emoji","nick":"昵称","level":"Lv1-Lv5","vip":"无/白银/黄金/黑金","time":"时间","title":"标题","body":"正文","replies":0,"views":0,"likes":0,"hotComments":[{"name":"昵称","text":"热评"}],"poll":{"options":["选项"],"totalVotes":0}}]}}\n\n'
                        + '规则: 每次 3-5 条帖子，内容杂：吐槽、求助、征友、无聊发疯、深夜emo、晒日常。支持热评（1-2条）和投票帖（poll字段）。正文口语化随意。',

                    profile: '请生成 M-life 用户的个人中心数据。\n\n'
                        + 'JSON 结构:\n'
                        + '{"page":"profile","data":{"hidden":"真实状态","avatar":"emoji","nick":"昵称","level":"Lv1-Lv5","vip":"无/白银/黄金/黑金","age":0,"bio":"简介","stats":{"following":0,"followers":0,"likes":0,"posts":0},"sections":[{"id":"selfie","name":"日常自拍","icon":"📸","locked":false},{"id":"chat","name":"闲聊灌水","icon":"💬","locked":false},{"id":"resource","name":"资源分享","icon":"📦","locked":false},{"id":"goddess","name":"女神夜话","icon":"👑","locked":false},{"id":"recruit_list","name":"黑金之选","icon":"💎","locked":false}],"settings":{"showCheckin":true,"checkedIn":false,"streakDays":0}}}\n\n'
                        + '规则: 黑金VIP用户 黑金之选 locked:false。',

                    recruit_list: '请生成 M-life 黑金之选招募广场的招募帖列表。\n\n'
                        + 'JSON 结构:\n'
                        + '{"page":"recruit_list","data":{"recruits":[{"hidden":"发布人真实状态、背景、是否靠谱等（不显示）","code":"R001","title":"标题","poster":"发布人","avatar":"高级感emoji(💎👑🌟等)","credit":"信用分","typeIcon":"类型图标(单人约会同城/多人聚会/角色扮演/道具play/露出任务/调教/摄影/特殊类型)","budget":"XXXXM币/次","tags":["标签"],"status":"招募中/已锁定/已完成/已取消","applicants":0,"time":"时间"}]}}\n\n'
                        + '规则: 每次 3-5 条，高端精致风格。typeIcon附加筛选分类信息用/分隔。tags含：长期、短期、固定、互惠、SM、角色扮演、旅行、出差、商务、陪同等。',

                    recruit_detail: '请生成一个 M-life 黑金之选招募帖的详情数据。\n\n'
                        + 'JSON 结构:\n'
                        + '{"page":"recruit_detail","data":{"hidden":"发布人真实状态、背景、是否有坑（不显示）","code":"R001","title":"标题","poster":"发布人","avatar":"emoji","vip":"无/白银/黄金/黑金","credit":"信用分","rating":"评分","history":"历史完成单","recruitType":"招募类型(单人约会/多人聚会/角色扮演等)","typeIcon":"类型图标+分类","count":"人数","time":"执行时间","city":"城市","duration":"时长","publishTime":"发布时间","expire":"有效期","status":"招募中/已锁定/已完成/已取消/争议中","ageReq":"年龄要求","bodyPref":"身材偏好","specialReq":"特殊要求","playTags":["Play标签"],"singleReward":"单人报酬","totalReward":"总报酬","serviceFee":"服务费","deposit":"押金状态","btnText":"按钮文字(报名应征/已报名/查看报名列表/无权限)","btnHint":"按钮说明","applicants":[{"code":"编号","age":0,"body":"身材","rating":"评分","orders":"完成单","note":"应征说明","ops":"操作(私信/确认/拒绝)"}],"views":0}}\n\n'
                        + '规则: recruitType从分类选(单人约会/多人聚会/角色扮演等)。body覆盖年龄体型时间地点频率要求。applicants.status:待审核/已确认/未选中/已取消。',

                    recruit_post: '请生成 M-life 黑金之选发布招募的表单数据。\n\n'
                        + 'JSON 结构:\n'
                        + '{"page":"recruit_post","data":{"form":{"titleHint":"标题占位如寻找周末约会女伴","recruitType":"招募类型(单人约会/多人聚会/角色扮演/道具play/露出任务/调教/摄影/特殊类型)","budgetHint":"预算占位如8000M币/次","tagsHint":"标签占位逗号分隔","bodyHint":"详细要求占位(包括对年龄/体型/性格/经验/时间/地点/频率的要求)","balance":"当前M币余额"}}}\n\n'
                        + '规则: 占位文字要具体吸引人，符合黑金之选高端定位。招募类型从预设分类选。',

                    recruit_manage: '请生成 M-life 黑金之选我的管理页面数据。\n\n'
                        + 'JSON 结构:\n'
                        + '{"page":"recruit_manage","data":{"tab":"我发布的/我报名的","filter":"全部/招募中/已锁定/已完成/已取消","myRecruits":[{"hidden":"真实进展（不显示）","id":"订单编号","typeIcon":"类型图标","title":"标题","recruitType":"招募类型","status":"招募中/已锁定/已完成/已取消/争议中","time":"时间","reward":"报酬","progress":"进展描述","ops":"操作(查看报名/确认人选/取消招募/联系对方)"}],"myApplications":[{"hidden":"应征动机（不显示）","id":"订单编号","typeIcon":"类型图标","title":"标题","poster":"发布人","recruitType":"招募类型","status":"已报名/已确认/已选中/未选中/已完成/已取消","time":"时间","reward":"报酬","progress":"进展描述","ops":"操作(查看详情/联系发布者/确认接单/取消报名)"}]}}\n\n'
                        + '规则: myRecruits 和 myApplications 根据 tab 填充。每个订单status和ops要对应。progress写状态补充说明。',

                    unbox: '请生成 M-life 开盒系统的角色详细数据。\n\n'
                        + 'JSON 结构:\n'
                        + '{"page":"unbox","data":{"contact":"联系人","avatar":"emoji","level":"LvX","vip":"无/白银/黄金/黑金","hasCharacter":true,"isUnboxed":true,"balance":"M币余额","character":{"id":"char_xxx","nick":"昵称","age":0,"job":"职业","level":"LvX","vip":"无/白银/黄金/黑金","purpose":"目的","registered":"新人/老用户/中间用户","bodyType":"体型","height":"身高","faceStyle":"面容","features":"特征","dailyStyle":"日常穿着","dateStyle":"约会穿着","lingerie":"内衣风格","homeStyle":"居家穿着","personality_drive":"性格驱动","personality_main":["性格标签"],"personality_contrast":"反差面","chat_style":"聊天风格","chat_pace":"节奏","chat_initiative":"主动性","chat_drive":"聊天驱动","meet_first":"初次印象","meet_real":"真实状态","meet_pace":"见面节奏","bust":"胸围","waist":"腰围","hip":"臀围","pubic":"耻骨","inner":"私处","sensitive":["敏感点"],"nsfw_drive":"性驱动","nsfw_style":"风格","nsfw_voice":"声音","nsfw_dirty_talk":"做爱话语","nsfw_likes":["喜好"],"nsfw_limits":["底线"],"nsfw_orgasm":"高潮","created_at":"创建时间"}}}\n\n'
                        + '规则: 所有 50+ 字段需填充完整，角色设定要独特。',
                };

                var prompt = prompts[pageName] || '请生成 M-life 的' + pageName + '页面数据。JSON 结构需包含 page 和 data 字段。\n\n';

                return '你是一个模拟社交软件 M-life 的内容生成器。请生成' + pageName + '页面数据。\n\n'
                    + '上下文:\n' + ctx + '\n\n'
                    + '请输出 JSON 格式，用 <mlife_app> 标签包裹。\n\n'
                    + prompt
                    + '\n规则:\n'
                    + '- 只输出 <mlife_app> 包裹的 JSON，不要多余文字\n'
                    + '- 禁止输出 <thinking> <content> 等标签\n'
                    + '- 数据要口语化、真实可信';
            }

            /**
             * 页面生成器配置
             */
            app.__pageGenerators = {
                home: { skeleton: skeletonHome, buildPrompt: buildPromptHome },
                match: { skeleton: skeletonMatch, buildPrompt: buildPromptMatch },
                detail: { skeleton: skeletonGeneric, buildPrompt: buildPromptGeneric },
                live_list: { skeleton: skeletonGeneric, buildPrompt: buildPromptGeneric },
                live: { skeleton: skeletonGeneric, buildPrompt: buildPromptGeneric },
                goddess: { skeleton: skeletonGeneric, buildPrompt: buildPromptGeneric },
                resource: { skeleton: skeletonGeneric, buildPrompt: buildPromptGeneric },
                selfie: { skeleton: skeletonGeneric, buildPrompt: buildPromptGeneric },
                chat: { skeleton: skeletonGeneric, buildPrompt: buildPromptGeneric },
                // profile: 从 MVU 变量读取，不 AI 生成
                recruit_list: { skeleton: skeletonGeneric, buildPrompt: buildPromptGeneric },
                recruit_detail: { skeleton: skeletonGeneric, buildPrompt: buildPromptGeneric },
                recruit_post: { skeleton: skeletonGeneric, buildPrompt: buildPromptGeneric },
                recruit_manage: { skeleton: skeletonGeneric, buildPrompt: buildPromptGeneric },
                unbox: { skeleton: skeletonGeneric, buildPrompt: buildPromptGeneric },
            };

            /**
             * 生成锁，防止并发
             */
            app.__isGenerating = {};

            /**
             * 重试入口（供错误页面按钮调用）
             */
            app.__retryGenerate = function(pageName) {
                app.__isGenerating[pageName] = false;
                app.__generatePageContent(pageName);
            };

            /**
             * 主生成流程：骨架屏 → 调 API → 解析 → render → 缓存 → 显示
             */
            app.__generatePageContent = async function(pageName) {
                var gen = app.__pageGenerators[pageName];
                if (!gen) return false;
                if (app.__isGenerating[pageName]) return false;
                app.__isGenerating[pageName] = true;

                var contentEl = document.getElementById('mlife-content');
                if (!contentEl) { app.__isGenerating[pageName] = false; return false; }

                try {
                    // 1. 显示骨架屏
                    contentEl.innerHTML = gen.skeleton();

                    // 2. 构建提示词并调 API
                    var prompt = gen.buildPrompt(pageName);
                    var reply = await app.__callApi(prompt);
                    if (!reply) throw new Error('API 返回为空');

                    // 3. 提取 JSON
                    var json = app.__extractMlifeJson(reply);
                    if (!json || !json.data) throw new Error('JSON 解析失败');

                    // 4. 渲染 (使用 app 上的引用，避免闭包作用域问题)
                    var html = app.__renderPageByName(pageName, json.data);
                    if (!html) throw new Error('渲染失败');

                    // 5. 检查是否已导航离开
                    if (app.currentPage !== pageName) { app.__isGenerating[pageName] = false; return false; }

                    // 6. 缓存并显示
                    app.updateCache(pageName, html);
                    contentEl.innerHTML = html;
                    app.__isGenerating[pageName] = false;
                    return true;
                } catch (err) {
                    console.warn('[MlifeApp] 生成失败', pageName, err);
                    if (app.currentPage === pageName && contentEl) {
                        contentEl.innerHTML = skeletonError(pageName, err.message);
                    }
                    app.__isGenerating[pageName] = false;
                    return false;
                }
            };

            /**
             * renderDMList — 渲染私信联系人列表
             */
            app.renderDMList = function() {
                var items = [];
                try {
                    if (typeof DM_Manager !== 'undefined' && DM_Manager.getContactList) {
                        items = DM_Manager.getContactList();
                    }
                } catch(_) {}
                if (!items || items.length === 0) {
                    return '<div style="padding:40px 20px;text-align:center;color:var(--ml-text-dim);font-size:14px;">暂无私信联系人</div>';
                }
                var listHtml = '<div style="padding:0;">';
                for (var i = 0; i < items.length; i++) {
                    var c = items[i];
                    var unread = 0;
                    try { unread = DM_Manager.getUnread(c.contact) || 0; } catch(_) {}
                    var timeStr = '';
                    if (c.lastTime) {
                        try { var d = new Date(c.lastTime); timeStr = d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); } catch(_) {}
                    }
                    var avatar = '👤';
                    try { var meta = DM_Manager.getSessionMeta(c.contact); if(meta&&meta.avatar) avatar=meta.avatar; } catch(_) {}
                    var badgeHtml = unread > 0 ? '<span style="float:right;background:#ff6b9d;color:#fff;border-radius:50%;width:22px;height:22px;text-align:center;font-size:12px;line-height:22px;font-weight:bold;">'+(unread>99?'99+':unread)+'</span>' : '';
                    listHtml += '<div onclick="MlifeApp.navigate(\'dm\',{contact:\''+app.escapeHtml(c.contact)+'\'})" style="display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--ml-border-1a);cursor:pointer;">'
                        + '<span style="font-size:36px;width:44px;text-align:center;line-height:44px;">'+app.escapeHtml(avatar)+'</span>'
                        + '<div style="flex:1;min-width:0;">'
                        + '<div style="display:flex;justify-content:space-between;"><span style="font-weight:bold;font-size:15px;color:var(--ml-text);">'+app.escapeHtml(c.contact)+'</span>'
                        + '<span style="font-size:11px;color:var(--ml-text-dimmer);">'+app.escapeHtml(timeStr)+'</span></div>'
                        + '<div style="display:flex;justify-content:space-between;"><span style="font-size:13px;color:var(--ml-text-dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px;">'+app.escapeHtml(c.lastMessage||'')+'</span>'
                        + badgeHtml+'</div></div></div>';
                }
                return '<div style="padding:0 4px;">'+listHtml+'</div>';
            };

            app.renderMatch = function(data) {
                if (!data || !data.cards || data.cards.length === 0) {
                    return '<div style="padding:30px;text-align:center;color:var(--ml-text-dim);font-size:14px;">暂无推荐</div>';
                }

                var cards = data.cards;
                var cardsHtml = [];

                for (var i = 0; i < cards.length; i++) {
                    var c = cards[i];
                    var hiddenComment = '<!-- hidden: ' + (c.hidden || '') + ' -->\n';

                    // 头像 + 昵称行
                    var headerHtml = '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">'
                        + '<span style="font-size:40px;width:48px;text-align:center;line-height:48px;flex-shrink:0;">' + (c.avatar || '') + '</span>'
                        + '<div style="flex:1;min-width:0;">'
                        + '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">'
                        + '<span style="font-weight:bold;font-size:16px;color:var(--ml-text);">' + app.escapeHtml(c.nick || '') + '</span>'
                        + (c.vip && c.vip !== '无'
                            ? '<span style="font-size:11px;padding:2px 8px;border-radius:3px;background:var(--ml-gold);color:#1a1a1a;font-weight:bold;">' + app.escapeHtml(c.vip) + '</span>'
                            : '')
                        + '</div>'
                        + '<div style="font-size:13px;color:var(--ml-text-dim);margin-top:4px;display:flex;gap:10px;">'
                        + '<span>' + (c.age || '--') + '岁</span>'
                        + '<span>&middot;</span>'
                        + '<span>' + app.escapeHtml(c.distance || '') + '</span>'
                        + '<span>&middot;</span>'
                        + '<span>' + app.escapeHtml(c.active || '') + '</span>'
                        + '</div>'
                        + '</div>'
                        + '</div>';

                    // bio 简介
                    var bioHtml = c.bio
                        ? '<div style="font-size:14px;color:var(--ml-text-bbb);line-height:1.5;margin-bottom:12px;padding:10px 12px;background:var(--ml-bg-info);border-radius:8px;border:1px solid #1a1a2e;">'
                            + app.escapeHtml(c.bio) + '</div>'
                        : '';

                    // 标签列表（flex wrap）
                    var tagsHtml = '';
                    if (c.tags && c.tags.length > 0) {
                        tagsHtml = '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">';
                        for (var j = 0; j < c.tags.length; j++) {
                            var tag = c.tags[j];
                            var tagColors = ['#ff6b9d','#00e5ff','#f6d365','#7c6bff','#50e3c2','#ff9f43'];
                            var tagColor = tagColors[j % tagColors.length];
                            tagsHtml += '<span style="display:inline-block;padding:4px 10px;border-radius:14px;background:rgba('
                                + (tagColor === '#ff6b9d' ? '255,107,157'
                                    : tagColor === '#00e5ff' ? '0,229,255'
                                    : tagColor === '#f6d365' ? '246,211,101'
                                    : tagColor === '#7c6bff' ? '124,107,255'
                                    : tagColor === '#50e3c2' ? '80,227,194'
                                    : '255,159,67') + ',0.15);'
                                + 'color:' + tagColor + ';font-size:12px;border:1px solid ' + tagColor + ';">'
                                + app.escapeHtml(tag) + '</span>';
                        }
                        tagsHtml += '</div>';
                    }

                    // 点赞数
                    var likesHtml = '<div style="margin-bottom:12px;font-size:13px;color:var(--ml-text-dim);display:flex;align-items:center;gap:4px;">'
                        + '<span style="color:var(--ml-accent);">&#x2764;</span> '
                        + (c.likes || 0) + ' 人感兴趣</div>';

                    // 操作按钮
                    var actionsHtml = '<div style="display:flex;gap:10px;">'
                        + '<button onclick="MlifeApp.action(\'/send 跳过|/trigger\')" style="flex:1;padding:10px;border-radius:10px;border:1px solid #3a3a4a;background:#16161e;color:var(--ml-text-dim);font-size:14px;cursor:pointer;font-family:inherit;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:6px;">'
                        + '<span style="font-size:16px;">&#x2715;</span> 跳过</button>'
                        + '<button onclick="MlifeApp.action(\'/send 感兴趣|/trigger\')" style="flex:1;padding:10px;border-radius:10px;border:1px solid #ff6b9d;background:var(--ml-glow-10);color:var(--ml-accent);font-size:14px;cursor:pointer;font-family:inherit;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:6px;">'
                        + '<span style="font-size:16px;">&#x2665;</span> 感兴趣</button>'
                        + '</div>';

                    // 组装卡片
                    var cardHtml = '<div style="background:var(--ml-bg-card);border:1px solid var(--ml-border);border-radius:14px;padding:16px;margin-bottom:14px;">'
                        + hiddenComment
                        + headerHtml
                        + bioHtml
                        + tagsHtml
                        + likesHtml
                        + actionsHtml
                        + '</div>';

                    cardsHtml.push(cardHtml);
                }

                var html = '<div style="padding:0;">' + cardsHtml.join('\n') + '</div>';
                MlifeApp.updateCache('match', html);
                return html;
            };

            app.renderDetail = function(data) {
                if (!data || !data.nick) {
                    return '<div style="padding:30px;text-align:center;color:var(--ml-text-dim);font-size:14px;">详情不可用</div>';
                }

                var hiddenComment = '<!-- hidden: ' + (data.hidden || '') + ' -->\n';

                // 大号头像
                var headerHtml = '<div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--ml-border);">'
                    + '<span style="font-size:56px;width:64px;text-align:center;line-height:64px;flex-shrink:0;">' + (data.avatar || '') + '</span>'
                    + '<div style="flex:1;min-width:0;">'
                    + '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">'
                    + '<span style="font-weight:bold;font-size:20px;color:var(--ml-text);">' + app.escapeHtml(data.nick || '') + '</span>'
                    + (data.vip && data.vip !== '无'
                        ? '<span style="font-size:12px;padding:2px 10px;border-radius:3px;background:var(--ml-gold);color:#1a1a1a;font-weight:bold;">' + app.escapeHtml(data.vip) + '</span>'
                        : '')
                    + '</div>'
                    + '<div style="font-size:13px;color:var(--ml-text-dim);display:flex;gap:12px;flex-wrap:wrap;margin-bottom:4px;">'
                    + '<span>' + (data.age || '--') + '岁</span>'
                    + '<span>&middot;</span>'
                    + '<span>' + app.escapeHtml(data.distance || '') + '</span>'
                    + '<span>&middot;</span>'
                    + '<span>' + app.escapeHtml(data.active || '') + '</span>'
                    + '<span>&middot;</span>'
                    + '<span>' + app.escapeHtml(data.level || '') + '</span>'
                    + '</div>'
                    + '<div style="font-size:12px;color:var(--ml-text-dimmer);display:flex;gap:10px;flex-wrap:wrap;">'
                    + '<span>' + app.escapeHtml(data.registered || '') + '</span>'
                    + '<span>&middot;</span>'
                    + '<span>' + app.escapeHtml(data.purpose || '') + '</span>'
                    + '</div>'
                    + '</div>'
                    + '</div>';

                // 简介
                var bioHtml = data.bio
                    ? '<div style="margin-bottom:14px;">'
                        + '<div style="font-size:12px;color:#008899;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">简介</div>'
                        + '<div style="font-size:14px;color:var(--ml-text-ccc);line-height:1.6;padding:10px 12px;background:var(--ml-bg-info);border-radius:8px;border:1px solid #1a1a2e;">'
                        + app.escapeHtml(data.bio) + '</div>'
                        + '</div>'
                    : '';

                // 标签列表
                var tagsHtml = '';
                if (data.tags && data.tags.length > 0) {
                    tagsHtml = '<div style="margin-bottom:14px;">'
                        + '<div style="font-size:12px;color:#008899;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">标签</div>'
                        + '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
                    for (var j = 0; j < data.tags.length; j++) {
                        tagsHtml += '<span style="display:inline-block;padding:4px 10px;border-radius:14px;background:rgba(255,107,157,0.12);color:var(--ml-accent);font-size:12px;border:1px solid #ff6b9d;">'
                            + app.escapeHtml(data.tags[j]) + '</span>';
                    }
                    tagsHtml += '</div></div>';
                }

                // 详细信息区
                var infoHtml = '<div style="margin-bottom:14px;display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
                if (data.bodyType) {
                    infoHtml += '<div style="padding:8px 10px;background:var(--ml-bg-info);border-radius:6px;border:1px solid #1a1a2e;">'
                        + '<div style="font-size:10px;color:#008899;letter-spacing:0.06em;margin-bottom:2px;">体型</div>'
                        + '<div style="font-size:13px;color:var(--ml-text-main);">' + app.escapeHtml(data.bodyType) + '</div></div>';
                }
                if (data.height) {
                    infoHtml += '<div style="padding:8px 10px;background:var(--ml-bg-info);border-radius:6px;border:1px solid #1a1a2e;">'
                        + '<div style="font-size:10px;color:#008899;letter-spacing:0.06em;margin-bottom:2px;">身高</div>'
                        + '<div style="font-size:13px;color:var(--ml-text-main);">' + app.escapeHtml(data.height) + '</div></div>';
                }
                if (data.faceStyle) {
                    infoHtml += '<div style="padding:8px 10px;background:var(--ml-bg-info);border-radius:6px;border:1px solid #1a1a2e;">'
                        + '<div style="font-size:10px;color:#008899;letter-spacing:0.06em;margin-bottom:2px;">面容</div>'
                        + '<div style="font-size:13px;color:var(--ml-text-main);">' + app.escapeHtml(data.faceStyle) + '</div></div>';
                }
                if (data.features) {
                    infoHtml += '<div style="padding:8px 10px;background:var(--ml-bg-info);border-radius:6px;border:1px solid #1a1a2e;">'
                        + '<div style="font-size:10px;color:#008899;letter-spacing:0.06em;margin-bottom:2px;">特征</div>'
                        + '<div style="font-size:13px;color:var(--ml-text-main);">' + app.escapeHtml(data.features) + '</div></div>';
                }
                infoHtml += '</div>';

                // 风格
                var styleHtml = '';
                if (data.dailyStyle || data.dateStyle) {
                    styleHtml = '<div style="margin-bottom:14px;display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
                    if (data.dailyStyle) {
                        styleHtml += '<div style="padding:8px 10px;background:var(--ml-bg-info);border-radius:6px;border:1px solid #1a1a2e;">'
                            + '<div style="font-size:10px;color:#008899;letter-spacing:0.06em;margin-bottom:2px;">日常风格</div>'
                            + '<div style="font-size:13px;color:var(--ml-text-main);">' + app.escapeHtml(data.dailyStyle) + '</div></div>';
                    }
                    if (data.dateStyle) {
                        styleHtml += '<div style="padding:8px 10px;background:var(--ml-bg-info);border-radius:6px;border:1px solid #1a1a2e;">'
                            + '<div style="font-size:10px;color:#008899;letter-spacing:0.06em;margin-bottom:2px;">约会风格</div>'
                            + '<div style="font-size:13px;color:var(--ml-text-main);">' + app.escapeHtml(data.dateStyle) + '</div></div>';
                    }
                    styleHtml += '</div>';
                }

                // 照片墙
                var imagesHtml = '';
                if (data.images && data.images.length > 0) {
                    imagesHtml = '<div style="margin-bottom:14px;">'
                        + '<div style="font-size:12px;color:#008899;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">照片 ' + data.images.length + '张</div>';
                    for (var k = 0; k < data.images.length; k++) {
                        var img = data.images[k];
                        imagesHtml += '<div style="background:var(--ml-bg-info);border-radius:8px;padding:10px 12px;margin-bottom:6px;font-size:13px;color:var(--ml-text-aaa);border:1px solid #1a1a2e;border-left:3px solid #ff6b9d;">'
                            + '<span style="color:var(--ml-accent);margin-right:6px;">&#x1F5BC;</span>'
                            + app.escapeHtml(img.desc || '') + '</div>';
                    }
                    imagesHtml += '</div>';
                }

                // 匹配时间
                var matchTimeHtml = data.matchTime
                    ? '<div style="text-align:center;font-size:12px;color:var(--ml-accent);margin-bottom:14px;padding:6px;background:rgba(255,107,157,0.08);border-radius:6px;border:1px solid rgba(255,107,157,0.2);">'
                        + '&#x2665; ' + app.escapeHtml(data.matchTime) + '</div>'
                    : '';

                // 操作按钮
                var actionsHtml = '<div style="display:flex;gap:10px;">'
                    + '<button onclick="MlifeApp.action(\'/send 返回匹配|/trigger\')" style="flex:1;padding:11px;border-radius:10px;border:1px solid #3a3a4a;background:#16161e;color:var(--ml-text-dim);font-size:14px;cursor:pointer;font-family:inherit;transition:all 0.2s;">返回</button>'
                    + '<button onclick="MlifeApp.action(\'/send 发私信给|/trigger\')" style="flex:1;padding:11px;border-radius:10px;border:1px solid #ff6b9d;background:var(--ml-glow-10);color:var(--ml-accent);font-size:14px;font-weight:bold;cursor:pointer;font-family:inherit;transition:all 0.2s;">&#x2709; 发私信</button>'
                    + '</div>';

                var html = '<div style="padding:0;">'
                    + hiddenComment
                    + '<div style="background:var(--ml-bg-card);border:1px solid var(--ml-border);border-radius:14px;padding:16px;">'
                    + headerHtml
                    + matchTimeHtml
                    + bioHtml
                    + tagsHtml
                    + infoHtml
                    + styleHtml
                    + imagesHtml
                    + actionsHtml
                    + '</div>'
                    + '</div>';

                MlifeApp.updateCache('detail', html);
                return html;
            };

            app.renderLiveList = function(data) {
                if (!data || !data.rooms || data.rooms.length === 0) {
                    return '<div style="padding:30px;text-align:center;color:var(--ml-text-dim);font-size:14px;">暂无直播</div>';
                }

                var rooms = data.rooms;
                var cards = [];

                for (var i = 0; i < rooms.length; i++) {
                    var r = rooms[i];
                    var hiddenComment = '<!-- hidden: ' + (r.hidden || '') + ' -->\n';

                    // 状态标签颜色
                    var statusColor = '#ff4757';
                    if (r.status === '即将开播') statusColor = '#ffa502';
                    else if (r.status === '回放') statusColor = '#2ed573';

                    // VIP 标签
                    var vipHtml = '';
                    if (r.vip && r.vip !== '无') {
                        vipHtml = '<span style="font-size:11px;padding:1px 7px;border-radius:3px;background:var(--ml-gold);color:#1a1a1a;font-weight:bold;">' + app.escapeHtml(r.vip) + '</span>';
                    }

                    // 标签列表
                    var tagsHtml = '';
                    if (r.tags && r.tags.length > 0) {
                        tagsHtml = '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px;">';
                        for (var j = 0; j < r.tags.length; j++) {
                            tagsHtml += '<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:var(--ml-bg-section);border:1px solid var(--ml-border);color:var(--ml-text-aaa);">' + app.escapeHtml(r.tags[j]) + '</span>';
                        }
                        tagsHtml += '</div>';
                    }

                    // 预览
                    var previewHtml = '';
                    if (r.preview) {
                        previewHtml = '<div style="font-size:13px;color:#888;margin-top:6px;padding:8px;background:var(--ml-bg-info);border-radius:6px;border-left:3px solid #ff6b9d;line-height:1.5;">'
                            + '<span style="color:var(--ml-accent);margin-right:4px;">&#x1F4F7;</span>'
                            + app.escapeHtml(r.preview)
                            + '</div>';
                    }

                    var cardHtml = '<div style="background:var(--ml-bg-card);border:1px solid var(--ml-border);border-radius:12px;padding:14px;margin-bottom:12px;cursor:pointer;" onclick="MlifeApp.action(\'/send 进入' + encodeURIComponent(r.name || '') + '的直播间|/trigger\')">'
                        + hiddenComment
                        // 头像 + 主播名 + 在线人数行
                        + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">'
                        + '<span style="font-size:36px;width:44px;text-align:center;line-height:44px;">' + (r.avatar || '') + '</span>'
                        + '<div style="flex:1;min-width:0;">'
                        + '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">'
                        + '<span style="font-weight:bold;font-size:15px;color:var(--ml-text);">' + app.escapeHtml(r.name || '') + '</span>'
                        + '<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:' + statusColor + ';color:#fff;font-weight:bold;">' + app.escapeHtml(r.status || '') + '</span>'
                        + vipHtml
                        + '</div>'
                        + '<div style="font-size:12px;color:var(--ml-text-dim);margin-top:3px;display:flex;align-items:center;gap:4px;">'
                        + '<span style="color:var(--ml-accent);">&#x1F4E1;</span> '
                        + '<span>' + (r.viewers || 0) + ' 人在看</span>'
                        + '</div>'
                        + '</div>'
                        + '</div>'
                        // 标题
                        + '<div style="font-size:14px;color:var(--ml-text-main);font-weight:500;margin-bottom:4px;">' + app.escapeHtml(r.title || '') + '</div>'
                        // 预览
                        + previewHtml
                        // 标签
                        + tagsHtml
                        + '</div>';

                    cards.push(cardHtml);
                }

                var html = '<div style="padding:0;">' + cards.join('\n') + '</div>';
                MlifeApp.updateCache('live_list', html);
                return html;
            };

            app.renderLive = function(data) {
                if (!data) {
                    return '<div style="padding:30px;text-align:center;color:var(--ml-text-dim);font-size:14px;">直播间加载中...</div>';
                }

                var hiddenComment = '<!-- hidden: ' + (data.hidden || '') + ' -->\n';

                // 主播信息头部
                var headerHtml = '<div style="background:var(--ml-bg-card);border:1px solid var(--ml-border);border-radius:12px;padding:14px;margin-bottom:12px;">'
                    + hiddenComment
                    + '<div style="display:flex;align-items:center;gap:10px;">'
                    + '<span style="font-size:40px;width:48px;text-align:center;line-height:48px;">' + (data.avatar || '') + '</span>'
                    + '<div style="flex:1;min-width:0;">'
                    + '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">'
                    + '<span style="font-weight:bold;font-size:16px;color:var(--ml-text);">' + app.escapeHtml(data.name || '') + '</span>'
                    + (data.level ? '<span style="font-size:11px;padding:1px 7px;border-radius:3px;background:#ff6b9d;color:#fff;font-weight:bold;">' + app.escapeHtml(data.level) + '</span>' : '')
                    + '<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:#ff4757;color:#fff;font-weight:bold;">' + app.escapeHtml(data.status || '直播中') + '</span>'
                    + '</div>'
                    + '<div style="font-size:13px;color:var(--ml-text-dim);margin-top:3px;display:flex;align-items:center;gap:4px;">'
                    + '<span style="color:var(--ml-accent);">&#x1F4E1;</span> '
                    + '<span>' + (data.viewers || 0) + ' 人在看</span>'
                    + '<span style="margin-left:10px;color:var(--ml-cyan);">&#x1F3A5;</span> '
                    + '<span>' + app.escapeHtml(data.title || '') + '</span>'
                    + '</div>'
                    + '</div>'
                    + '</div>'
                    + '</div>';

                // 场景描述
                var sceneHtml = '';
                if (data.scene) {
                    sceneHtml = '<div style="background:var(--ml-bg-info);border:1px solid var(--ml-border);border-radius:12px;padding:14px;margin-bottom:12px;border-left:3px solid #ff6b9d;">'
                        + '<div style="font-size:12px;color:var(--ml-accent);font-weight:bold;margin-bottom:6px;letter-spacing:0.05em;">&#x1F3AC; 直播间画面</div>'
                        + '<div style="font-size:14px;color:var(--ml-text-ccc);line-height:1.7;">' + app.escapeHtml(data.scene) + '</div>'
                        + '</div>';
                }

                // 弹幕列表
                var danmakuHtml = '';
                if (data.danmaku && data.danmaku.length > 0) {
                    danmakuHtml = '<div style="background:var(--ml-bg-card);border:1px solid var(--ml-border);border-radius:12px;padding:14px;margin-bottom:12px;">'
                        + '<div style="font-size:12px;color:var(--ml-cyan);font-weight:bold;margin-bottom:8px;letter-spacing:0.05em;">&#x1F4AC; 弹幕</div>'
                        + '<div style="max-height:200px;overflow-y:auto;">';
                    for (var di = 0; di < data.danmaku.length; di++) {
                        var d = data.danmaku[di];
                        var vipBadge = '';
                        if (d.vip && d.vip !== '无') {
                            vipBadge = '<span style="font-size:10px;padding:0 5px;border-radius:2px;background:var(--ml-gold);color:#1a1a1a;margin-left:4px;">' + app.escapeHtml(d.vip) + '</span>';
                        }
                        danmakuHtml += '<div style="padding:6px 0;' + (di > 0 ? 'border-top:1px solid #1e1e2e;' : '') + 'font-size:13px;color:var(--ml-text-ccc);display:flex;align-items:flex-start;gap:4px;">'
                            + '<span style="color:var(--ml-accent);font-weight:bold;white-space:nowrap;">' + app.escapeHtml(d.name || '') + '</span>'
                            + vipBadge
                            + '<span style="color:var(--ml-text-dim);">:</span>'
                            + '<span>' + app.escapeHtml(d.text || '') + '</span>'
                            + '</div>';
                    }
                    danmakuHtml += '</div></div>';
                }

                // 礼物列表
                var giftsHtml = '';
                if (data.gifts && data.gifts.length > 0) {
                    giftsHtml = '<div style="background:var(--ml-bg-card);border:1px solid var(--ml-border);border-radius:12px;padding:14px;margin-bottom:12px;">'
                        + '<div style="font-size:12px;color:#f6d365;font-weight:bold;margin-bottom:8px;letter-spacing:0.05em;">&#x1F381; 礼物</div>';
                    for (var gi = 0; gi < data.gifts.length; gi++) {
                        var g = data.gifts[gi];
                        giftsHtml += '<div style="display:flex;align-items:center;gap:6px;padding:6px 0;' + (gi > 0 ? 'border-top:1px solid #1e1e2e;' : '') + 'font-size:13px;">'
                            + '<span style="color:#f6d365;">&#x2B50;</span>'
                            + '<span style="color:var(--ml-text);font-weight:bold;">' + app.escapeHtml(g.name || '') + '</span>'
                            + '<span style="color:var(--ml-text-dim);">送出</span>'
                            + '<span style="color:#f6d365;font-weight:bold;">' + app.escapeHtml(g.gift || '') + '</span>'
                            + (g.value ? '<span style="color:var(--ml-accent);margin-left:4px;">(' + app.escapeHtml(g.value) + ')</span>' : '')
                            + '</div>';
                    }
                    giftsHtml += '</div>';
                }

                // 底部操作
                var actionsHtml = '<div style="background:var(--ml-bg-card);border:1px solid var(--ml-border);border-radius:12px;padding:14px;display:flex;gap:8px;">'
                    + '<input type="text" placeholder="发送弹幕..." id="danmaku-input" style="flex:1;padding:10px 12px;border-radius:8px;border:1px solid var(--ml-border);background:#0a0a14;color:var(--ml-text-main);font-size:13px;font-family:inherit;outline:none;" onkeypress="if(event.key===\'Enter\'){var v=this.value;if(v){MlifeApp.action(\'/send 发送弹幕:\' + v + \'|/trigger\');this.value=\'\';}}">'
                    + '<button onclick="MlifeApp.action(\'/send 发送弹幕:\' + document.getElementById(\'danmaku-input\').value + \'|/trigger\');document.getElementById(\'danmaku-input\').value=\'\';" style="padding:10px 16px;border-radius:8px;border:none;background:#ff6b9d;color:#fff;font-size:13px;cursor:pointer;font-family:inherit;font-weight:bold;">发送</button>'
                    + '<button onclick="MlifeApp.action(\'/send 送礼物|/trigger\')" style="padding:10px 16px;border-radius:8px;border:1px solid #f6d365;background:#2a2010;color:#f6d365;font-size:13px;cursor:pointer;font-family:inherit;font-weight:bold;">&#x1F381; 送礼</button>'
                    + '</div>';

                var html = '<div style="padding:0;">'
                    + headerHtml
                    + sceneHtml
                    + danmakuHtml
                    + giftsHtml
                    + actionsHtml
                    + '</div>';

                MlifeApp.updateCache('live', html);
                return html;
            };

            app.renderGoddess = function(data) {
                if (!data || !data.board || !data.profiles || data.profiles.length === 0) {
                    return '<div style="padding:30px;text-align:center;color:var(--ml-text-dim);font-size:14px;">暂无女神档案</div>';
                }

                var board = data.board;
                var profiles = data.profiles;

                // 板块标题 + Tab
                var tabBtns = [
                    { label: '&#x1F525; 热帖', tab: '热帖' },
                    { label: '&#x1F4F0; 最新', tab: '最新' },
                    { label: '&#x1F3C6; 精选', tab: '每周精选' }
                ];
                var tabsHtml = '';
                for (var ti = 0; ti < tabBtns.length; ti++) {
                    var t = tabBtns[ti];
                    var isActive = (board.tab === t.tab);
                    tabsHtml += '<span style="padding:4px 16px;border-radius:16px;font-size:12px;cursor:pointer;' + (isActive ? 'background:#ff6b9d;color:#fff;font-weight:bold;' : 'background:var(--ml-bg-section);color:var(--ml-text-dim);') + '" onclick="MlifeApp.action(\'/send 切换到' + t.tab + '|/trigger\')">' + t.label + '</span>';
                }

                var boardHtml = '<div style="background:var(--ml-bg-card);border:1px solid var(--ml-border);border-radius:12px;padding:14px;margin-bottom:12px;">'
                    + '<div style="font-size:16px;font-weight:bold;color:var(--ml-accent);text-align:center;margin-bottom:10px;">' + app.escapeHtml(board.name || '女神夜话') + '</div>'
                    + '<div style="display:flex;gap:8px;justify-content:center;">' + tabsHtml + '</div>'
                    + '</div>';

                var cards = [];

                for (var i = 0; i < profiles.length; i++) {
                    var p = profiles[i];

                    // 评分颜色编码
                    var scoreColor = '#2ed573';
                    if (p.score < 6) scoreColor = '#ff4757';
                    else if (p.score < 8) scoreColor = '#ffa502';

                    // 标签
                    var tagsHtml = '';
                    if (p.tags && p.tags.length > 0) {
                        tagsHtml = '<div style="display:flex;gap:4px;flex-wrap:wrap;margin:8px 0;">';
                        for (var tj = 0; tj < p.tags.length; tj++) {
                            var tag = p.tags[tj] || '';
                            var tagColor = '#2ed573';
                            var negativeKeywords = ['差', '不行', '冷', '敷衍', '快', '小', '不好', '一般', '粗鲁'];
                            for (var nk = 0; nk < negativeKeywords.length; nk++) {
                                if (tag.indexOf(negativeKeywords[nk]) !== -1) { tagColor = '#ff4757'; break; }
                            }
                            var neutralKeywords = ['普通', '还行', '凑合'];
                            for (var nuk = 0; nuk < neutralKeywords.length; nuk++) {
                                if (tag.indexOf(neutralKeywords[nuk]) !== -1) { tagColor = '#8a8a9a'; break; }
                            }
                            tagsHtml += '<span style="font-size:11px;padding:2px 10px;border-radius:10px;background:' + tagColor + '20;border:1px solid ' + tagColor + ';color:' + tagColor + ';">' + app.escapeHtml(tag) + '</span>';
                        }
                        tagsHtml += '</div>';
                    }

                    // 评价列表
                    var reviewsHtml = '';
                    if (p.reviews && p.reviews.length > 0) {
                        reviewsHtml = '<div style="margin-top:10px;background:var(--ml-bg-info);border-radius:8px;padding:10px;">'
                            + '<div style="font-size:12px;color:var(--ml-text-dim);margin-bottom:6px;">&#x1F4AC; 评价 (' + p.reviews.length + ')</div>';
                        for (var rj = 0; rj < Math.min(p.reviews.length, 5); rj++) {
                            var rv = p.reviews[rj];
                            reviewsHtml += '<div style="font-size:13px;color:var(--ml-text-ccc);padding:4px 0;' + (rj > 0 ? 'border-top:1px solid #1e1e2e;' : '') + '">'
                                + '<span style="color:var(--ml-accent);font-weight:bold;">' + app.escapeHtml(rv.author || '匿名') + '</span>'
                                + '<span style="color:var(--ml-text-dim);margin:0 4px;">:</span>'
                                + '<span>' + app.escapeHtml(rv.text || '') + '</span>'
                                + '</div>';
                        }
                        if (p.reviews.length > 5) {
                            reviewsHtml += '<div style="font-size:12px;color:var(--ml-text-dim);text-align:center;padding-top:4px;cursor:pointer;" onclick="MlifeApp.action(\'/send 查看更多评价|/trigger\')">查看更多 (' + (p.reviews.length - 5) + ' 条)...</div>';
                        }
                        reviewsHtml += '</div>';
                    }

                    var cardHtml = '<div style="background:var(--ml-bg-card);border:1px solid var(--ml-border);border-radius:12px;padding:14px;margin-bottom:12px;">'
                        + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">'
                        + '<span style="font-size:36px;width:44px;text-align:center;line-height:44px;">' + (p.avatar || '') + '</span>'
                        + '<div style="flex:1;min-width:0;">'
                        + '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">'
                        + '<span style="font-weight:bold;font-size:15px;color:var(--ml-text);">' + app.escapeHtml(p.nick || '') + '</span>'
                        + '<span style="font-size:12px;color:var(--ml-text-dim);">' + (p.age || '') + '岁</span>'
                        + '<span style="font-size:14px;font-weight:bold;color:' + scoreColor + ';">' + (p.score || '') + '</span>'
                        + '</div>'
                        + '<div style="font-size:13px;color:#f6d365;font-weight:bold;margin-top:2px;">' + app.escapeHtml(p.price || '') + '</div>'
                        + '</div>'
                        + '</div>'
                        + (p.intro ? '<div style="font-size:13px;color:var(--ml-text-aaa);line-height:1.5;margin-bottom:4px;">' + app.escapeHtml(p.intro) + '</div>' : '')
                        + tagsHtml
                        + reviewsHtml
                        + '<div style="display:flex;gap:8px;margin-top:10px;">'
                        + '<button onclick="MlifeApp.action(\'/send 约' + encodeURIComponent(p.nick || '') + '|/trigger\')" style="flex:1;padding:8px;border-radius:8px;border:none;background:linear-gradient(135deg,#ff6b9d,#ff4757);color:#fff;font-size:13px;cursor:pointer;font-family:inherit;font-weight:bold;">&#x2764; 预约</button>'
                        + '<button onclick="MlifeApp.action(\'/send 查看' + encodeURIComponent(p.nick || '') + '详情|/trigger\')" style="flex:1;padding:8px;border-radius:8px;border:1px solid var(--ml-border);background:#0a0a14;color:var(--ml-cyan);font-size:13px;cursor:pointer;font-family:inherit;">&#x1F50D; 详情</button>'
                        + '</div>'
                        + '</div>';

                    cards.push(cardHtml);
                }

                var html = '<div style="padding:0;">' + boardHtml + cards.join('\n') + '</div>';
                MlifeApp.updateCache('goddess', html);
                return html;
            };

            app.renderResource = function(data) {
                if (!data || !data.posts || data.posts.length === 0) {
                    return '<div style="padding:30px;text-align:center;color:var(--ml-text-dim);font-size:14px;">暂无资源分享</div>';
                }

                var posts = data.posts;
                var cards = [];

                for (var i = 0; i < posts.length; i++) {
                    var p = posts[i];
                    var hiddenComment = '<!-- hidden: ' + app.escapeHtml(p.hidden || '') + ' -->\n';

                    // 头像 + 昵称 + 等级
                    var headerHtml = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">'
                        + '<span style="font-size:32px;width:40px;text-align:center;line-height:40px;">' + (p.avatar || '📦') + '</span>'
                        + '<div style="flex:1;min-width:0;">'
                        + '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">'
                        + '<span style="font-weight:bold;font-size:15px;color:var(--ml-text);">' + app.escapeHtml(p.nick || '') + '</span>'
                        + '<span style="font-size:11px;padding:1px 7px;border-radius:3px;background:#ff6b9d;color:#fff;font-weight:bold;">' + app.escapeHtml(p.level || '') + '</span>'
                        + '</div>'
                        + '<div style="font-size:12px;color:var(--ml-text-dim);margin-top:2px;">' + app.escapeHtml(p.time || '') + '</div>'
                        + '</div>'
                        + '</div>';

                    // 资源标题（突出显示，更大字号）
                    var titleHtml = p.title
                        ? '<div style="font-size:17px;font-weight:bold;color:#f0e6d0;margin-bottom:6px;line-height:1.4;">'
                            + app.escapeHtml(p.title) + '</div>'
                        : '';

                    // 正文
                    var bodyHtml = p.body
                        ? '<div style="font-size:14px;color:var(--ml-text-ccc);line-height:1.6;margin-bottom:8px;white-space:pre-wrap;">'
                            + app.escapeHtml(p.body) + '</div>'
                        : '';

                    // 文件大小 + 格式标签
                    var fileInfoHtml = '';
                    if (p.size || p.format) {
                        fileInfoHtml = '<div style="display:flex;gap:8px;margin-bottom:8px;">';
                        if (p.size) {
                            fileInfoHtml += '<span style="font-size:12px;padding:2px 8px;border-radius:4px;background:#1a2a3a;color:#66ccff;border:1px solid #2a4a6a;">'
                                + app.escapeHtml(p.size) + '</span>';
                        }
                        if (p.format) {
                            fileInfoHtml += '<span style="font-size:12px;padding:2px 8px;border-radius:4px;background:#2a1a1a;color:#ff8866;border:1px solid #4a2a2a;">'
                                + app.escapeHtml(p.format) + '</span>';
                        }
                        if (p.price && p.price !== '无') {
                            var priceColor = p.price.indexOf('免费') !== -1 ? '#66dd88' : '#ffcc44';
                            fileInfoHtml += '<span style="font-size:12px;padding:2px 8px;border-radius:4px;background:#1a2a1a;color:' + priceColor + ';border:1px solid #2a4a2a;">'
                                + app.escapeHtml(p.price) + '</span>';
                        }
                        fileInfoHtml += '</div>';
                    }

                    // 统计行
                    var statsHtml = '<div style="display:flex;gap:16px;margin-bottom:8px;font-size:13px;color:var(--ml-text-dim);">'
                        + '<span style="display:flex;align-items:center;gap:4px;"><span style="color:var(--ml-accent);">&#x2764;</span> ' + (p.likes || 0) + '</span>'
                        + '<span style="display:flex;align-items:center;gap:4px;"><span style="color:var(--ml-cyan);">&#x1F4AC;</span> ' + (p.comments || 0) + '</span>'
                        + '<span style="display:flex;align-items:center;gap:4px;"><span style="color:#88dd88;">&#x2B07;</span> ' + (p.downloads || 0) + '</span>'
                        + '</div>';

                    // "下载" 按钮
                    var actionsHtml = '<div style="display:flex;gap:8px;margin-bottom:0;">'
                        + '<button onclick="MlifeApp.action(\'/send 下载资源|/trigger\')" style="flex:1;padding:10px;border-radius:8px;border:1px solid #2a6a4a;background:linear-gradient(135deg,#1a3a2a,#0d2618);color:#66dd88;font-size:14px;font-weight:bold;cursor:pointer;font-family:inherit;transition:background 0.2s;">&#x2B07; 下载</button>'
                        + '</div>';

                    // 组装卡片
                    var cardHtml = '<div style="background:var(--ml-bg-card);border:1px solid var(--ml-border);border-radius:12px;padding:14px;margin-bottom:12px;">'
                        + hiddenComment
                        + headerHtml
                        + titleHtml
                        + bodyHtml
                        + fileInfoHtml
                        + statsHtml
                        + actionsHtml
                        + '</div>';

                    cards.push(cardHtml);
                }

                var html = '<div style="padding:0;">' + cards.join('\n') + '</div>';
                MlifeApp.updateCache('resource', html);
                return html;
            };

            // ---- 个人中心（基于变量渲染） ----
            app.renderProfile = function(data) {
                var vars = app.getMergedVars().stat_data || {};
                var mu = vars['M-life_用户'] || {};
                var social = vars['M-life_社交'] || {};
                var econ = vars['M-life_经济'] || {};
                var heijin = vars['M-life_黑金'] || {};
                var account = getCurrentAccount();

                // 变量数据作为基础，AI 生成/传入的 data 作为覆盖
                var p = data || {};
                var isVipBlack = (p.vip === '黑金' || mu.VIP类型 === '黑金');
                var sections = p.sections || [
                    {id:'selfie', name:'日常自拍', icon:'📸', locked:false},
                    {id:'chat', name:'闲聊灌水', icon:'💬', locked:false},
                    {id:'resource', name:'资源分享', icon:'📦', locked:false},
                    {id:'goddess', name:'女神夜话', icon:'👑', locked:false},
                    {id:'recruit_list', name:'黑金之选', icon:'💎', locked:!isVipBlack}
                ];

                // 顶部用户信息（变量为基底，AI 数据覆盖）
                var nick = p.nick || mu.昵称 || '用户';
                var level = p.level || mu.用户等级 || 'Lv1';
                var vip = p.vip || mu.VIP类型 || '无';
                var headerHtml = '<div style="padding:16px 16px 12px;text-align:center;border-bottom:1px solid var(--ml-border);">'
                    + '<div style="font-size:48px;margin-bottom:8px;">' + (p.avatar || '😊') + '</div>'
                    + '<div style="font-size:18px;font-weight:bold;color:var(--ml-text);">' + app.escapeHtml(nick) + '</div>'
                    + '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px;font-size:13px;">'
                    + '<span style="padding:1px 7px;border-radius:3px;background:#ff6b9d;color:#fff;font-weight:bold;font-size:12px;">' + app.escapeHtml(level) + '</span>'
                    + (vip && vip !== '无'
                        ? '<span style="padding:1px 7px;border-radius:3px;background:var(--ml-gold);color:#1a1a1a;font-weight:bold;font-size:12px;">' + app.escapeHtml(vip) + 'VIP</span>'
                        : '<span style="padding:1px 7px;border-radius:3px;background:#333;color:#999;font-size:12px;">未开通VIP</span>')
                    + '</div>'
                    + (p.bio ? '<div style="font-size:13px;color:var(--ml-text-aaa);margin-top:8px;max-width:280px;margin-left:auto;margin-right:auto;">' + app.escapeHtml(p.bio) + '</div>' : '')
                    + '</div>';

                // 社交统计（变量优先）
                var stats = p.stats || {};
                var statsHtml = '<div style="display:flex;padding:12px 16px;border-bottom:1px solid var(--ml-border);">'
                    + '<div style="flex:1;text-align:center;"><div style="font-size:16px;font-weight:bold;color:var(--ml-text);">' + (stats.following || parseInt(social.关注数) || 0) + '</div><div style="font-size:11px;color:var(--ml-text-dim);margin-top:2px;">关注</div></div>'
                    + '<div style="flex:1;text-align:center;"><div style="font-size:16px;font-weight:bold;color:var(--ml-text);">' + (stats.followers || parseInt(social.粉丝数) || 0) + '</div><div style="font-size:11px;color:var(--ml-text-dim);margin-top:2px;">粉丝</div></div>'
                    + '<div style="flex:1;text-align:center;"><div style="font-size:16px;font-weight:bold;color:var(--ml-text);">' + (stats.likes || parseInt(social.获赞总数) || 0) + '</div><div style="font-size:11px;color:var(--ml-text-dim);margin-top:2px;">获赞</div></div>'
                    + '<div style="flex:1;text-align:center;"><div style="font-size:16px;font-weight:bold;color:var(--ml-text);">' + (stats.posts || 0) + '</div><div style="font-size:11px;color:var(--ml-text-dim);margin-top:2px;">帖子</div></div>'
                    + '</div>';

                // 账号切换
                var accountSwitcherHtml = '<div style="padding:8px 16px;border-bottom:1px solid var(--ml-border);">'
                    + '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;">'
                    + '<span style="font-size:13px;color:var(--ml-text-dim);">🔄 切换账号</span>'
                    + '<select id="mlife-account-select" style="background:var(--ml-bg-section);color:var(--ml-text-main);border:1px solid #2a2a3e;border-radius:6px;padding:6px 10px;font-size:13px;font-family:inherit;cursor:pointer;outline:none;"'
                    + ' onchange="MlifeApp.switchAccount(this.value)">'
                    + app.ACCOUNTS.map(function(a) {
                        return '<option value="' + a.id + '"' + (a.id === (account && account.id) ? ' selected' : '') + '>'
                            + a.emoji + ' ' + app.escapeHtml(a.label)
                            + '</option>';
                      }).join('')
                    + '</select>'
                    + '</div>'
                    + '</div>';

                // 板块导航列表
                var sectionsHtml = '<div style="padding:8px 0;">';
                for (var i = 0; i < sections.length; i++) {
                    var sec = sections[i];
                    var onclick = sec.locked
                        ? 'showHeiJinDenied()'
                        : 'MlifeApp.switchTab(\'' + sec.id + '\')';
                    sectionsHtml += '<div style="display:flex;align-items:center;padding:12px 16px;cursor:pointer;transition:background 0.2s;"'
                        + ' onclick="' + onclick + '"'
                        + ' onmouseover="this.style.background=\'#1a1a2e\'" onmouseout="this.style.background=\'transparent\'">'
                        + '<span style="font-size:20px;margin-right:12px;">' + sec.icon + '</span>'
                        + '<span style="flex:1;font-size:14px;color:var(--ml-text-main);">' + sec.name + '</span>';
                    if (sec.locked) {
                        sectionsHtml += '<span style="font-size:14px;color:var(--ml-text-dim);">🔒 黑金VIP</span>';
                    } else {
                        sectionsHtml += '<span style="font-size:14px;color:#555;">›</span>';
                    }
                    sectionsHtml += '</div>';
                }
                sectionsHtml += '</div>';

                // 底部功能按钮（签到状态从变量读取）
                var settings = p.settings || {};
                var checkedIn = settings.checkedIn || social.今日已签到 === 'true';
                var streakDays = settings.streakDays || parseInt(social.连续签到天数) || 0;
                var bottomHtml = '<div style="border-top:1px solid #1e1e2e;padding:8px 0;">'
                    + '<div style="display:flex;align-items:center;padding:12px 16px;cursor:pointer;transition:background 0.2s;"'
                    + ' onclick="MlifeApp.switchTab(\'settings\')"'
                    + ' onmouseover="this.style.background=\'#1a1a2e\'" onmouseout="this.style.background=\'transparent\'">'
                    + '<span style="font-size:18px;margin-right:12px;">⚙️</span>'
                    + '<span style="flex:1;font-size:14px;color:var(--ml-text-main);">个人设置</span>'
                    + '<span style="font-size:14px;color:#555;">›</span>'
                    + '</div>'
                    + '<div style="display:flex;align-items:center;padding:12px 16px;cursor:pointer;transition:background 0.2s;"'
                    + ' onclick="MlifeApp.action(\'/send 签到|/trigger\')"'
                    + ' onmouseover="this.style.background=\'#1a1a2e\'" onmouseout="this.style.background=\'transparent\'">'
                    + '<span style="font-size:18px;margin-right:12px;">📅</span>'
                    + '<span style="flex:1;font-size:14px;color:var(--ml-text-main);">签到</span>'
                    + (checkedIn ? '<span style="font-size:12px;color:#34d399;">今日已签到</span>' : '')
                    + (streakDays > 0 ? '<span style="font-size:12px;color:#f6d365;margin-left:6px;">连签' + streakDays + '天</span>' : '')
                    + '</div>'
                    + '</div>';

                var html = '<div style="padding:0;">'
                    + '<!-- hidden: ' + app.escapeHtml(p.hidden || '') + ' -->\n'
                    + headerHtml
                    + statsHtml
                    + accountSwitcherHtml
                    + sectionsHtml
                    + bottomHtml
                    + '</div>';
                MlifeApp.updateCache('profile', html);
                return html;
            };

            app.renderSelfie = function(data) {
                if (!data || !data.posts || data.posts.length === 0) {
                    return '<div style="padding:30px;text-align:center;color:var(--ml-text-dim);font-size:14px;">暂无自拍帖</div>';
                }

                var posts = data.posts;
                var cards = [];

                for (var i = 0; i < posts.length; i++) {
                    var p = posts[i];
                    var hiddenComment = '<!-- hidden: ' + (p.hidden || '') + ' -->\n';

                    // 头像 + 昵称行
                    var headerHtml = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">'
                        + '<span style="font-size:32px;width:40px;text-align:center;line-height:40px;">' + (p.avatar || '') + '</span>'
                        + '<div style="flex:1;min-width:0;">'
                        + '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">'
                        + '<span style="font-weight:bold;font-size:15px;color:var(--ml-text);">' + app.escapeHtml(p.nick || '') + '</span>'
                        + '<span style="font-size:11px;padding:1px 7px;border-radius:3px;background:#ff6b9d;color:#fff;font-weight:bold;">' + app.escapeHtml(p.level || '') + '</span>'
                        + (p.vip && p.vip !== '无'
                            ? '<span style="font-size:11px;padding:1px 7px;border-radius:3px;background:var(--ml-gold);color:#1a1a1a;font-weight:bold;">' + app.escapeHtml(p.vip) + '</span>'
                            : '')
                        + '</div>'
                        + '<div style="font-size:12px;color:var(--ml-text-dim);margin-top:3px;">'
                        + app.escapeHtml(p.time || '')
                        + '</div>'
                        + '</div>'
                        + '</div>';

                    // 正文
                    var bodyHtml = p.body
                        ? '<div style="font-size:14px;color:var(--ml-text-main);line-height:1.6;margin-bottom:10px;white-space:pre-wrap;">' + app.escapeHtml(p.body) + '</div>'
                        : '';

                    // 图片展示区（强调）
                    var imagesHtml = '';
                    if (p.images && p.images.length > 0) {
                        imagesHtml = '<div style="margin-bottom:10px;">'
                            + '<div style="font-size:12px;color:var(--ml-accent);font-weight:bold;margin-bottom:6px;">&#x1F5BC; 图片</div>';
                        for (var j = 0; j < p.images.length; j++) {
                            var img = p.images[j];
                            var isFirst = (j === 0);
                            imagesHtml += '<div style="background:var(--ml-bg-section);border-radius:8px;padding:12px;margin-bottom:8px;font-size:13px;color:var(--ml-text-ccc);border:1px solid var(--ml-border);' + (isFirst ? 'border-left:3px solid #ff6b9d;' : 'border-left:3px solid #556;') + '">'
                                + (isFirst ? '<span style="color:var(--ml-accent);margin-right:6px;">&#x1F4F8;</span>' : '<span style="color:var(--ml-text-dim);margin-right:6px;">&#x1F4F8;</span>')
                                + app.escapeHtml(img.desc || '')
                                + '</div>';
                        }
                        imagesHtml += '</div>';
                    }

                    // 付费墙
                    var paywallHtml = '';
                    if (p.paywall && p.paywall !== '无') {
                        paywallHtml = '<div style="margin-bottom:10px;padding:8px 12px;border-radius:8px;background:linear-gradient(135deg,#2a1a1a,#1a1a2e);border:1px solid #ff6b9d;color:var(--ml-accent);font-size:13px;display:flex;align-items:center;gap:8px;">'
                            + '<span>&#x1F512;</span>'
                            + app.escapeHtml(p.paywall)
                            + '</div>';
                    }

                    // 统计行
                    var statsHtml = '<div style="display:flex;gap:16px;margin-bottom:10px;font-size:13px;color:var(--ml-text-dim);">'
                        + '<span style="display:flex;align-items:center;gap:4px;"><span style="color:var(--ml-accent);">&#x2764;</span> ' + (p.likes || 0) + '</span>'
                        + '<span style="display:flex;align-items:center;gap:4px;"><span style="color:var(--ml-cyan);">&#x1F4AC;</span> ' + (p.comments || 0) + '</span>'
                        + '<span style="display:flex;align-items:center;gap:4px;"><span style="color:var(--ml-text-dim);">&#x21AA;</span> ' + (p.shares || 0) + '</span>'
                        + '</div>';

                    // 互动按钮
                    var actionsHtml = '<div style="display:flex;gap:8px;margin-bottom:10px;">'
                        + '<button onclick="MlifeApp.action(\'/send 点赞自拍|/trigger\')" style="flex:1;padding:8px;border-radius:8px;border:1px solid var(--ml-border);background:var(--ml-bg-card);color:var(--ml-accent);font-size:13px;cursor:pointer;font-family:inherit;">&#x2764; 点赞</button>'
                        + '<button onclick="MlifeApp.action(\'/send 查看自拍评论|/trigger\')" style="flex:1;padding:8px;border-radius:8px;border:1px solid var(--ml-border);background:var(--ml-bg-card);color:var(--ml-cyan);font-size:13px;cursor:pointer;font-family:inherit;">&#x1F4AC; 评论</button>'
                        + (p.paywall && p.paywall !== '无'
                            ? '<button onclick="MlifeApp.action(\'/send 解锁完整版|/trigger\')" style="flex:0;padding:8px 14px;border-radius:8px;border:none;background:var(--ml-gold);color:#1a1a1a;font-size:13px;cursor:pointer;font-family:inherit;font-weight:bold;">&#x1F512; 解锁</button>'
                            : '')
                        + '</div>';

                    // 组装卡片
                    var cardHtml = '<div style="background:var(--ml-bg-card);border:1px solid var(--ml-border);border-radius:12px;padding:14px;margin-bottom:12px;">'
                        + hiddenComment
                        + headerHtml
                        + bodyHtml
                        + imagesHtml
                        + paywallHtml
                        + statsHtml
                        + actionsHtml
                        + '</div>';

                    cards.push(cardHtml);
                }

                var html = '<div style="padding:0;">' + cards.join('\n') + '</div>';
                MlifeApp.updateCache('selfie', html);
                return html;
            };

            app.renderChat = function(data) {
                if (!data || !data.posts || data.posts.length === 0) {
                    return '<div style="padding:30px;text-align:center;color:var(--ml-text-dim);font-size:14px;">暂无帖子</div>';
                }

                var posts = data.posts;
                var cards = [];

                for (var i = 0; i < posts.length; i++) {
                    var p = posts[i];
                    var hiddenComment = '<!-- hidden: ' + app.escapeHtml(p.hidden || '') + ' -->\n';

                    // 头像 + 昵称 + 等级 + 时间
                    var headerHtml = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">'
                        + '<span style="font-size:28px;width:36px;text-align:center;line-height:36px;">' + (p.avatar || '💬') + '</span>'
                        + '<div style="flex:1;min-width:0;">'
                        + '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">'
                        + '<span style="font-weight:bold;font-size:14px;color:var(--ml-text);">' + app.escapeHtml(p.nick || '') + '</span>'
                        + '<span style="font-size:11px;padding:1px 7px;border-radius:3px;background:#ff6b9d;color:#fff;font-weight:bold;">' + app.escapeHtml(p.level || '') + '</span>'
                        + (p.vip && p.vip !== '无'
                            ? '<span style="font-size:10px;padding:1px 6px;border-radius:3px;background:var(--ml-gold);color:#1a1a1a;font-weight:bold;">' + app.escapeHtml(p.vip) + '</span>'
                            : '')
                        + '</div>'
                        + '<div style="font-size:12px;color:var(--ml-text-dim);margin-top:2px;">' + app.escapeHtml(p.time || '') + '</div>'
                        + '</div>'
                        + '</div>';

                    // 帖子标题（粗体，大字号）
                    var titleHtml = p.title
                        ? '<div style="font-size:16px;font-weight:bold;color:#f0e6d0;margin-bottom:6px;line-height:1.4;">'
                            + app.escapeHtml(p.title) + '</div>'
                        : '';

                    // 正文摘要
                    var bodyHtml = p.body
                        ? '<div style="font-size:14px;color:var(--ml-text-ccc);line-height:1.6;margin-bottom:8px;white-space:pre-wrap;">'
                            + app.escapeHtml(p.body) + '</div>'
                        : '';

                    // 投票
                    var pollHtml = '';
                    if (p.poll && p.poll.options && p.poll.options.length > 0) {
                        pollHtml = '<div style="background:var(--ml-bg-info);border-radius:8px;padding:8px 12px;margin-bottom:8px;border:1px solid var(--ml-border);">';
                        for (var k = 0; k < p.poll.options.length; k++) {
                            var opt = p.poll.options[k];
                            var pct = opt.percent || 0;
                            var barColor = k % 2 === 0 ? '#ff6b9d' : '#00e5ff';
                            pollHtml += '<div style="font-size:13px;color:var(--ml-text-ccc);margin-bottom:4px;">'
                                + '<div style="display:flex;justify-content:space-between;margin-bottom:2px;">'
                                + '<span>' + app.escapeHtml(opt.label || '') + '</span>'
                                + '<span style="color:' + barColor + ';">' + pct + '%</span>'
                                + '</div>'
                                + '<div style="height:6px;border-radius:3px;background:var(--ml-bg-section);overflow:hidden;">'
                                + '<div style="height:100%;width:' + pct + '%;border-radius:3px;background:' + barColor + ';transition:width 0.3s;"></div>'
                                + '</div>'
                                + '</div>';
                        }
                        if (p.poll.totalVotes) {
                            pollHtml += '<div style="font-size:11px;color:var(--ml-text-dimmer);margin-top:4px;">共 ' + p.poll.totalVotes + ' 人参与</div>';
                        }
                        pollHtml += '</div>';
                    }

                    // 热评
                    var hotCommentsHtml = '';
                    if (p.hotComments && p.hotComments.length > 0) {
                        hotCommentsHtml = '<div style="background:var(--ml-bg-info);border-radius:8px;padding:6px 10px;margin-bottom:8px;">';
                        for (var m = 0; m < p.hotComments.length; m++) {
                            var hc = p.hotComments[m];
                            hotCommentsHtml += '<div style="font-size:12px;color:var(--ml-text-bbb);padding:3px 0;' + (m > 0 ? 'border-top:1px solid #1e1e2e;' : '') + '">'
                                + '<span style="color:var(--ml-accent);font-weight:bold;">' + app.escapeHtml(hc.name || '') + '</span>'
                                + '<span style="color:var(--ml-text-dimmer);margin:0 4px;">:</span>'
                                + '<span>' + app.escapeHtml(hc.text || '') + '</span>'
                                + '</div>';
                        }
                        hotCommentsHtml += '</div>';
                    }

                    // 统计行
                    var statsHtml = '<div style="display:flex;gap:16px;margin-bottom:8px;font-size:13px;color:var(--ml-text-dim);">'
                        + '<span style="display:flex;align-items:center;gap:4px;"><span style="color:var(--ml-cyan);">&#x1F4AC;</span> ' + (p.replies || 0) + '</span>'
                        + '<span style="display:flex;align-items:center;gap:4px;"><span style="color:var(--ml-text-dim);">&#x1F441;</span> ' + (p.views || 0) + '</span>'
                        + '<span style="display:flex;align-items:center;gap:4px;"><span style="color:var(--ml-accent);">&#x2764;</span> ' + (p.likes || 0) + '</span>'
                        + '</div>';

                    // "回帖" 按钮
                    var actionsHtml = '<div style="display:flex;gap:8px;margin-bottom:0;">'
                        + '<button onclick="MlifeApp.action(\'/send 回复帖子|/trigger\')" style="flex:1;padding:10px;border-radius:8px;border:1px solid #2a4a6a;background:linear-gradient(135deg,#1a2a3a,#0d1826);color:#66ccff;font-size:14px;font-weight:bold;cursor:pointer;font-family:inherit;transition:background 0.2s;">&#x1F4AC; 回帖</button>'
                        + '</div>';

                    // 组装卡片
                    var cardHtml = '<div style="background:var(--ml-bg-card);border:1px solid var(--ml-border);border-radius:12px;padding:14px;margin-bottom:12px;">'
                        + hiddenComment
                        + headerHtml
                        + titleHtml
                        + bodyHtml
                        + pollHtml
                        + hotCommentsHtml
                        + statsHtml
                        + actionsHtml
                        + '</div>';

                    cards.push(cardHtml);
                }

                var html = '<div style="padding:0;">' + cards.join('\n') + '</div>';
                MlifeApp.updateCache('chat', html);
                return html;
            };

            app.renderDM = function(data) {
                if (!data || !data.contact) {
                    return '<div style="padding:30px;text-align:center;color:var(--ml-text-dim);font-size:14px;">选择联系人开始聊天</div>';
                }

                // 1. 尝试从 localStorage 加载历史
                var cached = MlifeApp.loadDM(data.contact);
                var messages = data.messages || [];

                // 2. 如果 AI 给的数据比缓存新，用 AI 数据覆盖缓存
                if (messages.length > 0) {
                    MlifeApp.saveDM(data.contact, data);
                } else if (cached) {
                    // 没有新数据但有缓存 → 用缓存
                    messages = cached.messages || [];
                    data.avatar = cached.avatar;
                    data.level = cached.level;
                }

                // 3. 渲染聊天界面
                // 私信返回按钮：前端导航到匹配页面（不触发AI）
                var headerHtml = '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;margin-bottom:10px;border-bottom:1px solid var(--ml-border);flex-shrink:0;">'
                    + '<button onclick="MlifeApp.switchTab(\'match\')" style="background:none;border:none;color:var(--ml-text-dim);font-size:18px;cursor:pointer;padding:0 4px;font-family:inherit;">&#x2190;</button>'
                    + '<span style="font-size:36px;width:42px;text-align:center;line-height:42px;flex-shrink:0;">' + (data.avatar || '') + '</span>'
                    + '<div style="flex:1;min-width:0;">'
                    + '<div style="display:flex;align-items:center;gap:6px;">'
                    + '<span style="font-weight:bold;font-size:16px;color:var(--ml-text);">' + app.escapeHtml(data.contact) + '</span>'
                    + (data.level ? '<span style="font-size:11px;padding:1px 6px;border-radius:3px;background:#ff6b9d;color:#fff;font-weight:bold;">' + app.escapeHtml(data.level) + '</span>' : '')
                    + '</div>'
                    + '</div>'
                    + '</div>';

                // 3.5 开盒入口按钮（有角色数据时显示）
                var unboxBtnHtml = '';
                if (data.hasCharacter && data.contact) {
                    unboxBtnHtml = '<div style="margin-bottom:10px;">'
                        + '<button onclick="MlifeApp.action(\'/send 开盒' + encodeURIComponent(data.contact) + '|/trigger\')" '
                        + 'style="width:100%;padding:10px;border-radius:10px;border:1px solid #f6d365;'
                        + 'background:linear-gradient(135deg,rgba(246,211,101,0.1),rgba(253,160,133,0.1));'
                        + 'color:#f6d365;font-size:14px;font-weight:bold;cursor:pointer;font-family:inherit;'
                        + 'transition:background 0.2s;"'
                        + 'onmouseover="this.style.background=\'linear-gradient(135deg,rgba(246,211,101,0.2),rgba(253,160,133,0.2))\'"'
                        + 'onmouseout="this.style.background=\'linear-gradient(135deg,rgba(246,211,101,0.1),rgba(253,160,133,0.1))\'">'
                        + '&#x1F48E; 开盒查看完整信息 (100 M币)</button>'
                        + '</div>';
                }

                // 消息气泡
                var messagesHtml = '';
                if (messages && messages.length > 0) {
                    messagesHtml = '<div style="margin-bottom:10px;">';
                    for (var i = 0; i < messages.length; i++) {
                        var msg = messages[i];
                        var hiddenComment = '<!-- hidden: ' + (msg.hidden || '') + ' -->\n';
                        var isIncoming = msg.type === 'incoming';
                        var align = isIncoming ? 'left' : 'right';
                        var bubbleBg = isIncoming ? '#1e1e2e' : '#ff6b9d';
                        var bubbleColor = isIncoming ? '#ddd' : '#fff';
                        var borderRadius = isIncoming ? '12px 12px 12px 4px' : '12px 12px 4px 12px';

                        var contentHtml = '';

                        if (msg.msgType === 'voice') {
                            // 语音消息
                            contentHtml = '<div style="display:flex;align-items:center;gap:8px;">'
                                + '<span style="font-size:18px;">&#x1F3B5;</span>'
                                + '<span style="font-size:13px;">' + app.escapeHtml(msg.duration || '') + '</span>'
                                + '</div>'
                                + (msg.transcript ? '<div style="font-size:12px;color:' + (isIncoming ? '#8a8a9a' : 'rgba(255,255,255,0.7)') + ';margin-top:4px;padding-top:4px;border-top:1px solid ' + (isIncoming ? '#2e2e3e' : 'rgba(255,255,255,0.2)') + ';">语音转文字: ' + app.escapeHtml(msg.transcript) + '</div>' : '');
                        } else if (msg.msgType === 'image') {
                            // 图片消息
                            var images = msg.images || [];
                            var imgParts = [];
                            for (var k = 0; k < images.length; k++) {
                                imgParts.push('<div style="font-size:13px;color:' + (isIncoming ? '#bbb' : 'rgba(255,255,255,0.85)') + ';padding:6px 8px;border:1px dashed ' + (isIncoming ? '#3a3a4a' : 'rgba(255,255,255,0.3)') + ';border-radius:6px;margin-bottom:4px;">&#x1F5BC; ' + app.escapeHtml(images[k].desc || '') + '</div>');
                            }
                            contentHtml = imgParts.join('');
                        } else {
                            // 纯文字消息
                            contentHtml = '<span style="font-size:14px;white-space:pre-wrap;">' + app.escapeHtml(msg.text || '') + '</span>';
                        }

                        // 状态标记（已读/未读）
                        var statusHtml = '';
                        if (!isIncoming && msg.status) {
                            statusHtml = '<span style="font-size:11px;color:rgba(255,255,255,0.5);margin-left:6px;">' + app.escapeHtml(msg.status) + '</span>';
                        }

                        // 时间戳
                        var timeHtml = msg.time
                            ? '<div style="font-size:11px;color:var(--ml-text-dimmer);text-align:' + align + ';margin-top:3px;">' + app.escapeHtml(msg.time) + '</div>'
                            : '';

                        messagesHtml += hiddenComment
                            + '<div style="text-align:' + align + ';margin-bottom:10px;">'
                            + '<div style="display:inline-block;max-width:80%;text-align:left;padding:10px 14px;border-radius:' + borderRadius + ';background:' + bubbleBg + ';color:' + bubbleColor + ';">'
                            + contentHtml
                            + statusHtml
                            + '</div>'
                            + timeHtml
                            + '</div>';
                    }
                    messagesHtml += '</div>';
                } else {
                    messagesHtml = '<div style="text-align:center;padding:30px;color:var(--ml-text-dim);font-size:13px;">暂无消息，发送第一条消息开始聊天</div>';
                }

                // 4. 底部输入框
                var inputHtml = '<div style="display:flex;gap:8px;padding:10px 0;border-top:1px solid #1e1e2e;margin-top:auto;">'
                    + '<input id="mlife-dm-input" type="text" placeholder="输入消息..." style="flex:1;padding:10px 14px;border-radius:20px;border:1px solid #2a2a3a;background:var(--ml-bg-info);color:var(--ml-text-main);font-size:14px;outline:none;font-family:inherit;" onkeydown="if(event.key===\'Enter\')document.getElementById(\'mlife-dm-send\').click()">'
                    + '<button id="mlife-dm-send" onclick="(function(){var input=document.getElementById(\'mlife-dm-input\');var text=input.value.trim();if(!text)return;MlifeApp.action(\'/send 回复' + app.escapeHtml(data.contact) + ':\'+text+\'|/trigger\');})()" style="width:44px;height:44px;border-radius:50%;border:none;background:#ff6b9d;color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:inherit;flex-shrink:0;">&#x27A4;</button>'
                    + '</div>';

                var html = '<div style="display:flex;flex-direction:column;height:100%;min-height:0;">'
                    + headerHtml
                    + '<div style="flex:1;overflow-y:auto;overflow-x:hidden;padding-right:4px;min-height:0;">'
                    + unboxBtnHtml
                    + messagesHtml
                    + '</div>'
                    + inputHtml
                    + '</div>';

                // 5. 缓存
                MlifeApp.updateCache('dm', html);
                return html;
            };

            app.renderRecruitList = function(data) {
                if (!data || !data.recruits || data.recruits.length === 0) {
                    return '<div style="padding:30px;text-align:center;color:var(--ml-text-dim);font-size:14px;letter-spacing:0.06em;">暂无招募帖</div>';
                }

                var recruits = data.recruits;
                var cards = [];

                // 生成筛选标签按钮（全部 + 各分类）
                var allFilters = ['全部', '单人约会', '多人聚会', '角色扮演', '道具play', '露出任务', '调教', '摄影', '特殊类型'];
                var currentFilter = data._filter || '全部';
                var filterBarHtml = '<div style="padding:10px 16px;display:flex;flex-wrap:wrap;gap:6px 8px;border-bottom:1px solid rgba(201,169,110,0.12);">';
                var filterKeys = { '单人约会': '单人', '多人聚会': '多人', '角色扮演': '角色扮演', '道具play': '道具', '露出任务': '露出', '调教': '调教', '摄影': '摄影', '特殊类型': '特殊' };
                for (var fi = 0; fi < allFilters.length; fi++) {
                    var f = allFilters[fi];
                    var cls = f === currentFilter ? 'rgba(201,169,110,0.15)' : 'transparent';
                    var borderCls = f === currentFilter ? '#c9a96e' : 'transparent';
                    var colorCls = f === currentFilter ? '#c9a96e' : '#8a8a9a';
                    filterBarHtml += '<span onclick="MlifeApp.navigate(\'recruit_list\',{_filter:\'' + f + '\',recruits:MlifeApp.__lastRecruitData || []})" style="padding:4px 12px;border-radius:14px;font-size:12px;white-space:nowrap;cursor:pointer;background:' + cls + ';color:' + colorCls + ';border:1px solid ' + borderCls + ';transition:all 0.2s;">' + f + '</span>';
                }
                filterBarHtml += '</div>';

                // 根据筛选过滤
                var filtered = [];
                for (var fi2 = 0; fi2 < recruits.length; fi2++) {
                    var rr = recruits[fi2];
                    if (currentFilter === '全部') {
                        filtered.push(rr);
                    } else {
                        // 从 hidden、typeIcon、tags 中匹配筛选分类
                        var searchText = (rr.hidden || '') + ' ' + (rr.typeIcon || '') + ' ' + (rr.tags ? rr.tags.join(' ') : '');
                        if (searchText.indexOf(filterKeys[currentFilter] || currentFilter) !== -1) {
                            filtered.push(rr);
                        }
                    }
                }

                for (var i = 0; i < filtered.length; i++) {
                    var r = filtered[i];

                    // 状态标签
                    var isActiveStatus = r.status === '招募中';
                    var statusColor = isActiveStatus ? '#34d399' : '#9ca3af';
                    var statusLabel = '<span style="font-size:11px;padding:2px 10px;border-radius:4px;background:rgba(' + (isActiveStatus ? '52,211,153' : '156,163,175') + ',0.1);color:' + statusColor + ';border:1px solid rgba(' + (isActiveStatus ? '52,211,153' : '156,163,175') + ',0.2);font-weight:500;">' + app.escapeHtml(r.status) + '</span>';

                    // 标签列表
                    var tagsHtml = '';
                    if (r.tags && r.tags.length > 0) {
                        tagsHtml = '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px;">';
                        for (var j = 0; j < r.tags.length; j++) {
                            tagsHtml += '<span style="font-size:11px;padding:1px 8px;border-radius:10px;border:1px solid rgba(201,169,110,0.5);color:#c9a96e;background:rgba(201,169,110,0.08);">' + app.escapeHtml(r.tags[j]) + '</span>';
                        }
                        tagsHtml += '</div>';
                    }

                    // 隐藏描述
                    var hiddenHtml = r.hidden ? '<div style="font-size:11px;color:#6a6a70;font-style:italic;padding-bottom:6px;border-bottom:1px dashed rgba(255,255,255,0.05);margin-bottom:8px;">' + app.escapeHtml(r.hidden) + '</div>' : '';

                    // 类型图标（从 typeIcon 取，没有则用 avatar）
                    var typeIcon = r.typeIcon || r.avatar || '💎';

                    var cardHtml = '<div onclick="MlifeApp.navigate(\'recruit_detail\',{code:\'' + app.escapeHtml(r.code) + '\',_recruits:MlifeApp.__lastRecruitData})" style="background:#222228;border:1px solid rgba(201,169,110,0.12);border-radius:12px;padding:14px 16px;margin-bottom:10px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.borderColor=\'rgba(201,169,110,0.3)\';this.style.background=\'#2a2a32\'" onmouseout="this.style.borderColor=\'rgba(201,169,110,0.12)\';this.style.background=\'#222228\'">'
                        + hiddenHtml
                        + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'
                        + '<span style="font-size:18px;flex-shrink:0;">' + typeIcon + '</span>'
                        + '<span style="flex:1;font-size:15px;font-weight:600;color:#e5e5e7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + app.escapeHtml(r.title) + '</span>'
                        + (r.credit ? '<span style="font-size:10px;padding:2px 6px;border-radius:3px;background:rgba(201,169,110,0.1);color:#c9a96e;border:1px solid rgba(201,169,110,0.2);">信用' + app.escapeHtml(r.credit) + '</span>' : '')
                        + statusLabel
                        + '</div>'
                        + tagsHtml
                        + '<div style="display:flex;align-items:center;justify-content:space-between;padding-top:6px;border-top:1px solid rgba(201,169,110,0.08);">'
                        + '<span style="font-size:12px;color:#6a6a70;">👥 ' + (r.applicants || 0) + '人报名</span>'
                        + '<span style="font-size:14px;font-weight:600;color:#c9a96e;">' + (r.budget || r.reward || '') + '</span>'
                        + '</div>'
                        + '</div>';

                    cards.push(cardHtml);
                }

                // 保存数据供筛选按钮使用
                app.__lastRecruitData = recruits;

                var html = '<div style="padding:0;">'
                    + filterBarHtml
                    + '<div style="padding:12px 16px;display:flex;flex-direction:column;gap:0;">'
                    + cards.join('\n')
                    + (filtered.length === 0 ? '<div style="padding:30px;text-align:center;color:#6a6a70;font-size:14px;">暂无符合条件的招募</div>' : '')
                    + '</div></div>';
                MlifeApp.updateCache('recruit_list', html);
                return html;
            };

            app.renderRecruitDetail = function(data) {
                if (!data || !data.code) {
                    return '<div style="padding:30px;text-align:center;color:var(--ml-text-dim);font-size:14px;letter-spacing:0.06em;">招募详情不可用</div>';
                }

                var r = data;

                // 状态标签
                var statusColors = {
                    '招募中': '#34d399',
                    '已锁定': '#60a5fa',
                    '已完成': '#34d399',
                    '已取消': '#9ca3af',
                    '争议中': '#f87171'
                };
                var statusColor = statusColors[r.status] || '#9ca3af';
                var statusLabel = '<span style="font-size:11px;padding:3px 10px;border-radius:4px;background:rgba(' + app.hexToRgb(statusColor) + ',0.1);color:' + statusColor + ';border:1px solid rgba(' + app.hexToRgb(statusColor) + ',0.2);font-weight:500;">' + app.escapeHtml(r.status) + '</span>';

                // 标签列表
                var tagsHtml = '';
                if (r.tags && r.tags.length > 0) {
                    tagsHtml = '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px;">';
                    for (var j = 0; j < r.tags.length; j++) {
                        tagsHtml += '<span style="font-size:11px;padding:2px 10px;border-radius:12px;border:1px solid rgba(201,169,110,0.2);color:#c9a96e;background:rgba(201,169,110,0.1);">' + app.escapeHtml(r.tags[j]) + '</span>';
                    }
                    tagsHtml += '</div>';
                }

                // Play标签
                var playTagsHtml = '';
                if (r.playTags && r.playTags.length > 0) {
                    playTagsHtml = '<div style="margin-bottom:12px;">';
                    playTagsHtml += '<div style="font-size:11px;color:#6a6a70;margin-bottom:4px;">PLAY 标签</div><div style="display:flex;flex-wrap:wrap;gap:4px;">';
                    for (var pt = 0; pt < r.playTags.length; pt++) {
                        playTagsHtml += '<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:rgba(201,169,110,0.08);color:#c9a96e;border:1px solid rgba(201,169,110,0.15);">' + app.escapeHtml(r.playTags[pt]) + '</span>';
                    }
                    playTagsHtml += '</div></div>';
                }

                // 隐藏描述
                var hiddenHtml = r.hidden ? '<div style="font-size:11px;color:#6a6a70;font-style:italic;padding:10px 16px;line-height:1.4;background:rgba(201,169,110,0.04);border-bottom:1px dashed rgba(255,255,255,0.05);">' + app.escapeHtml(r.hidden) + '</div>' : '';

                // 发布者信息栏
                var publisherAvatar = r.avatar || '💎';
                var publisherCode = r.poster || r.code || '';
                var publisherHtml = '<div style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:linear-gradient(135deg,#1a1a1f,#222228);border-bottom:1px solid rgba(201,169,110,0.12);">'
                    + '<span style="font-size:24px;width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#c9a96e,#8b7340);display:flex;align-items:center;justify-content:center;flex-shrink:0;">' + publisherAvatar + '</span>'
                    + '<div style="flex:1;min-width:0;">'
                    + '<div style="font-weight:600;font-size:15px;color:#e5e5e7;">' + app.escapeHtml(publisherCode) + '</div>'
                    + '<div style="display:flex;gap:12px;margin-top:4px;font-size:11px;color:#9a9a9f;">'
                    + (r.credit ? '<span>信用分 ' + app.escapeHtml(r.credit) + '</span>' : '')
                    + (r.rating ? '<span style="color:#c9a96e;">' + app.escapeHtml(r.rating) + '</span>' : '')
                    + (r.history ? '<span>' + app.escapeHtml(r.history) + '</span>' : '')
                    + '</div></div></div>';

                // 信息网格
                var infoGridHtml = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:14px 16px;background:#1a1a1f;border-bottom:1px solid rgba(201,169,110,0.12);">';
                infoGridHtml += '<div style="grid-column:1/-1;background:#222228;border-radius:8px;padding:10px 12px;border:1px solid rgba(201,169,110,0.12);">'
                    + '<div style="font-size:10px;color:#6a6a70;margin-bottom:4px;">招募标题</div>'
                    + '<div style="font-size:14px;color:#e5e5e7;font-weight:500;">' + (r.typeIcon || '') + ' ' + app.escapeHtml(r.title) + '</div>'
                    + '</div>';
                infoGridHtml += '<div style="background:#222228;border-radius:8px;padding:10px 12px;border:1px solid rgba(201,169,110,0.12);"><div style="font-size:10px;color:#6a6a70;margin-bottom:4px;">招募类型</div><div style="font-size:13px;color:#e5e5e7;">' + (r.recruitType || '—') + '</div></div>';
                infoGridHtml += '<div style="background:#222228;border-radius:8px;padding:10px 12px;border:1px solid rgba(201,169,110,0.12);"><div style="font-size:10px;color:#6a6a70;margin-bottom:4px;">状态</div>' + statusLabel + '</div>';
                infoGridHtml += '<div style="background:#222228;border-radius:8px;padding:10px 12px;border:1px solid rgba(201,169,110,0.12);"><div style="font-size:10px;color:#6a6a70;margin-bottom:4px;">人数</div><div style="font-size:13px;color:#e5e5e7;">' + (r.count || '1') + '人</div></div>';
                infoGridHtml += '<div style="background:#222228;border-radius:8px;padding:10px 12px;border:1px solid rgba(201,169,110,0.12);"><div style="font-size:10px;color:#6a6a70;margin-bottom:4px;">执行时间</div><div style="font-size:13px;color:#e5e5e7;">' + (r.time || '—') + '</div></div>';
                infoGridHtml += '<div style="background:#222228;border-radius:8px;padding:10px 12px;border:1px solid rgba(201,169,110,0.12);"><div style="font-size:10px;color:#6a6a70;margin-bottom:4px;">城市</div><div style="font-size:13px;color:#e5e5e7;">' + (r.city || '—') + '</div></div>';
                infoGridHtml += '<div style="background:#222228;border-radius:8px;padding:10px 12px;border:1px solid rgba(201,169,110,0.12);"><div style="font-size:10px;color:#6a6a70;margin-bottom:4px;">时长</div><div style="font-size:13px;color:#e5e5e7;">' + (r.duration || '—') + '</div></div>';
                infoGridHtml += '<div style="background:#222228;border-radius:8px;padding:10px 12px;border:1px solid rgba(201,169,110,0.12);"><div style="font-size:10px;color:#6a6a70;margin-bottom:4px;">发布时间</div><div style="font-size:13px;color:#e5e5e7;">' + (r.publishTime || r.time || '—') + '</div></div>';
                infoGridHtml += '<div style="background:#222228;border-radius:8px;padding:10px 12px;border:1px solid rgba(201,169,110,0.12);"><div style="font-size:10px;color:#6a6a70;margin-bottom:4px;">有效期</div><div style="font-size:13px;color:#e5e5e7;">' + (r.expire || '7天') + '</div></div>';
                infoGridHtml += '</div>';

                // 详细要求
                var reqHtml = '<div style="padding:14px 16px;background:#1a1a1f;border-bottom:1px solid rgba(201,169,110,0.12);">'
                    + '<div style="font-size:11px;font-weight:600;color:#c9a96e;margin-bottom:10px;letter-spacing:1px;">📝 详细要求</div>';
                if (r.ageReq) reqHtml += '<div style="background:#222228;border-radius:8px;padding:10px 12px;border:1px solid rgba(201,169,110,0.12);margin-bottom:6px;"><div style="font-size:10px;color:#6a6a70;margin-bottom:3px;">年龄要求</div><div style="font-size:13px;color:#e5e5e7;">' + app.escapeHtml(r.ageReq) + '</div></div>';
                if (r.bodyPref) reqHtml += '<div style="background:#222228;border-radius:8px;padding:10px 12px;border:1px solid rgba(201,169,110,0.12);margin-bottom:6px;"><div style="font-size:10px;color:#6a6a70;margin-bottom:3px;">身材偏好</div><div style="font-size:13px;color:#e5e5e7;">' + app.escapeHtml(r.bodyPref) + '</div></div>';
                if (r.specialReq) reqHtml += '<div style="background:#222228;border-radius:8px;padding:10px 12px;border:1px solid rgba(201,169,110,0.12);margin-bottom:6px;"><div style="font-size:10px;color:#6a6a70;margin-bottom:3px;">特殊要求</div><div style="font-size:13px;color:#e5e5e7;">' + app.escapeHtml(r.specialReq) + '</div></div>';
                if (r.body) reqHtml += '<div style="background:#222228;border-radius:8px;padding:12px;border:1px solid rgba(201,169,110,0.12);"><div style="font-size:10px;color:#6a6a70;margin-bottom:4px;">详情描述</div><div style="font-size:13px;color:var(--ml-text-ccc);line-height:1.6;white-space:pre-wrap;">' + app.escapeHtml(r.body) + '</div></div>';
                reqHtml += '</div>';

                // 报酬明细
                var rewardHtml = '<div style="padding:14px 16px;background:#1a1a1f;border-bottom:1px solid rgba(201,169,110,0.12);">'
                    + '<div style="font-size:11px;font-weight:600;color:#c9a96e;margin-bottom:10px;letter-spacing:1px;">💰 报酬明细</div>';
                if (r.singleReward || r.reward) rewardHtml += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="font-size:12px;color:#9a9a9f;">单人报酬</span><span style="font-size:13px;font-weight:600;color:#c9a96e;">' + app.escapeHtml(r.singleReward || r.reward) + '</span></div>';
                if (r.totalReward) rewardHtml += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="font-size:12px;color:#9a9a9f;">总报酬</span><span style="font-size:13px;color:#e5e5e7;">' + app.escapeHtml(r.totalReward) + '</span></div>';
                if (r.serviceFee) rewardHtml += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="font-size:12px;color:#9a9a9f;">平台服务费</span><span style="font-size:13px;color:#f87171;">' + app.escapeHtml(r.serviceFee) + '</span></div>';
                if (r.deposit) rewardHtml += '<div style="display:flex;justify-content:space-between;padding:8px 0;"><span style="font-size:12px;color:#9a9a9f;">押金状态</span><span style="font-size:13px;color:#e5e5e7;">' + app.escapeHtml(r.deposit) + '</span></div>';
                rewardHtml += '</div>';

                // 应征者列表
                var applicantsHtml = '';
                if (r.applicants && r.applicants.length > 0) {
                    applicantsHtml = '<div style="padding:14px 16px;background:#1a1a1f;border-bottom:1px solid rgba(201,169,110,0.12);">'
                        + '<div style="font-size:11px;font-weight:600;color:#c9a96e;margin-bottom:10px;letter-spacing:1px;">📋 应征者列表（' + r.applicants.length + '人）</div>';
                    for (var k = 0; k < r.applicants.length; k++) {
                        var a = r.applicants[k];
                        var aStatusColor = a.status === '待审核' ? '#fbbf24' : a.status === '已确认' || a.status === '已选中' ? '#34d399' : '#6a6a70';
                        applicantsHtml += '<div style="background:#222228;border-radius:8px;padding:12px;border:1px solid rgba(201,169,110,0.12);margin-bottom:8px;">'
                            + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">'
                            + '<span style="font-weight:600;font-size:13px;color:#e5e5e7;">' + app.escapeHtml(a.name || a.code || '') + '</span>'
                            + '<span style="font-size:11px;padding:2px 8px;border-radius:4px;background:rgba(' + app.hexToRgb(aStatusColor) + ',0.1);color:' + aStatusColor + ';border:1px solid rgba(' + app.hexToRgb(aStatusColor) + ',0.2);">' + app.escapeHtml(a.status) + '</span>'
                            + '</div>';
                        if (a.age || a.body || a.rating || a.orders) {
                            applicantsHtml += '<div style="display:flex;gap:10px;margin-bottom:6px;font-size:11px;color:#9a9a9f;">'
                                + (a.age ? '<span>' + a.age + '岁</span>' : '')
                                + (a.body ? '<span>' + app.escapeHtml(a.body) + '</span>' : '')
                                + (a.rating ? '<span>评分 ' + app.escapeHtml(a.rating) + '</span>' : '')
                                + (a.orders ? '<span>' + app.escapeHtml(a.orders) + '</span>' : '')
                                + '</div>';
                        }
                        if (a.note) applicantsHtml += '<div style="font-size:12px;color:#6a6a70;padding:6px 8px;background:rgba(255,255,255,0.02);border-radius:4px;margin-bottom:6px;">' + app.escapeHtml(a.note) + '</div>';
                        if (a.ops) {
                            var ops = a.ops.split('/');
                            applicantsHtml += '<div style="display:flex;gap:6px;">';
                            for (var oi = 0; oi < ops.length; oi++) {
                                var op = ops[oi].trim();
                                if (op === '无') continue;
                                var opClass = op.indexOf('私信') !== -1 ? 'background:rgba(255,255,255,0.06);color:#9a9a9f;border:1px solid rgba(255,255,255,0.1);' : op.indexOf('确认') !== -1 || op.indexOf('选择') !== -1 ? 'background:rgba(52,211,153,0.15);color:#34d399;border:1px solid rgba(52,211,153,0.25);' : op.indexOf('拒绝') !== -1 ? 'background:rgba(248,113,113,0.1);color:#f87171;border:1px solid rgba(248,113,113,0.2);' : 'background:rgba(255,255,255,0.06);color:#9a9a9f;border:1px solid rgba(255,255,255,0.1);';
                                var sendText = op.indexOf('私信') !== -1 ? '/send 私信应征者 ' + (a.code || a.name) + '|/trigger'
                                    : op.indexOf('确认') !== -1 || op.indexOf('选择') !== -1 ? '/send 确认选择应征者 ' + (a.code || a.name) + '|/trigger'
                                    : op.indexOf('拒绝') !== -1 ? '/send 拒绝应征者 ' + (a.code || a.name) + '|/trigger'
                                    : '';
                                if (sendText) {
                                    applicantsHtml += '<button onclick="MlifeApp.action(\'' + sendText + '\')" style="padding:4px 10px;border-radius:6px;font-size:11px;font-weight:500;border:none;cursor:pointer;' + opClass + 'font-family:inherit;">' + app.escapeHtml(op) + '</button>';
                                } else {
                                    applicantsHtml += '<span style="padding:4px 10px;border-radius:6px;font-size:11px;font-weight:500;' + opClass + '">' + app.escapeHtml(op) + '</span>';
                                }
                            }
                            applicantsHtml += '</div>';
                        }
                        applicantsHtml += '</div>';
                    }
                    applicantsHtml += '</div>';
                }

                // 操作按钮
                var btnText = r.btnText || '报名应征';
                var btnHint = r.btnHint || '';
                var isDisabled = btnText.indexOf('无权限') !== -1 || btnText.indexOf('已报名') !== -1;
                var sendAction = isDisabled ? '' : btnText.indexOf('查看报名列表') !== -1
                    ? '/send 查看报名列表 ' + r.code + '|/trigger'
                    : '/send 报名应征 ' + r.code + '|/trigger';

                var actionHtml = '<div style="padding:14px 16px;display:flex;gap:10px;">'
                    + '<button onclick="MlifeApp.action(\'/send 返回招募广场|/trigger\')" style="flex:1;padding:10px;border-radius:8px;border:1px solid rgba(201,169,110,0.2);background:transparent;color:#9a9a9f;font-size:13px;cursor:pointer;font-family:inherit;transition:all 0.2s;">返回</button>'
                    + (sendAction ? '<button onclick="MlifeApp.action(\'' + sendAction + '\')" style="flex:2;padding:10px;border-radius:8px;border:1px solid #c9a96e;background:linear-gradient(135deg,rgba(201,169,110,0.2),rgba(201,169,110,0.3));color:#c9a96e;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.2s;">' + app.escapeHtml(btnText) + '</button>' : '<button disabled style="flex:2;padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.04);color:#6a6a70;font-size:13px;font-family:inherit;cursor:not-allowed;">' + app.escapeHtml(btnText) + '</button>')
                    + '</div>';
                if (btnHint) actionHtml += '<div style="font-size:11px;color:#6a6a70;text-align:center;padding:0 16px 12px;">' + app.escapeHtml(btnHint) + '</div>';

                var html = '<div style="padding:0;">'
                    + hiddenHtml
                    + publisherHtml
                    + infoGridHtml
                    + tagsHtml
                    + playTagsHtml
                    + reqHtml
                    + rewardHtml
                    + applicantsHtml
                    + actionHtml
                    + '</div>';

                MlifeApp.updateCache('recruit_detail', html);
                return html;
            };

            app.renderRecruitPost = function(data) {
                var balance = 0;
                try {
                    if (data && data.form && data.form.balance) balance = parseInt(data.form.balance) || 0;
                    else if (data && data.balance) balance = parseInt(data.balance) || 0;
                } catch(_) {}

                // 预设标签库
                var PLAY_TAGS = [
                    '师生','制服','服从型','主导型','温柔主导','女主导',
                    '道具','绳缚','露出','户外','车内','试衣间',
                    '足控','丝袜','口交','深喉','颜射','内射',
                    '3P','交换','调教','主从','SM','强制',
                    '摄影','私房','网调','语音','视频',
                    '角色扮演','反差','羞辱','高潮控制','多次',
                    '舔足','足交','玩具','跳蛋','肛塞',
                    '男友感','女友感','氛围感','自然发展','颜值要求',
                    '身材好','体力好','持久','肌肉','干净',
                    '约会','喝酒','过夜','吃饭','看电影'
                ];

                var RECRUIT_TYPES = ['单人约会','多人聚会','角色扮演','道具play','露出任务','调教','网调','摄影','单人定制','母女','双胞胎·姐妹','闺蜜','绿帽','绿奴','情侣交换','夫妻交换'];
                var SPECIAL_TYPES = ['母女','双胞胎·姐妹','绿帽','绿奴','情侣交换','夫妻交换'];
                var TYPE_FEE_MAP = {
                    '单人约会':0.20,'多人聚会':0.20,'角色扮演':0.20,'道具play':0.20,'露出任务':0.20,'调教':0.20,'网调':0.20,'摄影':0.20,'单人定制':0.20,
                    '母女':0.30,'双胞胎·姐妹':0.25,'闺蜜':0.20,'绿帽':0.30,'绿奴':0.30,'情侣交换':0,'夫妻交换':0
                };
                var TYPE_ICON_MAP = {
                    '单人约会':'💑','多人聚会':'🎉','角色扮演':'🎭','道具play':'🔧','露出任务':'👀','调教':'🏏','网调':'📱','摄影':'📸','单人定制':'✨','母女':'👩‍👧','双胞胎·姐妹':'👭','闺蜜':'👯','绿帽':'💚','绿奴':'🔗','情侣交换':'🔄','夫妻交换':'💞'
                };

                var specialMsgs = {
                    '母女':'需双方身份证+户口本验证，报酬×2.5，服务费30%',
                    '双胞胎·姐妹':'需双方身份证+关系证明验证，双胞胎报酬×3，姐妹×2，服务费25%',
                    '绿帽':'需伴侣关系证明+三方视频确认，平台抽取报酬30%',
                    '绿奴':'需伴侣关系证明+三方视频确认，平台抽取报酬30%',
                    '情侣交换':'需双方关系证明+四方视频确认，固定服务费各50000 M币',
                    '夫妻交换':'需结婚证+四方视频确认，固定服务费各50000 M币'
                };

                function formatMCoin(num) {
                    if (num === 0) return '0 M币';
                    if (!num || isNaN(num)) return '—';
                    var sign = num < 0 ? '-' : '';
                    var abs = Math.abs(num);
                    return sign + abs.toLocaleString('zh-CN') + ' M币';
                }

                function makeTagChips() {
                    var chips = '';
                    for (var ti = 0; ti < PLAY_TAGS.length; ti++) {
                        chips += '<span class="hj-tag-chip" data-tag="' + app.escapeHtml(PLAY_TAGS[ti]) + '" style="display:inline-block;padding:5px 12px;border-radius:16px;font-size:12px;cursor:pointer;background:#2a2a32;color:#9a9a9f;border:1px solid rgba(255,255,255,0.08);transition:all 0.15s;user-select:none;margin:0 4px 6px 0;" onmouseover="this.style.borderColor=\'rgba(201,169,110,0.3)\';this.style.color=\'#e5e5e7\'" onmouseout="if(!this.classList.contains(\'selected\')){this.style.borderColor=\'rgba(255,255,255,0.08)\';this.style.color=\'#9a9a9f\'}" onclick="this.classList.toggle(\'selected\');if(this.classList.contains(\'selected\')){this.style.background=\'rgba(201,169,110,0.15)\';this.style.color=\'#c9a96e\';this.style.borderColor=\'#c9a96e\';this.style.fontWeight=\'600\'}else{this.style.background=\'#2a2a32\';this.style.color=\'#9a9a9f\';this.style.borderColor=\'rgba(255,255,255,0.08)\';this.style.fontWeight=\'400\'}">' + app.escapeHtml(PLAY_TAGS[ti]) + '</span>';
                    }
                    return chips;
                }

                function makeTypeOptions() {
                    var opts = '<option value="">请选择</option>';
                    for (var ti2 = 0; ti2 < RECRUIT_TYPES.length; ti2++) {
                        opts += '<option value="' + app.escapeHtml(RECRUIT_TYPES[ti2]) + '">' + app.escapeHtml(RECRUIT_TYPES[ti2]) + '</option>';
                    }
                    return opts;
                }

                // 生成唯一 ID 前缀防止冲突
                var uid = 'hjp_' + Date.now() + '_';

                var html = ''
                    // 头部
                    + '<div style="background:linear-gradient(135deg,#1a1a1f,#222228);padding:14px 16px;border-bottom:1px solid rgba(201,169,110,0.12);display:flex;align-items:center;gap:10px;">'
                    + '<span style="font-size:20px;width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#c9a96e,#8b7340);display:flex;align-items:center;justify-content:center;flex-shrink:0;">💎</span>'
                    + '<div><div style="font-weight:600;font-size:15px;color:#e5e5e7;">发布招募</div>'
                    + '<div style="font-size:11px;color:#9a9a9f;">填写信息后确认发布</div></div></div>'

                    // 提示条
                    + '<div style="padding:8px 16px;background:rgba(201,169,110,0.04);border-bottom:1px solid rgba(201,169,110,0.08);display:flex;align-items:flex-start;gap:6px;">'
                    + '<span style="font-size:12px;flex-shrink:0;">💡</span>'
                    + '<span style="font-size:11px;color:#8b7340;line-height:1.5;">特殊类型需要额外验证，发布后进入人工审核。常规类型发布后立即生效，有效期7天。</span></div>'

                    // 表单主体
                    + '<div style="padding:14px 16px;background:#1a1a1f;max-height:480px;overflow-y:auto;">'

                    // ---- 基本信息 ----
                    + '<div style="font-size:11px;font-weight:600;color:#c9a96e;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid rgba(201,169,110,0.12);letter-spacing:1px;">📋 基本信息</div>'

                    // 标题
                    + '<div style="margin-bottom:10px;" id="' + uid + 'fg-title">'
                    + '<div style="font-size:12px;color:#9a9a9f;margin-bottom:4px;display:flex;justify-content:space-between;"><span><span style="color:#f87171;">*</span> 招募标题</span><span style="font-size:10px;color:#6a6a70;" id="' + uid + 'counter-title">0/15</span></div>'
                    + '<input id="' + uid + 'ipt-title" type="text" placeholder="15字以内" maxlength="15" style="width:100%;padding:9px 12px;background:#2a2a32;border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#e5e5e7;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box;">'
                    + '<div style="font-size:11px;color:#f87171;margin-top:3px;display:none;" id="' + uid + 'err-title">请填写招募标题</div></div>'

                    // 类型 + 人数
                    + '<div style="display:flex;gap:8px;margin-bottom:10px;">'
                    + '<div style="flex:1;" id="' + uid + 'fg-type">'
                    + '<div style="font-size:12px;color:#9a9a9f;margin-bottom:4px;"><span style="color:#f87171;">*</span> 招募类型</div>'
                    + '<select id="' + uid + 'ipt-type" style="width:100%;padding:9px 12px;background:#2a2a32;border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#e5e5e7;font-size:13px;font-family:inherit;outline:none;appearance:none;cursor:pointer;box-sizing:border-box;">' + makeTypeOptions() + '</select>'
                    + '<div style="font-size:11px;color:#f87171;margin-top:3px;display:none;" id="' + uid + 'err-type">请选择招募类型</div></div>'
                    + '<div style="flex:1;" id="' + uid + 'fg-count">'
                    + '<div style="font-size:12px;color:#9a9a9f;margin-bottom:4px;"><span style="color:#f87171;">*</span> 人数</div>'
                    + '<input id="' + uid + 'ipt-count" type="number" placeholder="1" min="1" max="5" value="1" style="width:100%;padding:9px 12px;background:#2a2a32;border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#e5e5e7;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box;">'
                    + '<div style="font-size:11px;color:#f87171;margin-top:3px;display:none;" id="' + uid + 'err-count">1~5人</div></div></div>'

                    // 特殊类型提示（隐藏默认）
                    + '<div id="' + uid + 'special-notice" style="display:none;font-size:12px;color:#fbbf24;margin-bottom:10px;padding:6px 10px;background:rgba(251,191,36,0.08);border-radius:6px;border:1px solid rgba(251,191,36,0.15);"></div>'

                    // 时间 + 城市
                    + '<div style="display:flex;gap:8px;margin-bottom:10px;">'
                    + '<div style="flex:1;" id="' + uid + 'fg-date">'
                    + '<div style="font-size:12px;color:#9a9a9f;margin-bottom:4px;"><span style="color:#f87171;">*</span> 执行时间</div>'
                    + '<input id="' + uid + 'ipt-date" type="text" placeholder="例：本周六 19:00" style="width:100%;padding:9px 12px;background:#2a2a32;border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#e5e5e7;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box;">'
                    + '<div style="font-size:11px;color:#f87171;margin-top:3px;display:none;" id="' + uid + 'err-date">请填写执行时间</div></div>'
                    + '<div style="flex:1;" id="' + uid + 'fg-city">'
                    + '<div style="font-size:12px;color:#9a9a9f;margin-bottom:4px;"><span style="color:#f87171;">*</span> 执行地点</div>'
                    + '<input id="' + uid + 'ipt-city" type="text" placeholder="例：上海·静安" style="width:100%;padding:9px 12px;background:#2a2a32;border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#e5e5e7;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box;">'
                    + '<div style="font-size:11px;color:#f87171;margin-top:3px;display:none;" id="' + uid + 'err-city">请填写执行地点</div></div></div>'

                    // 时长
                    + '<div style="margin-bottom:12px;" id="' + uid + 'fg-duration">'
                    + '<div style="font-size:12px;color:#9a9a9f;margin-bottom:4px;"><span style="color:#f87171;">*</span> 时长预期</div>'
                    + '<select id="' + uid + 'ipt-duration" style="width:100%;padding:9px 12px;background:#2a2a32;border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#e5e5e7;font-size:13px;font-family:inherit;outline:none;appearance:none;cursor:pointer;box-sizing:border-box;">'
                    + '<option value="">请选择</option><option value="2小时">2小时</option><option value="4小时">4小时</option><option value="过夜">过夜</option><option value="自定义">自定义</option></select>'
                    + '<div style="font-size:11px;color:#f87171;margin-top:3px;display:none;" id="' + uid + 'err-duration">请选择时长</div></div>'

                    // ---- 详细要求 ----
                    + '<div style="font-size:11px;font-weight:600;color:#c9a96e;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid rgba(201,169,110,0.12);letter-spacing:1px;margin-top:4px;">🔍 详细要求</div>'

                    // 年龄 + 身材
                    + '<div style="display:flex;gap:8px;margin-bottom:10px;">'
                    + '<div style="flex:1;" id="' + uid + 'fg-age">'
                    + '<div style="font-size:12px;color:#9a9a9f;margin-bottom:4px;"><span style="color:#f87171;">*</span> 年龄范围</div>'
                    + '<input id="' + uid + 'ipt-age" type="text" placeholder="例：20-28岁" style="width:100%;padding:9px 12px;background:#2a2a32;border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#e5e5e7;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box;">'
                    + '<div style="font-size:11px;color:#f87171;margin-top:3px;display:none;" id="' + uid + 'err-age">请填写年龄范围</div></div>'
                    + '<div style="flex:1;" id="' + uid + 'fg-body">'
                    + '<div style="font-size:12px;color:#9a9a9f;margin-bottom:4px;">身材偏好 <span style="color:#6a6a70;font-size:10px;">选填</span></div>'
                    + '<input id="' + uid + 'ipt-body" type="text" placeholder="不限" style="width:100%;padding:9px 12px;background:#2a2a32;border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#e5e5e7;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box;"></div></div>'

                    // 特殊要求
                    + '<div style="margin-bottom:10px;">'
                    + '<div style="font-size:12px;color:#9a9a9f;margin-bottom:4px;">特殊要求 <span style="color:#6a6a70;font-size:10px;">选填</span><span style="float:right;font-size:10px;color:#6a6a70;" id="' + uid + 'counter-req">0/200</span></div>'
                    + '<textarea id="' + uid + 'ipt-req" placeholder="越具体越容易匹配" maxlength="200" style="width:100%;padding:9px 12px;background:#2a2a32;border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#e5e5e7;font-size:13px;font-family:inherit;outline:none;resize:vertical;min-height:50px;box-sizing:border-box;"></textarea></div>'

                    // Play标签
                    + '<div style="margin-bottom:10px;" id="' + uid + 'fg-tags">'
                    + '<div style="font-size:12px;color:#9a9a9f;margin-bottom:4px;"><span style="color:#f87171;">*</span> Play标签 <span style="color:#6a6a70;font-size:10px;">可多选</span></div>'
                    + '<div id="' + uid + 'tag-selector">' + makeTagChips() + '</div>'
                    + '<div style="font-size:11px;color:#f87171;margin-top:3px;display:none;" id="' + uid + 'err-tags">请至少选择一个Play标签</div></div>'

                    // ---- 报酬与费用 ----
                    + '<div style="font-size:11px;font-weight:600;color:#c9a96e;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid rgba(201,169,110,0.12);letter-spacing:1px;margin-top:4px;">💰 报酬与费用</div>'

                    // M币余额
                    + '<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px;margin-bottom:6px;">'
                    + '<span style="color:#9a9a9f;">M币余额</span>'
                    + '<span style="color:#c9a96e;font-weight:600;" id="' + uid + 'balance-display">' + formatMCoin(balance) + '</span></div>'

                    // 单人报酬
                    + '<div style="margin-bottom:8px;" id="' + uid + 'fg-reward">'
                    + '<div style="font-size:12px;color:#9a9a9f;margin-bottom:4px;"><span style="color:#f87171;">*</span> 单人报酬 (M币)</div>'
                    + '<input id="' + uid + 'ipt-reward" type="number" placeholder="最低10000" min="10000" step="1000" style="width:100%;padding:9px 12px;background:#2a2a32;border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#e5e5e7;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box;">'
                    + '<div style="font-size:10px;color:#6a6a70;margin-top:2px;">最低10000 M币/人（1000元）</div>'
                    + '<div style="font-size:11px;color:#f87171;margin-top:3px;display:none;" id="' + uid + 'err-reward">单人报酬最低10000 M币</div></div>'

                    // 自动计算区
                    + '<div style="background:#222228;border-radius:8px;padding:10px 12px;border:1px solid rgba(201,169,110,0.12);margin-bottom:4px;">'
                    + '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.03);"><span style="font-size:11px;color:#9a9a9f;">总报酬</span><span style="font-size:12px;font-weight:600;color:#c9a96e;" id="' + uid + 'calc-total">—</span></div>'
                    + '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.03);"><span style="font-size:11px;color:#9a9a9f;">平台服务费 <span style="color:#6a6a70;font-size:10px;">(发布时扣除·不退)</span></span><span style="font-size:12px;color:#f87171;" id="' + uid + 'calc-fee">—</span></div>'
                    + '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.03);"><span style="font-size:11px;color:#9a9a9f;">押金 <span style="color:#6a6a70;font-size:10px;">(冻结·完成后释放)</span></span><span style="font-size:12px;color:#c9a96e;" id="' + uid + 'calc-deposit">—</span></div>'
                    + '<div style="border-top:1px solid rgba(201,169,110,0.12);margin:4px 0;"></div>'
                    + '<div style="display:flex;justify-content:space-between;padding:5px 0;"><span style="font-size:12px;font-weight:600;color:#9a9a9f;">合计支出</span><span style="font-size:13px;font-weight:700;color:#f87171;" id="' + uid + 'calc-total-cost">—</span></div>'
                    + '<div style="display:flex;justify-content:space-between;padding:5px 0;display:none;" id="' + uid + 'row-after-balance"><span style="font-size:11px;color:#9a9a9f;">发布后余额</span><span style="font-size:12px;" id="' + uid + 'calc-after-balance">—</span></div>'
                    + '</div>'

                    + '</div>' // 表单主体结束

                    // 按钮
                    + '<div style="padding:12px 16px;background:#0a0a0f;display:flex;gap:8px;">'
                    + '<button id="' + uid + 'btn-cancel" style="flex:1;padding:10px;border-radius:8px;border:1px solid rgba(201,169,110,0.2);background:transparent;color:#9a9a9f;font-size:13px;cursor:pointer;font-family:inherit;transition:all 0.2s;">取消</button>'
                    + '<button id="' + uid + 'btn-submit" style="flex:2;padding:10px;border-radius:8px;border:1px solid #c9a96e;background:linear-gradient(135deg,rgba(201,169,110,0.2),rgba(201,169,110,0.3));color:#c9a96e;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.2s;">确认发布</button>'
                    + '</div>';

                // 延迟绑定事件（DOM 渲染后）
                setTimeout(function() {
                    var formData = { title: '', type: '', count: 1, date: '', city: '', duration: '', ageRange: '', bodyPref: '', specialReq: '', playTags: [], reward: 0 };

                    function updateCalc() {
                        var type = formData.type;
                        var count = formData.count || 1;
                        var reward = formData.reward || 0;
                        var totalReward = reward * count;
                        var feeRate = TYPE_FEE_MAP[type] !== undefined ? TYPE_FEE_MAP[type] : 0.20;
                        var isExchange = (type === '情侣交换' || type === '夫妻交换');
                        var fee, deposit, totalCost, afterBalance;
                        if (isExchange) { fee = 50000; deposit = 0; totalCost = fee; }
                        else { fee = Math.round(totalReward * feeRate); deposit = Math.round(totalReward * 0.5); totalCost = fee + deposit; }
                        afterBalance = balance - totalCost;

                        var elTotal = document.getElementById(uid + 'calc-total');
                        var elFee = document.getElementById(uid + 'calc-fee');
                        var elDeposit = document.getElementById(uid + 'calc-deposit');
                        var elTotalCost = document.getElementById(uid + 'calc-total-cost');
                        var elAfterBalance = document.getElementById(uid + 'calc-after-balance');
                        var rowAfter = document.getElementById(uid + 'row-after-balance');
                        var elBalance = document.getElementById(uid + 'balance-display');

                        if (elTotal) elTotal.textContent = isExchange ? '—' : formatMCoin(totalReward);
                        if (elFee) elFee.textContent = formatMCoin(fee);
                        if (elDeposit) elDeposit.textContent = isExchange ? '—' : formatMCoin(deposit);
                        if (elTotalCost) elTotalCost.textContent = formatMCoin(totalCost);
                        if (rowAfter) rowAfter.style.display = (reward > 0 && count > 0 && type) ? 'flex' : 'none';
                        if (elAfterBalance) {
                            elAfterBalance.textContent = formatMCoin(afterBalance);
                            elAfterBalance.style.color = afterBalance < 0 ? '#f87171' : '#e5e5e7';
                        }
                        if (elBalance) {
                            elBalance.textContent = formatMCoin(balance);
                            elBalance.style.color = afterBalance < 0 ? '#f87171' : '#c9a96e';
                        }
                    }

                    function clearError(id) { var el = document.getElementById(id); if (el) el.style.display = 'none'; }
                    function setError(id) { var el = document.getElementById(id); if (el) el.style.display = 'block'; }

                    // 标题
                    var iptTitle = document.getElementById(uid + 'ipt-title');
                    if (iptTitle) {
                        iptTitle.addEventListener('input', function() {
                            var len = this.value.length;
                            var counter = document.getElementById(uid + 'counter-title');
                            if (counter) counter.textContent = len + '/15';
                            formData.title = this.value;
                            clearError(uid + 'err-title');
                        });
                    }

                    // 类型
                    var iptType = document.getElementById(uid + 'ipt-type');
                    if (iptType) {
                        iptType.addEventListener('change', function() {
                            formData.type = this.value;
                            clearError(uid + 'err-type');
                            // 特殊类型提示
                            var notice = document.getElementById(uid + 'special-notice');
                            if (notice) {
                                var isSpecial = SPECIAL_TYPES.indexOf(this.value) >= 0;
                                if (isSpecial) {
                                    notice.style.display = 'block';
                                    notice.textContent = '⚠ ' + (specialMsgs[this.value] || '需要额外验证');
                                } else {
                                    notice.style.display = 'none';
                                }
                            }
                            updateCalc();
                        });
                    }

                    // 人数
                    var iptCount = document.getElementById(uid + 'ipt-count');
                    if (iptCount) {
                        iptCount.addEventListener('input', function() {
                            var v = parseInt(this.value) || 1;
                            if (v < 1) v = 1; if (v > 5) v = 5;
                            this.value = v;
                            formData.count = v;
                            clearError(uid + 'err-count');
                            updateCalc();
                        });
                    }

                    // 日期
                    var iptDate = document.getElementById(uid + 'ipt-date');
                    if (iptDate) { iptDate.addEventListener('input', function() { formData.date = this.value; clearError(uid + 'err-date'); }); }

                    // 城市
                    var iptCity = document.getElementById(uid + 'ipt-city');
                    if (iptCity) { iptCity.addEventListener('input', function() { formData.city = this.value; clearError(uid + 'err-city'); }); }

                    // 时长
                    var iptDuration = document.getElementById(uid + 'ipt-duration');
                    if (iptDuration) { iptDuration.addEventListener('change', function() { formData.duration = this.value; clearError(uid + 'err-duration'); }); }

                    // 年龄
                    var iptAge = document.getElementById(uid + 'ipt-age');
                    if (iptAge) { iptAge.addEventListener('input', function() { formData.ageRange = this.value; clearError(uid + 'err-age'); }); }

                    // 身材
                    var iptBody = document.getElementById(uid + 'ipt-body');
                    if (iptBody) { iptBody.addEventListener('input', function() { formData.bodyPref = this.value; }); }

                    // 特殊要求字数
                    var iptReq = document.getElementById(uid + 'ipt-req');
                    if (iptReq) {
                        iptReq.addEventListener('input', function() {
                            var len = this.value.length;
                            var counter = document.getElementById(uid + 'counter-req');
                            if (counter) counter.textContent = len + '/200';
                            formData.specialReq = this.value;
                        });
                    }

                    // 报酬
                    var iptReward = document.getElementById(uid + 'ipt-reward');
                    if (iptReward) {
                        iptReward.addEventListener('input', function() {
                            var v = parseInt(this.value) || 0;
                            formData.reward = v;
                            clearError(uid + 'err-reward');
                            updateCalc();
                        });
                    }

                    // 提交
                    var btnSubmit = document.getElementById(uid + 'btn-submit');
                    if (btnSubmit) {
                        btnSubmit.addEventListener('click', function() {
                            // 收集标签
                            var chips = document.querySelectorAll('#' + uid + 'tag-selector .hj-tag-chip.selected');
                            formData.playTags = [];
                            for (var ci = 0; ci < chips.length; ci++) {
                                formData.playTags.push(chips[ci].getAttribute('data-tag'));
                            }

                            // 验证
                            var valid = true;
                            if (!formData.title || formData.title.trim() === '') { setError(uid + 'err-title'); valid = false; }
                            if (!formData.type) { setError(uid + 'err-type'); valid = false; }
                            if (!formData.count || formData.count < 1 || formData.count > 5) { setError(uid + 'err-count'); valid = false; }
                            if (!formData.date || formData.date.trim() === '') { setError(uid + 'err-date'); valid = false; }
                            if (!formData.city || formData.city.trim() === '') { setError(uid + 'err-city'); valid = false; }
                            if (!formData.duration) { setError(uid + 'err-duration'); valid = false; }
                            if (!formData.ageRange || formData.ageRange.trim() === '') { setError(uid + 'err-age'); valid = false; }
                            if (formData.playTags.length === 0) { setError(uid + 'err-tags'); valid = false; }
                            if (!formData.reward || formData.reward < 10000) { setError(uid + 'err-reward'); valid = false; }

                            if (!valid) return;

                            // 余额检查
                            var type = formData.type;
                            var count = formData.count;
                            var reward = formData.reward;
                            var feeRate = TYPE_FEE_MAP[type] !== undefined ? TYPE_FEE_MAP[type] : 0.20;
                            var isExchange = (type === '情侣交换' || type === '夫妻交换');
                            var totalReward = reward * count;
                            var fee = isExchange ? 50000 : Math.round(totalReward * feeRate);
                            var deposit = isExchange ? 0 : Math.round(totalReward * 0.5);
                            var totalCost = fee + deposit;
                            if (totalCost > balance && balance > 0) { setError(uid + 'err-reward'); document.getElementById(uid + 'err-reward').textContent = '余额不足，还差 ' + formatMCoin(totalCost - balance); return; }

                            // 拼接消息
                            var lines = ['确认发布招募：'];
                            lines.push('招募标题：' + formData.title);
                            lines.push('招募类型：' + formData.type);
                            lines.push('人数需求：' + formData.count);
                            lines.push('执行时间：' + formData.date);
                            lines.push('执行地点：' + formData.city);
                            lines.push('时长预期：' + formData.duration);
                            lines.push('年龄要求：' + formData.ageRange);
                            if (formData.bodyPref) lines.push('身材偏好：' + formData.bodyPref);
                            if (formData.specialReq) lines.push('特殊要求：' + formData.specialReq);
                            lines.push('Play标签：' + formData.playTags.join('，'));
                            lines.push('单人报酬：' + formData.reward + ' M币');

                            btnSubmit.disabled = true;
                            btnSubmit.textContent = '提交中...';

                            // 保存到本地
                            var newPost = {id:'R'+Date.now().toString(36).toUpperCase(),typeIcon:(TYPE_ICON_MAP[formData.type]||'📋'),title:formData.title,recruitType:formData.type,status:'招募中',time:new Date().toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}),reward:formatMCoin(formData.reward)+'/次',progress:'等待平台审核',poster:'用户'};
                            MlifeApp.saveRecruitPost(newPost);
                            setTimeout(function(){MlifeApp.navigate('recruit_manage')}, 500);

                            if (typeof MlifeApp !== 'undefined' && MlifeApp.action) {
                                MlifeApp.action('/send ' + encodeURIComponent(lines.join('\n')) + '|/trigger');
                            } else if (typeof triggerSlash === 'function') {
                                triggerSlash('/send ' + encodeURIComponent(lines.join('\n')) + '|/trigger');
                            }
                        });
                    }

                    // 取消按钮
                    var btnCancel = document.getElementById(uid + 'btn-cancel');
                    if (btnCancel) {
                        btnCancel.addEventListener('click', function() {
                            if (typeof MlifeApp !== 'undefined' && MlifeApp.action) {
                                MlifeApp.action('/send 取消发布招募|/trigger');
                            } else if (typeof triggerSlash === 'function') {
                                triggerSlash('/send 取消发布招募|/trigger');
                            }
                        });
                    }

                    // 初始计算
                    updateCalc();
                }, 50);

                MlifeApp.updateCache('recruit_post', html);
                return html;
            };

            // ---- 开盒页面 ----
            app.renderUnbox = function(data) {
                if (!data || !data.contact) {
                    return '<div style="padding:30px;text-align:center;color:var(--ml-text-dim);font-size:14px;">开盒数据不可用</div>';
                }

                var charData = data.character || {};
                var isUnboxed = data.isUnboxed || false;
                var balance = data.balance || '0';
                var hiddenComment = '<!-- hidden: ' + app.escapeHtml(data.hidden || '') + ' -->\n';

                // ---- 页面头部（返回按钮 + 角色信息） ----
                // 开盒页返回私信时，通过缓存记录当前联系人，使再次navigate('dm')可恢复
                if (data.contact) {
                    MlifeApp.__lastDMContact = data.contact;
                }
                var headerHtml = '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;margin-bottom:10px;border-bottom:1px solid var(--ml-border);flex-shrink:0;">'
                    + '<button onclick="MlifeApp.navigate(\'dm\', {contact:MlifeApp.__lastDMContact||null})" style="background:none;border:none;color:var(--ml-text-dim);font-size:18px;cursor:pointer;padding:0 4px;font-family:inherit;">&#x2190;</button>'
                    + '<span style="font-size:40px;width:48px;text-align:center;line-height:48px;flex-shrink:0;">' + app.escapeHtml(data.avatar || '') + '</span>'
                    + '<div style="flex:1;min-width:0;">'
                    + '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">'
                    + '<span style="font-weight:bold;font-size:17px;color:var(--ml-text);">' + app.escapeHtml(data.contact) + '</span>'
                    + (data.level ? '<span style="font-size:11px;padding:1px 7px;border-radius:3px;background:#ff6b9d;color:#fff;font-weight:bold;">' + app.escapeHtml(data.level) + '</span>' : '')
                    + (isUnboxed ? '<span style="font-size:11px;padding:1px 8px;border-radius:3px;background:rgba(100,200,100,0.2);color:#66dd88;border:1px solid #66dd88;font-weight:bold;">&#x2713; \u5df2\u5f00\u76d2</span>' : '')
                    + '</div>'
                    + '<div style="font-size:13px;color:var(--ml-text-dim);margin-top:2px;">'
                    + (data.vip && data.vip !== '\u65e0' ? app.escapeHtml(data.vip) + 'VIP' : '\u672a\u5f00\u901aVIP')
                    + (charData.age ? ' &middot; ' + charData.age + '\u5c81' : '')
                    + '</div>'
                    + '</div>'
                    + '</div>';

                // ---- \u672a\u5f00\u76d2\uff1a\u4ed8\u8d39\u5899 ----
                if (!isUnboxed) {
                    var balanceNum = parseInt(balance) || 0;
                    var hasEnough = balanceNum >= 100;
                    var priceHtml = hasEnough
                        ? '<div style="font-size:24px;font-weight:bold;color:#f6d365;margin:6px 0;">100 M\u5e01</div>'
                        : '<div style="font-size:24px;font-weight:bold;color:#ff4757;margin:6px 0;">100 M\u5e01</div>';
                    var balanceHtml = '<div style="font-size:13px;color:var(--ml-text-dim);margin-top:8px;">\u5f53\u524d\u4f59\u989d: <span style="color:' + (hasEnough ? '#66dd88' : '#ff4757') + ';font-weight:bold;">' + balance + ' M\u5e01</span></div>';
                    var actionBtnHtml = hasEnough
                        ? '<button onclick="MlifeApp.action(\'/send \u786e\u8ba4\u5f00\u76d2' + encodeURIComponent(data.contact) + '|/trigger\')" '
                        + 'style="width:100%;padding:12px;border-radius:10px;border:none;'
                        + 'background:var(--ml-gold);'
                        + 'color:#1a1a1a;font-size:16px;font-weight:bold;cursor:pointer;font-family:inherit;'
                        + 'transition:transform 0.2s,box-shadow 0.2s;'
                        + 'box-shadow:0 2px 12px rgba(246,211,101,0.3);"'
                        + 'onmouseover="this.style.transform=\'scale(1.02)\';this.style.boxShadow=\'0 4px 20px rgba(246,211,101,0.5)\'"'
                        + 'onmouseout="this.style.transform=\'scale(1)\';this.style.boxShadow=\'0 2px 12px rgba(246,211,101,0.3)\'"'
                        + '>&#x1F48E; \u5f00\u76d2 (100 M\u5e01)</button>'
                        : '<button onclick="MlifeApp.action(\'/send M\u5e01\u5145\u503c|/trigger\')" '
                        + 'style="width:100%;padding:12px;border-radius:10px;border:1px solid #ff4757;'
                        + 'background:rgba(255,71,87,0.1);'
                        + 'color:#ff4757;font-size:16px;font-weight:bold;cursor:pointer;font-family:inherit;">'
                        + '&#x1FA99; M\u5e01\u4e0d\u8db3\uff0c\u53bb\u5145\u503c</button>';

                    var tipHtml = hasEnough
                        ? '<div style="margin-top:10px;font-size:12px;color:var(--ml-text-dim);text-align:center;line-height:1.6;">'
                        + '\u5f00\u76d2\u540e\u53ef\u4ee5\u67e5\u770b\u8be5\u5973\u6027\u7684\u5b8c\u6574\u6863\u6848<br>\u5305\u62ec\u8eab\u4f53\u6570\u636e\u3001\u6027\u683c\u3001\u504f\u597d\u7b49\u5168\u90e8\u4fe1\u606f</div>'
                        : '<div style="margin-top:10px;font-size:12px;color:var(--ml-text-dim);text-align:center;line-height:1.6;">'
                        + '\u83b7\u53d6M\u5e01\u7684\u65b9\u5f0f\uff1a<br>'
                        + '&middot; \u6bcf\u65e5\u7b7e\u5230\u9886\u53d6 10 M\u5e01<br>'
                        + '&middot; \u6bcf\u65e5\u53d1\u5e16\u5956\u52b1 5 M\u5e01<br>'
                        + '&middot; \u76f4\u64ad\u6536\u793c\u7269\u8d5a M\u5e01</div>';

                    var paywallHtml = '<div style="background:var(--ml-bg-card);border:1px solid var(--ml-border);border-radius:14px;padding:24px;text-align:center;margin-bottom:12px;">'
                        + '<div style="font-size:40px;margin-bottom:8px;">&#x1F512;</div>'
                        + '<div style="font-size:16px;font-weight:bold;color:var(--ml-text-main);margin-bottom:4px;">\u6570\u636e\u5df2\u9501\u5b9a</div>'
                        + '<div style="font-size:13px;color:var(--ml-text-dim);margin-bottom:12px;">\u652f\u4ed8M\u5e01\u67e5\u770b\u8be5\u5973\u6027\u7684\u5b8c\u6574\u6863\u6848</div>'
                        + priceHtml
                        + actionBtnHtml
                        + balanceHtml
                        + tipHtml
                        + '</div>';

                    var html = '<div style="padding:0;">'
                        + hiddenComment
                        + headerHtml
                        + paywallHtml
                        + '</div>';

                    MlifeApp.updateCache('unbox', html);
                    return html;
                }

                // ---- \u5df2\u5f00\u76d2\uff1a\u5c55\u793a\u5168\u90e8\u6570\u636e ----
                function renderField(label, value) {
                    if (value === undefined || value === null || value === '') return '';
                    return '<div style="padding:6px 0;border-bottom:1px solid rgba(30,30,46,0.5);">'
                        + '<div style="font-size:11px;color:#008899;letter-spacing:0.06em;margin-bottom:1px;">' + app.escapeHtml(label) + '</div>'
                        + '<div style="font-size:14px;color:var(--ml-text-main);">' + app.escapeHtml(String(value)) + '</div>'
                        + '</div>';
                }

                function renderSection(title, fieldsHtml) {
                    if (!fieldsHtml) return '';
                    return '<div style="background:var(--ml-bg-card);border:1px solid var(--ml-border);border-radius:10px;padding:14px;margin-bottom:10px;">'
                        + '<div style="font-size:12px;color:#f6d365;font-weight:bold;margin-bottom:8px;letter-spacing:0.06em;padding-bottom:6px;border-bottom:1px solid rgba(246,211,101,0.15);">' + app.escapeHtml(title) + '</div>'
                        + fieldsHtml
                        + '</div>';
                }

                var basicFields = renderField('\u6635\u79f0', charData.nick)
                    + renderField('\u5e74\u9f84', charData.age ? charData.age + '\u5c81' : '')
                    + renderField('\u804c\u4e1a', charData.job)
                    + renderField('\u7b49\u7ea7', charData.level)
                    + renderField('VIP', charData.vip)
                    + renderField('\u6ce8\u518c\u65f6\u957f', charData.registered)
                    + renderField('\u4ea4\u53cb\u76ee\u7684', charData.purpose);

                var appearanceFields = renderField('\u4f53\u578b', charData.bodyType)
                    + renderField('\u8eab\u9ad8', charData.height)
                    + renderField('\u9762\u5bb9\u98ce\u683c', charData.faceStyle)
                    + renderField('\u7279\u5f81', charData.features)
                    + renderField('\u65e5\u5e38\u7a7f\u642d', charData.dailyStyle)
                    + renderField('\u7ea6\u4f1a\u7a7f\u642d', charData.dateStyle)
                    + renderField('\u5185\u8863\u504f\u597d', charData.lingerie)
                    + renderField('\u5c45\u5bb6\u98ce\u683c', charData.homeStyle);

                var personalityFields = renderField('\u6838\u5fc3\u9a71\u52a8', charData.personality_drive)
                    + renderField('\u4e3b\u8272\u8c03', charData.personality_main ? charData.personality_main.join(', ') : '')
                    + renderField('\u53cd\u5dee\u7279\u8d28', charData.personality_contrast);

                var chatFields = renderField('\u804a\u5929\u98ce\u683c', charData.chat_style)
                    + renderField('\u56de\u590d\u8282\u594f', charData.chat_pace)
                    + renderField('\u4e3b\u52a8\u6027', charData.chat_initiative)
                    + renderField('\u5f00\u8f66\u98ce\u683c', charData.chat_drive);

                var meetFields = renderField('\u521d\u6b21\u89c1\u9762', charData.meet_first)
                    + renderField('\u7ebf\u4e0a\u7ebf\u4e0b\u4e00\u81f4\u6027', charData.meet_real)
                    + renderField('\u8fdb\u5c55\u8282\u594f', charData.meet_pace);

                var bodyFields = renderField('\u7f69\u676f', charData.bust)
                    + renderField('\u8170\u90e8', charData.waist)
                    + renderField('\u81c0\u90e8', charData.hip)
                    + renderField('\u79c1\u5904', charData.pubic)
                    + renderField('\u5185\u90e8', charData.inner)
                    + renderField('\u654f\u611f\u70b9', charData.sensitive ? charData.sensitive.join(', ') : '');

                var nsfwFields = renderField('\u6838\u5fc3\u9a71\u52a8', charData.nsfw_drive)
                    + renderField('\u4eb2\u5bc6\u98ce\u683c', charData.nsfw_style)
                    + renderField('\u58f0\u97f3\u8868\u73b0', charData.nsfw_voice)
                    + renderField('\u9a9a\u8bdd\u7c7b\u578b', charData.nsfw_dirty_talk)
                    + renderField('\u504f\u597d', charData.nsfw_likes ? charData.nsfw_likes.join(', ') : '')
                    + renderField('\u7981\u533a', charData.nsfw_limits ? charData.nsfw_limits.join(', ') : '')
                    + renderField('\u9ad8\u6f6e\u8868\u73b0', charData.nsfw_orgasm);

                var contentHtml = '<div style="padding:0;">'
                    + headerHtml
                    + renderSection('\u57fa\u672c\u4fe1\u606f', basicFields)
                    + renderSection('\u5916\u8868\u4fe1\u606f', appearanceFields)
                    + renderSection('\u6027\u683c\u8c03\u8272\u76d8', personalityFields)
                    + renderSection('\u804a\u5929\u98ce\u683c', chatFields)
                    + renderSection('\u89c1\u9762\u98ce\u683c', meetFields)
                    + renderSection('\u8eab\u4f53\u6570\u636e', bodyFields)
                    + renderSection('NSFW \u4fe1\u606f', nsfwFields)
                    + '<div style="text-align:center;font-size:11px;color:#555;padding:8px 0 4px;">\u5f00\u76d2\u4e8e: ' + app.escapeHtml(charData.created_at || '\u672a\u77e5') + '</div>'
                    + '</div>';

                MlifeApp.updateCache('unbox', contentHtml);
                return contentHtml;
            };


            // ---- 路由 ----
            app.renderPage = function(config) {
                if (!config || !config.page) {
                    app.currentPage = 'home';
                    app.renderHome(null);
                    return;
                }
                app.currentPage = config.page;
                var page = config.page;
                var data = config.data || null;

                // 显示浮层（兼容 flex 和 block 两种布局模式）
                var appEl = document.getElementById('mlife-app');
                if (appEl) {
                    var useFlex = !!appEl.querySelector('.nav-bar');
                    var targetDisplay = useFlex ? 'flex' : 'block';
                    if (appEl.style.display !== targetDisplay) {
                        appEl.style.display = targetDisplay;
                    }
                }

                var contentEl = document.getElementById('mlife-content');
                if (!contentEl) return;

                var html = '';
                switch (page) {
                    case 'home':
                    case 'index':
                        html = app.renderHome(data);
                        break;
                    case 'match':
                        html = app.renderMatch(data);
                        break;
                    case 'detail':
                        html = app.renderDetail(data);
                        break;
                    case 'live_list':
                    case 'livelist':
                        html = app.renderLiveList(data);
                        break;
                    case 'live':
                        html = app.renderLive(data);
                        break;
                    case 'goddess':
                        html = app.renderGoddess(data);
                        break;
                    case 'resource':
                        html = app.renderResource(data);
                        break;
                    case 'profile':
                        html = app.renderProfile(data);
                        break;
                    case 'selfie':
                        html = app.renderSelfie(data);
                        break;
                    case 'chat':
                        html = app.renderChat(data);
                        break;
                    case 'dm':
                    case 'DM':
                        html = app.renderDM(data);
                        break;
                    case 'dm_list':
                    case 'dmList':
                        html = app.renderDMList();
                        break;
                    case 'recruit_list':
                    case 'recruitlist':
                        html = app.renderRecruitList(data);
                        break;
                    case 'recruit_detail':
                    case 'recruitdetail':
                        html = app.renderRecruitDetail(data);
                        break;
                    case 'recruit_post':
                    case 'recruitpost':
                        html = app.renderRecruitPost(data);
                        break;
                    case 'recruit_manage':
                    case 'recruitmanage':
                        html = app.renderRecruitManage(data);
                        break;
                    case 'unbox':
                        html = app.renderUnbox(data);
                        break;
                    case 'settings':
                        html = app.renderSettings(data);
                        break;
                    default:
                        html = app.renderHome(data);
                        break;
                }

                contentEl.innerHTML = html;

                // 如果渲染结果为空，且该页支持 AI 生成，触发自动生成
                if (app.__isPageEmpty(page, html) && app.__pageGenerators[page]) {
                    if (!app.__isGenerating[page]) {
                        app.__generatePageContent(page);
                    }
                }
            };

            app.navigate = function(page, data) {
                app.renderPage({ page: page, data: data || null });
                // 更新导航高亮
                updateNavActive(page);
            };

            app.switchTab = function(tab) {
                var cached = app.getCached(tab);
                if (cached) {
                    var contentEl = document.getElementById('mlife-content');
                    if (contentEl) contentEl.innerHTML = cached;
                    updateNavActive(tab);
                    app.currentPage = tab;
                    return;
                }
                // 如果该页支持 AI 生成，走生成流程
                if (app.__pageGenerators[tab]) {
                    app.currentPage = tab;
                    updateNavActive(tab);
                    // 优先显示骨架屏（即发即弃旧页面内容）
                    var gen = app.__pageGenerators[tab];
                    if (gen && gen.skeleton) {
                        var contentEl = document.getElementById('mlife-content');
                        if (contentEl) contentEl.innerHTML = gen.skeleton();
                    }
                    app.__generatePageContent(tab);
                    return;
                }
                // 回退：原有 navigate 逻辑
                app.navigate(tab);
            };

            /**
             * renderSettings — 设置页（无需 AI 生成，从变量直接渲染）
             */
            app.renderSettings = function(data) {
                var vars = app.getMergedVars().stat_data || {};
                var mu = vars['M-life_用户'] || {};
                var social = vars['M-life_社交'] || {};
                var econ = vars['M-life_经济'] || {};
                var account = getCurrentAccount();

                var nick = mu.昵称 || '用户';
                var level = mu.用户等级 || 'Lv1';
                var vip = mu.VIP类型 || '无';
                var coins = econ.M币 || 0;

                var html = '<div style="padding:16px;">'

                    // 用户信息摘要
                    + '<div style="text-align:center;padding:16px 0;border-bottom:1px solid var(--ml-border);margin-bottom:12px;">'
                    + '<div style="font-size:20px;font-weight:bold;color:var(--ml-text);">' + app.escapeHtml(nick) + '</div>'
                    + '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:6px;font-size:12px;">'
                    + '<span style="padding:1px 7px;border-radius:3px;background:#ff6b9d;color:#fff;font-weight:bold;">' + app.escapeHtml(level) + '</span>'
                    + (vip && vip !== '无'
                        ? '<span style="padding:1px 7px;border-radius:3px;background:var(--ml-gold);color:#1a1a1a;font-weight:bold;">' + app.escapeHtml(vip) + 'VIP</span>'
                        : '<span style="padding:1px 7px;border-radius:3px;background:#333;color:#999;">未开通VIP</span>')
                    + '</div>'
                    + '</div>'

                    // 账号切换
                    + '<div style="background:var(--ml-bg-section);border-radius:8px;padding:12px;margin-bottom:12px;">'
                    + '<div style="font-size:13px;color:var(--ml-text-dim);margin-bottom:8px;">🔄 切换账号</div>'
                    + '<select style="width:100%;background:var(--ml-bg-info);color:var(--ml-text-main);border:1px solid #2a2a3e;border-radius:6px;padding:8px 10px;font-size:14px;font-family:inherit;cursor:pointer;outline:none;box-sizing:border-box;"'
                    + ' onchange="MlifeApp.switchAccount(this.value)">'
                    + app.ACCOUNTS.map(function(a) {
                        return '<option value="' + a.id + '"' + (a.id === (account && account.id) ? ' selected' : '') + '>'
                            + a.emoji + ' ' + app.escapeHtml(a.label)
                            + '</option>';
                      }).join('')
                    + '</select>'
                    + '</div>'

                    // 资产信息
                    + '<div style="background:var(--ml-bg-section);border-radius:8px;padding:12px;margin-bottom:12px;">'
                    + '<div style="font-size:13px;color:var(--ml-text-dim);margin-bottom:8px;">💳 我的资产</div>'
                    + '<div style="display:flex;gap:16px;">'
                    + '<div style="flex:1;text-align:center;"><div style="font-size:18px;font-weight:bold;color:#f6d365;">' + coins + '</div><div style="font-size:11px;color:var(--ml-text-dim);">M币</div></div>'
                    + '<div style="flex:1;text-align:center;"><div style="font-size:18px;font-weight:bold;color:#34d399;">' + (parseInt(social.关注数) || 0) + '</div><div style="font-size:11px;color:var(--ml-text-dim);">关注</div></div>'
                    + '<div style="flex:1;text-align:center;"><div style="font-size:18px;font-weight:bold;color:var(--ml-accent);">' + (parseInt(social.粉丝数) || 0) + '</div><div style="font-size:11px;color:var(--ml-text-dim);">粉丝</div></div>'
                    + '</div>'
                    + '</div>'

                    // 主题切换
                    + '<div style="display:flex;align-items:center;justify-content:space-between;background:var(--ml-bg-section);border-radius:8px;padding:12px;margin-bottom:12px;">'
                    + '<span style="font-size:14px;color:var(--ml-text-main);">🌓 主题模式</span>'
                    + '<span style="font-size:13px;color:var(--ml-text-dim);">点击 🌙/☀️ 切换</span>'
                    + '</div>'

                    // 状态信息
                    + '<div style="background:var(--ml-bg-section);border-radius:8px;padding:12px;margin-bottom:12px;">'
                    + '<div style="font-size:13px;color:var(--ml-text-dim);margin-bottom:8px;">📊 状态</div>'
                    + '<div style="font-size:13px;color:var(--ml-text-main);padding:4px 0;">签到：' + (social.今日已签到 === 'true' ? '✅ 已签到' : '⬜ 未签到') + '</div>'
                    + '<div style="font-size:13px;color:var(--ml-text-main);padding:4px 0;">连签：' + (parseInt(social.连续签到天数) || 0) + ' 天</div>'
                    + '<div style="font-size:13px;color:var(--ml-text-main);padding:4px 0;">今日获赞：' + (parseInt(social.今日获赞) || 0) + '</div>'
                    + '</div>'

                    + '</div>';

                MlifeApp.updateCache('settings', html);
                return html;
            };

            // ---- 底部导航高亮 ----
            function updateNavActive(page) {
                // 黑金模式使用独立导航高亮
                if (app.__heiJinMode) {
                    updateHeiJinNav(page);
                    return;
                }
                var items = document.querySelectorAll('.nav-item');
                var pageMap = {
                    'home': 'nav-home',
                    'index': 'nav-home',
                    'match': 'nav-match',
                    'live_list': 'nav-live',
                    'livelist': 'nav-live',
                    'live': 'nav-live',
                    'dm': 'nav-dm',
                    'DM': 'nav-dm',
                    'dm_list': 'nav-dm',
                    'dmList': 'nav-dm',
                    'selfie': 'nav-me',
                    'goddess': 'nav-me',
                    'resource': 'nav-me',
                    'profile': 'nav-me',
                    'chat': 'nav-home',
                    'detail': 'nav-match',
                    'recruit_list': 'nav-me',
                    'recruitlist': 'nav-me',
                    'recruit_detail': 'nav-me',
                    'recruitdetail': 'nav-me',
                    'recruit_post': 'nav-me',
                    'recruitpost': 'nav-me',
                    'recruit_manage': 'nav-me',
                    'recruitmanage': 'nav-me',
                    'unbox': 'nav-dm',
                    'settings': 'nav-me'
                };
                var activeId = pageMap[page] || 'nav-home';
                items.forEach(function(item) {
                    if (item.id === activeId) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
            }

            /**
             * 黑金模式底部导航高亮
             */
            function updateHeiJinNav(page) {
                var items = document.querySelectorAll('.nav-item');
                var heiJinMap = {
                    'recruit_list': 'nav-heijin-square',
                    'recruitlist': 'nav-heijin-square',
                    'recruit_post': 'nav-heijin-post',
                    'recruitpost': 'nav-heijin-post',
                    'recruit_manage': 'nav-heijin-manage',
                    'recruitmanage': 'nav-heijin-manage',
                };
                // 退出（回到主应用）由 __exitHeiJinMode 处理，不在这里高亮
                // 未知页面全部视为"广场"高亮
                var activeId = heiJinMap[page] || 'nav-heijin-square';
                items.forEach(function(item) {
                    if (item.id === activeId) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
            }

            /**
             * 进入黑金之选独立模式
             * 替换底部导航栏为黑金之选专属 Tab
             */
            app.__enterHeiJinMode = function() {
                if (app.__heiJinMode) return;
                app.__heiJinMode = true;
                var appEl = document.getElementById('mlife-app');
                if (!appEl) return;
                var nav = appEl.querySelector('.nav-bar');
                if (!nav) return;
                // 保存进入前的页面和导航内容，用于退出后恢复
                app.__heiJinPrevPage = app.currentPage || 'home';
                app.__heiJinPrevNavHTML = nav.innerHTML;
                nav.innerHTML = ''
                    + '<button class="nav-item active" id="nav-heijin-square" style="color:#c9a96e!important;">'
                        + '<span class="nav-icon">💎</span>'
                        + '<span class="nav-label">广场</span>'
                    + '</button>'
                    + '<button class="nav-item" id="nav-heijin-post">'
                        + '<span class="nav-icon">✏️</span>'
                        + '<span class="nav-label">发布</span>'
                    + '</button>'
                    + '<button class="nav-item" id="nav-heijin-manage">'
                        + '<span class="nav-icon">📋</span>'
                        + '<span class="nav-label">管理</span>'
                    + '</button>'
                    + '<button class="nav-item" id="nav-heijin-exit">'
                        + '<span class="nav-icon">🔙</span>'
                        + '<span class="nav-label">返回</span>'
                    + '</button>';
                // 绑定黑金模式导航点击
                bindHeiJinNav();
                // 注入黑金模式专属样式
                injectHeiJinStyle();
            };

            /**
             * 退出黑金之选独立模式
             * 恢复原底部导航栏
             */
            app.__exitHeiJinMode = function() {
                if (!app.__heiJinMode) return;
                app.__heiJinMode = false;
                var appEl = document.getElementById('mlife-app');
                if (!appEl) return;
                var nav = appEl.querySelector('.nav-bar');
                if (!nav) return;
                // 恢复原导航
                if (app.__heiJinPrevNavHTML) {
                    nav.innerHTML = app.__heiJinPrevNavHTML;
                }
                // 重新绑定原导航点击
                bindNav();
                // 移除黑金模式样式
                removeHeiJinStyle();
                // 导航到进入前的页面
                var prevPage = app.__heiJinPrevPage || 'home';
                app.__heiJinPrevPage = null;
                try {
                    app.switchTab(prevPage);
                } catch(e) {
                    app.navigate(prevPage);
                }
            };

            /**
             * 黑金模式导航点击绑定
             */
            function bindHeiJinNav() {
                var navMap = {
                    'nav-heijin-square': 'recruit_list',
                    'nav-heijin-post': 'recruit_post',
                    'nav-heijin-manage': 'recruit_manage',
                };
                // 返回按钮特殊处理
                var exitEl = document.getElementById('nav-heijin-exit');
                if (exitEl) {
                    exitEl.addEventListener('click', function() {
                        app.__exitHeiJinMode();
                    });
                }
                // 其他三个 Tab
                Object.keys(navMap).forEach(function(id) {
                    var el = document.getElementById(id);
                    if (!el) return;
                    el.addEventListener('click', function() {
                        var page = navMap[id];
                        app.navigate(page);
                    });
                });
            }

            /**
             * 注入黑金模式样式（覆盖默认主题为暗黑金配色）
             */
            var __heiJinStyleId = 'mlife-heijin-style';
            function injectHeiJinStyle() {
                if (document.getElementById(__heiJinStyleId)) return;
                var style = document.createElement('style');
                style.id = __heiJinStyleId;
                style.textContent = ''
                    + '#mlife-app.mlife-heijin-mode .nav-bar{'
                    + 'background:linear-gradient(135deg,#0a0a0f,#1a1a1f)!important;'
                    + 'border-top:1px solid rgba(201,169,110,0.15)!important;'
                    + '}'
                    + '#mlife-app.mlife-heijin-mode .nav-item{'
                    + 'color:rgba(255,255,255,0.4)!important;'
                    + '}'
                    + '#mlife-app.mlife-heijin-mode .nav-item.active{'
                    + 'color:#c9a96e!important;'
                    + 'text-shadow:0 0 8px rgba(201,169,110,0.3)!important;'
                    + '}'
                    + '#mlife-app.mlife-heijin-mode .nav-item:hover{'
                    + 'color:rgba(201,169,110,0.7)!important;'
                    + 'background:rgba(201,169,110,0.06)!important;'
                    + '}';
                document.head.appendChild(style);
                // 添加黑金模式 class
                var appEl = document.getElementById('mlife-app');
                if (appEl) appEl.classList.add('mlife-heijin-mode');
            }

            function removeHeiJinStyle() {
                var style = document.getElementById(__heiJinStyleId);
                if (style) style.remove();
                var appEl = document.getElementById('mlife-app');
                if (appEl) appEl.classList.remove('mlife-heijin-mode');
            }

            /**
             * 判断当前用户是否为黑金 VIP
             */
            app.__isHeiJinVip = function() {
                try {
                    var vars = app.getMergedVars().stat_data || {};
                    var mu = vars['M-life_用户'] || {};
                    return mu.VIP类型 === '黑金';
                } catch(e) {}
                return false;
            };

            /**
             * 显示黑金 VIP 提示（暴露到全局，供 inline onclick 调用）
             */
            window.showHeiJinDenied = function() {
                var toast = document.createElement('div');
                toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:999999;background:var(--ml-bg-section);border:1px solid #ff6b9d;border-radius:12px;padding:20px 28px;text-align:center;max-width:280px;box-shadow:0 8px 40px rgba(0,0,0,0.6);';
                toast.innerHTML = '<div style="font-size:32px;margin-bottom:10px;">🔒</div>'
                    + '<div style="font-size:16px;color:var(--ml-text);font-weight:bold;margin-bottom:6px;">黑金VIP 专属</div>'
                    + '<div style="font-size:13px;color:var(--ml-text-dim);line-height:1.5;">开通黑金VIP后<br>即可访问黑金之选</div>'
                    + '<button style="margin-top:16px;padding:8px 24px;border:none;border-radius:8px;background:var(--ml-gold);color:#1a1a1a;font-size:14px;font-weight:bold;cursor:pointer;font-family:inherit;">知道了</button>';
                document.body.appendChild(toast);
                toast.querySelector('button').addEventListener('click', function() { toast.remove(); });
                setTimeout(function() { if (toast.parentNode) toast.remove(); }, 4000);
            };

            // 修改 navigate 以支持黑金模式入口
            // 保存原始 navigate 引用
            var __origNavigate = app.navigate;
            app.navigate = function(page, data) {
                // 黑金页面：检查 VIP
                if (page === 'recruit_list' || page === 'recruitlist' || page === 'recruit_post' || page === 'recruitpost' || page === 'recruit_manage' || page === 'recruitmanage') {
                    if (!app.__heiJinMode && !app.__isHeiJinVip()) {
                        showHeiJinDenied();
                        return;
                    }
                    if (!app.__heiJinMode) {
                        app.__enterHeiJinMode();
                    }
                }
                // 调用原 navigate
                __origNavigate(page, data);
            };

            // 修改 switchTab 以支持黑金模式
            var __origSwitchTab = app.switchTab;
            app.switchTab = function(tab) {
                // 黑金页面：检查 VIP
                if (tab === 'recruit_list' || tab === 'recruitlist' || tab === 'recruit_post' || tab === 'recruitpost' || tab === 'recruit_manage' || tab === 'recruitmanage') {
                    if (!app.__heiJinMode && !app.__isHeiJinVip()) {
                        showHeiJinDenied();
                        return;
                    }
                    if (!app.__heiJinMode) {
                        app.__enterHeiJinMode();
                    }
                }
                __origSwitchTab(tab);
            };

            // ---- 底部导航点击绑定 ----
            function bindNav() {
                var navMap = {
                    'nav-home': 'home',
                    'nav-match': 'match',
                    'nav-live': 'live_list',
                    'nav-dm': 'dm',
                    'nav-me': 'profile'
                };
                Object.keys(navMap).forEach(function(id) {
                    var el = document.getElementById(id);
                    if (!el) return;
                    el.addEventListener('click', function() {
                        var page = navMap[id];
                        // 检查缓存
                        var cached = app.getCached(page);
                        if (cached) {
                            document.getElementById('mlife-content').innerHTML = cached;
                            updateNavActive(page);
                            app.currentPage = page;
                        } else if (app.__pageGenerators[page]) {
                            // 支持 AI 生成的页面走生成流程
                            app.currentPage = page;
                            updateNavActive(page);
                            app.__generatePageContent(page);
                        } else {
                            app.navigate(page);
                        }
                    });
                });
            }

            // ---- 启动 ----
            app.init = function(rawData) {
                if (rawData) {
                    if (typeof rawData === 'string') {
                        try { app.config = JSON.parse(rawData); }
                        catch (e) { app.config = rawData; }
                    } else {
                        app.config = rawData;
                    }
                } else {
                    app.config = parseJsonData();
                }

                // 确保 mlife-content 容器存在（浮层由外层自动创建）
                if (!document.getElementById('mlife-content') && document.getElementById('mlife-app')) {
                    var contentDiv = document.createElement('div');
                    contentDiv.id = 'mlife-content';
                    contentDiv.style.cssText = 'max-width:500px;margin:0 auto;padding:0 10px 70px;box-sizing:border-box;flex:1;min-height:0;height:100%;';
                    document.getElementById('mlife-app').appendChild(contentDiv);
                }

                // 刷新状态栏
                try { populateStatusBar(); } catch(e) { console.warn('[MlifeApp] populateStatusBar error:', e); }

                // 绑定导航
                try { bindNav(); } catch(e) { console.warn('[MlifeApp] bindNav error:', e); }

                // 注入 shimmer 动画样式
                try { injectShimmerStyle(); } catch(e) {}

                // 清除 AI 可生成页面的空状态缓存
                Object.keys(app.__pageGenerators).forEach(function(page) {
                    var cached = app.getCached(page);
                    if (cached && app.__isPageEmpty(page, cached)) {
                        app.tabCache[page] = null;
                    }
                });

                // 更新 DM Tab 未读标记
                try { app.updateDmTabBadge(); } catch(e) {}

                // 全局事件委托：点击 [data-person] 弹出用户菜单
                var mlifeContent = document.getElementById('mlife-content');
                if (mlifeContent) {
                    mlifeContent.addEventListener('click', function(e) {
                        var target = e.target.closest('[data-person]');
                        if (target) {
                            try {
                                var raw = target.getAttribute('data-person');
                                if (raw && raw.indexOf('%') !== -1) {
                                    raw = decodeURIComponent(raw);
                                }
                                var personData = JSON.parse(raw);
                                if (personData && personData.contact) {
                                    e.stopPropagation();
                                    app.showPersonMenu(personData);
                                }
                            } catch(_) {}
                        }
                    });
                }

                // 渲染首屏（独立模式由boot处理，避免二次渲染）
                // 只处理config.page存在的情况（酒馆模式）
                if (app.config && app.config.page) {
                    app.renderPage(app.config);
                }

                // 监听 MVU 变量更新
                if (typeof eventOn === 'function' && typeof Mvu !== 'undefined') {
                    eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, function() {
                        try { populateStatusBar(); } catch(e) {}
                    });
                }
            };

            return app;
        })();

        // ---- 酒馆模式：自动创建可拖动的悬浮窗 ----
        (function() {
            if (document.getElementById('mlife-app')) return;

            // 初始位置（屏幕右侧，离 💎 近一点）
            var winW = Math.min(380, window.innerWidth - 20);
            var startX = Math.max(10, window.innerWidth - winW - 70);
            var startY = 80;

            var ov = document.createElement('div');
            ov.id = 'mlife-app';
            ov.style.cssText = 'position:fixed;left:' + startX + 'px;top:' + startY + 'px;width:' + winW + 'px;height:calc(100vh - 100px);max-height:700px;z-index:99999;display:none;border-radius:16px;border:1px solid rgba(255,107,157,0.25);overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.6);';

            // 标题栏（可拖动）
            ov.innerHTML = '<div id="mlife-app-header" style="background:var(--ml-bg-section);padding:8px 12px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #2a2a3e;cursor:grab;user-select:none;">'
                + '<span style="color:var(--ml-accent-light);font-size:14px;font-weight:bold;">💎 魅途</span>'
                + '<button id="mlife-app-close" style="background:none;border:none;color:var(--ml-text-dim);font-size:18px;cursor:pointer;padding:2px 6px;font-family:inherit;line-height:1;">✕</button>'
                + '</div>'
                + '<div id="mlife-app-body" style="background:rgba(5,10,14,0.97);flex:1;min-height:0;overflow-y:auto;">'
                + '<div id="mlife-content" style="padding:8px 10px 20px;box-sizing:border-box;"></div>'
                + '</div>';

            document.body.appendChild(ov);

            // 关闭按钮
            document.getElementById('mlife-app-close').addEventListener('click', function() {
                ov.style.display = 'none';
            });

            // 拖拽逻辑
            (function() {
                var header = document.getElementById('mlife-app-header');
                var drag = false, sx, sy, ox, oy;

                header.addEventListener('mousedown', function(e) {
                    if (e.button !== 0) return;
                    drag = true;
                    var rect = ov.getBoundingClientRect();
                    ox = e.clientX - rect.left;
                    oy = e.clientY - rect.top;
                    header.style.cursor = 'grabbing';
                    e.preventDefault();
                });

                document.addEventListener('mousemove', function(e) {
                    if (!drag) return;
                    ov.style.left = Math.max(0, e.clientX - ox) + 'px';
                    ov.style.top = Math.max(0, e.clientY - oy) + 'px';
                });

                document.addEventListener('mouseup', function() {
                    if (drag) {
                        drag = false;
                        header.style.cursor = 'grab';
                    }
                });
            })();
        })();

        // ============================================================
        // 启动入口
        // ============================================================
        (function boot() {
            var isStandalone = (
                typeof window.$ !== 'function' &&
                typeof window.waitGlobalInitialized !== 'function'
            );

            if (isStandalone) {
                window.__isStandalone = true;
                // 独立模式：DOM 就绪后直接启动
                console.log('[MlifeApp] 独立模式启动');
                function start() {
                    console.log('[MlifeApp] start() invoked');
                    // 先调用 init（初始化内部状态、绑定导航等）
                    window.MlifeApp.init();

                    // 再填充演示数据覆盖首页
                    var demoData = {
                            "page": "home",
                            "posts": [
                                {
                                    "avatar": "\u{1F338}", "nick": "夜蝶", "level": "Lv8", "vip": "黄金",
                                    "time": "2分钟前", "section": "同城",
                                    "body": "今晚好无聊，有人来陪陪我吗？刚洗完澡，浑身软软的\u{1F60F}",
                                    "images": [{"desc": "浴室自拍，雾气朦胧，隐约可见锁骨和湿漉漉的长发"}],
                                    "paywall": "无", "likes": 42, "comments": 12, "shares": 3,
                                    "hotComments": [
                                        {"name": "暗夜骑士", "text": "我在！私信你了小姐姐"},
                                        {"name": "清风", "text": "坐标哪里？马上到"}
                                    ]
                                },
                                {
                                    "avatar": "\u{1F339}", "nick": "绯色梦境", "level": "Lv12", "vip": "黑金",
                                    "time": "15分钟前", "section": "推荐",
                                    "body": "周末有空，约了个小哥哥出来玩～猜猜我们去哪了？\u{1F609}\n附一张今天的穿搭，喜欢吗？",
                                    "images": [
                                        {"desc": "全身镜前自拍，黑色蕾丝短裙配红底高跟鞋"},
                                        {"desc": "咖啡馆角落，手里拿着拿铁，侧脸微笑"}
                                    ],
                                    "paywall": "完整版需关注", "likes": 128, "comments": 34, "shares": 17,
                                    "hotComments": [
                                        {"name": "绅士", "text": "这腿绝了\u{1F60D}"},
                                        {"name": "路人甲", "text": "求同款链接！"}
                                    ]
                                }
                            ]
                        };
                        var contentEl = document.getElementById('mlife-content');
                        if (contentEl) {
                            contentEl.innerHTML = window.MlifeApp.renderHome(demoData);
                        }

                        // 在首页渲染完成后调用 init（不覆盖首页内容）
                        window.MlifeApp.init();

                        // 私信 + 开盒演示数据：3秒后自动演示
                        // 以便用户先看首页内容，不被自动跳转干扰
                        setTimeout(function() {
                            // 渲染私信页面带开盒按钮
                            window.MlifeApp.navigate('dm', {
                                "contact": "蜜桃气泡水",
                                "avatar": "🍑",
                                "level": "Lv3",
                                "vip": "黄金",
                                "age": 24,
                                "hasCharacter": true,
                                "messages": [
                                    {"type": "incoming", "text": "你好呀~", "time": "10分钟前"},
                                    {"type": "outgoing", "text": "嗨，看了你的资料挺感兴趣的", "status": "已读", "time": "8分钟前"},
                                    {"type": "incoming", "text": "嘻嘻，谢谢~ 我也觉得你不错😊", "time": "5分钟前"}
                                ]
                            });
                        }, 300);

                        // 开盒页面演示（已开盒状态）：3秒后展示
                        setTimeout(function() {
                            window.MlifeApp.navigate('unbox', {
                                "contact": "蜜桃气泡水",
                                "avatar": "🍑",
                                "level": "Lv3",
                                "vip": "黄金",
                                "isUnboxed": true,
                                "balance": "400",
                                "character": {
                                    "id": "char_001",
                                    "nick": "蜜桃气泡水",
                                    "age": 24,
                                    "job": "舞蹈老师",
                                    "level": "Lv3",
                                    "vip": "黄金",
                                    "purpose": "找长期关系",
                                    "registered": "老用户（三个月以上）",
                                    "bodyType": "匀称型",
                                    "height": "165cm",
                                    "faceStyle": "甜美型",
                                    "features": "黑长直，皮肤白嫩，锁骨明显",
                                    "dailyStyle": "韩系风：针织开衫、百褶裙",
                                    "dateStyle": "性感型：低领、短裙",
                                    "lingerie": "性感型：蕾丝成套",
                                    "homeStyle": "睡衣党",
                                    "personality_drive": "害怕孤独",
                                    "personality_main": ["温柔体贴", "开朗健谈"],
                                    "personality_contrast": "外热内冷",
                                    "chat_style": "句尾加波浪线~，口语化",
                                    "chat_pace": "看心情型",
                                    "chat_initiative": "试探型",
                                    "chat_drive": "闷骚型慢热",
                                    "meet_first": "自然型",
                                    "meet_real": "一致型",
                                    "meet_pace": "看感觉型",
                                    "bust": "C杯",
                                    "waist": "盈盈一握",
                                    "hip": "蜜桃臀",
                                    "pubic": "粉嫩，阴毛修剪过",
                                    "inner": "紧致，深处敏感",
                                    "sensitive": ["脖颈", "乳头"],
                                    "nsfw_drive": "情感需求",
                                    "nsfw_style": "羞涩但投入型",
                                    "nsfw_voice": "自然型",
                                    "nsfw_dirty_talk": "不说型",
                                    "nsfw_likes": ["后入", "接吻"],
                                    "nsfw_limits": ["肛交"],
                                    "nsfw_orgasm": "痉挛型",
                                    "created_at": "2025年9月15日"
                                }
                            });
                        }, 3500);

                        // 4秒后展示"我的"页面（黑金VIP + 招募帖内容）
                        setTimeout(function() {
                            window.MlifeApp.navigate('profile', {
                                "nick": "孤独的风",
                                "level": "Lv16",
                                "vip": "黑金",
                                "avatar": "🦅",
                                "bio": "黑金VIP | 诚征长期关系，不诚勿扰",
                                "stats": {"following": 238, "followers": 1842, "likes": 9527, "posts": 68},
                                "sections": [
                                    {id:'selfie', name:'日常自拍', icon:'📸', locked:false},
                                    {id:'chat', name:'闲聊灌水', icon:'💬', locked:false},
                                    {id:'resource', name:'资源分享', icon:'📦', locked:false},
                                    {id:'goddess', name:'女神夜话', icon:'👑', locked:false},
                                    {id:'recruit_list', name:'黑金之选', icon:'💎', locked:false}
                                ]
                            });
                            // 预填充黑金之选招募帖数据
                            window.MlifeApp.navigate('recruit_list', {
                                "recruits": [
                                    {
                                        "code": "R001",
                                        "avatar": "💃",
                                        "title": "周末高端宴会女伴",
                                        "poster": "寂寞绅士",
                                        "status": "招募中",
                                        "budget": "💰 3000 M币",
                                        "applicants": 5,
                                        "tags": ["宴会", "高端", "周末"],
                                        "time": "2小时前发布"
                                    },
                                    {
                                        "code": "R002",
                                        "avatar": "🌙",
                                        "title": "深夜私聊·长期陪伴",
                                        "poster": "夜行者",
                                        "status": "招募中",
                                        "budget": "💰 1500 M币/周",
                                        "applicants": 12,
                                        "tags": ["陪伴", "深夜", "长期"],
                                        "time": "5小时前发布"
                                    },
                                    {
                                        "code": "R003",
                                        "avatar": "🏖️",
                                        "title": "三亚旅行伴侣 3天2夜",
                                        "poster": "阳光男",
                                        "status": "已锁定",
                                        "budget": "💰 8000 M币",
                                        "applicants": 3,
                                        "tags": ["旅行", "三亚", "短期"],
                                        "time": "1天前发布"
                                    }
                                ]
                            });
                        }, 4500);

                        // 6秒后演示"发布招募"页面
                        setTimeout(function() {
                            window.MlifeApp.navigate('recruit_post', {
                                "form": {
                                    "titleHint": "例：寻找长期固定伴侣",
                                    "budgetHint": "例：5000M币/次",
                                    "tagsHint": "例：长期,固定,互惠",
                                    "bodyHint": "描述你的要求..."
                                }
                            });
                        }, 6500);

                        // 7.5秒后演示"我的管理"页面
                        setTimeout(function() {
                            window.MlifeApp.navigate('recruit_manage', {
                                "tab": "我发布的",
                                "myRecruits": [
                                    {"title": "周末高端宴会女伴", "applicants": 5, "status": "招募中"},
                                    {"title": "一对一摄影创作", "applicants": 3, "status": "已确认"},
                                    {"title": "深夜陪聊·长期", "applicants": 8, "status": "已完成"}
                                ],
                                "myApplications": [
                                    {"title": "三亚旅行伴侣 3天2夜", "status": "已报名"},
                                    {"title": "商务晚宴女伴", "status": "未选中"}
                                ]
                            });
                        }, 8500);
                }
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', start);
                } else {
                    start();
                }
            }
        })();

// [2] DM Manager
/**
 * M-life DM 管理器 v1
 *
 * 独立 API 模式的私信系统，不走 tavern 主线楼层。
 *
 * 核心功能:
 *   1. dmGenerate() — 调 tavern 内部 API 获取 AI 回复
 *   2. 会话管理 — 多联系人独立上下文，localStorage 持久化
 *   3. 联系人索引 — 未读标记、时间排序、最近消息
 *   4. 三层堆积控制 — 本地存储 retention / API 滑动窗口 / 主线桥接限频
 *   5. Persona 管理 — 从开盒/匹配数据生成角色设定
 *
 * 集成:
 *   注册到 index.yaml 脚本库，类型"脚本"，在 MlifeApp 之后加载。
 *   暴露 window.DM_Manager，MlifeApp 通过 DM_Manager.xxx 调用。
 */

(function () {
    'use strict';

    // ===================================================================
    // 常量
    // ===================================================================

    var STORAGE_INDEX = 'mlife_dm_index_v1';       // 联系人索引
    var STORAGE_SESS_PREFIX = 'mlife_dm_sess_v1_';  // 会话数据
    var STORAGE_UNREAD = 'mlife_dm_unread_v1';      // 未读计数
    var STORAGE_PERSONA_PREFIX = 'mlife_dm_persona_v1_'; // persona 缓存

    var MAX_SESSION_MSGS = 50;     // 一个会话保留消息上限
    var API_WINDOW = 10;           // 每次发给 API 的最近轮数
    var BRIDGE_COOLDOWN_MS = 5 * 60 * 1000; // 同一联系人桥接冷却 5 分钟
    var MAX_BRIDGE_GLOBAL = 3;     // 全局每 8 轮主线最多注入 3 条
    var MAX_TOKEN = 600;           // API max_tokens
    var TEMPERATURE = 0.85;

    // ===================================================================
    // 内部状态
    // ===================================================================

    var dm = {};
    var _bridgeTimestamps = {};    // map[contact] → last bridge time
    var _currentContact = null;    // 当前打开的会话联系人
    var _sending = false;          // 发送中防重

    // ===================================================================
    // 工具函数
    // ===================================================================

    function now() { return new Date().toISOString(); }

    /* esc 已移至 src/escape.js（外层闭包，目前无调用点，待后续与 escapeHtml 统一） */

    function getContactKey(contact) {
        return (contact || '').trim();
    }

    // ===================================================================
    // 联系人索引导出 / 持久化
    // ===================================================================

    /** 读取联系人索引 */
    function loadIndex() {
        try {
            var raw = localStorage.getItem(STORAGE_INDEX);
            return raw ? JSON.parse(raw) : [];
        } catch (_) { return []; }
    }

    /** 保存联系人索引 */
    function saveIndex(list) {
        try { localStorage.setItem(STORAGE_INDEX, JSON.stringify(list)); } catch (_) {}
    }

    /** 读取未读计数 */
    function loadUnread() {
        try {
            var raw = localStorage.getItem(STORAGE_UNREAD);
            return raw ? JSON.parse(raw) : {};
        } catch (_) { return {}; }
    }

    /** 保存未读计数 */
    function saveUnread(map) {
        try { localStorage.setItem(STORAGE_UNREAD, JSON.stringify(map)); } catch (_) {}
    }

    /** 读取会话 */
    function loadSession(contact) {
        var key = getContactKey(contact);
        if (!key) return null;
        try {
            var raw = localStorage.getItem(STORAGE_SESS_PREFIX + key);
            return raw ? JSON.parse(raw) : null;
        } catch (_) { return null; }
    }

    /** 保存会话 */
    function saveSession(contact, data) {
        var key = getContactKey(contact);
        if (!key) return;
        try { localStorage.setItem(STORAGE_SESS_PREFIX + key, JSON.stringify(data)); } catch (_) {}
    }

    /** 读取缓存 persona */
    function loadPersona(contact) {
        try {
            var raw = localStorage.getItem(STORAGE_PERSONA_PREFIX + getContactKey(contact));
            return raw ? JSON.parse(raw) : null;
        } catch (_) { return null; }
    }

    /** 保存缓存 persona */
    function savePersona(contact, data) {
        try { localStorage.setItem(STORAGE_PERSONA_PREFIX + getContactKey(contact), JSON.stringify(data)); } catch (_) {}
    }

    // ===================================================================
    // API 调用 — 调 tavern 内部 chat-completions
    // ===================================================================

    /* extractReply 已移至 src/parse.js（外层闭包） */

    /**
     * 发送 chat completion 请求到 tavern 后端
     *
     * @param {Array} messages - [{role, content}, ...]
     * @param {string} systemPrompt - DM 角色 system prompt
     * @returns {Promise<string>} AI 回复
     */
    async function dmGenerate(messages, systemPrompt) {
        var chatCompletionSource = window.main_api || 'openai';
        var model = undefined;

        // 获取当前模型
        try {
            if (window.oai_settings && window.oai_settings.model) {
                model = window.oai_settings.model;
            }
        } catch (_) {}

        var payload = {
            messages: [
                { role: 'system', content: systemPrompt },
            ],
            chat_completion_source: chatCompletionSource,
            max_tokens: MAX_TOKEN,
            temperature: TEMPERATURE,
            stream: false,
            use_sysprompt: false,
        };

        // 追加滑动窗口消息 (最近 API_WINDOW 轮)
        var recent = messages.slice(-(API_WINDOW * 2)); // ×2 因为每轮 user+assistant
        for (var i = 0; i < recent.length; i++) {
            payload.messages.push(recent[i]);
        }

        // 加入模型
        if (model) payload.model = model;

        // 获取 CSRF token
        var csrfToken = '';
        try { csrfToken = window.token || ''; } catch (_) {}

        var response;
        try {
            response = await fetch('/api/backends/chat-completions/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                },
                cache: 'no-cache',
                body: JSON.stringify(payload),
            });
        } catch (err) {
            // fetch 失败 → 回退到 generateQuietPrompt
            return await fallbackGenerate(messages, systemPrompt);
        }

        if (!response.ok) {
            // API 返回错误 → 回退
            return await fallbackGenerate(messages, systemPrompt);
        }

        var json;
        try { json = await response.json(); } catch (_) {
            return await fallbackGenerate(messages, systemPrompt);
        }

        if (json.error) {
            return await fallbackGenerate(messages, systemPrompt);
        }

        var reply = extractReply(json);
        if (!reply) {
            return await fallbackGenerate(messages, systemPrompt);
        }

        return reply;
    }

    /**
     * 回退方案：使用 generateQuietPrompt
     * 当 fetch API 不可用时调用
     */
    async function fallbackGenerate(messages, systemPrompt) {
        try {
            if (typeof generateQuietPrompt !== 'function') {
                return '[DM 服务暂不可用]';
            }

            // 组装 prompt
            var prompt = systemPrompt + '\n\n';
            var recent = messages.slice(-(API_WINDOW * 2));
            for (var i = 0; i < recent.length; i++) {
                var m = recent[i];
                if (m.role === 'user') prompt += '{{user}}: ' + m.content + '\n';
                else if (m.role === 'assistant') prompt += '你: ' + m.content + '\n';
            }
            prompt += '{{user}}: \n';  // 触发回复

            var result = await generateQuietPrompt({
                quietPrompt: prompt,
                responseLength: MAX_TOKEN,
            });

            return result || '[无回复]';
        } catch (_) {
            return '[消息发送失败]';
        }
    }

    // ===================================================================
    // Persona 管理
    // ===================================================================

    /**
     * 获取联系人的 persona prompt
     * 层级: 缓存 → 开盒数据 → 匹配/详情数据 → 世界书 → AI 生成
     */
    async function getOrCreatePersona(contact, avatar, extra) {
        // 1. 检查缓存
        var cached = loadPersona(contact);
        if (cached && cached.prompt) return cached.prompt;

        // 2. 尝试 AI 生成完整人格
        var personaData = extra || {};
        var prompt = await buildPersonaPrompt(contact, avatar, personaData);

        // 3. 缓存
        savePersona(contact, { prompt: prompt, created: now() });
        return prompt;
    }

    /**
     * AI 生成完整人格底座（使用角色生成模板全维度）
     * 返回 system prompt 文本
     */
    async function buildPersonaPrompt(contact, avatar, data) {
        var name = contact || '对方';
        var age = data.age || '26';
        var job = data.job || '';
        var city = data.city || '';
        var tags = (data.tags || []).join('、');
        var note = data.note || '';
        var selfIntro = data.selfIntro || '';
        var recruitTitle = (data.relationship || '').indexOf('招募') >= 0 ? data.relationship : ('招募「' + (window.top && window.top.MlifeApp ? window.top.MlifeApp.currentPage : '') + '」')
        var rating = data.rating || '4.5';

        // 尝试 AI 生成（走 tavern API）
        try {
            if (typeof dmGenerate === 'function') {
                var genMessages = [
                    { role: 'system', content: '你是一个 M-life 社交软件的角色生成器。根据用户提供的信息，生成一个完整的女性角色设定。输出格式为纯文本角色描述，不要 JSON，不要 markdown。' },
                    { role: 'user', content: '为以下 M-life 用户生成完整的角色设定。\n\n基本信息：\n昵称: ' + name + '\n年龄: ' + age + (job ? '\n职业: ' + job : '') + (city ? '\n城市: ' + city : '') + '\n评分: ' + rating + (tags ? '\n标签: ' + tags : '') + (selfIntro ? '\n自我介绍: ' + selfIntro : '') + '\n\n请按以下维度生成，每个维度 1-3 句话：\n1. 基本信息（年龄/职业/等级/VIP/使用目的）\n2. 外表（身材/面容/特征/穿衣风格）\n3. 性格调色盘（核心驱动/主性格/反差面）\n4. 聊天风格（打字习惯/回复节奏/主动程度/表情使用）\n5. 见面倾向（初次表现/约会习惯/进展节奏）\n6. 对 {{user}} 的态度（初始好感/关系定位）\n\n要求：角色立体有辨识度，避免万能模板，性格和背景要匹配。' }
                ];
                var result = await dmGenerate(genMessages, '');
                if (result && result.length > 50) {
                    var fullPrompt = '你现在是一个叫"' + name + '"的 M-life 社交软件女性用户。\n\n' + result
                        + '\n\n=== 对 {{user}} 的态度 ===\n当前关系: 刚认识' + (recruitTitle ? '（通过' + recruitTitle + '接触）' : '')
                        + '\n好感度: 初始 60/100'
                        + '\n\n=== 规则 ==='
                        + '\n1. 回复像真实人类聊天，1-3 句话，自然口语化，带表情符号'
                        + '\n2. 循序渐渐，不要主动聊色'
                        + '\n3. 语气贴合性格设定'
                        + '\n4. 首次聊天主动做自我介绍'
                        + '\n5. 不要透露自己是 AI';
                    return fullPrompt;
                }
            }
        } catch(_) {}

        // 回退：基础静态 prompt
        return '你现在是一个叫"' + name + '"的 M-life 社交软件女性用户。'
            + '\n年龄: ' + age + (job ? '\n职业: ' + job : '') + (city ? '\n城市: ' + city : '')
            + '\n\n=== 性格 ===\n温柔体贴，开朗健谈'
            + '\n\n=== 聊天习惯 ===\n自然口语化，偶尔用表情'
            + '\n\n=== 对 {{user}} 的态度 ===\n刚认识，友好'
            + '\n\n=== 规则 ===\n1. 回复像真实聊天，1-3句话\n2. 不要主动聊色\n3. 不要透露是AI';
    }

    // ===================================================================
    // 会话管理
    // ===================================================================

    /**
     * 获取/创建会话
     */
    function getOrCreateSession(contact, avatar) {
        var key = getContactKey(contact);
        if (!key) return null;

        var sess = loadSession(key);
        if (sess) return sess;

        // 新建会话
        sess = {
            contact: key,
            avatar: avatar || '👤',
            messages: [],
            created: now(),
            updated: now(),
            version: 1,
        };
        saveSession(key, sess);
        return sess;
    }

    /**
     * 更新联系人索引
     */
    function updateIndex(contact, lastMessage) {
        var list = loadIndex();
        var key = getContactKey(contact);
        var found = false;

        for (var i = 0; i < list.length; i++) {
            if (list[i].contact === key) {
                list[i].lastTime = now();
                if (lastMessage) list[i].lastMessage = lastMessage.slice(0, 60);
                found = true;
                break;
            }
        }

        if (!found) {
            list.push({
                contact: key,
                lastTime: now(),
                lastMessage: lastMessage ? lastMessage.slice(0, 60) : '',
            });
        }

        // 按 lastTime 降序
        list.sort(function (a, b) { return a.lastTime < b.lastTime ? 1 : -1; });
        saveIndex(list);
        return list;
    }

    /**
     * 保留 retention: 超过 MAX_SESSION_MSGS 条 → 压缩为摘要
     * 将最早的一半消息压缩成一条 system 摘要
     */
    function retainSession(contact) {
        var sess = loadSession(getContactKey(contact));
        if (!sess || !sess.messages) return;

        if (sess.messages.length <= MAX_SESSION_MSGS) return;

        // 取前半部分用于压缩
        var half = Math.floor(sess.messages.length / 2);
        var oldPart = sess.messages.splice(0, half);

        // 尝试生成摘要 (只从 oldPart 提取关键内容)
        var summaryLines = [];
        var userTopics = [];
        var aiTopics = [];
        for (var i = 0; i < oldPart.length; i++) {
            var m = oldPart[i];
            var text = (m.content || '').trim();
            if (!text) continue;
            // 只取每轮的第一句作为线索
            var firstSentence = text.split(/[。！？\n]/)[0].slice(0, 30);
            if (m.role === 'user') {
                userTopics.push(firstSentence);
            } else {
                aiTopics.push(firstSentence);
            }
        }

        // 汇总成一条摘要
        var summary = '[历史 ' + oldPart.length + ' 条消息] ';
        if (userTopics.length > 0) {
            summary += '{{user}}聊了: ' + userTopics.slice(0, 3).join('; ');
        }
        if (aiTopics.length > 0) {
            summary += ' | 对方回应: ' + aiTopics.slice(0, 3).join('; ');
        }

        // 插入摘要作为 system 消息
        if (summary.length > 10) {
            sess.messages.unshift({
                role: 'system',
                content: summary.slice(0, 300),
                time: oldPart[0]?.time || '',
                summarized: true,
            });
        }

        sess.updated = now();
        saveSession(getContactKey(contact), sess);
    }

    // ===================================================================
    // 未读管理
    // ===================================================================

    function getUnread(contact) {
        var map = loadUnread();
        return map[getContactKey(contact)] || 0;
    }

    function setUnread(contact, count) {
        var map = loadUnread();
        map[getContactKey(contact)] = count;
        saveUnread(map);
    }

    function incrementUnread(contact) {
        var key = getContactKey(contact);
        var map = loadUnread();
        map[key] = (map[key] || 0) + 1;
        saveUnread(map);
        return map[key];
    }

    function clearUnread(contact) {
        setUnread(contact, 0);
    }

    function getTotalUnread() {
        var map = loadUnread();
        var total = 0;
        for (var k in map) {
            if (map.hasOwnProperty(k)) total += map[k];
        }
        return total;
    }

    // ===================================================================
    // 主线桥接 — MVP 版
    // ===================================================================

    /**
     * 判断是否需要桥接到主线
     * 冷却期内不重复桥接
     */
    function shouldBridge(contact) {
        var key = getContactKey(contact);
        var last = _bridgeTimestamps[key] || 0;
        var elapsed = Date.now() - last;
        return elapsed >= BRIDGE_COOLDOWN_MS;
    }

    /**
     * 执行主线桥接：更新 MVU 变量 + system message
     */
    function bridgeToMain(contact, summary) {
        if (!summary) return;
        var key = getContactKey(contact);
        if (!shouldBridge(key)) return;

        _bridgeTimestamps[key] = Date.now();

        // 1. 更新 MVU 变量 (持久记忆)
        try {
            if (typeof updateVariable === 'function') {
                updateVariable('M-life_私信.最近对话', summary.slice(0, 150));
                updateVariable('M-life_私信.最近联系人', key);
            }
        } catch (_) {}

        // 2. 注入主线 system message
        try {
            if (typeof triggerSlash === 'function') {
                var msg = '[M-life私信] ' + key + ': ' + summary.slice(0, 100);
                triggerSlash('/system ' + msg);
            }
        } catch (_) {}
    }

    // ===================================================================
    // 核心发送逻辑
    // ===================================================================

    /**
     * 发送 DM 消息
     *
     * @param {string} contact - 联系人
     * @param {string} text - 消息内容
     * @param {Object} options - { avatar, personaExtra }
     * @returns {Promise<{ok:boolean, reply?:string, error?:string}>}
     */
    dm.send = async function (contact, text, options) {
        if (!contact || !text) return { ok: false, error: '参数不足' };
        if (_sending) return { ok: false, error: '发送中' };
        _sending = true;

        options = options || {};
        var key = getContactKey(contact);

        try {
            // 1. 获取/创建会话
            var sess = getOrCreateSession(key, options.avatar);
            if (!sess) return { ok: false, error: '会话创建失败' };

            // 2. 确认 persona
            if (!sess.personaPrompt) {
                sess.personaPrompt = await getOrCreatePersona(key, options.avatar, options.personaExtra || {});
            }

            // 3. 添加用户消息
            var userMsg = { role: 'user', content: text, time: now() };
            sess.messages.push(userMsg);
            sess.updated = now();
            saveSession(key, sess);

            // 4. 更新索引 + 清除未读 (发送方清除自己的未读)
            updateIndex(key, text);
            clearUnread(key);

            // 5. 调 API
            var reply = await dmGenerate(sess.messages, sess.personaPrompt);

            if (!reply || reply === '[无回复]' || reply === '[DM 服务暂不可用]' || reply === '[消息发送失败]') {
                // 失败：移除用户消息
                sess.messages.pop();
                saveSession(key, sess);
                return { ok: false, error: reply || '回复为空' };
            }

            // 6. 添加 AI 回复
            var aiMsg = { role: 'assistant', content: reply, time: now() };
            sess.messages.push(aiMsg);
            sess.updated = now();
            saveSession(key, sess);

            // 7. 更新索引
            updateIndex(key, reply);

            // 8. retention 检查
            retainSession(key);

            // 9. 主线桥接 (冷却控制)
            var summary = key + ': ' + text.slice(0, 20) + ' → ' + reply.slice(0, 40);
            bridgeToMain(key, summary);

            return { ok: true, reply: reply };

        } catch (err) {
            return { ok: false, error: err.message || '未知错误' };
        } finally {
            _sending = false;
        }
    };

    // ===================================================================
    // 接收消息 (从主线 AI 的 <mlife_app> 数据)
    // ===================================================================

    /**
     * 接收外部消息 (来自主线的 DM 数据)
     */
    dm.receive = function (data) {
        if (!data || !data.contact) return;

        var key = getContactKey(data.contact);
        var sess = getOrCreateSession(key, data.avatar);
        if (!sess) return;

        // 追加传入消息
        var msgs = data.messages || [];
        var lastMsg = '';
        for (var i = 0; i < msgs.length; i++) {
            var m = msgs[i];
            var role = m.type === 'outgoing' ? 'user' : 'assistant';
            var content = m.text || m.transcript || '';
            if (!content) continue;
            sess.messages.push({ role: role, content: content, time: m.time || now() });
            lastMsg = content;
        }

        sess.updated = now();
        saveSession(key, sess);

        // 更新索引
        updateIndex(key, lastMsg);

        // 增加未读 (如果当前不是这个会话)
        if (_currentContact !== key) {
            incrementUnread(key);
        }

        // 返回是否有新消息
        return msgs.length > 0;
    };

    // ===================================================================
    // 获取数据 (供 UI 渲染使用)
    // ===================================================================

    /** 获取联系人列表 (排序后的) */
    dm.getContactList = function () {
        return loadIndex();
    };

    /** 获取会话消息 */
    dm.getMessages = function (contact) {
        var sess = loadSession(getContactKey(contact));
        return sess ? (sess.messages || []) : [];
    };

    /** 获取会话元数据 */
    dm.getSessionMeta = function (contact) {
        var sess = loadSession(getContactKey(contact));
        if (!sess) return null;
        return {
            contact: sess.contact,
            avatar: sess.avatar,
            created: sess.created,
            updated: sess.updated,
            msgCount: (sess.messages || []).length,
            hasPersona: !!sess.personaPrompt,
        };
    };

    /** 获取联系人的未读数 */
    dm.getUnread = function (contact) {
        return getUnread(contact);
    };

    /** 获取总未读数 */
    dm.getTotalUnread = function () {
        return getTotalUnread();
    };

    /** 设当前打开的联系人 (未读清零用) */
    dm.setCurrentContact = function (contact) {
        _currentContact = getContactKey(contact);
        if (_currentContact) {
            clearUnread(_currentContact);
        }
    };

    /** 清空某联系人所有数据 */
    dm.deleteContact = function (contact) {
        var key = getContactKey(contact);
        try { localStorage.removeItem(STORAGE_SESS_PREFIX + key); } catch (_) {}
        try { localStorage.removeItem(STORAGE_PERSONA_PREFIX + key); } catch (_) {}

        var map = loadUnread();
        delete map[key];
        saveUnread(map);

        var list = loadIndex();
        for (var i = list.length - 1; i >= 0; i--) {
            if (list[i].contact === key) list.splice(i, 1);
        }
        saveIndex(list);

        if (_currentContact === key) _currentContact = null;
    };

    /** 发送中状态 */
    dm.isSending = function () { return _sending; };

    /** AI 生成人格底座 */
    dm.getOrCreatePersona = getOrCreatePersona;
    dm.dmGenerate = function(msg, sys) { return dmGenerate(msg, sys); };
    dm.getOrCreateSession = getOrCreateSession;

    // ===================================================================
    // 对外暴露
    // ===================================================================

    window.DM_Manager = dm;

    // 尝试挂载到 MlifeApp
    try {
        if (window.MlifeApp) {
            window.MlifeApp.dm = dm;
        }
    } catch (_) {}

})();


// [3] Floating Ball + Auto-boot
/**
 * M-life 悬浮控制球
 *
 * 功能:
 *   - 固定在屏幕边缘的悬浮球，可拖动（手机/PC）
 *   - 点击💎直接打开/关闭 MlifeApp 完整浮层（带底部导航栏）
 *   - 自动注入底部导航栏（CDP 模式/角色卡模板缺失时）
 *   - 白天/黑夜主题切换，持久化偏好
 *   - 位置持久化（localStorage）
 *
 * 集成:
 *   注册到 index.yaml 脚本库，类型为"脚本"，导出时携带按钮。
 *   按钮调用 toggle() 可手动展开/收起浮层。
 */

(function () {
  'use strict';

  // ========== 常量 ==========
  var ID = 'mlife-float-ball';
  var STYLE_ID = ID + '-style';
  var STORAGE_KEY = 'mlifeFloatBallPos';
  var THEME_KEY = 'mlifeTheme';
  var Z_BASE = 2147483646;

  // ========== DOM 引用 ==========
  var pdoc, pwin;

  try {
    pdoc = (parent && parent.document) ? parent.document : document;
    pwin = (parent && parent.window) ? parent.window : window;
  } catch (e) {
    pdoc = document;
    pwin = window;
  }

  // ========== 状态 ==========
  var isOpen = false;
  var drag = false;
  var moved = false;
  var ox = 0;
  var oy = 0;
  var sx = 0;
  var sy = 0;
  var DRAG_THRESHOLD = 6;
  var ball, dragMask;
  var _navInjected = false;
  var _themeInjected = false;
  var _navWrapped = false;

  // 导航历史栈
  var _pageHistory = ['home'];
  // 主 tab 列表（底部导航栏页面），切 tab 时重置历史
  var _tabPages = ['home', 'match', 'live_list', 'dm', 'profile'];

  // ========== 位置 ==========
  var pos = {
    x: pwin.innerWidth - 80,
    y: Math.round(pwin.innerHeight * 0.4),
  };

  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      var p = JSON.parse(saved);
      pos.x = clamp(Number(p.x) || pos.x, 0, pwin.innerWidth - 60);
      pos.y = clamp(Number(p.y) || pos.y, 0, pwin.innerHeight - 60);
    }
  } catch (_) {}

  function clamp(v, min, max) {
    return Math.max(min, Math.min(v, max));
  }

  // ========== 读取主题偏好 ==========
  function getSavedTheme() {
    try {
      return localStorage.getItem(THEME_KEY) || 'dark';
    } catch (_) { return 'dark'; }
  }

  function saveTheme(t) {
    try { localStorage.setItem(THEME_KEY, t); } catch (_) {}
  }

  // ========== 样式注入（含主题） ==========
  function injectStyles() {
    if (pdoc.getElementById(STYLE_ID)) return;

    var css = pdoc.createElement('style');
    css.id = STYLE_ID;
    css.textContent = [
      // ==========================================
      // 悬浮球
      // ==========================================
      '#' + ID + '{',
      'position:fixed!important;',
      'z-index:' + Z_BASE + '!important;',
      'width:52px;height:52px;',
      'border-radius:50%;',
      'background:linear-gradient(135deg,#ff6b9d 0%,#ff8fb4 100%);',
      'box-shadow:0 4px 16px rgba(255,107,157,0.4),0 2px 4px rgba(0,0,0,0.2);',
      'display:flex;align-items:center;justify-content:center;',
      'cursor:grab;',
      'user-select:none;-webkit-user-select:none;',
      'touch-action:none;',
      'transition:box-shadow 0.2s,transform 0.15s;',
      'font-size:22px;line-height:1;',
      'color:#fff;',
      'pointer-events:auto;',
      '}',
      '#' + ID + ':active{cursor:grabbing;}',
      '#' + ID + ':hover{box-shadow:0 6px 24px rgba(255,107,157,0.55);transform:scale(1.05);}',

      // ==========================================
      // 主题 CSS 变量
      // ==========================================
      '#mlife-app{',
      '--ml-bg:rgba(5,10,14,0.97);',
      '--ml-bg-card:#12121a;',
      '--ml-bg-section:#1a1a2e;',
      '--ml-bg-hover:#2a2a3e;',
      '--ml-bg-info:#0d0d18;',
      '--ml-text:#eee;',
      '--ml-text-main:#ddd;',
      '--ml-text-dim:#8a8a9a;',
      '--ml-text-dimmer:#666;',
      '--ml-border:#1e1e2e;',
      '--ml-border-light:#2a2a3e;',
      '--ml-accent:#ff6b9d;',
      '--ml-accent-light:#ff8fb4;',
      '--ml-accent-glow:rgba(255,107,157,0.15);',
      '--ml-border-1a:#1a1a2e;',
      '--ml-text-ccc:#ccc;',
      '--ml-text-bbb:#bbb;',
      '--ml-text-aaa:#aaa;',
      '--ml-cyan:#00e5ff;',
      '--ml-glow-10:rgba(255,107,157,0.1);',
      '--ml-gold:linear-gradient(135deg,#f6d365,#fda085);',

      '--ml-nav-bg:#14141e;',
      '--ml-nav-hover:rgba(255,255,255,0.06);',
      '--ml-nav-active-bg:rgba(255,107,157,0.08);',
      '}',
      '#mlife-app.mlife-theme-light{',
      '--ml-bg:#f5f0eb;',
      '--ml-bg-card:#ffffff;',
      '--ml-bg-section:#f0ece6;',
      '--ml-bg-hover:#e8e4de;',
      '--ml-bg-info:#faf8f5;',
      '--ml-text:#222;',
      '--ml-text-main:#444;',
      '--ml-text-dim:#888;',
      '--ml-text-dimmer:#aaa;',
      '--ml-border:#e0ddd8;',
      '--ml-border-light:#d0ccc8;',
      '--ml-accent:#e05570;',
      '--ml-accent-light:#f07890;',
      '--ml-accent-glow:rgba(224,85,112,0.12);',
      '--ml-border-1a:#e0ddd8;',
      '--ml-text-ccc:#444;',
      '--ml-text-bbb:#444;',
      '--ml-text-aaa:#888;',
      '--ml-cyan:#0891b2;',
      '--ml-glow-10:rgba(224,85,112,0.12);',
      '--ml-gold:#f07890;',

      '}',

      // ==========================================
      // 浮层 chrome（header / body / nav）
      // ==========================================
      '#mlife-app-header{',
      'background:var(--ml-bg-section)!important;',
      'border-bottom-color:var(--ml-border)!important;',
      '}',
      '#mlife-app-header span{color:var(--ml-accent-light)!important;}',
      '#mlife-app-header button{color:var(--ml-text-dim)!important;}',
      '#mlife-app-body{background:var(--ml-bg)!important;min-height:0;}',
      '#mlife-app{color:var(--ml-text-main);}',

      // 底部导航
      '#mlife-app .nav-bar{',
      'display:flex;flex-shrink:0;',
      'background:var(--ml-bg-section)!important;',
      'border-top:1px solid var(--ml-border)!important;',
      'padding:4px 2px;',
      'box-shadow:0 -1px 8px rgba(0,0,0,0.04);',
      '}',
      '#mlife-app .nav-item{',
      'flex:1;display:flex;flex-direction:column;',
      'align-items:center;justify-content:center;',
      'gap:3px;padding:6px 4px;margin:0 4px;',
      'cursor:pointer;border:none;background:transparent;',
      'color:var(--ml-text-dim)!important;font-family:inherit;',
      'font-size:10px;letter-spacing:0.06em;line-height:1;',
      'border-radius:8px;',
      'transition:all 0.2s;user-select:none;',
      '}',
      '#mlife-app .nav-item:hover{',
      'color:var(--ml-text-main)!important;',
      'background:var(--ml-nav-hover)!important;',
      '}',
      '#mlife-app .nav-item.active{',
      'color:var(--ml-accent)!important;',
      'background:var(--ml-nav-active-bg)!important;',
      'text-shadow:0 0 6px var(--ml-accent-glow)!important;',
      '}',
      '#mlife-app .nav-icon{font-size:18px;line-height:1;pointer-events:none;}',
      '#mlife-app .nav-label{line-height:1;pointer-events:none;}',

      // 主题切换按钮
      '#mlife-theme-btn{',
      'background:none;border:none;',
      'cursor:pointer;padding:2px 4px;line-height:1;',
      'font-family:inherit;font-size:15px;',
      'transition:transform 0.2s;',
      '}',
      '#mlife-theme-btn:hover{transform:scale(1.15);}',

      // 返回按钮
      '#mlife-back-btn{',
      'background:none;border:none;',
      'cursor:pointer;padding:2px 4px;line-height:1;',
      'font-family:inherit;font-size:16px;',
      'color:var(--ml-text-dim)!important;',
      'transition:transform 0.2s,color 0.2s;',
      'display:none;margin-right:2px;',
      '}',
      '#mlife-back-btn:hover{transform:scale(1.15);color:var(--ml-accent)!important;}',
      '#mlife-back-btn.visible{display:inline-block;}',

      // ==========================================
      // 内容区 — inline 样式已改用 var(--ml-*)，主题色由下方 #mlife-app 变量统一定义
      // ==========================================

      // Toast
      '.mlf-toast{',
      'position:fixed;top:20px;left:50%;transform:translateX(-50%);',
      'z-index:' + (Z_BASE + 10) + ';',
      'background:var(--ml-bg-card);border:1px solid var(--ml-accent-glow);',
      'border-radius:20px;padding:8px 18px;',
      'color:var(--ml-accent-light);font-size:13px;',
      'box-shadow:0 4px 16px rgba(0,0,0,0.4);',
      'pointer-events:none;',
      'animation:mlfFadeInOut 1.8s ease forwards;',
      '}',
      '@keyframes mlfFadeInOut{',
      '0%{opacity:0;transform:translateX(-50%) translateY(-8px);}',
      '15%{opacity:1;transform:translateX(-50%) translateY(0);}',
      '80%{opacity:1;}',
      '100%{opacity:0;transform:translateX(-50%) translateY(-4px);}',
      '}',
    ].join('\n');
    pdoc.head.appendChild(css);
  }

  // ========== Toast 提示 ==========
  function toast(msg) {
    var el = pdoc.createElement('div');
    el.className = 'mlf-toast';
    el.textContent = msg;
    pdoc.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 2000);
  }

  // ========== 主题切换 ==========
  var currentTheme = getSavedTheme();

  function applyTheme(theme) {
    var appEl = pdoc.getElementById('mlife-app');
    if (!appEl) return;
    appEl.classList.remove('mlife-theme-dark', 'mlife-theme-light');
    appEl.classList.add('mlife-theme-' + theme);
    currentTheme = theme;
    saveTheme(theme);

    // 更新按钮图标
    var btn = pdoc.getElementById('mlife-theme-btn');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  function toggleTheme() {
    var next = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    toast(next === 'light' ? '☀️ 白天模式' : '🌙 黑夜模式');
  }

  function ensureThemeBtn() {
    if (_themeInjected) return;
    var header = pdoc.getElementById('mlife-app-header');
    if (!header) return;

    // 如果已有按钮则跳过
    if (pdoc.getElementById('mlife-theme-btn')) { _themeInjected = true; return; }

    var btn = pdoc.createElement('button');
    btn.id = 'mlife-theme-btn';
    btn.title = '切换主题';
    btn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleTheme();
    });

    // 插入到关闭按钮前面
    var closeBtn = pdoc.getElementById('mlife-app-close');
    if (closeBtn) {
      header.insertBefore(btn, closeBtn);
    } else {
      header.appendChild(btn);
    }

    _themeInjected = true;
  }

  // ========== 返回按钮 ==========
  function ensureBackBtn() {
    var header = pdoc.getElementById('mlife-app-header');
    if (!header) return;
    if (pdoc.getElementById('mlife-back-btn')) return;

    var backBtn = pdoc.createElement('button');
    backBtn.id = 'mlife-back-btn';
    backBtn.title = '返回';
    backBtn.textContent = '←';
    backBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      goBack();
    });

    // 插入到标题前面
    var title = header.querySelector('span');
    if (title) {
      header.insertBefore(backBtn, title);
    } else {
      header.insertBefore(backBtn, header.firstChild);
    }
  }

  function updateBackBtn() {
    var btn = pdoc.getElementById('mlife-back-btn');
    if (!btn) return;
    // 历史栈只有当前页（或空）时隐藏返回按钮
    var show = _pageHistory.length > 1;
    if (show) { btn.classList.add('visible'); }
    else { btn.classList.remove('visible'); }
  }

  function goBack() {
    if (_pageHistory.length <= 1) return;
    _pageHistory.pop(); // 当前页
    var target = _pageHistory.pop(); // 上一页
    if (!target) { _pageHistory = ['home']; target = 'home'; }
    _pageHistory.push(target);
    try {
      if (pwin.MlifeApp && typeof pwin.MlifeApp.switchTab === 'function') {
        pwin.MlifeApp.switchTab(target);
      }
    } catch (e) {
      console.warn('[悬浮球] 返回失败:', e);
      _pageHistory = ['home'];
    }
    updateBackBtn();
  }

  // ========== 包装导航函数以跟踪历史 ==========
  function wrapNavigation() {
    if (_navWrapped || !pwin.MlifeApp) return;

    // 包装 navigate（子页面导航用）
    if (typeof pwin.MlifeApp.navigate === 'function') {
      var origNavigate = pwin.MlifeApp.navigate;
      pwin.MlifeApp.navigate = function (page, data) {
        if (_tabPages.indexOf(page) !== -1) {
          _pageHistory = [page];
        } else {
          if (_pageHistory.length === 0 || _pageHistory[_pageHistory.length - 1] !== page) {
            _pageHistory.push(page);
          }
        }
        updateBackBtn();
        return origNavigate.call(pwin.MlifeApp, page, data);
      };
    }

    // 包装 switchTab（主 tab + 部分子页面混合用，如 profile section 导航）
    if (typeof pwin.MlifeApp.switchTab === 'function') {
      var origSwitchTab = pwin.MlifeApp.switchTab;
      pwin.MlifeApp.switchTab = function (tab) {
        if (_tabPages.indexOf(tab) !== -1) {
          _pageHistory = [tab];
        } else {
          if (_pageHistory.length === 0 || _pageHistory[_pageHistory.length - 1] !== tab) {
            _pageHistory.push(tab);
          }
        }
        updateBackBtn();
        return origSwitchTab.call(pwin.MlifeApp, tab);
      };
    }

    _navWrapped = true;
  }

  // ========== 重置导航历史（切 tab 时调用） ==========
  function resetHistory(tab) {
    _pageHistory = [tab || 'home'];
    updateBackBtn();
  }

  // ========== 确保底部导航存在 ==========
  function ensureBottomNav() {
    if (_navInjected) return true;
    var appEl = pdoc.getElementById('mlife-app');
    if (!appEl) return false;

    // 已有导航栏（角色卡模板自带）
    if (appEl.querySelector('.nav-bar')) {
      _navInjected = true;
      bindNavClicks();
      return true;
    }

    // 将浮层改为 flex 布局，以便底部导航固定在底部
    appEl.style.display = 'none';
    appEl.style.flexDirection = 'column';
    appEl.style.overflow = 'hidden';

    var body = pdoc.getElementById('mlife-app-body');
    if (body) {
      body.style.flex = '1';
      body.style.minHeight = '0';
      body.style.overflowY = 'auto';
    }

    // 创建底部导航栏
    var nav = pdoc.createElement('div');
    nav.className = 'nav-bar';
    nav.innerHTML = ''
      + '<button class="nav-item active" id="nav-home">'
        + '<span class="nav-icon">&#x2302;</span>'
        + '<span class="nav-label">首页</span>'
      + '</button>'
      + '<button class="nav-item" id="nav-match">'
        + '<span class="nav-icon">&#x2661;</span>'
        + '<span class="nav-label">匹配</span>'
      + '</button>'
      + '<button class="nav-item" id="nav-live">'
        + '<span class="nav-icon">&#x25B6;</span>'
        + '<span class="nav-label">直播</span>'
      + '</button>'
      + '<button class="nav-item" id="nav-dm">'
        + '<span class="nav-icon">&#x2709;</span>'
        + '<span class="nav-label">私信</span>'
      + '</button>'
      + '<button class="nav-item" id="nav-me">'
        + '<span class="nav-icon">&#x263A;</span>'
        + '<span class="nav-label">我的</span>'
      + '</button>';
    appEl.appendChild(nav);

    // 绑定导航点击
    bindNavClicks();

    _navInjected = true;
    console.log('[悬浮球] 底部导航已注入');
    return true;
  }

  // ========== 导航点击绑定 ==========
  function bindNavClicks() {
    var navMap = {
      'nav-home': 'home',
      'nav-match': 'match',
      'nav-live': 'live_list',
      'nav-dm': 'dm',
      'nav-me': 'profile'
    };

    Object.keys(navMap).forEach(function (id) {
      var el = pdoc.getElementById(id);
      if (!el) return;
      el.addEventListener('click', function () {
        var page = navMap[id];
        // 主 tab 点击时重置导航历史
        resetHistory(page);
        try {
          if (pwin.MlifeApp && typeof pwin.MlifeApp.switchTab === 'function') {
            pwin.MlifeApp.switchTab(page);
          } else if (pwin.MlifeApp && typeof pwin.MlifeApp.navigate === 'function') {
            pwin.MlifeApp.navigate(page);
          }
        } catch (e) {
          console.warn('[悬浮球] 导航失败:', e);
        }
      });
    });
  }

  // ========== 拖拽逻辑 ==========
  function createMask() {
    removeMask();
    dragMask = pdoc.createElement('div');
    dragMask.style.cssText = 'position:fixed;inset:0;z-index:' + (Z_BASE + 2) + ';cursor:grabbing;background:transparent;touch-action:none;pointer-events:none;';
    pdoc.body.appendChild(dragMask);
  }

  function removeMask() {
    if (dragMask) { dragMask.remove(); dragMask = null; }
  }

  function savePos() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: parseInt(ball.style.left), y: parseInt(ball.style.top) }));
    } catch (_) {}
  }

  function startDrag(cx, cy) {
    drag = true;
    moved = false;
    sx = cx; sy = cy;
    var rect = ball.getBoundingClientRect();
    ox = cx - rect.left;
    oy = cy - rect.top;
    ball.style.transition = 'none';
    createMask();
  }

  function moveDrag(cx, cy) {
    if (!drag) return;
    if (!moved && Math.abs(cx - sx) < DRAG_THRESHOLD && Math.abs(cy - sy) < DRAG_THRESHOLD) return;
    moved = true;
    ball.style.left = clamp(cx - ox, 0, pwin.innerWidth - 52) + 'px';
    ball.style.top = clamp(cy - oy, 0, pwin.innerHeight - 52) + 'px';
  }

  function endDrag() {
    if (!drag) return;
    drag = false;
    ball.style.transition = '';
    removeMask();
    if (moved) savePos();
  }

  // ========== 确保浮层为 flex 布局 ==========
  function ensureFlexLayout(appEl) {
    if (_navInjected && appEl) {
      appEl.style.display = 'flex';
      appEl.style.flexDirection = 'column';
    }
  }

  // ========== 切换 MlifeApp 浮层 ==========
  function toggleApp() {
    var appEl = pdoc.getElementById('mlife-app');
    if (!appEl) {
      toast('MlifeApp 未加载');
      return;
    }

    isOpen = !isOpen;

    if (isOpen) {
      // 1. 确保底部导航存在
      ensureBottomNav();

      // 2. 应用保存的主题
      applyTheme(currentTheme);

      // 3. 确保主题按钮和返回按钮存在
      ensureThemeBtn();
      ensureBackBtn();

      // 4. 包装导航函数跟踪历史
      wrapNavigation();
      updateBackBtn();

      // 5. 打开浮层
      appEl.style.display = 'flex';
      appEl.style.flexDirection = 'column';

      // 6. 用 switchTab 恢复页面（走缓存）
      try {
        if (pwin.MlifeApp) {
          var current = pwin.MlifeApp.currentPage;
          pwin.MlifeApp.switchTab(current || 'home');
        }
      } catch (e) {
        console.warn('[悬浮球] 导航失败:', e);
      }

      // 7. 确保 flex 布局
      ensureFlexLayout(appEl);

      // 8. 球状态
      ball.style.transform = 'scale(1.1)';
      ball.style.boxShadow = '0 6px 24px rgba(255,107,157,0.55)';
    } else {
      appEl.style.display = 'none';
      ball.style.transform = '';
      ball.style.boxShadow = '';
    }
  }

  // ========== 构建 DOM ==========
  function buildUI() {
    // 悬浮球
    ball = pdoc.createElement('div');
    ball.id = ID;
    ball.textContent = '💎';
    ball.style.left = pos.x + 'px';
    ball.style.top = pos.y + 'px';
    ball.title = '打开/关闭 M-life';
    pdoc.body.appendChild(ball);

    // 同步浮层关闭按钮状态
    function watchCloseBtn() {
      var closeBtn = pdoc.getElementById('mlife-app-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function () {
          isOpen = false;
          if (ball) {
            ball.style.transform = '';
            ball.style.boxShadow = '';
          }
        });
      }
    }

    // ---- 点击：切换浮层 ----
    ball.addEventListener('click', function (e) {
      if (moved) {
        moved = false;
        return;
      }
      e.stopPropagation();
      watchCloseBtn();
      toggleApp();
    });

    // ---- 鼠标拖拽 ----
    ball.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      startDrag(e.clientX, e.clientY);
    });
    pdoc.addEventListener('mousemove', function (e) { moveDrag(e.clientX, e.clientY); });
    pdoc.addEventListener('mouseup', function () { if (drag) endDrag(); });

    // ---- 触摸拖拽 ----
    ball.addEventListener('touchstart', function (e) {
      var t = e.touches[0];
      startDrag(t.clientX, t.clientY);
    }, { passive: true });
    pdoc.addEventListener('touchmove', function (e) {
      if (!drag) return;
      var t = e.touches[0];
      moveDrag(t.clientX, t.clientY);
      e.preventDefault();
    }, { passive: false });
    pdoc.addEventListener('touchend', function () { if (drag) endDrag(); });
    pdoc.addEventListener('touchcancel', function () { if (drag) endDrag(); });
  }

  // ========== 初始化 ==========
  function init() {
    if (pdoc.getElementById(ID)) return;

    injectStyles();
    buildUI();

    // 窗口缩放时保持球在视口内
    pwin.addEventListener('resize', function () {
      if (!ball) return;
      var maxX = pwin.innerWidth - 60;
      var maxY = pwin.innerHeight - 60;
      ball.style.left = Math.min(parseInt(ball.style.left) || 0, maxX) + 'px';
      ball.style.top = Math.min(parseInt(ball.style.top) || 0, maxY) + 'px';
    });
  }

  // ---------- 自动启动 ----------
  function autoBoot() {
    if (pdoc.getElementById(ID)) return;
    init();
  }

  if (pdoc.readyState === 'loading') {
    pdoc.addEventListener('DOMContentLoaded', autoBoot);
  } else {
    autoBoot();
  }

  // 暴露给外部
  pwin.MlifeFloatBall = {
    toggle: toggleApp,
    close: function () { if (isOpen) toggleApp(); },
    open: function () { if (!isOpen) toggleApp(); },
    refresh: function () { toast('状态已刷新'); },
    setTheme: function (t) { if (t === 'light' || t === 'dark') { currentTheme = t; saveTheme(t); applyTheme(t); } },
  };

})();



// [4] Auto-init MlifeApp
setTimeout(function() {
  try {
    if (typeof MlifeApp !== "undefined" && typeof MlifeApp.init === "function") {
      MlifeApp.init();
      console.log("[Mlife] Auto-init complete");
    }
  } catch(e) {
    console.warn("[Mlife] Auto-init error:", e);
  }
}, 800);

// [4] Auto-init
setTimeout(function() {
  try {
    if (typeof MlifeApp !== "undefined" && typeof MlifeApp.init === "function") {
      if (typeof waitGlobalInitialized === "function") {
        waitGlobalInitialized("Mvu").then(function() { MlifeApp.init(); });
      } else {
        MlifeApp.init();
      }
      console.log("[Mlife] All-in-One boot complete");
    }
  } catch(e) {
    console.warn("[Mlife] boot error:", e);
  }
}, 800);

})();