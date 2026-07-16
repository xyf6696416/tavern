(function () {
  'use strict';
  var W; try { W = (window.parent && window.parent.document) ? window.parent : window; } catch (e) { W = window; }
  var D = W.document, EV = W.Event || Event;
  try { if (typeof W.__XYNPCCON_CLEANUP__ === 'function') W.__XYNPCCON_CLEANUP__(); } catch (e) {}
  try { var _o; _o = D.getElementById('xy-npccon-host'); if (_o && _o.parentNode) _o.parentNode.removeChild(_o); _o = D.getElementById('xy-npccon-fab'); if (_o && _o.parentNode) _o.parentNode.removeChild(_o); _o = D.getElementById('xy-npctrig'); if (_o && _o.parentNode) _o.parentNode.removeChild(_o); } catch (e) {}

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
  function conToast(msg) { var t = pop ? pop.querySelector('#xy-npccon-toast') : null; if (!t) return; t.textContent = msg; t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); }, 1700); }
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
  function npcFaction(d){
    if (d.kind === 'foe') return 'foe';
    var s = (d.ident||'')+' '+(d.realm||'')+' '+(d.element||'')+' '+(d.corr||'');
    // 魔人 / 魔物 / 深渊位格
    if (/魔人|魔物|怪物|化形|寄生|深渊|位格|孳生|蚀魂|化渊|噬星|渊厄|灾异|瘴/.test(s)) return 'demon';
    // 显式「凡人」标记 → 直接凡人
    if (/凡人|普通人|平民|常人|素人|路人|无能力者|非魔法少女/.test(s)) return 'mortal';
    // 魔法少女身份 / 阶级 / 系别 / 恶堕等关键词
    if (/异事局|清剿局|学院司|研究院|独立魔法少女|散修魔法少女|见习|正式|精英|战姬|传奇|魔法少女|守护者|净化师|未染|初蚀|沉沦|半堕|恶堕|元素系|强化系|操控系|治愈系|感知系|净化系|召唤系|造物系|结界系|封印系|时间系|空间系/.test(s)) return 'mahou';
    // 机器兜底：有系别 / 有恶堕阶段 / 魔力上限>0 → 魔法少女；否则凡人（绝不以生命值判定）
    var hasSys  = d.element && d.element !== '—' && d.element !== '';
    var hasCorr = d.corr && d.corr !== '—' && d.corr !== '';
    if (hasSys || hasCorr || d.hasMagic) return 'mahou';
    return 'mortal';
  }
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
    return items + '<div class="cadd"><input class="caddinput" placeholder="新增性癖名（如 寸止 / 强制受孕 / 强制高潮）"><button class="caddbtn">＋ 添加</button></div>';
  }

  function conRenderDetail() {
    var panel = D.getElementById('xy-npccon'); if (!panel) return;
    var det = panel.querySelector('.det'), d = conNPCs[conSel];
    panel.querySelectorAll('.tab').forEach(function (t, k) { t.classList.toggle('on', k === conSel); });
    if (!d) { det.innerHTML = '<div class="empty">数据库暂无人物——先在剧情里让人物登场记录</div>'; return; }
    var fac = npcFaction(d), creature = (fac === 'demon');
    var facLab = ({ mahou:'魔法少女', demon:'魔人·魔物', mortal:'凡人', foe:'敌' }[fac]);
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
    if (d.element) prof += krow2(fac === 'demon' ? '灾异本能' : '系别', d.element);
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
      prof += nsec(fac === 'demon' ? '⛧ 异能 · 魔技' : '✨ 招式 · 技能', _ah);
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
    var panel = popBody; if (!panel) return;
    conNPCs = conReadNPCs();
    var tabsBox = panel.querySelector('.tabs');
    if (!conNPCs.length) { tabsBox.innerHTML = ''; panel.querySelector('.det').innerHTML = '<div class="empty">数据库暂无人物——先在剧情里让人物登场记录</div>'; return; }
    if (conSel >= conNPCs.length) conSel = 0;
    tabsBox.innerHTML = conNPCs.map(function (d, k) { return '<div class="tab' + (d.kind === 'foe' ? ' foe' : '') + '" data-i="' + k + '">' + esc(d.name) + '</div>'; }).join('');
    tabsBox.querySelectorAll('.tab').forEach(function (t) { t.onclick = function () { conSelectTab(parseInt(t.dataset.i, 10)); }; });
    conPend = { fav: 0, hp: 0, mp: 0, rep: 0, fame: 0, lust: 0, cult: {}, cultOps: [] };
    conRenderDetail();
  }

  var CSS = `

#xy-npctrig{text-align:right;margin:8px 0 2px;line-height:1;}
#xy-npctrig .btn{display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:11px;cursor:pointer;user-select:none;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei UI','Microsoft YaHei','Source Han Sans SC','Noto Sans CJK SC','Hiragino Sans GB','Heiti SC',system-ui,sans-serif;font-size:13px;letter-spacing:2px;color:#fff;background:linear-gradient(135deg,#8d8ff4,#5aa2f7);box-shadow:0 3px 12px rgba(91,79,196,.3);border:1px solid rgba(124,127,240,.4);}
#xy-npctrig .btn:hover{filter:brightness(1.05);}
#xy-npctrig .btn .ic{font-size:14px;}
#xy-npctrig .btn .cnt{font-size:11.5px;opacity:.85;letter-spacing:0;}
#xy-npccon-mask{position:fixed;inset:0;z-index:2147483646;background:rgba(20,24,40,.42);display:none;}
#xy-npccon-mask.show{display:block;}
#xy-npccon-pop{position:fixed;z-index:2147483647;width:440px;max-width:96vw;height:auto;max-height:86vh;max-height:86dvh;min-width:280px;min-height:200px;display:none;flex-direction:column;border-radius:16px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei UI','Microsoft YaHei','Source Han Sans SC','Noto Sans CJK SC','Hiragino Sans GB','Heiti SC',system-ui,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;color:#2f3a5c;background:linear-gradient(155deg,rgba(238,243,255,.99),rgba(245,248,255,.995) 55%,rgba(250,248,243,.99));box-shadow:0 18px 60px rgba(40,50,90,.45);border:1px solid rgba(124,150,200,.35);}
#xy-npccon-pop.show{display:flex;}
#xy-npccon-pop .pophd{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(124,150,200,.2);cursor:move;user-select:none;flex:0 0 auto;background:linear-gradient(135deg,rgba(124,127,240,.12),rgba(90,162,247,.08));touch-action:none;}
#xy-npccon-pop .pophd .t{font-size:14px;letter-spacing:2px;color:#7c70ec;font-weight:700;}
#xy-npccon-pop .pophd .x{cursor:pointer;color:#b3b8e0;font-size:19px;line-height:1;padding:2px 9px;border-radius:7px;}
#xy-npccon-pop .pophd .x:hover{background:rgba(124,127,240,.14);color:#7c70ec;}
#xy-npccon-pop .rsz{position:absolute;left:0;bottom:0;width:28px;height:28px;cursor:nesw-resize;touch-action:none;z-index:7;}
#xy-npccon-pop .rsz::after{content:'';position:absolute;left:5px;bottom:5px;width:11px;height:11px;border-left:2.5px solid rgba(124,127,240,.75);border-bottom:2.5px solid rgba(124,127,240,.75);border-bottom-left-radius:4px;}
#xy-npccon{padding:14px 16px 24px;overflow-y:auto;flex:1 1 auto;min-height:0;}
#xy-npccon .tabs{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:12px;}
#xy-npccon .tab{font-size:13px;letter-spacing:1px;cursor:pointer;padding:6px 14px;border-radius:9px;border:1px solid rgba(124,127,240,.3);background:rgba(124,127,240,.06);color:#7d8cd8;}
#xy-npccon .tab:hover{background:rgba(124,127,240,.14);}
#xy-npccon .tab.on{background:#7c7ff0;color:#fff;border-color:#7c7ff0;box-shadow:0 2px 8px rgba(124,127,240,.3);}
#xy-npccon .tab.foe{border-color:rgba(226,109,140,.4);color:#c25575;background:rgba(226,109,140,.07);}
#xy-npccon .tab.foe.on{background:#e26d8c;color:#fff;border-color:#e26d8c;box-shadow:0 2px 8px rgba(226,109,140,.3);}
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

#xy-npccon-toast{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);z-index:5;background:rgba(60,70,110,.94);color:#fff;font-size:12.5px;padding:7px 15px;border-radius:9px;opacity:0;transition:opacity .2s;pointer-events:none;white-space:nowrap;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei UI','Microsoft YaHei','Source Han Sans SC','Noto Sans CJK SC','Hiragino Sans GB','Heiti SC',system-ui,sans-serif;}
#xy-npccon-toast.show{opacity:1;}
#xy-npccon .ncard{background:linear-gradient(145deg,rgba(124,127,240,.09),transparent 70%);border:1px solid rgba(124,127,240,.2);border-left:3px solid #7c7ff0;border-radius:12px;padding:13px 15px;margin-bottom:14px;}
#xy-npccon .ncard.fac-demon{border-left-color:#b06cff;background:linear-gradient(145deg,rgba(176,108,255,.11),transparent 70%);}
#xy-npccon .ncard.fac-mortal{border-left-color:#d2b482;background:linear-gradient(145deg,rgba(210,180,130,.11),transparent 70%);}
#xy-npccon .ncard.fac-foe{border-left-color:#e26d8c;background:linear-gradient(145deg,rgba(226,109,140,.11),transparent 70%);}
#xy-npccon .ntop{display:flex;align-items:center;gap:9px;flex-wrap:wrap;}
#xy-npccon .nnm{font-size:18px;font-weight:700;color:var(--xn-text,#3a3a78);letter-spacing:.5px;font-family:'Kaiti SC','STKaiti','KaiTi','Songti SC',serif;}
#xy-npccon .nbadge{font-size:11px;padding:3px 10px;border-radius:7px;background:#7c7ff0;color:#fff;font-weight:600;}
#xy-npccon .fac-demon .nbadge{background:#b06cff;}#xy-npccon .fac-mortal .nbadge{background:#c79a52;}#xy-npccon .fac-foe .nbadge{background:#e26d8c;}
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
@media (max-width:520px){#xy-npccon-pop{width:90vw;}#xy-npccon{padding:12px 12px;}#xy-npccon .grid2,#xy-npccon .body{gap:6px 10px;}}
`;

  var trig = null, mask = null, pop = null, popBody = null;
  function injectStyle(){ var _ost = D.getElementById('xy-npccon-style'); if (_ost) _ost.remove(); var st = D.createElement('style'); st.id = 'xy-npccon-style'; st.textContent = CSS; (D.head || D.body).appendChild(st); }
  function setCount(n){ var el = trig && trig.querySelector('.cnt'); if (el) el.textContent = n ? ('· ' + n) : ''; }
  function updateCount(){ try { setCount(conReadNPCs().length); } catch (e) {} }

  function buildPop(){
    if (pop && D.body.contains(pop)) return;
    injectStyle();
    var oldm = D.getElementById('xy-npccon-mask'); if (oldm) oldm.remove();
    var oldp = D.getElementById('xy-npccon-pop'); if (oldp) oldp.remove();
    mask = D.createElement('div'); mask.id = 'xy-npccon-mask';
    pop = D.createElement('div'); pop.id = 'xy-npccon-pop';
    pop.innerHTML = '<div class="pophd"><span class="t">\u2699 NPC \u63a7 \u5236 \u53f0</span><span class="x" title="\u5173\u95ed">\u2715</span></div><div id="xy-npccon"><div class="tabs"></div><div class="det"><div class="empty">\u8bfb\u53d6\u6570\u636e\u5e93\u4e2d\u2026</div></div><div id="xy-npccon-toast"></div></div><span class="rsz" title="拖动调整大小"></span>';
    D.body.appendChild(mask); D.body.appendChild(pop);
    popBody = pop.querySelector('#xy-npccon');
    mask.addEventListener('click', closePop);
    pop.querySelector('.x').addEventListener('click', closePop);
    dragPop(pop.querySelector('.pophd'));
    resizePop(pop.querySelector('.rsz'));
  }
  function resizePop(handle){
    if (!handle) return;
    var sx, sy, ow, oh, down = false;
    var or_, ot;
    handle.addEventListener('pointerdown', function (e) {
      e.stopPropagation(); down = true; sx = e.clientX; sy = e.clientY;
      var r0 = pop.getBoundingClientRect(); ow = r0.width; oh = r0.height; or_ = r0.right; ot = r0.top;
      pop.style.maxHeight = 'none';
      try { handle.setPointerCapture(e.pointerId); } catch (_) {}
    });
    handle.addEventListener('pointermove', function (e) {
      if (!down) return; if (e.cancelable) e.preventDefault();
      var vh = W.innerHeight || 640;
      var w = Math.max(280, Math.min(or_ - 4, ow - (e.clientX - sx)));   // 向左拖变宽
      var h = Math.max(200, Math.min(vh - ot - 6, oh + (e.clientY - sy)));
      pop.style.width = w + 'px'; pop.style.height = h + 'px';
      pop.style.left = (or_ - w) + 'px';   // 右边缘固定，左移
      pop.style.right = 'auto';
    });
    function end(){ down = false; }
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }
  function centerPop(){
    if (!pop) return;
    var vw = W.innerWidth || (D.documentElement && D.documentElement.clientWidth) || 360;
    var vh = W.innerHeight || (D.documentElement && D.documentElement.clientHeight) || 640;
    var w = pop.offsetWidth || Math.min(440, vw * 0.94), h = pop.offsetHeight || 320;
    pop.style.right = 'auto'; pop.style.bottom = 'auto';
    pop.style.left = Math.max(4, Math.round((vw - w) / 2)) + 'px';
    pop.style.top = Math.max(8, Math.min(Math.max(8, vh - h - 72), Math.round((vh - h) / 2))) + 'px';
  }
  function openPop(){
    buildPop();
    conRefresh();
    mask.classList.add('show'); pop.classList.add('show');
    centerPop(); setTimeout(centerPop, 0);
  }
  function closePop(){ if (mask) mask.classList.remove('show'); if (pop) pop.classList.remove('show'); }
  function dragPop(handle){
    var sx, sy, ox, oy, down = false;
    handle.addEventListener('pointerdown', function (e) {
      if (e.target && e.target.classList && e.target.classList.contains('x')) return;
      down = true; sx = e.clientX; sy = e.clientY;
      var r = pop.getBoundingClientRect(); ox = r.left; oy = r.top;
      pop.style.left = ox + 'px'; pop.style.top = oy + 'px'; pop.style.right = 'auto'; pop.style.bottom = 'auto';
      try { handle.setPointerCapture(e.pointerId); } catch (_) {}
    });
    handle.addEventListener('pointermove', function (e) {
      if (!down) return; if (e.cancelable) e.preventDefault();
      var vw = W.innerWidth || 360, vh = W.innerHeight || 640, w = pop.offsetWidth, h = pop.offsetHeight;
      var nx = Math.max(2, Math.min(vw - w - 2, ox + (e.clientX - sx))), ny = Math.max(2, Math.min(vh - h - 2, oy + (e.clientY - sy)));
      pop.style.left = nx + 'px'; pop.style.top = ny + 'px';
    });
    function end(){ down = false; }
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }

  function buildTrig(){
    injectStyle();
    var old = D.getElementById('xy-npctrig'); if (old && old.parentNode) old.parentNode.removeChild(old);
    trig = D.createElement('div'); trig.id = 'xy-npctrig';
    trig.innerHTML = '<span class="btn" id="xy-npctrigbtn"><span class="ic">\u2699</span>NPC\u63a7\u5236\u53f0<span class="cnt"></span></span>';
    trig.querySelector('.btn').addEventListener('click', function () {
      if (pop && pop.classList.contains('show')) closePop(); else openPop();
    });
    updateCount();
  }
  function ensureMount(){
    var chat = D.getElementById('chat'); if (!chat) return;
    var mesList = chat.querySelectorAll('.mes');
    if (!mesList.length) { if (trig && trig.isConnected) trig.remove(); return; }
    if (!trig) buildTrig();
    injectStyle();
    var last = mesList[mesList.length - 1];
    var block = last.querySelector('.mes_block') || last;
    // 原位内联，但主动让位：把 NPC 钮插在状态栏(#xysb-root)前面，让状态栏稳坐最后一个 → 两边各占其位、不再来回顶，消除闪烁
    var sb = block.querySelector('#xysb-root');
    if (sb) {
      if (trig.parentNode !== block || trig.nextElementSibling !== sb) block.insertBefore(trig, sb);
    } else if (trig.parentNode !== block) {
      block.appendChild(trig);
    }
  }
  var dt = null;
  function debouncedMount(){ if (dt) clearTimeout(dt); dt = setTimeout(ensureMount, 150); }
  var MO = W.MutationObserver || MutationObserver;
  var observer = new MO(debouncedMount), observedChat = null;
  function startObserve(){ var chat = D.getElementById('chat'); if (chat && observedChat !== chat) { try { observer.disconnect(); } catch (e) {} observer.observe(chat, { childList: true }); observedChat = chat; } }
  var boundApi = null;
  function onTableUpdate(){ try { updateCount(); if (pop && pop.classList.contains('show')) conRefresh(); } catch (e) {} }
  function bindApi(){ var api = getAPI(); if (api && api !== boundApi) { boundApi = api; try { if (typeof api.registerTableUpdateCallback === 'function') api.registerTableUpdateCallback(onTableUpdate); } catch (e) {} } }
  function reposOnResize(){ if (pop && pop.classList.contains('show')) centerPop(); }
  try { W.addEventListener('resize', reposOnResize); W.addEventListener('orientationchange', function () { setTimeout(reposOnResize, 250); }); } catch (e) {}
  var heartbeat = setInterval(function () { bindApi(); startObserve(); ensureMount(); }, 1500);
  W.__XYNPCCON_CLEANUP__ = function () {
    try { clearInterval(heartbeat); } catch (e) {}
    try { observer.disconnect(); } catch (e) {}
    try { if (trig) trig.remove(); } catch (e) {}
    try { if (mask) mask.remove(); } catch (e) {}
    try { if (pop) pop.remove(); } catch (e) {}
    try { var s = D.getElementById('xy-npccon-style'); if (s) s.remove(); } catch (e) {}
    try { W.removeEventListener('resize', reposOnResize); } catch (e) {}
    try { if (boundApi && typeof boundApi.unregisterTableUpdateCallback === 'function') boundApi.unregisterTableUpdateCallback(onTableUpdate); } catch (e) {}
    try { delete W.__XYNPCCON_CLEANUP__; } catch (e) {}
  };
  buildTrig(); bindApi(); startObserve(); ensureMount();
})();
