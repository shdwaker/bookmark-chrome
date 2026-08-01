function B({items:t,worker:n,concurrency:o=3,shouldCancel:r}){let l=0,a=!1;const c={completed:[],failed:[]},u=async()=>{for(;l<t.length;){if(a)return;if(r&&r()){a=!0;return}const f=l++,p=t[f];try{const h=await n(p,f);if(a)return;c.completed.push({item:p,result:h})}catch(h){if(a)return;c.failed.push({item:p,error:h})}}},s=Math.min(o,t.length),i=Array.from({length:s},u);return{promise:Promise.all(i).then(()=>({...c,cancelled:a})),cancel(){a=!0}}}function R(t){return/[A-Za-z]/.test(t||"")}function I(t){return/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(t||"")}const _="p, h1, h2, h3, h4, h5, h6, li, blockquote, td",N=["#__ai_translate_panel_host__","#__ai_translate_read_aloud_host__","#__ai_translate_popper_host__","#__mt_control_bar_host__"],q=8;function H(t){const n=t.ownerDocument.defaultView.getComputedStyle(t);return!(n.display==="none"||n.visibility==="hidden"||n.opacity==="0")}function O(t,n){for(const o of n)if(t.closest(o))return!0;return!1}function $(t,n){return n==="en-zh"&&!R(t)||n==="zh-en"&&!I(t)}function D(t,n=100,o={}){const r=o.direction||"auto",l=o.excludedRoots||N,a=t.querySelectorAll(_),c=[];let u=0;for(const s of a){if(c.length>=n)break;if(s.parentElement&&s.parentElement.closest(_)||O(s,l)||s.hasAttribute("data-mt-translated")||s.hasAttribute("data-mt-failed")||!H(s))continue;const i=(s.innerText||s.textContent||"").trim();!/^H[1-6]$/.test(s.tagName)&&i.length<q||$(i,r)||(u++,c.push({id:`p${u}`,el:s,text:i,status:"pending"}))}return c}const x="__mt_control_bar_host__",g="mt-translation",A="mt-failed",m="data-mt-translated",b="data-mt-failed",P=["display:block","margin:8px 0 12px 0","padding:8px 12px","background:#f0f7ff","border-left:3px solid #4a90d9","color:#333","font-size:0.95em","line-height:1.6","border-radius:0 4px 4px 0","white-space:pre-wrap","word-break:break-word"].join(";"),j=["display:block","margin:8px 0 12px 0","padding:6px 12px","background:#fff0f0","border-left:3px solid #e53935","color:#c62828","font-size:0.85em","cursor:pointer","border-radius:0 4px 4px 0"].join(";");function v(t,n){if(t.el.hasAttribute(m))return;const o=document.createElement("div");o.className=g,o.setAttribute("data-mt-paragraph-id",t.id),o.style.cssText=P,o.textContent=n.translation,t.el.after(o),t.el.setAttribute(m,"1"),t.status="translated",t.injectedHost=o}function E(t,n,o){if(t.el.hasAttribute(b))return;const r=document.createElement("div");r.className=A,r.style.cssText=j,r.textContent=`翻译失败：${n.message}（点击重试）`,r.addEventListener("click",()=>o(t)),t.el.after(r),t.el.setAttribute(b,"1"),t.status="failed",t.injectedHost=r}function S(t){t.injectedHost&&(t.injectedHost.remove(),t.injectedHost=null),t.el.removeAttribute(m),t.el.removeAttribute(b),t.status="pending"}function z(){document.querySelectorAll(`.${g}, .${A}`).forEach(t=>t.remove()),document.querySelectorAll(`[${m}], [${b}]`).forEach(t=>{t.removeAttribute(m),t.removeAttribute(b)})}const M=`
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
  <button class="btn btn-danger stop-btn" style="display:none;">停止</button>
  <button class="btn clear-btn">清除</button>
</div>
`;function F({onStop:t,onClear:n,onRetry:o}){var a;(a=document.getElementById(x))==null||a.remove();const r=document.createElement("div");r.id=x,r.style.cssText="position:fixed; top:20px; right:20px; z-index:2147483647;";const l=r.attachShadow({mode:"open"});return l.innerHTML=M,document.body.appendChild(r),l.querySelector(".stop-btn").addEventListener("click",t),l.querySelector(".clear-btn").addEventListener("click",n),l.querySelector(".retry-btn").addEventListener("click",o),{host:r,shadow:l}}function G(t,n){const{active:o,cancelled:r,completedCount:l,failedCount:a,totalCount:c,overLimit:u}=n,s=t.querySelector(".status"),i=t.querySelector(".count"),d=t.querySelector(".hint"),f=t.querySelector(".stop-btn"),p=t.querySelector(".retry-btn");o?(s.textContent="译文中…",f.style.display=""):(f.style.display="none",r?s.textContent="已停止":(a>0,s.textContent="完成")),i.textContent=`${l+a}/${c}`,u?d.textContent=`仅翻译前 ${c} 段`:!o&&a>0?d.textContent=`${a} 段失败`:d.textContent="",p.style.display=!o&&a>0?"":"none"}function U(){var t;(t=document.getElementById(x))==null||t.remove()}function Y(t){const n=t.querySelector(".bar");n.classList.remove("flash"),n.offsetWidth,n.classList.add("flash")}const C=100,K=3,e={active:!1,cancelled:!1,pool:null,paragraphs:[],completedCount:0,failedCount:0,totalCount:0,overLimit:!1,direction:"",retryGen:0,controlBar:null};function V(){return e.direction||"auto"}async function L(t){const n=V();let o;try{o=await chrome.runtime.sendMessage({type:"DO_TRANSLATE",text:t,direction:n})}catch(r){const l=(r==null?void 0:r.message)||String(r);throw l.includes("Extension context invalidated")?new Error("插件已更新，请刷新页面后重试"):new Error(`通信失败：${l}`)}if(!o)throw new Error("后台未响应翻译请求");if(o.error)throw new Error(o.error);return o.result}function y(){e.controlBar&&G(e.controlBar.shadow,e)}async function W(t){if(e.active){e.controlBar&&Y(e.controlBar.shadow);return}e.cancelled=!1,e.completedCount=0,e.failedCount=0,e.direction=t||"auto";const n=D(document.body,C,{direction:e.direction});if(e.overLimit=n.length===C,n.length===0){alert("未找到可翻译的段落");return}e.paragraphs=n,e.totalCount=n.length,e.active=!0,e.controlBar=F({onStop:X,onClear:w,onRetry:J}),y(),await T(e.paragraphs)}async function T(t){const n=B({items:t,concurrency:K,shouldCancel:()=>e.cancelled,worker:async o=>{if(!e.cancelled){try{const r=await L(o.text);if(e.cancelled)return;v(o,r),e.completedCount++}catch(r){if(e.cancelled)return;E(o,r,k),e.failedCount++}y()}}});e.pool=n,await n.promise,e.active=!1,e.pool=null,y()}function X(){e.cancelled=!0,e.pool&&e.pool.cancel()}function w(){e.cancelled=!0,e.pool&&e.pool.cancel(),z(),U(),e.active=!1,e.paragraphs=[],e.completedCount=0,e.failedCount=0,e.totalCount=0,e.controlBar=null}function Z(){w()}async function k(t){const n=e.retryGen;if(!(e.cancelled||!e.controlBar)){S(t);try{const o=await L(t.text);if(e.cancelled||!e.controlBar||n!==e.retryGen)return;v(t,o),e.failedCount=Math.max(0,e.failedCount-1),e.completedCount++}catch(o){if(e.cancelled||!e.controlBar||n!==e.retryGen)return;E(t,o,k)}y()}}async function J(){if(e.active)return;const t=e.paragraphs.filter(n=>n.status==="failed");if(t.length!==0){e.retryGen++;for(const n of t)S(n);e.failedCount=0,e.cancelled=!1,e.active=!0,y(),await T(t)}}export{Z as a,S as b,B as c,F as d,U as e,Y as f,v as i,E as m,z as r,W as s,G as u};
