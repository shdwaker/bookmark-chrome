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
    '- 输出严格 JSON：{"translation": "译文", "notes": "1-2 句关键点（词性/语境/用法/或为什么这么译）"}',
    '- 不要输出 JSON 以外的内容'
  ].join('\n')
}

export function buildUserPrompt(text) {
  return text
}
