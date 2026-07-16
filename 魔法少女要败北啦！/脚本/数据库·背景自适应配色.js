(function () {
  'use strict';
  var W; try { W = (window.parent && window.parent.document) ? window.parent : window; } catch (e) { W = window; }
  var D = W.document;
  var cache = {}, lastT = null, dbt=null;
  var SP = ':not(#z):not(#z):not(#z) .auto-card-updater-popup';
  function parseRGB(s){ if(!s) return null; s=String(s).trim();
    var r,g,b,m=s.match(/rgba?\(([^)]+)\)/);
    if(m){var p=m[1].split(',').map(parseFloat);r=p[0];g=p[1];b=p[2];}
    else if(s.charAt(0)==='#'){var h=s.slice(1);if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];r=parseInt(h.slice(0,2),16);g=parseInt(h.slice(2,4),16);b=parseInt(h.slice(4,6),16);}
    else return null; if(isNaN(r)||isNaN(g)||isNaN(b))return null; return {r:r,g:g,b:b}; }
  function rgb2hsl(r,g,b){ r/=255;g/=255;b/=255; var mx=Math.max(r,g,b),mn=Math.min(r,g,b),h,s,l=(mx+mn)/2;
    if(mx===mn){h=0;s=0;}else{var d=mx-mn;s=l>0.5?d/(2-mx-mn):d/(mx+mn);if(mx===r)h=(g-b)/d+(g<b?6:0);else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h/=6;}
    return [h*360,s,l]; }
  function build(c){
    var hsl=rgb2hsl(c.r,c.g,c.b), H=Math.round(hsl[0]), oS=hsl[1];
    var lum=(0.2126*c.r+0.7152*c.g+0.0722*c.b)/255, dark=lum<0.5;
    var S=Math.min(Math.max(oS,0.16),0.42), St=Math.min(oS,0.16), aS=Math.min(Math.max(oS,0.40),0.72);
    function hs(s,l){return 'hsl('+H+','+Math.round(s*100)+'%,'+l+'%)';}
    function ha(s,l,a){return 'hsla('+H+','+Math.round(s*100)+'%,'+l+'%,'+a+')';}
    var V={};
    if(dark){
      var acc=hs(aS,70), accL='hsla('+H+','+Math.round(aS*100)+'%,70%,0.18)';
      V['--acu-bg-0']=hs(S,12); V['--acu-bg-1']=hs(S,16); V['--acu-bg-2']=hs(S,22);
      V['--acu-bg-nav']=hs(S,16); V['--acu-bg-panel']=hs(S,12); V['--acu-card-bg']=ha(S,17,0.92);
      V['--acu-border']=ha(S,60,0.22); V['--acu-border-2']=ha(S,60,0.14);
      V['--acu-text-1']=hs(St,94); V['--acu-text-main']=hs(St,94); V['--acu-text-2']=hs(St,74);
      V['--acu-text-3']=hs(St,58); V['--acu-text-sub']=hs(St,58); V['--acu-text-overflow']=hs(St,58);
      V['--acu-accent']=acc; V['--acu-ui-color']=acc; V['--acu-title-color']=hs(St,96); V['--acu-accent-glow']='transparent';
      V['--acu-btn-bg']=hs(S,22); V['--acu-btn-hover']=hs(S,28); V['--acu-btn-active-bg']=acc; V['--acu-btn-active-text']=hs(St,98);
      V['--acu-table-head']=ha(S,20,0.9); V['--acu-table-hover']=ha(S,26,0.5);
      V['--acu-menu-bg']=hs(S,18); V['--acu-menu-text']=hs(St,94);
      V['--acu-input-bg']=ha(S,8,0.32); V['--acu-badge-bg']=hs(S,24); V['--acu-overlay-bg']=ha(S,6,0.55);
      V['--acu-highlight']=acc; V['--acu-highlight-bg']=accL; V['--acu-shadow']='rgba(0,0,0,0.5)';
      V._btnBg=V['--acu-btn-bg']; V._btnHover=V['--acu-btn-hover']; V._btnAB=acc; V._btnAT=hs(St,98);
      V._inputBg=V['--acu-input-bg']; V._border=V['--acu-border']; V._text=hs(St,94); V._menuBg=V['--acu-menu-bg']; V._menuText=hs(St,94);
    }else{
      var acl=hs(aS,45), aclG='hsla('+H+','+Math.round(aS*100)+'%,45%,0.14)';
      V['--acu-bg-0']=hs(S,96); V['--acu-bg-1']=hs(Math.min(S,0.30),99); V['--acu-bg-2']=hs(S,90);
      V['--acu-bg-nav']=hs(S,93); V['--acu-bg-panel']=hs(S,96); V['--acu-card-bg']=ha(Math.min(S,0.30),99,0.95);
      V['--acu-border']=ha(S,40,0.30); V['--acu-border-2']=ha(S,40,0.16);
      V['--acu-text-1']=hs(St,18); V['--acu-text-main']=hs(St,18); V['--acu-text-2']=hs(St,34);
      V['--acu-text-3']=hs(St,48); V['--acu-text-sub']=hs(St,48); V['--acu-text-overflow']=hs(St,48);
      V['--acu-accent']=acl; V['--acu-ui-color']=acl; V['--acu-title-color']=hs(St,22); V['--acu-accent-glow']='transparent';
      V['--acu-btn-bg']=hs(S,92); V['--acu-btn-hover']=hs(S,86); V['--acu-btn-active-bg']=acl; V['--acu-btn-active-text']='#ffffff';
      V['--acu-table-head']=hs(S,94); V['--acu-table-hover']=hs(S,90);
      V['--acu-menu-bg']='#ffffff'; V['--acu-menu-text']=hs(St,22);
      V['--acu-input-bg']='rgba(255,255,255,0.6)'; V['--acu-badge-bg']=hs(S,92); V['--acu-overlay-bg']=ha(S,30,0.35);
      V['--acu-highlight']=acl; V['--acu-highlight-bg']=aclG; V['--acu-shadow']='rgba(40,42,55,0.14)';
      V._btnBg=V['--acu-btn-bg']; V._btnHover=V['--acu-btn-hover']; V._btnAB=acl; V._btnAT='#ffffff';
      V._inputBg=V['--acu-input-bg']; V._border=V['--acu-border']; V._text=hs(St,18); V._menuBg='#ffffff'; V._menuText=hs(St,22);
    }
    return V;
  }
  function varCss(V){ var s=''; for(var k in V){ if(k.charAt(0)==='-'){ s+=k+':'+V[k]+' !important;'; } } return s; }
  function css(V){
    var v=varCss(V);
    return SP+'{'+v+'}'+
      '#acu-app-v2{'+v+'}'+
      SP+' button,'+SP+' .button{background:'+V._btnBg+' !important;color:'+V._text+' !important;border-color:'+V._border+' !important;}'+
      SP+' button:hover,'+SP+' .button:hover{background:'+V._btnHover+' !important;}'+
      SP+' button.primary,'+SP+' .button.primary{background:'+V._btnAB+' !important;color:'+V._btnAT+' !important;border-color:'+V._btnAB+' !important;}'+
      SP+' input:not([type="checkbox"]):not([type="radio"]),'+SP+' select,'+SP+' textarea{background:'+V._inputBg+' !important;color:'+V._text+' !important;border-color:'+V._border+' !important;}'+
      SP+' select option{background:'+V._menuBg+' !important;color:'+V._menuText+' !important;}'+
      SP+' .acu-card,'+SP+' .settings-section{background:'+V['--acu-card-bg']+' !important;border-color:'+V._border+' !important;}';
  }
  function applyInline(V){ try{ var ps=D.querySelectorAll('.auto-card-updater-popup'); for(var i=0;i<ps.length;i++){ for(var k in V){ if(k.charAt(0)==='-') ps[i].style.setProperty(k,V[k],'important'); } } }catch(e){} }
  function apply(V){
    lastT=V;
    var st=D.getElementById('acu-bg-adaptive');
    if(!st){ st=D.createElement('style'); st.id='acu-bg-adaptive'; (D.head||D.documentElement).appendChild(st); }
    st.textContent=css(V); applyInline(V);
  }
  function fromBg(cb){ // 采样背景图 -> rgb
    var el=D.querySelector('#bg1')||D.querySelector('#bg_custom')||D.body, bi='';
    try{ bi=W.getComputedStyle(el).backgroundImage||''; }catch(e){}
    var um=bi.match(/url\(["']?([^"')]+)["']?\)/);
    if(!um){ // 退回 SmartTheme
      try{ var cs=W.getComputedStyle(D.documentElement);
        var c=parseRGB(cs.getPropertyValue('--SmartThemeBlurTintColor'))||parseRGB(cs.getPropertyValue('--SmartThemeChatTintColor'));
        if(c){ cb(c); return; } }catch(e){}
      cb({r:36,g:38,b:47}); return;
    }
    var url=um[1];
    if(cache[url]){ cb(cache[url]); return; }
    var img=new Image(); img.crossOrigin='anonymous';
    img.onload=function(){ try{ var cv=D.createElement('canvas');cv.width=32;cv.height=32;var ctx=cv.getContext('2d');ctx.drawImage(img,0,0,32,32);
      var dt=ctx.getImageData(0,0,32,32).data,sr=0,sg=0,sb=0,n=0;for(var i=0;i<dt.length;i+=4){sr+=dt[i];sg+=dt[i+1];sb+=dt[i+2];n++;}
      var c={r:sr/n,g:sg/n,b:sb/n};cache[url]=c;cb(c);
    }catch(e){ cb({r:36,g:38,b:47}); } };
    img.onerror=function(){ cb({r:36,g:38,b:47}); };
    img.src=url;
  }
  // 跟随状态栏的 ◑ 模式(data-xysb-theme):auto=吸背景图 / light=中性浅 / dark=中性深
  function recompute(){
    var mode='auto'; try{ mode=D.body.getAttribute('data-xysb-theme')||'auto'; }catch(e){}
    dbt=mode;
    if(mode==='light'){ apply(build({r:236,g:241,b:247})); return; }
    if(mode==='dark'){ apply(build({r:36,g:38,b:47})); return; }
    fromBg(function(c){ apply(build(c)); });
  }
  W.__ACUBG3__=recompute;
  recompute(); setTimeout(recompute,500); setTimeout(recompute,1800);
  // ① 听状态栏写在 body 上的信号(模式切换 / 采样色更新)→ 实时重算
  try{ if(W.__ACUBG3_BODY__) W.__ACUBG3_BODY__.disconnect();
    var bt=null;
    W.__ACUBG3_BODY__=new W.MutationObserver(function(){ if(bt) return; bt=setTimeout(function(){ bt=null; recompute(); },120); });
    W.__ACUBG3_BODY__.observe(D.body,{attributes:true,attributeFilter:['data-xysb-theme','data-xysb-auto','style']});
  }catch(e){}
  // ② 面板重渲染时把已算好的色再贴上(节流)
  try{ if(W.__ACUBG3_MO__) W.__ACUBG3_MO__.disconnect();
    var mt=null;
    W.__ACUBG3_MO__=new W.MutationObserver(function(){ if(mt) return; mt=setTimeout(function(){ mt=null; if(lastT) applyInline(lastT); },200); });
    W.__ACUBG3_MO__.observe(D.body,{childList:true,subtree:true});
  }catch(e){}
  // ③ 背景图本身变化(auto 模式下重采样)
  try{ var bg=D.querySelector('#bg1')||D.querySelector('#bg_custom'); if(bg&&W.MutationObserver){ if(W.__ACUBG3_BGO__)W.__ACUBG3_BGO__.disconnect();
    W.__ACUBG3_BGO__=new W.MutationObserver(function(){ if((D.body.getAttribute('data-xysb-theme')||'auto')==='auto') recompute(); });
    W.__ACUBG3_BGO__.observe(bg,{attributes:true,attributeFilter:['style','src']}); }}catch(e){}
})();