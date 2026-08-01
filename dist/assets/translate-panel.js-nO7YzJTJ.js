import{c as le,s as de,a as ue}from"./inline-translate-DMaYHONP.js";function pe(e){return/[A-Za-z]/.test(e||"")}function fe(e){return/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(e||"")}const W=new Set(["DIV","P","H1","H2","H3","H4","H5","H6","LI","BLOCKQUOTE","TD","TH","SECTION","ARTICLE","HEADER","FOOTER","MAIN","ASIDE","FIGURE","FIGCAPTION","PRE","TABLE","TR","TBODY","THEAD","TFOOT","UL","OL","DL","DD","DT","ADDRESS","FIELDSET","LEGEND","DETAILS","SUMMARY","FORM"]),he=new Set(["SCRIPT","STYLE","TEXTAREA","SVG","NOSCRIPT","IFRAME","BR","KBD","WBR","SELECT","DATALIST","OPTION","OPTGROUP","OBJECT","EMBED","CANVAS","AUDIO","VIDEO","TRACK","MAP","AREA"]),$=1e3,me=new Set(["#__ai_translate_panel_host__","#__ai_translate_read_aloud_host__","#__ai_translate_popper_host__","#__mt_control_bar_host__","#__immersive_control_bar_host__"]);function ge(e){let t=e.parentElement;for(;t;){if(W.has(t.tagName)||t===document.body)return t;t=t.parentElement}return document.body}function ye(e){var t,n,o,s,a;return!!(he.has(e.tagName)||(t=e.classList)!=null&&t.contains("notranslate")||((n=e.getAttribute)==null?void 0:n.call(e,"translate"))==="no"||e.isContentEditable||((o=e.getAttribute)==null?void 0:o.call(e,"contenteditable"))==="true"||e.id&&me.has(e.id)||((s=e.dataset)==null?void 0:s.immersiveOriginal)!==void 0||((a=e.dataset)==null?void 0:a.immersiveTranslated)!==void 0)}function be(e,t){return t==="en-zh"&&!pe(e)||t==="zh-en"&&!fe(e)}function xe(e,t){for(const n of t)try{e.querySelectorAll(n).forEach(o=>{o.classList.add("notranslate")})}catch{}}function we(e,t){var n;if((n=t==null?void 0:t.containerSelectors)!=null&&n.length){const o=[];for(const s of t.containerSelectors)try{e.querySelectorAll(s).forEach(a=>o.push(a))}catch{}return o.length>0?o:[e]}return[e]}function K(e,t={}){var d;const{direction:n="auto",limit:o=500,rule:s=null}=t;(d=s==null?void 0:s.noTranslateSelectors)!=null&&d.length&&xe(e,s.noTranslateSelectors);const a=we(e,s),c=[];let i=0;for(const b of a)Se(b,n,c,()=>(i++,`p${i}`));return c.slice(0,o)}function Se(e,t,n,o){let s=null;const a=i=>(s&&s.text.length>=$&&(p(s,n),s=null),s||(s={id:o(),blockEl:i||document.body,textNodes:[],text:"",status:"pending"}),s),c=(i,l)=>{if(i.nodeType===Node.TEXT_NODE){const A=i.textContent.trim();if(A.length===0||be(A,t))return;const ie=l||ge(i);let x=A;for(;x.length>0;){const g=a(ie),U=g.text?" ":"",N=$-g.text.length-U.length;if(N<=0){p(g,n),s=null;continue}const ce=x.slice(0,N);g.textNodes.push(i),g.text+=U+ce,x=x.slice(N),x.length>0&&(p(g,n),s=null)}return}if(i.nodeType!==Node.ELEMENT_NODE)return;const d=i;if(ye(d)){s&&(p(s,n),s=null);return}const b=W.has(d.tagName),ae=b?d:l;b&&s&&(p(s,n),s=null);for(const q of d.childNodes)c(q,ae);b&&s&&(p(s,n),s=null)};c(e,null),s&&p(s,n)}function p(e,t){e.textNodes.length>0&&e.text.trim().length>0&&t.push(e)}const Ee="immersive-translate-cache",ve=1,T="translations";function Te(){let e=null;function t(){return new Promise((s,a)=>{const c=indexedDB.open(Ee,ve);c.onupgradeneeded=i=>{const l=i.target.result;l.objectStoreNames.contains(T)||l.createObjectStore(T)},c.onsuccess=()=>s(c.result),c.onerror=()=>a(c.error)})}function n(s){if(!e)throw new Error("Cache not initialized");return e.transaction(T,s).objectStore(T)}function o(s){return new Promise((a,c)=>{s.onsuccess=()=>a(s.result),s.onerror=()=>c(s.error)})}return{async init(){e=await t()},async get(s){return o(n("readonly").get(s))},async set(s,a){await o(n("readwrite").put(a,s))},async delete(s){await o(n("readwrite").delete(s))},async clear(){await o(n("readwrite").clear())},async getMany(s){const a=new Map;for(const c of s){const i=await o(n("readonly").get(c));i!==void 0&&a.set(c,i)}return a},async setMany(s){for(const[a,c]of s)await o(n("readwrite").put(c,a))}}}function G(e,t){return`${t}::${e}`}function _e(e={}){const t=e.backend||Te();return{async init(){t.init&&await t.init()},async query(n,o){const s=n.map(l=>G(l,o)),a=await t.getMany(s),c=new Map,i=[];for(let l=0;l<n.length;l++){const d=a.get(s[l]);d!==void 0?c.set(n[l],d.translation):i.push(n[l])}return{hit:c,miss:i}},async write(n){if(n.length===0)return;const o=n.map(s=>[G(s.text,s.direction),{translation:s.translation,timestamp:Date.now()}]);await t.setMany(o)},async clear(){await t.clear()}}}const ke=[{hosts:["twitter.com","x.com"],containerSelectors:["article",'[data-testid="tweetText"]'],noTranslateSelectors:['[data-testid="User-Name"]',"time"]},{hosts:["reddit.com","old.reddit.com"],containerSelectors:[".Post",".Comment",'[data-testid="post-container"]'],noTranslateSelectors:[".vote-buttons",".Post__flatListItemButton"]},{hosts:["news.ycombinator.com"],containerSelectors:[".athing",".commtext"],noTranslateSelectors:[".votearrow",".score"]},{hosts:["github.com"],containerSelectors:[".markdown-body",".comment-body",".blob-code"],noTranslateSelectors:[".blob-num",".js-clipboard"]},{hosts:["wikipedia.org"],containerSelectors:["#mw-content-text"],noTranslateSelectors:[".mw-editsection",".reference",".citation"]}];function j(e){let t;try{t=new URL(e).hostname}catch{return null}for(const n of ke)if(n.hosts.some(o=>t.includes(o)))return n;return null}const X="data-immersive-translated",Ce="data-immersive-original",Y="span";function Ae(e){const t=e.cloneNode(!0);return t.setAttribute(Ce,"1"),t.style.display="none",e.parentNode.insertBefore(t,e),{clone:t,blockEl:e}}function k(e,t){const n=[],o=Array.isArray(t)?t:[t];for(let s=0;s<e.textNodes.length;s++){const a=e.textNodes[s],c=o[s]||o[0]||"",i=document.createElement(Y);i.setAttribute(X,"1"),i.textContent=c,a.parentNode.replaceChild(i,a),n.push({originalNode:a,translatedSpan:i,blockEl:e.blockEl})}return e.status="translated",n}function J(e,t,n){const o=document.createElement(Y);if(o.setAttribute(X,"1"),o.setAttribute("data-immersive-failed","1"),o.style.cssText="color:#e53935;cursor:pointer;border-bottom:1px dashed #e53935;",o.textContent=`翻译失败：${t.message}（点击重试）`,o.addEventListener("click",()=>n(e)),e.textNodes.length>0){const s=e.textNodes[0];s.parentNode.replaceChild(o,s)}return e.status="failed",[{originalNode:e.textNodes[0],translatedSpan:o,blockEl:e.blockEl}]}function E(e,t,n){const o=new Set;for(const{blockEl:s}of n)o.add(s);for(const[s,a]of t)if(o.has(s))switch(e){case"dual":a.style.display="",a.style.opacity="0.6",s.style.display="";break;case"translated":a.style.display="none",s.style.display="";break;case"original":a.style.display="",a.style.opacity="",s.style.display="none";break}}function Ne(e,t){for(let n=e.length-1;n>=0;n--){const{originalNode:o,translatedSpan:s}=e[n];s.parentNode&&s.parentNode.replaceChild(o,s)}for(const n of t.values())n.parentNode&&n.parentNode.removeChild(n)}const L="__immersive_control_bar_host__",Q=500,Le=3,Re=500,Be=50,Ie=`
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
`,r={active:!1,cancelled:!1,mode:"dual",direction:"",pieces:[],clones:new Map,translatedSpans:[],completedCount:0,failedCount:0,totalCount:0,pool:null,observer:null,debounceTimer:null,cache:null,controlBar:null,retryGen:0};function m(){return r.direction||"auto"}async function Z(e){const t=m();let n;try{n=await chrome.runtime.sendMessage({type:"DO_TRANSLATE",text:e,direction:t})}catch(o){const s=(o==null?void 0:o.message)||String(o);throw s.includes("Extension context invalidated")?new Error("插件已更新，请刷新页面后重试"):new Error(`通信失败：${s}`)}if(!n)throw new Error("后台未响应翻译请求");if(n.error)throw new Error(n.error);return n.result}function Me(){var n;(n=document.getElementById(L))==null||n.remove();const e=document.createElement("div");e.id=L,e.style.cssText="position:fixed; top:0; right:0; z-index:2147483647;";const t=e.attachShadow({mode:"open"});t.innerHTML=Ie,document.body.appendChild(e),t.querySelector(".clear-btn").addEventListener("click",te),t.querySelector(".retry-btn").addEventListener("click",Ue),t.querySelectorAll(".mode-btn").forEach(o=>{o.addEventListener("click",()=>{const s=o.dataset.mode;De(s)})}),r.controlBar={host:e,shadow:t},u()}function u(){if(!r.controlBar)return;const e=r.controlBar.shadow,{active:t,completedCount:n,failedCount:o,totalCount:s}=r,a=e.querySelector(".status"),c=e.querySelector(".count"),i=e.querySelector(".hint"),l=e.querySelector(".retry-btn");t?a.textContent="沉浸式中…":a.textContent="完成",c.textContent=`${n+o}/${s}`,!t&&o>0?(i.textContent=`${o}段失败`,l.style.display=""):(i.textContent="",l.style.display="none"),e.querySelectorAll(".mode-btn").forEach(d=>{d.classList.toggle("active",d.dataset.mode===r.mode)})}function Oe(){if(!r.controlBar)return;const e=r.controlBar.shadow.querySelector(".bar");e.classList.remove("flash"),e.offsetWidth,e.classList.add("flash")}function Pe(){var e;(e=document.getElementById(L))==null||e.remove(),r.controlBar=null}function De(e){r.mode=e,E(e,r.clones,r.translatedSpans),u()}function ee(e){const t=new Set;for(const n of e){if(!n.blockEl||t.has(n.blockEl))continue;t.add(n.blockEl);const{clone:o}=Ae(n.blockEl);r.clones.set(n.blockEl,o)}}async function z(e){const t=le({items:e,concurrency:Le,shouldCancel:()=>r.cancelled,worker:async o=>{if(r.cancelled)return;const s=await Z(o.text);if(r.cancelled)return;const a=k(o,s);r.translatedSpans.push(...a),r.completedCount++,E(r.mode,r.clones,a),r.cache&&await r.cache.write([{text:o.text,direction:m(),translation:s}]),u()}});r.pool=t;const n=await t.promise;if(r.pool=null,n.failed.length>0){for(const{item:o,error:s}of n.failed){const a=J(o,s,ne);r.translatedSpans.push(...a),r.failedCount++}u()}r.active=!1,u()}function He(){if(r.observer)return;const e=new MutationObserver(()=>{r.debounceTimer||(r.debounceTimer=setTimeout(()=>{r.debounceTimer=null,ze()},Re))});e.observe(document.body,{childList:!0,subtree:!0}),r.observer=e}function ze(){if(r.cancelled||!r.observer||!r.controlBar)return;const e=j(location.href),o=K(document.body,{direction:m(),limit:Q,rule:e}).filter(s=>s.status==="pending").slice(0,Be).filter(s=>!r.clones.has(s.blockEl));o.length!==0&&(ee(o),qe(o))}async function qe(e){const t=e.map(a=>a.text),{hit:n,miss:o}=await r.cache.query(t,m());for(const a of e)if(n.has(a.text)){const c=k(a,n.get(a.text));r.translatedSpans.push(...c),r.completedCount++,E(r.mode,r.clones,c)}u();const s=e.filter(a=>o.includes(a.text));s.length>0&&await z(s)}function te(){r.cancelled=!0,r.pool&&r.pool.cancel(),r.debounceTimer&&(clearTimeout(r.debounceTimer),r.debounceTimer=null),r.observer&&(r.observer.disconnect(),r.observer=null),Ne(r.translatedSpans,r.clones),Pe(),r.active=!1,r.cancelled=!1,r.pieces=[],r.clones=new Map,r.translatedSpans=[],r.completedCount=0,r.failedCount=0,r.totalCount=0,r.mode="dual"}async function ne(e){const t=r.retryGen;if(r.cancelled||!r.controlBar)return;const n=new Set(e.textNodes);for(let o=r.translatedSpans.length-1;o>=0;o--)if(n.has(r.translatedSpans[o].originalNode)){const{originalNode:s,translatedSpan:a}=r.translatedSpans[o];a.parentNode&&a.parentNode.replaceChild(s,a),r.translatedSpans.splice(o,1)}e.status="pending",r.failedCount=Math.max(0,r.failedCount-1);try{const o=await Z(e.text);if(r.cancelled||!r.controlBar||t!==r.retryGen)return;const s=k(e,o);r.translatedSpans.push(...s),r.completedCount++,E(r.mode,r.clones,s),r.cache&&await r.cache.write([{text:e.text,direction:m(),translation:o}])}catch(o){if(r.cancelled||!r.controlBar||t!==r.retryGen)return;const s=J(e,o,ne);r.translatedSpans.push(...s),r.failedCount++}u()}async function Ue(){if(r.active)return;const e=r.pieces.filter(t=>t.status==="failed");if(e.length!==0){for(const t of e){const n=new Set(t.textNodes);for(let o=r.translatedSpans.length-1;o>=0;o--)if(n.has(r.translatedSpans[o].originalNode)){const{originalNode:s,translatedSpan:a}=r.translatedSpans[o];a.parentNode&&a.parentNode.replaceChild(s,a),r.translatedSpans.splice(o,1)}t.status="pending"}r.retryGen++,r.cancelled=!1,r.failedCount=0,r.active=!0,u(),await z(e)}}async function $e(e){if(r.active){r.controlBar&&Oe();return}r.cancelled=!1,r.completedCount=0,r.failedCount=0,r.mode="dual",r.direction=e,r.clones=new Map,r.translatedSpans=[],r.cache=_e(),await r.cache.init();const t=j(location.href),n=K(document.body,{direction:m(),limit:Q,rule:t});if(n.length===0){alert("未找到可翻译的段落");return}r.pieces=n,r.totalCount=n.length,r.active=!0,Me(),ee(n);const o=n.map(i=>i.text),{hit:s,miss:a}=await r.cache.query(o,m());for(const i of n)if(s.has(i.text)){const l=k(i,s.get(i.text));r.translatedSpans.push(...l),r.completedCount++,E(r.mode,r.clones,l)}u();const c=n.filter(i=>a.includes(i.text));c.length>0&&await z(c),r.cancelled||He()}function Ge(){te()}const C="__ai_translate_panel_host__",R="__ai_translate_read_aloud_host__",v="__ai_translate_popper_host__",F=5e3,y={interactionMode:"selection",voiceChinese:"",voiceEnglish:""};async function oe(){var e;try{const t=await chrome.storage.local.get("settings"),n=(e=t==null?void 0:t.settings)==null?void 0:e.translate;n&&(y.interactionMode=n.interactionMode||"selection",y.voiceChinese=n.voiceChinese||"",y.voiceEnglish=n.voiceEnglish||"")}catch{}}let _=[],h="",f="";function B(){"speechSynthesis"in window&&(_=window.speechSynthesis.getVoices())}function Fe(e){const n=e.startsWith("zh")?y.voiceChinese:y.voiceEnglish;if(n){const a=_.find(c=>c.voiceURI===n);if(a)return a}let o=_.find(a=>a.lang===e);if(o)return o;const s=e.split("-")[0];return o=_.find(a=>a.lang.startsWith(s)),o||null}function se(e,t,n,o){if(!("speechSynthesis"in window)){f="当前浏览器不支持语音合成",o();return}B();const s=window.speechSynthesis;s.cancel();const a=new SpeechSynthesisUtterance(e),c=/[\u4e00-\u9fa5]/.test(e);a.lang=c?"zh-CN":"en-US";const i=Fe(a.lang);i&&(a.voice=i),a.rate=t,a.pitch=1,a.volume=1,a.onstart=()=>{h=n,f="",o()},a.onend=()=>{h="",o()},a.onerror=l=>{h="";const d=(l==null?void 0:l.error)||"未知错误";d==="not-allowed"||d==="service-not-allowed"?f="浏览器拒绝了语音播放，请检查系统音频/语音权限":d==="no-speech"||d==="synthesis-failed"?f=`朗读失败：系统可能未安装 ${a.lang} 语音包（错误：${d}）`:f=`朗读失败：${d}`,o()},setTimeout(()=>s.speak(a),50)}function S(){"speechSynthesis"in window&&window.speechSynthesis.cancel(),h=""}async function I(e,t){let n;try{n=await chrome.runtime.sendMessage({type:"DO_TRANSLATE",text:e,direction:t||"auto"})}catch(o){const s=(o==null?void 0:o.message)||String(o);throw s.includes("Extension context invalidated")?new Error("插件已更新，请刷新页面后重试"):new Error(`通信失败：${s}`)}if(!n)throw new Error("后台未响应翻译请求");if(n.error)throw new Error(n.error);return n.result}function Ve(){var e;(e=document.getElementById(C))==null||e.remove()}function M(e){Ve(),S(),f="";const t=document.createElement("div");t.id=C,t.style.cssText="position:fixed; z-index:2147483647; max-width:440px;",e==="corner"?(t.style.top="20px",t.style.right="20px"):We(t);const n=t.attachShadow({mode:"open"});return n.innerHTML=Ye,document.body.appendChild(t),n.querySelector(".close-btn").addEventListener("click",()=>{S(),t.remove()}),n}function We(e){let t=80,n=80;const o=window.getSelection();if(o&&o.rangeCount>0){const c=o.getRangeAt(0).getBoundingClientRect();(c.width>0||c.height>0)&&(t=c.bottom+10,n=c.left)}const s=420,a=320;n+s>window.innerWidth-20&&(n=window.innerWidth-s-20),n<10&&(n=10),t+a>window.innerHeight-20&&(t=Math.max(10,(window.innerHeight-a)/2)),e.style.top=t+"px",e.style.left=n+"px"}function O(e){e.querySelector(".body").innerHTML='<div class="loading">翻译中...</div>'}function P(e,t,n){const o=e.querySelector(".body"),s=n?'<div class="truncated-hint">页面内容较长，仅翻译前 5000 字</div>':"",a=t.notes?`<div class="result-notes">${H(t.notes)}</div>`:"";o.innerHTML=`
    ${s}
    <div class="result-text">${H(t.translation)}</div>
    ${a}
    <div class="speak-row">
      <button class="speak-btn" data-key="result-normal" data-rate="1">朗读</button>
      <button class="speak-btn" data-key="result-slow" data-rate="0.6">慢速</button>
    </div>
    <div class="speak-hint"></div>
  `;const c=t.translation;e.querySelectorAll(".speak-btn").forEach(i=>{i.addEventListener("click",()=>{const l=i.dataset.key,d=parseFloat(i.dataset.rate);h===l?(S(),V(e)):se(c,d,l,()=>V(e))})})}function D(e,t){e.querySelector(".body").innerHTML=`<div class="error">${H(t)}</div>`}function V(e){e.querySelectorAll(".speak-btn").forEach(n=>{const o=n.dataset.key;h===o?(n.classList.add("speaking"),n.textContent="停止"):(n.classList.remove("speaking"),n.textContent=n.dataset.key==="result-slow"?"慢速":"朗读")});const t=e.querySelector(".speak-hint");t&&(t.textContent=f)}function H(e){const t=document.createElement("div");return t.textContent=String(e),t.innerHTML}function re(e){var o;(o=document.getElementById(R))==null||o.remove(),S();const t=document.createElement("div");t.id=R,t.style.cssText="position:fixed; top:20px; right:20px; z-index:2147483647;";const n=t.attachShadow({mode:"open"});n.innerHTML=`
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
  `,document.body.appendChild(t),n.querySelector(".stop-btn").addEventListener("click",()=>{S(),t.remove()}),se(e,1,"read-aloud",()=>{h||t.remove()})}function w(){var e;(e=document.getElementById(v))==null||e.remove()}function Ke(){const e=window.getSelection();if(!e||e.rangeCount===0)return!1;const t=e.anchorNode;if(!t)return!1;const n=t.nodeType===1?t:t.parentElement;return n?!!n.closest(`#${C}, #${R}, #${v}`):!1}function je(e,t){w();const n=document.createElement("div");n.id=v,n.style.cssText="position:fixed; z-index:2147483647;";const o=n.attachShadow({mode:"open"});o.innerHTML=`
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
  `,document.body.appendChild(n),o.querySelector(".popper");const s=36,a=120;let c=e.top-s-6;c<8&&(c=e.bottom+6);let i=e.left;i+a>window.innerWidth-12&&(i=window.innerWidth-a-12),i<8&&(i=8),n.style.top=c+"px",n.style.left=i+"px",o.querySelector('[data-action="translate"]').addEventListener("click",()=>{w();const l=M("selection");O(l),I(t,"auto").then(d=>P(l,d,!1)).catch(d=>D(l,d.message))}),o.querySelector('[data-action="read"]').addEventListener("click",()=>{w(),re(t)})}document.addEventListener("mouseup",e=>{if(y.interactionMode!=="selection")return;const t=document.getElementById(v);if(t&&t.contains(e.target))return;const n=document.getElementById(C);if(n&&n.contains(e.target))return;const o=window.getSelection(),s=o==null?void 0:o.toString().trim();if(!s){w();return}if(Ke()||o.rangeCount===0)return;const a=o.getRangeAt(0).getBoundingClientRect();a.width===0&&a.height===0||je(a,s)});document.addEventListener("mousedown",e=>{const t=document.getElementById(v);t&&!t.contains(e.target)&&w()},!0);function Xe(){const e=(document.body.innerText||"").trim();return{text:e.slice(0,F),truncated:e.length>F}}chrome.runtime.onMessage.addListener(e=>{if(e.type==="translate-selection"){const t=(e.selectionText||"").trim();if(!t)return;const n=M("selection");O(n),I(t,"auto").then(o=>P(n,o,!1)).catch(o=>D(n,o.message));return}if(e.type==="translate-page"){const{text:t,truncated:n}=Xe();if(!t)return;const o=M("corner");O(o),I(t,"auto").then(s=>P(o,s,n)).catch(s=>D(o,s.message));return}if(e.type==="translate-page-inline"){const t=e.direction||"auto";Ge(),de(t);return}if(e.type==="immersive-translate"){const t=e.direction||"auto";ue(),$e(t);return}if(e.type==="read-aloud"){const t=(e.selectionText||"").trim();if(!t)return;re(t);return}});"speechSynthesis"in window&&(B(),window.speechSynthesis.onvoiceschanged=B);oe();chrome.storage.onChanged.addListener(e=>{var t,n;(n=(t=e.settings)==null?void 0:t.newValue)!=null&&n.translate&&oe()});const Ye=`
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
