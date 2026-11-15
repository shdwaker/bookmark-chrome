import{startInlineTranslation as Ke,clearInline as Je}from"./inline-translate.js-CLJwn9NT.js";import{l as Qe,h as Ze,a as et,c as Ce}from"./inline-D8oo8-WE.js";import{a as tt,s as rt}from"./chunk-BqGw6xQA.js";const it=["article",'[itemprop="articleBody"]','[role="main"]',"main",".article-body",".article-content",".post-content",".entry-content",".markdown-body",".content","#content"],nt=["nav","aside","footer","header",'[role="navigation"]','[role="banner"]','[role="complementary"]','[role="contentinfo"]','[aria-hidden="true"]'].join(","),he={ARTICLE:6e3,MAIN:3e3};function Se(n){let a=Math.min((n.textContent||"").trim().length,5e4);return a+=he[n.tagName]||0,n.getAttribute("itemprop")==="articleBody"&&(a+=4e3),n.getAttribute("role")==="main"&&(a+=2e3),a}function at(n){return[...n.querySelectorAll(it.join(","))].filter(r=>!r.closest(nt)).reduce((r,t)=>r?r.contains(t)?(he[t.tagName]||0)>(he[r.tagName]||0)?t:r:t.contains(r)||Se(t)>Se(r)?t:r:t,null)}const Re=new Set(["DIV","P","H1","H2","H3","H4","H5","H6","LI","BLOCKQUOTE","TD","TH","SECTION","ARTICLE","HEADER","FOOTER","MAIN","ASIDE","FIGURE","FIGCAPTION","PRE","TABLE","TR","TBODY","THEAD","TFOOT","UL","OL","DL","DD","DT","ADDRESS","FIELDSET","LEGEND","DETAILS","SUMMARY","FORM"]),st=new Set(["SCRIPT","STYLE","TEXTAREA","SVG","NOSCRIPT","IFRAME","BR","KBD","WBR","SELECT","DATALIST","OPTION","OPTGROUP","OBJECT","EMBED","CANVAS","AUDIO","VIDEO","TRACK","MAP","AREA","MATH","MJX-CONTAINER"]),ot=new Set(["katex","MathJax","mathjax","math"]),lt=new Set(["navigation","banner","complementary","contentinfo","search","dialog","menubar","toolbar"]),ct=/(^|[^a-z])(nav|navbar|navigation|menu|sidebar|advert|advertisements?|ads|promo|banner|social|share|related|recommended|breadcrumb|pagination|newsletter|subscribe|cookie|site-header|site-footer|topbar|toolbar|comment)([^a-z]|$)/i,Ae=1e3,ht=new Set(["#__ai_translate_panel_host__","#__ai_translate_read_aloud_host__","#__ai_translate_popper_host__","#__mt_control_bar_host__","#__immersive_control_bar_host__"]);function ut(n){let a=n.parentElement;for(;a;){if(Re.has(a.tagName)||a===document.body)return a;a=a.parentElement}return document.body}function dt(n){var a,e,r,t,i,l,s;if(st.has(n.tagName)||["NAV","MENU","ASIDE","FOOTER","H1"].includes(n.tagName)||((a=n.getAttribute)==null?void 0:a.call(n,"aria-hidden"))==="true"||lt.has((e=n.getAttribute)==null?void 0:e.call(n,"role"))||[n.id,...Array.from(n.classList||[])].some(o=>o&&ct.test(o))||(r=n.classList)!=null&&r.contains("notranslate")||((t=n.getAttribute)==null?void 0:t.call(n,"translate"))==="no"||n.isContentEditable||((i=n.getAttribute)==null?void 0:i.call(n,"contenteditable"))==="true"||n.id&&ht.has(n.id)||((l=n.dataset)==null?void 0:l.immersiveOriginal)!==void 0||((s=n.dataset)==null?void 0:s.immersiveTranslated)!==void 0)return!0;if(n.classList){for(const o of ot)if(n.classList.contains(o))return!0}return!1}function ft(n,a){return a==="en-zh"&&!Ze(n)||a==="zh-en"&&!et(n)}function gt(n,a){for(const e of a)try{n.querySelectorAll(e).forEach(r=>{r.classList.add("notranslate")})}catch{}}function pt(n,a){var e,r;if(n===document.body&&!((e=a==null?void 0:a.containerSelectors)!=null&&e.length)){const t=at(n);if(t)return[t]}if((r=a==null?void 0:a.containerSelectors)!=null&&r.length){const t=[];for(const i of a.containerSelectors)try{n.querySelectorAll(i).forEach(l=>t.push(l))}catch{}return t.length>0?t:[n]}return[n]}function Ie(n,a={}){var h;const{direction:e="auto",limit:r=500,rule:t=null}=a;(h=t==null?void 0:t.noTranslateSelectors)!=null&&h.length&&gt(n,t.noTranslateSelectors);const i=pt(n,t),l=[];let s=0;for(const d of i)mt(d,e,l,()=>(s++,`p${s}`));return l.slice(0,r)}function mt(n,a,e,r){let t=null;const i=s=>(t&&t.text.length>=Ae&&(k(t,e),t=null),t||(t={id:r(),blockEl:s||document.body,textNodes:[],text:"",status:"pending"}),t),l=(s,o)=>{if(s.nodeType===Node.TEXT_NODE){const g=s.textContent.trim();if(g.length===0||ft(g,a)||Qe(g))return;const b=o||ut(s);let _=g;for(;_.length>0;){const v=i(b),A=v.text?" ":"",N=Ae-v.text.length-A.length;if(N<=0){k(v,e),t=null;continue}const x=_.slice(0,N);v.textNodes.push(s),v.text+=A+x,_=_.slice(N),_.length>0&&(k(v,e),t=null)}return}if(s.nodeType!==Node.ELEMENT_NODE)return;const h=s;if(dt(h)){t&&(k(t,e),t=null);return}const d=Re.has(h.tagName),u=d?h:o;d&&t&&(k(t,e),t=null);for(const f of h.childNodes)l(f,u);d&&t&&(k(t,e),t=null)};l(n,null),t&&k(t,e)}function k(n,a){n.textNodes.length>0&&n.text.trim().length>0&&a.push(n)}const bt="immersive-translate-cache",_t=1,Y="translations";function yt(){let n=null;function a(){return new Promise((t,i)=>{const l=indexedDB.open(bt,_t);l.onupgradeneeded=s=>{const o=s.target.result;o.objectStoreNames.contains(Y)||o.createObjectStore(Y)},l.onsuccess=()=>t(l.result),l.onerror=()=>i(l.error)})}function e(t){if(!n)throw new Error("Cache not initialized");return n.transaction(Y,t).objectStore(Y)}function r(t){return new Promise((i,l)=>{t.onsuccess=()=>i(t.result),t.onerror=()=>l(t.error)})}return{async init(){n=await a()},async get(t){return r(e("readonly").get(t))},async set(t,i){await r(e("readwrite").put(i,t))},async delete(t){await r(e("readwrite").delete(t))},async clear(){await r(e("readwrite").clear())},async getMany(t){const i=new Map;for(const l of t){const s=await r(e("readonly").get(l));s!==void 0&&i.set(l,s)}return i},async setMany(t){for(const[i,l]of t)await r(e("readwrite").put(l,i))}}}function we(n,a){return`${a}::${n}`}function Et(n={}){const a=n.backend||yt();return{async init(){a.init&&await a.init()},async query(e,r){const t=e.map(o=>we(o,r)),i=await a.getMany(t),l=new Map,s=[];for(let o=0;o<e.length;o++){const h=i.get(t[o]);h!==void 0?l.set(e[o],h.translation):s.push(e[o])}return{hit:l,miss:s}},async write(e){if(e.length===0)return;const r=e.map(t=>[we(t.text,t.direction),{translation:t.translation,timestamp:Date.now()}]);await a.setMany(r)},async clear(){await a.clear()}}}const vt=[{hosts:["twitter.com","x.com"],containerSelectors:["article",'[data-testid="tweetText"]'],noTranslateSelectors:['[data-testid="User-Name"]',"time"]},{hosts:["reddit.com","old.reddit.com"],containerSelectors:[".Post",".Comment",'[data-testid="post-container"]'],noTranslateSelectors:[".vote-buttons",".Post__flatListItemButton"]},{hosts:["news.ycombinator.com"],containerSelectors:[".athing",".commtext"],noTranslateSelectors:[".votearrow",".score"]},{hosts:["github.com"],containerSelectors:[".markdown-body",".comment-body",".blob-code"],noTranslateSelectors:[".blob-num",".js-clipboard"]},{hosts:["wikipedia.org"],containerSelectors:["#mw-content-text"],noTranslateSelectors:[".mw-editsection",".reference",".citation"]}];function Pe(n){let a;try{a=new URL(n).hostname}catch{return null}for(const e of vt)if(e.hosts.some(r=>a.includes(r)))return e;return null}const ke="data-immersive-translated",Nt="data-immersive-original",De="span";function xt(n){const a=n.cloneNode(!0);return a.setAttribute(Nt,"1"),a.style.display="none",n.parentNode.insertBefore(a,n),{clone:a,blockEl:n}}function Z(n,a){const e=[];if(n.textNodes.length===0)return e;const r=Array.isArray(a)?a[0]:a,t=r&&typeof r=="object"?r.translation||"":String(r||"");for(let i=0;i<n.textNodes.length;i++){const l=n.textNodes[i],s=document.createElement(De);s.setAttribute(ke,"1"),i===0?s.textContent=t:(s.textContent="",s.style.display="none"),l.parentNode.replaceChild(s,l),e.push({originalNode:l,translatedSpan:s,blockEl:n.blockEl})}return n.status="translated",e}function Be(n,a,e){const r=document.createElement(De);if(r.setAttribute(ke,"1"),r.setAttribute("data-immersive-failed","1"),r.style.cssText="color:#e53935;cursor:pointer;border-bottom:1px dashed #e53935;",r.textContent=`翻译失败：${a.message}（点击重试）`,r.addEventListener("click",()=>e(n)),n.textNodes.length>0){const t=n.textNodes[0];t.parentNode.replaceChild(r,t)}return n.status="failed",[{originalNode:n.textNodes[0],translatedSpan:r,blockEl:n.blockEl}]}function F(n,a,e){const r=new Set;for(const{blockEl:t}of e)r.add(t);for(const[t,i]of a)if(r.has(t))switch(n){case"dual":i.style.display="",i.style.opacity="0.6",t.style.display="";break;case"translated":i.style.display="none",t.style.display="";break;case"original":i.style.display="",i.style.opacity="",t.style.display="none";break}}function Tt(n,a){for(let e=n.length-1;e>=0;e--){const{originalNode:r,translatedSpan:t}=n[e];t.parentNode&&t.parentNode.replaceChild(r,t)}for(const e of a.values())e.parentNode&&e.parentNode.removeChild(e)}const ue="__immersive_control_bar_host__",Me=500,St=3,At=500,wt=50,Lt=`
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
`,c={active:!1,cancelled:!1,paused:!1,mode:"dual",direction:"",pieces:[],clones:new Map,translatedSpans:[],completedCount:0,failedCount:0,totalCount:0,pool:null,observer:null,debounceTimer:null,cache:null,controlBar:null,retryGen:0};function D(){return c.direction||"auto"}async function Oe(n){const a=D();let e;try{e=await chrome.runtime.sendMessage({type:"DO_TRANSLATE",text:n,direction:a})}catch(t){const i=(t==null?void 0:t.message)||String(t);throw i.includes("Extension context invalidated")?new Error("插件已更新，请刷新页面后重试"):new Error(`通信失败：${i}`)}if(!e)throw new Error("后台未响应翻译请求");if(e.error)throw new Error(e.error);const r=e.result;if(typeof r=="string")return r;if(r!=null&&r.translation)return r.translation;throw new Error("翻译结果格式异常")}function Ct(){var e;(e=document.getElementById(ue))==null||e.remove();const n=document.createElement("div");n.id=ue,n.style.cssText="position:fixed; top:0; right:0; z-index:2147483647;";const a=n.attachShadow({mode:"open"});a.innerHTML=Lt,document.body.appendChild(n),a.querySelector(".clear-btn").addEventListener("click",Ge),a.querySelector(".retry-btn").addEventListener("click",Ht),a.querySelector(".pause-btn").addEventListener("click",kt),a.querySelectorAll(".mode-btn").forEach(r=>{r.addEventListener("click",()=>{const t=r.dataset.mode;Pt(t)})}),c.controlBar={host:n,shadow:a},w()}function w(){if(!c.controlBar)return;const n=c.controlBar.shadow,{active:a,completedCount:e,failedCount:r,totalCount:t,paused:i}=c,l=n.querySelector(".status"),s=n.querySelector(".count"),o=n.querySelector(".hint"),h=n.querySelector(".retry-btn"),d=n.querySelector(".pause-btn");i?l.textContent="已暂停":a?l.textContent="沉浸式中…":l.textContent="完成",s.textContent=`${e+r}/${t}`,!a&&r>0?(o.textContent=`${r}段失败`,h.style.display=""):(o.textContent="",h.style.display="none"),d&&(d.textContent=i?"继续":"暂停",d.classList.toggle("active",i)),n.querySelectorAll(".mode-btn").forEach(u=>{u.classList.toggle("active",u.dataset.mode===c.mode)})}function Rt(){if(!c.controlBar)return;const n=c.controlBar.shadow.querySelector(".bar");n.classList.remove("flash"),n.offsetWidth,n.classList.add("flash")}function It(){var n;(n=document.getElementById(ue))==null||n.remove(),c.controlBar=null}function Pt(n){c.mode=n,F(n,c.clones,c.translatedSpans),w()}function kt(){c.paused=!c.paused,w()}async function Dt(){for(;c.paused&&!c.cancelled;)await new Promise(n=>setTimeout(n,200));return!c.cancelled}function He(n){const a=new Set;for(const e of n){if(!e.blockEl||a.has(e.blockEl))continue;a.add(e.blockEl);const{clone:r}=xt(e.blockEl);c.clones.set(e.blockEl,r)}}async function pe(n){const a=Ce({items:n,concurrency:St,shouldCancel:()=>c.cancelled,worker:async r=>{if(c.cancelled||!await Dt())return;const t=await Oe(r.text);if(c.cancelled)return;const i=Z(r,t);c.translatedSpans.push(...i),c.completedCount++,F(c.mode,c.clones,i),c.cache&&await c.cache.write([{text:r.text,direction:D(),translation:t}]),w()}});c.pool=a;const e=await a.promise;if(c.pool=null,e.failed.length>0){for(const{item:r,error:t}of e.failed){const i=Be(r,t,Ue);c.translatedSpans.push(...i),c.failedCount++}w()}c.active=!1,w()}function Bt(){if(c.observer)return;const n=new MutationObserver(()=>{c.debounceTimer||(c.debounceTimer=setTimeout(()=>{c.debounceTimer=null,Mt()},At))});n.observe(document.body,{childList:!0,subtree:!0}),c.observer=n}function Mt(){if(c.cancelled||!c.observer||!c.controlBar)return;const n=Pe(location.href),r=Ie(document.body,{direction:D(),limit:Me,rule:n}).filter(t=>t.status==="pending").slice(0,wt).filter(t=>!c.clones.has(t.blockEl));r.length!==0&&(He(r),Ot(r))}async function Ot(n){const a=n.map(i=>i.text),{hit:e,miss:r}=await c.cache.query(a,D());for(const i of n)if(e.has(i.text)){const l=Z(i,e.get(i.text));c.translatedSpans.push(...l),c.completedCount++,F(c.mode,c.clones,l)}w();const t=n.filter(i=>r.includes(i.text));t.length>0&&await pe(t)}function Ge(){c.cancelled=!0,c.pool&&c.pool.cancel(),c.debounceTimer&&(clearTimeout(c.debounceTimer),c.debounceTimer=null),c.observer&&(c.observer.disconnect(),c.observer=null),Tt(c.translatedSpans,c.clones),It(),c.active=!1,c.cancelled=!1,c.paused=!1,c.pieces=[],c.clones=new Map,c.translatedSpans=[],c.completedCount=0,c.failedCount=0,c.totalCount=0,c.mode="dual"}async function Ue(n){const a=c.retryGen;if(c.cancelled||!c.controlBar)return;const e=new Set(n.textNodes);for(let r=c.translatedSpans.length-1;r>=0;r--)if(e.has(c.translatedSpans[r].originalNode)){const{originalNode:t,translatedSpan:i}=c.translatedSpans[r];i.parentNode&&i.parentNode.replaceChild(t,i),c.translatedSpans.splice(r,1)}n.status="pending",c.failedCount=Math.max(0,c.failedCount-1);try{const r=await Oe(n.text);if(c.cancelled||!c.controlBar||a!==c.retryGen)return;const t=Z(n,r);c.translatedSpans.push(...t),c.completedCount++,F(c.mode,c.clones,t),c.cache&&await c.cache.write([{text:n.text,direction:D(),translation:r}])}catch(r){if(c.cancelled||!c.controlBar||a!==c.retryGen)return;const t=Be(n,r,Ue);c.translatedSpans.push(...t),c.failedCount++}w()}async function Ht(){if(c.active)return;const n=c.pieces.filter(a=>a.status==="failed");if(n.length!==0){for(const a of n){const e=new Set(a.textNodes);for(let r=c.translatedSpans.length-1;r>=0;r--)if(e.has(c.translatedSpans[r].originalNode)){const{originalNode:t,translatedSpan:i}=c.translatedSpans[r];i.parentNode&&i.parentNode.replaceChild(t,i),c.translatedSpans.splice(r,1)}a.status="pending"}c.retryGen++,c.cancelled=!1,c.failedCount=0,c.active=!0,w(),await pe(n)}}async function Gt(n){if(c.active){c.controlBar&&Rt();return}c.cancelled=!1,c.completedCount=0,c.failedCount=0,c.mode="dual",c.direction=n,c.clones=new Map,c.translatedSpans=[],c.cache=Et(),await c.cache.init();const a=Pe(location.href),e=Ie(document.body,{direction:D(),limit:Me,rule:a});if(e.length===0){alert("未找到可翻译的段落");return}c.pieces=e,c.totalCount=e.length,c.active=!0,Ct(),He(e);const r=e.map(s=>s.text),{hit:t,miss:i}=await c.cache.query(r,D());for(const s of e)if(t.has(s.text)){const o=Z(s,t.get(s.text));c.translatedSpans.push(...o),c.completedCount++,F(c.mode,c.clones,o)}w();const l=e.filter(s=>i.includes(s.text));l.length>0&&await pe(l),c.cancelled||Bt()}function Ut(){Ge()}var $e={exports:{}};(function(n){function a(e,r){if(r&&r.documentElement)e=r,r=arguments[2];else if(!e||!e.documentElement)throw new Error("First argument to Readability constructor should be a document object.");if(r=r||{},this._doc=e,this._docJSDOMParser=this._doc.firstChild.__JSDOMParser__,this._articleTitle=null,this._articleByline=null,this._articleDir=null,this._articleSiteName=null,this._attempts=[],this._metadata={},this._debug=!!r.debug,this._maxElemsToParse=r.maxElemsToParse||this.DEFAULT_MAX_ELEMS_TO_PARSE,this._nbTopCandidates=r.nbTopCandidates||this.DEFAULT_N_TOP_CANDIDATES,this._charThreshold=r.charThreshold||this.DEFAULT_CHAR_THRESHOLD,this._classesToPreserve=this.CLASSES_TO_PRESERVE.concat(r.classesToPreserve||[]),this._keepClasses=!!r.keepClasses,this._serializer=r.serializer||function(t){return t.innerHTML},this._disableJSONLD=!!r.disableJSONLD,this._allowedVideoRegex=r.allowedVideoRegex||this.REGEXPS.videos,this._linkDensityModifier=r.linkDensityModifier||0,this._flags=this.FLAG_STRIP_UNLIKELYS|this.FLAG_WEIGHT_CLASSES|this.FLAG_CLEAN_CONDITIONALLY,this._debug){let t=function(i){if(i.nodeType==i.TEXT_NODE)return`${i.nodeName} ("${i.textContent}")`;let l=Array.from(i.attributes||[],function(s){return`${s.name}="${s.value}"`}).join(" ");return`<${i.localName} ${l}>`};this.log=function(){if(typeof console<"u"){let l=Array.from(arguments,s=>s&&s.nodeType==this.ELEMENT_NODE?t(s):s);l.unshift("Reader: (Readability)"),console.log(...l)}else if(typeof dump<"u"){var i=Array.prototype.map.call(arguments,function(l){return l&&l.nodeName?t(l):l}).join(" ");dump("Reader: (Readability) "+i+`
`)}}}else this.log=function(){}}a.prototype={FLAG_STRIP_UNLIKELYS:1,FLAG_WEIGHT_CLASSES:2,FLAG_CLEAN_CONDITIONALLY:4,ELEMENT_NODE:1,TEXT_NODE:3,DEFAULT_MAX_ELEMS_TO_PARSE:0,DEFAULT_N_TOP_CANDIDATES:5,DEFAULT_TAGS_TO_SCORE:"section,h2,h3,h4,h5,h6,p,td,pre".toUpperCase().split(","),DEFAULT_CHAR_THRESHOLD:500,REGEXPS:{unlikelyCandidates:/-ad-|ai2html|banner|breadcrumbs|combx|comment|community|cover-wrap|disqus|extra|footer|gdpr|header|legends|menu|related|remark|replies|rss|shoutbox|sidebar|skyscraper|social|sponsor|supplemental|ad-break|agegate|pagination|pager|popup|yom-remote/i,okMaybeItsACandidate:/and|article|body|column|content|main|shadow/i,positive:/article|body|content|entry|hentry|h-entry|main|page|pagination|post|text|blog|story/i,negative:/-ad-|hidden|^hid$| hid$| hid |^hid |banner|combx|comment|com-|contact|footer|gdpr|masthead|media|meta|outbrain|promo|related|scroll|share|shoutbox|sidebar|skyscraper|sponsor|shopping|tags|widget/i,extraneous:/print|archive|comment|discuss|e[\-]?mail|share|reply|all|login|sign|single|utility/i,byline:/byline|author|dateline|writtenby|p-author/i,replaceFonts:/<(\/?)font[^>]*>/gi,normalize:/\s{2,}/g,videos:/\/\/(www\.)?((dailymotion|youtube|youtube-nocookie|player\.vimeo|v\.qq)\.com|(archive|upload\.wikimedia)\.org|player\.twitch\.tv)/i,shareElements:/(\b|_)(share|sharedaddy)(\b|_)/i,nextLink:/(next|weiter|continue|>([^\|]|$)|»([^\|]|$))/i,prevLink:/(prev|earl|old|new|<|«)/i,tokenize:/\W+/g,whitespace:/^\s*$/,hasContent:/\S$/,hashUrl:/^#.+/,srcsetUrl:/(\S+)(\s+[\d.]+[xw])?(\s*(?:,|$))/g,b64DataUrl:/^data:\s*([^\s;,]+)\s*;\s*base64\s*,/i,commas:/\u002C|\u060C|\uFE50|\uFE10|\uFE11|\u2E41|\u2E34|\u2E32|\uFF0C/g,jsonLdArticleTypes:/^Article|AdvertiserContentArticle|NewsArticle|AnalysisNewsArticle|AskPublicNewsArticle|BackgroundNewsArticle|OpinionNewsArticle|ReportageNewsArticle|ReviewNewsArticle|Report|SatiricalArticle|ScholarlyArticle|MedicalScholarlyArticle|SocialMediaPosting|BlogPosting|LiveBlogPosting|DiscussionForumPosting|TechArticle|APIReference$/,adWords:/^(ad(vertising|vertisement)?|pub(licité)?|werb(ung)?|广告|Реклама|Anuncio)$/iu,loadingWords:/^((loading|正在加载|Загрузка|chargement|cargando)(…|\.\.\.)?)$/iu},UNLIKELY_ROLES:["menu","menubar","complementary","navigation","alert","alertdialog","dialog"],DIV_TO_P_ELEMS:new Set(["BLOCKQUOTE","DL","DIV","IMG","OL","P","PRE","TABLE","UL"]),ALTER_TO_DIV_EXCEPTIONS:["DIV","ARTICLE","SECTION","P","OL","UL"],PRESENTATIONAL_ATTRIBUTES:["align","background","bgcolor","border","cellpadding","cellspacing","frame","hspace","rules","style","valign","vspace"],DEPRECATED_SIZE_ATTRIBUTE_ELEMS:["TABLE","TH","TD","HR","PRE"],PHRASING_ELEMS:["ABBR","AUDIO","B","BDO","BR","BUTTON","CITE","CODE","DATA","DATALIST","DFN","EM","EMBED","I","IMG","INPUT","KBD","LABEL","MARK","MATH","METER","NOSCRIPT","OBJECT","OUTPUT","PROGRESS","Q","RUBY","SAMP","SCRIPT","SELECT","SMALL","SPAN","STRONG","SUB","SUP","TEXTAREA","TIME","VAR","WBR"],CLASSES_TO_PRESERVE:["page"],HTML_ESCAPE_MAP:{lt:"<",gt:">",amp:"&",quot:'"',apos:"'"},_postProcessContent(e){this._fixRelativeUris(e),this._simplifyNestedElements(e),this._keepClasses||this._cleanClasses(e)},_removeNodes(e,r){if(this._docJSDOMParser&&e._isLiveNodeList)throw new Error("Do not pass live node lists to _removeNodes");for(var t=e.length-1;t>=0;t--){var i=e[t],l=i.parentNode;l&&(!r||r.call(this,i,t,e))&&l.removeChild(i)}},_replaceNodeTags(e,r){if(this._docJSDOMParser&&e._isLiveNodeList)throw new Error("Do not pass live node lists to _replaceNodeTags");for(const t of e)this._setNodeTag(t,r)},_forEachNode(e,r){Array.prototype.forEach.call(e,r,this)},_findNode(e,r){return Array.prototype.find.call(e,r,this)},_someNode(e,r){return Array.prototype.some.call(e,r,this)},_everyNode(e,r){return Array.prototype.every.call(e,r,this)},_getAllNodesWithTag(e,r){return e.querySelectorAll?e.querySelectorAll(r.join(",")):[].concat.apply([],r.map(function(t){var i=e.getElementsByTagName(t);return Array.isArray(i)?i:Array.from(i)}))},_cleanClasses(e){var r=this._classesToPreserve,t=(e.getAttribute("class")||"").split(/\s+/).filter(i=>r.includes(i)).join(" ");for(t?e.setAttribute("class",t):e.removeAttribute("class"),e=e.firstElementChild;e;e=e.nextElementSibling)this._cleanClasses(e)},_isUrl(e){try{return new URL(e),!0}catch{return!1}},_fixRelativeUris(e){var r=this._doc.baseURI,t=this._doc.documentURI;function i(o){if(r==t&&o.charAt(0)=="#")return o;try{return new URL(o,r).href}catch{}return o}var l=this._getAllNodesWithTag(e,["a"]);this._forEachNode(l,function(o){var h=o.getAttribute("href");if(h)if(h.indexOf("javascript:")===0)if(o.childNodes.length===1&&o.childNodes[0].nodeType===this.TEXT_NODE){var d=this._doc.createTextNode(o.textContent);o.parentNode.replaceChild(d,o)}else{for(var u=this._doc.createElement("span");o.firstChild;)u.appendChild(o.firstChild);o.parentNode.replaceChild(u,o)}else o.setAttribute("href",i(h))});var s=this._getAllNodesWithTag(e,["img","picture","figure","video","audio","source"]);this._forEachNode(s,function(o){var h=o.getAttribute("src"),d=o.getAttribute("poster"),u=o.getAttribute("srcset");if(h&&o.setAttribute("src",i(h)),d&&o.setAttribute("poster",i(d)),u){var f=u.replace(this.REGEXPS.srcsetUrl,function(g,b,_,v){return i(b)+(_||"")+v});o.setAttribute("srcset",f)}})},_simplifyNestedElements(e){for(var r=e;r;){if(r.parentNode&&["DIV","SECTION"].includes(r.tagName)&&!(r.id&&r.id.startsWith("readability"))){if(this._isElementWithoutContent(r)){r=this._removeAndGetNext(r);continue}else if(this._hasSingleTagInsideElement(r,"DIV")||this._hasSingleTagInsideElement(r,"SECTION")){for(var t=r.children[0],i=0;i<r.attributes.length;i++)t.setAttributeNode(r.attributes[i].cloneNode());r.parentNode.replaceChild(t,r),r=t;continue}}r=this._getNextNode(r)}},_getArticleTitle(){var e=this._doc,r="",t="";try{r=t=e.title.trim(),typeof r!="string"&&(r=t=this._getInnerText(e.getElementsByTagName("title")[0]))}catch{}var i=!1;function l(f){return f.split(/\s+/).length}if(/ [\|\-\\\/>»] /.test(r)){i=/ [\\\/>»] /.test(r);let f=Array.from(t.matchAll(/ [\|\-\\\/>»] /gi));r=t.substring(0,f.pop().index),l(r)<3&&(r=t.replace(/^[^\|\-\\\/>»]*[\|\-\\\/>»]/gi,""))}else if(r.includes(": ")){var s=this._getAllNodesWithTag(e,["h1","h2"]),o=r.trim(),h=this._someNode(s,function(f){return f.textContent.trim()===o});h||(r=t.substring(t.lastIndexOf(":")+1),l(r)<3?r=t.substring(t.indexOf(":")+1):l(t.substr(0,t.indexOf(":")))>5&&(r=t))}else if(r.length>150||r.length<15){var d=e.getElementsByTagName("h1");d.length===1&&(r=this._getInnerText(d[0]))}r=r.trim().replace(this.REGEXPS.normalize," ");var u=l(r);return u<=4&&(!i||u!=l(t.replace(/[\|\-\\\/>»]+/g,""))-1)&&(r=t),r},_prepDocument(){var e=this._doc;this._removeNodes(this._getAllNodesWithTag(e,["style"])),e.body&&this._replaceBrs(e.body),this._replaceNodeTags(this._getAllNodesWithTag(e,["font"]),"SPAN")},_nextNode(e){for(var r=e;r&&r.nodeType!=this.ELEMENT_NODE&&this.REGEXPS.whitespace.test(r.textContent);)r=r.nextSibling;return r},_replaceBrs(e){this._forEachNode(this._getAllNodesWithTag(e,["br"]),function(r){for(var t=r.nextSibling,i=!1;(t=this._nextNode(t))&&t.tagName=="BR";){i=!0;var l=t.nextSibling;t.remove(),t=l}if(i){var s=this._doc.createElement("p");for(r.parentNode.replaceChild(s,r),t=s.nextSibling;t;){if(t.tagName=="BR"){var o=this._nextNode(t.nextSibling);if(o&&o.tagName=="BR")break}if(!this._isPhrasingContent(t))break;var h=t.nextSibling;s.appendChild(t),t=h}for(;s.lastChild&&this._isWhitespace(s.lastChild);)s.lastChild.remove();s.parentNode.tagName==="P"&&this._setNodeTag(s.parentNode,"DIV")}})},_setNodeTag(e,r){if(this.log("_setNodeTag",e,r),this._docJSDOMParser)return e.localName=r.toLowerCase(),e.tagName=r.toUpperCase(),e;for(var t=e.ownerDocument.createElement(r);e.firstChild;)t.appendChild(e.firstChild);e.parentNode.replaceChild(t,e),e.readability&&(t.readability=e.readability);for(var i=0;i<e.attributes.length;i++)t.setAttributeNode(e.attributes[i].cloneNode());return t},_prepArticle(e){this._cleanStyles(e),this._markDataTables(e),this._fixLazyImages(e),this._cleanConditionally(e,"form"),this._cleanConditionally(e,"fieldset"),this._clean(e,"object"),this._clean(e,"embed"),this._clean(e,"footer"),this._clean(e,"link"),this._clean(e,"aside");var r=this.DEFAULT_CHAR_THRESHOLD;this._forEachNode(e.children,function(t){this._cleanMatchedNodes(t,function(i,l){return this.REGEXPS.shareElements.test(l)&&i.textContent.length<r})}),this._clean(e,"iframe"),this._clean(e,"input"),this._clean(e,"textarea"),this._clean(e,"select"),this._clean(e,"button"),this._cleanHeaders(e),this._cleanConditionally(e,"table"),this._cleanConditionally(e,"ul"),this._cleanConditionally(e,"div"),this._replaceNodeTags(this._getAllNodesWithTag(e,["h1"]),"h2"),this._removeNodes(this._getAllNodesWithTag(e,["p"]),function(t){var i=this._getAllNodesWithTag(t,["img","embed","object","iframe"]).length;return i===0&&!this._getInnerText(t,!1)}),this._forEachNode(this._getAllNodesWithTag(e,["br"]),function(t){var i=this._nextNode(t.nextSibling);i&&i.tagName=="P"&&t.remove()}),this._forEachNode(this._getAllNodesWithTag(e,["table"]),function(t){var i=this._hasSingleTagInsideElement(t,"TBODY")?t.firstElementChild:t;if(this._hasSingleTagInsideElement(i,"TR")){var l=i.firstElementChild;if(this._hasSingleTagInsideElement(l,"TD")){var s=l.firstElementChild;s=this._setNodeTag(s,this._everyNode(s.childNodes,this._isPhrasingContent)?"P":"DIV"),t.parentNode.replaceChild(s,t)}}})},_initializeNode(e){switch(e.readability={contentScore:0},e.tagName){case"DIV":e.readability.contentScore+=5;break;case"PRE":case"TD":case"BLOCKQUOTE":e.readability.contentScore+=3;break;case"ADDRESS":case"OL":case"UL":case"DL":case"DD":case"DT":case"LI":case"FORM":e.readability.contentScore-=3;break;case"H1":case"H2":case"H3":case"H4":case"H5":case"H6":case"TH":e.readability.contentScore-=5;break}e.readability.contentScore+=this._getClassWeight(e)},_removeAndGetNext(e){var r=this._getNextNode(e,!0);return e.remove(),r},_getNextNode(e,r){if(!r&&e.firstElementChild)return e.firstElementChild;if(e.nextElementSibling)return e.nextElementSibling;do e=e.parentNode;while(e&&!e.nextElementSibling);return e&&e.nextElementSibling},_textSimilarity(e,r){var t=e.toLowerCase().split(this.REGEXPS.tokenize).filter(Boolean),i=r.toLowerCase().split(this.REGEXPS.tokenize).filter(Boolean);if(!t.length||!i.length)return 0;var l=i.filter(o=>!t.includes(o)),s=l.join(" ").length/i.join(" ").length;return 1-s},_isValidByline(e,r){var t=e.getAttribute("rel"),i=e.getAttribute("itemprop"),l=e.textContent.trim().length;return(t==="author"||i&&i.includes("author")||this.REGEXPS.byline.test(r))&&!!l&&l<100},_getNodeAncestors(e,r){r=r||0;for(var t=0,i=[];e.parentNode&&(i.push(e.parentNode),!(r&&++t===r));)e=e.parentNode;return i},_grabArticle(e){this.log("**** grabArticle ****");var r=this._doc,t=e!==null;if(e=e||this._doc.body,!e)return this.log("No body found in document. Abort."),null;for(var i=e.innerHTML;;){this.log("Starting grabArticle loop");var l=this._flagIsActive(this.FLAG_STRIP_UNLIKELYS),s=[],o=this._doc.documentElement;let xe=!0;for(;o;){o.tagName==="HTML"&&(this._articleLang=o.getAttribute("lang"));var h=o.className+" "+o.id;if(!this._isProbablyVisible(o)){this.log("Removing hidden node - "+h),o=this._removeAndGetNext(o);continue}if(o.getAttribute("aria-modal")=="true"&&o.getAttribute("role")=="dialog"){o=this._removeAndGetNext(o);continue}if(!this._articleByline&&!this._metadata.byline&&this._isValidByline(o,h)){for(var d=this._getNextNode(o,!0),u=this._getNextNode(o),f=null;u&&u!=d;){var g=u.getAttribute("itemprop");if(g&&g.includes("name")){f=u;break}else u=this._getNextNode(u)}this._articleByline=(f??o).textContent.trim(),o=this._removeAndGetNext(o);continue}if(xe&&this._headerDuplicatesTitle(o)){this.log("Removing header: ",o.textContent.trim(),this._articleTitle.trim()),xe=!1,o=this._removeAndGetNext(o);continue}if(l){if(this.REGEXPS.unlikelyCandidates.test(h)&&!this.REGEXPS.okMaybeItsACandidate.test(h)&&!this._hasAncestorTag(o,"table")&&!this._hasAncestorTag(o,"code")&&o.tagName!=="BODY"&&o.tagName!=="A"){this.log("Removing unlikely candidate - "+h),o=this._removeAndGetNext(o);continue}if(this.UNLIKELY_ROLES.includes(o.getAttribute("role"))){this.log("Removing content with role "+o.getAttribute("role")+" - "+h),o=this._removeAndGetNext(o);continue}}if((o.tagName==="DIV"||o.tagName==="SECTION"||o.tagName==="HEADER"||o.tagName==="H1"||o.tagName==="H2"||o.tagName==="H3"||o.tagName==="H4"||o.tagName==="H5"||o.tagName==="H6")&&this._isElementWithoutContent(o)){o=this._removeAndGetNext(o);continue}if(this.DEFAULT_TAGS_TO_SCORE.includes(o.tagName)&&s.push(o),o.tagName==="DIV"){for(var b=null,_=o.firstChild;_;){var v=_.nextSibling;if(this._isPhrasingContent(_))b!==null?b.appendChild(_):this._isWhitespace(_)||(b=r.createElement("p"),o.replaceChild(b,_),b.appendChild(_));else if(b!==null){for(;b.lastChild&&this._isWhitespace(b.lastChild);)b.lastChild.remove();b=null}_=v}if(this._hasSingleTagInsideElement(o,"P")&&this._getLinkDensity(o)<.25){var A=o.children[0];o.parentNode.replaceChild(A,o),o=A,s.push(o)}else this._hasChildBlockElement(o)||(o=this._setNodeTag(o,"P"),s.push(o))}o=this._getNextNode(o)}var N=[];this._forEachNode(s,function(L){if(!(!L.parentNode||typeof L.parentNode.tagName>"u")){var C=this._getInnerText(L);if(!(C.length<25)){var Te=this._getNodeAncestors(L,5);if(Te.length!==0){var j=0;j+=1,j+=C.split(this.REGEXPS.commas).length,j+=Math.min(Math.floor(C.length/100),3),this._forEachNode(Te,function(P,le){if(!(!P.tagName||!P.parentNode||typeof P.parentNode.tagName>"u")){if(typeof P.readability>"u"&&(this._initializeNode(P),N.push(P)),le===0)var ce=1;else le===1?ce=2:ce=le*3;P.readability.contentScore+=j/ce}})}}}});for(var x=[],R=0,O=N.length;R<O;R+=1){var S=N[R],H=S.readability.contentScore*(1-this._getLinkDensity(S));S.readability.contentScore=H,this.log("Candidate:",S,"with score "+H);for(var I=0;I<this._nbTopCandidates;I++){var G=x[I];if(!G||H>G.readability.contentScore){x.splice(I,0,S),x.length>this._nbTopCandidates&&x.pop();break}}}var p=x[0]||null,B=!1,m;if(p===null||p.tagName==="BODY"){for(p=r.createElement("DIV"),B=!0;e.firstChild;)this.log("Moving child out:",e.firstChild),p.appendChild(e.firstChild);e.appendChild(p),this._initializeNode(p)}else if(p){for(var E=[],U=1;U<x.length;U++)x[U].readability.contentScore/p.readability.contentScore>=.75&&E.push(this._getNodeAncestors(x[U]));var te=3;if(E.length>=te)for(m=p.parentNode;m.tagName!=="BODY";){for(var re=0,ie=0;ie<E.length&&re<te;ie++)re+=Number(E[ie].includes(m));if(re>=te){p=m;break}m=m.parentNode}p.readability||this._initializeNode(p),m=p.parentNode;for(var ne=p.readability.contentScore,Xe=ne/3;m.tagName!=="BODY";){if(!m.readability){m=m.parentNode;continue}var be=m.readability.contentScore;if(be<Xe)break;if(be>ne){p=m;break}ne=m.readability.contentScore,m=m.parentNode}for(m=p.parentNode;m.tagName!="BODY"&&m.children.length==1;)p=m,m=p.parentNode;p.readability||this._initializeNode(p)}var T=r.createElement("DIV");t&&(T.id="readability-content");var je=Math.max(10,p.readability.contentScore*.2);m=p.parentNode;for(var ae=m.children,V=0,_e=ae.length;V<_e;V++){var y=ae[V],$=!1;if(this.log("Looking at sibling node:",y,y.readability?"with score "+y.readability.contentScore:""),this.log("Sibling has score",y.readability?y.readability.contentScore:"Unknown"),y===p)$=!0;else{var ye=0;if(y.className===p.className&&p.className!==""&&(ye+=p.readability.contentScore*.2),y.readability&&y.readability.contentScore+ye>=je)$=!0;else if(y.nodeName==="P"){var Ee=this._getLinkDensity(y),ve=this._getInnerText(y),se=ve.length;(se>80&&Ee<.25||se<80&&se>0&&Ee===0&&ve.search(/\.( |$)/)!==-1)&&($=!0)}}$&&(this.log("Appending node:",y),this.ALTER_TO_DIV_EXCEPTIONS.includes(y.nodeName)||(this.log("Altering sibling:",y,"to div."),y=this._setNodeTag(y,"DIV")),T.appendChild(y),ae=m.children,V-=1,_e-=1)}if(this._debug&&this.log("Article content pre-prep: "+T.innerHTML),this._prepArticle(T),this._debug&&this.log("Article content post-prep: "+T.innerHTML),B)p.id="readability-page-1",p.className="page";else{var X=r.createElement("DIV");for(X.id="readability-page-1",X.className="page";T.firstChild;)X.appendChild(T.firstChild);T.appendChild(X)}this._debug&&this.log("Article content after paging: "+T.innerHTML);var oe=!0,Ne=this._getInnerText(T,!0).length;if(Ne<this._charThreshold)if(oe=!1,e.innerHTML=i,this._attempts.push({articleContent:T,textLength:Ne}),this._flagIsActive(this.FLAG_STRIP_UNLIKELYS))this._removeFlag(this.FLAG_STRIP_UNLIKELYS);else if(this._flagIsActive(this.FLAG_WEIGHT_CLASSES))this._removeFlag(this.FLAG_WEIGHT_CLASSES);else if(this._flagIsActive(this.FLAG_CLEAN_CONDITIONALLY))this._removeFlag(this.FLAG_CLEAN_CONDITIONALLY);else{if(this._attempts.sort(function(L,C){return C.textLength-L.textLength}),!this._attempts[0].textLength)return null;T=this._attempts[0].articleContent,oe=!0}if(oe){var Ye=[m,p].concat(this._getNodeAncestors(m));return this._someNode(Ye,function(L){if(!L.tagName)return!1;var C=L.getAttribute("dir");return C?(this._articleDir=C,!0):!1}),T}}},_unescapeHtmlEntities(e){if(!e)return e;var r=this.HTML_ESCAPE_MAP;return e.replace(/&(quot|amp|apos|lt|gt);/g,function(t,i){return r[i]}).replace(/&#(?:x([0-9a-f]+)|([0-9]+));/gi,function(t,i,l){var s=parseInt(i||l,i?16:10);return(s==0||s>1114111||s>=55296&&s<=57343)&&(s=65533),String.fromCodePoint(s)})},_getJSONLD(e){var r=this._getAllNodesWithTag(e,["script"]),t;return this._forEachNode(r,function(i){if(!t&&i.getAttribute("type")==="application/ld+json")try{var l=i.textContent.replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g,""),s=JSON.parse(l);if(Array.isArray(s)&&(s=s.find(g=>g["@type"]&&g["@type"].match(this.REGEXPS.jsonLdArticleTypes)),!s))return;var o=/^https?\:\/\/schema\.org\/?$/,h=typeof s["@context"]=="string"&&s["@context"].match(o)||typeof s["@context"]=="object"&&typeof s["@context"]["@vocab"]=="string"&&s["@context"]["@vocab"].match(o);if(!h||(!s["@type"]&&Array.isArray(s["@graph"])&&(s=s["@graph"].find(g=>(g["@type"]||"").match(this.REGEXPS.jsonLdArticleTypes))),!s||!s["@type"]||!s["@type"].match(this.REGEXPS.jsonLdArticleTypes)))return;if(t={},typeof s.name=="string"&&typeof s.headline=="string"&&s.name!==s.headline){var d=this._getArticleTitle(),u=this._textSimilarity(s.name,d)>.75,f=this._textSimilarity(s.headline,d)>.75;f&&!u?t.title=s.headline:t.title=s.name}else typeof s.name=="string"?t.title=s.name.trim():typeof s.headline=="string"&&(t.title=s.headline.trim());s.author&&(typeof s.author.name=="string"?t.byline=s.author.name.trim():Array.isArray(s.author)&&s.author[0]&&typeof s.author[0].name=="string"&&(t.byline=s.author.filter(function(g){return g&&typeof g.name=="string"}).map(function(g){return g.name.trim()}).join(", "))),typeof s.description=="string"&&(t.excerpt=s.description.trim()),s.publisher&&typeof s.publisher.name=="string"&&(t.siteName=s.publisher.name.trim()),typeof s.datePublished=="string"&&(t.datePublished=s.datePublished.trim())}catch(g){this.log(g.message)}}),t||{}},_getArticleMetadata(e){var r={},t={},i=this._doc.getElementsByTagName("meta"),l=/\s*(article|dc|dcterm|og|twitter)\s*:\s*(author|creator|description|published_time|title|site_name)\s*/gi,s=/^\s*(?:(dc|dcterm|og|twitter|parsely|weibo:(article|webpage))\s*[-\.:]\s*)?(author|creator|pub-date|description|title|site_name)\s*$/i;this._forEachNode(i,function(h){var d=h.getAttribute("name"),u=h.getAttribute("property"),f=h.getAttribute("content");if(f){var g=null,b=null;u&&(g=u.match(l),g&&(b=g[0].toLowerCase().replace(/\s/g,""),t[b]=f.trim())),!g&&d&&s.test(d)&&(b=d,f&&(b=b.toLowerCase().replace(/\s/g,"").replace(/\./g,":"),t[b]=f.trim()))}}),r.title=e.title||t["dc:title"]||t["dcterm:title"]||t["og:title"]||t["weibo:article:title"]||t["weibo:webpage:title"]||t.title||t["twitter:title"]||t["parsely-title"],r.title||(r.title=this._getArticleTitle());const o=typeof t["article:author"]=="string"&&!this._isUrl(t["article:author"])?t["article:author"]:void 0;return r.byline=e.byline||t["dc:creator"]||t["dcterm:creator"]||t.author||t["parsely-author"]||o,r.excerpt=e.excerpt||t["dc:description"]||t["dcterm:description"]||t["og:description"]||t["weibo:article:description"]||t["weibo:webpage:description"]||t.description||t["twitter:description"],r.siteName=e.siteName||t["og:site_name"],r.publishedTime=e.datePublished||t["article:published_time"]||t["parsely-pub-date"]||null,r.title=this._unescapeHtmlEntities(r.title),r.byline=this._unescapeHtmlEntities(r.byline),r.excerpt=this._unescapeHtmlEntities(r.excerpt),r.siteName=this._unescapeHtmlEntities(r.siteName),r.publishedTime=this._unescapeHtmlEntities(r.publishedTime),r},_isSingleImage(e){for(;e;){if(e.tagName==="IMG")return!0;if(e.children.length!==1||e.textContent.trim()!=="")return!1;e=e.children[0]}return!1},_unwrapNoscriptImages(e){var r=Array.from(e.getElementsByTagName("img"));this._forEachNode(r,function(i){for(var l=0;l<i.attributes.length;l++){var s=i.attributes[l];switch(s.name){case"src":case"srcset":case"data-src":case"data-srcset":return}if(/\.(jpg|jpeg|png|webp)/i.test(s.value))return}i.remove()});var t=Array.from(e.getElementsByTagName("noscript"));this._forEachNode(t,function(i){if(this._isSingleImage(i)){var l=e.createElement("div");l.innerHTML=i.innerHTML;var s=i.previousElementSibling;if(s&&this._isSingleImage(s)){var o=s;o.tagName!=="IMG"&&(o=s.getElementsByTagName("img")[0]);for(var h=l.getElementsByTagName("img")[0],d=0;d<o.attributes.length;d++){var u=o.attributes[d];if(u.value!==""&&(u.name==="src"||u.name==="srcset"||/\.(jpg|jpeg|png|webp)/i.test(u.value))){if(h.getAttribute(u.name)===u.value)continue;var f=u.name;h.hasAttribute(f)&&(f="data-old-"+f),h.setAttribute(f,u.value)}}i.parentNode.replaceChild(l.firstElementChild,s)}}})},_removeScripts(e){this._removeNodes(this._getAllNodesWithTag(e,["script","noscript"]))},_hasSingleTagInsideElement(e,r){return e.children.length!=1||e.children[0].tagName!==r?!1:!this._someNode(e.childNodes,function(t){return t.nodeType===this.TEXT_NODE&&this.REGEXPS.hasContent.test(t.textContent)})},_isElementWithoutContent(e){return e.nodeType===this.ELEMENT_NODE&&!e.textContent.trim().length&&(!e.children.length||e.children.length==e.getElementsByTagName("br").length+e.getElementsByTagName("hr").length)},_hasChildBlockElement(e){return this._someNode(e.childNodes,function(r){return this.DIV_TO_P_ELEMS.has(r.tagName)||this._hasChildBlockElement(r)})},_isPhrasingContent(e){return e.nodeType===this.TEXT_NODE||this.PHRASING_ELEMS.includes(e.tagName)||(e.tagName==="A"||e.tagName==="DEL"||e.tagName==="INS")&&this._everyNode(e.childNodes,this._isPhrasingContent)},_isWhitespace(e){return e.nodeType===this.TEXT_NODE&&e.textContent.trim().length===0||e.nodeType===this.ELEMENT_NODE&&e.tagName==="BR"},_getInnerText(e,r){r=typeof r>"u"?!0:r;var t=e.textContent.trim();return r?t.replace(this.REGEXPS.normalize," "):t},_getCharCount(e,r){return r=r||",",this._getInnerText(e).split(r).length-1},_cleanStyles(e){if(!(!e||e.tagName.toLowerCase()==="svg")){for(var r=0;r<this.PRESENTATIONAL_ATTRIBUTES.length;r++)e.removeAttribute(this.PRESENTATIONAL_ATTRIBUTES[r]);this.DEPRECATED_SIZE_ATTRIBUTE_ELEMS.includes(e.tagName)&&(e.removeAttribute("width"),e.removeAttribute("height"));for(var t=e.firstElementChild;t!==null;)this._cleanStyles(t),t=t.nextElementSibling}},_getLinkDensity(e){var r=this._getInnerText(e).length;if(r===0)return 0;var t=0;return this._forEachNode(e.getElementsByTagName("a"),function(i){var l=i.getAttribute("href"),s=l&&this.REGEXPS.hashUrl.test(l)?.3:1;t+=this._getInnerText(i).length*s}),t/r},_getClassWeight(e){if(!this._flagIsActive(this.FLAG_WEIGHT_CLASSES))return 0;var r=0;return typeof e.className=="string"&&e.className!==""&&(this.REGEXPS.negative.test(e.className)&&(r-=25),this.REGEXPS.positive.test(e.className)&&(r+=25)),typeof e.id=="string"&&e.id!==""&&(this.REGEXPS.negative.test(e.id)&&(r-=25),this.REGEXPS.positive.test(e.id)&&(r+=25)),r},_clean(e,r){var t=["object","embed","iframe"].includes(r);this._removeNodes(this._getAllNodesWithTag(e,[r]),function(i){if(t){for(var l=0;l<i.attributes.length;l++)if(this._allowedVideoRegex.test(i.attributes[l].value))return!1;if(i.tagName==="object"&&this._allowedVideoRegex.test(i.innerHTML))return!1}return!0})},_hasAncestorTag(e,r,t,i){t=t||3,r=r.toUpperCase();for(var l=0;e.parentNode;){if(t>0&&l>t)return!1;if(e.parentNode.tagName===r&&(!i||i(e.parentNode)))return!0;e=e.parentNode,l++}return!1},_getRowAndColumnCount(e){for(var r=0,t=0,i=e.getElementsByTagName("tr"),l=0;l<i.length;l++){var s=i[l].getAttribute("rowspan")||0;s&&(s=parseInt(s,10)),r+=s||1;for(var o=0,h=i[l].getElementsByTagName("td"),d=0;d<h.length;d++){var u=h[d].getAttribute("colspan")||0;u&&(u=parseInt(u,10)),o+=u||1}t=Math.max(t,o)}return{rows:r,columns:t}},_markDataTables(e){for(var r=e.getElementsByTagName("table"),t=0;t<r.length;t++){var i=r[t],l=i.getAttribute("role");if(l=="presentation"){i._readabilityDataTable=!1;continue}var s=i.getAttribute("datatable");if(s=="0"){i._readabilityDataTable=!1;continue}var o=i.getAttribute("summary");if(o){i._readabilityDataTable=!0;continue}var h=i.getElementsByTagName("caption")[0];if(h&&h.childNodes.length){i._readabilityDataTable=!0;continue}var d=["col","colgroup","tfoot","thead","th"],u=function(g){return!!i.getElementsByTagName(g)[0]};if(d.some(u)){this.log("Data table because found data-y descendant"),i._readabilityDataTable=!0;continue}if(i.getElementsByTagName("table")[0]){i._readabilityDataTable=!1;continue}var f=this._getRowAndColumnCount(i);if(f.columns==1||f.rows==1){i._readabilityDataTable=!1;continue}if(f.rows>=10||f.columns>4){i._readabilityDataTable=!0;continue}i._readabilityDataTable=f.rows*f.columns>10}},_fixLazyImages(e){this._forEachNode(this._getAllNodesWithTag(e,["img","picture","figure"]),function(r){if(r.src&&this.REGEXPS.b64DataUrl.test(r.src)){var t=this.REGEXPS.b64DataUrl.exec(r.src);if(t[1]==="image/svg+xml")return;for(var i=!1,l=0;l<r.attributes.length;l++){var s=r.attributes[l];if(s.name!=="src"&&/\.(jpg|jpeg|png|webp)/i.test(s.value)){i=!0;break}}if(i){var o=t[0].length,h=r.src.length-o;h<133&&r.removeAttribute("src")}}if(!((r.src||r.srcset&&r.srcset!="null")&&!r.className.toLowerCase().includes("lazy"))){for(var d=0;d<r.attributes.length;d++)if(s=r.attributes[d],!(s.name==="src"||s.name==="srcset"||s.name==="alt")){var u=null;if(/\.(jpg|jpeg|png|webp)\s+\d/.test(s.value)?u="srcset":/^\s*\S+\.(jpg|jpeg|png|webp)\S*\s*$/.test(s.value)&&(u="src"),u){if(r.tagName==="IMG"||r.tagName==="PICTURE")r.setAttribute(u,s.value);else if(r.tagName==="FIGURE"&&!this._getAllNodesWithTag(r,["img","picture"]).length){var f=this._doc.createElement("img");f.setAttribute(u,s.value),r.appendChild(f)}}}}})},_getTextDensity(e,r){var t=this._getInnerText(e,!0).length;if(t===0)return 0;var i=0,l=this._getAllNodesWithTag(e,r);return this._forEachNode(l,s=>i+=this._getInnerText(s,!0).length),i/t},_cleanConditionally(e,r){this._flagIsActive(this.FLAG_CLEAN_CONDITIONALLY)&&this._removeNodes(this._getAllNodesWithTag(e,[r]),function(t){var i=function(m){return m._readabilityDataTable},l=r==="ul"||r==="ol";if(!l){var s=0,o=this._getAllNodesWithTag(t,["ul","ol"]);this._forEachNode(o,m=>s+=this._getInnerText(m).length),l=s/this._getInnerText(t).length>.9}if(r==="table"&&i(t)||this._hasAncestorTag(t,"table",-1,i)||this._hasAncestorTag(t,"code")||[...t.getElementsByTagName("table")].some(m=>m._readabilityDataTable))return!1;var h=this._getClassWeight(t);this.log("Cleaning Conditionally",t);var d=0;if(h+d<0)return!0;if(this._getCharCount(t,",")<10){for(var u=t.getElementsByTagName("p").length,f=t.getElementsByTagName("img").length,g=t.getElementsByTagName("li").length-100,b=t.getElementsByTagName("input").length,_=this._getTextDensity(t,["h1","h2","h3","h4","h5","h6"]),v=0,A=this._getAllNodesWithTag(t,["object","embed","iframe"]),N=0;N<A.length;N++){for(var x=0;x<A[N].attributes.length;x++)if(this._allowedVideoRegex.test(A[N].attributes[x].value))return!1;if(A[N].tagName==="object"&&this._allowedVideoRegex.test(A[N].innerHTML))return!1;v++}var R=this._getInnerText(t);if(this.REGEXPS.adWords.test(R)||this.REGEXPS.loadingWords.test(R))return!0;var O=R.length,S=this._getLinkDensity(t),H=["SPAN","LI","TD"].concat(Array.from(this.DIV_TO_P_ELEMS)),I=this._getTextDensity(t,H),G=this._hasAncestorTag(t,"figure"),p=(()=>{const E=[];return!G&&f>1&&u/f<.5&&E.push(`Bad p to img ratio (img=${f}, p=${u})`),!l&&g>u&&E.push(`Too many li's outside of a list. (li=${g} > p=${u})`),b>Math.floor(u/3)&&E.push(`Too many inputs per p. (input=${b}, p=${u})`),!l&&!G&&_<.9&&O<25&&(f===0||f>2)&&S>0&&E.push(`Suspiciously short. (headingDensity=${_}, img=${f}, linkDensity=${S})`),!l&&h<25&&S>.2+this._linkDensityModifier&&E.push(`Low weight and a little linky. (linkDensity=${S})`),h>=25&&S>.5+this._linkDensityModifier&&E.push(`High weight and mostly links. (linkDensity=${S})`),(v===1&&O<75||v>1)&&E.push(`Suspicious embed. (embedCount=${v}, contentLength=${O})`),f===0&&I===0&&E.push(`No useful content. (img=${f}, textDensity=${I})`),E.length?(this.log("Checks failed",E),!0):!1})();if(l&&p){for(var B=0;B<t.children.length;B++)if(t.children[B].children.length>1)return p;let E=t.getElementsByTagName("li").length;if(f==E)return!1}return p}return!1})},_cleanMatchedNodes(e,r){for(var t=this._getNextNode(e,!0),i=this._getNextNode(e);i&&i!=t;)r.call(this,i,i.className+" "+i.id)?i=this._removeAndGetNext(i):i=this._getNextNode(i)},_cleanHeaders(e){let r=this._getAllNodesWithTag(e,["h1","h2"]);this._removeNodes(r,function(t){let i=this._getClassWeight(t)<0;return i&&this.log("Removing header with low class weight:",t),i})},_headerDuplicatesTitle(e){if(e.tagName!="H1"&&e.tagName!="H2")return!1;var r=this._getInnerText(e,!1);return this.log("Evaluating similarity of header:",r,this._articleTitle),this._textSimilarity(this._articleTitle,r)>.75},_flagIsActive(e){return(this._flags&e)>0},_removeFlag(e){this._flags=this._flags&~e},_isProbablyVisible(e){return(!e.style||e.style.display!="none")&&(!e.style||e.style.visibility!="hidden")&&!e.hasAttribute("hidden")&&(!e.hasAttribute("aria-hidden")||e.getAttribute("aria-hidden")!="true"||e.className&&e.className.includes&&e.className.includes("fallback-image"))},parse(){if(this._maxElemsToParse>0){var e=this._doc.getElementsByTagName("*").length;if(e>this._maxElemsToParse)throw new Error("Aborting parsing document; "+e+" elements found")}this._unwrapNoscriptImages(this._doc);var r=this._disableJSONLD?{}:this._getJSONLD(this._doc);this._removeScripts(this._doc),this._prepDocument();var t=this._getArticleMetadata(r);this._metadata=t,this._articleTitle=t.title;var i=this._grabArticle();if(!i)return null;if(this.log("Grabbed: "+i.innerHTML),this._postProcessContent(i),!t.excerpt){var l=i.getElementsByTagName("p");l.length&&(t.excerpt=l[0].textContent.trim())}var s=i.textContent;return{title:this._articleTitle,byline:t.byline||this._articleByline,dir:this._articleDir,lang:this._articleLang,content:this._serializer(i),textContent:s,length:s.length,excerpt:t.excerpt,siteName:t.siteName||this._articleSiteName,publishedTime:t.publishedTime}}},n.exports=a})($e);var $t=$e.exports,qt={exports:{}};(function(n){var a={unlikelyCandidates:/-ad-|ai2html|banner|breadcrumbs|combx|comment|community|cover-wrap|disqus|extra|footer|gdpr|header|legends|menu|related|remark|replies|rss|shoutbox|sidebar|skyscraper|social|sponsor|supplemental|ad-break|agegate|pagination|pager|popup|yom-remote/i,okMaybeItsACandidate:/and|article|body|column|content|main|shadow/i};function e(t){return(!t.style||t.style.display!="none")&&!t.hasAttribute("hidden")&&(!t.hasAttribute("aria-hidden")||t.getAttribute("aria-hidden")!="true"||t.className&&t.className.includes&&t.className.includes("fallback-image"))}function r(t,i={}){typeof i=="function"&&(i={visibilityChecker:i});var l={minScore:20,minContentLength:140,visibilityChecker:e};i=Object.assign(l,i);var s=t.querySelectorAll("p, pre, article"),o=t.querySelectorAll("div > br");if(o.length){var h=new Set(s);[].forEach.call(o,function(u){h.add(u.parentNode)}),s=Array.from(h)}var d=0;return[].some.call(s,function(u){if(!i.visibilityChecker(u))return!1;var f=u.className+" "+u.id;if(a.unlikelyCandidates.test(f)&&!a.okMaybeItsACandidate.test(f)||u.matches("li p"))return!1;var g=u.textContent.trim().length;return g<i.minContentLength?!1:(d+=Math.sqrt(g-i.minContentLength),d>i.minScore)})}n.exports=r})(qt);var Wt=$t,Ft={Readability:Wt};const qe=12e3,zt=2,Vt=["script","style","noscript","iframe","svg","nav","aside","footer","header",'[role="navigation"]','[role="banner"]','[role="complementary"]','[role="contentinfo"]','[aria-hidden="true"]'];function We(n,a){var t;const e=new Set,r=[];for(const i of n){if(i.closest(Vt.join(","))||(t=i.parentElement)!=null&&t.closest("p, li, blockquote, pre")||/^H[1-6]$/.test(i.tagName))continue;const l=(i.innerText||i.textContent||"").replace(/\s+/g," ").trim();if(!(!l||l.length<zt||e.has(l))&&(e.add(l),r.push({id:`p${r.length+1}`,text:l}),r.length>=a))break}return r}function Xt(n,a){const e=new DOMParser().parseFromString(n,"text/html");return We(e.querySelectorAll("p, li, blockquote, pre"),a)}function jt(n,a){var e;return We(((e=n.body)==null?void 0:e.querySelectorAll("p, li, blockquote"))||[],a)}function Yt(n=document,a={}){const e=a.maxParagraphs||200,r=a.maxChars||qe;let t=[];try{const o=new Ft.Readability(n.cloneNode(!0),{charThreshold:25,keepClasses:!1}).parse();t=o!=null&&o.content?Xt(o.content,e):[]}catch{t=[]}t.length===0&&(t=jt(n,e));const i=[];let l=0;for(const o of t){if(l>0&&l+o.text.length>r)break;i.push(o),l+=o.text.length}const s=t.reduce((o,h)=>o+h.text.length,0);return{paragraphs:i,truncated:s>r||t.length>=e}}const ee="__ai_translate_panel_host__",de="__ai_translate_read_aloud_host__",z="__ai_translate_popper_host__",Kt=5,Jt=5,M={interactionMode:"selection",voiceChinese:"",voiceEnglish:""};async function Fe(){var n;try{const a=await chrome.storage.local.get("settings"),e=(n=a==null?void 0:a.settings)==null?void 0:n.translate;e&&(M.interactionMode=e.interactionMode||"selection",M.voiceChinese=e.voiceChinese||"",M.voiceEnglish=e.voiceEnglish||"")}catch{}}let K=[],q="";function fe(){"speechSynthesis"in window&&(K=window.speechSynthesis.getVoices())}function Qt(n){const e=n.startsWith("zh")?M.voiceChinese:M.voiceEnglish;if(e){const i=K.find(l=>l.voiceURI===e);if(i)return i}let r=K.find(i=>i.lang===n);if(r)return r;const t=n.split("-")[0];return r=K.find(i=>i.lang.startsWith(t)),r||null}function Zt(n,a,e,r){if(!("speechSynthesis"in window)){r();return}fe();const t=window.speechSynthesis;t.cancel();const i=new SpeechSynthesisUtterance(n),l=/[\u4e00-\u9fa5]/.test(n);i.lang=l?"zh-CN":"en-US";const s=Qt(i.lang);s&&(i.voice=s),i.rate=a,i.pitch=1,i.volume=1,i.onstart=()=>{q=e,r()},i.onend=()=>{q="",r()},i.onerror=o=>{q="";const h=(o==null?void 0:o.error)||"未知错误";h==="not-allowed"||h==="service-not-allowed"||(h==="no-speech"||h==="synthesis-failed")&&`${i.lang}${h}`,r()},setTimeout(()=>t.speak(i),50)}function J(){"speechSynthesis"in window&&window.speechSynthesis.cancel(),q=""}async function er(n,a){let e;try{e=await chrome.runtime.sendMessage({type:"DO_TRANSLATE",text:n,direction:a||"auto"})}catch(r){const t=(r==null?void 0:r.message)||String(r);throw t.includes("Extension context invalidated")?new Error("插件已更新，请刷新页面后重试"):new Error(`通信失败：${t}`)}if(!e)throw new Error("后台未响应翻译请求");if(e.error)throw new Error(e.error);return e.result}async function tr(n,a,e){return Ce({items:n,concurrency:Kt,worker:async t=>{const i=await er(t.text,a);return e(t,i),i}}).promise}function rr(){var n;(n=document.getElementById(ee))==null||n.remove()}function ge(n){rr(),J();const a=document.createElement("div");a.id=ee,a.style.cssText="position:fixed; z-index:2147483647; max-width:440px;",n==="corner"?(a.style.top="20px",a.style.right="20px"):ar(a);const e=a.attachShadow({mode:"open"});return e.innerHTML=dr,document.body.appendChild(a),ir(e),e.querySelector(".close-btn").addEventListener("click",()=>{J(),a.remove()}),e}function ir(n){n.querySelectorAll(".panel-tab").forEach(a=>{a.addEventListener("click",()=>nr(n,a.dataset.tab))}),n.querySelector(".manual-translate-btn").addEventListener("click",()=>{const a=n.querySelector(".manual-input").value.trim();a&&Q(n,me(a),{paneSelector:".manual-result",paged:!1})})}function nr(n,a){n.querySelectorAll(".panel-tab").forEach(e=>{e.classList.toggle("active",e.dataset.tab===a)}),n.querySelector(".page-pane").hidden=a!=="page",n.querySelector(".manual-pane").hidden=a!=="manual"}function ar(n){let a=80,e=80;const r=window.getSelection();if(r&&r.rangeCount>0){const l=r.getRangeAt(0).getBoundingClientRect();(l.width>0||l.height>0)&&(a=l.bottom+10,e=l.left)}const t=420,i=320;e+t>window.innerWidth-20&&(e=window.innerWidth-t-20),e<10&&(e=10),a+i>window.innerHeight-20&&(a=Math.max(10,(window.innerHeight-i)/2)),n.style.top=a+"px",n.style.left=e+"px"}function sr(n,a,e=".page-pane"){const r=n.querySelector(e);r.innerHTML=`
    <div class="paragraph-list"></div>
    <div class="translation-status" data-total="${a.length}">翻译中... 0/${a.length}</div>
  `;const t=r.querySelector(".paragraph-list");for(const i of a){const l=document.createElement("div");l.className="paragraph-item",l.hidden=!0,l.dataset.itemId=i.id,l.innerHTML=`
      <div class="section-row"><span class="section-label">原文</span></div>
      <div class="paragraph-original"></div>
      <div class="section-row"><span class="section-label">译文</span></div>
      <div class="paragraph-result"></div>
    `,l.querySelector(".paragraph-original").textContent=i.text,t.appendChild(l)}}function or(n,a,e,r=".page-pane"){const t=n.querySelector(r),i=t.querySelector(`.paragraph-item[data-item-id="${CSS.escape(a.id)}"]`);if(!i||i.dataset.done==="1")return;if(i.dataset.done="1",i.hidden=!1,i.querySelector(".paragraph-result").textContent=e.translation,e.notes){const o=document.createElement("div");o.className="paragraph-notes",o.textContent=e.notes,i.appendChild(o)}const l=t.querySelector(".translation-status"),s=t.querySelectorAll('.paragraph-item[data-done="1"]').length;if(l){const o=Number(l.dataset.batchTotal||l.dataset.total),h=Number(l.dataset.completedBefore||0);l.textContent=s>=o?`已完成 ${s}/${l.dataset.total}`:`翻译中... ${s-h}/${o}`}t.scrollTop=t.scrollHeight}function Q(n,a,e={}){const r=e.paneSelector||".page-pane",t=e.paged!==!1,i=[];a.forEach((d,u)=>{const f=tt(d.text);f.forEach((g,b)=>{i.push({id:f.length>1?`p${u+1}-${b+1}`:d.id,text:g})})}),sr(n,i,r);const l=n.querySelector(r),s=l.querySelector(".translation-status");let o=0;const h=async()=>{var g;const d=i.slice(o,t?o+Jt:i.length),u=l.querySelectorAll('.paragraph-item[data-done="1"]').length;s.dataset.batchTotal=String(d.length),s.dataset.completedBefore=String(u),s.textContent=`翻译中... 0/${d.length}`,(g=l.querySelector(".continue-btn"))==null||g.remove();const{failed:f}=await tr(d,"auto",(b,_)=>{or(n,b,_,r)});if(o+=d.length,f.length>0){const b=f.map(({error:_})=>(_==null?void 0:_.message)||String(_)).join(`
`);Le(n,r,new Error(`${f.length} 个段落翻译失败：
${b}`))}t&&o<i.length?lr(n,i.length-o,h):s.textContent=`已完成 ${u+d.length}/${i.length}`};if(h().catch(d=>Le(n,r,d)),e.truncated&&r===".page-pane"){const d=document.createElement("div");d.className="truncated-hint",d.textContent="页面内容较长，仅翻译正文前 12000 字",l.prepend(d)}}function lr(n,a,e){var i;const r=n.querySelector(".page-pane");(i=r.querySelector(".continue-btn"))==null||i.remove();const t=document.createElement("button");t.className="continue-btn",t.textContent=`继续翻译（剩余 ${a} 段）`,t.addEventListener("click",()=>{t.disabled=!0,e()}),r.appendChild(t)}function Le(n,a,e){n.querySelector(a).insertAdjacentHTML("beforeend",`<div class="error">${ze(e.message)}</div>`)}function me(n){return rt(n).map((a,e)=>({id:`p${e+1}`,text:a}))}function ze(n){const a=document.createElement("div");return a.textContent=String(n),a.innerHTML}function Ve(n){var r;(r=document.getElementById(de))==null||r.remove(),J();const a=document.createElement("div");a.id=de,a.style.cssText="position:fixed; top:20px; right:20px; z-index:2147483647;";const e=a.attachShadow({mode:"open"});e.innerHTML=`
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
  `,document.body.appendChild(a),e.querySelector(".stop-btn").addEventListener("click",()=>{J(),a.remove()}),Zt(n,1,"read-aloud",()=>{q||a.remove()})}function cr(n){var l;const a="__ai_translate_vocabulary_toast__";(l=document.getElementById(a))==null||l.remove();const e=document.createElement("div");e.id=a,e.style.cssText="position:fixed; top:20px; right:20px; z-index:2147483647;";const r=e.attachShadow({mode:"open"}),t=n.entry,i=t?`已保存生词：${t.word}
${t.meaning}`:n.error||"生词保存失败";r.innerHTML=`
    <style>
      .toast {
        background: ${t?"#4caf50":"#e53935"};
        color: #fff;
        padding: 10px 14px;
        border-radius: 10px;
        box-shadow: 0 4px 16px rgba(0,0,0,.18);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 13px;
        line-height: 1.4;
        max-width: 320px;
        white-space: pre-wrap;
        word-break: break-word;
      }
    </style>
    <div class="toast">${ze(i)}</div>
  `,document.body.appendChild(e),setTimeout(()=>e.remove(),t?3200:5200)}function W(){var n;(n=document.getElementById(z))==null||n.remove()}function hr(){const n=window.getSelection();if(!n||n.rangeCount===0)return!1;const a=n.anchorNode;if(!a)return!1;const e=a.nodeType===1?a:a.parentElement;return e?!!e.closest(`#${ee}, #${de}, #${z}`):!1}function ur(n,a){W();const e=document.createElement("div");e.id=z,e.style.cssText="position:fixed; z-index:2147483647;";const r=e.attachShadow({mode:"open"});r.innerHTML=`
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
  `,document.body.appendChild(e),r.querySelector(".popper");const t=36,i=120;let l=n.top-t-6;l<8&&(l=n.bottom+6);let s=n.left;s+i>window.innerWidth-12&&(s=window.innerWidth-i-12),s<8&&(s=8),e.style.top=l+"px",e.style.left=s+"px",r.querySelector('[data-action="translate"]').addEventListener("click",()=>{W();const o=ge("selection");Q(o,me(a),{paged:!1})}),r.querySelector('[data-action="read"]').addEventListener("click",()=>{W(),Ve(a)})}document.addEventListener("mouseup",n=>{if(M.interactionMode!=="selection")return;const a=document.getElementById(z);if(a&&a.contains(n.target))return;const e=document.getElementById(ee);if(e&&e.contains(n.target))return;const r=window.getSelection(),t=r==null?void 0:r.toString().trim();if(!t){W();return}if(hr()||r.rangeCount===0)return;const i=r.getRangeAt(0).getBoundingClientRect();i.width===0&&i.height===0||ur(i,t)});document.addEventListener("mousedown",n=>{const a=document.getElementById(z);a&&!a.contains(n.target)&&W()},!0);chrome.runtime.onMessage.addListener(n=>{if(n.type==="vocabulary-feedback"){cr(n);return}if(n.type==="translate-selection"){const a=(n.selectionText||"").trim();if(!a)return;const e=ge("selection");Q(e,me(a),{paged:!1});return}if(n.type==="translate-page"){const{paragraphs:a,truncated:e}=Yt(document,{maxChars:qe});if(a.length===0)return;const r=ge("corner");Q(r,a,{truncated:e});return}if(n.type==="translate-page-inline"){const a=n.direction||"auto";Ut(),Ke(a);return}if(n.type==="immersive-translate"){const a=n.direction||"auto";Je(),Gt(a);return}if(n.type==="read-aloud"){const a=(n.selectionText||"").trim();if(!a)return;Ve(a);return}});"speechSynthesis"in window&&(fe(),window.speechSynthesis.onvoiceschanged=fe);Fe();chrome.storage.onChanged.addListener(n=>{var a,e;(e=(a=n.settings)==null?void 0:a.newValue)!=null&&e.translate&&Fe()});const dr=`
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
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 10px;
    align-items: center;
    padding: 10px 16px;
    border-bottom: 1px solid #eee;
  }
  .title { font-size: 15px; font-weight: 600; }
  .panel-tabs { display: flex; justify-content: center; gap: 6px; }
  .panel-tab {
    padding: 4px 10px;
    border: 1px solid #ddd;
    border-radius: 999px;
    background: #fff;
    color: #666;
    cursor: pointer;
    font-size: 12px;
  }
  .panel-tab.active { background: #4a90d9; border-color: #4a90d9; color: #fff; }
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
  .tab-pane { min-height: 40px; }
  .manual-pane { display: flex; flex-direction: column; gap: 10px; }
  .tab-pane[hidden] { display: none; }
  .manual-input {
    width: 100%;
    min-height: 88px;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font: inherit;
    color: #333;
    box-sizing: border-box;
    resize: vertical;
  }
  .manual-translate-btn {
    align-self: flex-end;
    background: #4a90d9;
    border: none;
    color: #fff;
    padding: 6px 16px;
    border-radius: 6px;
    cursor: pointer;
  }
  .translation-status { color: #888; font-size: 12px; padding: 8px 0; text-align: center; }
  .continue-btn {
    display: block;
    width: 100%;
    margin-top: 10px;
    padding: 8px 12px;
    border: 1px solid #4a90d9;
    border-radius: 8px;
    background: #fff;
    color: #4a90d9;
    cursor: pointer;
    font-size: 13px;
  }
  .continue-btn:disabled { opacity: .6; cursor: not-allowed; }
  .loading { color: #888; padding: 20px 0; text-align: center; }
  .original-section {
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;
  }
  .paragraph-item {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;
  }
  .paragraph-item:last-child { border-bottom: 0; }
  .paragraph-original {
    font-size: 14px;
    line-height: 1.6;
    color: #555;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .paragraph-result {
    font-size: 14px;
    line-height: 1.6;
    color: #333;
    margin-top: 6px;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .paragraph-notes {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.5;
    color: #666;
    background: #f9f9f9;
    padding: 6px 8px;
    border-radius: 6px;
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
    <div class="panel-tabs">
      <button class="panel-tab active" data-tab="page">整页</button>
      <button class="panel-tab" data-tab="manual">手动</button>
    </div>
    <button class="close-btn">×</button>
  </div>
  <div class="body">
    <div class="tab-pane page-pane"></div>
    <div class="tab-pane manual-pane" hidden>
      <textarea class="manual-input" placeholder="输入要翻译的内容..."></textarea>
      <button class="manual-translate-btn">翻译</button>
      <div class="manual-result"></div>
    </div>
  </div>
</div>
`;
