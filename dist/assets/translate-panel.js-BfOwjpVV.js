(function(){const y="__ai_translate_panel_host__",m="__ai_translate_read_aloud_host__",g="__ai_translate_popper_host__";const u={interactionMode:"selection",voiceChinese:"",voiceEnglish:""};async function L(){var t;try{const e=await chrome.storage.local.get("settings"),n=(t=e==null?void 0:e.settings)==null?void 0:t.translate;n&&(u.interactionMode=n.interactionMode||"selection",u.voiceChinese=n.voiceChinese||"",u.voiceEnglish=n.voiceEnglish||"")}catch{}}let x=[],p="",l="";function w(){"speechSynthesis"in window&&(x=window.speechSynthesis.getVoices())}function H(t){const n=t.startsWith("zh")?u.voiceChinese:u.voiceEnglish;if(n){const i=x.find(r=>r.voiceURI===n);if(i)return i}let o=x.find(i=>i.lang===t);if(o)return o;const s=t.split("-")[0];return o=x.find(i=>i.lang.startsWith(s)),o||null}function I(t,e,n,o){if(!("speechSynthesis"in window)){l="当前浏览器不支持语音合成",o();return}w();const s=window.speechSynthesis;s.cancel();const i=new SpeechSynthesisUtterance(t),r=/[\u4e00-\u9fa5]/.test(t);i.lang=r?"zh-CN":"en-US";const a=H(i.lang);a&&(i.voice=a),i.rate=e,i.pitch=1,i.volume=1,i.onstart=()=>{p=n,l="",o()},i.onend=()=>{p="",o()},i.onerror=d=>{p="";const c=(d==null?void 0:d.error)||"未知错误";c==="not-allowed"||c==="service-not-allowed"?l="浏览器拒绝了语音播放，请检查系统音频/语音权限":c==="no-speech"||c==="synthesis-failed"?l=`朗读失败：系统可能未安装 ${i.lang} 语音包（错误：${c}）`:l=`朗读失败：${c}`,o()},setTimeout(()=>s.speak(i),50)}function h(){"speechSynthesis"in window&&window.speechSynthesis.cancel(),p=""}async function b(t,e){let n;try{n=await chrome.runtime.sendMessage({type:"DO_TRANSLATE",text:t,direction:e||"auto"})}catch(o){const s=(o==null?void 0:o.message)||String(o);throw s.includes("Extension context invalidated")?new Error("插件已更新，请刷新页面后重试"):new Error(`通信失败：${s}`)}if(!n)throw new Error("后台未响应翻译请求");if(n.error)throw new Error(n.error);return n.result}function C(){var t;(t=document.getElementById(y))==null||t.remove()}function v(t){C(),h(),l="";const e=document.createElement("div");e.id=y,e.style.cssText="position:fixed; z-index:2147483647; max-width:440px;",t==="corner"?(e.style.top="20px",e.style.right="20px"):z(e);const n=e.attachShadow({mode:"open"});return n.innerHTML=B,document.body.appendChild(e),n.querySelector(".close-btn").addEventListener("click",()=>{h(),e.remove()}),n}function z(t){let e=80,n=80;const o=window.getSelection();if(o&&o.rangeCount>0){const r=o.getRangeAt(0).getBoundingClientRect();(r.width>0||r.height>0)&&(e=r.bottom+10,n=r.left)}const s=420,i=320;n+s>window.innerWidth-20&&(n=window.innerWidth-s-20),n<10&&(n=10),e+i>window.innerHeight-20&&(e=Math.max(10,(window.innerHeight-i)/2)),t.style.top=e+"px",t.style.left=n+"px"}function k(t){t.querySelector(".body").innerHTML='<div class="loading">翻译中...</div>'}function S(t,e,n){const o=t.querySelector(".body"),s=n?'<div class="truncated-hint">页面内容较长，仅翻译前 5000 字</div>':"",i=e.notes?`<div class="result-notes">${_(e.notes)}</div>`:"";o.innerHTML=`
    ${s}
    <div class="result-text">${_(e.translation)}</div>
    ${i}
    <div class="speak-row">
      <button class="speak-btn" data-key="result-normal" data-rate="1">朗读</button>
      <button class="speak-btn" data-key="result-slow" data-rate="0.6">慢速</button>
    </div>
    <div class="speak-hint"></div>
  `;const r=e.translation;t.querySelectorAll(".speak-btn").forEach(a=>{a.addEventListener("click",()=>{const d=a.dataset.key,c=parseFloat(a.dataset.rate);p===d?(h(),T(t)):I(r,c,d,()=>T(t))})})}function E(t,e){t.querySelector(".body").innerHTML=`<div class="error">${_(e)}</div>`}function T(t){t.querySelectorAll(".speak-btn").forEach(n=>{const o=n.dataset.key;p===o?(n.classList.add("speaking"),n.textContent="停止"):(n.classList.remove("speaking"),n.textContent=n.dataset.key==="result-slow"?"慢速":"朗读")});const e=t.querySelector(".speak-hint");e&&(e.textContent=l)}function _(t){const e=document.createElement("div");return e.textContent=String(t),e.innerHTML}function M(t){var o;(o=document.getElementById(m))==null||o.remove(),h();const e=document.createElement("div");e.id=m,e.style.cssText="position:fixed; top:20px; right:20px; z-index:2147483647;";const n=e.attachShadow({mode:"open"});n.innerHTML=`
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
  `,document.body.appendChild(e),n.querySelector(".stop-btn").addEventListener("click",()=>{h(),e.remove()}),I(t,1,"read-aloud",()=>{p||e.remove()})}function f(){var t;(t=document.getElementById(g))==null||t.remove()}function A(){const t=window.getSelection();if(!t||t.rangeCount===0)return!1;const e=t.anchorNode;if(!e)return!1;const n=e.nodeType===1?e:e.parentElement;return n?!!n.closest(`#${y}, #${m}, #${g}`):!1}function R(t,e){f();const n=document.createElement("div");n.id=g,n.style.cssText="position:fixed; z-index:2147483647;";const o=n.attachShadow({mode:"open"});o.innerHTML=`
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
  `,document.body.appendChild(n),o.querySelector(".popper");const s=36,i=120;let r=t.top-s-6;r<8&&(r=t.bottom+6);let a=t.left;a+i>window.innerWidth-12&&(a=window.innerWidth-i-12),a<8&&(a=8),n.style.top=r+"px",n.style.left=a+"px",o.querySelector('[data-action="translate"]').addEventListener("click",()=>{f();const d=v("selection");k(d),b(e,"auto").then(c=>S(d,c,!1)).catch(c=>E(d,c.message))}),o.querySelector('[data-action="read"]').addEventListener("click",()=>{f(),M(e)})}document.addEventListener("mouseup",t=>{if(u.interactionMode!=="selection")return;const e=document.getElementById(g);if(e&&e.contains(t.target))return;const n=document.getElementById(y);if(n&&n.contains(t.target))return;const o=window.getSelection(),s=o==null?void 0:o.toString().trim();if(!s){f();return}if(A()||o.rangeCount===0)return;const i=o.getRangeAt(0).getBoundingClientRect();i.width===0&&i.height===0||R(i,s)});document.addEventListener("mousedown",t=>{const e=document.getElementById(g);e&&!e.contains(t.target)&&f()},!0);function P(){const t=(document.body.innerText||"").trim();return{text:t.slice(0,5e3),truncated:t.length>5e3}}chrome.runtime.onMessage.addListener(t=>{if(t.type==="translate-selection"){const e=(t.selectionText||"").trim();if(!e)return;const n=v("selection");k(n),b(e,"auto").then(o=>S(n,o,!1)).catch(o=>E(n,o.message));return}if(t.type==="translate-page"){const{text:e,truncated:n}=P();if(!e)return;const o=v("corner");k(o),b(e,"auto").then(s=>S(o,s,n)).catch(s=>E(o,s.message));return}if(t.type==="read-aloud"){const e=(t.selectionText||"").trim();if(!e)return;M(e);return}});"speechSynthesis"in window&&(w(),window.speechSynthesis.onvoiceschanged=w);L();chrome.storage.onChanged.addListener(t=>{var e,n;(n=(e=t.settings)==null?void 0:e.newValue)!=null&&n.translate&&L()});const B=`
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
})()
