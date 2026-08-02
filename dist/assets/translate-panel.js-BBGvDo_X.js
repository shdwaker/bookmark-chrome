import{l as le,h as de,a as ue,c as pe,s as fe,b as he}from"./inline-translate-C18GrOMB.js";const j=new Set(["DIV","P","H1","H2","H3","H4","H5","H6","LI","BLOCKQUOTE","TD","TH","SECTION","ARTICLE","HEADER","FOOTER","MAIN","ASIDE","FIGURE","FIGCAPTION","PRE","TABLE","TR","TBODY","THEAD","TFOOT","UL","OL","DL","DD","DT","ADDRESS","FIELDSET","LEGEND","DETAILS","SUMMARY","FORM"]),me=new Set(["SCRIPT","STYLE","TEXTAREA","SVG","NOSCRIPT","IFRAME","BR","KBD","WBR","SELECT","DATALIST","OPTION","OPTGROUP","OBJECT","EMBED","CANVAS","AUDIO","VIDEO","TRACK","MAP","AREA","MATH","MJX-CONTAINER"]),ge=new Set(["katex","MathJax","mathjax","math"]),G=1e3,ye=new Set(["#__ai_translate_panel_host__","#__ai_translate_read_aloud_host__","#__ai_translate_popper_host__","#__mt_control_bar_host__","#__immersive_control_bar_host__"]);function be(e){let t=e.parentElement;for(;t;){if(j.has(t.tagName)||t===document.body)return t;t=t.parentElement}return document.body}function xe(e){var t,n,o,s,a;if(me.has(e.tagName)||(t=e.classList)!=null&&t.contains("notranslate")||((n=e.getAttribute)==null?void 0:n.call(e,"translate"))==="no"||e.isContentEditable||((o=e.getAttribute)==null?void 0:o.call(e,"contenteditable"))==="true"||e.id&&ye.has(e.id)||((s=e.dataset)==null?void 0:s.immersiveOriginal)!==void 0||((a=e.dataset)==null?void 0:a.immersiveTranslated)!==void 0)return!0;if(e.classList){for(const i of ge)if(e.classList.contains(i))return!0}return!1}function we(e,t){return t==="en-zh"&&!de(e)||t==="zh-en"&&!ue(e)}function Se(e,t){for(const n of t)try{e.querySelectorAll(n).forEach(o=>{o.classList.add("notranslate")})}catch{}}function Ee(e,t){var n;if((n=t==null?void 0:t.containerSelectors)!=null&&n.length){const o=[];for(const s of t.containerSelectors)try{e.querySelectorAll(s).forEach(a=>o.push(a))}catch{}return o.length>0?o:[e]}return[e]}function K(e,t={}){var d;const{direction:n="auto",limit:o=500,rule:s=null}=t;(d=s==null?void 0:s.noTranslateSelectors)!=null&&d.length&&Se(e,s.noTranslateSelectors);const a=Ee(e,s),i=[];let c=0;for(const p of a)ve(p,n,i,()=>(c++,`p${c}`));return i.slice(0,o)}function ve(e,t,n,o){let s=null;const a=c=>(s&&s.text.length>=G&&(f(s,n),s=null),s||(s={id:o(),blockEl:c||document.body,textNodes:[],text:"",status:"pending"}),s),i=(c,l)=>{if(c.nodeType===Node.TEXT_NODE){const _=c.textContent.trim();if(_.length===0||we(_,t)||le(_))return;const ie=l||be(c);let x=_;for(;x.length>0;){const y=a(ie),$=y.text?" ":"",L=G-y.text.length-$.length;if(L<=0){f(y,n),s=null;continue}const ce=x.slice(0,L);y.textNodes.push(c),y.text+=$+ce,x=x.slice(L),x.length>0&&(f(y,n),s=null)}return}if(c.nodeType!==Node.ELEMENT_NODE)return;const d=c;if(xe(d)){s&&(f(s,n),s=null);return}const p=j.has(d.tagName),T=p?d:l;p&&s&&(f(s,n),s=null);for(const U of d.childNodes)i(U,T);p&&s&&(f(s,n),s=null)};i(e,null),s&&f(s,n)}function f(e,t){e.textNodes.length>0&&e.text.trim().length>0&&t.push(e)}const Te="immersive-translate-cache",_e=1,k="translations";function ke(){let e=null;function t(){return new Promise((s,a)=>{const i=indexedDB.open(Te,_e);i.onupgradeneeded=c=>{const l=c.target.result;l.objectStoreNames.contains(k)||l.createObjectStore(k)},i.onsuccess=()=>s(i.result),i.onerror=()=>a(i.error)})}function n(s){if(!e)throw new Error("Cache not initialized");return e.transaction(k,s).objectStore(k)}function o(s){return new Promise((a,i)=>{s.onsuccess=()=>a(s.result),s.onerror=()=>i(s.error)})}return{async init(){e=await t()},async get(s){return o(n("readonly").get(s))},async set(s,a){await o(n("readwrite").put(a,s))},async delete(s){await o(n("readwrite").delete(s))},async clear(){await o(n("readwrite").clear())},async getMany(s){const a=new Map;for(const i of s){const c=await o(n("readonly").get(i));c!==void 0&&a.set(i,c)}return a},async setMany(s){for(const[a,i]of s)await o(n("readwrite").put(i,a))}}}function F(e,t){return`${t}::${e}`}function Ce(e={}){const t=e.backend||ke();return{async init(){t.init&&await t.init()},async query(n,o){const s=n.map(l=>F(l,o)),a=await t.getMany(s),i=new Map,c=[];for(let l=0;l<n.length;l++){const d=a.get(s[l]);d!==void 0?i.set(n[l],d.translation):c.push(n[l])}return{hit:i,miss:c}},async write(n){if(n.length===0)return;const o=n.map(s=>[F(s.text,s.direction),{translation:s.translation,timestamp:Date.now()}]);await t.setMany(o)},async clear(){await t.clear()}}}const Ae=[{hosts:["twitter.com","x.com"],containerSelectors:["article",'[data-testid="tweetText"]'],noTranslateSelectors:['[data-testid="User-Name"]',"time"]},{hosts:["reddit.com","old.reddit.com"],containerSelectors:[".Post",".Comment",'[data-testid="post-container"]'],noTranslateSelectors:[".vote-buttons",".Post__flatListItemButton"]},{hosts:["news.ycombinator.com"],containerSelectors:[".athing",".commtext"],noTranslateSelectors:[".votearrow",".score"]},{hosts:["github.com"],containerSelectors:[".markdown-body",".comment-body",".blob-code"],noTranslateSelectors:[".blob-num",".js-clipboard"]},{hosts:["wikipedia.org"],containerSelectors:["#mw-content-text"],noTranslateSelectors:[".mw-editsection",".reference",".citation"]}];function X(e){let t;try{t=new URL(e).hostname}catch{return null}for(const n of Ae)if(n.hosts.some(o=>t.includes(o)))return n;return null}const J="data-immersive-translated",Ne="data-immersive-original",Y="span";function Le(e){const t=e.cloneNode(!0);return t.setAttribute(Ne,"1"),t.style.display="none",e.parentNode.insertBefore(t,e),{clone:t,blockEl:e}}function A(e,t){const n=[];if(e.textNodes.length===0)return n;const o=Array.isArray(t)?t[0]:t,s=o&&typeof o=="object"?o.translation||"":String(o||"");for(let a=0;a<e.textNodes.length;a++){const i=e.textNodes[a],c=document.createElement(Y);c.setAttribute(J,"1"),a===0?c.textContent=s:(c.textContent="",c.style.display="none"),i.parentNode.replaceChild(c,i),n.push({originalNode:i,translatedSpan:c,blockEl:e.blockEl})}return e.status="translated",n}function Q(e,t,n){const o=document.createElement(Y);if(o.setAttribute(J,"1"),o.setAttribute("data-immersive-failed","1"),o.style.cssText="color:#e53935;cursor:pointer;border-bottom:1px dashed #e53935;",o.textContent=`翻译失败：${t.message}（点击重试）`,o.addEventListener("click",()=>n(e)),e.textNodes.length>0){const s=e.textNodes[0];s.parentNode.replaceChild(o,s)}return e.status="failed",[{originalNode:e.textNodes[0],translatedSpan:o,blockEl:e.blockEl}]}function E(e,t,n){const o=new Set;for(const{blockEl:s}of n)o.add(s);for(const[s,a]of t)if(o.has(s))switch(e){case"dual":a.style.display="",a.style.opacity="0.6",s.style.display="";break;case"translated":a.style.display="none",s.style.display="";break;case"original":a.style.display="",a.style.opacity="",s.style.display="none";break}}function Re(e,t){for(let n=e.length-1;n>=0;n--){const{originalNode:o,translatedSpan:s}=e[n];s.parentNode&&s.parentNode.replaceChild(o,s)}for(const n of t.values())n.parentNode&&n.parentNode.removeChild(n)}const R="__immersive_control_bar_host__",Z=500,Be=3,Ie=500,Me=50,Oe=`
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
`,r={active:!1,cancelled:!1,paused:!1,mode:"dual",direction:"",pieces:[],clones:new Map,translatedSpans:[],completedCount:0,failedCount:0,totalCount:0,pool:null,observer:null,debounceTimer:null,cache:null,controlBar:null,retryGen:0};function g(){return r.direction||"auto"}async function ee(e){const t=g();let n;try{n=await chrome.runtime.sendMessage({type:"DO_TRANSLATE",text:e,direction:t})}catch(s){const a=(s==null?void 0:s.message)||String(s);throw a.includes("Extension context invalidated")?new Error("插件已更新，请刷新页面后重试"):new Error(`通信失败：${a}`)}if(!n)throw new Error("后台未响应翻译请求");if(n.error)throw new Error(n.error);const o=n.result;if(typeof o=="string")return o;if(o!=null&&o.translation)return o.translation;throw new Error("翻译结果格式异常")}function Pe(){var n;(n=document.getElementById(R))==null||n.remove();const e=document.createElement("div");e.id=R,e.style.cssText="position:fixed; top:0; right:0; z-index:2147483647;";const t=e.attachShadow({mode:"open"});t.innerHTML=Oe,document.body.appendChild(e),t.querySelector(".clear-btn").addEventListener("click",ne),t.querySelector(".retry-btn").addEventListener("click",We),t.querySelector(".pause-btn").addEventListener("click",ze),t.querySelectorAll(".mode-btn").forEach(o=>{o.addEventListener("click",()=>{const s=o.dataset.mode;qe(s)})}),r.controlBar={host:e,shadow:t},u()}function u(){if(!r.controlBar)return;const e=r.controlBar.shadow,{active:t,completedCount:n,failedCount:o,totalCount:s,paused:a}=r,i=e.querySelector(".status"),c=e.querySelector(".count"),l=e.querySelector(".hint"),d=e.querySelector(".retry-btn"),p=e.querySelector(".pause-btn");a?i.textContent="已暂停":t?i.textContent="沉浸式中…":i.textContent="完成",c.textContent=`${n+o}/${s}`,!t&&o>0?(l.textContent=`${o}段失败`,d.style.display=""):(l.textContent="",d.style.display="none"),p&&(p.textContent=a?"继续":"暂停",p.classList.toggle("active",a)),e.querySelectorAll(".mode-btn").forEach(T=>{T.classList.toggle("active",T.dataset.mode===r.mode)})}function De(){if(!r.controlBar)return;const e=r.controlBar.shadow.querySelector(".bar");e.classList.remove("flash"),e.offsetWidth,e.classList.add("flash")}function He(){var e;(e=document.getElementById(R))==null||e.remove(),r.controlBar=null}function qe(e){r.mode=e,E(e,r.clones,r.translatedSpans),u()}function ze(){r.paused=!r.paused,u()}async function Ue(){for(;r.paused&&!r.cancelled;)await new Promise(e=>setTimeout(e,200));return!r.cancelled}function te(e){const t=new Set;for(const n of e){if(!n.blockEl||t.has(n.blockEl))continue;t.add(n.blockEl);const{clone:o}=Le(n.blockEl);r.clones.set(n.blockEl,o)}}async function z(e){const t=pe({items:e,concurrency:Be,shouldCancel:()=>r.cancelled,worker:async o=>{if(r.cancelled||!await Ue())return;const s=await ee(o.text);if(r.cancelled)return;const a=A(o,s);r.translatedSpans.push(...a),r.completedCount++,E(r.mode,r.clones,a),r.cache&&await r.cache.write([{text:o.text,direction:g(),translation:s}]),u()}});r.pool=t;const n=await t.promise;if(r.pool=null,n.failed.length>0){for(const{item:o,error:s}of n.failed){const a=Q(o,s,oe);r.translatedSpans.push(...a),r.failedCount++}u()}r.active=!1,u()}function $e(){if(r.observer)return;const e=new MutationObserver(()=>{r.debounceTimer||(r.debounceTimer=setTimeout(()=>{r.debounceTimer=null,Ge()},Ie))});e.observe(document.body,{childList:!0,subtree:!0}),r.observer=e}function Ge(){if(r.cancelled||!r.observer||!r.controlBar)return;const e=X(location.href),o=K(document.body,{direction:g(),limit:Z,rule:e}).filter(s=>s.status==="pending").slice(0,Me).filter(s=>!r.clones.has(s.blockEl));o.length!==0&&(te(o),Fe(o))}async function Fe(e){const t=e.map(a=>a.text),{hit:n,miss:o}=await r.cache.query(t,g());for(const a of e)if(n.has(a.text)){const i=A(a,n.get(a.text));r.translatedSpans.push(...i),r.completedCount++,E(r.mode,r.clones,i)}u();const s=e.filter(a=>o.includes(a.text));s.length>0&&await z(s)}function ne(){r.cancelled=!0,r.pool&&r.pool.cancel(),r.debounceTimer&&(clearTimeout(r.debounceTimer),r.debounceTimer=null),r.observer&&(r.observer.disconnect(),r.observer=null),Re(r.translatedSpans,r.clones),He(),r.active=!1,r.cancelled=!1,r.paused=!1,r.pieces=[],r.clones=new Map,r.translatedSpans=[],r.completedCount=0,r.failedCount=0,r.totalCount=0,r.mode="dual"}async function oe(e){const t=r.retryGen;if(r.cancelled||!r.controlBar)return;const n=new Set(e.textNodes);for(let o=r.translatedSpans.length-1;o>=0;o--)if(n.has(r.translatedSpans[o].originalNode)){const{originalNode:s,translatedSpan:a}=r.translatedSpans[o];a.parentNode&&a.parentNode.replaceChild(s,a),r.translatedSpans.splice(o,1)}e.status="pending",r.failedCount=Math.max(0,r.failedCount-1);try{const o=await ee(e.text);if(r.cancelled||!r.controlBar||t!==r.retryGen)return;const s=A(e,o);r.translatedSpans.push(...s),r.completedCount++,E(r.mode,r.clones,s),r.cache&&await r.cache.write([{text:e.text,direction:g(),translation:o}])}catch(o){if(r.cancelled||!r.controlBar||t!==r.retryGen)return;const s=Q(e,o,oe);r.translatedSpans.push(...s),r.failedCount++}u()}async function We(){if(r.active)return;const e=r.pieces.filter(t=>t.status==="failed");if(e.length!==0){for(const t of e){const n=new Set(t.textNodes);for(let o=r.translatedSpans.length-1;o>=0;o--)if(n.has(r.translatedSpans[o].originalNode)){const{originalNode:s,translatedSpan:a}=r.translatedSpans[o];a.parentNode&&a.parentNode.replaceChild(s,a),r.translatedSpans.splice(o,1)}t.status="pending"}r.retryGen++,r.cancelled=!1,r.failedCount=0,r.active=!0,u(),await z(e)}}async function Ve(e){if(r.active){r.controlBar&&De();return}r.cancelled=!1,r.completedCount=0,r.failedCount=0,r.mode="dual",r.direction=e,r.clones=new Map,r.translatedSpans=[],r.cache=Ce(),await r.cache.init();const t=X(location.href),n=K(document.body,{direction:g(),limit:Z,rule:t});if(n.length===0){alert("未找到可翻译的段落");return}r.pieces=n,r.totalCount=n.length,r.active=!0,Pe(),te(n);const o=n.map(c=>c.text),{hit:s,miss:a}=await r.cache.query(o,g());for(const c of n)if(s.has(c.text)){const l=A(c,s.get(c.text));r.translatedSpans.push(...l),r.completedCount++,E(r.mode,r.clones,l)}u();const i=n.filter(c=>a.includes(c.text));i.length>0&&await z(i),r.cancelled||$e()}function je(){ne()}const N="__ai_translate_panel_host__",B="__ai_translate_read_aloud_host__",v="__ai_translate_popper_host__",W=5e3,b={interactionMode:"selection",voiceChinese:"",voiceEnglish:""};async function se(){var e;try{const t=await chrome.storage.local.get("settings"),n=(e=t==null?void 0:t.settings)==null?void 0:e.translate;n&&(b.interactionMode=n.interactionMode||"selection",b.voiceChinese=n.voiceChinese||"",b.voiceEnglish=n.voiceEnglish||"")}catch{}}let C=[],m="",h="";function I(){"speechSynthesis"in window&&(C=window.speechSynthesis.getVoices())}function Ke(e){const n=e.startsWith("zh")?b.voiceChinese:b.voiceEnglish;if(n){const a=C.find(i=>i.voiceURI===n);if(a)return a}let o=C.find(a=>a.lang===e);if(o)return o;const s=e.split("-")[0];return o=C.find(a=>a.lang.startsWith(s)),o||null}function re(e,t,n,o){if(!("speechSynthesis"in window)){h="当前浏览器不支持语音合成",o();return}I();const s=window.speechSynthesis;s.cancel();const a=new SpeechSynthesisUtterance(e),i=/[\u4e00-\u9fa5]/.test(e);a.lang=i?"zh-CN":"en-US";const c=Ke(a.lang);c&&(a.voice=c),a.rate=t,a.pitch=1,a.volume=1,a.onstart=()=>{m=n,h="",o()},a.onend=()=>{m="",o()},a.onerror=l=>{m="";const d=(l==null?void 0:l.error)||"未知错误";d==="not-allowed"||d==="service-not-allowed"?h="浏览器拒绝了语音播放，请检查系统音频/语音权限":d==="no-speech"||d==="synthesis-failed"?h=`朗读失败：系统可能未安装 ${a.lang} 语音包（错误：${d}）`:h=`朗读失败：${d}`,o()},setTimeout(()=>s.speak(a),50)}function S(){"speechSynthesis"in window&&window.speechSynthesis.cancel(),m=""}async function M(e,t){let n;try{n=await chrome.runtime.sendMessage({type:"DO_TRANSLATE",text:e,direction:t||"auto"})}catch(o){const s=(o==null?void 0:o.message)||String(o);throw s.includes("Extension context invalidated")?new Error("插件已更新，请刷新页面后重试"):new Error(`通信失败：${s}`)}if(!n)throw new Error("后台未响应翻译请求");if(n.error)throw new Error(n.error);return n.result}function Xe(){var e;(e=document.getElementById(N))==null||e.remove()}function O(e){Xe(),S(),h="";const t=document.createElement("div");t.id=N,t.style.cssText="position:fixed; z-index:2147483647; max-width:440px;",e==="corner"?(t.style.top="20px",t.style.right="20px"):Je(t);const n=t.attachShadow({mode:"open"});return n.innerHTML=et,document.body.appendChild(t),n.querySelector(".close-btn").addEventListener("click",()=>{S(),t.remove()}),n}function Je(e){let t=80,n=80;const o=window.getSelection();if(o&&o.rangeCount>0){const i=o.getRangeAt(0).getBoundingClientRect();(i.width>0||i.height>0)&&(t=i.bottom+10,n=i.left)}const s=420,a=320;n+s>window.innerWidth-20&&(n=window.innerWidth-s-20),n<10&&(n=10),t+a>window.innerHeight-20&&(t=Math.max(10,(window.innerHeight-a)/2)),e.style.top=t+"px",e.style.left=n+"px"}function P(e){e.querySelector(".body").innerHTML='<div class="loading">翻译中...</div>'}function D(e,t,n){const o=e.querySelector(".body"),s=n?'<div class="truncated-hint">页面内容较长，仅翻译前 5000 字</div>':"",a=t.notes?`<div class="result-notes">${q(t.notes)}</div>`:"";o.innerHTML=`
    ${s}
    <div class="result-text">${q(t.translation)}</div>
    ${a}
    <div class="speak-row">
      <button class="speak-btn" data-key="result-normal" data-rate="1">朗读</button>
      <button class="speak-btn" data-key="result-slow" data-rate="0.6">慢速</button>
    </div>
    <div class="speak-hint"></div>
  `;const i=t.translation;e.querySelectorAll(".speak-btn").forEach(c=>{c.addEventListener("click",()=>{const l=c.dataset.key,d=parseFloat(c.dataset.rate);m===l?(S(),V(e)):re(i,d,l,()=>V(e))})})}function H(e,t){e.querySelector(".body").innerHTML=`<div class="error">${q(t)}</div>`}function V(e){e.querySelectorAll(".speak-btn").forEach(n=>{const o=n.dataset.key;m===o?(n.classList.add("speaking"),n.textContent="停止"):(n.classList.remove("speaking"),n.textContent=n.dataset.key==="result-slow"?"慢速":"朗读")});const t=e.querySelector(".speak-hint");t&&(t.textContent=h)}function q(e){const t=document.createElement("div");return t.textContent=String(e),t.innerHTML}function ae(e){var o;(o=document.getElementById(B))==null||o.remove(),S();const t=document.createElement("div");t.id=B,t.style.cssText="position:fixed; top:20px; right:20px; z-index:2147483647;";const n=t.attachShadow({mode:"open"});n.innerHTML=`
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
  `,document.body.appendChild(t),n.querySelector(".stop-btn").addEventListener("click",()=>{S(),t.remove()}),re(e,1,"read-aloud",()=>{m||t.remove()})}function w(){var e;(e=document.getElementById(v))==null||e.remove()}function Ye(){const e=window.getSelection();if(!e||e.rangeCount===0)return!1;const t=e.anchorNode;if(!t)return!1;const n=t.nodeType===1?t:t.parentElement;return n?!!n.closest(`#${N}, #${B}, #${v}`):!1}function Qe(e,t){w();const n=document.createElement("div");n.id=v,n.style.cssText="position:fixed; z-index:2147483647;";const o=n.attachShadow({mode:"open"});o.innerHTML=`
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
  `,document.body.appendChild(n),o.querySelector(".popper");const s=36,a=120;let i=e.top-s-6;i<8&&(i=e.bottom+6);let c=e.left;c+a>window.innerWidth-12&&(c=window.innerWidth-a-12),c<8&&(c=8),n.style.top=i+"px",n.style.left=c+"px",o.querySelector('[data-action="translate"]').addEventListener("click",()=>{w();const l=O("selection");P(l),M(t,"auto").then(d=>D(l,d,!1)).catch(d=>H(l,d.message))}),o.querySelector('[data-action="read"]').addEventListener("click",()=>{w(),ae(t)})}document.addEventListener("mouseup",e=>{if(b.interactionMode!=="selection")return;const t=document.getElementById(v);if(t&&t.contains(e.target))return;const n=document.getElementById(N);if(n&&n.contains(e.target))return;const o=window.getSelection(),s=o==null?void 0:o.toString().trim();if(!s){w();return}if(Ye()||o.rangeCount===0)return;const a=o.getRangeAt(0).getBoundingClientRect();a.width===0&&a.height===0||Qe(a,s)});document.addEventListener("mousedown",e=>{const t=document.getElementById(v);t&&!t.contains(e.target)&&w()},!0);function Ze(){const e=(document.body.innerText||"").trim();return{text:e.slice(0,W),truncated:e.length>W}}chrome.runtime.onMessage.addListener(e=>{if(e.type==="translate-selection"){const t=(e.selectionText||"").trim();if(!t)return;const n=O("selection");P(n),M(t,"auto").then(o=>D(n,o,!1)).catch(o=>H(n,o.message));return}if(e.type==="translate-page"){const{text:t,truncated:n}=Ze();if(!t)return;const o=O("corner");P(o),M(t,"auto").then(s=>D(o,s,n)).catch(s=>H(o,s.message));return}if(e.type==="translate-page-inline"){const t=e.direction||"auto";je(),fe(t);return}if(e.type==="immersive-translate"){const t=e.direction||"auto";he(),Ve(t);return}if(e.type==="read-aloud"){const t=(e.selectionText||"").trim();if(!t)return;ae(t);return}});"speechSynthesis"in window&&(I(),window.speechSynthesis.onvoiceschanged=I);se();chrome.storage.onChanged.addListener(e=>{var t,n;(n=(t=e.settings)==null?void 0:t.newValue)!=null&&n.translate&&se()});const et=`
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
