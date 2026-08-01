import{c as lt,s as dt,a as ut}from"./inline-translate-oh347gzp.js";function pt(t){return/[A-Za-z]/.test(t||"")}function ft(t){return/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(t||"")}const j=new Set(["DIV","P","H1","H2","H3","H4","H5","H6","LI","BLOCKQUOTE","TD","TH","SECTION","ARTICLE","HEADER","FOOTER","MAIN","ASIDE","FIGURE","FIGCAPTION","PRE","TABLE","TR","TBODY","THEAD","TFOOT","UL","OL","DL","DD","DT","ADDRESS","FIELDSET","LEGEND","DETAILS","SUMMARY","FORM"]),ht=new Set(["SCRIPT","STYLE","TEXTAREA","SVG","NOSCRIPT","IFRAME","BR","KBD","WBR","SELECT","DATALIST","OPTION","OPTGROUP","OBJECT","EMBED","CANVAS","AUDIO","VIDEO","TRACK","MAP","AREA","MATH","MJX-CONTAINER"]),mt=new Set(["katex","MathJax","mathjax","math"]),G=1e3,gt=new Set(["#__ai_translate_panel_host__","#__ai_translate_read_aloud_host__","#__ai_translate_popper_host__","#__mt_control_bar_host__","#__immersive_control_bar_host__"]);function yt(t){let e=t.parentElement;for(;e;){if(j.has(e.tagName)||e===document.body)return e;e=e.parentElement}return document.body}function bt(t){var e,n,o,s,a;if(ht.has(t.tagName)||(e=t.classList)!=null&&e.contains("notranslate")||((n=t.getAttribute)==null?void 0:n.call(t,"translate"))==="no"||t.isContentEditable||((o=t.getAttribute)==null?void 0:o.call(t,"contenteditable"))==="true"||t.id&&gt.has(t.id)||((s=t.dataset)==null?void 0:s.immersiveOriginal)!==void 0||((a=t.dataset)==null?void 0:a.immersiveTranslated)!==void 0)return!0;if(t.classList){for(const i of mt)if(t.classList.contains(i))return!0}return!1}function xt(t,e){return e==="en-zh"&&!pt(t)||e==="zh-en"&&!ft(t)}function wt(t,e){for(const n of e)try{t.querySelectorAll(n).forEach(o=>{o.classList.add("notranslate")})}catch{}}function St(t,e){var n;if((n=e==null?void 0:e.containerSelectors)!=null&&n.length){const o=[];for(const s of e.containerSelectors)try{t.querySelectorAll(s).forEach(a=>o.push(a))}catch{}return o.length>0?o:[t]}return[t]}function K(t,e={}){var d;const{direction:n="auto",limit:o=500,rule:s=null}=e;(d=s==null?void 0:s.noTranslateSelectors)!=null&&d.length&&wt(t,s.noTranslateSelectors);const a=St(t,s),i=[];let c=0;for(const p of a)Et(p,n,i,()=>(c++,`p${c}`));return i.slice(0,o)}function Et(t,e,n,o){let s=null;const a=c=>(s&&s.text.length>=G&&(f(s,n),s=null),s||(s={id:o(),blockEl:c||document.body,textNodes:[],text:"",status:"pending"}),s),i=(c,l)=>{if(c.nodeType===Node.TEXT_NODE){const N=c.textContent.trim();if(N.length===0||xt(N,e))return;const it=l||yt(c);let x=N;for(;x.length>0;){const y=a(it),$=y.text?" ":"",L=G-y.text.length-$.length;if(L<=0){f(y,n),s=null;continue}const ct=x.slice(0,L);y.textNodes.push(c),y.text+=$+ct,x=x.slice(L),x.length>0&&(f(y,n),s=null)}return}if(c.nodeType!==Node.ELEMENT_NODE)return;const d=c;if(bt(d)){s&&(f(s,n),s=null);return}const p=j.has(d.tagName),T=p?d:l;p&&s&&(f(s,n),s=null);for(const U of d.childNodes)i(U,T);p&&s&&(f(s,n),s=null)};i(t,null),s&&f(s,n)}function f(t,e){t.textNodes.length>0&&t.text.trim().length>0&&e.push(t)}const vt="immersive-translate-cache",Tt=1,_="translations";function _t(){let t=null;function e(){return new Promise((s,a)=>{const i=indexedDB.open(vt,Tt);i.onupgradeneeded=c=>{const l=c.target.result;l.objectStoreNames.contains(_)||l.createObjectStore(_)},i.onsuccess=()=>s(i.result),i.onerror=()=>a(i.error)})}function n(s){if(!t)throw new Error("Cache not initialized");return t.transaction(_,s).objectStore(_)}function o(s){return new Promise((a,i)=>{s.onsuccess=()=>a(s.result),s.onerror=()=>i(s.error)})}return{async init(){t=await e()},async get(s){return o(n("readonly").get(s))},async set(s,a){await o(n("readwrite").put(a,s))},async delete(s){await o(n("readwrite").delete(s))},async clear(){await o(n("readwrite").clear())},async getMany(s){const a=new Map;for(const i of s){const c=await o(n("readonly").get(i));c!==void 0&&a.set(i,c)}return a},async setMany(s){for(const[a,i]of s)await o(n("readwrite").put(i,a))}}}function F(t,e){return`${e}::${t}`}function kt(t={}){const e=t.backend||_t();return{async init(){e.init&&await e.init()},async query(n,o){const s=n.map(l=>F(l,o)),a=await e.getMany(s),i=new Map,c=[];for(let l=0;l<n.length;l++){const d=a.get(s[l]);d!==void 0?i.set(n[l],d.translation):c.push(n[l])}return{hit:i,miss:c}},async write(n){if(n.length===0)return;const o=n.map(s=>[F(s.text,s.direction),{translation:s.translation,timestamp:Date.now()}]);await e.setMany(o)},async clear(){await e.clear()}}}const Ct=[{hosts:["twitter.com","x.com"],containerSelectors:["article",'[data-testid="tweetText"]'],noTranslateSelectors:['[data-testid="User-Name"]',"time"]},{hosts:["reddit.com","old.reddit.com"],containerSelectors:[".Post",".Comment",'[data-testid="post-container"]'],noTranslateSelectors:[".vote-buttons",".Post__flatListItemButton"]},{hosts:["news.ycombinator.com"],containerSelectors:[".athing",".commtext"],noTranslateSelectors:[".votearrow",".score"]},{hosts:["github.com"],containerSelectors:[".markdown-body",".comment-body",".blob-code"],noTranslateSelectors:[".blob-num",".js-clipboard"]},{hosts:["wikipedia.org"],containerSelectors:["#mw-content-text"],noTranslateSelectors:[".mw-editsection",".reference",".citation"]}];function X(t){let e;try{e=new URL(t).hostname}catch{return null}for(const n of Ct)if(n.hosts.some(o=>e.includes(o)))return n;return null}const J="data-immersive-translated",At="data-immersive-original",Y="span";function Nt(t){const e=t.cloneNode(!0);return e.setAttribute(At,"1"),e.style.display="none",t.parentNode.insertBefore(e,t),{clone:e,blockEl:t}}function C(t,e){const n=[];if(t.textNodes.length===0)return n;const o=Array.isArray(e)?e[0]:e,s=o&&typeof o=="object"?o.translation||"":String(o||"");for(let a=0;a<t.textNodes.length;a++){const i=t.textNodes[a],c=document.createElement(Y);c.setAttribute(J,"1"),a===0?c.textContent=s:(c.textContent="",c.style.display="none"),i.parentNode.replaceChild(c,i),n.push({originalNode:i,translatedSpan:c,blockEl:t.blockEl})}return t.status="translated",n}function Q(t,e,n){const o=document.createElement(Y);if(o.setAttribute(J,"1"),o.setAttribute("data-immersive-failed","1"),o.style.cssText="color:#e53935;cursor:pointer;border-bottom:1px dashed #e53935;",o.textContent=`翻译失败：${e.message}（点击重试）`,o.addEventListener("click",()=>n(t)),t.textNodes.length>0){const s=t.textNodes[0];s.parentNode.replaceChild(o,s)}return t.status="failed",[{originalNode:t.textNodes[0],translatedSpan:o,blockEl:t.blockEl}]}function E(t,e,n){const o=new Set;for(const{blockEl:s}of n)o.add(s);for(const[s,a]of e)if(o.has(s))switch(t){case"dual":a.style.display="",a.style.opacity="0.6",s.style.display="";break;case"translated":a.style.display="none",s.style.display="";break;case"original":a.style.display="",a.style.opacity="",s.style.display="none";break}}function Lt(t,e){for(let n=t.length-1;n>=0;n--){const{originalNode:o,translatedSpan:s}=t[n];s.parentNode&&s.parentNode.replaceChild(o,s)}for(const n of e.values())n.parentNode&&n.parentNode.removeChild(n)}const R="__immersive_control_bar_host__",Z=500,Rt=3,Bt=500,It=50,Mt=`
<style>
  :host { all: initial; }
  .bar {
    position: fixed; top: 20px; right: 20px; z-index: 2147483647;
    display: flex; align-items: center; gap: 8px;
    padding: 8px 14px; border-radius: 8px;
    background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,0.15);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 13px; color: #333;
  }
  .bar.flash { animation: flash 0.5s ease; }
  @keyframes flash {
    0%, 100% { box-shadow: 0 2px 12px rgba(0,0,0,0.15); }
    50% { box-shadow: 0 0 0 4px #4a90d9, 0 2px 12px rgba(0,0,0,0.15); }
  }
  .status { font-weight: 600; white-space: nowrap; }
  .count { color: #666; white-space: nowrap; }
  .hint { color: #e53935; font-size: 12px; }
  .spacer { flex: 1; }
  .btn {
    padding: 4px 10px; border: 1px solid #ddd; border-radius: 4px;
    background: #fff; cursor: pointer; font-size: 12px; color: #333;
    white-space: nowrap;
  }
  .btn:hover { background: #f0f0f0; }
  .btn.active { background: #4a90d9; color: #fff; border-color: #4a90d9; }
  .btn-danger { color: #e53935; border-color: #e53935; }
  .btn-danger:hover { background: #ffebee; }
</style>
<div class="bar">
  <span class="status">沉浸式中…</span>
  <span class="count">0/0</span>
  <span class="hint"></span>
  <span class="spacer"></span>
  <button class="btn mode-btn" data-mode="original">原文</button>
  <button class="btn mode-btn" data-mode="translated">译文</button>
  <button class="btn mode-btn active" data-mode="dual">双语</button>
  <button class="btn pause-btn">暂停</button>
  <button class="btn btn-danger retry-btn" style="display:none;">重试失败</button>
  <button class="btn clear-btn">清除</button>
</div>
`,r={active:!1,cancelled:!1,paused:!1,mode:"dual",direction:"",pieces:[],clones:new Map,translatedSpans:[],completedCount:0,failedCount:0,totalCount:0,pool:null,observer:null,debounceTimer:null,cache:null,controlBar:null,retryGen:0};function g(){return r.direction||"auto"}async function tt(t){const e=g();let n;try{n=await chrome.runtime.sendMessage({type:"DO_TRANSLATE",text:t,direction:e})}catch(s){const a=(s==null?void 0:s.message)||String(s);throw a.includes("Extension context invalidated")?new Error("插件已更新，请刷新页面后重试"):new Error(`通信失败：${a}`)}if(!n)throw new Error("后台未响应翻译请求");if(n.error)throw new Error(n.error);const o=n.result;if(typeof o=="string")return o;if(o!=null&&o.translation)return o.translation;throw new Error("翻译结果格式异常")}function Ot(){var n;(n=document.getElementById(R))==null||n.remove();const t=document.createElement("div");t.id=R,t.style.cssText="position:fixed; top:0; right:0; z-index:2147483647;";const e=t.attachShadow({mode:"open"});e.innerHTML=Mt,document.body.appendChild(t),e.querySelector(".clear-btn").addEventListener("click",nt),e.querySelector(".retry-btn").addEventListener("click",Ft),e.querySelector(".pause-btn").addEventListener("click",zt),e.querySelectorAll(".mode-btn").forEach(o=>{o.addEventListener("click",()=>{const s=o.dataset.mode;Ht(s)})}),r.controlBar={host:t,shadow:e},u()}function u(){if(!r.controlBar)return;const t=r.controlBar.shadow,{active:e,completedCount:n,failedCount:o,totalCount:s,paused:a}=r,i=t.querySelector(".status"),c=t.querySelector(".count"),l=t.querySelector(".hint"),d=t.querySelector(".retry-btn"),p=t.querySelector(".pause-btn");a?i.textContent="已暂停":e?i.textContent="沉浸式中…":i.textContent="完成",c.textContent=`${n+o}/${s}`,!e&&o>0?(l.textContent=`${o}段失败`,d.style.display=""):(l.textContent="",d.style.display="none"),p&&(p.textContent=a?"继续":"暂停",p.classList.toggle("active",a)),t.querySelectorAll(".mode-btn").forEach(T=>{T.classList.toggle("active",T.dataset.mode===r.mode)})}function Pt(){if(!r.controlBar)return;const t=r.controlBar.shadow.querySelector(".bar");t.classList.remove("flash"),t.offsetWidth,t.classList.add("flash")}function Dt(){var t;(t=document.getElementById(R))==null||t.remove(),r.controlBar=null}function Ht(t){r.mode=t,E(t,r.clones,r.translatedSpans),u()}function zt(){r.paused=!r.paused,u()}async function qt(){for(;r.paused&&!r.cancelled;)await new Promise(t=>setTimeout(t,200));return!r.cancelled}function et(t){const e=new Set;for(const n of t){if(!n.blockEl||e.has(n.blockEl))continue;e.add(n.blockEl);const{clone:o}=Nt(n.blockEl);r.clones.set(n.blockEl,o)}}async function q(t){const e=lt({items:t,concurrency:Rt,shouldCancel:()=>r.cancelled,worker:async o=>{if(r.cancelled||!await qt())return;const s=await tt(o.text);if(r.cancelled)return;const a=C(o,s);r.translatedSpans.push(...a),r.completedCount++,E(r.mode,r.clones,a),r.cache&&await r.cache.write([{text:o.text,direction:g(),translation:s}]),u()}});r.pool=e;const n=await e.promise;if(r.pool=null,n.failed.length>0){for(const{item:o,error:s}of n.failed){const a=Q(o,s,ot);r.translatedSpans.push(...a),r.failedCount++}u()}r.active=!1,u()}function Ut(){if(r.observer)return;const t=new MutationObserver(()=>{r.debounceTimer||(r.debounceTimer=setTimeout(()=>{r.debounceTimer=null,$t()},Bt))});t.observe(document.body,{childList:!0,subtree:!0}),r.observer=t}function $t(){if(r.cancelled||!r.observer||!r.controlBar)return;const t=X(location.href),o=K(document.body,{direction:g(),limit:Z,rule:t}).filter(s=>s.status==="pending").slice(0,It).filter(s=>!r.clones.has(s.blockEl));o.length!==0&&(et(o),Gt(o))}async function Gt(t){const e=t.map(a=>a.text),{hit:n,miss:o}=await r.cache.query(e,g());for(const a of t)if(n.has(a.text)){const i=C(a,n.get(a.text));r.translatedSpans.push(...i),r.completedCount++,E(r.mode,r.clones,i)}u();const s=t.filter(a=>o.includes(a.text));s.length>0&&await q(s)}function nt(){r.cancelled=!0,r.pool&&r.pool.cancel(),r.debounceTimer&&(clearTimeout(r.debounceTimer),r.debounceTimer=null),r.observer&&(r.observer.disconnect(),r.observer=null),Lt(r.translatedSpans,r.clones),Dt(),r.active=!1,r.cancelled=!1,r.paused=!1,r.pieces=[],r.clones=new Map,r.translatedSpans=[],r.completedCount=0,r.failedCount=0,r.totalCount=0,r.mode="dual"}async function ot(t){const e=r.retryGen;if(r.cancelled||!r.controlBar)return;const n=new Set(t.textNodes);for(let o=r.translatedSpans.length-1;o>=0;o--)if(n.has(r.translatedSpans[o].originalNode)){const{originalNode:s,translatedSpan:a}=r.translatedSpans[o];a.parentNode&&a.parentNode.replaceChild(s,a),r.translatedSpans.splice(o,1)}t.status="pending",r.failedCount=Math.max(0,r.failedCount-1);try{const o=await tt(t.text);if(r.cancelled||!r.controlBar||e!==r.retryGen)return;const s=C(t,o);r.translatedSpans.push(...s),r.completedCount++,E(r.mode,r.clones,s),r.cache&&await r.cache.write([{text:t.text,direction:g(),translation:o}])}catch(o){if(r.cancelled||!r.controlBar||e!==r.retryGen)return;const s=Q(t,o,ot);r.translatedSpans.push(...s),r.failedCount++}u()}async function Ft(){if(r.active)return;const t=r.pieces.filter(e=>e.status==="failed");if(t.length!==0){for(const e of t){const n=new Set(e.textNodes);for(let o=r.translatedSpans.length-1;o>=0;o--)if(n.has(r.translatedSpans[o].originalNode)){const{originalNode:s,translatedSpan:a}=r.translatedSpans[o];a.parentNode&&a.parentNode.replaceChild(s,a),r.translatedSpans.splice(o,1)}e.status="pending"}r.retryGen++,r.cancelled=!1,r.failedCount=0,r.active=!0,u(),await q(t)}}async function Wt(t){if(r.active){r.controlBar&&Pt();return}r.cancelled=!1,r.completedCount=0,r.failedCount=0,r.mode="dual",r.direction=t,r.clones=new Map,r.translatedSpans=[],r.cache=kt(),await r.cache.init();const e=X(location.href),n=K(document.body,{direction:g(),limit:Z,rule:e});if(n.length===0){alert("未找到可翻译的段落");return}r.pieces=n,r.totalCount=n.length,r.active=!0,Ot(),et(n);const o=n.map(c=>c.text),{hit:s,miss:a}=await r.cache.query(o,g());for(const c of n)if(s.has(c.text)){const l=C(c,s.get(c.text));r.translatedSpans.push(...l),r.completedCount++,E(r.mode,r.clones,l)}u();const i=n.filter(c=>a.includes(c.text));i.length>0&&await q(i),r.cancelled||Ut()}function Vt(){nt()}const A="__ai_translate_panel_host__",B="__ai_translate_read_aloud_host__",v="__ai_translate_popper_host__",W=5e3,b={interactionMode:"selection",voiceChinese:"",voiceEnglish:""};async function st(){var t;try{const e=await chrome.storage.local.get("settings"),n=(t=e==null?void 0:e.settings)==null?void 0:t.translate;n&&(b.interactionMode=n.interactionMode||"selection",b.voiceChinese=n.voiceChinese||"",b.voiceEnglish=n.voiceEnglish||"")}catch{}}let k=[],m="",h="";function I(){"speechSynthesis"in window&&(k=window.speechSynthesis.getVoices())}function jt(t){const n=t.startsWith("zh")?b.voiceChinese:b.voiceEnglish;if(n){const a=k.find(i=>i.voiceURI===n);if(a)return a}let o=k.find(a=>a.lang===t);if(o)return o;const s=t.split("-")[0];return o=k.find(a=>a.lang.startsWith(s)),o||null}function rt(t,e,n,o){if(!("speechSynthesis"in window)){h="当前浏览器不支持语音合成",o();return}I();const s=window.speechSynthesis;s.cancel();const a=new SpeechSynthesisUtterance(t),i=/[\u4e00-\u9fa5]/.test(t);a.lang=i?"zh-CN":"en-US";const c=jt(a.lang);c&&(a.voice=c),a.rate=e,a.pitch=1,a.volume=1,a.onstart=()=>{m=n,h="",o()},a.onend=()=>{m="",o()},a.onerror=l=>{m="";const d=(l==null?void 0:l.error)||"未知错误";d==="not-allowed"||d==="service-not-allowed"?h="浏览器拒绝了语音播放，请检查系统音频/语音权限":d==="no-speech"||d==="synthesis-failed"?h=`朗读失败：系统可能未安装 ${a.lang} 语音包（错误：${d}）`:h=`朗读失败：${d}`,o()},setTimeout(()=>s.speak(a),50)}function S(){"speechSynthesis"in window&&window.speechSynthesis.cancel(),m=""}async function M(t,e){let n;try{n=await chrome.runtime.sendMessage({type:"DO_TRANSLATE",text:t,direction:e||"auto"})}catch(o){const s=(o==null?void 0:o.message)||String(o);throw s.includes("Extension context invalidated")?new Error("插件已更新，请刷新页面后重试"):new Error(`通信失败：${s}`)}if(!n)throw new Error("后台未响应翻译请求");if(n.error)throw new Error(n.error);return n.result}function Kt(){var t;(t=document.getElementById(A))==null||t.remove()}function O(t){Kt(),S(),h="";const e=document.createElement("div");e.id=A,e.style.cssText="position:fixed; z-index:2147483647; max-width:440px;",t==="corner"?(e.style.top="20px",e.style.right="20px"):Xt(e);const n=e.attachShadow({mode:"open"});return n.innerHTML=Zt,document.body.appendChild(e),n.querySelector(".close-btn").addEventListener("click",()=>{S(),e.remove()}),n}function Xt(t){let e=80,n=80;const o=window.getSelection();if(o&&o.rangeCount>0){const i=o.getRangeAt(0).getBoundingClientRect();(i.width>0||i.height>0)&&(e=i.bottom+10,n=i.left)}const s=420,a=320;n+s>window.innerWidth-20&&(n=window.innerWidth-s-20),n<10&&(n=10),e+a>window.innerHeight-20&&(e=Math.max(10,(window.innerHeight-a)/2)),t.style.top=e+"px",t.style.left=n+"px"}function P(t){t.querySelector(".body").innerHTML='<div class="loading">翻译中...</div>'}function D(t,e,n){const o=t.querySelector(".body"),s=n?'<div class="truncated-hint">页面内容较长，仅翻译前 5000 字</div>':"",a=e.notes?`<div class="result-notes">${z(e.notes)}</div>`:"";o.innerHTML=`
    ${s}
    <div class="result-text">${z(e.translation)}</div>
    ${a}
    <div class="speak-row">
      <button class="speak-btn" data-key="result-normal" data-rate="1">朗读</button>
      <button class="speak-btn" data-key="result-slow" data-rate="0.6">慢速</button>
    </div>
    <div class="speak-hint"></div>
  `;const i=e.translation;t.querySelectorAll(".speak-btn").forEach(c=>{c.addEventListener("click",()=>{const l=c.dataset.key,d=parseFloat(c.dataset.rate);m===l?(S(),V(t)):rt(i,d,l,()=>V(t))})})}function H(t,e){t.querySelector(".body").innerHTML=`<div class="error">${z(e)}</div>`}function V(t){t.querySelectorAll(".speak-btn").forEach(n=>{const o=n.dataset.key;m===o?(n.classList.add("speaking"),n.textContent="停止"):(n.classList.remove("speaking"),n.textContent=n.dataset.key==="result-slow"?"慢速":"朗读")});const e=t.querySelector(".speak-hint");e&&(e.textContent=h)}function z(t){const e=document.createElement("div");return e.textContent=String(t),e.innerHTML}function at(t){var o;(o=document.getElementById(B))==null||o.remove(),S();const e=document.createElement("div");e.id=B,e.style.cssText="position:fixed; top:20px; right:20px; z-index:2147483647;";const n=e.attachShadow({mode:"open"});n.innerHTML=`
    <style>
      .control {
        background: #fff;
        border-radius: 20px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        padding: 8px 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        color: #333;
      }
      .icon { font-size: 16px; }
      .stop-btn {
        background: #4a90d9;
        color: #fff;
        border: none;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        cursor: pointer;
      }
      .stop-btn:hover { background: #3a7dc1; }
    </style>
    <div class="control">
      <span class="icon">🔊</span>
      <span>朗读中...</span>
      <button class="stop-btn">停止</button>
    </div>
  `,document.body.appendChild(e),n.querySelector(".stop-btn").addEventListener("click",()=>{S(),e.remove()}),rt(t,1,"read-aloud",()=>{m||e.remove()})}function w(){var t;(t=document.getElementById(v))==null||t.remove()}function Jt(){const t=window.getSelection();if(!t||t.rangeCount===0)return!1;const e=t.anchorNode;if(!e)return!1;const n=e.nodeType===1?e:e.parentElement;return n?!!n.closest(`#${A}, #${B}, #${v}`):!1}function Yt(t,e){w();const n=document.createElement("div");n.id=v,n.style.cssText="position:fixed; z-index:2147483647;";const o=n.attachShadow({mode:"open"});o.innerHTML=`
    <style>
      .popper {
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.15);
        padding: 4px;
        display: flex;
        gap: 2px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .popper-btn {
        background: transparent;
        border: none;
        color: #4a90d9;
        padding: 6px 14px;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
        white-space: nowrap;
      }
      .popper-btn:hover { background: #eef4fc; }
    </style>
    <div class="popper">
      <button class="popper-btn" data-action="translate">翻译</button>
      <button class="popper-btn" data-action="read">朗读</button>
    </div>
  `,document.body.appendChild(n),o.querySelector(".popper");const s=36,a=120;let i=t.top-s-6;i<8&&(i=t.bottom+6);let c=t.left;c+a>window.innerWidth-12&&(c=window.innerWidth-a-12),c<8&&(c=8),n.style.top=i+"px",n.style.left=c+"px",o.querySelector('[data-action="translate"]').addEventListener("click",()=>{w();const l=O("selection");P(l),M(e,"auto").then(d=>D(l,d,!1)).catch(d=>H(l,d.message))}),o.querySelector('[data-action="read"]').addEventListener("click",()=>{w(),at(e)})}document.addEventListener("mouseup",t=>{if(b.interactionMode!=="selection")return;const e=document.getElementById(v);if(e&&e.contains(t.target))return;const n=document.getElementById(A);if(n&&n.contains(t.target))return;const o=window.getSelection(),s=o==null?void 0:o.toString().trim();if(!s){w();return}if(Jt()||o.rangeCount===0)return;const a=o.getRangeAt(0).getBoundingClientRect();a.width===0&&a.height===0||Yt(a,s)});document.addEventListener("mousedown",t=>{const e=document.getElementById(v);e&&!e.contains(t.target)&&w()},!0);function Qt(){const t=(document.body.innerText||"").trim();return{text:t.slice(0,W),truncated:t.length>W}}chrome.runtime.onMessage.addListener(t=>{if(t.type==="translate-selection"){const e=(t.selectionText||"").trim();if(!e)return;const n=O("selection");P(n),M(e,"auto").then(o=>D(n,o,!1)).catch(o=>H(n,o.message));return}if(t.type==="translate-page"){const{text:e,truncated:n}=Qt();if(!e)return;const o=O("corner");P(o),M(e,"auto").then(s=>D(o,s,n)).catch(s=>H(o,s.message));return}if(t.type==="translate-page-inline"){const e=t.direction||"auto";Vt(),dt(e);return}if(t.type==="immersive-translate"){const e=t.direction||"auto";ut(),Wt(e);return}if(t.type==="read-aloud"){const e=(t.selectionText||"").trim();if(!e)return;at(e);return}});"speechSynthesis"in window&&(I(),window.speechSynthesis.onvoiceschanged=I);st();chrome.storage.onChanged.addListener(t=>{var e,n;(n=(e=t.settings)==null?void 0:e.newValue)!=null&&n.translate&&st()});const Zt=`
<style>
  .panel {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    color: #333;
    width: 420px;
    max-height: 400px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #eee;
  }
  .title { font-size: 15px; font-weight: 600; }
  .close-btn {
    background: transparent;
    border: none;
    font-size: 20px;
    color: #999;
    cursor: pointer;
    padding: 0 4px;
    line-height: 1;
  }
  .close-btn:hover { color: #333; }
  .body { padding: 14px 16px; overflow-y: auto; flex: 1; }
  .loading { color: #888; padding: 20px 0; text-align: center; }
  .result-text {
    font-size: 15px;
    line-height: 1.6;
    color: #333;
    margin-bottom: 10px;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .result-notes {
    font-size: 13px;
    color: #666;
    line-height: 1.5;
    background: #f9f9f9;
    padding: 8px 12px;
    border-radius: 6px;
    margin-bottom: 10px;
  }
  .truncated-hint { font-size: 12px; color: #e6a700; margin-bottom: 8px; }
  .speak-row { display: flex; gap: 8px; margin-top: 10px; }
  .speak-btn {
    background: transparent;
    border: 1px solid #4a90d9;
    color: #4a90d9;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
  }
  .speak-btn.speaking { background: #4a90d9; color: #fff; }
  .speak-hint { font-size: 12px; color: #e53935; margin-top: 8px; min-height: 14px; }
  .error { color: #e53935; font-size: 13px; padding: 8px 0; line-height: 1.5; }
</style>
<div class="panel">
  <div class="header">
    <span class="title">AI 翻译</span>
    <button class="close-btn">×</button>
  </div>
  <div class="body">
    <div class="loading">翻译中...</div>
  </div>
</div>
`;
