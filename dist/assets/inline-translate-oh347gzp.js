function R({items:t,worker:n,concurrency:o=3,shouldCancel:r}){let c=0,a=!1;const l={completed:[],failed:[]},i=async()=>{for(;c<t.length;){if(a)return;if(r&&r()){a=!0;return}const p=c++,m=t[p];try{const b=await n(m,p);if(a)return;l.completed.push({item:m,result:b})}catch(b){if(a)return;l.failed.push({item:m,error:b})}}},s=Math.min(o,t.length),u=Array.from({length:s},i);return{promise:Promise.all(u).then(()=>({...l,cancelled:a})),cancel(){a=!0}}}function I(t){return/[A-Za-z]/.test(t||"")}function N(t){return/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(t||"")}const g="p, h1, h2, h3, h4, h5, h6, li, blockquote, td",q=["#__ai_translate_panel_host__","#__ai_translate_read_aloud_host__","#__ai_translate_popper_host__","#__mt_control_bar_host__","#__immersive_control_bar_host__"],H="math, mjx-container, .katex, .MathJax, .mathjax, .math",O=8;function P(t){const n=t.ownerDocument.defaultView.getComputedStyle(t);return!(n.display==="none"||n.visibility==="hidden"||n.opacity==="0")}function $(t,n){for(const o of n)if(t.closest(o))return!0;return!1}function j(t,n){return n==="en-zh"&&!I(t)||n==="zh-en"&&!N(t)}function v(t,n=100,o={}){const r=o.direction||"auto",c=o.excludedRoots||q,a=t.querySelectorAll(g),l=[];let i=0;for(const s of a){if(l.length>=n)break;if(s.parentElement&&s.parentElement.closest(g)||$(s,c)||s.closest(H)||s.hasAttribute("data-mt-translated")||s.hasAttribute("data-mt-failed")||!P(s))continue;const u=(s.innerText||s.textContent||"").trim();!/^H[1-6]$/.test(s.tagName)&&u.length<O||j(u,r)||(i++,l.push({id:`p${i}`,el:s,text:u,status:"pending"}))}return l}const _="__mt_control_bar_host__",E="mt-translation",A="mt-failed",h="data-mt-translated",y="data-mt-failed",D=["display:block","margin:8px 0 12px 0","padding:8px 12px","background:#f0f7ff","border-left:3px solid #4a90d9","color:#333","font-size:0.95em","line-height:1.6","border-radius:0 4px 4px 0","white-space:pre-wrap","word-break:break-word"].join(";"),M=["display:block","margin:8px 0 12px 0","padding:6px 12px","background:#fff0f0","border-left:3px solid #e53935","color:#c62828","font-size:0.85em","cursor:pointer","border-radius:0 4px 4px 0"].join(";");function L(t,n){if(t.el.hasAttribute(h))return;const o=document.createElement("div");o.className=E,o.setAttribute("data-mt-paragraph-id",t.id),o.style.cssText=D,o.textContent=n.translation,t.el.after(o),t.el.setAttribute(h,"1"),t.status="translated",t.injectedHost=o}function S(t,n,o){if(t.el.hasAttribute(y))return;const r=document.createElement("div");r.className=A,r.style.cssText=M,r.textContent=`翻译失败：${n.message}（点击重试）`,r.addEventListener("click",()=>o(t)),t.el.after(r),t.el.setAttribute(y,"1"),t.status="failed",t.injectedHost=r}function T(t){t.injectedHost&&(t.injectedHost.remove(),t.injectedHost=null),t.el.removeAttribute(h),t.el.removeAttribute(y),t.status="pending"}function z(){document.querySelectorAll(`.${E}, .${A}`).forEach(t=>t.remove()),document.querySelectorAll(`[${h}], [${y}]`).forEach(t=>{t.removeAttribute(h),t.removeAttribute(y)})}const F=`
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
`;function G({onStop:t,onClear:n,onRetry:o,onContinue:r}){var l;(l=document.getElementById(_))==null||l.remove();const c=document.createElement("div");c.id=_,c.style.cssText="position:fixed; top:20px; right:20px; z-index:2147483647;";const a=c.attachShadow({mode:"open"});return a.innerHTML=F,document.body.appendChild(c),a.querySelector(".stop-btn").addEventListener("click",t),a.querySelector(".clear-btn").addEventListener("click",n),a.querySelector(".retry-btn").addEventListener("click",o),a.querySelector(".continue-btn").addEventListener("click",r),{host:c,shadow:a}}function U(t,n){const{active:o,cancelled:r,completedCount:c,failedCount:a,totalCount:l,overLimit:i}=n,s=t.querySelector(".status"),u=t.querySelector(".count"),f=t.querySelector(".hint"),p=t.querySelector(".stop-btn"),m=t.querySelector(".retry-btn"),b=t.querySelector(".continue-btn");o?(s.textContent="译文中…",p.style.display=""):(p.style.display="none",r?s.textContent="已停止":(a>0,s.textContent="完成")),u.textContent=`${c+a}/${l}`,i?f.textContent=`仅翻译前 ${l} 段`:!o&&a>0?f.textContent=`${a} 段失败`:f.textContent="",m.style.display=!o&&a>0?"":"none",b.style.display=!o&&!r&&i?"":"none"}function Y(){var t;(t=document.getElementById(_))==null||t.remove()}function J(t){const n=t.querySelector(".bar");n.classList.remove("flash"),n.offsetWidth,n.classList.add("flash")}const x=100,K=3,e={active:!1,cancelled:!1,pool:null,paragraphs:[],completedCount:0,failedCount:0,totalCount:0,overLimit:!1,direction:"",retryGen:0,controlBar:null};function V(){return e.direction||"auto"}async function w(t){const n=V();let o;try{o=await chrome.runtime.sendMessage({type:"DO_TRANSLATE",text:t,direction:n})}catch(r){const c=(r==null?void 0:r.message)||String(r);throw c.includes("Extension context invalidated")?new Error("插件已更新，请刷新页面后重试"):new Error(`通信失败：${c}`)}if(!o)throw new Error("后台未响应翻译请求");if(o.error)throw new Error(o.error);return o.result}function d(){e.controlBar&&U(e.controlBar.shadow,e)}async function Q(t){if(e.active){e.controlBar&&J(e.controlBar.shadow);return}e.cancelled=!1,e.completedCount=0,e.failedCount=0,e.direction=t||"auto";const n=v(document.body,x,{direction:e.direction});if(e.overLimit=n.length===x,n.length===0){alert("未找到可翻译的段落");return}e.paragraphs=n,e.totalCount=n.length,e.active=!0,e.controlBar=G({onStop:X,onClear:k,onRetry:Z,onContinue:W}),d(),await C(e.paragraphs)}async function C(t){const n=R({items:t,concurrency:K,shouldCancel:()=>e.cancelled,worker:async o=>{if(!e.cancelled){try{const r=await w(o.text);if(e.cancelled)return;L(o,r),e.completedCount++}catch(r){if(e.cancelled)return;S(o,r,B),e.failedCount++}d()}}});e.pool=n,await n.promise,e.active=!1,e.pool=null,d()}function X(){e.cancelled=!0,e.pool&&e.pool.cancel()}async function W(){if(e.active)return;const t=v(document.body,x,{direction:e.direction});if(t.length===0){e.overLimit=!1,d();return}e.overLimit=t.length===x,e.paragraphs=e.paragraphs.concat(t),e.totalCount+=t.length,e.cancelled=!1,e.active=!0,d(),await C(t)}function k(){e.cancelled=!0,e.pool&&e.pool.cancel(),z(),Y(),e.active=!1,e.paragraphs=[],e.completedCount=0,e.failedCount=0,e.totalCount=0,e.overLimit=!1,e.controlBar=null}function tt(){k()}async function B(t){const n=e.retryGen;if(!(e.cancelled||!e.controlBar)){T(t);try{const o=await w(t.text);if(e.cancelled||!e.controlBar||n!==e.retryGen)return;L(t,o),e.failedCount=Math.max(0,e.failedCount-1),e.completedCount++}catch(o){if(e.cancelled||!e.controlBar||n!==e.retryGen)return;S(t,o,B)}d()}}async function Z(){if(e.active)return;const t=e.paragraphs.filter(n=>n.status==="failed");if(t.length!==0){e.retryGen++;for(const n of t)T(n);e.failedCount=0,e.cancelled=!1,e.active=!0,d(),await C(t)}}export{tt as a,T as b,R as c,G as d,Y as e,J as f,L as i,S as m,z as r,Q as s,U as u};
