function ct(t){return/[A-Za-z]/.test(t||"")}function lt(t){return/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(t||"")}const k=/[\u{1D400}-\u{1D7FF}]/u,F=/[\u{00B2}\u{00B3}\u{00B9}\u{2070}-\u{209F}]/u,H=/[\u{2200}-\u{22FF}]/u,M=/[\u{27C0}-\u{27EF}\u{2980}-\u{29FF}\u{2A00}-\u{2AFF}]/u,N=/\\[a-zA-Z]+/,I=/^(sqrt|exp|log|ln|sin|cos|tan|softmax|relu|sigmoid|tanh|argmax|argmin|norm|det|tr|max|min|sum|avg|abs)$/i,q=/\b(sqrt|exp|log|ln|sin|cos|tan|softmax|relu|sigmoid|tanh|argmax|argmin|norm|det|tr)\s*\(/i;function D(t){if(!t)return!1;const n=t.trim();return n?!!(k.test(n)||H.test(n)||M.test(n)||F.test(n)&&/[=+\-*/()]/.test(n)||N.test(n)||q.test(n)||n.length<=20&&I.test(n)||n.length<50&&/^[a-zA-Z]\w*\([^)]*\)$/.test(n)):!1}function O(t){if(!t||t.length===0)return 0;let n=0;for(const r of t){const o=r.codePointAt(0);(o>=119808&&o<=120831||o===178||o===179||o===185||o>=8304&&o<=8351||o>=8704&&o<=8959||o>=10176&&o<=10223||o>=10624&&o<=10751||o>=10752&&o<=11007)&&n++}return n/t.length}function P({items:t,worker:n,concurrency:r=3,shouldCancel:o}){let i=0,a=!1;const c={completed:[],failed:[]},u=async()=>{for(;i<t.length;){if(a)return;if(o&&o()){a=!0;return}const m=i++,p=t[m];try{const h=await n(p,m);if(a)return;c.completed.push({item:p,result:h})}catch(h){if(a)return;c.failed.push({item:p,error:h})}}},s=Math.min(r,t.length),l=Array.from({length:s},u);return{promise:Promise.all(l).then(()=>({...c,cancelled:a})),cancel(){a=!0}}}function $(t){return/[A-Za-z]/.test(t||"")}function z(t){return/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(t||"")}const C="p, h1, h2, h3, h4, h5, h6, li, blockquote, td",j=["#__ai_translate_panel_host__","#__ai_translate_read_aloud_host__","#__ai_translate_popper_host__","#__mt_control_bar_host__","#__immersive_control_bar_host__"],G="math, mjx-container, .katex, .MathJax, .mathjax, .math",U=8;function Z(t){const n=t.ownerDocument.defaultView.getComputedStyle(t);return!(n.display==="none"||n.visibility==="hidden"||n.opacity==="0")}function J(t,n){for(const r of n)if(t.closest(r))return!0;return!1}function K(t,n){return n==="en-zh"&&!$(t)||n==="zh-en"&&!z(t)}function A(t,n=100,r={}){const o=r.direction||"auto",i=r.excludedRoots||j,a=t.querySelectorAll(C),c=[];let u=0;for(const s of a){if(c.length>=n)break;if(s.parentElement&&s.parentElement.closest(C)||J(s,i)||s.closest(G)||s.hasAttribute("data-mt-translated")||s.hasAttribute("data-mt-failed")||!Z(s))continue;const l=(s.innerText||s.textContent||"").trim();!/^H[1-6]$/.test(s.tagName)&&l.length<U||K(l,o)||O(l)>.1||D(l)||(u++,c.push({id:`p${u}`,el:s,text:l,status:"pending"}))}return c}const _="__mt_control_bar_host__",E="mt-translation",L="mt-failed",b="data-mt-translated",x="data-mt-failed",X=["display:block","margin:8px 0 12px 0","padding:8px 12px","background:#f0f7ff","border-left:3px solid #4a90d9","color:#333","font-size:0.95em","line-height:1.6","border-radius:0 4px 4px 0","white-space:pre-wrap","word-break:break-word"].join(";"),Y=["display:block","margin:8px 0 12px 0","padding:6px 12px","background:#fff0f0","border-left:3px solid #e53935","color:#c62828","font-size:0.85em","cursor:pointer","border-radius:0 4px 4px 0"].join(";");function v(t,n){if(t.el.hasAttribute(b))return;const r=document.createElement("div");r.className=E,r.setAttribute("data-mt-paragraph-id",t.id),r.style.cssText=X,r.textContent=n.translation,t.el.after(r),t.el.setAttribute(b,"1"),t.status="translated",t.injectedHost=r}function S(t,n,r){if(t.el.hasAttribute(x))return;const o=document.createElement("div");o.className=L,o.style.cssText=Y,o.textContent=`翻译失败：${n.message}（点击重试）`,o.addEventListener("click",()=>r(t)),t.el.after(o),t.el.setAttribute(x,"1"),t.status="failed",t.injectedHost=o}function T(t){t.injectedHost&&(t.injectedHost.remove(),t.injectedHost=null),t.el.removeAttribute(b),t.el.removeAttribute(x),t.status="pending"}function V(){document.querySelectorAll(`.${E}, .${L}`).forEach(t=>t.remove()),document.querySelectorAll(`[${b}], [${x}]`).forEach(t=>{t.removeAttribute(b),t.removeAttribute(x)})}const W=`
<style>
  .bar {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    padding: 8px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    color: #333;
    white-space: nowrap;
  }
  .bar.flash { animation: mt-flash 0.4s ease; }
  @keyframes mt-flash {
    0%, 100% { box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
    50% { box-shadow: 0 4px 24px rgba(74,144,217,0.6); }
  }
  .count { font-weight: 600; color: #4a90d9; }
  .hint { color: #888; font-size: 12px; }
  .spacer { flex: 1; }
  .btn {
    background: transparent;
    border: 1px solid #ddd;
    color: #333;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
  }
  .btn:hover { background: #f0f0f0; }
  .btn-danger { color: #e53935; border-color: #e53935; }
  .btn-danger:hover { background: #ffebee; }
  .btn-primary { color: #4a90d9; border-color: #4a90d9; }
  .btn-primary:hover { background: #f0f7ff; }
</style>
<div class="bar">
  <span class="status">译文中…</span>
  <span class="count">0/0</span>
  <span class="hint"></span>
  <span class="spacer"></span>
  <button class="btn btn-primary retry-btn" style="display:none;">重试失败</button>
  <button class="btn btn-primary continue-btn" style="display:none;">继续翻译</button>
  <button class="btn btn-danger stop-btn" style="display:none;">停止</button>
  <button class="btn clear-btn">清除</button>
</div>
`;function Q({onStop:t,onClear:n,onRetry:r,onContinue:o}){var c;(c=document.getElementById(_))==null||c.remove();const i=document.createElement("div");i.id=_,i.style.cssText="position:fixed; top:20px; right:20px; z-index:2147483647;";const a=i.attachShadow({mode:"open"});return a.innerHTML=W,document.body.appendChild(i),a.querySelector(".stop-btn").addEventListener("click",t),a.querySelector(".clear-btn").addEventListener("click",n),a.querySelector(".retry-btn").addEventListener("click",r),a.querySelector(".continue-btn").addEventListener("click",o),{host:i,shadow:a}}function tt(t,n){const{active:r,cancelled:o,completedCount:i,failedCount:a,totalCount:c,overLimit:u}=n,s=t.querySelector(".status"),l=t.querySelector(".count"),f=t.querySelector(".hint"),m=t.querySelector(".stop-btn"),p=t.querySelector(".retry-btn"),h=t.querySelector(".continue-btn");r?(s.textContent="译文中…",m.style.display=""):(m.style.display="none",o?s.textContent="已停止":(a>0,s.textContent="完成")),l.textContent=`${i+a}/${c}`,u?f.textContent=`仅翻译前 ${c} 段`:!r&&a>0?f.textContent=`${a} 段失败`:f.textContent="",p.style.display=!r&&a>0?"":"none",h.style.display=!r&&!o&&u?"":"none"}function et(){var t;(t=document.getElementById(_))==null||t.remove()}function nt(t){const n=t.querySelector(".bar");n.classList.remove("flash"),n.offsetWidth,n.classList.add("flash")}const y=100,ot=3,e={active:!1,cancelled:!1,pool:null,paragraphs:[],completedCount:0,failedCount:0,totalCount:0,overLimit:!1,direction:"",retryGen:0,controlBar:null};function rt(){return e.direction||"auto"}async function w(t){const n=rt();let r;try{r=await chrome.runtime.sendMessage({type:"DO_TRANSLATE",text:t,direction:n})}catch(o){const i=(o==null?void 0:o.message)||String(o);throw i.includes("Extension context invalidated")?new Error("插件已更新，请刷新页面后重试"):new Error(`通信失败：${i}`)}if(!r)throw new Error("后台未响应翻译请求");if(r.error)throw new Error(r.error);return r.result}function d(){e.controlBar&&tt(e.controlBar.shadow,e)}async function ut(t){if(e.active){e.controlBar&&nt(e.controlBar.shadow);return}e.cancelled=!1,e.completedCount=0,e.failedCount=0,e.direction=t||"auto";const n=A(document.body,y,{direction:e.direction});if(e.overLimit=n.length===y,n.length===0){alert("未找到可翻译的段落");return}e.paragraphs=n,e.totalCount=n.length,e.active=!0,e.controlBar=Q({onStop:at,onClear:B,onRetry:it,onContinue:st}),d(),await g(e.paragraphs)}async function g(t){const n=P({items:t,concurrency:ot,shouldCancel:()=>e.cancelled,worker:async r=>{if(!e.cancelled){try{const o=await w(r.text);if(e.cancelled)return;v(r,o),e.completedCount++}catch(o){if(e.cancelled)return;S(r,o,R),e.failedCount++}d()}}});e.pool=n,await n.promise,e.active=!1,e.pool=null,d()}function at(){e.cancelled=!0,e.pool&&e.pool.cancel()}async function st(){if(e.active)return;const t=A(document.body,y,{direction:e.direction});if(t.length===0){e.overLimit=!1,d();return}e.overLimit=t.length===y,e.paragraphs=e.paragraphs.concat(t),e.totalCount+=t.length,e.cancelled=!1,e.active=!0,d(),await g(t)}function B(){e.cancelled=!0,e.pool&&e.pool.cancel(),V(),et(),e.active=!1,e.paragraphs=[],e.completedCount=0,e.failedCount=0,e.totalCount=0,e.overLimit=!1,e.controlBar=null}function dt(){B()}async function R(t){const n=e.retryGen;if(!(e.cancelled||!e.controlBar)){T(t);try{const r=await w(t.text);if(e.cancelled||!e.controlBar||n!==e.retryGen)return;v(t,r),e.failedCount=Math.max(0,e.failedCount-1),e.completedCount++}catch(r){if(e.cancelled||!e.controlBar||n!==e.retryGen)return;S(t,r,R)}d()}}async function it(){if(e.active)return;const t=e.paragraphs.filter(n=>n.status==="failed");if(t.length!==0){e.retryGen++;for(const n of t)T(n);e.failedCount=0,e.cancelled=!1,e.active=!0,d(),await g(t)}}export{lt as a,dt as b,P as c,T as d,Q as e,nt as f,et as g,ct as h,v as i,D as l,S as m,V as r,ut as s,tt as u};
