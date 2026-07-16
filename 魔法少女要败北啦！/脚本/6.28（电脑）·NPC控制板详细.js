(function () {
  'use strict';
  var W; try { W = (window.parent && window.parent.document) ? window.parent : window; } catch (e) { W = window; }
  var D = W.document, EV = W.Event || Event;
  var SELF = (Date.now() + '_' + Math.random().toString(36).slice(2));  // 本次脚本执行(iframe)的唯一归属令牌

  function getAPI() { try { return W.AutoCardUpdaterAPI || window.AutoCardUpdaterAPI || null; } catch (e) { return null; } }
  function lsGet(k, d) { try { var v = W.localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { W.localStorage.setItem(k, v); } catch (e) { } }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function num(v, d) { var m = String(v == null ? '' : v).match(/-?\d+(\.\d+)?/); return m ? Math.round(parseFloat(m[0])) : (d === undefined ? 0 : d); }
  function pair(v, defMax) {
    var s = String(v == null ? '' : v);
    var m = s.match(/(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)/);
    if (m) return [Math.round(parseFloat(m[1])), Math.round(parseFloat(m[2]))];
    var n = num(s, null);
    return [n == null ? 0 : n, defMax || 100];
  }
  function readTables() { var api = getAPI(); if (!api || typeof api.exportTableAsJson !== 'function') return null; var j = null; try { j = api.exportTableAsJson(); } catch (e) { return null; } if (!j || typeof j !== 'object') return {}; var t = {}; for (var k in j) { var s = j[k]; if (s && s.name && Array.isArray(s.content) && s.content.length) { t[s.name] = { headers: s.content[0] || [], rows: s.content.slice(1) }; } } return t; }
  function findTable(t, kw) { if (!t) return null; if (t[kw]) return t[kw]; for (var n in t) { if (n.indexOf(kw) !== -1) return t[n]; } return null; }
  function colOf(tb, kw) { if (!tb) return -1; for (var i = 0; i < tb.headers.length; i++) { if (String(tb.headers[i]).indexOf(kw) !== -1) return i; } return -1; }
  function cellOf(tb, row, kw, df) { var i = colOf(tb, kw); if (i < 0 || !row || row[i] == null) return df; var v = String(row[i]).trim(); return (v === '' || v === 'null' || v === 'undefined') ? df : v; }

  var conNPCs = [], conSel = 0, conView = 'state', conPend = { fav: 0, hp: 0, mp: 0, rep: 0, fame: 0, lust: 0, cult: {}, cultOps: [] };
  function conReadNPCs() {
    var tables = readTables(), out = [];
    // —— 性癖表 → 按所属人物分组 ——
    var cultMap = {};
    var cultT = findTable(tables, '性癖') || findTable(tables, '养成') || findTable(tables, '培养');
    if (cultT && cultT.rows.length) {
      cultT.rows.forEach(function (cr) {
        var own = cellOf(cultT, cr, '所属人物', cellOf(cultT, cr, '人物', ''));
        var hb = cellOf(cultT, cr, '性癖', cellOf(cultT, cr, '项目', ''));
        if (!own || own === '—' || !hb || hb === '—') return;
        (cultMap[own] = cultMap[own] || []).push({ hobby: hb, prof: num(cellOf(cultT, cr, '养成', cellOf(cultT, cr, '熟练', '')), 0) });
      });
    }
    // —— 重要人物（与状态栏一致：重要人物 → 人物 回退）——
    var npc = findTable(tables, '重要人物') || findTable(tables, '人物');
    if (npc && npc.rows.length) {
      npc.rows.forEach(function (r) {
        var nn = cellOf(npc, r, '姓名', cellOf(npc, r, '名称', '')); if (!nn || nn === '—') return;
        out.push({
          kind: 'npc',
          name: nn, ident: cellOf(npc, r, '身份', ''), realm: cellOf(npc, r, '等级', ''), corr: cellOf(npc, r, '恶堕', ''), hp: num(cellOf(npc, r, '生命', ''), null), hpmax: Math.max(1, num(cellOf(npc, r, '生命上限', ''), 100)), mp: num(cellOf(npc, r, '魔力', ''), null), mpmax: Math.max(1, num(cellOf(npc, r, '魔力上限', ''), 100)), hasMagic: num(cellOf(npc, r, '魔力上限', ''), 0) > 0, rel: cellOf(npc, r, '关系', '—'),
          favor: num(cellOf(npc, r, '好感', ''), null), state: cellOf(npc, r, '当前状态', '—'), hook: cellOf(npc, r, '钩子', '—'), last: cellOf(npc, r, '最后出场', '—'),
          sexage: cellOf(npc, r, '性别', ''), element: cellOf(npc, r, '系别', ''), source: cellOf(npc, r, '星器', ''), erosion: num(cellOf(npc, r, '侵蚀', ''), null), body: cellOf(npc, r, '躯体', ''),
          arts: cellOf(npc, r, '招式', cellOf(npc, r, '技能', '')), exp: num(cellOf(npc, r, '当前经验', cellOf(npc, r, '经验', '')), null), expmax: num(cellOf(npc, r, '升级所需', ''), null), rep: num(cellOf(npc, r, '声望值', ''), null), repNature: cellOf(npc, r, '声望性质', ''), fame: num(cellOf(npc, r, '知名度', ''), null), lust: num(cellOf(npc, r, '情欲', ''), null), cult: cultMap[nn] || []
        });
      });
    }
    // —— 在场敌人（此表含生命，生命条在此生效）——
    var foes = findTable(tables, '在场敌人') || findTable(tables, '敌人');
    if (foes && foes.rows.length) {
      foes.rows.forEach(function (r) {
        var fn = cellOf(foes, r, '名称', cellOf(foes, r, '姓名', '')); if (!fn || fn === '—') return;
        var fhp = pair(cellOf(foes, r, '生命', '0'), Math.max(1, num(cellOf(foes, r, '生命上限', '100'), 100)));
        var fmax = num(cellOf(foes, r, '生命上限', String(fhp[1])), fhp[1]); if (fmax > 0) fhp[1] = fmax;
        out.push({
          kind: 'foe',
          name: fn, ident: '', realm: cellOf(foes, r, '威胁', ''), rel: '—',
          favor: null, state: cellOf(foes, r, '状态', '—'), hook: cellOf(foes, r, '手段', '—'), last: '—',
          hp: fhp[0], hpmax: fhp[1]
        });
      });
    }
    return out;
  }
  function conToast(msg) { var t = D.getElementById('xy-npccon-toast'); if (!t) return; t.textContent = msg; t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); }, 1700); }
  function conBar(label, cls, v, mx) { var m = mx || 100, w = Math.max(2, Math.min(100, v / m * 100)); return '<div><div class="bhead"><b>' + label + '</b><span>' + v + ' / ' + m + '</span></div><div class="bar"><i class="' + cls + '" style="width:' + w.toFixed(0) + '%"></i></div></div>'; }
  function conStep(label, f) { var _v = conPend[f] || 0, _vt = (_v > 0 ? '+' : '') + _v; return '<div class="step"><span class="lbl">' + label + '</span><button class="sbtn" data-f="' + f + '" data-d="-5">−</button><span class="d" data-f="' + f + '">' + _vt + '</span><button class="sbtn" data-f="' + f + '" data-d="5">+</button></div>'; }
  function conComposeText(det) {
    var d = conNPCs[conSel]; if (!d) return '';
    var _fcE = det.querySelector('.forcechk'), _frE = det.querySelector('.free'); var force = _fcE ? _fcE.checked : false, free = _frE ? _frE.value.trim() : '', parts = [];
    if (conPend.fav) parts.push('好感' + (conPend.fav > 0 ? '+' : '') + conPend.fav);
    if (conPend.hp) parts.push('生命' + (conPend.hp > 0 ? '+' : '') + conPend.hp);
    if (conPend.mp) parts.push('魔力' + (conPend.mp > 0 ? '+' : '') + conPend.mp);
    if (conPend.rep) parts.push('声望' + (conPend.rep > 0 ? '+' : '') + conPend.rep);
    if (conPend.fame) parts.push('知名度' + (conPend.fame > 0 ? '+' : '') + conPend.fame);
    if (conPend.lust) parts.push('情欲' + (conPend.lust > 0 ? '+' : '') + conPend.lust);
    var cultParts = [];
    if (conPend.cult) { for (var _hb in conPend.cult) { if (conPend.cult[_hb]) cultParts.push('「' + _hb + '」养成' + (conPend.cult[_hb] > 0 ? '+' : '') + conPend.cult[_hb]); } }
    (conPend.cultOps || []).forEach(function (op) { cultParts.push(op); });
    var seg = [];
    if (parts.length) seg.push(d.name + '：' + parts.join('、'));
    if (cultParts.length) seg.push(d.name + ' 养成：' + cultParts.join('、'));
    if (free) seg.push(free);
    if (!seg.length) return '';
    if (force) return '【GM·绝对指令·针对' + d.name + '】' + seg.join('；') + '（最高优先级，必须无条件、即时、足量照演上述设定与指令，不得弱化、不得反转、不得讲合理性。）';
    return '（针对' + d.name + '：' + seg.join('；') + '）';
  }
  function conUpdPrev(det) { var pv = det.querySelector('.prev'); if (!pv) return; var txt = conComposeText(det); pv.textContent = txt ? ('待注入 ▸ ' + txt) : '调整数值或填写指令后，点「注入聊天框」'; }
  function conInject(det) {
    var txt = conComposeText(det); if (!txt) { conToast('先调整数值或填写指令'); return; }
    var ta = D.getElementById('send_textarea'); if (!ta) { conToast('未找到聊天输入框'); return; }
    var cur = ta.value || ''; ta.value = cur.trim() === '' ? txt : (cur.replace(/\s+$/, '') + '\n' + txt);
    try { ta.dispatchEvent(new EV('input', { bubbles: true })); } catch (e) { }
    try { ta.focus(); ta.selectionStart = ta.selectionEnd = ta.value.length; } catch (e) { }
    conPend = { fav: 0, hp: 0, mp: 0, rep: 0, fame: 0, lust: 0, cult: {}, cultOps: [] };
    det.querySelectorAll('.d').forEach(function (x) { x.textContent = '0'; });
    det.querySelectorAll('.cd').forEach(function (x) { x.textContent = '0'; });
    var _frR = det.querySelector('.free'); if (_frR) _frR.value = '';
    conUpdPrev(det);
    conToast('已注入聊天框，可再编辑或直接发送');
  }
  function nsec(t, inner){ return inner ? '<div class="nsec"><div class="nsec-t">'+t+'</div>'+inner+'</div>' : ''; }
  function krow2(k, v){ return '<div class="krow"><span class="k">'+esc(k)+'</span><span class="v">'+esc(v)+'</span></div>'; }
  function splitParts(s){ s=String(s==null?'':s).trim(); if(!s||s==='—')return []; return s.split(/[；;\n]+/).map(function(seg){ seg=seg.trim(); if(!seg)return null; var ci=seg.search(/[:：]/); return ci>-1?{part:seg.slice(0,ci).trim(),desc:seg.slice(ci+1).trim()}:{part:'',desc:seg}; }).filter(Boolean); }
  // 魔物种类识别：按名称/身份/等级/系别综合判断，返回具体类别标签；不是魔物则返回 ''。
  // 顺序从具体到宽泛，避免误判（宽泛的「魔物」兜底放最后）。
  function monsterKind(d){
    var s = (d.name||'')+(d.ident||'')+(d.realm||'')+(d.element||'');
    if (/机器人|机械|机甲|傀儡|魔像|自动人形|人偶|构装/.test(s)) return '机械';
    if (/骷髅|白骨|亡灵|不死|僵尸|丧尸|尸傀/.test(s)) return '亡灵';
    if (/异形|异种|寄生体|拟态体|虫族|虫群|孢/.test(s)) return '异形';
    if (/蛊虫|蛊兵|母蛊|毒蛊|蛊/.test(s)) return '蛊虫';
    if (/史莱姆|斯莱姆|软泥|黏液体/.test(s)) return '史莱姆';
    if (/哥布林|地精/.test(s)) return '哥布林';
    if (/兽人|半兽人|魔兽|妖兽|魔狼|魔犬|魔蛛/.test(s)) return '魔兽';
    if (/魔物|怪物|妖物|魔虫|造物/.test(s)) return '魔物';
    return '';
  }
  function npcFaction(d){
    if (d.kind === 'foe') return 'foe';
    if (monsterKind(d)) return 'monster';
    var s = (d.ident||'')+' '+(d.realm||'')+' '+(d.element||'')+' '+(d.corr||'');
    // 魔人 / 深渊位格
    if (/魔人|化形|寄生|深渊|位格|孳生|蚀魂|化渊|噬星|渊厄|灾异|瘴/.test(s)) return 'demon';
    // 显式「凡人」标记 → 直接凡人（以身份为准，纵使误填了魔力也不误判）
    if (/凡人|普通人|平民|常人|素人|路人|无能力者|非魔法少女/.test(s)) return 'mortal';
    // 魔法少女身份 / 阶级 / 系别 / 恶堕等关键词（不含过宽的「系」「守护」「独立」单字，避免误命中）
    if (/异事局|清剿局|学院司|研究院|独立魔法少女|散修魔法少女|见习|正式|精英|战姬|传奇|魔法少女|守护者|净化师|未染|初蚀|沉沦|半堕|恶堕|元素系|强化系|操控系|治愈系|感知系|净化系|召唤系|造物系|结界系|封印系|时间系|空间系/.test(s)) return 'mahou';
    // 机器兜底（与世界书一致：凡人魔力 0/0、魔法少女有魔力）——有系别 / 有恶堕阶段 / 魔力上限>0 → 具超凡之力 → 魔法少女
    var hasSys  = d.element && d.element !== '—' && d.element !== '';
    var hasCorr = d.corr && d.corr !== '—' && d.corr !== '';
    if (hasSys || hasCorr || d.hasMagic) return 'mahou';
    // 其余一律凡人（绝不再以「生命值是否存在」判定身份）
    return 'mortal';
  }
  function isCreature(fac){ return fac === 'demon' || fac === 'monster'; }
  var CORR_ORDER = ['未染','初蚀','沉沦','半堕','恶堕'], CORR_COLOR = ['#43c0b0','#bcd24e','#e2a13e','#e2636e','#a85cf0'];
  function conEroBar(stage, ero){
    var st = String(stage||'').trim(), idx = CORR_ORDER.indexOf(st);
    if (idx < 0 && ero != null) idx = 0;
    var col = idx >= 0 ? CORR_COLOR[idx] : '#b3b8e0';
    var steps = '';
    for (var i=0;i<5;i++){ steps += '<span class="es" style="'+(i<=idx?'background:'+CORR_COLOR[i]+';opacity:1':'')+'"></span>'; }
    var lab = (st||'—') + (ero != null ? ' · 侵蚀 '+ero : '');
    var bar = ero != null ? '<div class="bar" style="margin-top:6px"><i style="width:'+Math.max(2,Math.min(100,ero)).toFixed(0)+'%;background:'+col+'"></i></div>' : '';
    return '<div class="ero"><div class="bhead"><b>恶堕</b><span style="color:'+col+'">'+esc(lab)+'</span></div><div class="ero-steps">'+steps+'</div>'+bar+'</div>';
  }
  function conFavBar(fav){
    var v = Math.max(-100, Math.min(100, fav)), pos = ((v+100)/200*100);
    var col = v >= 30 ? '#2f8a7c' : (v <= -30 ? '#c25575' : '#9a8f5a');
    return '<div class="fav"><div class="bhead"><b>好感</b><span style="color:'+col+'">'+fav+'</span></div><div class="fav-track"><span class="fav-mid"></span><span class="fav-dot" style="left:'+pos.toFixed(1)+'%;background:'+col+'"></span></div></div>';
  }
  function conRepBar(rep, nature, fame) {
    var html = '';
    if (rep != null) {
      var v = Math.max(-100, Math.min(100, rep)), pos = ((v + 100) / 200 * 100);
      var col = v >= 30 ? '#2f8a7c' : (v <= -30 ? '#c25575' : '#9a8f5a');
      html += '<div class="fav"><div class="bhead"><b>声望</b><span style="color:' + col + '">' + rep + '</span></div><div class="fav-track"><span class="fav-mid"></span><span class="fav-dot" style="left:' + pos.toFixed(1) + '%;background:' + col + '"></span></div></div>';
    }
    if (nature && nature !== '—') html += '<div class="rep-nature">◈ ' + esc(nature) + '</div>';
    if (fame != null) html += conBar('知名度', 'f-mana', fame, 100);
    return html || '<div class="nbody">暂无声望记录</div>';
  }
  function conLustBar(lust) {
    if (lust == null) return '';
    var v = Math.max(0, Math.min(100, lust));
    return '<div class="lust"><span class="lust-ic">\u2665</span><span class="lust-lb">\u60c5\u6b32</span><div class="lust-bar"><i style="width:' + v + '%"></i></div><span class="lust-vl">' + lust + '</span></div>';
  }
  function conCultView(d) {
    function aesc(x){ return esc(x).replace(/"/g, '&quot;'); }
    var list = d.cult || [], items = '';
    if (!list.length) {
      items = '<div class="empty">暂无性癖项目——可在下方添加，或在剧情中培养</div>';
    } else {
      list.forEach(function (c) {
        var hb = aesc(c.hobby), _cp = (conPend.cult && conPend.cult[c.hobby]) || 0, _cq = (conPend.cultOps || []).indexOf('删除性癖「' + c.hobby + '」') >= 0;
        var pv = Math.max(0, Math.min(100, c.prof == null ? 0 : c.prof));
        items += '<div class="cult-item">'
          + '<div class="cult-r1"><span class="cult-name">' + esc(c.hobby) + '</span>'
          + '<span class="cult-step"><button class="sbtn cbtn" data-h="' + hb + '" data-d="-5">−</button><span class="cd" data-h="' + hb + '">' + (_cp > 0 ? '+' : '') + _cp + '</span><button class="sbtn cbtn" data-h="' + hb + '" data-d="5">+</button></span>'
          + '<button class="cdel" data-h="' + hb + '"' + (_cq ? ' disabled' : '') + '>' + (_cq ? '待删除' : '删除') + '</button></div>'
          + '<div class="cult-r2"><div class="bar"><i class="f-exp" style="width:' + pv + '%"></i></div><span class="cult-val">' + pv + ' / 100</span></div>';
        
        items += '</div>';
      });
      if (list.length > 5) items = '<div class="cult-scroll">' + items + '</div>';
    }
    return items + '<div class="cadd"><input class="caddinput" placeholder="新增性癖名（如 机械奸 / 寸止 / 强制受孕/排卵）"><button class="caddbtn">＋ 添加</button></div>';
  }

  function conRenderDetail() {
    var panel = D.getElementById('xy-npccon'); if (!panel) return;
    var det = panel.querySelector('.det'), d = conNPCs[conSel];
    panel.querySelectorAll('.tab').forEach(function (t, k) { t.classList.toggle('on', k === conSel); });
    if (!d) { det.innerHTML = '<div class="empty">数据库暂无人物——先在剧情里让人物登场记录</div>'; return; }
    var fac = npcFaction(d), creature = isCreature(fac);
    var facLab = fac === 'monster' ? (monsterKind(d) || '魔物') : ({ mahou:'魔法少女', demon:'魔人·魔物', mortal:'凡人', foe:'敌' }[fac]);
    var isNpc = (d.kind === 'npc');
    var hasBody = (d.body && d.body !== '—');

    var h = '<div class="ncard fac-' + fac + '"><div class="ntop"><span class="nnm">' + esc(d.name) + '</span><span class="nbadge">' + facLab + '</span></div>';
    var idl = [];
    if (d.ident) idl.push(esc(d.ident));
    if (d.realm) idl.push('<b>' + esc(d.realm) + '</b>');
    if (idl.length) h += '<div class="nsubid">' + idl.join(' · ') + '</div>';
    h += '</div>';

    // 状态：进度条(顺序 经验/生命/魔力/情欲/恶堕，无分组标题)
    var sb = '';
    if (fac === 'mahou') {
      if (d.exp != null) { var _em = (d.expmax && d.expmax > 0) ? d.expmax : Math.max(1, d.exp); sb += conBar('经验', 'f-exp', d.exp, _em); }
      else { var _lvm = String(d.realm || '').match(/(\d{1,3})/); if (_lvm) { var _lv = Math.max(1, Math.min(70, parseInt(_lvm[1], 10))); var _bands = [[1,10],[11,25],[26,40],[41,55],[56,70]], _cur = _lv, _tot = _lv; for (var _bi = 0; _bi < _bands.length; _bi++){ if (_lv <= _bands[_bi][1]){ _cur = _lv - _bands[_bi][0] + 1; _tot = _bands[_bi][1] - _bands[_bi][0] + 1; break; } } sb += conBar('晋阶', 'f-exp', _cur, _tot); } }
    }
    if (d.hp != null) sb += conBar('生命', 'f-hp', d.hp, d.hpmax);
    if (d.mp != null && fac !== 'mortal') sb += conBar('魔力', 'f-mana', d.mp, d.mpmax);
    if (isNpc && d.lust != null) sb += conBar('\u2665 情欲', 'f-lust', d.lust, 100);
    if (isNpc && !creature && (d.corr || d.erosion != null)) sb += conEroBar(d.corr, d.erosion);
    var stateC = sb ? '<div class="statebars">' + sb + '</div>' : '<div class="nbody" style="opacity:.6">暂无可视数据</div>';
    if (isNpc) stateC += '<div class="nsec-t" style="margin-top:15px">⚙ 快 速 调 整</div><div class="steps2">' + conStep('生命', 'hp') + conStep('魔力', 'mp') + conStep('情欲', 'lust') + conStep('好感', 'fav') + '</div><div class="prevhint">数值调整后，切到「记录」页点「注入聊天框」</div>';

    // 档案：信息 + 好感
    var prof = '';
    if (d.sexage) prof += krow2('性别·年龄', d.sexage);
    if (d.element) prof += krow2(fac === 'demon' ? '灾异本能' : (fac === 'monster' ? '本能·形态' : '系别'), d.element);
    if (d.source) prof += krow2(creature ? '本源' : '星器', d.source);
    if (isNpc) {
      if (d.rel && d.rel !== '—') prof += krow2('关系', d.rel);
      if (d.favor != null) prof += conFavBar(d.favor);
      if (d.hook && d.hook !== '—') prof += krow2('钩子·秘密', d.hook);
      if (d.last && d.last !== '—') prof += krow2('最后出场', d.last);
    } else {
      if (d.hook && d.hook !== '—') prof += krow2('手段', d.hook);
    }
    if (d.state && d.state !== '—') prof += krow2(fac === 'foe' ? '战况' : '当前状态', d.state);
    if (d.arts && d.arts !== '—') {
      var _ap = splitParts(d.arts);
      var _ah = _ap.length ? '<div class="body" style="grid-template-columns:1fr">' + _ap.map(function(p){ return '<div class="bp">' + (p.part ? '<b>'+esc(p.part)+'</b>' : '') + esc(p.desc) + '</div>'; }).join('') + '</div>' : '<div class="nbody">' + esc(d.arts) + '</div>';
      prof += nsec(fac === 'demon' ? '⛧ 异能 · 魔技' : (fac === 'monster' ? '⚔ 异能 · 招式' : '✨ 招式 · 技能'), _ah);
    }
    if (!prof) prof = '<div class="nbody" style="opacity:.6">暂无档案信息</div>';

    // 身体：一部位一行、字大
    var bodyC;
    if (hasBody) { var _bp = splitParts(d.body); bodyC = _bp.length ? '<div class="bodyrows">' + _bp.map(function(p){ return '<div class="bprow">' + (p.part ? '<b>'+esc(p.part)+'</b>' : '') + esc(p.desc) + '</div>'; }).join('') + '</div>' : '<div class="nbody">' + esc(d.body) + '</div>'; }
    else bodyC = '<div class="nbody" style="opacity:.6">暂无躯体记录</div>';

    // 记录：声望 + 性癖 + 控制台(按钮仅此一处)
    var rec = '';
    if (isNpc) {
      rec += '<div class="nsec-t">声 望 · 名 望</div>' + conRepBar(d.rep, d.repNature, d.fame);
      rec += '<div class="nsec-t" style="margin-top:16px">🌱 性癖 · 养成</div>' + conCultView(d);
      rec += '<div class="ctrl"><div class="ctitle">⚙ 指令注入（写入聊天框 → 由剧情 / GM 执行）</div>'
        + '<div class="steps2">' + conStep('声望', 'rep') + conStep('知名度', 'fame') + '</div>'
        + '<textarea class="free" placeholder="自定义指令／对该 NPC 的要求（可留空）"></textarea>'
        + '<div class="quick"></div>'
        + '<div class="foot"><label class="gmtog"><input type="checkbox" class="forcechk">强制 GM</label><button class="inject">注 入 聊 天 框</button></div>'
        + '<div class="prev"></div></div>';
    }

    var tabs = [['state','状 态'], ['profile','档 案']];
    if (isNpc || hasBody) tabs.push(['body','身 体']);
    if (isNpc) tabs.push(['record','记 录']);
    var tabKeys = tabs.map(function (t) { return t[0]; });
    if (tabKeys.indexOf(conView) < 0) conView = 'state';
    h += '<div class="rtabs">' + tabs.map(function (t) { return '<button class="rtab' + (conView===t[0]?' on':'') + '" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
    var paneC = conView === 'profile' ? prof : (conView === 'body' ? bodyC : (conView === 'record' ? rec : stateC));
    h += '<div class="rpane">' + paneC + '</div>';

    if (!isNpc) {
      h += '<div class="ctrl"><div class="ctitle">⚙ 指令注入（写入聊天框 → 由剧情 / GM 执行）</div>'
        + '<div class="steps2">' + conStep('生命', 'hp') + conStep('魔力', 'mp') + '</div>'
        + '<textarea class="free" placeholder="自定义指令（可留空）"></textarea>'
        + '<div class="quick"></div>'
        + '<div class="foot"><label class="gmtog"><input type="checkbox" class="forcechk">强制 GM</label><button class="inject">注 入 聊 天 框</button></div>'
        + '<div class="prev"></div></div>';
    }

    det.innerHTML = h;
    det.querySelectorAll('.sbtn').forEach(function (b) { b.onclick = function () {
      var dd = parseInt(b.dataset.d, 10);
      if (b.dataset.h) { var hb = b.dataset.h; conPend.cult = conPend.cult || {}; conPend.cult[hb] = (conPend.cult[hb] || 0) + dd; var cd = b.parentNode.querySelector('.cd'); if (cd) cd.textContent = (conPend.cult[hb] > 0 ? '+' : '') + conPend.cult[hb]; }
      else { var f = b.dataset.f; conPend[f] = (conPend[f] || 0) + dd; var dn = det.querySelector('.d[data-f="' + f + '"]'); if (dn) dn.textContent = (conPend[f] > 0 ? '+' : '') + conPend[f]; }
      conUpdPrev(det);
    }; });
    det.querySelectorAll('.cdel').forEach(function (b) { b.onclick = function () { var hb = b.dataset.h; conPend.cultOps = conPend.cultOps || []; var tag = '删除性癖「' + hb + '」'; if (conPend.cultOps.indexOf(tag) < 0) conPend.cultOps.push(tag); b.textContent = '待删除'; b.disabled = true; conUpdPrev(det); }; });
    (function () { var cab = det.querySelector('.caddbtn'); if (cab) cab.onclick = function () { var inp = det.querySelector('.caddinput'), v = (inp && inp.value || '').trim(); if (!v) { conToast('先填性癖名'); return; } conPend.cultOps = conPend.cultOps || []; conPend.cultOps.push('新增性癖「' + v + '」'); inp.value = ''; conUpdPrev(det); conToast('已加入待注入：新增性癖「' + v + '」'); }; })();
    det.querySelectorAll('.rtab').forEach(function (b) { b.onclick = function () { conView = b.dataset.v; conRenderDetail(); }; });
    var QUICK = ['推进此段剧情', '跳到下一个场景', '收束本节做小结', '来点意外转折'], qbox = det.querySelector('.quick');
    if (qbox) QUICK.forEach(function (q) { var b = D.createElement('button'); b.className = 'qb'; b.textContent = q; b.onclick = function () { var ta = det.querySelector('.free'); if (ta) { ta.value = ta.value.trim() ? (ta.value.trim() + '；' + q) : q; conUpdPrev(det); } }; qbox.appendChild(b); });
    var _free = det.querySelector('.free'); if (_free) _free.addEventListener('input', function () { conUpdPrev(det); });
    var _fc = det.querySelector('.forcechk'); if (_fc) _fc.addEventListener('change', function () { conUpdPrev(det); });
    var _inj = det.querySelector('.inject'); if (_inj) _inj.onclick = function () { conInject(det); };
    conUpdPrev(det);
  }

  function conSelectTab(idx) { conSel = idx; conPend = { fav: 0, hp: 0, mp: 0, rep: 0, fame: 0, lust: 0, cult: {}, cultOps: [] }; conRenderDetail(); }
  function conRefresh() {
    var panel = D.getElementById('xy-npccon'); if (!panel) return;
    conNPCs = conReadNPCs();
    var tabsBox = panel.querySelector('.tabs');
    if (!conNPCs.length) { tabsBox.innerHTML = ''; panel.querySelector('.det').innerHTML = '<div class="empty">数据库暂无人物——先在剧情里让人物登场记录</div>'; return; }
    if (conSel >= conNPCs.length) conSel = 0;
    tabsBox.innerHTML = conNPCs.map(function (d, k) { var _fc = npcFaction(d); var _tc = d.kind === 'foe' ? ' foe' : (_fc === 'monster' ? ' mon' : ''); return '<div class="tab' + _tc + '" data-i="' + k + '">' + esc(d.name) + '</div>'; }).join('');
    tabsBox.querySelectorAll('.tab').forEach(function (t) { t.onclick = function () { conSelectTab(parseInt(t.dataset.i, 10)); }; });
    conPend = { fav: 0, hp: 0, mp: 0, rep: 0, fame: 0, lust: 0, cult: {}, cultOps: [] };
    conRenderDetail();
  }

  function _vwh() { return [W.innerWidth || (D.documentElement && D.documentElement.clientWidth) || 360, W.innerHeight || (D.documentElement && D.documentElement.clientHeight) || 640]; }
  function clampEl(el, key) {
    if (!el || !el.style.left || el.style.left === 'auto') return;        // 以 right/bottom 定位时天然在屏内
    if (el.offsetWidth === 0 && el.offsetHeight === 0) return;            // 隐藏中（未打开的面板）跳过
    var s = _vwh(), vw = s[0], vh = s[1], w = el.offsetWidth, h = el.offsetHeight;
    var x = parseFloat(el.style.left) || 0, y = parseFloat(el.style.top) || 0;
    var nx = Math.max(2, Math.min(vw - w - 2, x)), ny = Math.max(2, Math.min(vh - h - 2, y));
    if (nx !== x || ny !== y) { el.style.left = nx + 'px'; el.style.top = ny + 'px'; if (key) lsSet(key, el.style.left + '|' + el.style.top); }
  }
  function applyPos(el, key, defRight, defBottom) {
    var p = lsGet(key, '');
    if (p && p.indexOf('|') !== -1) { var a = p.split('|'); el.style.left = a[0]; el.style.top = a[1]; el.style.right = 'auto'; el.style.bottom = 'auto'; }
    else { el.style.right = defRight; el.style.bottom = defBottom; el.style.left = 'auto'; el.style.top = 'auto'; }
    clampEl(el, key);
  }
  function reclampAll() { var f = D.getElementById('xy-npccon-fab'); if (f) clampEl(f, 'xynpccon_fab_pos'); var p = D.getElementById('xy-npccon'); if (p && p.classList.contains('open')) clampEl(p, 'xynpccon_pos'); }
  function resetPositions() {
    lsSet('xynpccon_fab_pos', ''); lsSet('xynpccon_pos', '');
    var mob = (W.innerWidth || 999) <= 520;
    var f = D.getElementById('xy-npccon-fab');
    if (f) { f.style.left = 'auto'; f.style.top = 'auto'; f.style.right = '16px'; f.style.bottom = mob ? '22%' : '96px'; }
    var p = D.getElementById('xy-npccon');
    if (p) { p.style.left = 'auto'; p.style.top = 'auto'; p.style.right = '16px'; p.style.bottom = '154px'; }
    conToast('悬浮球与面板已复位');
  }
  function makeDraggable(handle, target, lsKey, onClick, onLong) {
    var sx, sy, ox, oy, down = false, dragging = false, lpTimer = null, lpFired = false, suppressClick = false, pid = null;
    function clearLP() { if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; } }
    function killClickFor(ms) { suppressClick = true; setTimeout(function () { suppressClick = false; }, ms || 60); }
    function bindDocMove() { try { D.addEventListener('pointermove', onMove, true); D.addEventListener('pointerup', onUp, true); D.addEventListener('pointercancel', onUp, true); } catch (_) { } }
    function unbindDocMove() { try { D.removeEventListener('pointermove', onMove, true); D.removeEventListener('pointerup', onUp, true); D.removeEventListener('pointercancel', onUp, true); } catch (_) { } }
    handle.style.touchAction = 'none';
    function onMove(e) {
      if (!down) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (!dragging && Math.abs(dx) + Math.abs(dy) > 4) {
        dragging = true; clearLP();
        var r = target.getBoundingClientRect(); ox = r.left; oy = r.top;
        target.style.left = ox + 'px'; target.style.top = oy + 'px'; target.style.right = 'auto'; target.style.bottom = 'auto';
      }
      if (dragging) {
        if (e.cancelable) e.preventDefault();
        var s = _vwh(), vw = s[0], vh = s[1], w = target.offsetWidth || 50, h = target.offsetHeight || 50;
        var nx = Math.max(2, Math.min(vw - Math.min(w, vw) - 2, ox + dx)), ny = Math.max(2, Math.min(vh - Math.min(h, vh) - 2, oy + dy));
        target.style.left = nx + 'px'; target.style.top = ny + 'px';
      }
    }
    function onUp() {
      if (!down) return; down = false; clearLP();
      unbindDocMove();
      try { if (pid != null && handle.releasePointerCapture) handle.releasePointerCapture(pid); } catch (_) { }
      pid = null;
      if (dragging) { dragging = false; killClickFor(80); lsSet(lsKey, target.style.left + '|' + target.style.top); }
    }
    handle.addEventListener('pointerdown', function (e) {
      if (e.target && e.target.classList && e.target.classList.contains('x')) return;
      if (e.button != null && e.button !== 0) return;
      down = true; dragging = false; lpFired = false; sx = e.clientX; sy = e.clientY;
      // 关键修复(电脑端「点开就卡、能点不能拖」)：把指针「捕获」到拖动柄上。
      // 否则桌面端光标一旦滑过聊天里的消息 iframe，父窗口立刻收不到 pointermove，拖动当场卡死。
      // 捕获后该指针的所有事件都强制派发到本元素，跨 iframe / 跨任何覆盖层都不再丢失。
      try { if (handle.setPointerCapture) handle.setPointerCapture(e.pointerId); pid = e.pointerId; } catch (_) { pid = null; }
      bindDocMove();
      if (onLong) { clearLP(); lpTimer = setTimeout(function () { if (down && !dragging) { lpFired = true; killClickFor(500); onLong(); } }, 600); }
    });
    // 指针捕获被系统意外收回(切到别的窗口/被打断)时兜底收尾，避免卡在「按住」态
    handle.addEventListener('lostpointercapture', function () { if (down) onUp(); });
    // 开/关面板一律走原生 click（最稳，桌面手机都触发）；拖动或长按后用 suppressClick 吃掉这一次 click
    if (onClick) {
      handle.addEventListener('click', function (e) {
        if (e.target && e.target.classList && e.target.classList.contains('x')) return;
        if (suppressClick || lpFired) { lpFired = false; return; }
        onClick();
      });
    }
  }

  function ensureCon() {
    if (!D.body) return;
    { var _ost = D.getElementById('xy-npccon-style'); if (_ost) _ost.remove(); var st = D.createElement('style'); st.id = 'xy-npccon-style'; st.textContent = CSS; (D.head || D.body).appendChild(st); }
    var __oldFab = D.getElementById('xy-npccon-fab'), __wasOpen = false;
    if (__oldFab) {
      if (__oldFab.dataset && __oldFab.dataset.owner === SELF) return;   // 本上下文已挂载，跳过
      // 旧 iframe 遗留的悬浮球：其事件绑定已随旧上下文失效(正是「不刷新点不开」的根因)，移除并由当前上下文重建
      var __oldP = D.getElementById('xy-npccon'); __wasOpen = !!(__oldP && __oldP.classList.contains('open'));
      try { __oldFab.remove(); } catch (e) { }
      try { if (__oldP) __oldP.remove(); } catch (e) { }
    }
    var fab = D.createElement('div'); fab.id = 'xy-npccon-fab'; fab.title = 'NPC 控制台（可拖动）'; try { fab.dataset.owner = SELF; } catch (e) { }
    fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.1"/><path d="M3.6 19c0-3 2.4-5 5.4-5s5.4 2 5.4 5"/><circle cx="17.2" cy="9" r="2.3"/><path d="M15.2 14.6c2.5.2 4.3 2 4.3 4.4"/></svg>';
    D.body.appendChild(fab);
    if (!D.getElementById('xy-npccon-toast')) { var _tt = D.createElement('div'); _tt.id = 'xy-npccon-toast'; D.body.appendChild(_tt); }
    applyPos(fab, 'xynpccon_fab_pos', '16px', ((W.innerWidth || 999) <= 520 ? '22%' : '96px'));
    var panel = D.createElement('div'); panel.id = 'xy-npccon';
    panel.innerHTML = '<div class="hd"><span class="t">⠿ NPC 控 制 台</span><span class="x" title="关闭">✕</span></div><div class="bd"><div class="tabs"></div><div class="det"><div class="empty">读取数据库中…</div></div></div>';
    D.body.appendChild(panel);
    applyPos(panel, 'xynpccon_pos', '16px', '154px');
    panel.querySelector('.x').onclick = function () { panel.classList.remove('open'); };
    makeDraggable(fab, fab, 'xynpccon_fab_pos', function () {
      if (panel.classList.contains('open')) { panel.classList.remove('open'); return; }
      conRefresh();
      var saved = lsGet('xynpccon_pos', '');
      if (((W.innerWidth || 999) <= 520) && !(saved && saved.indexOf('|') !== -1)) {
        var s = _vwh(); panel.style.left = Math.round(s[0] * 0.03) + 'px'; panel.style.top = Math.round(s[1] * 0.06) + 'px'; panel.style.right = 'auto'; panel.style.bottom = 'auto';
      }
      panel.classList.add('open');
      clampEl(panel, '');
    }, resetPositions);
    makeDraggable(panel.querySelector('.hd'), panel, 'xynpccon_pos', null);
    if (__wasOpen) { conRefresh(); panel.classList.add('open'); clampEl(panel, ''); }   // 重建后保持刷新前的展开状态
  }

  function boot() {
    ensureCon();
    var api = getAPI();
    if (api && typeof api.registerTableUpdateCallback === 'function' && !W.__XYNPCCON_CB__) {
      W.__XYNPCCON_CB__ = function () { var p = D.getElementById('xy-npccon'); if (p && p.classList.contains('open')) conRefresh(); };
      try { api.registerTableUpdateCallback(W.__XYNPCCON_CB__); } catch (e) { }
    }
  }
  var CSS = `
#xy-npccon-fab{position:fixed;width:50px;height:50px;border-radius:50%;z-index:99990;cursor:grab;border:1px solid rgba(124,127,240,.4);background:linear-gradient(150deg,#8d8ff4,#5aa2f7);box-shadow:0 4px 16px rgba(91,79,196,.42);display:flex;align-items:center;justify-content:center;transition:transform .12s,box-shadow .12s;}
#xy-npccon-fab:hover{transform:translateY(-2px);box-shadow:0 7px 22px rgba(91,79,196,.52);}
#xy-npccon-fab:active{cursor:grabbing;}
#xy-npccon-fab svg{width:25px;height:25px;pointer-events:none;}
#xy-npccon{position:fixed;width:440px;max-width:96vw;height:auto;max-height:86vh;min-width:330px;min-height:240px;z-index:99991;display:none;flex-direction:column;border-radius:16px;overflow:hidden;resize:both;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei UI','Microsoft YaHei','Source Han Sans SC','Noto Sans CJK SC','Hiragino Sans GB','Heiti SC',system-ui,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;color:#2f3a5c;
  background:linear-gradient(155deg,rgba(238,243,255,.985),rgba(245,248,255,.99) 55%,rgba(250,248,243,.985));box-shadow:0 14px 50px rgba(70,90,150,.32);border:1px solid rgba(124,150,200,.32);}
#xy-npccon.open{display:flex;}
#xy-npccon .hd{display:flex;align-items:center;justify-content:space-between;padding:13px 17px;border-bottom:1px solid rgba(124,150,200,.18);flex:0 0 auto;cursor:move;user-select:none;}
#xy-npccon .hd .t{font-size:15px;letter-spacing:2px;color:#7c70ec;font-weight:700;}
#xy-npccon .hd .x{cursor:pointer;color:#b3b8e0;font-size:18px;line-height:1;padding:2px 8px;border-radius:6px;}
#xy-npccon .hd .x:hover{background:rgba(124,127,240,.12);color:#7c70ec;}
#xy-npccon .bd{padding:14px 16px;overflow-y:auto;flex:1 1 auto;}
#xy-npccon .tabs{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:12px;}
#xy-npccon .tab{font-size:13px;letter-spacing:1px;cursor:pointer;padding:6px 14px;border-radius:9px;border:1px solid rgba(124,127,240,.3);background:rgba(124,127,240,.06);color:#7d8cd8;}
#xy-npccon .tab:hover{background:rgba(124,127,240,.14);}
#xy-npccon .tab.on{background:#7c7ff0;color:#fff;border-color:#7c7ff0;box-shadow:0 2px 8px rgba(124,127,240,.3);}
#xy-npccon .tab.foe{border-color:rgba(226,109,140,.4);color:#c25575;background:rgba(226,109,140,.07);}
#xy-npccon .tab.foe.on{background:#e26d8c;color:#fff;border-color:#e26d8c;box-shadow:0 2px 8px rgba(226,109,140,.3);}
#xy-npccon .tab.mon{border-color:rgba(63,167,117,.42);color:#2f8a5e;background:rgba(63,167,117,.08);}
#xy-npccon .tab.mon.on{background:#3fa775;color:#fff;border-color:#3fa775;box-shadow:0 2px 8px rgba(63,167,117,.3);}
#xy-npccon .itop{display:flex;align-items:center;flex-wrap:wrap;gap:7px;margin-bottom:10px;}
#xy-npccon .inm{font-size:17px;font-weight:700;color:#3f3f80;letter-spacing:1px;font-family:'Kaiti SC','STKaiti','KaiTi','Songti SC',serif;}
#xy-npccon .chip{font-size:12px;padding:3px 10px;border-radius:8px;background:rgba(124,127,240,.1);color:#8388cf;border:1px solid rgba(124,127,240,.2);}
#xy-npccon .chip.teal{background:rgba(47,174,155,.1);color:#2f8a7c;border-color:rgba(47,174,155,.25);}
#xy-npccon .chip.rose{background:rgba(226,109,140,.1);color:#c25575;border-color:rgba(226,109,140,.25);}
#xy-npccon .grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;margin:10px 0;}
#xy-npccon .bhead{display:flex;justify-content:space-between;font-size:12.5px;color:#5a6a93;margin-bottom:4px;}
#xy-npccon .bhead b{color:#3a4a6a;font-weight:600;}
#xy-npccon .bar{height:10px;border-radius:5px;background:rgba(124,150,200,.14);overflow:hidden;}
#xy-npccon .bar i{display:block;height:100%;border-radius:5px;}
#xy-npccon .bar i.f-hp{background:linear-gradient(90deg,#f3a4ac,#e8737e);}
#xy-npccon .bar i.f-mana{background:linear-gradient(90deg,#9fb6f3,#5a7ae0);}
#xy-npccon .bar i.f-lust{background:linear-gradient(90deg,#f0a8d8,#d57ad0,#b06ee0);}
#xy-npccon .statebars>div{margin-bottom:13px;}
#xy-npccon .statebars>div:last-child{margin-bottom:0;}
#xy-npccon .bodyrows .bprow{font-size:13.5px;color:var(--xn-text,#43617a);line-height:1.75;padding:8px 0;border-bottom:1px solid rgba(124,150,200,.12);}
#xy-npccon .bodyrows .bprow:last-child{border-bottom:none;}
#xy-npccon .bodyrows .bprow b{color:#2f8a7c;font-weight:700;margin-right:7px;font-size:14px;}
#xy-npccon .bar i.f-exp{background:linear-gradient(90deg,#a87ff2,#b69bf0);}
#xy-npccon .krow{display:flex;gap:9px;font-size:13.5px;margin-bottom:6px;}
#xy-npccon .krow .k{color:#7a80a8;min-width:66px;}
#xy-npccon .krow .v{color:#3a3f66;flex:1;}
#xy-npccon .sub{text-align:center;font-size:12.5px;letter-spacing:1.2px;color:#a87ff2;margin:13px 0 7px;}
#xy-npccon .body{display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;}
#xy-npccon .body .bp{font-size:13px;color:#43617a;line-height:1.6;}
#xy-npccon .body .bp b{color:#2f8a7c;font-weight:700;margin-right:5px;}
#xy-npccon .ctrl{margin-top:15px;border-top:1px dashed rgba(124,150,200,.3);padding-top:13px;}
#xy-npccon .ctitle{font-size:13px;letter-spacing:1px;color:#a87ff2;margin-bottom:11px;font-weight:700;}
#xy-npccon .step{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
#xy-npccon .step .lbl{font-size:13.5px;color:#5a6a93;min-width:48px;}
#xy-npccon .step .d{font-size:13.5px;font-weight:700;min-width:40px;text-align:center;color:#7c70ec;}
#xy-npccon .steps2{display:grid;grid-template-columns:1fr 1fr;gap:9px 14px;margin-bottom:4px;}
#xy-npccon .steps2 .step{margin-bottom:0;gap:6px;}
#xy-npccon .steps2 .step .lbl{min-width:38px;font-size:12.5px;}
#xy-npccon .steps2 .step .sbtn{width:28px;height:28px;font-size:15px;}
#xy-npccon .steps2 .step .d{min-width:30px;font-size:12.5px;}
#xy-npccon .prevhint{font-size:12px;color:#a6a9d2;opacity:.85;margin-top:9px;}
#xy-npccon .sbtn{width:32px;height:32px;border-radius:8px;border:1px solid rgba(124,127,240,.35);background:#fff;color:#7c70ec;font-size:17px;line-height:1;cursor:pointer;}
#xy-npccon .sbtn:hover{background:#7c7ff0;color:#fff;}
#xy-npccon textarea{width:100%;box-sizing:border-box;font-family:inherit;font-size:13.5px;color:#3a3f66;border:1px solid rgba(124,150,200,.3);border-radius:8px;padding:9px 11px;background:rgba(255,255,255,.6);outline:none;resize:vertical;min-height:58px;margin-top:4px;}
#xy-npccon .quick{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0;}
#xy-npccon .qb{font-size:12px;cursor:pointer;padding:5px 11px;border-radius:7px;border:1px dashed rgba(124,127,240,.4);background:transparent;color:#8388cf;font-family:inherit;}
#xy-npccon .qb:hover{background:rgba(124,127,240,.1);}
#xy-npccon .foot{display:flex;align-items:center;gap:12px;margin-top:11px;}
#xy-npccon .gmtog{display:flex;align-items:center;gap:6px;font-size:13px;color:#8388cf;cursor:pointer;user-select:none;white-space:nowrap;}
#xy-npccon .inject{flex:1;font-family:inherit;font-size:14px;letter-spacing:1px;cursor:pointer;border:0;border-radius:9px;padding:11px 0;background:linear-gradient(135deg,#7c7ff0,#5aa2f7);color:#fff;box-shadow:0 2px 10px rgba(91,79,196,.25);}
#xy-npccon .inject:hover{filter:brightness(1.05);}
#xy-npccon .prev{font-size:12px;color:#8a90b8;margin-top:10px;line-height:1.55;min-height:15px;}
#xy-npccon .empty{text-align:center;color:#b3b8da;font-size:13px;padding:22px 0;letter-spacing:1px;}
#xy-npccon-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:30px;z-index:99999;background:rgba(60,70,110,.94);color:#fff;font-size:13px;padding:8px 16px;border-radius:9px;opacity:0;transition:opacity .2s;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei UI','Microsoft YaHei','Source Han Sans SC','Noto Sans CJK SC','Hiragino Sans GB','Heiti SC',system-ui,sans-serif;}
#xy-npccon-toast.show{opacity:1;}
#xy-npccon .ncard{background:linear-gradient(145deg,rgba(124,127,240,.09),transparent 70%);border:1px solid rgba(124,127,240,.2);border-left:3px solid #7c7ff0;border-radius:12px;padding:13px 15px;margin-bottom:14px;}
#xy-npccon .ncard.fac-demon{border-left-color:#b06cff;background:linear-gradient(145deg,rgba(176,108,255,.11),transparent 70%);}
#xy-npccon .ncard.fac-mortal{border-left-color:#d2b482;background:linear-gradient(145deg,rgba(210,180,130,.11),transparent 70%);}
#xy-npccon .ncard.fac-foe{border-left-color:#e26d8c;background:linear-gradient(145deg,rgba(226,109,140,.11),transparent 70%);}
#xy-npccon .ncard.fac-monster{border-left-color:#3fa775;background:linear-gradient(145deg,rgba(63,167,117,.12),transparent 70%);}
#xy-npccon .ntop{display:flex;align-items:center;gap:9px;flex-wrap:wrap;}
#xy-npccon .nnm{font-size:18px;font-weight:700;color:var(--xn-text,#3a3a78);letter-spacing:.5px;font-family:'Kaiti SC','STKaiti','KaiTi','Songti SC',serif;}
#xy-npccon .nbadge{font-size:11px;padding:3px 10px;border-radius:7px;background:#7c7ff0;color:#fff;font-weight:600;}
#xy-npccon .fac-demon .nbadge{background:#b06cff;}#xy-npccon .fac-mortal .nbadge{background:#c79a52;}#xy-npccon .fac-foe .nbadge{background:#e26d8c;}#xy-npccon .fac-monster .nbadge{background:#3fa775;}
#xy-npccon .nsubid{font-size:13px;color:#5a6a93;margin-top:7px;line-height:1.5;}
#xy-npccon .nsubid b{color:#7c70ec;font-weight:700;}
#xy-npccon .nsec{margin-bottom:14px;}
#xy-npccon .nsec-t{font-size:12px;letter-spacing:1.2px;color:#a87ff2;font-weight:700;padding-bottom:5px;margin-bottom:9px;border-bottom:1px solid rgba(124,150,200,.16);}
#xy-npccon .ero{margin:4px 0;}
#xy-npccon .ero-steps{display:flex;gap:4px;margin-top:7px;}
#xy-npccon .ero-steps .es{flex:1;height:5px;border-radius:3px;background:rgba(124,150,200,.18);opacity:.5;transition:all .3s;}
#xy-npccon .nbody{font-size:12.5px;color:var(--xn-text,#43617a);line-height:1.7;}
#xy-npccon .fav{margin:4px 0;}
#xy-npccon .fav-track{position:relative;height:8px;background:linear-gradient(90deg,rgba(226,109,140,.22),rgba(124,150,200,.14),rgba(47,174,155,.22));border-radius:4px;margin-top:6px;}
#xy-npccon .fav-mid{position:absolute;left:50%;top:-3px;width:1px;height:14px;background:rgba(124,150,200,.5);}
#xy-npccon .fav-dot{position:absolute;top:-3px;width:13px;height:13px;border-radius:50%;transform:translateX(-50%);box-shadow:0 1px 5px rgba(0,0,0,.25);border:2px solid #fff;}
#xy-npccon .rep-nature{font-size:12px;color:#a87ff2;margin-top:5px;}
#xy-npccon .lust{display:flex;align-items:center;gap:7px;justify-content:flex-end;margin:9px 0 2px;}
#xy-npccon .lust-ic{color:#e06fb4;font-size:13px;}
#xy-npccon .lust-lb{color:#b56aa8;font-size:12.5px;letter-spacing:1px;}
#xy-npccon .lust-bar{width:52%;height:8px;border-radius:5px;background:rgba(200,120,180,.16);overflow:hidden;}
#xy-npccon .lust-bar>i{display:block;height:100%;border-radius:5px;background:linear-gradient(90deg,#f0a8d8,#d57ad0,#b06ee0);box-shadow:0 0 8px rgba(200,110,200,.4);}
#xy-npccon .lust-vl{color:#c060a0;font-size:12.5px;font-weight:700;min-width:24px;text-align:right;}
#xy-npccon .ncols{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap;}
#xy-npccon .ncol-left{flex:1 1 220px;min-width:188px;}
#xy-npccon .ncol-right{flex:1 1 300px;min-width:228px;}
#xy-npccon .lgrp{margin-bottom:15px;}
#xy-npccon .lgt{font-size:12px;letter-spacing:1.2px;color:#a87ff2;font-weight:700;margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid rgba(124,150,200,.16);}
#xy-npccon .lgrp>div{margin-bottom:10px;}
#xy-npccon .lgrp>div:last-child{margin-bottom:0;}
#xy-npccon .rtabs{display:flex;gap:5px;margin-bottom:13px;background:rgba(124,127,240,.07);padding:4px;border-radius:10px;}
#xy-npccon .rtab{flex:1;font-family:inherit;font-size:12.5px;letter-spacing:1px;cursor:pointer;padding:7px 0;border-radius:7px;border:none;background:transparent;color:#8388cf;}
#xy-npccon .rtab.on{background:#7c7ff0;color:#fff;box-shadow:0 2px 8px rgba(124,127,240,.3);}
#xy-npccon .vtoggle{display:flex;gap:6px;margin:0 0 14px;}
#xy-npccon .vtoggle .vt{flex:1;font-family:inherit;font-size:13px;letter-spacing:1px;cursor:pointer;padding:7px 0;border-radius:9px;border:1px solid rgba(124,127,240,.3);background:rgba(124,127,240,.06);color:#7d8cd8;}
#xy-npccon .vtoggle .vt.on{background:#7c7ff0;color:#fff;border-color:#7c7ff0;}
#xy-npccon .cult-item{border:1px solid rgba(124,150,200,.18);border-radius:10px;padding:9px 11px;margin-bottom:9px;background:rgba(124,150,200,.05);}
#xy-npccon .cult-r1{display:flex;align-items:center;gap:8px;}
#xy-npccon .cult-r1 .cult-name{font-size:14px;font-weight:700;color:var(--xn-text,#3a3a78);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
#xy-npccon .cult-step{display:flex;align-items:center;gap:4px;}
#xy-npccon .cult-step .sbtn{width:25px;height:25px;font-size:14px;}
#xy-npccon .cult-step .cd{font-size:12px;font-weight:700;min-width:22px;text-align:center;color:#7c70ec;}
#xy-npccon .cdel{font-size:11.5px;cursor:pointer;padding:4px 9px;border-radius:6px;border:1px solid rgba(226,109,140,.4);background:transparent;color:#c25575;font-family:inherit;white-space:nowrap;}
#xy-npccon .cdel:hover{background:rgba(226,109,140,.12);}
#xy-npccon .cult-r2{display:flex;align-items:center;gap:9px;margin-top:7px;}
#xy-npccon .cult-r2 .bar{flex:1;}
#xy-npccon .cult-val{font-size:12px;font-weight:700;color:#a87ff2;min-width:48px;text-align:right;}
#xy-npccon .cult-jin{font-size:12px;color:#5a6a93;line-height:1.5;margin-top:6px;}
#xy-npccon .cult-scroll{max-height:330px;overflow-y:auto;padding-right:5px;}
#xy-npccon .cadd{display:flex;gap:7px;margin-top:8px;}
#xy-npccon .cadd .caddinput{flex:1;box-sizing:border-box;font-family:inherit;font-size:13px;color:#3a3f66;border:1px solid rgba(124,150,200,.3);border-radius:8px;padding:8px 10px;background:rgba(255,255,255,.6);outline:none;}
#xy-npccon .caddbtn{font-size:13px;cursor:pointer;padding:0 14px;border-radius:8px;border:1px dashed rgba(124,127,240,.5);background:transparent;color:#8388cf;font-family:inherit;white-space:nowrap;}
#xy-npccon .caddbtn:hover{background:rgba(124,127,240,.1);}
@media (max-width:520px){
  #xy-npccon{width:94vw;min-width:0;max-width:94vw;max-height:80vh;max-height:80dvh;}
  #xy-npccon-fab{width:48px;height:48px;}
  #xy-npccon-fab svg{width:24px;height:24px;}
  #xy-npccon .hd{padding:11px 14px;}
  #xy-npccon .bd{padding:12px 13px;}
}
`;

  // resize / orientation：由当前上下文接管(旧上下文的回调会随其 iframe 失效)
  try { if (W.__XYNPCCON_RZ__) W.removeEventListener('resize', W.__XYNPCCON_RZ__); } catch (e) {}
  try { if (W.__XYNPCCON_OR__) W.removeEventListener('orientationchange', W.__XYNPCCON_OR__); } catch (e) {}
  W.__XYNPCCON_RZ__ = reclampAll; W.__XYNPCCON_OR__ = function () { setTimeout(reclampAll, 300); };
  try { W.addEventListener('resize', W.__XYNPCCON_RZ__); W.addEventListener('orientationchange', W.__XYNPCCON_OR__); } catch (e) {}
  // 心跳巡检：清掉旧上下文的 interval，由当前上下文重建(确保回调闭包有效)
  if (W.__XYNPCCON_HB__) { try { clearInterval(W.__XYNPCCON_HB__); } catch (e) {} }
  W.__XYNPCCON_HB__ = setInterval(ensureCon, 1500);
  boot();
})();
