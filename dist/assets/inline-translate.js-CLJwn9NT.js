import{b as h,c as _}from"./inline-D8oo8-WE.js";const b="__mt_control_bar_host__",C="mt-translation",v="mt-failed",i="data-mt-translated",d="data-mt-failed",R=["display:block","margin:8px 0 12px 0","padding:8px 12px","background:#f0f7ff","border-left:3px solid #4a90d9","color:#333","font-size:0.95em","line-height:1.6","border-radius:0 4px 4px 0","white-space:pre-wrap","word-break:break-word"].join(";"),I=["display:block","margin:8px 0 12px 0","padding:6px 12px","background:#fff0f0","border-left:3px solid #e53935","color:#c62828","font-size:0.85em","cursor:pointer","border-radius:0 4px 4px 0"].join(";");function g(e,o){if(e.el.hasAttribute(i))return;const n=document.createElement("div");n.className=C,n.setAttribute("data-mt-paragraph-id",e.id),n.style.cssText=R,n.textContent=o.translation,e.el.after(n),e.el.setAttribute(i,"1"),e.status="translated",e.injectedHost=n}function A(e,o,n){if(e.el.hasAttribute(d))return;const r=document.createElement("div");r.className=v,r.style.cssText=I,r.textContent=`翻译失败：${o.message}（点击重试）`,r.addEventListener("click",()=>n(e)),e.el.after(r),e.el.setAttribute(d,"1"),e.status="failed",e.injectedHost=r}function S(e){e.injectedHost&&(e.injectedHost.remove(),e.injectedHost=null),e.el.removeAttribute(i),e.el.removeAttribute(d),e.status="pending"}function q(){document.querySelectorAll(`.${C}, .${v}`).forEach(e=>e.remove()),document.querySelectorAll(`[${i}], [${d}]`).forEach(e=>{e.removeAttribute(i),e.removeAttribute(d)})}const N=`
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
`;function P({onStop:e,onClear:o,onRetry:n,onContinue:r}){var s;(s=document.getElementById(b))==null||s.remove();const l=document.createElement("div");l.id=b,l.style.cssText="position:fixed; top:20px; right:20px; z-index:2147483647;";const a=l.attachShadow({mode:"open"});return a.innerHTML=N,document.body.appendChild(l),a.querySelector(".stop-btn").addEventListener("click",e),a.querySelector(".clear-btn").addEventListener("click",o),a.querySelector(".retry-btn").addEventListener("click",n),a.querySelector(".continue-btn").addEventListener("click",r),{host:l,shadow:a}}function $(e,o){const{active:n,cancelled:r,completedCount:l,failedCount:a,totalCount:s,overLimit:y}=o,u=e.querySelector(".status"),T=e.querySelector(".count"),p=e.querySelector(".hint"),x=e.querySelector(".stop-btn"),B=e.querySelector(".retry-btn"),k=e.querySelector(".continue-btn");n?(u.textContent="译文中…",x.style.display=""):(x.style.display="none",r?u.textContent="已停止":(a>0,u.textContent="完成")),T.textContent=`${l+a}/${s}`,y?p.textContent=`仅翻译前 ${s} 段`:!n&&a>0?p.textContent=`${a} 段失败`:p.textContent="",B.style.display=!n&&a>0?"":"none",k.style.display=!n&&!r&&y?"":"none"}function j(){var e;(e=document.getElementById(b))==null||e.remove()}function H(e){const o=e.querySelector(".bar");o.classList.remove("flash"),o.offsetWidth,o.classList.add("flash")}const f=100,O=3,t={active:!1,cancelled:!1,pool:null,paragraphs:[],completedCount:0,failedCount:0,totalCount:0,overLimit:!1,direction:"",retryGen:0,controlBar:null};function D(){return t.direction||"auto"}async function L(e){const o=D();let n;try{n=await chrome.runtime.sendMessage({type:"DO_TRANSLATE",text:e,direction:o})}catch(r){const l=(r==null?void 0:r.message)||String(r);throw l.includes("Extension context invalidated")?new Error("插件已更新，请刷新页面后重试"):new Error(`通信失败：${l}`)}if(!n)throw new Error("后台未响应翻译请求");if(n.error)throw new Error(n.error);return n.result}function c(){t.controlBar&&$(t.controlBar.shadow,t)}async function Y(e){if(t.active){t.controlBar&&H(t.controlBar.shadow);return}t.cancelled=!1,t.completedCount=0,t.failedCount=0,t.direction=e||"auto";const o=h(document.body,f,{direction:t.direction});if(t.overLimit=o.length===f,o.length===0){alert("未找到可翻译的段落");return}t.paragraphs=o,t.totalCount=o.length,t.active=!0,t.controlBar=P({onStop:M,onClear:E,onRetry:F,onContinue:z}),c(),await m(t.paragraphs)}async function m(e){const o=_({items:e,concurrency:O,shouldCancel:()=>t.cancelled,worker:async n=>{if(!t.cancelled){try{const r=await L(n.text);if(t.cancelled)return;g(n,r),t.completedCount++}catch(r){if(t.cancelled)return;A(n,r,w),t.failedCount++}c()}}});t.pool=o,await o.promise,t.active=!1,t.pool=null,c()}function M(){t.cancelled=!0,t.pool&&t.pool.cancel()}async function z(){if(t.active)return;const e=h(document.body,f,{direction:t.direction});if(e.length===0){t.overLimit=!1,c();return}t.overLimit=e.length===f,t.paragraphs=t.paragraphs.concat(e),t.totalCount+=e.length,t.cancelled=!1,t.active=!0,c(),await m(e)}function E(){t.cancelled=!0,t.pool&&t.pool.cancel(),q(),j(),t.active=!1,t.paragraphs=[],t.completedCount=0,t.failedCount=0,t.totalCount=0,t.overLimit=!1,t.controlBar=null}function U(){E()}async function w(e){const o=t.retryGen;if(!(t.cancelled||!t.controlBar)){S(e);try{const n=await L(e.text);if(t.cancelled||!t.controlBar||o!==t.retryGen)return;g(e,n),t.failedCount=Math.max(0,t.failedCount-1),t.completedCount++}catch(n){if(t.cancelled||!t.controlBar||o!==t.retryGen)return;A(e,n,w)}c()}}async function F(){if(t.active)return;const e=t.paragraphs.filter(o=>o.status==="failed");if(e.length!==0){t.retryGen++;for(const o of e)S(o);t.failedCount=0,t.cancelled=!1,t.active=!0,c(),await m(e)}}export{U as clearInline,S as clearParagraphMarker,P as createControlBar,H as flashControlBar,g as injectTranslation,A as markFailed,q as removeAllInjected,j as removeControlBar,Y as startInlineTranslation,$ as updateControlBar};
