export function buildSystemPrompt(direction = 'auto') {
  let task
  if (direction === 'zh-en') {
    task = '中文翻译成英文'
  } else if (direction === 'en-zh') {
    task = '英文翻译成中文'
  } else {
    task = '中文和英文互译（自动检测源语言）'
  }
  return [
    `你是专业翻译。任务：${task}。`,
    '- 自动检测源语言，如果已经是目标语言就原样返回',
    '- 数学公式、函数名、数学符号保持原样不翻译（如 softmax, Attention(Q,K,V), sqrt, 𝐳=(z₁,…,zₙ), ReLU, LaTeX 命令, ∑, ∫, √ 等）',
    '- 只输出 JSON，不要用 markdown 代码块包裹，不要输出任何多余文字',
    '- 输出格式：{"translation": "译文", "notes": "1-2 句关键点（词性/语境/用法/或为什么这么译）"}'
  ].join('\n')
}

export function buildUserPrompt(text) {
  return text
}
