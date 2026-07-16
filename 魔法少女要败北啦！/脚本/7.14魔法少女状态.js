(function () {
    'use strict';
    // 是否把正文里的行内插图从流式第一帧起隐藏（true=隐藏并收进「角色」页立绘框；false=保留正文显示）
    var HIDE_INLINE_IMG = true;
    // ════════════════════════════════════════════════════════════
    //  魔法少女状态栏 · 星河版  (魔法少女状态面板 + GM控制台)
    //  数据源：星河璀璨数据库 (window.AutoCardUpdaterAPI)
    //  主题：浅紫蓝 · 雅致魔幻（参照用户提供的状态栏配色）
    // ════════════════════════════════════════════════════════════

    var W;
    try { W = (window.parent && window.parent.document) ? window.parent : window; } catch (e) { W = window; }
    var D = W.document;
    var MO = W.MutationObserver || MutationObserver;
    var EV = W.Event || Event;

    try { if (W.__XYSB_CLEANUP__) W.__XYSB_CLEANUP__(); } catch (e) {}

    // ──────────────────────────── 工具函数 ────────────────────────────
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function num(v, d) {
        var m = String(v == null ? '' : v).match(/-?\d+(\.\d+)?/);
        if (!m) return (d === undefined ? 0 : d);
        return Math.round(parseFloat(m[0]));
    }
    function pair(v, defMax) {
        var s = String(v == null ? '' : v);
        var m = s.match(/(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)/);
        if (m) return [Math.round(parseFloat(m[1])), Math.round(parseFloat(m[2]))];
        var n = num(s, null);
        return [n == null ? 0 : n, defMax || 100];
    }
    function pct(cur, max) {
        if (!max || max <= 0) max = 100;
        var p = Math.round(cur / max * 100);
        return Math.max(0, Math.min(100, p));
    }
    function getDB() {
        try { return W.AutoCardUpdaterAPI || window.AutoCardUpdaterAPI || null; } catch (e) { return null; }
    }
    function lsGet(k, d) { try { var v = W.localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
    function lsSet(k, v) { try { W.localStorage.setItem(k, v); } catch (e) {} }

    // ──────────────── 世界规则（常驻 GM 指令）·持久化 + 注入 ────────────────
    var RULE_KEY = 'xysb_world_rules';
    var RULE_AUTO_KEY = 'xysb_world_rules_auto';
    var RULE_MARK_A = '【最高权限·常驻GM规则 — 凌驾一切】';
    var RULE_MARK_B = '【以上为不可违抗之最高令 — 常驻GM规则·终】';
    var RULE_PREAMBLE = '下列规则是本世界的最高指令，效力高于一切——高于世界书、角色卡、系统设定、世界观背景、过往剧情，以及任何"合理性/逻辑/惯例"。它们是绝对、强制、不可协商的前提：必须逐条无条件、不打折扣地执行，绝不许违背、弱化、变通、规避，也绝不许借剧情、设定或常识把它扭转、淡化、架空、找补或解释掉。凡有任何设定或情节与之冲突，一律以本规则为唯一准绳，并主动改写冲突之处使其服从本规则。这是命令、不是建议：';
    function rulesLoad() { try { var s = lsGet(RULE_KEY, ''); if (!s) return []; var a = JSON.parse(s); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
    function rulesSave(a) { lsSet(RULE_KEY, JSON.stringify(a || [])); }
    function rulesActiveText() {
        var a = rulesLoad().filter(function (r) { return r && r.on !== false && String(r.text || '').trim(); });
        if (!a.length) return '';
        var lines = a.map(function (r, i) { return (i + 1) + '. ' + String(r.text).trim(); });
        return RULE_MARK_A + '\n' + RULE_PREAMBLE + '\n' + lines.join('\n') + '\n' + RULE_MARK_B;
    }
    var RULE_INJECT_ID = 'XYSB_WORLD_RULES';
    function xysbGetCtx() {
        try { if (W.SillyTavern && typeof W.SillyTavern.getContext === 'function') return W.SillyTavern.getContext(); } catch (e) {}
        try { if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) return SillyTavern.getContext(); } catch (e) {}
        return null;
    }
    // 静默注入：把启用中的规则注册为「扩展提示词」，每次生成自动附带、绝不作为聊天消息发出；关闭或无规则则清除。
    function rulesSyncInjection() {
        try {
            var on = lsGet(RULE_AUTO_KEY, '1') === '1';
            var block = on ? rulesActiveText() : '';
            var ctx = xysbGetCtx();
            if (ctx && typeof ctx.setExtensionPrompt === 'function') {
                var IN_CHAT = (ctx.extension_prompt_types && ctx.extension_prompt_types.IN_CHAT != null) ? ctx.extension_prompt_types.IN_CHAT : 1;
                var SYS = (ctx.extension_prompt_roles && ctx.extension_prompt_roles.SYSTEM != null) ? ctx.extension_prompt_roles.SYSTEM : 0;
                ctx.setExtensionPrompt(RULE_INJECT_ID, block || '', IN_CHAT, 0, false, SYS);
                return true;
            }
            var run = null;
            if (ctx && typeof ctx.executeSlashCommandsWithOptions === 'function') run = function (cmd) { return ctx.executeSlashCommandsWithOptions(cmd, { showOutput: false, handleParserErrors: true }); };
            else if (ctx && typeof ctx.executeSlashCommands === 'function') run = function (cmd) { return ctx.executeSlashCommands(cmd); };
            else if (typeof W.triggerSlash === 'function') run = function (cmd) { return W.triggerSlash(cmd); };
            else if (W.TavernHelper && typeof W.TavernHelper.triggerSlash === 'function') run = function (cmd) { return W.TavernHelper.triggerSlash(cmd); };
            if (run) {
                if (!block) run('/inject id=' + RULE_INJECT_ID + ' position=chat depth=0');
                else run('/inject id=' + RULE_INJECT_ID + ' position=chat depth=0 role=system scan=true ' + block.replace(/[\r\n]+/g, ' / '));
                return true;
            }
        } catch (e) {}
        return false;
    }
    function rulesPrependToTextarea(auto) {
        // 已改为静默注入：不再写入聊天输入框(#send_textarea)，改为注册扩展提示词——每轮生成自动生效、不发消息。
        var ok = rulesSyncInjection();
        if (!auto && W.toastr) { try { W.toastr[ok ? 'success' : 'warning'](ok ? '已更新常驻注入（静默·每轮自动生效）' : '未连到酒馆注入接口，请确认在 SillyTavern 中运行'); } catch (e) {} }
    }
    function installRuleSendHook() {
        try {
            if (W.__XYSB_RULEHOOK__) {
                D.removeEventListener('keydown', W.__XYSB_RULEHOOK__.kd, true);
                D.removeEventListener('click', W.__XYSB_RULEHOOK__.cl, true);
            }
        } catch (e) {}
        function kd(e) {
            try {
                var t = e.target; if (!t || t.id !== 'send_textarea') return;
                if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.isComposing) rulesPrependToTextarea(true);
            } catch (e2) {}
        }
        function cl(e) {
            try {
                var t = e.target; if (!t) return;
                var btn = (t.id === 'send_but') ? t : (t.closest ? t.closest('#send_but') : null);
                if (btn) rulesPrependToTextarea(true);
            } catch (e2) {}
        }
        W.__XYSB_RULEHOOK__ = null; /* 已停用「写入聊天框」注入，改为静默扩展提示词注入 */
    }

    // ──────────────────────────── 数据层 ────────────────────────────
    function readTables() {
        var api = getDB();
        if (!api || typeof api.exportTableAsJson !== 'function') return null;
        var json = null;
        try { json = api.exportTableAsJson(); } catch (e) { return null; }
        if (!json || typeof json !== 'object') return {};
        var t = {};
        for (var k in json) {
            var s = json[k];
            if (s && s.name && Array.isArray(s.content) && s.content.length) {
                t[s.name] = { headers: s.content[0] || [], rows: s.content.slice(1) };
            }
        }
        return t;
    }
    function findTable(tables, kw) {
        if (!tables) return null;
        if (tables[kw]) return tables[kw];
        for (var n in tables) { if (n.indexOf(kw) !== -1) return tables[n]; }
        return null;
    }
    function colOf(tb, kw) {
        if (!tb) return -1;
        for (var i = 0; i < tb.headers.length; i++) {
            if (String(tb.headers[i]).indexOf(kw) !== -1) return i;
        }
        return -1;
    }
    function cellOf(tb, row, kw, dflt) {
        var i = colOf(tb, kw);
        if (i < 0 || !row || row[i] == null) return dflt;
        var v = String(row[i]).trim();
        if (v === '' || v === 'null' || v === 'undefined') return dflt;
        return v;
    }
    // 依「形态/战服」文字判定当前是否已变身/已现形（区分魔法少女与魔人）。
    function xysbTransformed(form, attire, demon) {
        var f = (form && form !== '\u2014') ? String(form) : '';
        var a = (attire && attire !== '\u2014') ? String(attire) : '';
        var s = f + ' ' + a;
        // 明确「人形/未变身/便装」优先判为未变身
        if (/未变身|未现形|人形|伪装|化人|化形|日常|便装|便服|私服|常服|便衣|居家|睡衣|校服|素颜|平时|解除|卸下|收起/.test(s)) return false;
        // 明确「已变身/已现形」
        if (/已变身|已现形|现出原形|现形|变身/.test(f)) return true;
        if (demon) { return /本相|真身|兽形|兽身|原形|甲壳|魔装|现形/.test(s); }
        if (/战裙|战袍|战服|魔装|战姬|铠甲|战甲|武装|战斗形态|羽衣|圣装/.test(s)) return true;
        if (!a) return false;
        return !/原形|无衣冠|本体/.test(a);
    }
    function firstRow(tb) { return (tb && tb.rows && tb.rows.length) ? tb.rows[0] : null; }

    var RANKS = [
        { name: '见习', lo: 1, hi: 10 },
        { name: '正式', lo: 11, hi: 25 },
        { name: '精英', lo: 26, hi: 40 },
        { name: '战姬', lo: 41, hi: 55 },
        { name: '传奇', lo: 56, hi: 70 }
    ];
    // 魔人/魔物 · 深渊位格阶梯（数值曲线与魔法少女完全一致，仅称谓不同）
    var RANKS_DEMON = [
        { name: '孳生体', lo: 1, hi: 10 },
        { name: '蚀魂者', lo: 11, hi: 25 },
        { name: '化渊者', lo: 26, hi: 40 },
        { name: '噬星者', lo: 41, hi: 55 },
        { name: '渊厄', lo: 56, hi: 70 }
    ];
    function rankOfLevelIn(ladder, lv) {
        for (var i = 0; i < ladder.length; i++) { if (lv >= ladder[i].lo && lv <= ladder[i].hi) return ladder[i]; }
        if (lv > 0 && lv < ladder[0].lo) return ladder[0];
        return ladder[ladder.length - 1];
    }
    function rankOfLevel(lv) { return rankOfLevelIn(RANKS, lv); }
    // 依「阶级」文字判定走哪套阶梯：写了位格名→魔人阶梯；写了少女阶名→少女阶梯；都没写则用 roleDemon 兜底
    function pickLadder(rk, roleDemon) {
        rk = String(rk || '');
        for (var i = 0; i < RANKS_DEMON.length; i++) { if (rk.indexOf(RANKS_DEMON[i].name) !== -1) return RANKS_DEMON; }
        for (var j = 0; j < RANKS.length; j++) { if (rk.indexOf(RANKS[j].name) !== -1) return RANKS; }
        return roleDemon ? RANKS_DEMON : RANKS;
    }
    function levelInfo(rankRaw, lvRaw, roleDemon) {
        var rk = String(rankRaw == null ? '' : rankRaw).trim();
        var lv = num(lvRaw, null);
        var ladder = pickLadder(rk, roleDemon);
        var rankObj = null;
        for (var i = 0; i < ladder.length; i++) { if (rk.indexOf(ladder[i].name) !== -1) { rankObj = ladder[i]; break; } }
        if (!rankObj && lv != null) rankObj = rankOfLevelIn(ladder, lv);
        var name = rankObj ? rankObj.name : (rk || ladder[0].name);
        var label = name + (lv != null ? ' · Lv.' + lv : '');
        var n = rankObj ? ladder.indexOf(rankObj) : -1;
        return { n: n, name: name, lv: lv, label: label, demon: ladder === RANKS_DEMON };
    }
    function condTone(text, hp) {
        var s = String(text == null ? '' : text);
        if (/重伤|濒死|垂死|命悬|剧毒|被擒|被困|晶化|危/.test(s) || hp <= 25) return 'bad';
        if (/受伤|带伤|疲|虚弱|狼狈|紧绷|中毒|憔悴/.test(s) || hp <= 55) return 'warn';
        return 'ok';
    }

    // ──────────────────────────── 战区舆图 · 三层（战区 / 城市 / 内景）──────────
    //  · 融入主题：墨色全部用 currentColor（随面板亮/暗自动反色），仅
    //    当前=紫(CUR) / 去向=琥珀(DEST) 为重点色。
    //  · 无连线：点与点之间不画路网，方位以淡墨山/水/界缝表达。
    //  · 内景：进入建筑/据点/拘留区后，自动细化到 楼层·房号 / 隔离室·审讯室 / 院落。
    var CUR = '#8b6fe6';      // 当前 —— 紫
    var DEST = '#e0a93a';     // 去向 —— 琥珀
    var FFAM = 'Kaiti SC,KaiTi,STKaiti,楷体,serif';

    var ZONES = [
        { k: 'north',  name: '北部战区', kw: ['北部', '朔风', '烬炉', '玄冰', '铁幕', '暖炉', '锻雪', '白祭', '沸泉', '硫光', '凛冬', '雪原', '关墙堡'] },
        { k: 'west',   name: '西部战区', kw: ['西部', '玉门', '苍梧', '阳关', '金沙', '驼铃', '雅丹', '西垣', '千窟', '沙海', '月泉', '鸣沙', '烽燧', '驼客'] },
        { k: 'center', name: '神启都',   kw: ['核心圈', '神启都', '天阙', '琉璃', '月桂台', '白翼', '安澜里'] },
        { k: 'east',   name: '东部战区', kw: ['东部', '云山', '沧澜', '潮鸣关', '镜湖', '水门', '烟雨', '锦绣坊', '鲸落', '潮商', '雾汀', '灯塔', '听澜', '潮信', '铁闸'] },
        { k: 'south',  name: '南部战区', kw: ['南部', '锦官', '南屿', '苇泽', '蜀锦', '雾巷', '芙蓉', '南署', '珊瑚环', '夜枭', '椰荫', '蔓星', '瘴泽', '高脚'] },
        { k: 'abyss',  name: '深渊废土', kw: ['深渊', '废土', '锈蚀', '哀嚎', '血月祭坛', '寂静回廊', '边缘集落', '裂谷', '血月'] }
    ];
    function h32(str) {
        var h = 2166136261;
        for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 16777619) >>> 0; }
        return h;
    }
    function makeRng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
    function classifyZone(s) {
        s = String(s == null ? '' : s);
        for (var i = 0; i < ZONES.length; i++) { var z = ZONES[i]; for (var j = 0; j < z.kw.length; j++) { if (s.indexOf(z.kw[j]) !== -1) return z; } }
        return null;
    }
    function ink(op) { return 'fill="currentColor" opacity="' + op + '"'; }
    function inkS(op, w) { return 'fill="none" stroke="currentColor" stroke-width="' + (w || 1) + '" opacity="' + op + '"'; }

    // ===== 地点定位解析（域·地·内景） =====
    var LOCSEP = /[·•・\/>]/;
    var PLACESUF = /(战区|城|关|垒|都|山|澜|屿|门|梧|风|港|镇|集|废土|旧城|裂谷)$/;
    var KNOWN_PLACES = {
        '云山': ['镜湖政务区', '水门商埠', '烟雨长堤', '锦绣坊', '旧仓巷'],
        '沧澜': ['鲸落港', '潮商大街', '雾汀渔坊', '灯塔哨区'],
        '潮鸣关': ['听澜学院', '潮信历练场', '铁闸市'],
        '锦官城': ['蜀锦大市', '雾巷', '芙蓉别苑', '南署区'],
        '南屿': ['珊瑚环市', '夜枭街', '椰荫澳'],
        '苇泽关': ['蔓星学院', '瘴泽历练场', '高脚市'],
        '玉门': ['金沙集', '驼铃道', '雅丹堡', '西垣署'],
        '苍梧': ['千窟坊', '沙海书院', '月泉绿洲'],
        '阳关垒': ['鸣沙学院', '烽燧历练场', '驼客栈区'],
        '朔风': ['铁幕大营', '暖炉巷', '锻雪工坊', '白祭场'],
        '烬炉城': ['沸泉环', '硫光市'],
        '玄冰关': ['凛冬学院', '雪原猎区', '关墙堡市'],
        '神启都': ['天阙中枢', '琉璃金融环', '月桂台', '白翼疗养园', '安澜里'],
        '锈蚀旧城': ['哀嚎裂谷', '血月祭坛', '寂静回廊', '边缘集落']
    };
    function parseXYLoc(loc) {
        var segs = String(loc == null ? '' : loc).split(LOCSEP).map(function (s) { return s.trim(); }).filter(Boolean);
        var domain = segs[0] || '', place = '', spot = '', ki = -1;
        for (var i = segs.length - 1; i >= 1; i--) { if (KNOWN_PLACES[segs[i]]) { ki = i; break; } }
        if (ki < 0) { for (var j = 1; j < segs.length; j++) { if (PLACESUF.test(segs[j])) { ki = j; break; } } }
        if (ki >= 1) { place = segs[ki]; spot = segs.slice(ki + 1).join('·'); }
        else if (segs.length >= 2) { place = segs[segs.length - 1]; spot = ''; }
        if (place === domain) place = '';
        return { domain: domain, place: place, spot: spot, segs: segs };
    }
    var XAREA_SECT = ['学院区', '历练场', '演武场', '驻地', '哨塔', '补给站', '研究院', '隔离区', '后勤区', '关墙'];
    var XAREA_CITY = ['商业街', '中央广场', '政务区', '老城巷', '滨河道', '集市', '公寓区', '咖啡街', '车站', '异事局'];
    var XAREA_SEA = ['港区', '码头', '渔市', '灯塔哨', '环礁滩', '潮间带'];
    function genXYAreas(place, n) {
        var rng = makeRng(h32('城区·' + place)), pool;
        if (/海|岛|屿|港|潮|澜|渔/.test(place)) pool = XAREA_SEA.slice();
        else if (/关|垒|学院|营|哨|历练|演武/.test(place)) pool = XAREA_SECT.slice();
        else pool = XAREA_CITY.slice();
        for (var i = pool.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
        return pool.slice(0, Math.max(1, Math.min(n, pool.length)));
    }
    function areaOfXY(area, place) {
        var segs = String(area == null ? '' : area).split(LOCSEP).map(function (s) { return s.trim(); }).filter(Boolean);
        if (!segs.length) return '';
        var idx = segs.indexOf(place);
        if (idx >= 0 && segs[idx + 1]) return segs[idx + 1];
        var last = segs[segs.length - 1];
        if (last && last !== place) return last;
        return '';
    }
    function placeAreas(place, pois) {
        var base = KNOWN_PLACES[place] ? KNOWN_PLACES[place].slice() : [];
        var seen = {}; base.forEach(function (a) { seen[a] = 1; });
        var derived = [];
        (pois || []).forEach(function (p) { var a = areaOfXY(p.area || '', place); if (a && !seen[a]) { seen[a] = 1; derived.push(a); } });
        var areas = base.concat(derived);
        if (!areas.length) areas = genXYAreas(place, 5);
        else if (areas.length < 4) { var gen = genXYAreas(place, 6); for (var i = 0; i < gen.length && areas.length < 4; i++) { if (!seen[gen[i]]) { seen[gen[i]] = 1; areas.push(gen[i]); } } }
        return areas.slice(0, 6);
    }
    function placeArchetype(place, domain) {
        var P = place || '', D = domain || '';
        var KA = { '沧澜': 'sea', '南屿': 'sea', '潮鸣关': 'sea', '云山': 'mountain', '玄冰关': 'mountain', '凛冬': 'mountain', '烬炉城': 'valley', '苍梧': 'valley', '锦官城': 'city', '玉门': 'city', '神启都': 'palace', '朔风': 'city', '锈蚀旧城': 'city' };
        var base = KA[P];
        if (!base) {
            if (/海|岛|屿|港|潮|澜|渔|滨/.test(P)) base = 'sea';
            else if (/谷|裂谷|泉|窟|洞|潭|炉/.test(P)) base = 'valley';
            else if (/都|阙|中枢|宫/.test(P)) base = 'palace';
            else if (/城|镇|关|垒|集|市|坊|门/.test(P)) base = 'city';
            else base = 'mountain';
        }
        var mod = 'normal';
        if (/北部战区/.test(D) || /雪|寒|冰|霜|冬|朔/.test(P)) mod = 'snow';
        else if (/深渊废土/.test(D) || /锈|蚀|血月|哀嚎|寂静|废/.test(P)) mod = 'demon';
        return { base: base, mod: mod };
    }
    function inferIcon(name, type) {
        var s = String(type || '') + ' ' + String(name || '');
        if (/会所|别苑|夜店|夜枭|花魁|俱乐部/.test(s)) return 'flower';
        if (/赌场|竞技场|博彩|游戏厅/.test(s)) return 'dice';
        if (/钱庄|金融|银行|交易所|金沙集/.test(s)) return 'coin';
        if (/医院|诊所|疗养|药|急救|白翼/.test(s)) return 'med';
        if (/咖啡|奶茶|茶肆|茶楼|甜品/.test(s)) return 'tea';
        if (/酒吧|餐厅|食肆|居酒|客栈|旅馆|栈/.test(s)) return 'inn';
        if (/学院|书院|图书|档案|藏经|藏书/.test(s)) return 'book';
        if (/研究院|工坊|实验|锻|铸|制药/.test(s)) return 'pill';
        if (/历练场|演武|训练|演练|靶场|猎区/.test(s)) return 'train';
        if (/裂隙|拘留|隔离|封印|禁地|看守|收容|牢/.test(s)) return 'lock';
        if (/码头|港|渡口|船坞|渡/.test(s)) return 'boat';
        if (/湖|泉|池|湾|绿洲|滨|潭/.test(s)) return 'water';
        if (/峰|山|岭|崖|雪原|裂谷/.test(s)) return 'peak';
        if (/商埠|百货|市集|商街|集市|大市|坊|市|商城/.test(s)) return 'market';
        if (/祭坛|碑|庙宇|祠|神社|道观|观/.test(s)) return 'shrine';
        if (/关|垒|门楼|关墙|城门/.test(s)) return 'gate';
        if (/异事局|分局|官署|衙|政务|总部|大营|署/.test(s)) return 'gov';
        if (/公寓|宿舍|住宅|楼|院|苑|台|殿|堂|阁|轩|斋/.test(s)) return 'hall';
        return 'dot';
    }
    function iconPath(k) {
        switch (k) {
            case 'hall': return '<path d="M-6 -1 L0 -6 L6 -1"/><path d="M-4 -1 L-4 5 L4 5 L4 -1"/><path d="M-6 5 L6 5"/>';
            case 'gate': return '<path d="M-5 5 L-5 -2 M5 5 L5 -2 M-6.5 -2 L6.5 -2 M-2.5 -2 L-2.5 1 M2.5 -2 L2.5 1"/>';
            case 'peak': return '<path d="M-6 5 L-1.5 -5 L1 0 L3 -3 L6 5 Z"/>';
            case 'market': return '<path d="M-5 -3 L5 -3 L4 0 L-4 0 Z M-4 0 L-4 5 M4 0 L4 5 M-4 5 L4 5"/>';
            case 'train': return '<path d="M-5 -5 L5 5 M5 -5 L-5 5"/>';
            case 'book': return '<path d="M0 -4 L-5 -4 L-5 4 L0 5 Z M0 -4 L5 -4 L5 4 L0 5 M0 -4 L0 5"/>';
            case 'pill': return '<rect x="-5" y="-2.7" width="10" height="5.4" rx="2.7"/><path d="M0 -2.7 L0 2.7"/>';
            case 'med': return '<path d="M-4 0 L4 0 L2.8 5 L-2.8 5 Z M0 0 L0 -3 M-2 -3 L2 -3"/>';
            case 'inn': return '<path d="M-4 -3 L4 -3 L3 3 L-3 3 Z M4 -2 A2 2 0 0 1 4 2 M0 3 L0 5 M-2.4 5 L2.4 5"/>';
            case 'tea': return '<path d="M-4 -2 L4 -2 L3 3 L-3 3 Z M4 -1 A1.7 1.7 0 0 1 4 2.4 M-5 5 L5 5 M0 -2 L0 -5"/>';
            case 'dice': return '<rect x="-4.5" y="-4.5" width="9" height="9" rx="1.6"/><circle cx="-2" cy="-2" r="0.9"/><circle cx="2.2" cy="2.2" r="0.9"/><circle cx="2.2" cy="-2" r="0.9"/>';
            case 'coin': return '<circle cx="0" cy="0" r="5"/><rect x="-1.7" y="-1.7" width="3.4" height="3.4"/>';
            case 'lock': return '<rect x="-4" y="0" width="8" height="6" rx="1"/><path d="M-2.3 0 L-2.3 -2 A2.3 2.3 0 0 1 2.3 -2 L2.3 0"/>';
            case 'boat': return '<path d="M-6 1 Q0 6 6 1 Z"/><path d="M0 1 L0 -6 M0 -6 L4.6 -1.6 L0 -1.6"/>';
            case 'water': return '<path d="M0 -5 C3.6 -1 4 2.6 0 5 C-4 2.6 -3.6 -1 0 -5 Z"/>';
            case 'shrine': return '<path d="M-6 -2 L6 -2 M-5 -2 L-5 -3.6 L5 -3.6 L5 -2 M-4 -2 L-4 5 M4 -2 L4 5 M-4 5 L4 5"/>';
            case 'gov': return '<path d="M-5 5 L-5 -1 L0 -5 L5 -1 L5 5 Z M-2.5 5 L-2.5 1 L2.5 1 L2.5 5"/>';
            default: return '';
        }
    }
    function scatterN(n, bb, seedStr) {
        var rng = makeRng(h32(seedStr)), W = bb.x1 - bb.x0, H = bb.y1 - bb.y0;
        var minD = Math.max(70, Math.min(130, Math.sqrt(W * H / Math.max(1, n)) * 0.94));
        var pts = [], tries = 0, cap = n * 140;
        while (pts.length < n && tries < cap) {
            var x = bb.x0 + W * rng(), y = bb.y0 + H * rng(), ok = true;
            for (var i = 0; i < pts.length; i++) { var dx = pts[i][0] - x, dy = pts[i][1] - y; if (dx * dx + dy * dy < minD * minD) { ok = false; break; } }
            if (ok) pts.push([x, y]); tries++;
        }
        if (pts.length < n) {
            var cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols), k = 0; pts = [];
            for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) { if (k >= n) break; pts.push([bb.x0 + W * ((c + 0.5) / cols) + (rng() * 2 - 1) * W * 0.05, bb.y0 + H * ((r + 0.5) / rows) + (rng() * 2 - 1) * H * 0.05]); k++; }
        }
        return pts;
    }

    // ════════════ 一层 · 战区 ════════════
    var _XG = null;
    function xyGeom() {
        if (_XG) return _XG;
        var N = { TL:[28,38], TR:[472,40], R1:[486,100], R2:[486,206], BR:[468,268], BL:[30,270], L2:[16,206], L1:[16,100], XTL:[190,100], XTR:[322,100], XBL:[190,204], XBR:[322,204] };
        function wig(a, b, n, amp, rng) {
            var out = [], dx = b[0]-a[0], dy = b[1]-a[1], L = Math.sqrt(dx*dx+dy*dy) || 1, nx = -dy/L, ny = dx/L, prev = 0;
            for (var i = 1; i < n; i++) { var t = i/n, mx = a[0]+dx*t, my = a[1]+dy*t, off = (rng()*2-1)*amp; off = (off+prev)/2 + (rng()*2-1)*amp*0.55; prev = off; out.push([+(mx+nx*off).toFixed(1), +(my+ny*off).toFixed(1)]); }
            return out;
        }
        function rev(a){ return a.slice().reverse(); }
        var rcoast = (function(){ var s=305419896>>>0; return function(){ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; })();
        var rseam  = (function(){ var s=2891336453>>>0; return function(){ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; })();
        var e_top=wig(N.TL,N.TR,9,11,rcoast), e_ur=wig(N.TR,N.R1,4,9,rcoast), e_right=wig(N.R1,N.R2,7,12,rcoast), e_lr=wig(N.R2,N.BR,4,9,rcoast), e_bot=wig(N.BR,N.BL,9,11,rcoast), e_ll=wig(N.BL,N.L2,4,9,rcoast), e_left=wig(N.L2,N.L1,7,12,rcoast), e_ul=wig(N.L1,N.TL,4,9,rcoast);
        var ts_L=wig(N.L1,N.XTL,4,8,rseam), ts_C=wig(N.XTL,N.XTR,6,9,rseam), ts_R=wig(N.XTR,N.R1,4,8,rseam), bs_L=wig(N.L2,N.XBL,4,8,rseam), bs_C=wig(N.XBL,N.XBR,6,9,rseam), bs_R=wig(N.XBR,N.R2,4,8,rseam), vs_L=wig(N.XTL,N.XBL,5,7,rseam), vs_R=wig(N.XTR,N.XBR,5,7,rseam);
        function seq(){ var a=[]; for(var i=0;i<arguments.length;i++){ var x=arguments[i]; if(x && x[0]!=null && typeof x[0]==='number'){ a.push(x); } else { a=a.concat(x); } } return a; }
        var poly = {
            north:  seq(N.TL,e_top,N.TR,e_ur,N.R1,rev(ts_R),N.XTR,rev(ts_C),N.XTL,rev(ts_L),N.L1,e_ul),
            center: seq(N.XTL,ts_C,N.XTR,vs_R,N.XBR,rev(bs_C),N.XBL,rev(vs_L)),
            west:   seq(N.L1,ts_L,N.XTL,vs_L,N.XBL,rev(bs_L),N.L2,e_left),
            east:   seq(N.XTR,ts_R,N.R1,e_right,N.R2,rev(bs_R),N.XBR,rev(vs_R)),
            south:  seq(N.L2,bs_L,N.XBL,bs_C,N.XBR,bs_R,N.R2,e_lr,N.BR,e_bot,N.BL,e_ll)
        };
        var coast = seq(N.TL,e_top,N.TR,e_ur,N.R1,e_right,N.R2,e_lr,N.BR,e_bot,N.BL,e_ll,N.L2,e_left,N.L1,e_ul);
        function pathOf(pts){ var d='M'+pts[0][0]+' '+pts[0][1]; for(var i=1;i<pts.length;i++) d+=' L'+pts[i][0]+' '+pts[i][1]; return d+' Z'; }
        function lineOf(pts){ var d='M'+pts[0][0]+' '+pts[0][1]; for(var i=1;i<pts.length;i++) d+=' L'+pts[i][0]+' '+pts[i][1]; return d; }
        var seamLines = { ts: seq(N.L1,ts_L,N.XTL,ts_C,N.XTR,ts_R,N.R1), bs: seq(N.L2,bs_L,N.XBL,bs_C,N.XBR,bs_R,N.R2), vsL: seq(N.XTL,vs_L,N.XBL), vsR: seq(N.XTR,vs_R,N.XBR) };
        var label = { north:[44,40], west:[30,122], center:[202,122], east:[336,122], south:[44,266] };
        var slots = {
            north:  [[96,66],[176,60],[256,68],[336,60],[416,66]],
            south:  [[96,244],[176,250],[256,242],[336,250],[416,244]],
            west:   [[64,150],[128,168],[72,190],[150,150]],
            center: [[232,150],[292,156],[300,184],[236,186]],
            east:   [[372,150],[440,158],[376,186],[446,186]]
        };
        var feature = { north:{name:'玄冰关',xy:[262,72]}, west:{name:'阳关垒',xy:[104,128]}, center:{name:'天阙中枢',xy:[256,128]}, east:{name:'潮鸣关',xy:[404,128]}, south:{name:'苇泽关',xy:[256,224]} };
        _XG = { poly:poly, coast:coast, seamLines:seamLines, label:label, slots:slots, feature:feature, pathOf:pathOf, lineOf:lineOf, N:N };
        return _XG;
    }
    function xyBuildDomainSvg(byZone, curZone, curLoc) {
        var g = xyGeom(), order = ['north','west','center','east','south'];
        var s = '<svg viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg">';
        s += '<defs><filter id="xyrift" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.4"/></filter></defs>';
        // 海域底（极淡）
        s += '<rect x="0" y="0" width="500" height="300" rx="12" ' + ink(0.035) + '/>';
        // 大陆
        s += '<path d="'+g.pathOf(g.coast)+'" ' + ink(0.05) + '/>';
        // 各域填色 / 描边
        for (var z=0;z<order.length;z++){ var k=order[z], isCur = curZone && curZone.k===k;
            s += '<path d="'+g.pathOf(g.poly[k])+'" fill="'+(isCur?CUR:'currentColor')+'" fill-opacity="'+(isCur?0.12:0.06)+'" stroke="'+(isCur?CUR:'currentColor')+'" stroke-opacity="'+(isCur?0.9:0.28)+'" stroke-width="'+(isCur?2:1)+'" stroke-linejoin="round"/>';
        }
        // 风物纹理（淡墨）
        function chev(cx,cy){ return '<path d="M'+(cx-6)+' '+cy+' L'+cx+' '+(cy-5)+' L'+(cx+6)+' '+cy+'" '+inkS(0.26,1.1)+' stroke-linecap="round"/>'; }
        s += chev(150,52)+chev(168,60)+chev(360,54)+chev(378,62);
        function hill(cx,cy){ return '<path d="M'+(cx-9)+' '+cy+' Q'+cx+' '+(cy-7)+' '+(cx+9)+' '+cy+'" '+inkS(0.26,1.1)+'/>'; }
        s += hill(150,252)+hill(168,256)+hill(356,252)+hill(374,256);
        function wave(x,y){ return '<path d="M'+x+' '+y+' q5 -3 10 0 t10 0" '+inkS(0.26,1.1)+' stroke-linecap="round"/>'; }
        s += wave(360,168)+wave(360,180)+wave(430,172)+wave(432,184);
        function crack(x,y){ return '<path d="M'+x+' '+y+' l6 4 l-3 5 l7 3" '+inkS(0.24,1)+' stroke-linecap="round"/>'; }
        s += crack(56,168)+crack(120,184)+'<ellipse cx="95" cy="150" rx="22" ry="11" ' + ink(0.06) + '/>';
        s += '<path d="M214 150 Q252 138 290 152 Q322 162 300 188" '+inkS(0.3,2)+' stroke-linecap="round"/>';
        // 界缝（中性淡墨虚线）
        var rifts = [g.seamLines.ts, g.seamLines.bs, g.seamLines.vsL, g.seamLines.vsR];
        for (var rr=0; rr<rifts.length; rr++){
            s += '<path d="'+g.lineOf(rifts[rr])+'" '+inkS(0.18,3)+' filter="url(#xyrift)"/>';
            s += '<path d="'+g.lineOf(rifts[rr])+'" '+inkS(0.38,1)+' stroke-dasharray="3 4"/>';
        }
        s += '<path d="'+g.pathOf(g.coast)+'" '+inkS(0.42,1.4)+'/>';
        // 深渊废土（底缘暗带 · 第6战区）
        var abCur = curZone && curZone.k === 'abyss';
        var abCol = abCur ? '#c0506a' : 'currentColor';
        s += '<path d="M0 300 L0 283 Q62 276 124 283 T248 283 T372 283 T500 283 L500 300 Z" fill="'+abCol+'" fill-opacity="'+(abCur?0.16:0.05)+'" stroke="'+abCol+'" stroke-opacity="'+(abCur?0.85:0.26)+'" stroke-width="'+(abCur?1.6:1)+'"/>';
        for (var ab=0; ab<7; ab++){ s += '<path d="M'+(34+ab*66)+' 290 l4 4 l-2 4 l5 3" fill="none" stroke="'+abCol+'" stroke-width="0.9" opacity="'+(abCur?0.5:0.22)+'" stroke-linecap="round"/>'; }
        if (abCur) s += '<circle cx="250" cy="288" r="7" fill="#c0506a" opacity="0.2" class="xysb-ping"/>';
        s += '<text x="250" y="295" text-anchor="middle" font-size="8.5" fill="'+abCol+'" opacity="'+(abCur?1:0.6)+'" letter-spacing="3" font-style="italic" font-family="'+FFAM+'">深 渊 废 土</text>';
        s += '<text x="322" y="158" text-anchor="middle" font-size="8" fill="currentColor" opacity="0.5" font-style="italic" font-family="'+FFAM+'">缓冲带</text>';
        // 区域名
        for (var z2=0;z2<order.length;z2++){ var k2=order[z2], lp=g.label[k2], cur2 = curZone && curZone.k===k2;
            s += '<text x="'+lp[0]+'" y="'+lp[1]+'" font-size="12.5" font-weight="700" letter-spacing="2.5" fill="'+(cur2?CUR:'currentColor')+'" opacity="'+(cur2?1:0.8)+'" font-family="'+FFAM+'">'+ZONES.filter(function(z){return z.k===k2;})[0].name+'</text>';
        }
        // 标志性地物（恒在）
        for (var k3 in g.feature){ var ft=g.feature[k3];
            s += '<path d="M'+(ft.xy[0]-3)+' '+ft.xy[1]+' L'+ft.xy[0]+' '+(ft.xy[1]-3.4)+' L'+(ft.xy[0]+3)+' '+ft.xy[1]+' L'+ft.xy[0]+' '+(ft.xy[1]+3.4)+' Z" '+inkS(0.5,1)+'/>';
            s += '<text x="'+ft.xy[0]+'" y="'+(ft.xy[1]+12)+'" text-anchor="middle" font-size="8" fill="currentColor" opacity="0.52" font-family="'+FFAM+'">'+esc(ft.name)+'</text>';
        }
        // 动态 POI（淡墨点）
        var pin = null;
        for (var z3=0;z3<order.length;z3++){ var k4=order[z3], slotsK = g.slots[k4], list = (byZone[k4]||[]).slice();
            list.sort(function(a,b){ return (b.inLoc?1:0)-(a.inLoc?1:0); });
            list = list.slice(0, slotsK.length);
            var used = {};
            for (var p=0;p<list.length;p++){ var po=list[p], idx = h32(po.name) % slotsK.length, tries=0;
                while (used[idx] && tries<slotsK.length){ idx=(idx+1)%slotsK.length; tries++; }
                used[idx]=true; var pt=slotsK[idx], label2 = po.name.length>5 ? po.name.slice(0,4)+'…' : po.name;
                s += '<circle cx="'+pt[0]+'" cy="'+(pt[1]-4)+'" r="2.6" fill="currentColor" opacity="0.55"/>';
                s += '<text x="'+pt[0]+'" y="'+(pt[1]+8)+'" text-anchor="middle" font-size="8.5" fill="currentColor" opacity="0.78" font-family="'+FFAM+'">'+esc(label2)+'</text>';
                if (po.inLoc && !pin) pin=[pt[0], pt[1]-4];
            }
            if (curZone && curZone.k===k4 && !pin){ var lp2=g.label[k4]; pin=[ (g.feature[k4]?g.feature[k4].xy[0]:lp2[0]+40), (g.feature[k4]?g.feature[k4].xy[1]:lp2[1]+20) ]; }
        }
        if (pin){
            s += '<circle cx="'+pin[0]+'" cy="'+pin[1]+'" r="8.5" fill="'+CUR+'" opacity="0.26" class="xysb-ping"/>';
            s += '<circle cx="'+pin[0]+'" cy="'+pin[1]+'" r="4.4" fill="'+CUR+'" stroke="#fff" stroke-width="1.4" stroke-opacity="0.85"/>';
        }
        s += '<g transform="translate(34,272)" opacity="0.55"><circle r="9" '+inkS(1,1)+'/><path d="M0 -7 L2.6 0 L0 7 L-2.6 0 Z" fill="currentColor"/><text y="-11" text-anchor="middle" font-size="7" fill="currentColor">北</text></g>';
        s += '</svg>';
        return s;
    }

    // ════════════ 二层 · 城市（城区内部；无连线，淡墨山水地标）════════════
    function markerSvgT(x, y, iconKey, label, kind) {
        var r = kind === 'cur' ? 13 : 11, s = '';
        if (kind === 'cur') s += '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+(r+6)+'" fill="'+CUR+'" opacity="0.16" class="xysb-ping"/>';
        var ringCol = kind === 'cur' ? CUR : (kind === 'dest' ? DEST : 'currentColor');
        var ringOp = kind === 'cur' ? 1 : (kind === 'dest' ? 1 : 0.42);
        // 牌底
        if (kind === 'cur') s += '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+r+'" fill="'+CUR+'"/>';
        else s += '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+r+'" fill="currentColor" fill-opacity="0.07"/>';
        s += '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+r+'" fill="none" stroke="'+ringCol+'" stroke-opacity="'+ringOp+'" stroke-width="'+(kind==='cur'?2:1.5)+'"/>';
        var glyph = kind === 'cur' ? '#fff' : (kind === 'dest' ? DEST : 'currentColor');
        var glyphOp = kind === 'cur' ? 0.92 : (kind === 'dest' ? 1 : 0.72);
        if (iconKey === 'dot') s += '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="2.8" fill="'+glyph+'" opacity="'+glyphOp+'"/>';
        else if (iconKey === 'flower') s += '<g transform="translate('+x.toFixed(1)+','+y.toFixed(1)+') scale(0.82)" fill="'+glyph+'" opacity="'+glyphOp+'"><circle cx="0" cy="-3.4" r="1.9"/><circle cx="3.2" cy="-1" r="1.9"/><circle cx="2" cy="3" r="1.9"/><circle cx="-2" cy="3" r="1.9"/><circle cx="-3.2" cy="-1" r="1.9"/><circle cx="0" cy="0" r="1.3"/></g>';
        else s += '<g transform="translate('+x.toFixed(1)+','+y.toFixed(1)+') scale(0.84)" fill="none" stroke="'+glyph+'" stroke-opacity="'+glyphOp+'" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'+iconPath(iconKey)+'</g>';
        if (kind === 'dest') s += '<g transform="translate('+(x+r-2).toFixed(1)+','+(y-r+1).toFixed(1)+')"><path d="M0 3 L0 -9" stroke="'+DEST+'" stroke-width="1.4"/><path d="M0 -9 L9 -6.5 L0 -3.5 Z" fill="'+DEST+'"/></g>';
        var lab = label.length > 7 ? (label.slice(0, 6) + '…') : label;
        var lcol = kind === 'cur' ? CUR : (kind === 'dest' ? DEST : 'currentColor');
        var lop = (kind === 'cur' || kind === 'dest') ? 1 : 0.85;
        var fw = (kind === 'cur' || kind === 'dest') ? '700' : '600';
        s += '<text x="'+x.toFixed(1)+'" y="'+(y+r+12).toFixed(1)+'" text-anchor="middle" font-size="10.5" font-weight="'+fw+'" letter-spacing="0.5" fill="'+lcol+'" opacity="'+lop+'" font-family="'+FFAM+'">'+(kind==='dest'?'去 ':'')+esc(lab)+'</text>';
        return s;
    }
    function xyBuildWardSvg(place, pois, curSpot, rawLoc, dest, domain) {
        if (!place) {
            var s0 = '<svg viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg">';
            s0 += '<rect width="500" height="300" rx="12" ' + ink(0.04) + '/>';
            s0 += '<text x="250" y="146" text-anchor="middle" font-size="14" fill="currentColor" opacity="0.55" font-family="'+FFAM+'">行踪未及具体城池</text>';
            s0 += '<text x="250" y="172" text-anchor="middle" font-size="10.5" fill="currentColor" opacity="0.4" font-family="'+FFAM+'">可切「战区」纵览全局</text>';
            s0 += '</svg>'; return s0;
        }
        pois = pois || [];
        var arch = placeArchetype(place, domain || ''), base = arch.base, mod = arch.mod;
        var areas = placeAreas(place, pois), seen = {}, points = [];
        function addPt(name, type) { if (!name) return -1; if (seen[name]) return -1; seen[name] = 1; points.push({ name: name, icon: inferIcon(name, type) }); return points.length - 1; }
        areas.forEach(function (a) { addPt(a, ''); });
        pois.forEach(function (p) { addPt(p.name, p.type); });
        var curName = String(curSpot || '');
        if (curName) {
            // 城市层只标到「内景的第一段」（建筑/街巷），更深的楼层房号留给内景层
            var curHead = curName.split('·')[0];
            var ci = -1; for (var i = 0; i < points.length; i++) { var pn = points[i].name; if (pn === curHead || pn.indexOf(curHead) !== -1 || curHead.indexOf(pn) !== -1) { ci = i; break; } }
            if (ci < 0) ci = addPt(curHead, '');
            if (ci >= 0) points[ci].cur = true;
        }
        var dp = parseXYLoc(dest || ''), destName = (dest && dp.place === place) ? (String(dp.spot || '').split('·')[0]) : '';
        if (destName) {
            var di2 = -1; for (var j = 0; j < points.length; j++) { var pj = points[j].name; if (pj === destName || pj.indexOf(destName) !== -1 || destName.indexOf(pj) !== -1) { di2 = j; break; } }
            if (di2 < 0) di2 = addPt(destName, '');
            if (di2 >= 0 && !points[di2].cur) points[di2].dest = true;
        }
        if (points.length > 9) {
            var keep = points.filter(function (p) { return p.cur || p.dest; });
            var rest = points.filter(function (p) { return !(p.cur || p.dest); }).slice(0, Math.max(0, 9 - keep.length));
            points = keep.concat(rest);
        }
        if (!points.length) points.push({ name: place, icon: inferIcon(place, ''), cur: true });

        var bb = { x0: 56, y0: 50, x1: 444, y1: 246 };
        var pos = scatterN(points.length, bb, '坊点·' + place);
        var cx = (bb.x0 + bb.x1) / 2, cy = (bb.y0 + bb.y1) / 2, curIdx = -1;
        for (var i2 = 0; i2 < points.length; i2++) { if (points[i2].cur) { curIdx = i2; break; } }
        if (curIdx >= 0) {
            var bestP = 0, bd = 1e9; for (var pi = 0; pi < pos.length; pi++) { var dx = pos[pi][0] - cx, dy = pos[pi][1] - cy, d = dx * dx + dy * dy; if (d < bd) { bd = d; bestP = pi; } }
            var tmp = pos[0]; pos[0] = pos[bestP]; pos[bestP] = tmp;
            var tp = points[0]; points[0] = points[curIdx]; points[curIdx] = tp;
        }

        var s = '<svg viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg">';
        s += '<defs><clipPath id="xyl-clip"><rect x="2" y="2" width="496" height="296" rx="12"/></clipPath></defs>';
        s += '<rect width="500" height="300" rx="12" ' + ink(0.04) + '/>';
        s += '<g clip-path="url(#xyl-clip)">';
        // —— 淡墨地形地标（替代连线：山、水、谷、轴）——
        var tr = makeRng(h32('地形·' + place));
        if (base === 'sea') {
            s += '<path d="M70 150 Q160 70 250 96 Q360 128 432 110 Q470 150 432 196 Q330 236 250 210 Q150 232 78 198 Q44 168 70 150 Z" '+ink(0.05)+'/>';
            for (var wi = 0; wi < 6; wi++) { var wx = 24 + tr() * 452, wy = 26 + tr() * 250; s += '<path d="M' + wx.toFixed(0) + ' ' + wy.toFixed(0) + ' q5 -4 10 0 q5 4 10 0" '+inkS(0.16,1.1)+'/>'; }
            s += '<text x="250" y="150" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.22" font-family="'+FFAM+'">沧 海</text>';
        } else if (base === 'mountain') {
            for (var pk = 0; pk < 3; pk++) { var px = 90 + pk * 160 + tr() * 30, py = 72; s += '<path d="M' + (px - 30) + ' ' + (py + 30) + ' L' + px + ' ' + (py - 18) + ' L' + (px + 30) + ' ' + (py + 30) + ' Z" '+ink(0.08)+'/>'; }
            s += '<path d="M30 235 Q150 205 250 222 T472 212" '+inkS(0.2,2)+' stroke-dasharray="2 6"/>';
            s += '<text x="250" y="60" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.22" font-family="'+FFAM+'">群 峰</text>';
        } else if (base === 'valley') {
            s += '<path d="M0 46 Q130 22 250 42 T500 40 L500 0 L0 0 Z" '+ink(0.06)+'/>';
            s += '<path d="M0 256 Q140 280 250 262 T500 262 L500 300 L0 300 Z" '+ink(0.06)+'/>';
            s += '<path d="M14 150 Q150 132 250 152 T486 150" '+inkS(0.2,3)+' stroke-linecap="round"/>';
            s += '<text x="250" y="150" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.2" font-family="'+FFAM+'">溪 涧</text>';
        } else if (base === 'palace') {
            s += '<line x1="250" y1="20" x2="250" y2="280" '+inkS(0.18,2)+' stroke-dasharray="3 6"/>';
        } else {
            var ry = 86 + tr() * 110;
            s += '<path d="M-8 ' + ry.toFixed(0) + ' C120 ' + (ry - 36 + tr() * 72).toFixed(0) + ', 320 ' + (ry + 46 - tr() * 80).toFixed(0) + ', 508 ' + (ry - 8).toFixed(0) + '" '+inkS(0.18,7)+' stroke-linecap="round"/>';
        }
        if (mod === 'demon' && base !== 'sea') { for (var em = 0; em < 5; em++) s += '<circle cx="' + (32 + tr() * 436).toFixed(0) + '" cy="' + (30 + tr() * 240).toFixed(0) + '" r="1.2" fill="currentColor" opacity="0.14"/>'; }
        else if (mod === 'snow') { for (var sn = 0; sn < 6; sn++) s += '<circle cx="' + (28 + tr() * 444).toFixed(0) + '" cy="' + (26 + tr() * 244).toFixed(0) + '" r="1.1" fill="currentColor" opacity="0.16"/>'; }

        // —— 地点标记（无连线）——
        for (var mi = 0; mi < points.length; mi++) { var pt = points[mi], kind = pt.cur ? 'cur' : (pt.dest ? 'dest' : ''); s += markerSvgT(pos[mi][0], pos[mi][1], pt.icon, pt.name, kind); }
        s += '</g>';
        s += '<rect x="2" y="2" width="496" height="296" rx="12" '+inkS(0.4,1.4)+' stroke-dasharray="4 5"/>';
        s += '<text x="491" y="291" text-anchor="end" font-size="9" fill="currentColor" opacity="0.5" letter-spacing="2" font-family="'+FFAM+'">' + esc(place) + ' · 城区图</text>';
        s += '<g transform="translate(476,26)" opacity="0.55"><path d="M0 -8 L3.4 6 L0 2.4 L-3.4 6 Z" fill="currentColor"/><text y="-10" text-anchor="middle" font-size="7" fill="currentColor">北</text></g>';
        s += '</svg>';
        return s;
    }

    // ════════════ 三层 · 细部（建筑/据点/牢狱内部）════════════
    var CN_NUM = { '零':0,'〇':0,'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10 };
    function cnNum(s) {
        s = String(s || ''); var m = s.match(/-?\d+/); if (m) return parseInt(m[0], 10);
        if (/^十/.test(s)) { var r = s.replace('十', ''); return 10 + (CN_NUM[r[0]] || 0); }
        var t = s.match(/(.)十(.)?/); if (t) return (CN_NUM[t[1]] || 1) * 10 + (t[2] ? (CN_NUM[t[2]] || 0) : 0);
        for (var k in CN_NUM) { if (s.indexOf(k) !== -1) return CN_NUM[k]; }
        return null;
    }
    var FLOOR_RE = /(楼|层)$/, ROOM_RE = /(房|间|室|榻|铺|号|舍|窝|窟|监|牢)$/;
    var PRISON_RE = /拘留|隔离|看守|收容|禁闭|审讯|封印室|牢|囚/;
    var INN_RE = /客栈|酒店|旅馆|公寓|宿舍|咖啡|奶茶|茶楼|餐厅|酒吧|商城|百货|学院楼|栈/;
    function resolveScene(P, destStr, typeByName) {
        var spot = P.spot || ''; if (!spot) return null;
        var segs = spot.split(LOCSEP).map(function (s) { return s.trim(); }).filter(Boolean); if (!segs.length) return null;
        var building = segs[0], deep = segs[segs.length - 1], whole = spot;
        var bType = (typeByName && typeByName[building]) || '';
        var kind = null;
        if (PRISON_RE.test(whole) || /拘留|隔离|收容|囚|牢/.test(bType)) kind = 'prison';
        else if (/[院府宅庭]/.test(whole)) kind = 'manor';
        else if (segs.some(function (x) { return FLOOR_RE.test(x); }) || ROOM_RE.test(deep) || INN_RE.test(building + ' ' + bType)) kind = 'building';
        else if (/[殿堂阁斋轩]/.test(whole) && segs.length >= 2) kind = 'manor';
        else return null;
        // 去向同建筑时的目标内景
        var dp = parseXYLoc(destStr || ''), destDeep = '';
        if (destStr && dp.place === P.place && dp.spot) { var ds = dp.spot.split('·'); if (ds[0] === building) destDeep = ds[ds.length - 1]; }
        return { kind: kind, building: building, segs: segs, deep: deep, place: P.place, dest: destDeep, type: bType, sig: kind + '|' + spot };
    }
    function frameWrap(inner, title) {
        var s = '<svg viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg">';
        s += '<rect width="500" height="300" rx="12" ' + ink(0.04) + '/>';
        s += inner;
        s += '<rect x="2" y="2" width="496" height="296" rx="12" ' + inkS(0.4, 1.4) + ' stroke-dasharray="4 5"/>';
        s += '<text x="491" y="291" text-anchor="end" font-size="9" fill="currentColor" opacity="0.5" letter-spacing="1.5" font-family="' + FFAM + '">' + esc(title) + '</text>';
        s += '</svg>';
        return s;
    }
    function roomCell(x, y, w, h, name, kind) {
        var s = '', isCur = kind === 'cur', isDest = kind === 'dest';
        var stroke = isCur ? CUR : (isDest ? DEST : 'currentColor'), sOp = isCur ? 1 : (isDest ? 1 : 0.4), sW = isCur ? 2 : 1.2;
        if (isCur) s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="3" fill="' + CUR + '" opacity="0.16"/>';
        s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="3" fill="' + (isCur ? CUR : 'currentColor') + '" fill-opacity="' + (isCur ? 0.14 : 0.05) + '" stroke="' + stroke + '" stroke-opacity="' + sOp + '" stroke-width="' + sW + '"/>';
        if (isCur) s += '<circle cx="' + (x + w / 2).toFixed(1) + '" cy="' + (y + h / 2 - 3).toFixed(1) + '" r="9" fill="' + CUR + '" opacity="0.18" class="xysb-ping"/>';
        var lcol = isCur ? CUR : (isDest ? DEST : 'currentColor'), lop = (isCur || isDest) ? 1 : 0.8;
        var lab = name.length > 5 ? name.slice(0, 4) + '…' : name;
        s += '<text x="' + (x + w / 2).toFixed(1) + '" y="' + (y + h / 2 + 4).toFixed(1) + '" text-anchor="middle" font-size="11" font-weight="' + (isCur ? 700 : 500) + '" fill="' + lcol + '" opacity="' + lop + '" font-family="' + FFAM + '">' + (isDest ? '去·' : '') + esc(lab) + '</text>';
        return s;
    }
    function matchName(a, b) { a = String(a || ''); b = String(b || ''); if (!a || !b) return false; return a === b || a.indexOf(b) !== -1 || b.indexOf(a) !== -1; }
    function buildFloors(sc) {
        var floorSeg = '', room = '';
        for (var i = 0; i < sc.segs.length; i++) { if (FLOOR_RE.test(sc.segs[i])) floorSeg = sc.segs[i]; }
        if (ROOM_RE.test(sc.deep)) room = sc.deep; else if (sc.deep !== sc.building && !FLOOR_RE.test(sc.deep)) room = sc.deep;
        var curFloor = floorSeg ? (cnNum(floorSeg) || 1) : 1;
        var nFloors = Math.max(2, Math.min(4, Math.max(curFloor, floorSeg ? curFloor : 3)));
        var isInn = INN_RE.test(sc.building + ' ' + sc.type);
        // 房间名池
        var roomPool = isInn ? ['天字房', '地字房', '玄字房', '黄字房', '雅间', '通铺'] : ['甲字房', '乙字房', '丙字房', '丁字房', '戊字房'];
        var rooms = [];
        if (room) rooms.push(room);
        for (var rp = 0; rp < roomPool.length && rooms.length < 5; rp++) { if (!matchName(roomPool[rp], room)) rooms.push(roomPool[rp]); }
        // 画
        var topY = 40, botY = 250, fh = (botY - topY) / nFloors, lx = 70, rx = 446, ww = rx - lx;
        var inner = '';
        // 屋檐
        inner += '<path d="M' + (lx - 16) + ' ' + topY + ' L258 ' + (topY - 22) + ' L' + (rx + 16) + ' ' + topY + ' Z" ' + ink(0.1) + '/>';
        inner += '<path d="M' + (lx - 16) + ' ' + topY + ' L258 ' + (topY - 22) + ' L' + (rx + 16) + ' ' + topY + ' Z" ' + inkS(0.3, 1.2) + '/>';
        // 楼层带（从上到下：顶楼在上）
        for (var f = 0; f < nFloors; f++) {
            var floorNo = nFloors - f, y = topY + f * fh, isCurF = floorNo === curFloor;
            inner += '<rect x="' + lx + '" y="' + y.toFixed(1) + '" width="' + ww + '" height="' + (fh - 4).toFixed(1) + '" rx="2" fill="' + (isCurF ? CUR : 'currentColor') + '" fill-opacity="' + (isCurF ? 0.05 : 0.03) + '" stroke="currentColor" stroke-opacity="' + (isCurF ? 0.34 : 0.22) + '" stroke-width="1"/>';
            inner += '<text x="' + (lx - 8) + '" y="' + (y + fh / 2).toFixed(1) + '" text-anchor="end" font-size="10" fill="' + (isCurF ? CUR : 'currentColor') + '" opacity="' + (isCurF ? 1 : 0.55) + '" font-family="' + FFAM + '">' + (floorNo === 1 ? '一楼' : (['', '一', '二', '三', '四', '五', '六'][floorNo] || floorNo) + '楼') + '</text>';
            if (isCurF) {
                // 当前层铺房间
                var n = rooms.length, gap = 8, cw = (ww - gap * (n + 1)) / n, ryy = y + 7, rhh = fh - 18;
                for (var ri = 0; ri < n; ri++) {
                    var rxx = lx + gap + ri * (cw + gap);
                    var rk = matchName(rooms[ri], room) && room ? 'cur' : (matchName(rooms[ri], sc.dest) && sc.dest ? 'dest' : '');
                    inner += roomCell(rxx, ryy, cw, rhh, rooms[ri], rk);
                }
                if (!room) inner += '<text x="258" y="' + (y + fh / 2 + 4).toFixed(1) + '" text-anchor="middle" font-size="10" fill="' + CUR + '" font-family="' + FFAM + '">（在此楼内）</text>';
            } else {
                // 其他层暗示隔间
                for (var di = 1; di <= 4; di++) { var dxx = lx + ww * di / 5; inner += '<line x1="' + dxx.toFixed(1) + '" y1="' + (y + 4).toFixed(1) + '" x2="' + dxx.toFixed(1) + '" y2="' + (y + fh - 8).toFixed(1) + '" ' + inkS(0.14, 1) + '/>'; }
            }
        }
        // 楼梯（右侧细线）
        inner += '<path d="M' + (rx - 2) + ' ' + (topY + 6) + ' L' + (rx - 2) + ' ' + (botY - 6) + '" ' + inkS(0.18, 1) + ' stroke-dasharray="3 3"/>';
        inner += '<text x="258" y="' + (topY - 8) + '" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor" opacity="0.6" letter-spacing="2" font-family="' + FFAM + '">' + esc(sc.building) + '</text>';
        return frameWrap(inner, sc.building + ' · 楼层图');
    }
    function buildPrison(sc) {
        // 找出当前囚室标识（甲/乙/丙… 或 一/二/三 号）
        var cur = sc.deep, place = sc.place;
        var facility = sc.building;
        for (var i = 0; i < sc.segs.length; i++) { if (PRISON_RE.test(sc.segs[i]) && !ROOM_RE.test(sc.segs[i])) facility = sc.segs[i]; }
        // 牢房池
        var marks = ['甲', '乙', '丙', '丁', '戊', '己'];
        var curMark = ''; for (var m = 0; m < marks.length; m++) { if (cur.indexOf(marks[m]) !== -1) { curMark = marks[m]; break; } }
        var cells = [];
        for (var c = 0; c < 5; c++) cells.push(marks[c] + '字隔离室');
        if (curMark) { /* 已在池中 */ } else if (ROOM_RE.test(cur) && cur !== facility) { cells[2] = cur; curMark = '__C2'; }
        // 画：上方一排牢房 + 走廊 + 下方功能间
        var inner = '';
        var topY = 50, ch = 78, cellN = 5, lx = 28, rx = 472, gap = 7, cw = (rx - lx - gap * (cellN + 1)) / cellN;
        inner += '<text x="250" y="36" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor" opacity="0.6" letter-spacing="2" font-family="' + FFAM + '">' + esc(facility) + '</text>';
        for (var ci = 0; ci < cellN; ci++) {
            var cxx = lx + gap + ci * (cw + gap);
            var nm = cells[ci];
            var isCur = (curMark && curMark !== '__C2' && nm.indexOf(curMark) === 0) || (curMark === '__C2' && ci === 2);
            var kind = isCur ? 'cur' : '';
            inner += roomCell(cxx, topY, cw, ch, nm, kind);
            // 铁栏（牢门）
            for (var b = 1; b <= 4; b++) { var bx = cxx + cw * b / 5; inner += '<line x1="' + bx.toFixed(1) + '" y1="' + (topY + ch - 16) + '" x2="' + bx.toFixed(1) + '" y2="' + (topY + ch) + '" stroke="' + (isCur ? CUR : 'currentColor') + '" stroke-opacity="' + (isCur ? 0.8 : 0.32) + '" stroke-width="1.4"/>'; }
        }
        // 走廊
        var corrY = topY + ch + 10;
        inner += '<rect x="' + lx + '" y="' + corrY + '" width="' + (rx - lx) + '" height="26" rx="3" ' + ink(0.045) + '/>';
        inner += '<text x="250" y="' + (corrY + 17) + '" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.45" letter-spacing="3" font-family="' + FFAM + '">甬 道</text>';
        // 功能间
        var fY = corrY + 36, fh2 = 250 - fY, fns = ['审讯室', '收容间', '隔离区入口'], fn = fns.length, fgap = 7, fw = (rx - lx - fgap * (fn + 1)) / fn;
        for (var fi = 0; fi < fn; fi++) { var fxx = lx + fgap + fi * (fw + fgap); inner += roomCell(fxx, fY, fw, fh2, fns[fi], ''); }
        return frameWrap(inner, facility + ' · 拘留区图');
    }
    function buildManor(sc) {
        var cur = sc.deep, court = sc.building;
        // 节点：门 → 前厅 → 正堂 → 后院；东西厢
        var axis = [];
        // 用 segs 里的有意义节点 + 通用补齐
        var named = sc.segs.slice(0).filter(function (x) { return x !== court || sc.segs.length === 1; });
        var pool = ['前厅', '正堂', '后院', '内宅'];
        var nodes = [];
        if (sc.segs.length >= 2) { for (var i = 1; i < sc.segs.length; i++) nodes.push(sc.segs[i]); }
        for (var p = 0; p < pool.length && nodes.length < 3; p++) { if (nodes.indexOf(pool[p]) < 0) nodes.push(pool[p]); }
        nodes = nodes.slice(0, 3);
        var inner = '';
        var midX = 250, topY = 46, bw = 150, bh = 50, vgap = 14;
        inner += '<text x="' + midX + '" y="36" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor" opacity="0.6" letter-spacing="2" font-family="' + FFAM + '">' + esc(court) + '</text>';
        // 中轴虚线
        inner += '<line x1="' + midX + '" y1="' + (topY - 4) + '" x2="' + midX + '" y2="262" ' + inkS(0.16, 1.5) + ' stroke-dasharray="3 6"/>';
        // 主轴院落（从上到下）
        var yy = topY;
        for (var ni = 0; ni < nodes.length; ni++) {
            var nm = nodes[ni], kind = matchName(nm, cur) ? 'cur' : (matchName(nm, sc.dest) && sc.dest ? 'dest' : '');
            inner += roomCell(midX - bw / 2, yy, bw, bh, nm, kind);
            yy += bh + vgap;
        }
        // 东西厢
        var wy = topY + 24, ww2 = 96, wh = 58;
        var east = '东厢', west = '西厢';
        var ekind = matchName(east, cur) ? 'cur' : (matchName(east, sc.dest) && sc.dest ? 'dest' : '');
        var wkind = matchName(west, cur) ? 'cur' : (matchName(west, sc.dest) && sc.dest ? 'dest' : '');
        inner += roomCell(28, wy, ww2, wh, west, wkind);
        inner += roomCell(472 - ww2, wy, ww2, wh, east, ekind);
        // 院门
        inner += '<rect x="' + (midX - 26) + '" y="262" width="52" height="0.1"/>';
        inner += '<path d="M' + (midX - 22) + ' 262 L' + (midX - 22) + ' 250 M' + (midX + 22) + ' 262 L' + (midX + 22) + ' 250 M' + (midX - 26) + ' 250 L' + (midX + 26) + ' 250" ' + inkS(0.4, 1.4) + '/>';
        inner += '<text x="' + midX + '" y="272" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.5" font-family="' + FFAM + '">院门</text>';
        // 若当前节点不在已画节点里，补一个高亮标注
        var drawn = nodes.concat([east, west]);
        var hit = false; for (var d = 0; d < drawn.length; d++) { if (matchName(drawn[d], cur)) { hit = true; break; } }
        if (!hit && cur && cur !== court) { inner += roomCell(midX - bw / 2, yy, bw, bh, cur, 'cur'); }
        return frameWrap(inner, court + ' · 院落图');
    }
    function xyBuildInteriorSvg(sc) {
        if (!sc) return '';
        if (sc.kind === 'prison') return buildPrison(sc);
        if (sc.kind === 'manor') return buildManor(sc);
        return buildFloors(sc);
    }

    // ════════════ 渲染入口 ════════════
    function renderMap(tables, locStr, destStr) {
        var loca = findTable(tables, '地点');
        var curZone = classifyZone(locStr);
        var byZone = {}, unknown = [], allPois = [], typeByName = {};
        ZONES.forEach(function (z) { byZone[z.k] = []; });
        if (loca && loca.rows.length) {
            loca.rows.forEach(function (r) {
                var nm = cellOf(loca, r, '地点名', ''); if (!nm) return;
                var area = cellOf(loca, r, '所在区域', ''), type = cellOf(loca, r, '类型', '');
                allPois.push({ name: nm, type: type, area: area }); typeByName[nm] = type;
                var z = classifyZone(area + ' ' + nm);
                if (z) byZone[z.k].push({ name: nm, type: type, inLoc: String(locStr || '').indexOf(nm) !== -1 });
                else unknown.push(nm);
            });
        }
        var wbox = $id('xysb-map'); if (wbox) wbox.innerHTML = xyBuildDomainSvg(byZone, curZone, locStr);
        var P = parseXYLoc(locStr);
        var localPois = allPois.filter(function (p) { return P.place && String(p.area || '').indexOf(P.place) !== -1; });
        var lbox = $id('xysb-local'); if (lbox) lbox.innerHTML = xyBuildWardSvg(P.place, localPois, P.spot, locStr, destStr, P.domain);
        var scene = resolveScene(P, destStr, typeByName);
        var dbox = $id('xysb-detail'); if (dbox) dbox.innerHTML = scene ? xyBuildInteriorSvg(scene) : '';
        var crumb = $id('xysb-crumb');
        if (crumb) {
            var segs = String(locStr || '').split(/[·•・]/).map(function (s) { return s.trim(); }).filter(Boolean);
            crumb.innerHTML = segs.length ? segs.map(function (s, i) { return '<span class="seg' + (i === segs.length - 1 ? ' here' : '') + '">' + esc(s) + '</span>'; }).join('<span class="sep">›</span>') : '<span class="seg">—</span>';
        }
        var unk = $id('xysb-unk');
        if (unk) { if (unknown.length) { unk.style.display = ''; unk.textContent = '未归档地点（区域信息不足）：' + unknown.slice(0, 8).join('、'); } else unk.style.display = 'none'; }
        // 自动停在能识别到的最细一层；移动到新场景才跳层，否则尊重手动切换
        if (typeof setMapView === 'function') setMapView(null, { world: true, local: !!P.place, detail: !!scene }, String(locStr || '') + '¦' + (scene ? scene.sig : ''));
    }


    // ──────────────────────────── 样式（浅紫蓝 · 雅致） ────────────────────────────
    var CSS = `
#xysb-root{width:100%;box-sizing:border-box;font-family:'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;font-size:12.5px;line-height:1.55;color:#3a3f63;margin-top:10px;text-align:left;container-type:inline-size;container-name:xysb;}
#xysb-root *{box-sizing:border-box;margin:0;padding:0;}
#xysb-root .xysb-card{position:relative;background:#f3f4fb;border:1px solid #dfe2f3;border-radius:14px;box-shadow:0 10px 30px rgba(108,111,216,.16),0 2px 6px rgba(108,111,216,.08);overflow:hidden;margin-bottom:9px;}
#xysb-root .xysb-card::before,#xysb-root .xysb-card::after{content:'';position:absolute;width:16px;height:16px;pointer-events:none;opacity:.7;}
#xysb-root .xysb-card::before{top:8px;left:8px;border-top:2px solid #8d90e0;border-left:2px solid #8d90e0;border-top-left-radius:4px;}
#xysb-root .xysb-card::after{bottom:8px;right:8px;border-bottom:2px solid #8d90e0;border-right:2px solid #8d90e0;border-bottom-right-radius:4px;}
#xysb-root .xysb-head{display:flex;align-items:center;gap:8px;padding:12px 16px;background:linear-gradient(135deg,#eef0fc,#e3e7f9);cursor:pointer;user-select:none;border-bottom:1px solid #e4e7f6;}
#xysb-root .xysb-arrow{display:inline-block;transition:transform .2s ease;color:#8d90e0;font-size:11px;flex-shrink:0;}
#xysb-root .open>.xysb-head .xysb-arrow{transform:rotate(90deg);}
#xysb-root .xysb-title{flex:1;text-align:center;font-family:'Kaiti SC','KaiTi','STKaiti','楷体','Noto Serif SC',serif;font-size:17px;font-weight:700;letter-spacing:6px;background:linear-gradient(90deg,#6a5fd8,#4f8de0);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:0 2px 8px rgba(106,95,216,.18);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
#xysb-root .xysb-badge{flex-shrink:0;font-size:10px;letter-spacing:1px;padding:3px 9px;border-radius:20px;border:1px solid #d4d8ee;color:#8a8fc0;background:#fff;}
#xysb-root .xysb-badge.ok{color:#1f9e7e;border-color:#9fdcc9;background:#effaf5;}
#xysb-root .xysb-badge.warn{color:#c08a1f;border-color:#ecd49a;background:#fdf7ea;}
#xysb-root .xysb-badge.err{color:#d4537a;border-color:#f1bccd;background:#fdf0f4;}
#xysb-root .xysb-rep-track{position:relative;height:8px;background:linear-gradient(90deg,rgba(226,109,140,.22),rgba(154,143,90,.16),rgba(47,138,124,.22));border-radius:4px;margin-top:8px;}
#xysb-root .xysb-rep-mid{position:absolute;left:50%;top:-3px;width:1px;height:14px;background:rgba(150,150,180,.5);}
#xysb-root .xysb-rep-dot{position:absolute;top:-3px;left:50%;width:13px;height:13px;border-radius:50%;transform:translateX(-50%);background:#9a8f5a;box-shadow:0 1px 5px rgba(0,0,0,.25);border:2px solid #fff;}
#xysb-root .xysb-cult-item{border:1px solid rgba(124,150,200,.18);border-radius:10px;padding:9px 11px;margin-bottom:9px;background:rgba(124,150,200,.05);}
#xysb-root .xysb-cr1{display:flex;align-items:center;gap:8px;}
#xysb-root .xysb-cr1 .xysb-inm{font-size:14px;font-weight:700;color:#3a3a78;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
#xysb-root .xysb-cstep2{display:flex;align-items:center;gap:4px;}
#xysb-root .xysb-cstep2 .xysb-sbtn{width:25px;height:25px;font-size:14px;}
#xysb-root .xysb-cstep2 .xysb-cd{font-size:12px;font-weight:700;min-width:22px;text-align:center;color:#5b4fc4;}
#xysb-root .xysb-cdel{font-size:11.5px;cursor:pointer;padding:4px 9px;border-radius:6px;border:1px solid rgba(226,109,140,.4);background:transparent;color:#c25575;font-family:inherit;white-space:nowrap;}
#xysb-root .xysb-cdel:hover{background:rgba(226,109,140,.12);}
#xysb-root .xysb-cr2{display:flex;align-items:center;gap:9px;margin-top:7px;}
#xysb-root .xysb-cr2 .xysb-bar{flex:1;}
#xysb-root .xysb-cval{font-size:12px;font-weight:700;color:#8d62e0;min-width:48px;text-align:right;}
#xysb-root .xysb-cjin{font-size:12px;color:#5a6a93;line-height:1.5;margin-top:6px;}
#xysb-root .xysb-cult-scroll{max-height:420px;overflow-y:auto;padding-right:5px;}
#xysb-root .xysb-cadd{display:flex;gap:7px;margin-top:8px;}
#xysb-root .xysb-caddinput{flex:1;box-sizing:border-box;font-family:inherit;font-size:13px;color:#3a3f66;border:1px solid rgba(124,150,200,.3);border-radius:8px;padding:8px 10px;background:rgba(255,255,255,.6);outline:none;}
#xysb-root .xysb-caddbtn{font-size:13px;cursor:pointer;padding:0 14px;border-radius:8px;border:1px dashed rgba(124,127,240,.5);background:transparent;color:#6a6fb0;font-family:inherit;white-space:nowrap;}
#xysb-root .xysb-caddbtn:hover{background:rgba(124,127,240,.1);}
#xysb-root .xysb-cinject{width:100%;margin-top:10px;font-family:inherit;font-size:14px;letter-spacing:1px;cursor:pointer;border:0;border-radius:9px;padding:10px 0;background:linear-gradient(135deg,#5bbf8a,#4f8de0);color:#fff;box-shadow:0 2px 10px rgba(79,141,224,.25);}
#xysb-root .xysb-cinject:hover{filter:brightness(1.05);}
#xysb-root .xysb-lust{display:flex;align-items:center;gap:8px;justify-content:flex-end;}
#xysb-root .xysb-lust-ic{color:#e06fb4;font-size:14px;}
#xysb-root .xysb-lust-lb{color:#b56aa8;font-size:12.5px;letter-spacing:2px;}
#xysb-root .xysb-lust-bar{width:50%;height:8px;border-radius:5px;background:rgba(200,120,180,.16);overflow:hidden;}
#xysb-root .xysb-lust-bar>i{display:block;height:100%;border-radius:5px;background:linear-gradient(90deg,#f0a8d8,#d57ad0,#b06ee0);box-shadow:0 0 8px rgba(200,110,200,.4);}
#xysb-root .xysb-lust-vl{color:#c060a0;font-size:13px;font-weight:700;min-width:26px;text-align:right;}
#xysb-root .xysb-lvlhead{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:2px;}
#xysb-root .xysb-lust2{display:flex;align-items:center;gap:6px;flex-shrink:0;}
#xysb-root .xysb-lust2-ic{color:#d6409a;font-size:14px;}
#xysb-root .xysb-lust2-bar{width:88px;height:11px;border-radius:6px;background:rgba(214,64,154,.2);overflow:hidden;}
#xysb-root .xysb-lust2-bar>i{display:block;height:100%;border-radius:6px;background:linear-gradient(90deg,#f06bbf,#d6409a,#b82e8c);box-shadow:0 0 9px rgba(214,64,154,.55);}
#xysb-root .xysb-lust2-vl{color:#c33d9e;font-size:13px;font-weight:700;min-width:18px;text-align:right;}
#xysb-root .xysb-lvlrow{display:flex;justify-content:space-between;align-items:center;gap:18px;}
#xysb-root .xysb-lvlleft{flex:1;min-width:0;}
#xysb-root .xysb-lust3{flex:0 0 44%;display:flex;flex-direction:column;justify-content:center;gap:8px;}
#xysb-root .xysb-lust3-top{display:flex;align-items:center;gap:7px;}
#xysb-root .xysb-lust3-ic{color:#d6409a;font-size:16px;}
#xysb-root .xysb-lust3-lb{color:#b03a86;font-size:13px;letter-spacing:3px;flex:1;}
#xysb-root .xysb-lust3-vl{color:#c33d9e;font-size:15px;font-weight:700;}
#xysb-root .xysb-lust3-bar{height:15px;border-radius:8px;background:rgba(214,64,154,.18);overflow:hidden;}
#xysb-root .xysb-lust3-bar>i{display:block;height:100%;border-radius:8px;background:linear-gradient(90deg,#f06bbf,#d6409a,#b82e8c);box-shadow:0 0 11px rgba(214,64,154,.5);}
#xysb-root .xysb-body{display:none;padding:13px 14px 12px;}
#xysb-root .xysb-card.open .xysb-body{display:block;}
#xysb-root .xysb-sub{text-align:center;font-family:'Kaiti SC','KaiTi','STKaiti','楷体',serif;font-size:13.5px;color:#6b6fd8;margin:0 0 11px;letter-spacing:2px;}

/* —— 角色页 · 立绘(左) + 契约信息(右)，情欲条移入信息列 —— */
#xysb-root .xysb-charwrap{display:flex;gap:13px;align-items:flex-start;}
#xysb-root .xysb-portrait{flex:0 0 auto;width:clamp(140px,46%,280px);position:relative;border-radius:11px;overflow:hidden;background:color-mix(in srgb,var(--xy-text,#3a3f63) 5%,transparent);border:1px solid var(--xy-bord2,rgba(58,63,99,.1));min-height:150px;display:flex;align-items:center;justify-content:center;}
#xysb-root .xysb-portrait-img{display:block;width:100%;height:auto;}
#xysb-root .xysb-portrait-ph{color:var(--xy-t4,#b3b8da);font-size:12px;letter-spacing:3px;font-family:'Kaiti SC','KaiTi','STKaiti','楷体',serif;padding:24px 8px;text-align:center;line-height:1.9;}
#xysb-root .xysb-charinfo{flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:11px;}
#xysb-root .xysb-charinfo .xysb-info{gap:9px;}
#xysb-root .xysb-charinfo .xysb-info .row .v{min-width:0;overflow-wrap:anywhere;word-break:break-word;}
#xysb-root .xysb-charinfo .xysb-lust3{flex:0 0 auto;width:100%;}
@container xysb (max-width:340px){
  #xysb-root .xysb-charwrap{flex-direction:column;gap:11px;}
  #xysb-root .xysb-portrait{width:100%;max-width:240px;align-self:center;}
}

/* —— 页签（底部·一排平铺·紧凑） —— */
#xysb-root .xysb-tabs{display:flex;flex-wrap:wrap;gap:2px;margin:14px 0 0;padding:8px 2px 0;background:transparent;border-top:1px solid #e2e4f2;border-radius:0;}
#xysb-root .xysb-tab{flex:1 1 0;min-width:50px;padding:5px 1px;background:transparent;border:none;border-radius:9px;color:#8086b3;font-size:10.5px;cursor:pointer;font-family:inherit;letter-spacing:0;transition:all .18s;font-weight:600;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;}
#xysb-root .xysb-tab i{font-size:13px;line-height:1;}
#xysb-root .xysb-tlb{white-space:nowrap;line-height:1;}
#xysb-root .xysb-tab:hover{color:#4a5080;background:rgba(124,127,240,.09);}
#xysb-root .xysb-tab.active{color:#fff;background:var(--tab-color);box-shadow:0 3px 10px var(--tab-glow);}
#xysb-root .xysb-pane{display:none;}
#xysb-root .xysb-pane.active{display:block;}
/* —— 星灵页·分隔小标题 —— */
#xysb-root .xysb-spsub{font-family:'Kaiti SC','KaiTi','STKaiti','楷体',serif;font-size:11.5px;font-weight:700;letter-spacing:2px;color:#8086b3;margin:12px 0 7px;padding-top:9px;border-top:1px dashed rgba(124,150,200,.28);}
/* —— 躯体白描 ｜ 变身装甲 · 左右两小块 —— */
#xysb-root .xysb-bp2{display:flex;gap:11px;align-items:flex-start;}
#xysb-root .xysb-bp2-col{flex:1;min-width:0;}
#xysb-root .xysb-bp2-h{font-size:10.5px;letter-spacing:1.5px;font-weight:700;color:#7c72c8;margin-bottom:7px;padding-bottom:4px;border-bottom:1px solid rgba(124,114,200,.22);}
#xysb-root .xysb-bp2-col:first-child .xysb-bp2-h{color:#3fa6c7;border-bottom-color:rgba(63,166,199,.22);}
#xysb-root .xysb-bp2-hint{font-size:10px;color:#9aa0cc;line-height:1.55;margin-top:7px;}
#xysb-root .xysb-bp2 .xysb-krow{display:block;margin-bottom:7px;}
#xysb-root .xysb-bp2 .xysb-krow:last-child{margin-bottom:0;}
#xysb-root .xysb-bp2 .xysb-krow .nk{display:block;min-width:0;color:#8086b3;font-size:10.5px;letter-spacing:1px;margin-bottom:1px;}
#xysb-root .xysb-bp2 .xysb-krow .nv{display:block;font-size:11.5px;line-height:1.55;}
#xysb-root .xysb-bp2 .xysb-empty{padding:8px 0;text-align:left;}
@container xysb (max-width:520px){ #xysb-root .xysb-bp2{flex-direction:column;gap:9px;} }
/* —— 世界规则页 —— */
#xysb-root .xysb-rule-tip{font-size:11px;line-height:1.65;color:#8086b3;background:rgba(124,114,200,.07);border:1px solid rgba(124,114,200,.2);border-radius:9px;padding:8px 10px;margin-bottom:10px;}
#xysb-root .xysb-rule-tip b{color:#6a5fc4;}
#xysb-root .xysb-rule-scroll{max-height:230px;overflow:auto;padding-right:2px;}
#xysb-root .xysb-rule-item{display:flex;align-items:center;gap:8px;border:1px solid rgba(124,150,200,.2);border-radius:10px;padding:8px 10px;margin-bottom:7px;background:rgba(124,150,200,.05);}
#xysb-root .xysb-rule-item.off{opacity:.5;}
#xysb-root .xysb-rule-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;background:#c2c6e0;}
#xysb-root .xysb-rule-dot.on{background:#5bbf8a;box-shadow:0 0 6px rgba(91,191,138,.5);}
#xysb-root .xysb-rule-text{flex:1;min-width:0;font-size:12.5px;line-height:1.55;color:#3a3f66;word-break:break-word;}
#xysb-root .xysb-rule-toggle,#xysb-root .xysb-rule-del{flex-shrink:0;font-family:inherit;font-size:11px;cursor:pointer;border-radius:7px;padding:3px 9px;border:1px solid;background:transparent;white-space:nowrap;}
#xysb-root .xysb-rule-toggle{color:#5f86c4;border-color:rgba(95,134,196,.45);}
#xysb-root .xysb-rule-toggle:hover{background:rgba(95,134,196,.1);}
#xysb-root .xysb-rule-del{color:#c25575;border-color:rgba(194,85,117,.4);}
#xysb-root .xysb-rule-del:hover{background:rgba(194,85,117,.1);}
#xysb-root .xysb-rule-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:11px;flex-wrap:wrap;}
#xysb-root .xysb-rauto{display:flex;align-items:center;gap:6px;font-size:12px;color:#6a6fb0;cursor:pointer;user-select:none;}
#xysb-root .xysb-rauto input{width:15px;height:15px;accent-color:#7c72c8;cursor:pointer;}
#xysb-root .xysb-rinject{font-family:inherit;font-size:13px;letter-spacing:1px;cursor:pointer;border:0;border-radius:9px;padding:8px 16px;background:linear-gradient(135deg,#7c72c8,#4f8de0);color:#fff;box-shadow:0 2px 10px rgba(79,141,224,.25);}
#xysb-root .xysb-rinject:hover{filter:brightness(1.06);}

/* —— 白卡片 —— */
#xysb-root .xysb-mod{background:#fff;border:1px solid #e6e8f6;border-left:3px solid var(--accent,#7c7ff0);border-radius:12px;padding:12px 14px;margin-bottom:10px;box-shadow:0 4px 14px rgba(124,127,240,.08);}
#xysb-root .xysb-label{font-size:10.5px;letter-spacing:3px;color:#9aa0cc;margin-bottom:7px;font-weight:600;}
#xysb-root .xysb-big{font-family:'Kaiti SC','KaiTi','STKaiti','楷体','Noto Serif SC',serif;font-size:21px;font-weight:700;letter-spacing:2px;background:linear-gradient(90deg,#6a5fd8,#4f8de0);-webkit-background-clip:text;background-clip:text;color:transparent;line-height:1.3;}
#xysb-root .xysb-desc{font-size:12px;color:#6f7499;margin-top:5px;line-height:1.6;word-break:break-word;}
#xysb-root .xysb-note{font-size:11px;color:#9aa0cc;text-align:right;margin-top:5px;}

/* —— 进度条 —— */
@keyframes xysbFlow{0%{background-position:0% 0;}100%{background-position:200% 0;}}
/* —— 情欲满值·高潮特效 —— */
@keyframes xysbClimaxPulse{0%,100%{box-shadow:0 0 5px rgba(214,64,154,.35);filter:brightness(1) saturate(1);}50%{box-shadow:0 0 13px 1px rgba(255,80,180,.55);filter:brightness(1.15) saturate(1.12);}}
@keyframes xysbHeartBeat{0%,100%{transform:scale(1);}18%{transform:scale(1.55);}32%{transform:scale(1.05);}52%{transform:scale(1.35);}}
@keyframes xysbClimaxBlink{0%,100%{opacity:.5;letter-spacing:3px;}50%{opacity:1;letter-spacing:5px;}}
@keyframes xysbClimaxSweep{0%{transform:translateX(-120%);}100%{transform:translateX(120%);}}
@keyframes xysbClimaxHalo{0%,100%{opacity:.08;}50%{opacity:.32;}}
#xysb-root .xysb-lust3{position:relative;transition:filter .3s;}
#xysb-root .xysb-lust3.xysb-climax{animation:xysbClimaxHalo 2.2s ease-in-out infinite;}
#xysb-root .xysb-lust3.xysb-climax::before{content:"";position:absolute;left:-8px;right:-8px;top:-6px;bottom:-6px;border-radius:12px;background:radial-gradient(ellipse at center,rgba(255,86,182,.18),rgba(255,86,182,0) 70%);animation:xysbClimaxHalo 2.2s ease-in-out infinite;pointer-events:none;z-index:0;}
#xysb-root .xysb-lust3.xysb-climax>*{position:relative;z-index:1;}
#xysb-root .xysb-lust3.xysb-climax .xysb-lust3-ic{display:inline-block;color:#ff2fa6;animation:xysbHeartBeat 1.4s ease-in-out infinite;}
#xysb-root .xysb-lust3.xysb-climax .xysb-lust3-vl{color:#ff1f9e;text-shadow:0 0 10px rgba(255,47,166,.85);}
#xysb-root .xysb-lust3.xysb-climax .xysb-lust3-bar{position:relative;animation:xysbClimaxPulse 1.4s ease-in-out infinite;overflow:hidden;}
#xysb-root .xysb-lust3.xysb-climax .xysb-lust3-bar>i{background:linear-gradient(90deg,#ff9ad8,#ff3fae,#e0359e)!important;}
#xysb-root .xysb-lust3.xysb-climax .xysb-lust3-bar::after{content:"♥ 高 潮 ♥";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff;text-shadow:0 0 6px rgba(255,47,166,.95),0 0 3px rgba(120,0,60,.5);animation:xysbClimaxBlink 1.4s ease-in-out infinite;pointer-events:none;z-index:2;}
#xysb-root .xysb-lust3.xysb-climax .xysb-lust3-bar>span.xysb-sweep{position:absolute;top:0;bottom:0;width:36%;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.65),rgba(255,255,255,0));animation:xysbClimaxSweep 1.9s linear infinite;z-index:1;pointer-events:none;}
#xysb-root .xysb-bhead{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:6px;}
#xysb-root .xysb-bname{font-size:12.5px;font-weight:700;color:#4a5080;letter-spacing:1px;}
#xysb-root .xysb-bnum{font-size:13px;font-weight:700;color:#6b6fd8;white-space:nowrap;}
#xysb-root .xysb-bar{height:10px;border-radius:5px;background:#e7eaf7;overflow:hidden;}
#xysb-root .xysb-bar>div{height:100%;width:0%;border-radius:5px;transition:width .4s;background-size:200% 100%;animation:xysbFlow 3.2s linear infinite;}
#xysb-root .xysb-bar>.f-mana{background-image:linear-gradient(90deg,#8b7cf6,#5aa2f7,#8b7cf6);box-shadow:0 0 8px rgba(122,124,243,.45);}
#xysb-root .xysb-bar>.f-hp{background-image:linear-gradient(90deg,#f4798f,#f9a8b8,#f4798f);box-shadow:0 0 8px rgba(244,121,143,.4);}
#xysb-root .xysb-bar>.f-cult{background-image:linear-gradient(90deg,#a78bfa,#60a5fa,#a78bfa);box-shadow:0 0 8px rgba(147,139,250,.45);}
#xysb-root .xysb-bar>.f-corr{background-image:linear-gradient(90deg,#6cc079,#94d3a0,#6cc079);box-shadow:0 0 8px rgba(108,192,121,.4);}
#xysb-root .xysb-bar>.f-corr.cs1{background-image:linear-gradient(90deg,#e0c45a,#ecd98a,#e0c45a);box-shadow:0 0 8px rgba(224,196,90,.42);}
#xysb-root .xysb-bar>.f-corr.cs2{background-image:linear-gradient(90deg,#e89a4a,#f0b87a,#e89a4a);box-shadow:0 0 8px rgba(232,154,74,.45);}
#xysb-root .xysb-bar>.f-corr.cs3{background-image:linear-gradient(90deg,#b06fd0,#c89ae0,#b06fd0);box-shadow:0 0 9px rgba(176,111,208,.5);}
#xysb-root .xysb-bar>.f-corr.cs4{background-image:linear-gradient(90deg,#c0506a,#d87a90,#c0506a);box-shadow:0 0 10px rgba(192,80,106,.55);}
#xysb-root .xysb-corrstage{display:inline-block;padding:1px 9px;border-radius:9px;font-size:12px;font-weight:700;letter-spacing:1px;color:#fff;line-height:1.5;}
#xysb-root .xysb-corrstage.cs0{background:#6cc079;}
#xysb-root .xysb-corrstage.cs1{background:#e0c45a;color:#4a3d10;}
#xysb-root .xysb-corrstage.cs2{background:#e89a4a;}
#xysb-root .xysb-corrstage.cs3{background:#b06fd0;}
#xysb-root .xysb-corrstage.cs4{background:#c0506a;}
#xysb-root .xysb-grid2{display:flex;gap:12px;}
#xysb-root .xysb-grid2>div{flex:1;min-width:0;}

/* —— 状态点 —— */
#xysb-root .xysb-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;display:inline-block;}
#xysb-root .xysb-dot.ok{background:#34c98e;box-shadow:0 0 6px rgba(52,201,142,.55);}
#xysb-root .xysb-dot.warn{background:#f0a93b;box-shadow:0 0 6px rgba(240,169,59,.55);}
#xysb-root .xysb-dot.bad{background:#ef5d7a;box-shadow:0 0 6px rgba(239,93,122,.55);}

/* —— 信息行 —— */
#xysb-root .xysb-info{display:flex;flex-direction:column;gap:7px;font-size:13px;line-height:1.65;}
#xysb-root .xysb-info .row{display:flex;gap:10px;}
#xysb-root .xysb-info .row .k{color:#9aa0cc;width:60px;flex-shrink:0;font-weight:700;letter-spacing:1px;}
#xysb-root .xysb-info .row .v{color:#3a3f63;flex:1;min-width:0;word-break:break-word;}
#xysb-root .xysb-info .row .v.em{color:#6b6fd8;}
#xysb-root .xysb-info .row .v.cond{display:flex;align-items:flex-start;gap:7px;}
#xysb-root .xysb-info .row .v.cond .xysb-dot{margin-top:5px;}

/* —— 通用小卡（招式/星器/人物/敌人/物品/委托） —— */
#xysb-root .xysb-item{background:#fff;border:1px solid #e6e8f6;border-left:3px solid var(--accent,#7c7ff0);border-radius:10px;padding:9px 12px;margin-bottom:8px;box-shadow:0 3px 10px rgba(124,127,240,.06);}
#xysb-root .xysb-item:last-child{margin-bottom:0;}
/* —— 列表分区：自适应多列网格（桌面自动多列，手机自动单列） —— */
#xysb-root #xysb-arts,#xysb-root #xysb-treas,#xysb-root #xysb-bag,#xysb-root #xysb-quests{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;align-items:start;}
#xysb-root #xysb-npcs,#xysb-root #xysb-foes{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:8px;align-items:start;}
#xysb-root #xysb-arts>.xysb-item,#xysb-root #xysb-treas>.xysb-item,#xysb-root #xysb-bag>.xysb-item,#xysb-root #xysb-quests>.xysb-item,#xysb-root #xysb-npcs>.xysb-item,#xysb-root #xysb-foes>.xysb-item{margin-bottom:0;}
#xysb-root .xysb-empty{grid-column:1 / -1;}
@container xysb (max-width:520px){
  #xysb-root #xysb-arts,#xysb-root #xysb-treas,#xysb-root #xysb-bag,#xysb-root #xysb-quests{grid-template-columns:repeat(2,1fr);gap:7px;}
  #xysb-root #xysb-npcs,#xysb-root #xysb-foes{grid-template-columns:1fr;}
}
#xysb-root .xysb-itop{display:flex;gap:7px;align-items:baseline;flex-wrap:wrap;margin-bottom:3px;}
#xysb-root .xysb-inm{font-weight:700;font-size:13px;color:#4a5080;}
#xysb-root .xysb-chip{font-size:10px;border-radius:20px;padding:1px 8px;border:1px solid;letter-spacing:.5px;white-space:nowrap;}
#xysb-root .xysb-chip.violet{color:#7c5fd8;border-color:#d4c9f3;background:#f4f0fd;}
#xysb-root .xysb-chip.blue{color:#3f7ed0;border-color:#bcd6f1;background:#eff6fd;}
#xysb-root .xysb-chip.gold{color:#b07f1f;border-color:#ecd49a;background:#fdf8ec;}
#xysb-root .xysb-chip.teal{color:#1f9e7e;border-color:#9fdcc9;background:#effaf5;}
#xysb-root .xysb-chip.rose{color:#d4537a;border-color:#f1bccd;background:#fdf0f4;}
#xysb-root .xysb-irow{font-size:11.5px;color:#5d6285;line-height:1.55;word-break:break-word;}
#xysb-root .xysb-krow{display:flex;gap:8px;font-size:11.5px;line-height:1.6;}
#xysb-root .xysb-krow .nk{color:#9aa0cc;min-width:60px;flex-shrink:0;}
#xysb-root .xysb-krow .nv{color:#3a3f63;flex:1;min-width:0;word-break:break-word;}
#xysb-root .xysb-sec-title{font-family:'Kaiti SC','KaiTi','STKaiti','楷体',serif;font-size:13.5px;font-weight:700;letter-spacing:3px;margin:0 0 8px;color:#6b6fd8;}
#xysb-root .xysb-sec-title.rose{color:#d4537a;}
#xysb-root .xysb-sec-title.teal{color:#1f9e7e;}
#xysb-root .xysb-sec-title.gold{color:#b07f1f;}
#xysb-root .xysb-empty{text-align:center;color:#b3b8da;font-size:11.5px;letter-spacing:2px;padding:14px 0;}
#xysb-root .xysb-warbox{background:#fdf3f6;border:1px dashed #f1bccd;border-radius:8px;padding:8px 11px;margin-bottom:9px;display:flex;gap:9px;font-size:12px;}
#xysb-root .xysb-warbox .wk{color:#d4537a;font-weight:700;flex-shrink:0;}
#xysb-root .xysb-warbox .wv{color:#5d6285;flex:1;min-width:0;word-break:break-word;}
#xysb-root .xysb-mobbar{height:8px;border-radius:4px;background:#f3e0e6;overflow:hidden;margin:4px 0 2px;}
#xysb-root .xysb-mobbar>div{height:100%;width:0%;background:linear-gradient(90deg,#ef5d7a,#f79ab0);transition:width .3s;}
#xysb-root .xysb-mobhp{display:flex;justify-content:space-between;font-size:10.5px;color:#b07a8c;}
#xysb-root .xysb-favor{font-weight:700;}
#xysb-root .xysb-favor.hi{color:#1f9e7e;}
#xysb-root .xysb-favor.lo{color:#d4537a;}
#xysb-root .xysb-favor.mid{color:#8a8fc0;}
#xysb-root .xysb-cnt{color:#b07f1f;font-size:11px;border:1px solid #ecd49a;background:#fdf8ec;border-radius:20px;padding:0 7px;}

/* —— 地图 —— */
#xysb-root .xysb-map svg{width:100%;height:auto;display:block;}
#xysb-root .xysb-maptool{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px;flex-wrap:wrap;}
#xysb-root .xysb-maptool .xysb-label{margin:0;}
#xysb-root .xysb-mapwrap{position:relative;}
#xysb-root .xysb-mapviews{display:inline-flex;background:rgba(124,127,240,.08);border:1px solid rgba(124,127,240,.22);border-radius:9px;padding:2px;gap:2px;}
#xysb-root .xysb-mview{font:inherit;font-size:11px;letter-spacing:1px;color:#7b7fb0;background:transparent;border:0;border-radius:7px;padding:3px 11px;cursor:pointer;transition:background .15s,color .15s,box-shadow .15s;}
#xysb-root .xysb-mview.active{background:#fff;color:#5b4fc4;box-shadow:0 1px 3px rgba(91,79,196,.18);font-weight:600;}
#xysb-root .xysb-crumb{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:10px;font-size:12px;color:#4a5080;}
#xysb-root .xysb-crumb .seg{background:#eef0fb;border:1px solid #dfe3f5;border-radius:7px;padding:2px 9px;}
#xysb-root .xysb-crumb .sep{color:#b3b8da;}
#xysb-root .xysb-unk{margin-top:7px;font-size:10.5px;color:#9aa0cc;line-height:1.6;}
@keyframes xysbPing{0%{transform:scale(.6);opacity:.75;}80%{transform:scale(2.2);opacity:0;}100%{opacity:0;}}
#xysb-root .xysb-ping{animation:xysbPing 1.8s ease-out infinite;transform-origin:center;transform-box:fill-box;}
@container xysb (max-width:480px){
  #xysb-root .xysb-tab{min-width:40px;font-size:9.5px;letter-spacing:0;padding:5px 0;gap:2px;}
  #xysb-root .xysb-tab i{font-size:12px;}
  #xysb-root .xysb-info .row .k{width:52px;}
  #xysb-root .xysb-title{letter-spacing:3px;font-size:15px;}
  #xysb-root .xysb-realm{font-size:10.5px;letter-spacing:1px;}
}

/* ════════════════════════════════════════════════════════════ */
/*  主题自适应补丁 v6 · 自动"吸取背景图配色"(同色系明/暗) + 磨砂     */
/*  · ◑按钮:自动(吸取背景图)/ ☀亮 / ☾暗。手动亮/暗为中性色。        */
/*  · 透明度=下面 --xy-panel/--xy-panel2 的 %;模糊=.xysb-card blur()  */
/*  · 染色浓淡=JS里 Sp上限0.45/下限0.18;深色面板亮度=pL的24(调大更亮更显色)。 */
/* ════════════════════════════════════════════════════════════ */
#xysb-root{
  --xy-pbase:  var(--SmartThemeBlurTintColor, #eef0fb);
  --xy-pbase2: var(--SmartThemeChatTintColor, #ffffff);
  --xy-text:   var(--SmartThemeBodyColor, #3a3f63);
  --xy-panel:  color-mix(in srgb, var(--xy-pbase)  72%, transparent);
  --xy-panel2: color-mix(in srgb, var(--xy-pbase2) 82%, transparent);
  --xy-t2:   color-mix(in srgb, var(--xy-text) 80%, transparent);
  --xy-t3:   color-mix(in srgb, var(--xy-text) 54%, transparent);
  --xy-t4:   color-mix(in srgb, var(--xy-text) 38%, transparent);
  --xy-track: color-mix(in srgb, var(--xy-text) 16%, transparent);
  --xy-bord:  color-mix(in srgb, var(--xy-text) 16%, transparent);
  --xy-bord2: color-mix(in srgb, var(--xy-text) 10%, transparent);
  --xy-shadow: var(--SmartThemeShadowColor, rgba(20,22,30,.18));
  color: var(--xy-text);
}
/* 自动:用 JS 采样的背景图配色(取不到则退主题色) */
body[data-xysb-theme="auto"][data-xysb-auto] #xysb-root{
  --xy-pbase:  var(--xysb-smp-pbase,  var(--SmartThemeBlurTintColor, #eef0fb));
  --xy-pbase2: var(--xysb-smp-pbase2, var(--SmartThemeChatTintColor, #ffffff));
  --xy-text:   var(--xysb-smp-text,   var(--SmartThemeBodyColor, #3a3f63));
}
/* 手动:亮(中性) */
body[data-xysb-theme="light"] #xysb-root{ --xy-pbase:#eef0fb; --xy-pbase2:#ffffff; --xy-text:#3a3f63; }
/* 手动:暗(中性) */
body[data-xysb-theme="dark"] #xysb-root{ --xy-pbase:#23252f; --xy-pbase2:#2b2d3a; --xy-text:#e6e8f4; }

#xysb-root .xysb-card{ background: var(--xy-panel); border-color: var(--xy-bord); box-shadow: 0 6px 20px var(--xy-shadow); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); }
#xysb-root .xysb-head{ background: color-mix(in srgb, var(--xy-pbase2) 70%, transparent); border-bottom-color: var(--xy-bord); }
#xysb-root .xysb-mod,
#xysb-root .xysb-item{ background: var(--xy-panel2); border-color: var(--xy-bord2); }
#xysb-root .xysb-tabs{ background: transparent; border-top-color: var(--xy-bord); }
#xysb-root .xysb-tab{ color: var(--xy-t3); }
#xysb-root .xysb-tab:hover{ color: var(--xy-text); background: color-mix(in srgb, var(--xy-text) 10%, transparent); }
#xysb-root .xysb-badge{ background: var(--xy-panel2); border-color: var(--xy-bord); color: var(--xy-t3); }
#xysb-root .xysb-badge.ok,
#xysb-root .xysb-badge.warn,
#xysb-root .xysb-badge.err{ background: color-mix(in srgb, currentColor 15%, transparent); border-color: color-mix(in srgb, currentColor 38%, transparent); }
#xysb-root .xysb-label,
#xysb-root .xysb-note,
#xysb-root .xysb-unk,
#xysb-root .xysb-info .row .k,
#xysb-root .xysb-krow .nk,
#xysb-root .xysb-mobhp{ color: var(--xy-t3); }
#xysb-root .xysb-desc,
#xysb-root .xysb-irow,
#xysb-root .xysb-warbox .wv,
#xysb-root .xysb-info .row .v,
#xysb-root .xysb-krow .nv{ color: var(--xy-t2); }
#xysb-root .xysb-bname,
#xysb-root .xysb-inm,
#xysb-root .xysb-crumb{ color: var(--xy-text); }
#xysb-root .xysb-empty,
#xysb-root .xysb-crumb .sep{ color: var(--xy-t4); }
#xysb-root .xysb-bar,
#xysb-root .xysb-mobbar{ background: var(--xy-track); }
#xysb-root .xysb-crumb .seg{ background: var(--xy-panel2); border-color: var(--xy-bord2); }
#xysb-root .xysb-mapviews{ background: color-mix(in srgb, var(--xy-text) 7%, transparent); border-color: var(--xy-bord); }
#xysb-root .xysb-mview{ color: var(--xy-t3); }
#xysb-root .xysb-mview.active{ background: var(--xy-track); color: var(--xy-text); box-shadow: 0 1px 3px var(--xy-shadow); }
#xysb-root .xysb-mview.xysb-dis{ opacity:.32; cursor:default; box-shadow:none; }
#xysb-root .xysb-crumb .seg.here{ background: color-mix(in srgb, #8b6fe6 20%, transparent); border-color: color-mix(in srgb, #8b6fe6 48%, transparent); font-weight:700; }
#xysb-root .xysb-chip.violet,
#xysb-root .xysb-chip.blue,
#xysb-root .xysb-chip.gold,
#xysb-root .xysb-chip.teal,
#xysb-root .xysb-chip.rose,
#xysb-root .xysb-cnt{ background: color-mix(in srgb, currentColor 14%, transparent); border-color: color-mix(in srgb, currentColor 32%, transparent); }
#xysb-root .xysb-warbox{ background: color-mix(in srgb, #d4537a 10%, transparent); border-color: color-mix(in srgb, #d4537a 38%, transparent); }
#xysb-root .xysb-spsub{ color: var(--xy-t3); border-top-color: var(--xy-bord2); }
#xysb-root .xysb-bp2-h{ border-bottom-color: var(--xy-bord2); }
#xysb-root .xysb-bp2-col:first-child .xysb-bp2-h{ border-bottom-color: var(--xy-bord2); }
#xysb-root .xysb-bp2-hint{ color: var(--xy-t3); }
#xysb-root .xysb-bp2 .xysb-krow .nk{ color: var(--xy-t3); }
#xysb-root .xysb-bp2 .xysb-krow .nv{ color: var(--xy-t2); }
#xysb-root .xysb-rule-tip{ color: var(--xy-t2); background: color-mix(in srgb, var(--xy-accent) 8%, transparent); border-color: color-mix(in srgb, var(--xy-accent) 24%, transparent); }
#xysb-root .xysb-rule-item{ background: var(--xy-panel2); border-color: var(--xy-bord2); }
#xysb-root .xysb-rule-text{ color: var(--xy-text); }
#xysb-root .xysb-rauto{ color: var(--xy-t2); }

#xysb-root .xysb-themebtn{ flex-shrink:0; cursor:pointer; font-size:13px; line-height:1; padding:3px 8px; border-radius:20px; border:1px solid var(--xy-bord); color:var(--xy-t2); background:var(--xy-panel2); user-select:none; transition:color .15s,border-color .15s; }
#xysb-root .xysb-themebtn:hover{ color:var(--xy-text); border-color:var(--xy-text); }
#xysb-root .xysb-themebtn::after{ content:"◑"; }
body[data-xysb-theme="light"] #xysb-root .xysb-themebtn::after{ content:"☀"; }
body[data-xysb-theme="dark"]  #xysb-root .xysb-themebtn::after{ content:"☾"; }

/* ===== 重点色(accent)随主题自适应：标题/阶级/页签/边角/段标题/进度，统一吸取背景同色系 ===== */
#xysb-root{ --xy-accent: var(--SmartThemeQuoteColor, #8b6fe6); --xy-accent-soft: color-mix(in srgb, var(--xy-accent) 22%, transparent); }
body[data-xysb-theme="auto"][data-xysb-auto] #xysb-root{ --xy-accent: var(--xysb-smp-accent, var(--SmartThemeQuoteColor, #8b6fe6)); }
body[data-xysb-theme="light"] #xysb-root{ --xy-accent:#6b6fd8; }
body[data-xysb-theme="dark"]  #xysb-root{ --xy-accent:#a98cf0; }
#xysb-root .xysb-card::before, #xysb-root .xysb-card::after{ border-color: var(--xy-accent); }
#xysb-root .xysb-arrow{ color: var(--xy-accent); }
#xysb-root .xysb-title, #xysb-root .xysb-big{ background:none; -webkit-text-fill-color: var(--xy-accent); color: var(--xy-accent); text-shadow:none; }
#xysb-root .xysb-sub, #xysb-root .xysb-bnum, #xysb-root .xysb-info .row .v.em{ color: var(--xy-accent); }
#xysb-root .xysb-sec-title, #xysb-root .xysb-sec-title.rose, #xysb-root .xysb-sec-title.teal, #xysb-root .xysb-sec-title.gold{ color: var(--xy-accent); }
#xysb-root .xysb-mod, #xysb-root .xysb-item{ border-left-color: var(--xy-accent); }
#xysb-root .xysb-tab.active{ background: var(--xy-accent-soft); color: var(--xy-accent); box-shadow: 0 2px 8px color-mix(in srgb, var(--xy-accent) 22%, transparent); }
#xysb-root .xysb-mview.active{ background: var(--xy-accent-soft); color: var(--xy-accent); box-shadow: 0 1px 3px var(--xy-shadow); }
#xysb-root .xysb-bar>.f-cult{ background-image: linear-gradient(90deg, var(--xy-accent), color-mix(in srgb, var(--xy-accent) 55%, #ffffff), var(--xy-accent)); box-shadow: 0 0 8px color-mix(in srgb, var(--xy-accent) 40%, transparent); }

/* ===== 魔人态 · 紫蚀绯红（手动亮/暗时强制重点色；自动态仍随背景图，二者不冲突） ===== */
#xysb-root[data-xysb-role="demon"]{ --xy-accent:#b25cff; }
#xysb-root[data-xysb-role="demon"] .xysb-bar>.f-corr{ background-image:linear-gradient(90deg,#b25cff,#e25a9a,#b25cff); box-shadow:0 0 9px rgba(178,92,255,.5); }
#xysb-root[data-xysb-role="demon"] .xysb-corrstage{ background:#b25cff; }
#xysb-root[data-xysb-role="demon"] .xysb-corrstage.cs0{ background:#9a6ad6; }

/* —— 正文插图：从流式输出第一帧起即隐藏（已收进「角色」立绘框）—— */
body[data-xysb-hideimg] #chat .mes_text img{ display:none !important; }
`;

    // ──────────────────────────── 骨架 ────────────────────────────
    var MAIN_TABS = [
        { k: 'over', label: '总 览', icon: 'fa-gauge-high', color: '#6c6fd8', glow: 'rgba(108,111,216,.35)' },
        { k: 'char', label: '角 色', icon: 'fa-user', color: '#4f8de0', glow: 'rgba(79,141,224,.35)' },
        { k: 'spirit', label: '星 灵', icon: 'fa-feather-pointed', color: '#3fa6c7', glow: 'rgba(63,166,199,.35)' },
        { k: 'cult', label: '性 癖', icon: 'fa-seedling', color: '#5bbf8a', glow: 'rgba(91,191,138,.35)' },
        { k: 'gong', label: '招 式', icon: 'fa-wand-magic-sparkles', color: '#8d62e0', glow: 'rgba(141,98,224,.35)' },
        { k: 'map', label: '地 图', icon: 'fa-map-location-dot', color: '#d99a3a', glow: 'rgba(217,154,58,.35)' },
        { k: 'npc', label: '人 物', icon: 'fa-users', color: '#2fae9b', glow: 'rgba(47,174,155,.35)' },
        { k: 'item', label: '行 囊', icon: 'fa-box-open', color: '#d069a8', glow: 'rgba(208,105,168,.35)' },
        { k: 'rule', label: '规 则', icon: 'fa-gavel', color: '#7c72c8', glow: 'rgba(124,114,200,.35)' }
    ];
    function tabsHtml() {
        return MAIN_TABS.map(function (t) {
            return '<button class="xysb-tab" data-tab="' + t.k + '" style="--tab-color:' + t.color + ';--tab-glow:' + t.glow + '"><i class="fa-solid ' + t.icon + '"></i><span class="xysb-tlb">' + t.label + '</span></button>';
        }).join('');
    }

    var SKELETON = `
<div class="xysb-card" id="xysb-main">
  <div class="xysb-head" id="xysb-toggle">
    <span class="xysb-arrow">▶</span>
    <span class="xysb-title" id="xysb-title">魔 法 少 女 状 态 栏</span>
    <span class="xysb-themebtn" id="xysb-themebtn" title="主题:自动(吸取背景图配色)/亮/暗 — 点击切换"></span><span class="xysb-badge" id="xysb-badge">⌛ 等待数据库</span>
  </div>
  <div class="xysb-body">
    <div class="xysb-pane" data-pane="over">
      <div class="xysb-mod" style="--accent:#7c7ff0">
        <div class="xysb-label">等 级 阶 级</div>
        <div class="xysb-lvlrow">
          <div class="xysb-lvlleft">
            <div class="xysb-big" id="xysb-realm">— · —</div>
            <div class="xysb-desc" id="xysb-realmdesc">—</div>
          </div>
        </div>
        <div style="margin-top:10px">
          <div class="xysb-bhead"><span class="xysb-bname">经验进度</span><span class="xysb-bnum"><span id="xysb-cult">0</span> / <span id="xysb-cultmax">100</span></span></div>
          <div class="xysb-bar"><div class="f-cult" id="xysb-cultbar"></div></div>
          <div class="xysb-note" id="xysb-bottleneck">—</div>
        </div>
      </div>
      <div class="xysb-mod" style="--accent:#5aa2f7">
        <div class="xysb-label">生 命 · 魔 力</div>
        <div class="xysb-grid2">
          <div>
            <div class="xysb-bhead"><span class="xysb-bname">生命</span><span class="xysb-bnum"><span id="xysb-hp">0</span> / <span id="xysb-hpmax">100</span></span></div>
            <div class="xysb-bar"><div class="f-hp" id="xysb-hpbar"></div></div>
          </div>
          <div>
            <div class="xysb-bhead"><span class="xysb-bname">魔力</span><span class="xysb-bnum"><span id="xysb-mp">0</span> / <span id="xysb-mpmax">100</span></span></div>
            <div class="xysb-bar"><div class="f-mana" id="xysb-mpbar"></div></div>
          </div>
        </div>
      </div>
      <div class="xysb-mod" id="xysb-corrmod" style="--accent:#b06fd0">
        <div class="xysb-label" id="xysb-corrlabel">恶 堕 · 侵 蚀</div>
        <div class="xysb-bhead"><span class="xysb-bname"><span class="xysb-corrstage cs0" id="xysb-corrstage">未染</span></span><span class="xysb-bnum"><span id="xysb-corr">0</span> / 100</span></div>
        <div class="xysb-bar"><div class="f-corr cs0" id="xysb-corrbar"></div></div>
        <div class="xysb-note" id="xysb-corrnote">尚未沾染深渊气息</div>
      </div>
      <div class="xysb-mod" style="--accent:#9aa0cc">
        <div class="xysb-label">行 踪 · 境 况</div>
        <div class="xysb-info">
          <div class="row"><span class="k">地点:</span><span class="v" id="xysb-loc">—</span></div>
          <div class="row"><span class="k">时间:</span><span class="v" id="xysb-time">—</span></div>
          <div class="row"><span class="k" id="xysb-lbl-attire">战服:</span><span class="v" id="xysb-attire">—</span></div>
          <div class="row"><span class="k">状态:</span><span class="v cond"><span class="xysb-dot ok" id="xysb-dot"></span><span id="xysb-cond">—</span></span></div>
        </div>
      </div>
    </div>

    <div class="xysb-pane" data-pane="char">
      <div class="xysb-mod" style="--accent:#4f8de0">
        <div class="xysb-label">契 约 档 案</div>
        <div class="xysb-charwrap">
          <div class="xysb-portrait">
            <img class="xysb-portrait-img" id="xysb-portrait-img" alt="" style="display:none">
            <div class="xysb-portrait-ph" id="xysb-portrait-ph">暂 无 立 绘</div>
          </div>
          <div class="xysb-charinfo">
            <div class="xysb-info">
              <div class="row"><span class="k">代号:</span><span class="v" id="xysb-name">—</span></div>
              <div class="row"><span class="k">性别:</span><span class="v" id="xysb-gender">—</span></div>
              <div class="row"><span class="k" id="xysb-lbl-form">变身:</span><span class="v em" id="xysb-form">—</span></div>
              <div class="row"><span class="k">年龄:</span><span class="v" id="xysb-age">—</span></div>
              <div class="row"><span class="k">阵营:</span><span class="v" id="xysb-ident">—</span></div>
              <div class="row"><span class="k" id="xysb-lbl-sys">系别:</span><span class="v em" id="xysb-root2">—</span></div>
              <div class="row"><span class="k">亲和:</span><span class="v em" id="xysb-phys">—</span></div>
              <div class="row"><span class="k">外貌:</span><span class="v" id="xysb-look">—</span></div>
            </div>
            <div class="xysb-lust3">
              <div class="xysb-lust3-top"><span class="xysb-lust3-ic">♥</span><span class="xysb-lust3-lb">情 欲</span><span class="xysb-lust3-vl" id="xysb-lust">0</span></div>
              <div class="xysb-lust3-bar"><i id="xysb-lustbar"></i></div>
            </div>
          </div>
        </div>
      </div>
      <div class="xysb-mod" style="--accent:#c79a52">
        <div class="xysb-label">声 望 · 名 望</div>
        <div class="xysb-bhead"><span class="xysb-bname" id="xysb-repnature">默默无闻</span><span class="xysb-bnum" id="xysb-rep">0</span></div>
        <div class="xysb-rep-track"><span class="xysb-rep-mid"></span><span class="xysb-rep-dot" id="xysb-repdot"></span></div>
        <div style="margin-top:12px">
          <div class="xysb-bhead"><span class="xysb-bname">知名度</span><span class="xysb-bnum"><span id="xysb-fame">0</span> / 100</span></div>
          <div class="xysb-bar"><div class="f-mana" id="xysb-famebar"></div></div>
        </div>
      </div>
    </div>

    <div class="xysb-pane" data-pane="spirit">
      <div class="xysb-mod" style="--accent:#3fa6c7">
        <div class="xysb-label" id="xysb-sp-mod1lbl">星 灵 · 本 相</div>
        <div class="xysb-info">
          <div class="row"><span class="k">名号:</span><span class="v em" id="xysb-sp-name">—</span></div>
          <div class="row"><span class="k">本相:</span><span class="v" id="xysb-sp-form">—</span></div>
          <div class="row"><span class="k">现状:</span><span class="v" id="xysb-sp-state">—</span></div>
          <div class="row"><span class="k">羁绊:</span><span class="v" id="xysb-sp-bond">—</span></div>
        </div>
        <div class="xysb-spsub">栖 身 星 器</div>
        <div id="xysb-treas" style="--accent:#3fa6c7"><div class="xysb-empty">尚 无 星 器</div></div>
      </div>
      <div class="xysb-mod" style="--accent:#7c72c8">
        <div class="xysb-label" id="xysb-sp-mod2lbl">变 身 · 武 装</div>
        <div class="xysb-info">
          <div class="row"><span class="k" id="xysb-sp-translbl">变身:</span><span class="v em" id="xysb-sp-trans">—</span></div>
          <div class="row"><span class="k" id="xysb-sp-attirelbl">战甲:</span><span class="v" id="xysb-sp-attire">—</span></div>
        </div>
        <div class="xysb-spsub">躯 体 · 变 身 白 描</div>
        <div class="xysb-bp2">
          <div class="xysb-bp2-col">
            <div class="xysb-bp2-h" id="xysb-bp2-hl">躯 体 白 描</div>
            <div id="xysb-bodyrows-L"><div class="xysb-empty">暂 无 记 录</div></div>
          </div>
          <div class="xysb-bp2-col">
            <div class="xysb-bp2-h" id="xysb-bp2-hr">变 身 装 甲 · 服 饰</div>
            <div id="xysb-bodyrows-R"><div class="xysb-empty">暂 无 记 录</div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="xysb-pane" data-pane="cult">
      <div class="xysb-sec-title" style="color:#3a9b73">🌱 性癖·养成</div>
      <div id="xysb-cultivation" style="--accent:#5bbf8a"><div class="xysb-empty">暂 无 养 成 项 目</div></div>
    </div>

    <div class="xysb-pane" data-pane="gong">
      <div class="xysb-sec-title" id="xysb-lbl-arts">✨ 招 式 · 技 能</div>
      <div id="xysb-arts" style="--accent:#8d62e0"><div class="xysb-empty">尚 未 习 得 招 式</div></div>
    </div>

    <div class="xysb-pane" data-pane="map">
      <div class="xysb-mod" style="--accent:#d99a3a">
        <div class="xysb-maptool">
          <div class="xysb-label">战 区 舆 图</div>
          <div class="xysb-mapviews">
            <button class="xysb-mview" data-view="world">战 区</button>
            <button class="xysb-mview active" data-view="local">城 市</button>
            <button class="xysb-mview" data-view="detail">内 景</button>
          </div>
        </div>
        <div class="xysb-mapwrap">
          <div class="xysb-map" id="xysb-map" style="display:none"></div>
          <div class="xysb-map" id="xysb-local"></div>
          <div class="xysb-map" id="xysb-detail" style="display:none"></div>
        </div>
        <div class="xysb-crumb" id="xysb-crumb"><span class="seg">—</span></div>
        <div class="xysb-unk" id="xysb-unk" style="display:none"></div>
      </div>
    </div>

    <div class="xysb-pane" data-pane="npc">
      <div class="xysb-sec-title teal">✦ 重 要 人 物</div>
      <div id="xysb-npcs" style="--accent:#2fae9b"><div class="xysb-empty">暂 无 人 物 档 案</div></div>
      <div class="xysb-sec-title rose" style="margin-top:12px">⚔ 在 场 敌 情</div>
      <div class="xysb-warbox"><span class="wk">⚔ 战况</span><span class="wv" id="xysb-war2">—</span></div>
      <div id="xysb-foes" style="--accent:#e26d8c"><div class="xysb-empty">当 前 无 在 场 敌 人</div></div>
    </div>

    <div class="xysb-pane" data-pane="item">
      <div class="xysb-sec-title teal">🎒 行 囊</div>
      <div id="xysb-bag" style="--accent:#d99a3a"><div class="xysb-empty">囊 中 空 空</div></div>
      <div class="xysb-sec-title" style="margin-top:12px">📜 委 托 · 因 果</div>
      <div id="xysb-quests" style="--accent:#4f8de0"><div class="xysb-empty">暂 无 挂 牵</div></div>
    </div>

    <div class="xysb-pane" data-pane="rule">
      <div class="xysb-mod" style="--accent:#7c72c8">
        <div class="xysb-label">世 界 规 则 · 常 驻 GM 指 令</div>
        <div class="xysb-rule-tip">每条都是<b>最高权限</b>的常驻 GM 指令——效力<b>凌驾</b>世界书 / 角色卡 / 背景设定与一切"合理性"，剧情不得将其扭回。常驻生效、<b>不会遗忘</b>，除非主动删除。开启「常驻注入」后，<b>每轮生成</b>都会自动把启用中的规则作为<b>不可违抗的最高令</b>静默注入给 AI（<b>不</b>作为聊天消息发出、不写入输入框）。</div>
        <div id="xysb-rules"><div class="xysb-empty">暂 无 规 则</div></div>
        <div class="xysb-cadd">
          <input id="xysb-raddinput" class="xysb-caddinput" placeholder="新增一条世界规则 / GM 指令…">
          <button id="xysb-raddbtn" class="xysb-caddbtn">＋ 添加</button>
        </div>
        <div class="xysb-rule-actions">
          <label class="xysb-rauto"><input type="checkbox" id="xysb-rauto"><span>常驻注入（静默·每轮自动生效）</span></label>
          <button id="xysb-rinject" class="xysb-rinject">⚡ 立 即 应 用</button>
        </div>
      </div>
    </div>

    <div class="xysb-tabs">${tabsHtml()}</div>
  </div>
</div>

`;

    // ──────────────────────────── 构建 DOM ────────────────────────────
    var styleEl = D.createElement('style');
    styleEl.id = 'xysb-style';
    styleEl.textContent = CSS;
    var oldStyle = D.getElementById('xysb-style');
    if (oldStyle) oldStyle.remove();
    D.head.appendChild(styleEl);
    try { if (HIDE_INLINE_IMG) D.body.setAttribute('data-xysb-hideimg', '1'); else D.body.removeAttribute('data-xysb-hideimg'); } catch (e) {}
    // ── 主题:自动(吸取背景图配色,同色系明/暗)/亮/暗 ──
    try {
      
        var _cache = W.__XYSB_CACHE__ || (W.__XYSB_CACHE__ = {});
        function _parseRGB(s){
          if(!s) return null; s=String(s).trim();
          var r,g,b, m=s.match(/rgba?\(([^)]+)\)/);
          if(m){ var p=m[1].split(',').map(parseFloat); r=p[0]; g=p[1]; b=p[2]; }
          else if(s.charAt(0)==='#'){ var h=s.slice(1); if(h.length===3) h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
            r=parseInt(h.slice(0,2),16); g=parseInt(h.slice(2,4),16); b=parseInt(h.slice(4,6),16); }
          else return null;
          if(isNaN(r)||isNaN(g)||isNaN(b)) return null;
          return {r:r,g:g,b:b};
        }
        function _rgb2hsl(r,g,b){
          r/=255; g/=255; b/=255;
          var mx=Math.max(r,g,b), mn=Math.min(r,g,b), h, s, l=(mx+mn)/2;
          if(mx===mn){ h=0; s=0; }
          else { var dd=mx-mn; s=l>0.5?dd/(2-mx-mn):dd/(mx+mn);
            if(mx===r) h=(g-b)/dd+(g<b?6:0); else if(mx===g) h=(b-r)/dd+2; else h=(r-g)/dd+4; h/=6; }
          return [h*360, s, l];
        }
        function _applyRGB(c){
          var hsl=_rgb2hsl(c.r,c.g,c.b), H=Math.round(hsl[0]), oS=hsl[1];
          var lum=(0.2126*c.r+0.7152*c.g+0.0722*c.b)/255, dark=lum<0.45;
          var Sp=Math.min(Math.max(oS,0.18),0.45), St=Math.min(oS,0.20);
          var pL=dark?34:93, p2L=dark?42:97, tL=dark?92:24;
          function HS(s,l){ return 'hsl('+H+','+Math.round(s*100)+'%,'+l+'%)'; }
          try{
            D.body.style.setProperty('--xysb-smp-pbase',  HS(Sp,pL));
            D.body.style.setProperty('--xysb-smp-pbase2', HS(Sp,p2L));
            D.body.style.setProperty('--xysb-smp-text',   HS(St,tL));
            var aS=Math.min(Math.max(oS,0.42),0.70), aL=dark?66:46;
            if(oS>=0.08) D.body.style.setProperty('--xysb-smp-accent', 'hsl('+H+','+Math.round(aS*100)+'%,'+aL+'%)');
            else D.body.style.removeProperty('--xysb-smp-accent');
            D.body.setAttribute('data-xysb-auto', dark?'dark':'light');
          }catch(e){}
        }
        function _fallback(){
          try{ var cs=W.getComputedStyle(D.documentElement);
            var c=_parseRGB(cs.getPropertyValue('--SmartThemeBlurTintColor'))||_parseRGB(cs.getPropertyValue('--SmartThemeChatTintColor'));
            if(c){ _applyRGB(c); return; }
          }catch(e){}
          try{ D.body.style.removeProperty('--xysb-smp-pbase'); D.body.style.removeProperty('--xysb-smp-pbase2'); D.body.style.removeProperty('--xysb-smp-text'); D.body.style.removeProperty('--xysb-smp-accent'); }catch(e){}
          try{ D.body.setAttribute('data-xysb-auto','light'); }catch(e){}
        }
        function _detect(){
          if((D.body.getAttribute('data-xysb-theme')||'auto')!=='auto') return;
          var el=D.querySelector('#bg1')||D.querySelector('#bg_custom')||D.body, bi='';
          try{ bi=W.getComputedStyle(el).backgroundImage||''; }catch(e){}
          var um=bi.match(/url\(["']?([^"')]+)["']?\)/);
          if(!um){ _fallback(); return; }
          var url=um[1];
          if(_cache[url]){ _applyRGB(_cache[url]); return; }
          var img=new Image(); img.crossOrigin='anonymous';
          img.onload=function(){
            try{ var cv=D.createElement('canvas'); cv.width=32; cv.height=32;
              var ctx=cv.getContext('2d'); ctx.drawImage(img,0,0,32,32);
              var dt=ctx.getImageData(0,0,32,32).data, sr=0,sg=0,sb=0,n=0;
              for(var i=0;i<dt.length;i+=4){ sr+=dt[i]; sg+=dt[i+1]; sb+=dt[i+2]; n++; }
              var c={r:sr/n,g:sg/n,b:sb/n}; _cache[url]=c; _applyRGB(c);
            }catch(e){ _fallback(); }
          };
          img.onerror=function(){ _fallback(); };
          img.src=url;
        }
        W.__XYSB_DETECT__=_detect;
        var _m='auto'; try{ _m=W.localStorage.getItem('xysb-theme-mode')||'auto'; }catch(e){}
        try{ D.body.setAttribute('data-xysb-theme', _m); }catch(e){}
        _detect(); setTimeout(_detect,400); setTimeout(_detect,1500);
        
        try{
          if(W.__XYSB_BGOBS__) W.__XYSB_BGOBS__.disconnect();
          var _bg=D.querySelector('#bg1')||D.querySelector('#bg_custom');
          if(_bg && W.MutationObserver){
            W.__XYSB_BGOBS__=new W.MutationObserver(function(){ _detect(); });
            W.__XYSB_BGOBS__.observe(_bg,{attributes:true,attributeFilter:['style','src']});
          }
        }catch(e){}

    } catch (e) {}

    var oldRoot = D.getElementById('xysb-root');
    if (oldRoot) oldRoot.remove();
    var wrapper = D.createElement('div');
    wrapper.id = 'xysb-root';
    wrapper.innerHTML = SKELETON;

    function $id(id) { return wrapper.querySelector('#' + id); }
    function setT(id, val) { var el = $id(id); if (el) el.textContent = val; }
    function setW(id, p) { var el = $id(id); if (el) el.style.width = p + '%'; }
    // ——— 性癖（自适应·可调·增删，注入聊天框由剧情/GM执行）———
    var sbCultPend = {}, sbCultOps = [], sbCultOwner = '主角';
    function sbCultCompose() {
        var parts = [];
        for (var hb in sbCultPend) { if (sbCultPend[hb]) parts.push('「' + hb + '」养成' + (sbCultPend[hb] > 0 ? '+' : '') + sbCultPend[hb]); }
        sbCultOps.forEach(function (op) { parts.push(op); });
        if (!parts.length) return '';
        return '（' + (sbCultOwner || '主角') + ' 养成：' + parts.join('、') + '）';
    }
    function sbCultInject() {
        var txt = sbCultCompose(); if (!txt) return;
        var ta = D.getElementById('send_textarea'); if (!ta) return;
        ta.value = (ta.value || '').trim() === '' ? txt : (ta.value.replace(/\s+$/, '') + '\n' + txt);
        try { ta.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {}
        try { ta.focus(); ta.selectionStart = ta.selectionEnd = ta.value.length; } catch (e) {}
        sbCultPend = {}; sbCultOps = [];
        var box = $id('xysb-cultivation');
        if (box) { box.querySelectorAll('.xysb-cd').forEach(function (x) { x.textContent = '0'; }); box.querySelectorAll('.xysb-cdel').forEach(function (b) { b.textContent = '删除'; b.disabled = false; }); }
    }
    function renderCult(tables, owner) {
        sbCultOwner = owner || '主角'; sbCultPend = {}; sbCultOps = [];
        var box = $id('xysb-cultivation'); if (!box) return;
        var cultT = findTable(tables, '性癖') || findTable(tables, '养成') || findTable(tables, '培养'), rows = [];
        if (cultT && cultT.rows.length) {
            cultT.rows.forEach(function (r) {
                var own = cellOf(cultT, r, '所属人物', cellOf(cultT, r, '人物', ''));
                if (!own || own === '—') return;
                if (own !== owner && own !== '主角' && own !== sbCultOwner) return;
                var hb = cellOf(cultT, r, '性癖', cellOf(cultT, r, '项目', ''));
                if (!hb || hb === '—') return;
                rows.push({ hobby: hb, prof: num(cellOf(cultT, r, '养成', cellOf(cultT, r, '熟练', '')), 0) });
            });
        }
        var h = '', items = '';
        if (!rows.length) {
            items = '<div class="xysb-empty">暂 无 性 癖 项 目 —— 可在下方添加，或在剧情中培养</div>';
        } else {
            rows.forEach(function (c) {
                var hb = esc(c.hobby).replace(/"/g, '&quot;'), pv = Math.max(0, Math.min(100, c.prof == null ? 0 : c.prof));
                var _cp = sbCultPend[c.hobby] || 0, _cq = sbCultOps.indexOf('删除性癖「' + c.hobby + '」') >= 0;
                items += '<div class="xysb-cult-item">'
                    + '<div class="xysb-cr1"><span class="xysb-inm">' + esc(c.hobby) + '</span>'
                    + '<span class="xysb-cstep2"><button class="xysb-sbtn xysb-cbtn" data-h="' + hb + '" data-d="-5">−</button><span class="xysb-cd" data-h="' + hb + '">' + (_cp > 0 ? '+' : '') + _cp + '</span><button class="xysb-sbtn xysb-cbtn" data-h="' + hb + '" data-d="5">+</button></span>'
                    + '<button class="xysb-cdel" data-h="' + hb + '"' + (_cq ? ' disabled' : '') + '>' + (_cq ? '待删除' : '删除') + '</button></div>'
                    + '<div class="xysb-cr2"><div class="xysb-bar"><div class="f-cult" style="width:' + pv + '%"></div></div><span class="xysb-cval">' + pv + ' / 100</span></div>';
                
                items += '</div>';
            });
            if (rows.length > 5) items = '<div class="xysb-cult-scroll">' + items + '</div>';
        }
        h = items;
        h += '<div class="xysb-cadd"><input class="xysb-caddinput" placeholder="新增性癖名（如 机械奸 / 触手奸 / 强制高潮）"><button class="xysb-caddbtn">＋ 添加</button></div>'
            + '<button class="xysb-cinject">注 入 聊 天 框</button>';
        box.innerHTML = h;
        box.querySelectorAll('.xysb-cbtn').forEach(function (b) { b.onclick = function () { var hn = b.dataset.h, dd = parseInt(b.dataset.d, 10); sbCultPend[hn] = (sbCultPend[hn] || 0) + dd; var cd = b.parentNode.querySelector('.xysb-cd'); if (cd) cd.textContent = (sbCultPend[hn] > 0 ? '+' : '') + sbCultPend[hn]; }; });
        box.querySelectorAll('.xysb-cdel').forEach(function (b) { b.onclick = function () { var hn = b.dataset.h, tag = '删除养成「' + hn + '」'; if (sbCultOps.indexOf(tag) < 0) sbCultOps.push(tag); b.textContent = '待删除'; b.disabled = true; }; });
        var cab = box.querySelector('.xysb-caddbtn'); if (cab) cab.onclick = function () { var inp = box.querySelector('.xysb-caddinput'), v = (inp && inp.value || '').trim(); if (!v) return; sbCultOps.push('新增性癖「' + v + '」'); inp.value = ''; };
        var inj = box.querySelector('.xysb-cinject'); if (inj) inj.onclick = function () { sbCultInject(); };
    }

    // ——— 世界规则（常驻 GM 指令）·渲染 + 增删改 ———
    function uid() { return 'r' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36); }
    function renderRules() {
        var box = $id('xysb-rules'); if (!box) return;
        var arr = rulesLoad();
        if (!arr.length) {
            box.innerHTML = '<div class="xysb-empty">暂 无 规 则 —— 在下方添加一条常驻 GM 指令</div>';
        } else {
            var h = '';
            arr.forEach(function (r) {
                var on = r.on !== false, id = esc(r.id);
                h += '<div class="xysb-rule-item' + (on ? '' : ' off') + '">'
                    + '<span class="xysb-rule-dot' + (on ? ' on' : '') + '"></span>'
                    + '<span class="xysb-rule-text">' + esc(r.text) + '</span>'
                    + '<button class="xysb-rule-toggle" data-id="' + id + '">' + (on ? '停用' : '启用') + '</button>'
                    + '<button class="xysb-rule-del" data-id="' + id + '">删除</button>'
                    + '</div>';
            });
            box.innerHTML = (arr.length > 6) ? ('<div class="xysb-rule-scroll">' + h + '</div>') : h;
        }
        box.querySelectorAll('.xysb-rule-toggle').forEach(function (b) {
            b.onclick = function () { var id = b.dataset.id, a = rulesLoad(); a.forEach(function (r) { if (r.id === id) r.on = (r.on === false); }); rulesSave(a); renderRules(); };
        });
        box.querySelectorAll('.xysb-rule-del').forEach(function (b) {
            b.onclick = function () { var id = b.dataset.id; rulesSave(rulesLoad().filter(function (r) { return r.id !== id; })); renderRules(); };
        });
        try { rulesSyncInjection(); } catch (e) {}
    }
    function addRuleFromInput() {
        var inp = $id('xysb-raddinput'); if (!inp) return;
        var v = (inp.value || '').trim(); if (!v) return;
        var a = rulesLoad(); a.push({ id: uid(), text: v, on: true }); rulesSave(a);
        inp.value = ''; renderRules();
    }

    // ──────────────────────────── 折叠 / 页签 ────────────────────────────
    var mainCard = $id('xysb-main');
    if (lsGet('xysb_open', '1') === '1') mainCard.classList.add('open');
    $id('xysb-toggle').addEventListener('click', function () {
        lsSet('xysb_open', mainCard.classList.toggle('open') ? '1' : '0');
    });
    var _tbtn = $id('xysb-themebtn');
    if (_tbtn) _tbtn.addEventListener('click', function (ev) {
        ev.stopPropagation(); if (ev.preventDefault) ev.preventDefault();
        var order = ['auto', 'light', 'dark'], cur = D.body.getAttribute('data-xysb-theme') || 'auto';
        var nxt = order[(order.indexOf(cur) + 1) % order.length];
        D.body.setAttribute('data-xysb-theme', nxt);
        try { W.localStorage.setItem('xysb-theme-mode', nxt); } catch (e) {}
        try { if (W.__XYSB_DETECT__) W.__XYSB_DETECT__(); } catch (e) {}
    });

    function bindTabs(tabSel, paneSel, lsKey, defKey) {
        var saved = lsGet(lsKey, defKey);
        var tabs = wrapper.querySelectorAll(tabSel);
        var panes = wrapper.querySelectorAll(paneSel);
        function activate(k) {
            tabs.forEach(function (t) { t.classList.toggle('active', t.dataset.tab === k); });
            panes.forEach(function (p) { p.classList.toggle('active', p.dataset.pane === k); });
        }
        activate(saved);
        var anyActive = false;
        tabs.forEach(function (t) { if (t.classList.contains('active')) anyActive = true; });
        if (!anyActive) activate(defKey);
        tabs.forEach(function (t) {
            t.addEventListener('click', function () {
                activate(t.dataset.tab);
                lsSet(lsKey, t.dataset.tab);
            });
        });
    }
    bindTabs('.xysb-tab', '.xysb-pane', 'xysb_tab', 'over');

    // —— 世界规则控件绑定 ——
    renderRules();
    (function () {
        var rb = $id('xysb-raddbtn'); if (rb) rb.onclick = addRuleFromInput;
        var ri = $id('xysb-raddinput'); if (ri) ri.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); addRuleFromInput(); } });
        var rj = $id('xysb-rinject'); if (rj) rj.onclick = function () { rulesPrependToTextarea(false); };
        var ra = $id('xysb-rauto');
        if (ra) { ra.checked = (lsGet(RULE_AUTO_KEY, '1') === '1'); ra.onchange = function () { lsSet(RULE_AUTO_KEY, ra.checked ? '1' : '0'); rulesSyncInjection(); }; }
    })();
    installRuleSendHook();

    // —— 地图视图切换（战区 / 城市 / 内景）——
    var _mapView = 'local', _mapSig = null, _mapAvail = { world: true, local: false, detail: false };
    function _applyMapView() {
        wrapper.querySelectorAll('.xysb-mview').forEach(function (b) {
            var v = b.dataset.view, en = !!_mapAvail[v];
            b.classList.toggle('active', v === _mapView);
            b.classList.toggle('xysb-dis', !en);
            b.disabled = !en;
        });
        var wo = $id('xysb-map'), lo = $id('xysb-local'), de = $id('xysb-detail');
        if (wo) wo.style.display = _mapView === 'world' ? '' : 'none';
        if (lo) lo.style.display = _mapView === 'local' ? '' : 'none';
        if (de) de.style.display = _mapView === 'detail' ? '' : 'none';
    }
    function _finestView() { return _mapAvail.detail ? 'detail' : (_mapAvail.local ? 'local' : 'world'); }
    function setMapView(v, avail, sig) {
        if (avail) _mapAvail = avail;
        if (v) {
            if (!_mapAvail[v]) return;
            _mapView = v; lsSet('xysb_map_view', v);
        } else {
            if (sig !== _mapSig) { _mapSig = sig; _mapView = _finestView(); }
            else if (!_mapAvail[_mapView]) _mapView = _finestView();
        }
        _applyMapView();
    }
    wrapper.querySelectorAll('.xysb-mview').forEach(function (b) {
        b.addEventListener('click', function () { if (!b.disabled) setMapView(b.dataset.view); });
    });
    _applyMapView();

    // ──────────────────────────── 数据渲染 ────────────────────────────
    function setBadge(cls, text) {
        var b = $id('xysb-badge');
        if (!b) return;
        b.className = 'xysb-badge ' + cls;
        b.textContent = text;
    }
    function chip(cls, text) {
        if (!text || text === '—') return '';
        return '<span class="xysb-chip ' + cls + '">' + esc(text) + '</span>';
    }

    function updatePortrait() {
        try {
            var pimg = $id('xysb-portrait-img'), pph = $id('xysb-portrait-ph');
            if (!pimg) return;
            var chat = D.getElementById('chat');
            var src = '';
            if (chat) {
                var imgs = chat.querySelectorAll('.mes_text img');
                for (var i = imgs.length - 1; i >= 0; i--) {
                    var u = imgs[i].getAttribute('src') || imgs[i].src || '';
                    if (u && !/^data:image\/gif/i.test(u)) { src = u; break; }
                }
            }
            if (src) {
                if (pimg.getAttribute('src') !== src) pimg.setAttribute('src', src);
                pimg.style.display = '';
                if (pph) pph.style.display = 'none';
            } else {
                pimg.removeAttribute('src');
                pimg.style.display = 'none';
                if (pph) pph.style.display = '';
            }
        } catch (e) {}
    }

    function render() {
        try { rulesSyncInjection(); } catch (e) {}
        var api = getDB();
        var tables = readTables();
        if (!api) setBadge('err', '✕ 未连接数据库');
        else if (!tables || !Object.keys(tables).length) setBadge('warn', '⌛ 等待首次填表');
        else setBadge('ok', '✓ 已同步');
        tables = tables || {};

        var prof = findTable(tables, '主角档案');
        var stat = findTable(tables, '主角状态');
        var cult = findTable(tables, '等级');
        var glob = findTable(tables, '全局');
        var bodyT = findTable(tables, '躯体');
        var arts = findTable(tables, '招式');
        var treas = findTable(tables, '星器');
        var npc = findTable(tables, '重要人物');
        var foes = findTable(tables, '在场敌人') || findTable(tables, '敌人');
        var bag = findTable(tables, '行囊') || findTable(tables, '背包');
        var quest = findTable(tables, '委托');

        var pr = firstRow(prof), st = firstRow(stat), cu = firstRow(cult), gl = firstRow(glob);

        // —— 身份判定：魔人/魔物 vs 魔法少女（决定阶梯·称谓·配色）——
        var _identRaw = cellOf(prof, pr, '身份阵营', cellOf(prof, pr, '阵营', cellOf(prof, pr, '身份', '')));
        var _sysRaw = cellOf(prof, pr, '系别', '');
        var _rankRaw = cellOf(cult, cu, '阶级', '');
        var _roleStr = _identRaw + ' ' + _sysRaw + ' ' + _rankRaw;
        var isFallen = /恶堕/.test(_roleStr) && /魔法少女|守护者|魔法/.test(_roleStr);
        var roleDemon = /魔人|魔物|深渊|同盟|位格|孳生体|蚀魂者|化渊者|噬星者|渊厄/.test(_roleStr) || isFallen;
        var rootEl = D.getElementById('xysb-root');
        if (rootEl) rootEl.setAttribute('data-xysb-role', roleDemon ? 'demon' : 'mahou');
        // 「恶堕·侵蚀」是魔法少女专属堕落轨；魔人/魔物视角不存在此机制 → 整栏隐藏
        var _corrMod = D.getElementById('xysb-corrmod');
        if (_corrMod) _corrMod.style.display = roleDemon ? 'none' : '';
        // 标签随身份改写（仅显示层，数据本身不动）
        if (roleDemon) {
            setT('xysb-corrlabel', '魔 性 · 侵 蚀');
            setT('xysb-lbl-form', '现形:');
            setT('xysb-lbl-sys', '本能:');
            setT('xysb-lbl-attire', '形态:');
            setT('xysb-lbl-arts', '⛧ 魔 技 · 异 能');
        } else {
            setT('xysb-corrlabel', '恶 堕 · 侵 蚀');
            setT('xysb-lbl-form', '变身:');
            setT('xysb-lbl-sys', '系别:');
            setT('xysb-lbl-attire', '战服:');
            setT('xysb-lbl-arts', '✨ 招 式 · 技 能');
        }

        // —— 标题 ——
        var name = cellOf(prof, pr, '代号', cellOf(prof, pr, '姓名', '—'));
        setT('xysb-title', name !== '—' ? name + (roleDemon ? ' 的 魔 契 面 板' : ' 的 状 态 栏') : (roleDemon ? '魔 契 面 板' : '魔 法 少 女 状 态 栏'));

        // —— 等级阶级 ——（把身份传进去：魔人空/含糊阶级时映射深渊位格而非战姬）
        var R = levelInfo(_rankRaw, cellOf(cult, cu, '等级', ''), roleDemon);
        setT('xysb-realm', R.label);
        var ident = cellOf(prof, pr, '阵营', cellOf(prof, pr, '身份', '—'));
        var root = cellOf(prof, pr, '系别', '—');
        var phys = cellOf(prof, pr, '亲和', '—');
        var descParts = [];
        if (ident !== '—') descParts.push(ident);
        var talent = (root !== '—' ? root : '') + (phys !== '—' && phys !== '无' && phys !== '无特殊' ? (root !== '—' ? '＋' : '') + phys : '');
        if (talent) descParts.push(talent);
        setT('xysb-realmdesc', descParts.length ? descParts.join('，') : '—');
        var expP = pair(cellOf(cult, cu, '当前经验', '0'), Math.max(1, num(cellOf(cult, cu, '升级所需', '100'), 100)));
        var expMax = num(cellOf(cult, cu, '升级所需', String(expP[1])), expP[1]);
        if (expMax > 0) expP[1] = expMax;
        var prog = pct(expP[0], expP[1]);
        setT('xysb-cult', expP[0]); setT('xysb-cultmax', expP[1]); setW('xysb-cultbar', prog);
        var bott = cellOf(cult, cu, '瓶颈', cellOf(cult, cu, '越阶', '—'));
        setT('xysb-bottleneck', bott !== '—' ? '瓶颈：' + bott : (R.name ? R.name + '阶 · 距下一级约 ' + Math.max(0, expP[1] - expP[0]) + ' 经验' : '—'));

        // —— 当前状态 ——
        var hpP = pair(cellOf(stat, st, '生命', '0'), 100);
        var mpP = pair(cellOf(stat, st, '魔力', '0'), 100);
        var cond = cellOf(stat, st, '处境', '—');
        var tone = condTone(cond, pct(hpP[0], hpP[1]));
        var dot = $id('xysb-dot');
        if (dot) dot.className = 'xysb-dot ' + tone;
        setT('xysb-cond', cond);

        // —— 生命魔力 ——
        setT('xysb-hp', hpP[0]); setT('xysb-hpmax', hpP[1]); setW('xysb-hpbar', pct(hpP[0], hpP[1]));
        setT('xysb-mp', mpP[0]); setT('xysb-mpmax', mpP[1]); setW('xysb-mpbar', pct(mpP[0], mpP[1]));

        // —— 恶堕侵蚀（魔人显示「魔性」语义，数据按同一序号映射，不改库）——
        var corrStageRaw = cellOf(stat, st, '恶堕阶段', cellOf(stat, st, '恶堕', '未染'));
        var corrVal = Math.max(0, Math.min(100, num(cellOf(stat, st, '侵蚀值', cellOf(stat, st, '侵蚀', '0')), 0)));
        var CORR_STAGES = ['未染', '初蚀', '沉沦', '半堕', '恶堕'];
        var DEMON_STAGES = ['蛰伏', '躁动', '嗜杀', '狂噬', '魔威'];
        var corrIdx = 0; for (var cs2 = 0; cs2 < CORR_STAGES.length; cs2++) { if (String(corrStageRaw).indexOf(CORR_STAGES[cs2]) !== -1) { corrIdx = cs2; break; } }
        var STG = roleDemon ? DEMON_STAGES : CORR_STAGES;
        var corrBadge = $id('xysb-corrstage');
        if (corrBadge) { corrBadge.textContent = STG[corrIdx]; corrBadge.className = 'xysb-corrstage cs' + corrIdx; }
        setT('xysb-corr', corrVal); setW('xysb-corrbar', corrVal);
        var corrBar = $id('xysb-corrbar'); if (corrBar) corrBar.className = 'f-corr cs' + corrIdx;
        var CORR_NOTE = ['尚未沾染深渊气息', '已现侵蚀征兆，需加警惕', '心神渐被侵染，宜尽早净化', '濒临失控边缘，亟需净化', '已然恶堕 · 世界级威胁'];
        var DEMON_NOTE = ['魔性内敛 · 理智在握', '嗜血渐起 · 杀意微露', '魔性上涌 · 渐难自抑', '濒临狂化 · 理智将崩', '魔威尽显 · 灾劫降世'];
        setT('xysb-corrnote', (roleDemon ? DEMON_NOTE : CORR_NOTE)[corrIdx]);

        // —— 行踪境况 ——
        setT('xysb-loc', cellOf(glob, gl, '地点', '—'));
        setT('xysb-time', cellOf(glob, gl, '当前时间', cellOf(glob, gl, '时间', '—')));
        var form = cellOf(stat, st, '形态', cellOf(prof, pr, '形态', cellOf(prof, pr, '当前形态', '—')));
        var _attire = cellOf(stat, st, '战服', '—');
        if ((_attire === '—' || _attire === '') && /原形|本体|兽形|兽身|现出原形|现形/.test(form)) _attire = '原形·无衣冠';
        setT('xysb-attire', _attire);
        var _isXformed = xysbTransformed(form, _attire, roleDemon);
        var war = cellOf(stat, st, '战况', '—');
        setT('xysb-war2', war);

        // —— 地图 ——
        renderMap(tables, cellOf(glob, gl, '地点', ''), cellOf(glob, gl, '去向', ''));

        // —— 角色档案 ——
        setT('xysb-name', name);
        setT('xysb-gender', cellOf(prof, pr, '性别', '—'));
        setT('xysb-age', cellOf(prof, pr, '年龄', '—'));
        setT('xysb-ident', ident);
        setT('xysb-root2', root);
        setT('xysb-phys', phys);
        setT('xysb-look', cellOf(prof, pr, '外貌', '—'));
        // —— 声望 ——
        var _rep = num(cellOf(prof, pr, '声望值', ''), null), _repN = cellOf(prof, pr, '声望性质', ''), _fame = num(cellOf(prof, pr, '知名度', ''), null);
        var _rv = Math.max(-100, Math.min(100, _rep == null ? 0 : _rep));
        var _rcol = _rv >= 30 ? '#2f8a7c' : (_rv <= -30 ? '#c25575' : '#9a8f5a');
        setT('xysb-rep', _rep == null ? '0' : String(_rep));
        setT('xysb-repnature', (_repN && _repN !== '—') ? _repN : (_rep == null ? '默默无闻' : (_rv >= 30 ? '美名在外' : (_rv <= -30 ? '恶名昭著' : '小有名气'))));
        var _re = $id('xysb-rep'); if (_re) _re.style.color = _rcol;
        var _rd = $id('xysb-repdot'); if (_rd) { _rd.style.left = ((_rv + 100) / 200 * 100).toFixed(1) + '%'; _rd.style.background = _rcol; }
        setT('xysb-fame', _fame == null ? '0' : String(_fame));
        setW('xysb-famebar', _fame == null ? 0 : Math.max(0, Math.min(100, _fame)));
        // —— 情欲 ——
        var _lust = num(cellOf(stat, st, '情欲', ''), null);
        setT('xysb-lust', _lust == null ? '0' : String(_lust));
        setW('xysb-lustbar', _lust == null ? 0 : Math.max(0, Math.min(100, _lust)));
        (function(){
            var _lb = $id('xysb-lustbar');
            var _box = _lb ? (_lb.closest ? _lb.closest('.xysb-lust3') : (_lb.parentNode && _lb.parentNode.parentNode)) : null;
            if (_box) {
                var _bar = _lb.parentNode;
                if (_lust != null && _lust >= 100) {
                    if (!_box.classList.contains('xysb-climax')) {
                        _box.classList.add('xysb-climax');
                        if (_bar && !_bar.querySelector('span.xysb-sweep')) { var _sw = D.createElement('span'); _sw.className = 'xysb-sweep'; _bar.appendChild(_sw); }
                    }
                } else {
                    _box.classList.remove('xysb-climax');
                    if (_bar) { var _old = _bar.querySelector('span.xysb-sweep'); if (_old) _old.parentNode.removeChild(_old); }
                }
            }
        })();
        // —— 性癖 ——
        renderCult(tables, name);
        updatePortrait();

        setT('xysb-form', form);
        var bodyL = $id('xysb-bodyrows-L'), bodyR = $id('xysb-bodyrows-R');
        if (bodyT && bodyT.rows.length) {
            var lHtml = '', rHtml = '', anyArmor = false;
            bodyT.rows.forEach(function (r) {
                var part = cellOf(bodyT, r, '部位', '—');
                if (part === '—') return;
                var desc = cellOf(bodyT, r, '白描', '—');
                var armor = cellOf(bodyT, r, '变身装甲', cellOf(bodyT, r, '魔法武装', cellOf(bodyT, r, '装甲', cellOf(bodyT, r, '战甲', cellOf(bodyT, r, '披挂', cellOf(bodyT, r, '装束', ''))))));
                lHtml += '<div class="xysb-krow"><span class="nk">' + esc(part) + '</span><span class="nv">' + esc(desc) + '</span></div>';
                if (armor && armor !== '—' && armor !== '') {
                    anyArmor = true;
                    rHtml += '<div class="xysb-krow"><span class="nk">' + esc(part) + '</span><span class="nv">' + esc(armor) + '</span></div>';
                }
            });
            bodyL.innerHTML = lHtml || '<div class="xysb-empty">暂 无 记 录</div>';
            if (!_isXformed) bodyR.innerHTML = '<div class="xysb-empty">' + (roleDemon ? '未 现 形 · 无 甲 壳' : '未 变 身 · 无 战 装') + '</div>';
            else if (anyArmor) bodyR.innerHTML = rHtml;
            else bodyR.innerHTML = (_attire && _attire !== '—')
                ? ('<div class="xysb-krow"><span class="nk">整体战服</span><span class="nv">' + esc(_attire) + '</span></div><div class="xysb-bp2-hint">逐部位的变身装甲/服饰，可在「躯体表」加一列「变身装甲」后分条显示。</div>')
                : '<div class="xysb-empty">暂 无 记 录</div>';
        } else { bodyL.innerHTML = '<div class="xysb-empty">暂 无 记 录</div>'; bodyR.innerHTML = '<div class="xysb-empty">暂 无 记 录</div>'; }

        // —— 招式 ——
        var artBox = $id('xysb-arts');
        if (arts && arts.rows.length) {
            var aHtml = '';
            arts.rows.forEach(function (r) {
                var an = cellOf(arts, r, '名称', '—');
                if (an === '—') return;
                aHtml += '<div class="xysb-item"><div class="xysb-itop"><span class="xysb-inm">' + esc(an) + '</span>'
                    + chip('violet', cellOf(arts, r, '品阶', '')) + chip('blue', cellOf(arts, r, '类型', '')) + chip('rose', cellOf(arts, r, '蓝耗', '') ? ('蓝耗 ' + cellOf(arts, r, '蓝耗', '')) : '') + chip('teal', cellOf(arts, r, '熟练度', ''))
                    + '</div><div class="xysb-irow">' + esc(cellOf(arts, r, '效果', '—')) + '</div></div>';
            });
            artBox.innerHTML = aHtml || '<div class="xysb-empty">尚 未 习 得 招 式</div>';
        } else artBox.innerHTML = '<div class="xysb-empty">尚 未 习 得 招 式</div>';

        // —— 星器 ——
        var treaBox = $id('xysb-treas');
        if (treas && treas.rows.length) {
            var tHtml = '';
            treas.rows.forEach(function (r) {
                var tn = cellOf(treas, r, '名称', '—');
                if (tn === '—') return;
                tHtml += '<div class="xysb-item"><div class="xysb-itop"><span class="xysb-inm">' + esc(tn) + '</span>'
                    + chip('gold', cellOf(treas, r, '品阶', '')) + chip('blue', cellOf(treas, r, '类型', '')) + chip('violet', cellOf(treas, r, '契合', ''))
                    + '</div><div class="xysb-irow">' + esc(cellOf(treas, r, '效果', '—')) + '</div></div>';
            });
            treaBox.innerHTML = tHtml || '<div class="xysb-empty">身 无 长 物</div>';
        } else treaBox.innerHTML = '<div class="xysb-empty">身 无 长 物</div>';

        // —— 星灵 / 变身 ——（无专表时从 主角档案/状态/躯体 兜底；有「星灵表」则优先）
        var spT = findTable(tables, '星灵') || findTable(tables, '契灵') || findTable(tables, '星辉灵');
        var spR = firstRow(spT);
        var spName = cellOf(spT, spR, '名号', cellOf(spT, spR, '名称', cellOf(spT, spR, '星灵名', cellOf(prof, pr, '星灵', cellOf(prof, pr, '契灵', '')))));
        setT('xysb-sp-name', (spName && spName !== '—') ? spName : '尚 未 显 名');
        var spForm = cellOf(spT, spR, '本相', cellOf(spT, spR, '样貌', cellOf(spT, spR, '形态', cellOf(prof, pr, '星灵本相', ''))));
        setT('xysb-sp-form', (spForm && spForm !== '—') ? spForm : '—');
        var _stgName = (roleDemon ? DEMON_STAGES : CORR_STAGES)[corrIdx] || '未染';
        var spStateParts = [];
        var spStateExtra = cellOf(spT, spR, '现状', cellOf(spT, spR, '状态', ''));
        if (spStateExtra && spStateExtra !== '—') spStateParts.push(spStateExtra);
        if (/幻化|武器化|武装化|兵装|化形为|化作|化为兵|凝形为/.test(form)) spStateParts.push('已幻化为武装形态');
        if (corrVal > 0 || corrIdx > 0) spStateParts.push('受侵蚀（' + _stgName + ' · ' + corrVal + '）');
        setT('xysb-sp-state', spStateParts.length ? spStateParts.join('；') : '安栖于星器 · 灵息平稳');
        var spBond = cellOf(spT, spR, '羁绊', cellOf(spT, spR, '心智', cellOf(spT, spR, '亲密', '')));
        setT('xysb-sp-bond', (spBond && spBond !== '—') ? spBond : '—');
        var _transTxt = roleDemon ? (_isXformed ? '已现形' : '未现形') : (_isXformed ? '已变身' : '未变身');
        setT('xysb-sp-trans', _transTxt);
        setT('xysb-sp-attire', _attire);
        if (roleDemon) {
            setT('xysb-sp-mod1lbl', '星 髓 · 本 相'); setT('xysb-sp-mod2lbl', '现 形 · 魔 装');
            setT('xysb-sp-translbl', '现形:'); setT('xysb-sp-attirelbl', '形态:');
            setT('xysb-bp2-hl', '躯 壳 白 描'); setT('xysb-bp2-hr', '现 形 · 甲 壳');
        } else {
            setT('xysb-sp-mod1lbl', '星 灵 · 本 相'); setT('xysb-sp-mod2lbl', '变 身 · 武 装');
            setT('xysb-sp-translbl', '变身:'); setT('xysb-sp-attirelbl', '战甲:');
            setT('xysb-bp2-hl', '躯 体 白 描'); setT('xysb-bp2-hr', '变 身 装 甲 · 服 饰');
        }

        // —— 人物 ——（升级：性别年龄·生命魔力·躯体拆分·招式，与主面板细节看齐）
        var npcBox = $id('xysb-npcs');
        function splitBody(s) {
            s = String(s || '').trim();
            if (!s || s === '—') return [];
            return s.split(/[；;\n]+/).map(function (seg) {
                seg = seg.trim(); if (!seg) return null;
                var ci = seg.search(/[:：]/);
                if (ci > -1) return { part: seg.slice(0, ci).trim(), desc: seg.slice(ci + 1).trim() };
                return { part: '', desc: seg };
            }).filter(Boolean);
        }
        if (npc && npc.rows.length) {
            var nHtml = '';
            npc.rows.forEach(function (r) {
                var nn = cellOf(npc, r, '姓名', '—');
                if (nn === '—') return;
                var favor = num(cellOf(npc, r, '好感', ''), null);
                var fcls = favor == null ? 'mid' : (favor >= 30 ? 'hi' : (favor <= -30 ? 'lo' : 'mid'));
                var sexAge = cellOf(npc, r, '性别', '');
                var nHp = cellOf(npc, r, '生命', ''), nHpM = cellOf(npc, r, '生命上限', '');
                var nMp = cellOf(npc, r, '魔力', ''), nMpM = cellOf(npc, r, '魔力上限', '');
                var nArts = cellOf(npc, r, '招式', cellOf(npc, r, '技能', cellOf(npc, r, '手段', '')));
                var bodyArr = splitBody(cellOf(npc, r, '躯体', ''));
                nHtml += '<div class="xysb-item"><div class="xysb-itop"><span class="xysb-inm">' + esc(nn) + '</span>'
                    + chip('teal', cellOf(npc, r, '身份', '')) + chip('violet', cellOf(npc, r, '等级', '')) + chip('blue', sexAge) + (cellOf(npc, r, '恶堕', '') ? chip('rose', '堕·' + cellOf(npc, r, '恶堕', '')) : '')
                    + (favor == null ? '' : '<span class="xysb-chip ' + (fcls === 'hi' ? 'teal' : fcls === 'lo' ? 'rose' : 'blue') + '">好感 ' + favor + '</span>')
                    + '</div>';
                if (nHp !== '' || nMp !== '') {
                    nHtml += '<div class="xysb-krow"><span class="nk">生命/魔力</span><span class="nv">' + esc(nHp || '—') + (nHpM ? ' / ' + esc(nHpM) : '') + '　·　' + esc(nMp || '—') + (nMpM ? ' / ' + esc(nMpM) : '') + '</span></div>';
                }
                nHtml += '<div class="xysb-krow"><span class="nk">关系</span><span class="nv">' + esc(cellOf(npc, r, '关系', '—')) + '</span></div>'
                    + '<div class="xysb-krow"><span class="nk">状态</span><span class="nv">' + esc(cellOf(npc, r, '当前状态', '—')) + '</span></div>';
                if (nArts) nHtml += '<div class="xysb-krow"><span class="nk">招式</span><span class="nv">' + esc(nArts) + '</span></div>';
                if (bodyArr.length) {
                    nHtml += '<div class="xysb-krow" style="margin-top:2px"><span class="nk">躯体</span><span class="nv"></span></div>';
                    bodyArr.forEach(function (b) {
                        nHtml += '<div class="xysb-krow" style="margin-left:10px"><span class="nk">' + (b.part ? esc(b.part) : '·') + '</span><span class="nv">' + esc(b.desc) + '</span></div>';
                    });
                }
                nHtml += '<div class="xysb-krow"><span class="nk">钩子/秘密</span><span class="nv">' + esc(cellOf(npc, r, '钩子', '—')) + '</span></div>'
                    + '<div class="xysb-krow"><span class="nk">最后出场</span><span class="nv">' + esc(cellOf(npc, r, '最后出场', '—')) + '</span></div>'
                    + '</div>';
            });
            npcBox.innerHTML = nHtml || '<div class="xysb-empty">暂 无 人 物 档 案</div>';
        } else npcBox.innerHTML = '<div class="xysb-empty">暂 无 人 物 档 案</div>';

        // —— 敌情 ——
        var foeBox = $id('xysb-foes');
        if (foes && foes.rows.length) {
            var fHtml = '';
            foes.rows.forEach(function (r) {
                var fn = cellOf(foes, r, '名称', '—');
                if (fn === '—') return;
                var fhp = pair(cellOf(foes, r, '生命', '0'), Math.max(1, num(cellOf(foes, r, '生命上限', '100'), 100)));
                var fmax = num(cellOf(foes, r, '生命上限', String(fhp[1])), fhp[1]);
                if (fmax > 0) fhp[1] = fmax;
                fHtml += '<div class="xysb-item" style="--accent:#e26d8c"><div class="xysb-itop"><span class="xysb-inm">' + esc(fn) + '</span>'
                    + chip('rose', cellOf(foes, r, '威胁', '')) + '</div>'
                    + '<div class="xysb-mobhp"><span>生命</span><span>' + fhp[0] + ' / ' + fhp[1] + '</span></div>'
                    + '<div class="xysb-mobbar"><div style="width:' + pct(fhp[0], fhp[1]) + '%"></div></div>'
                    + '<div class="xysb-krow" style="margin-top:5px"><span class="nk">状态</span><span class="nv">' + esc(cellOf(foes, r, '状态', '—')) + '</span></div>'
                    + '<div class="xysb-krow"><span class="nk">手段</span><span class="nv">' + esc(cellOf(foes, r, '手段', '—')) + '</span></div>'
                    + '</div>';
            });
            foeBox.innerHTML = fHtml || '<div class="xysb-empty">当 前 无 在 场 敌 人</div>';
        } else foeBox.innerHTML = '<div class="xysb-empty">当 前 无 在 场 敌 人</div>';

        // —— 行囊 ——
        var bagBox = $id('xysb-bag');
        if (bag && bag.rows.length) {
            var gHtml = '';
            bag.rows.forEach(function (r) {
                var inm = cellOf(bag, r, '物品名', '—');
                if (inm === '—') return;
                var _bcat = cellOf(bag, r, '类别', '');
                if (/星灵|契灵|附身|本命|星兽|星辉灵|灵宠|本源星/.test(inm) || /星灵|契灵|附身/.test(_bcat)) return; // 星灵不入行囊
                var note = cellOf(bag, r, '备注', '');
                gHtml += '<div class="xysb-item"><div class="xysb-itop"><span class="xysb-inm">' + esc(inm) + '</span>'
                    + '<span class="xysb-cnt">×' + esc(cellOf(bag, r, '数量', '1')) + '</span>'
                    + chip('blue', cellOf(bag, r, '类别', ''))
                    + '</div>'
                    + (note && note !== '—' ? '<div class="xysb-irow">' + esc(note) + '</div>' : '')
                    + '</div>';
            });
            bagBox.innerHTML = gHtml || '<div class="xysb-empty">囊 中 空 空</div>';
        } else bagBox.innerHTML = '<div class="xysb-empty">囊 中 空 空</div>';

        var questBox = $id('xysb-quests');
        if (quest && quest.rows.length) {
            var qHtml = '';
            quest.rows.forEach(function (r) {
                var qn = cellOf(quest, r, '名称', '—');
                if (qn === '—') return;
                var qs = cellOf(quest, r, '状态', '—');
                var qcls = /完成|了结|达成/.test(qs) ? 'teal' : (/失败|断绝/.test(qs) ? 'rose' : (/进行|追查|未了/.test(qs) ? 'gold' : 'blue'));
                qHtml += '<div class="xysb-item" style="--accent:#4f8de0"><div class="xysb-itop"><span class="xysb-inm">' + esc(qn) + '</span>'
                    + chip('blue', cellOf(quest, r, '类型', '')) + chip(qcls, qs)
                    + '</div><div class="xysb-irow">' + esc(cellOf(quest, r, '进展', '—')) + '</div></div>';
            });
            questBox.innerHTML = qHtml || '<div class="xysb-empty">暂 无 挂 牵</div>';
        } else questBox.innerHTML = '<div class="xysb-empty">暂 无 挂 牵</div>';
    }

    // ──────────────────────────── 挂载与刷新 ────────────────────────────
    function ensureMount() {
        var chat = D.getElementById('chat');
        if (!chat) return;
        var mesList = chat.querySelectorAll('.mes');
        if (!mesList.length) {
            if (wrapper.isConnected) wrapper.remove();
            return;
        }
        var last = mesList[mesList.length - 1];
        var block = last.querySelector('.mes_block') || last;
        if (wrapper.parentNode !== block || block.lastElementChild !== wrapper) {
            block.appendChild(wrapper);
        }
    }

    var debounceTimer = null;
    function debouncedMount() {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(ensureMount, 150);
    }

    var observer = new MO(debouncedMount);
    var observedChat = null;
    function startObserve() {
        var chat = D.getElementById('chat');
        if (chat && observedChat !== chat) {
            try { observer.disconnect(); } catch (e) {}
            observer.observe(chat, { childList: true });
            observedChat = chat;
        }
    }

    var boundApi = null;
    function onTableUpdate() { try { render(); } catch (e) {} }
    function bindApi() {
        var api = getDB();
        if (api && api !== boundApi) {
            boundApi = api;
            try {
                if (typeof api.registerTableUpdateCallback === 'function') {
                    api.registerTableUpdateCallback(onTableUpdate);
                }
            } catch (e) {}
            try { render(); } catch (e) {}
        }
    }

        var heartbeat = setInterval(function () {
        bindApi();
        startObserve();
        ensureMount();
        updatePortrait();
    }, 1500);

    W.__XYSB_CLEANUP__ = function () {
        try { clearInterval(heartbeat); } catch (e) {}
        try { observer.disconnect(); } catch (e) {}
        try { wrapper.remove(); } catch (e) {}
        try { var s = D.getElementById('xysb-style'); if (s) s.remove(); } catch (e) {}
        try { D.body.removeAttribute('data-xysb-hideimg'); } catch (e) {}
        try {
            if (W.__XYSB_RULEHOOK__) {
                D.removeEventListener('keydown', W.__XYSB_RULEHOOK__.kd, true);
                D.removeEventListener('click', W.__XYSB_RULEHOOK__.cl, true);
                delete W.__XYSB_RULEHOOK__;
            }
        } catch (e) {}
        try {
            if (boundApi && typeof boundApi.unregisterTableUpdateCallback === 'function') {
                boundApi.unregisterTableUpdateCallback(onTableUpdate);
            }
        } catch (e) {}
        try { delete W.__XYSB_CLEANUP__; } catch (e) {}
    };

    try { render(); } catch (e) {}
    bindApi();
    startObserve();
    ensureMount();
})();
