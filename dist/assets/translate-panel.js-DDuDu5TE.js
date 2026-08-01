import{c as lt,s as dt,a as ut}from"./inline-translate-DMaYHONP.js";function pt(t){return/[A-Za-z]/.test(t||"")}function ft(t){return/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(t||"")}const W=new Set(["DIV","P","H1","H2","H3","H4","H5","H6","LI","BLOCKQUOTE","TD","TH","SECTION","ARTICLE","HEADER","FOOTER","MAIN","ASIDE","FIGURE","FIGCAPTION","PRE","TABLE","TR","TBODY","THEAD","TFOOT","UL","OL","DL","DD","DT","ADDRESS","FIELDSET","LEGEND","DETAILS","SUMMARY","FORM"]),ht=new Set(["SCRIPT","STYLE","TEXTAREA","SVG","NOSCRIPT","IFRAME","BR","KBD","WBR","SELECT","DATALIST","OPTION","OPTGROUP","OBJECT","EMBED","CANVAS","AUDIO","VIDEO","TRACK","MAP","AREA"]),$=1e3,mt=new Set(["#__ai_translate_panel_host__","#__ai_translate_read_aloud_host__","#__ai_translate_popper_host__","#__mt_control_bar_host__","#__immersive_control_bar_host__"]);function yt(t){let e=t.parentElement;for(;e;){if(W.has(e.tagName)||e===document.body)return e;e=e.parentElement}return document.body}function gt(t){var e,n,s,o,a;return!!(ht.has(t.tagName)||(e=t.classList)!=null&&e.contains("notranslate")||((n=t.getAttribute)==null?void 0:n.call(t,"translate"))==="no"||t.isContentEditable||((s=t.getAttribute)==null?void 0:s.call(t,"contenteditable"))==="true"||t.id&&mt.has(t.id)||((o=t.dataset)==null?void 0:o.immersiveOriginal)!==void 0||((a=t.dataset)==null?void 0:a.immersiveTranslated)!==void 0)}function bt(t,e){return e==="en-zh"&&!pt(t)||e==="zh-en"&&!ft(t)}function xt(t,e){for(const n of e)try{t.querySelectorAll(n).forEach(s=>{s.classList.add("notranslate")})}catch{}}function wt(t,e){var n;if((n=e==null?void 0:e.containerSelectors)!=null&&n.length){const s=[];for(const o of e.containerSelectors)try{t.querySelectorAll(o).forEach(a=>s.push(a))}catch{}return s.length>0?s:[t]}return[t]}function K(t,e={}){var d;const{direction:n="auto",limit:s=500,rule:o=null}=e;(d=o==null?void 0:o.noTranslateSelectors)!=null&&d.length&&xt(t,o.noTranslateSelectors);const a=wt(t,o),c=[];let i=0;for(const b of a)St(b,n,c,()=>(i++,`p${i}`));return c.slice(0,s)}function St(t,e,n,s){let o=null;const a=i=>(o&&o.text.length>=$&&(p(o,n),o=null),o||(o={id:s(),blockEl:i||document.body,textNodes:[],text:"",status:"pending"}),o),c=(i,l)=>{if(i.nodeType===Node.TEXT_NODE){const A=i.textContent.trim();if(A.length===0||bt(A,e))return;const it=l||yt(i);let x=A;for(;x.length>0;){const y=a(it),U=y.text?" ":"",L=$-y.text.length-U.length;if(L<=0){p(y,n),o=null;continue}const ct=x.slice(0,L);y.textNodes.push(i),y.text+=U+ct,x=x.slice(L),x.length>0&&(p(y,n),o=null)}return}if(i.nodeType!==Node.ELEMENT_NODE)return;const d=i;if(gt(d)){o&&(p(o,n),o=null);return}const b=W.has(d.tagName),at=b?d:l;b&&o&&(p(o,n),o=null);for(const q of d.childNodes)c(q,at);b&&o&&(p(o,n),o=null)};c(t,null),o&&p(o,n)}function p(t,e){t.textNodes.length>0&&t.text.trim().length>0&&e.push(t)}const Et="immersive-translate-cache",vt=1,_="translations";function _t(){let t=null;function e(){return new Promise((o,a)=>{const c=indexedDB.open(Et,vt);c.onupgradeneeded=i=>{const l=i.target.result;l.objectStoreNames.contains(_)||l.createObjectStore(_)},c.onsuccess=()=>o(c.result),c.onerror=()=>a(c.error)})}function n(o){if(!t)throw new Error("Cache not initialized");return t.transaction(_,o).objectStore(_)}function s(o){return new Promise((a,c)=>{o.onsuccess=()=>a(o.result),o.onerror=()=>c(o.error)})}return{async init(){t=await e()},async get(o){return s(n("readonly").get(o))},async set(o,a){await s(n("readwrite").put(a,o))},async delete(o){await s(n("readwrite").delete(o))},async clear(){await s(n("readwrite").clear())},async getMany(o){const a=new Map;for(const c of o){const i=await s(n("readonly").get(c));i!==void 0&&a.set(c,i)}return a},async setMany(o){for(const[a,c]of o)await s(n("readwrite").put(c,a))}}}function G(t,e){return`${e}::${t}`}function Tt(t={}){const e=t.backend||_t();return{async init(){e.init&&await e.init()},async query(n,s){const o=n.map(l=>G(l,s)),a=await e.getMany(o),c=new Map,i=[];for(let l=0;l<n.length;l++){const d=a.get(o[l]);d!==void 0?c.set(n[l],d.translation):i.push(n[l])}return{hit:c,miss:i}},async write(n){if(n.length===0)return;const s=n.map(o=>[G(o.text,o.direction),{translation:o.translation,timestamp:Date.now()}]);await e.setMany(s)},async clear(){await e.clear()}}}const kt=[{hosts:["twitter.com","x.com"],containerSelectors:["article",'[data-testid="tweetText"]'],noTranslateSelectors:['[data-testid="User-Name"]',"time"]},{hosts:["reddit.com","old.reddit.com"],containerSelectors:[".Post",".Comment",'[data-testid="post-container"]'],noTranslateSelectors:[".vote-buttons",".Post__flatListItemButton"]},{hosts:["news.ycombinator.com"],containerSelectors:[".athing",".commtext"],noTranslateSelectors:[".votearrow",".score"]},{hosts:["github.com"],containerSelectors:[".markdown-body",".comment-body",".blob-code"],noTranslateSelectors:[".blob-num",".js-clipboard"]},{hosts:["wikipedia.org"],containerSelectors:["#mw-content-text"],noTranslateSelectors:[".mw-editsection",".reference",".citation"]}];function j(t){let e;try{e=new URL(t).hostname}catch{return null}for(const n of kt)if(n.hosts.some(s=>e.includes(s)))return n;return null}const X="data-immersive-translated",Ct="data-immersive-original",Y="span";function At(t){const e=t.cloneNode(!0);return e.setAttribute(Ct,"1"),e.style.display="none",t.parentNode.insertBefore(e,t),{clone:e,blockEl:t}}function k(t,e){const n=[],s=Array.isArray(e)?e:[e];for(let o=0;o<t.textNodes.length;o++){const a=t.textNodes[o],c=s[o]||s[0]||"",i=document.createElement(Y);i.setAttribute(X,"1"),i.textContent=c,a.parentNode.replaceChild(i,a),n.push({originalNode:a,translatedSpan:i,blockEl:t.blockEl})}return t.status="translated",n}function J(t,e,n){const s=document.createElement(Y);if(s.setAttribute(X,"1"),s.setAttribute("data-immersive-failed","1"),s.style.cssText="color:#e53935;cursor:pointer;border-bottom:1px dashed #e53935;",s.textContent=`翻译失败：${e.message}（点击重试）`,s.addEventListener("click",()=>n(t)),t.textNodes.length>0){const o=t.textNodes[0];o.parentNode.replaceChild(s,o)}return t.status="failed",[{originalNode:t.textNodes[0],translatedSpan:s,blockEl:t.blockEl}]}function E(t,e,n){const s=new Set;for(const{blockEl:o}of n)s.add(o);for(const[o,a]of e)if(s.has(o))switch(t){case"dual":a.style.display="",a.style.opacity="0.6",o.style.display="";break;case"translated":a.style.display="none",o.style.display="";break;case"original":a.style.display="",a.style.opacity="",o.style.display="none";break}}function Lt(t,e){for(let n=t.length-1;n>=0;n--){const{originalNode:s,translatedSpan:o}=t[n];o.parentNode&&o.parentNode.replaceChild(s,o)}for(const n of e.values())n.parentNode&&n.parentNode.removeChild(n)}const N="__immersive_control_bar_host__",Q=500,Nt=3,Rt=500,Bt=50,It=`
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
  <button class="btn btn-danger retry-btn" style="display:none;">重试失败</button>
  <button class="btn clear-btn">清除</button>
</div>
`,r={active:!1,cancelled:!1,mode:"dual",direction:"",pieces:[],clones:new Map,translatedSpans:[],completedCount:0,failedCount:0,totalCount:0,pool:null,observer:null,cache:null,controlBar:null,retryGen:0};function m(){return r.direction||"auto"}async function Z(t){const e=m();let n;try{n=await chrome.runtime.sendMessage({type:"DO_TRANSLATE",text:t,direction:e})}catch(s){const o=(s==null?void 0:s.message)||String(s);throw o.includes("Extension context invalidated")?new Error("插件已更新，请刷新页面后重试"):new Error(`通信失败：${o}`)}if(!n)throw new Error("后台未响应翻译请求");if(n.error)throw new Error(n.error);return n.result}function Mt(){var n;(n=document.getElementById(N))==null||n.remove();const t=document.createElement("div");t.id=N,t.style.cssText="position:fixed; top:0; right:0; z-index:2147483647;";const e=t.attachShadow({mode:"open"});e.innerHTML=It,document.body.appendChild(t),e.querySelector(".clear-btn").addEventListener("click",et),e.querySelector(".retry-btn").addEventListener("click",Ut),e.querySelectorAll(".mode-btn").forEach(s=>{s.addEventListener("click",()=>{const o=s.dataset.mode;Dt(o)})}),r.controlBar={host:t,shadow:e},u()}function u(){if(!r.controlBar)return;const t=r.controlBar.shadow,{active:e,completedCount:n,failedCount:s,totalCount:o}=r,a=t.querySelector(".status"),c=t.querySelector(".count"),i=t.querySelector(".hint"),l=t.querySelector(".retry-btn");e?a.textContent="沉浸式中…":a.textContent="完成",c.textContent=`${n+s}/${o}`,!e&&s>0?(i.textContent=`${s}段失败`,l.style.display=""):(i.textContent="",l.style.display="none"),t.querySelectorAll(".mode-btn").forEach(d=>{d.classList.toggle("active",d.dataset.mode===r.mode)})}function Ot(){if(!r.controlBar)return;const t=r.controlBar.shadow.querySelector(".bar");t.classList.remove("flash"),t.offsetWidth,t.classList.add("flash")}function Pt(){var t;(t=document.getElementById(N))==null||t.remove(),r.controlBar=null}function Dt(t){r.mode=t,E(t,r.clones,r.translatedSpans),u()}function tt(t){const e=new Set;for(const n of t){if(!n.blockEl||e.has(n.blockEl))continue;e.add(n.blockEl);const{clone:s}=At(n.blockEl);r.clones.set(n.blockEl,s)}}async function z(t){const e=lt({items:t,concurrency:Nt,shouldCancel:()=>r.cancelled,worker:async s=>{if(r.cancelled)return;const o=await Z(s.text);if(r.cancelled)return;const a=k(s,o);r.translatedSpans.push(...a),r.completedCount++,E(r.mode,r.clones,a),r.cache&&await r.cache.write([{text:s.text,direction:m(),translation:o}]),u()}});r.pool=e;const n=await e.promise;if(r.pool=null,n.failed.length>0){for(const{item:s,error:o}of n.failed){const a=J(s,o,nt);r.translatedSpans.push(...a),r.failedCount++}u()}r.active=!1,u()}function Ht(){if(r.observer)return;let t=null;const e=new MutationObserver(()=>{t||(t=setTimeout(()=>{t=null,zt()},Rt))});e.observe(document.body,{childList:!0,subtree:!0}),r.observer=e}function zt(){if(r.cancelled)return;const t=j(location.href),s=K(document.body,{direction:m(),limit:Q,rule:t}).filter(o=>o.status==="pending").slice(0,Bt).filter(o=>!r.clones.has(o.blockEl));s.length!==0&&(tt(s),qt(s))}async function qt(t){const e=t.map(a=>a.text),{hit:n,miss:s}=await r.cache.query(e,m());for(const a of t)if(n.has(a.text)){const c=k(a,n.get(a.text));r.translatedSpans.push(...c),r.completedCount++,E(r.mode,r.clones,c)}u();const o=t.filter(a=>s.includes(a.text));o.length>0&&await z(o)}function et(){r.cancelled=!0,r.pool&&r.pool.cancel(),r.observer&&(r.observer.disconnect(),r.observer=null),Lt(r.translatedSpans,r.clones),Pt(),r.active=!1,r.cancelled=!1,r.pieces=[],r.clones=new Map,r.translatedSpans=[],r.completedCount=0,r.failedCount=0,r.totalCount=0,r.mode="dual"}async function nt(t){const e=r.retryGen;if(!(r.cancelled||!r.controlBar)){for(let n=r.translatedSpans.length-1;n>=0;n--)if(r.translatedSpans[n].blockEl===t.blockEl){const{originalNode:s,translatedSpan:o}=r.translatedSpans[n];o.parentNode&&o.parentNode.replaceChild(s,o),r.translatedSpans.splice(n,1)}t.status="pending",r.failedCount=Math.max(0,r.failedCount-1);try{const n=await Z(t.text);if(r.cancelled||!r.controlBar||e!==r.retryGen)return;const s=k(t,n);r.translatedSpans.push(...s),r.completedCount++,E(r.mode,r.clones,s),r.cache&&await r.cache.write([{text:t.text,direction:m(),translation:n}])}catch(n){if(r.cancelled||!r.controlBar||e!==r.retryGen)return;const s=J(t,n,nt);r.translatedSpans.push(...s),r.failedCount++}u()}}async function Ut(){if(r.active)return;const t=r.pieces.filter(e=>e.status==="failed");t.length!==0&&(r.retryGen++,r.cancelled=!1,r.failedCount=0,r.active=!0,u(),await z(t))}async function $t(t){if(r.active){r.controlBar&&Ot();return}r.cancelled=!1,r.completedCount=0,r.failedCount=0,r.mode="dual",r.direction=t,r.clones=new Map,r.translatedSpans=[],r.cache=Tt(),await r.cache.init();const e=j(location.href),n=K(document.body,{direction:m(),limit:Q,rule:e});if(n.length===0){alert("未找到可翻译的段落");return}r.pieces=n,r.totalCount=n.length,r.active=!0,Mt(),tt(n);const s=n.map(i=>i.text),{hit:o,miss:a}=await r.cache.query(s,m());for(const i of n)if(o.has(i.text)){const l=k(i,o.get(i.text));r.translatedSpans.push(...l),r.completedCount++,E(r.mode,r.clones,l)}u();const c=n.filter(i=>a.includes(i.text));c.length>0&&await z(c),r.cancelled||Ht()}function Gt(){et()}const C="__ai_translate_panel_host__",R="__ai_translate_read_aloud_host__",v="__ai_translate_popper_host__",F=5e3,g={interactionMode:"selection",voiceChinese:"",voiceEnglish:""};async function ot(){var t;try{const e=await chrome.storage.local.get("settings"),n=(t=e==null?void 0:e.settings)==null?void 0:t.translate;n&&(g.interactionMode=n.interactionMode||"selection",g.voiceChinese=n.voiceChinese||"",g.voiceEnglish=n.voiceEnglish||"")}catch{}}let T=[],h="",f="";function B(){"speechSynthesis"in window&&(T=window.speechSynthesis.getVoices())}function Ft(t){const n=t.startsWith("zh")?g.voiceChinese:g.voiceEnglish;if(n){const a=T.find(c=>c.voiceURI===n);if(a)return a}let s=T.find(a=>a.lang===t);if(s)return s;const o=t.split("-")[0];return s=T.find(a=>a.lang.startsWith(o)),s||null}function st(t,e,n,s){if(!("speechSynthesis"in window)){f="当前浏览器不支持语音合成",s();return}B();const o=window.speechSynthesis;o.cancel();const a=new SpeechSynthesisUtterance(t),c=/[\u4e00-\u9fa5]/.test(t);a.lang=c?"zh-CN":"en-US";const i=Ft(a.lang);i&&(a.voice=i),a.rate=e,a.pitch=1,a.volume=1,a.onstart=()=>{h=n,f="",s()},a.onend=()=>{h="",s()},a.onerror=l=>{h="";const d=(l==null?void 0:l.error)||"未知错误";d==="not-allowed"||d==="service-not-allowed"?f="浏览器拒绝了语音播放，请检查系统音频/语音权限":d==="no-speech"||d==="synthesis-failed"?f=`朗读失败：系统可能未安装 ${a.lang} 语音包（错误：${d}）`:f=`朗读失败：${d}`,s()},setTimeout(()=>o.speak(a),50)}function S(){"speechSynthesis"in window&&window.speechSynthesis.cancel(),h=""}async function I(t,e){let n;try{n=await chrome.runtime.sendMessage({type:"DO_TRANSLATE",text:t,direction:e||"auto"})}catch(s){const o=(s==null?void 0:s.message)||String(s);throw o.includes("Extension context invalidated")?new Error("插件已更新，请刷新页面后重试"):new Error(`通信失败：${o}`)}if(!n)throw new Error("后台未响应翻译请求");if(n.error)throw new Error(n.error);return n.result}function Vt(){var t;(t=document.getElementById(C))==null||t.remove()}function M(t){Vt(),S(),f="";const e=document.createElement("div");e.id=C,e.style.cssText="position:fixed; z-index:2147483647; max-width:440px;",t==="corner"?(e.style.top="20px",e.style.right="20px"):Wt(e);const n=e.attachShadow({mode:"open"});return n.innerHTML=Yt,document.body.appendChild(e),n.querySelector(".close-btn").addEventListener("click",()=>{S(),e.remove()}),n}function Wt(t){let e=80,n=80;const s=window.getSelection();if(s&&s.rangeCount>0){const c=s.getRangeAt(0).getBoundingClientRect();(c.width>0||c.height>0)&&(e=c.bottom+10,n=c.left)}const o=420,a=320;n+o>window.innerWidth-20&&(n=window.innerWidth-o-20),n<10&&(n=10),e+a>window.innerHeight-20&&(e=Math.max(10,(window.innerHeight-a)/2)),t.style.top=e+"px",t.style.left=n+"px"}function O(t){t.querySelector(".body").innerHTML='<div class="loading">翻译中...</div>'}function P(t,e,n){const s=t.querySelector(".body"),o=n?'<div class="truncated-hint">页面内容较长，仅翻译前 5000 字</div>':"",a=e.notes?`<div class="result-notes">${H(e.notes)}</div>`:"";s.innerHTML=`
    ${o}
    <div class="result-text">${H(e.translation)}</div>
    ${a}
    <div class="speak-row">
      <button class="speak-btn" data-key="result-normal" data-rate="1">朗读</button>
      <button class="speak-btn" data-key="result-slow" data-rate="0.6">慢速</button>
    </div>
    <div class="speak-hint"></div>
  `;const c=e.translation;t.querySelectorAll(".speak-btn").forEach(i=>{i.addEventListener("click",()=>{const l=i.dataset.key,d=parseFloat(i.dataset.rate);h===l?(S(),V(t)):st(c,d,l,()=>V(t))})})}function D(t,e){t.querySelector(".body").innerHTML=`<div class="error">${H(e)}</div>`}function V(t){t.querySelectorAll(".speak-btn").forEach(n=>{const s=n.dataset.key;h===s?(n.classList.add("speaking"),n.textContent="停止"):(n.classList.remove("speaking"),n.textContent=n.dataset.key==="result-slow"?"慢速":"朗读")});const e=t.querySelector(".speak-hint");e&&(e.textContent=f)}function H(t){const e=document.createElement("div");return e.textContent=String(t),e.innerHTML}function rt(t){var s;(s=document.getElementById(R))==null||s.remove(),S();const e=document.createElement("div");e.id=R,e.style.cssText="position:fixed; top:20px; right:20px; z-index:2147483647;";const n=e.attachShadow({mode:"open"});n.innerHTML=`
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
  `,document.body.appendChild(e),n.querySelector(".stop-btn").addEventListener("click",()=>{S(),e.remove()}),st(t,1,"read-aloud",()=>{h||e.remove()})}function w(){var t;(t=document.getElementById(v))==null||t.remove()}function Kt(){const t=window.getSelection();if(!t||t.rangeCount===0)return!1;const e=t.anchorNode;if(!e)return!1;const n=e.nodeType===1?e:e.parentElement;return n?!!n.closest(`#${C}, #${R}, #${v}`):!1}function jt(t,e){w();const n=document.createElement("div");n.id=v,n.style.cssText="position:fixed; z-index:2147483647;";const s=n.attachShadow({mode:"open"});s.innerHTML=`
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
  `,document.body.appendChild(n),s.querySelector(".popper");const o=36,a=120;let c=t.top-o-6;c<8&&(c=t.bottom+6);let i=t.left;i+a>window.innerWidth-12&&(i=window.innerWidth-a-12),i<8&&(i=8),n.style.top=c+"px",n.style.left=i+"px",s.querySelector('[data-action="translate"]').addEventListener("click",()=>{w();const l=M("selection");O(l),I(e,"auto").then(d=>P(l,d,!1)).catch(d=>D(l,d.message))}),s.querySelector('[data-action="read"]').addEventListener("click",()=>{w(),rt(e)})}document.addEventListener("mouseup",t=>{if(g.interactionMode!=="selection")return;const e=document.getElementById(v);if(e&&e.contains(t.target))return;const n=document.getElementById(C);if(n&&n.contains(t.target))return;const s=window.getSelection(),o=s==null?void 0:s.toString().trim();if(!o){w();return}if(Kt()||s.rangeCount===0)return;const a=s.getRangeAt(0).getBoundingClientRect();a.width===0&&a.height===0||jt(a,o)});document.addEventListener("mousedown",t=>{const e=document.getElementById(v);e&&!e.contains(t.target)&&w()},!0);function Xt(){const t=(document.body.innerText||"").trim();return{text:t.slice(0,F),truncated:t.length>F}}chrome.runtime.onMessage.addListener(t=>{if(t.type==="translate-selection"){const e=(t.selectionText||"").trim();if(!e)return;const n=M("selection");O(n),I(e,"auto").then(s=>P(n,s,!1)).catch(s=>D(n,s.message));return}if(t.type==="translate-page"){const{text:e,truncated:n}=Xt();if(!e)return;const s=M("corner");O(s),I(e,"auto").then(o=>P(s,o,n)).catch(o=>D(s,o.message));return}if(t.type==="translate-page-inline"){const e=t.direction||"auto";Gt(),dt(e);return}if(t.type==="immersive-translate"){const e=t.direction||"auto";ut(),$t(e);return}if(t.type==="read-aloud"){const e=(t.selectionText||"").trim();if(!e)return;rt(e);return}});"speechSynthesis"in window&&(B(),window.speechSynthesis.onvoiceschanged=B);ot();chrome.storage.onChanged.addListener(t=>{var e,n;(n=(e=t.settings)==null?void 0:e.newValue)!=null&&n.translate&&ot()});const Yt=`
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
