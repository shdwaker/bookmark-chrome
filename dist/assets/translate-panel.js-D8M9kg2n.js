import{l as ht,h as mt,a as bt,c as gt,s as yt,b as xt}from"./inline-translate-C18GrOMB.js";import{s as wt,a as St}from"./syllable-splitter-DmFjut49.js";const J=new Set(["DIV","P","H1","H2","H3","H4","H5","H6","LI","BLOCKQUOTE","TD","TH","SECTION","ARTICLE","HEADER","FOOTER","MAIN","ASIDE","FIGURE","FIGCAPTION","PRE","TABLE","TR","TBODY","THEAD","TFOOT","UL","OL","DL","DD","DT","ADDRESS","FIELDSET","LEGEND","DETAILS","SUMMARY","FORM"]),vt=new Set(["SCRIPT","STYLE","TEXTAREA","SVG","NOSCRIPT","IFRAME","BR","KBD","WBR","SELECT","DATALIST","OPTION","OPTGROUP","OBJECT","EMBED","CANVAS","AUDIO","VIDEO","TRACK","MAP","AREA","MATH","MJX-CONTAINER"]),Et=new Set(["katex","MathJax","mathjax","math"]),G=1e3,Tt=new Set(["#__ai_translate_panel_host__","#__ai_translate_read_aloud_host__","#__ai_translate_popper_host__","#__mt_control_bar_host__","#__immersive_control_bar_host__"]);function kt(t){let e=t.parentElement;for(;e;){if(J.has(e.tagName)||e===document.body)return e;e=e.parentElement}return document.body}function Ct(t){var e,n,o,s,r;if(vt.has(t.tagName)||(e=t.classList)!=null&&e.contains("notranslate")||((n=t.getAttribute)==null?void 0:n.call(t,"translate"))==="no"||t.isContentEditable||((o=t.getAttribute)==null?void 0:o.call(t,"contenteditable"))==="true"||t.id&&Tt.has(t.id)||((s=t.dataset)==null?void 0:s.immersiveOriginal)!==void 0||((r=t.dataset)==null?void 0:r.immersiveTranslated)!==void 0)return!0;if(t.classList){for(const i of Et)if(t.classList.contains(i))return!0}return!1}function _t(t,e){return e==="en-zh"&&!mt(t)||e==="zh-en"&&!bt(t)}function At(t,e){for(const n of e)try{t.querySelectorAll(n).forEach(o=>{o.classList.add("notranslate")})}catch{}}function Nt(t,e){var n;if((n=e==null?void 0:e.containerSelectors)!=null&&n.length){const o=[];for(const s of e.containerSelectors)try{t.querySelectorAll(s).forEach(r=>o.push(r))}catch{}return o.length>0?o:[t]}return[t]}function Z(t,e={}){var d;const{direction:n="auto",limit:o=500,rule:s=null}=e;(d=s==null?void 0:s.noTranslateSelectors)!=null&&d.length&&At(t,s.noTranslateSelectors);const r=Nt(t,s),i=[];let l=0;for(const u of r)Lt(u,n,i,()=>(l++,`p${l}`));return i.slice(0,o)}function Lt(t,e,n,o){let s=null;const r=l=>(s&&s.text.length>=G&&(m(s,n),s=null),s||(s={id:o(),blockEl:l||document.body,textNodes:[],text:"",status:"pending"}),s),i=(l,c)=>{if(l.nodeType===Node.TEXT_NODE){const h=l.textContent.trim();if(h.length===0||_t(h,e)||ht(h))return;const pt=c||kt(l);let v=h;for(;v.length>0;){const x=r(pt),$=x.text?" ":"",B=G-x.text.length-$.length;if(B<=0){m(x,n),s=null;continue}const ft=v.slice(0,B);x.textNodes.push(l),x.text+=$+ft,v=v.slice(B),v.length>0&&(m(x,n),s=null)}return}if(l.nodeType!==Node.ELEMENT_NODE)return;const d=l;if(Ct(d)){s&&(m(s,n),s=null);return}const u=J.has(d.tagName),p=u?d:c;u&&s&&(m(s,n),s=null);for(const S of d.childNodes)i(S,p);u&&s&&(m(s,n),s=null)};i(t,null),s&&m(s,n)}function m(t,e){t.textNodes.length>0&&t.text.trim().length>0&&e.push(t)}const Bt="immersive-translate-cache",Rt=1,_="translations";function It(){let t=null;function e(){return new Promise((s,r)=>{const i=indexedDB.open(Bt,Rt);i.onupgradeneeded=l=>{const c=l.target.result;c.objectStoreNames.contains(_)||c.createObjectStore(_)},i.onsuccess=()=>s(i.result),i.onerror=()=>r(i.error)})}function n(s){if(!t)throw new Error("Cache not initialized");return t.transaction(_,s).objectStore(_)}function o(s){return new Promise((r,i)=>{s.onsuccess=()=>r(s.result),s.onerror=()=>i(s.error)})}return{async init(){t=await e()},async get(s){return o(n("readonly").get(s))},async set(s,r){await o(n("readwrite").put(r,s))},async delete(s){await o(n("readwrite").delete(s))},async clear(){await o(n("readwrite").clear())},async getMany(s){const r=new Map;for(const i of s){const l=await o(n("readonly").get(i));l!==void 0&&r.set(i,l)}return r},async setMany(s){for(const[r,i]of s)await o(n("readwrite").put(i,r))}}}function F(t,e){return`${e}::${t}`}function Mt(t={}){const e=t.backend||It();return{async init(){e.init&&await e.init()},async query(n,o){const s=n.map(c=>F(c,o)),r=await e.getMany(s),i=new Map,l=[];for(let c=0;c<n.length;c++){const d=r.get(s[c]);d!==void 0?i.set(n[c],d.translation):l.push(n[c])}return{hit:i,miss:l}},async write(n){if(n.length===0)return;const o=n.map(s=>[F(s.text,s.direction),{translation:s.translation,timestamp:Date.now()}]);await e.setMany(o)},async clear(){await e.clear()}}}const Ot=[{hosts:["twitter.com","x.com"],containerSelectors:["article",'[data-testid="tweetText"]'],noTranslateSelectors:['[data-testid="User-Name"]',"time"]},{hosts:["reddit.com","old.reddit.com"],containerSelectors:[".Post",".Comment",'[data-testid="post-container"]'],noTranslateSelectors:[".vote-buttons",".Post__flatListItemButton"]},{hosts:["news.ycombinator.com"],containerSelectors:[".athing",".commtext"],noTranslateSelectors:[".votearrow",".score"]},{hosts:["github.com"],containerSelectors:[".markdown-body",".comment-body",".blob-code"],noTranslateSelectors:[".blob-num",".js-clipboard"]},{hosts:["wikipedia.org"],containerSelectors:["#mw-content-text"],noTranslateSelectors:[".mw-editsection",".reference",".citation"]}];function Q(t){let e;try{e=new URL(t).hostname}catch{return null}for(const n of Ot)if(n.hosts.some(o=>e.includes(o)))return n;return null}const tt="data-immersive-translated",Pt="data-immersive-original",et="span";function Ht(t){const e=t.cloneNode(!0);return e.setAttribute(Pt,"1"),e.style.display="none",t.parentNode.insertBefore(e,t),{clone:e,blockEl:t}}function N(t,e){const n=[];if(t.textNodes.length===0)return n;const o=Array.isArray(e)?e[0]:e,s=o&&typeof o=="object"?o.translation||"":String(o||"");for(let r=0;r<t.textNodes.length;r++){const i=t.textNodes[r],l=document.createElement(et);l.setAttribute(tt,"1"),r===0?l.textContent=s:(l.textContent="",l.style.display="none"),i.parentNode.replaceChild(l,i),n.push({originalNode:i,translatedSpan:l,blockEl:t.blockEl})}return t.status="translated",n}function nt(t,e,n){const o=document.createElement(et);if(o.setAttribute(tt,"1"),o.setAttribute("data-immersive-failed","1"),o.style.cssText="color:#e53935;cursor:pointer;border-bottom:1px dashed #e53935;",o.textContent=`翻译失败：${e.message}（点击重试）`,o.addEventListener("click",()=>n(t)),t.textNodes.length>0){const s=t.textNodes[0];s.parentNode.replaceChild(o,s)}return t.status="failed",[{originalNode:t.textNodes[0],translatedSpan:o,blockEl:t.blockEl}]}function k(t,e,n){const o=new Set;for(const{blockEl:s}of n)o.add(s);for(const[s,r]of e)if(o.has(s))switch(t){case"dual":r.style.display="",r.style.opacity="0.6",s.style.display="";break;case"translated":r.style.display="none",s.style.display="";break;case"original":r.style.display="",r.style.opacity="",s.style.display="none";break}}function Dt(t,e){for(let n=t.length-1;n>=0;n--){const{originalNode:o,translatedSpan:s}=t[n];s.parentNode&&s.parentNode.replaceChild(o,s)}for(const n of e.values())n.parentNode&&n.parentNode.removeChild(n)}const R="__immersive_control_bar_host__",ot=500,qt=3,zt=500,Ut=50,$t=`
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
`,a={active:!1,cancelled:!1,paused:!1,mode:"dual",direction:"",pieces:[],clones:new Map,translatedSpans:[],completedCount:0,failedCount:0,totalCount:0,pool:null,observer:null,debounceTimer:null,cache:null,controlBar:null,retryGen:0};function y(){return a.direction||"auto"}async function st(t){const e=y();let n;try{n=await chrome.runtime.sendMessage({type:"DO_TRANSLATE",text:t,direction:e})}catch(s){const r=(s==null?void 0:s.message)||String(s);throw r.includes("Extension context invalidated")?new Error("插件已更新，请刷新页面后重试"):new Error(`通信失败：${r}`)}if(!n)throw new Error("后台未响应翻译请求");if(n.error)throw new Error(n.error);const o=n.result;if(typeof o=="string")return o;if(o!=null&&o.translation)return o.translation;throw new Error("翻译结果格式异常")}function Gt(){var n;(n=document.getElementById(R))==null||n.remove();const t=document.createElement("div");t.id=R,t.style.cssText="position:fixed; top:0; right:0; z-index:2147483647;";const e=t.attachShadow({mode:"open"});e.innerHTML=$t,document.body.appendChild(t),e.querySelector(".clear-btn").addEventListener("click",at),e.querySelector(".retry-btn").addEventListener("click",Zt),e.querySelector(".pause-btn").addEventListener("click",Vt),e.querySelectorAll(".mode-btn").forEach(o=>{o.addEventListener("click",()=>{const s=o.dataset.mode;jt(s)})}),a.controlBar={host:t,shadow:e},f()}function f(){if(!a.controlBar)return;const t=a.controlBar.shadow,{active:e,completedCount:n,failedCount:o,totalCount:s,paused:r}=a,i=t.querySelector(".status"),l=t.querySelector(".count"),c=t.querySelector(".hint"),d=t.querySelector(".retry-btn"),u=t.querySelector(".pause-btn");r?i.textContent="已暂停":e?i.textContent="沉浸式中…":i.textContent="完成",l.textContent=`${n+o}/${s}`,!e&&o>0?(c.textContent=`${o}段失败`,d.style.display=""):(c.textContent="",d.style.display="none"),u&&(u.textContent=r?"继续":"暂停",u.classList.toggle("active",r)),t.querySelectorAll(".mode-btn").forEach(p=>{p.classList.toggle("active",p.dataset.mode===a.mode)})}function Ft(){if(!a.controlBar)return;const t=a.controlBar.shadow.querySelector(".bar");t.classList.remove("flash"),t.offsetWidth,t.classList.add("flash")}function Wt(){var t;(t=document.getElementById(R))==null||t.remove(),a.controlBar=null}function jt(t){a.mode=t,k(t,a.clones,a.translatedSpans),f()}function Vt(){a.paused=!a.paused,f()}async function Kt(){for(;a.paused&&!a.cancelled;)await new Promise(t=>setTimeout(t,200));return!a.cancelled}function rt(t){const e=new Set;for(const n of t){if(!n.blockEl||e.has(n.blockEl))continue;e.add(n.blockEl);const{clone:o}=Ht(n.blockEl);a.clones.set(n.blockEl,o)}}async function z(t){const e=gt({items:t,concurrency:qt,shouldCancel:()=>a.cancelled,worker:async o=>{if(a.cancelled||!await Kt())return;const s=await st(o.text);if(a.cancelled)return;const r=N(o,s);a.translatedSpans.push(...r),a.completedCount++,k(a.mode,a.clones,r),a.cache&&await a.cache.write([{text:o.text,direction:y(),translation:s}]),f()}});a.pool=e;const n=await e.promise;if(a.pool=null,n.failed.length>0){for(const{item:o,error:s}of n.failed){const r=nt(o,s,it);a.translatedSpans.push(...r),a.failedCount++}f()}a.active=!1,f()}function Xt(){if(a.observer)return;const t=new MutationObserver(()=>{a.debounceTimer||(a.debounceTimer=setTimeout(()=>{a.debounceTimer=null,Yt()},zt))});t.observe(document.body,{childList:!0,subtree:!0}),a.observer=t}function Yt(){if(a.cancelled||!a.observer||!a.controlBar)return;const t=Q(location.href),o=Z(document.body,{direction:y(),limit:ot,rule:t}).filter(s=>s.status==="pending").slice(0,Ut).filter(s=>!a.clones.has(s.blockEl));o.length!==0&&(rt(o),Jt(o))}async function Jt(t){const e=t.map(r=>r.text),{hit:n,miss:o}=await a.cache.query(e,y());for(const r of t)if(n.has(r.text)){const i=N(r,n.get(r.text));a.translatedSpans.push(...i),a.completedCount++,k(a.mode,a.clones,i)}f();const s=t.filter(r=>o.includes(r.text));s.length>0&&await z(s)}function at(){a.cancelled=!0,a.pool&&a.pool.cancel(),a.debounceTimer&&(clearTimeout(a.debounceTimer),a.debounceTimer=null),a.observer&&(a.observer.disconnect(),a.observer=null),Dt(a.translatedSpans,a.clones),Wt(),a.active=!1,a.cancelled=!1,a.paused=!1,a.pieces=[],a.clones=new Map,a.translatedSpans=[],a.completedCount=0,a.failedCount=0,a.totalCount=0,a.mode="dual"}async function it(t){const e=a.retryGen;if(a.cancelled||!a.controlBar)return;const n=new Set(t.textNodes);for(let o=a.translatedSpans.length-1;o>=0;o--)if(n.has(a.translatedSpans[o].originalNode)){const{originalNode:s,translatedSpan:r}=a.translatedSpans[o];r.parentNode&&r.parentNode.replaceChild(s,r),a.translatedSpans.splice(o,1)}t.status="pending",a.failedCount=Math.max(0,a.failedCount-1);try{const o=await st(t.text);if(a.cancelled||!a.controlBar||e!==a.retryGen)return;const s=N(t,o);a.translatedSpans.push(...s),a.completedCount++,k(a.mode,a.clones,s),a.cache&&await a.cache.write([{text:t.text,direction:y(),translation:o}])}catch(o){if(a.cancelled||!a.controlBar||e!==a.retryGen)return;const s=nt(t,o,it);a.translatedSpans.push(...s),a.failedCount++}f()}async function Zt(){if(a.active)return;const t=a.pieces.filter(e=>e.status==="failed");if(t.length!==0){for(const e of t){const n=new Set(e.textNodes);for(let o=a.translatedSpans.length-1;o>=0;o--)if(n.has(a.translatedSpans[o].originalNode)){const{originalNode:s,translatedSpan:r}=a.translatedSpans[o];r.parentNode&&r.parentNode.replaceChild(s,r),a.translatedSpans.splice(o,1)}e.status="pending"}a.retryGen++,a.cancelled=!1,a.failedCount=0,a.active=!0,f(),await z(t)}}async function Qt(t){if(a.active){a.controlBar&&Ft();return}a.cancelled=!1,a.completedCount=0,a.failedCount=0,a.mode="dual",a.direction=t,a.clones=new Map,a.translatedSpans=[],a.cache=Mt(),await a.cache.init();const e=Q(location.href),n=Z(document.body,{direction:y(),limit:ot,rule:e});if(n.length===0){alert("未找到可翻译的段落");return}a.pieces=n,a.totalCount=n.length,a.active=!0,Gt(),rt(n);const o=n.map(l=>l.text),{hit:s,miss:r}=await a.cache.query(o,y());for(const l of n)if(s.has(l.text)){const c=N(l,s.get(l.text));a.translatedSpans.push(...c),a.completedCount++,k(a.mode,a.clones,c)}f();const i=n.filter(l=>r.includes(l.text));i.length>0&&await z(i),a.cancelled||Xt()}function te(){at()}const L="__ai_translate_panel_host__",I="__ai_translate_read_aloud_host__",C="__ai_translate_popper_host__",W=5e3,w={interactionMode:"selection",voiceChinese:"",voiceEnglish:""};async function lt(){var t;try{const e=await chrome.storage.local.get("settings"),n=(t=e==null?void 0:e.settings)==null?void 0:t.translate;n&&(w.interactionMode=n.interactionMode||"selection",w.voiceChinese=n.voiceChinese||"",w.voiceEnglish=n.voiceEnglish||"")}catch{}}let A=[],g="",b="";function M(){"speechSynthesis"in window&&(A=window.speechSynthesis.getVoices())}function ee(t){const n=t.startsWith("zh")?w.voiceChinese:w.voiceEnglish;if(n){const r=A.find(i=>i.voiceURI===n);if(r)return r}let o=A.find(r=>r.lang===t);if(o)return o;const s=t.split("-")[0];return o=A.find(r=>r.lang.startsWith(s)),o||null}function ct(t,e,n,o){if(!("speechSynthesis"in window)){b="当前浏览器不支持语音合成",o();return}M();const s=window.speechSynthesis;s.cancel();const r=new SpeechSynthesisUtterance(t),i=/[\u4e00-\u9fa5]/.test(t);r.lang=i?"zh-CN":"en-US";const l=ee(r.lang);l&&(r.voice=l),r.rate=e,r.pitch=1,r.volume=1,r.onstart=()=>{g=n,b="",o()},r.onend=()=>{g="",o()},r.onerror=c=>{g="";const d=(c==null?void 0:c.error)||"未知错误";d==="not-allowed"||d==="service-not-allowed"?b="浏览器拒绝了语音播放，请检查系统音频/语音权限":d==="no-speech"||d==="synthesis-failed"?b=`朗读失败：系统可能未安装 ${r.lang} 语音包（错误：${d}）`:b=`朗读失败：${d}`,o()},setTimeout(()=>s.speak(r),50)}function T(){"speechSynthesis"in window&&window.speechSynthesis.cancel(),g=""}async function j(t,e){let n;try{n=await chrome.runtime.sendMessage({type:"DO_TRANSLATE",text:t,direction:e||"auto"})}catch(o){const s=(o==null?void 0:o.message)||String(o);throw s.includes("Extension context invalidated")?new Error("插件已更新，请刷新页面后重试"):new Error(`通信失败：${s}`)}if(!n)throw new Error("后台未响应翻译请求");if(n.error)throw new Error(n.error);return n.result}async function O(t,e,n){const o=wt(t);if(o.length<=1){const i=await j(t,e);return n(i,!0),i}let s="",r="";for(let i=0;i<o.length;i++){const l=await j(o[i],e);s+=(s?`
`:"")+l.translation,r=l.notes||r,n({translation:s,notes:r},i===o.length-1)}return{translation:s,notes:r}}function ne(){var t;(t=document.getElementById(L))==null||t.remove()}function P(t){ne(),T(),b="";const e=document.createElement("div");e.id=L,e.style.cssText="position:fixed; z-index:2147483647; max-width:440px;",t==="corner"?(e.style.top="20px",e.style.right="20px"):oe(e);const n=e.attachShadow({mode:"open"});return n.innerHTML=le,document.body.appendChild(e),n.querySelector(".close-btn").addEventListener("click",()=>{T(),e.remove()}),n}function oe(t){let e=80,n=80;const o=window.getSelection();if(o&&o.rangeCount>0){const i=o.getRangeAt(0).getBoundingClientRect();(i.width>0||i.height>0)&&(e=i.bottom+10,n=i.left)}const s=420,r=320;n+s>window.innerWidth-20&&(n=window.innerWidth-s-20),n<10&&(n=10),e+r>window.innerHeight-20&&(e=Math.max(10,(window.innerHeight-r)/2)),t.style.top=e+"px",t.style.left=n+"px"}function H(t){t.querySelector(".body").innerHTML='<div class="loading">翻译中...</div>'}function D(t,e,n,o,s){var c,d;const r=t.querySelector(".body");if(!r.querySelector(".result-text")){const u=s&&/[a-zA-Z]{2,}/.test(s),p=u?`<div class="original-section">
           <div class="section-row">
             <span class="section-label">原文</span>
             <button class="speak-btn syllable-btn" data-target="original">音节</button>
           </div>
           <div class="original-text"></div>
           <div class="speak-row">
             <button class="speak-btn" data-key="original-normal" data-rate="1">朗读原文</button>
             <button class="speak-btn" data-key="original-slow" data-rate="0.6">慢速原文</button>
           </div>
         </div>`:"",S=o?'<div class="truncated-hint">页面内容较长，仅翻译前 5000 字</div>':"";if(r.innerHTML=`
      ${p}
      ${S}
      <div class="result-text"></div>
      <div class="loading incremental-loading">翻译中...</div>
    `,u){const h=r.querySelector(".original-text");h.dataset.fullText=s,h.textContent=s,V(t,"original"),K(t,s,".original-section")}}const i=r.querySelector(".result-text"),l=(c=r.querySelector('.syllable-btn[data-target="result"]'))==null?void 0:c.classList.contains("active");if(dt(i,e.translation,!!l),i.dataset.fullText=e.translation,r.scrollTop=r.scrollHeight,n){(d=r.querySelector(".incremental-loading"))==null||d.remove();const u=e.notes?`<div class="result-notes">${U(e.notes)}</div>`:"",h=`
      <div class="speak-row">
        <button class="speak-btn" data-key="result-normal" data-rate="1">朗读</button>
        <button class="speak-btn" data-key="result-slow" data-rate="0.6">慢速</button>
        ${/[a-zA-Z]{2,}/.test(e.translation)?'<button class="speak-btn syllable-btn" data-target="result">音节</button>':""}
      </div>
      <div class="speak-hint"></div>
    `;r.insertAdjacentHTML("beforeend",u+h),K(t,e.translation),V(t,"result")}}function V(t,e){const n=t.querySelector(`.syllable-btn[data-target="${e}"]`);n&&n.addEventListener("click",()=>{const o=t.querySelector(e==="original"?".original-text":".result-text");if(!o)return;const s=o.dataset.fullText||o.textContent,r=n.classList.toggle("active");n.textContent=r?"原文":"音节",dt(o,s,r)})}function K(t,e,n){const o=n?t.querySelector(n):t;o&&o.querySelectorAll(".speak-btn[data-key]:not([data-wired])").forEach(s=>{s.dataset.wired="1",s.addEventListener("click",()=>{const r=s.dataset.key,i=parseFloat(s.dataset.rate);g===r?(T(),X(t)):ct(e,i,r,()=>X(t))})})}function se(t,e){t.querySelector(".body").innerHTML=`<div class="error">${U(e)}</div>`}function q(t,e){var o;const n=t.querySelector(".body");n&&n.querySelector(".result-text")?((o=n.querySelector(".incremental-loading"))==null||o.remove(),n.insertAdjacentHTML("beforeend",`<div class="error">${U(e.message)}</div>`)):se(t,e.message)}function X(t){t.querySelectorAll(".speak-btn[data-key]").forEach(n=>{const o=n.dataset.key;if(g===o)n.classList.add("speaking"),n.textContent="停止";else{n.classList.remove("speaking");const s=o.endsWith("-slow"),r=o.startsWith("original");n.textContent=r?s?"慢速原文":"朗读原文":s?"慢速":"朗读"}});const e=t.querySelector(".speak-hint");e&&(e.textContent=b)}function U(t){const e=document.createElement("div");return e.textContent=String(t),e.innerHTML}const Y=["#ffd6d6","#d6e4ff","#d6ffd6","#ffe8d6","#e8d6ff","#d6f5ff","#fff5d6","#ffd6e8"];function dt(t,e,n){if(!n){t.textContent=e;return}t.innerHTML="";const o=/[a-zA-Z][a-zA-Z']*/g;let s=0,r;for(;(r=o.exec(e))!==null;){r.index>s&&t.appendChild(document.createTextNode(e.slice(s,r.index)));const i=r[0];if(i.length<=1)t.appendChild(document.createTextNode(i));else{const l=St(i),c=document.createElement("span");c.className="syllable-word",c.dataset.word=i,l.forEach((d,u)=>{const p=document.createElement("span");p.className="syllable",p.style.backgroundColor=Y[u%Y.length],p.textContent=d.text,c.appendChild(p)}),t.appendChild(c)}s=r.index+i.length}s<e.length&&t.appendChild(document.createTextNode(e.slice(s)))}function ut(t){var o;(o=document.getElementById(I))==null||o.remove(),T();const e=document.createElement("div");e.id=I,e.style.cssText="position:fixed; top:20px; right:20px; z-index:2147483647;";const n=e.attachShadow({mode:"open"});n.innerHTML=`
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
  `,document.body.appendChild(e),n.querySelector(".stop-btn").addEventListener("click",()=>{T(),e.remove()}),ct(t,1,"read-aloud",()=>{g||e.remove()})}function E(){var t;(t=document.getElementById(C))==null||t.remove()}function re(){const t=window.getSelection();if(!t||t.rangeCount===0)return!1;const e=t.anchorNode;if(!e)return!1;const n=e.nodeType===1?e:e.parentElement;return n?!!n.closest(`#${L}, #${I}, #${C}`):!1}function ae(t,e){E();const n=document.createElement("div");n.id=C,n.style.cssText="position:fixed; z-index:2147483647;";const o=n.attachShadow({mode:"open"});o.innerHTML=`
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
  `,document.body.appendChild(n),o.querySelector(".popper");const s=36,r=120;let i=t.top-s-6;i<8&&(i=t.bottom+6);let l=t.left;l+r>window.innerWidth-12&&(l=window.innerWidth-r-12),l<8&&(l=8),n.style.top=i+"px",n.style.left=l+"px",o.querySelector('[data-action="translate"]').addEventListener("click",()=>{E();const c=P("selection");H(c),O(e,"auto",(d,u)=>{D(c,d,u,!1,e)}).catch(d=>q(c,d))}),o.querySelector('[data-action="read"]').addEventListener("click",()=>{E(),ut(e)})}document.addEventListener("mouseup",t=>{if(w.interactionMode!=="selection")return;const e=document.getElementById(C);if(e&&e.contains(t.target))return;const n=document.getElementById(L);if(n&&n.contains(t.target))return;const o=window.getSelection(),s=o==null?void 0:o.toString().trim();if(!s){E();return}if(re()||o.rangeCount===0)return;const r=o.getRangeAt(0).getBoundingClientRect();r.width===0&&r.height===0||ae(r,s)});document.addEventListener("mousedown",t=>{const e=document.getElementById(C);e&&!e.contains(t.target)&&E()},!0);function ie(){const t=(document.body.innerText||"").trim();return{text:t.slice(0,W),truncated:t.length>W}}chrome.runtime.onMessage.addListener(t=>{if(t.type==="translate-selection"){const e=(t.selectionText||"").trim();if(!e)return;const n=P("selection");H(n),O(e,"auto",(o,s)=>{D(n,o,s,!1,e)}).catch(o=>q(n,o));return}if(t.type==="translate-page"){const{text:e,truncated:n}=ie();if(!e)return;const o=P("corner");H(o),O(e,"auto",(s,r)=>{D(o,s,r,n)}).catch(s=>q(o,s));return}if(t.type==="translate-page-inline"){const e=t.direction||"auto";te(),yt(e);return}if(t.type==="immersive-translate"){const e=t.direction||"auto";xt(),Qt(e);return}if(t.type==="read-aloud"){const e=(t.selectionText||"").trim();if(!e)return;ut(e);return}});"speechSynthesis"in window&&(M(),window.speechSynthesis.onvoiceschanged=M);lt();chrome.storage.onChanged.addListener(t=>{var e,n;(n=(e=t.settings)==null?void 0:e.newValue)!=null&&n.translate&&lt()});const le=`
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
  .original-section {
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;
  }
  .section-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  .section-label { font-size: 13px; color: #888; }
  .original-text {
    font-size: 15px;
    line-height: 1.6;
    color: #555;
    white-space: pre-wrap;
    word-break: break-word;
  }
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
  .speak-btn.syllable-btn.active { background: #4a90d9; color: #fff; }
  .speak-hint { font-size: 12px; color: #e53935; margin-top: 8px; min-height: 14px; }
  .error { color: #e53935; font-size: 13px; padding: 8px 0; line-height: 1.5; }
  .syllable-word {
    display: inline-block;
    margin: 1px 3px;
    position: relative;
    cursor: default;
    border-radius: 4px;
  }
  .syllable-word:hover { background: rgba(74, 144, 217, 0.1); }
  .syllable {
    display: inline-block;
    padding: 1px 5px;
    margin: 0 1px;
    border-radius: 3px;
    font-size: 14px;
    transition: transform 0.15s;
  }
  .syllable-word:hover .syllable { transform: translateY(-1px); }
  .syllable-word[data-word]:hover::after {
    content: attr(data-word);
    position: absolute;
    bottom: calc(100% + 4px);
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: #fff;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 100;
    pointer-events: none;
  }
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
