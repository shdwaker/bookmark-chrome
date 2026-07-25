# 我用 Claude Code 做了个 Chrome 插件，全程没写一行代码

Chrome 的书签管理一直让我头疼。平铺一长条，没标签、没访问记录，找个书签要翻半天。第三方插件要么功能堆砌、要么界面难看，都不太顺手。

前阵子我决定自己做一个。

先说下我的背景：我是后端程序员，前端不擅长，Chrome 插件开发更是从没碰过--Vue、Vite、CRXJS、Manifest V3、IndexedDB，这一整套我一样都没写过。如果按传统方式，我得先学一遍前端工具链再动手，周期长，大概率半途而废。

但我用 Claude Code 配合 GLM 模型，从零做了一个 Chrome 书签管理插件，27 个 commit，功能完整，源码和构建产物都已开源在 GitHub（`github.com/shdwaker/bookmark-chrome`）。整个过程，我一行业务代码都没手写过。

这篇文章记录一下是怎么做到的，也讲讲 AI Coding 把编程门槛降低之后，能做到什么程度。

## 一、产品想解决什么

先说我想做什么。

Chrome 默认书签管理有几个硬伤：只有文件夹层级，没有标签；没有访问记录，点过哪些书签全靠自己记；新标签页是空白的，浪费了浏览器里最高频的入口。

我想做一个插件，把这几件事一起解决：书签同步（读 Chrome 的书签）、文件夹树导航、自定义标签、搜索、访问记录追踪。还有一个我想了很久的功能--"所有标签页总览"：把当前打开的所有标签页列出来，可以批量查看、导出，解决"开了一堆标签找不到"的问题。

最关键的设计是：把这些全塞进新标签页。

因为新标签页是浏览器里点击频率最高的地方，把它替换成书签管理器，等于把"管书签"变成默认动作，不用刻意打开。这个思路决定了整个插件的形态--它不是一个你点开才用的工具，而是每次开新标签页就自动出现在你面前。

## 二、AI Coding 把编程的门槛降低了

我先把视角说清楚，这部分不是技术，是角色。

以前做一个 Chrome 插件，门槛很高。要学 Vue 3 + Composition API、Vite 打包、@crxjs/vite-plugin 的扩展构建、Manifest V3 的权限和 service worker、IndexedDB 的异步存储、Chrome 的 bookmarks/tabs/history API……每个单拎出来都不难，但凑一起就是一整面墙，足以让一个想做事的人放弃。我是后端程序员，前端这套我没碰过，按传统方式得先学一遍再动手，大概率半途而废。

AI Coding 把这道门槛拉低了。它的核心不是"AI 帮你写代码"，而是把"有想法"和"能做出东西"之间的鸿沟填平。门槛降低之后，能做的事变多了：

- 做一个 Chrome 插件解决自己的痛点（就像这个项目）
- 做一个内部用的管理面板，不用麻烦前端同事
- 做一个小工具验证想法，半天就能跑起来
- 把脑子里反复出现的需求落到一个能跑的东西上

这些事以前要么找人写，要么自己啃半天。现在只要你能把需求描述清楚、能审 AI 写出来的代码、知道往哪个方向迭代，AI 就能把中间那层代码补上。

但有一个前提经常被忽略：**门槛降低不等于没门槛**。AI 写代码很快，但它不知道做什么才是对的、不知道哪样写才靠谱。做什么、审不审得过、往哪走，是你的事；怎么实现，是它的事。你得懂什么是状态管理、什么是异步、什么是测试，才能审得了 AI 写的代码--AI 把具体技术栈的门槛填平了，但工程判断力的门槛还在。后端程序员的优势正在这：技术栈不熟，但工程能力还在，刚好够审 AI 的输出。

下面讲我是怎么把这套角色分工落地的，以及用到了哪些工具。

## 三、工具：Claude Code

我用 Claude Code 配合 GLM 模型。Claude Code 是干活的 agent，GLM 是大脑，中间通过一个本地路由把两者解耦--工具不变，模型随时可换。这部分不展开，重点讲讲为什么选 Claude Code。

### Claude Code：目前最强的 AI Coding agent

Claude Code 是 Anthropic 出的 CLI 工具（`github.com/anthropics/claude-code`），本质是一个能动手的 agent。它不是聊天框--它能读写你本地的文件、能跑 shell 命令、能操作 git、能派生子任务。你跟它说"建个文件"、"跑下测试"、"提交一下"，它真的去执行。

我选它而不是别的，是因为它目前是综合最强的 AI Coding agent。具体强在哪：

- **是 agent 不是补全**。GitHub Copilot 是 inline 补全，你写一行它补一行；Claude Code 是 agent，你给一个任务，它自己拆步骤、调工具、多步推理、跑完反馈。这是质变。
- **工具集最完整**。读写文件、跑 shell、grep/glob 搜索、git 操作、派生 subagent、web 搜索、MCP 工具调用，一个 agent 干完整套开发动作，不用中途切换工具。
- **Subagents 机制**。能派生子任务并行处理，主上下文保持干净。复杂任务不会因为上下文太长而跑偏--这是 Cursor、Copilot 都没有的。
- **MCP（Model Context Protocol）**。Anthropic 自己定的协议，可以扩展任意工具（数据库、API、自定义工具），生态最开放。
- **Plugin + Skills 生态**。社区插件（如 superpowers）+ 结构化能力，可以给 agent 装上完整的工作流。
- **Plan mode + Hooks**。先规划再执行、事件驱动自动化（比如 commit 前自动跑测试），工程化程度最高。
- **CLI 形态不绑 IDE**。Cursor 绑在自家 IDE 里相对封闭，Claude Code 是命令行，跟我的终端工作流贴得最近，想用哪个编辑器都行。

简单说：Copilot 帮你写代码，Cursor 帮你改代码，Claude Code 帮你**做**软件。这是它能成为目前最强 AI Coding agent 的根本原因。

## 四、不只是提示词工程：让 AI 按规范走

很多人对 AI Coding 的印象还停留在"提示词工程"--把 prompt 写好，模型吐代码，复制粘贴。

这种做法的问题：结果随机，同一个 prompt 跑两次可能不一样；难复现；没有流程，全凭手感。做玩具可以，做项目不行。

我引入了两个东西来规范流程：superpowers 管"怎么开发"，openspec 管"做什么"。

### superpowers：一套开发方法论

这是 obra 做的开源项目（`github.com/obra/superpowers`），定位是"给 coding agent 的一整套软件开发方法论"。它不是一个工具，是一套 skills 集合，强制 AI 按规范的流程开发：先 brainstorm 对齐需求，再写 plan，再执行，全程 TDD，最后 review + 收尾。

**为什么需要它**：AI 默认会直接跳进写代码，容易跑偏、漏测试、没文档。superpowers 把"想到哪写到哪"变成"按流程走"，每个功能都有 design doc、有 plan、有测试、有 commit。

**安装**（在 Claude Code 里跑两行命令）：

```
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

装完之后，skills 会自动触发。你跟 AI 说"我要做一个 X 功能"，它会主动走流程：先问你需求细节（brainstorming），跟你确认 design，写 design doc 落盘；然后写 implementation plan 把任务拆成 2-5 分钟的小步骤；然后按 plan 一步步执行，每步都有验证、有 commit。

**在 Claude Code 里怎么用**：不用主动调用，装完就生效。你正常提需求，AI 会自动按 superpowers 的流程走。每个功能开发完，仓库里会多出 `docs/superpowers/specs/` 和 `docs/superpowers/plans/` 两个目录，里面是落盘的 design 和 plan，可回溯。

### openspec：规范 AI Coding 的工具

这是 Fission AI 做的开源项目（`github.com/Fission-AI/OpenSpec`），定位是 spec 框架。它解决的问题是：**需求只活在聊天记录里，AI 写出来的东西就不可预测**。openspec 加一层轻量的 spec 层，让 AI 和人在写代码前先对齐"做什么"。

**为什么需要它**：superpowers 管"怎么开发"，openspec 管"做什么"。两者互补--superpowers 是开发流程，openspec 是需求规范。每个变更有自己的文件夹：proposal（为什么做）、specs（需求）、design（技术方案）、tasks（实施清单），全是落盘的 markdown。

**安装**（要求 Node.js 20.19+）：

```bash
npm install -g @fission-ai/openspec@latest
```

然后进项目目录初始化：

```bash
cd your-project
openspec init
```

**在 Claude Code 里怎么用**：openspec 提供 slash commands，你在 Claude Code 里直接打：

- `/opsx:explore` -- 跟 AI 探索需求，让它读你的代码、权衡方案、在写代码前先想清楚
- `/opsx:propose <功能名>` -- 生成一个变更文件夹，包含 proposal、specs、design、tasks 四件套
- `/opsx:apply` -- 按计划实施任务
- `/opsx:archive` -- 实施完归档到 `openspec/changes/archive/`

整个流程是 explore（探索）-> propose（提案）-> apply（实施）-> archive（归档）的循环。每个功能从想法到落地，全程有 spec 文档跟着，可复现、可回溯。

### 一个意外惊喜：mock 可视化

这是 superpowers brainstorming 里的一个功能，叫 Visual Companion。

有一次我在调一个页面的视觉，跟 Claude 描述了我想要的效果。它没有干想，而是直接生成了一个 mock 页面，我能在浏览器里打开看实际渲染效果--所见即所得，不用脑补 CSS 长什么样。

对我这种不熟前端的人来说，这个功能简直是救命。以前调样式是黑盒，我说"再大一点"、"颜色淡一点"，AI 改完我也不知道改成啥样了；现在它直接给我一个 mock 页面，我看着效果提反馈，它再改。讨论 UI 不再是空中对话，而是看着实物聊。

## 五、AI Coding 全过程

工具搭好之后，整个插件 27 个 commit，大概分几个阶段。

**起步：一次性生成完整初始版本。** 我用一段 prompt 描述了产品需求，AI 一次交付了完整可用的初始版本--不是骨架，是真能跑的扩展，有书签同步、文件夹树、标签、搜索、访问追踪，功能齐全。这是 AI Coding 比人快的地方：从 0 到 1 的冷启动，它可以一次性铺满。

**设计驱动做新功能。** 做"所有标签页总览"这个功能时，我没让 AI 直接写代码。先走 superpowers 流程，写 design doc 说清楚要做什么、怎么跟现有架构集成；再写 implementation plan 把任务拆成可执行的小步骤；然后才动手。AI 不会跑偏，每一步都有据可依。

**测试先行。** 有意思的是 commit 顺序。我看 git log 发现，测试是先于实现提交的：先是 `Add all tabs utility tests`，然后是 `Add Vitest dependency`，再是 `Add all tabs grouping utilities`。TDD 在 AI Coding 里反而很自然--因为 AI 写测试和写实现一样快，先写测试能帮它理清要做啥，比直接写实现更稳。

**多轮迭代打磨。** all-tabs 这个功能一开始做成 modal（弹窗），后来改成 inline panel（内嵌面板）；颜色一开始不对，又对齐插件整体视觉风格；响应式有 column 塌陷，修了；stats 和 clear 按钮位置调了几次。这些细节是"品味"层面的，AI 能听懂"颜色和插件视觉风格对齐"这种模糊需求，不用你精确到色值。

**收尾整理。** 最后是项目整理：把 dist 目录加进 git（这样别人 clone 下来不用 build 就能直接加载扩展）、写双语 README（英文默认 + 中文版）、加 .claude/ 到 gitignore。

## 六、真实小插曲

过程中也踩了些坑。

最典型的是 push 到 GitHub。我一开始用 HTTPS，认证失败，提示 `could not read Username`；切到 SSH，发现机器上压根没有 SSH key；最后用 GitHub CLI（gh）接管认证，又因为本地网络连不上 github.com（SSL 握手失败），探了一圈发现得走代理。最后配了全局 `http.proxy` 指向本地 7897 端口，才 push 通。

整个过程是 AI 在排查、在试、在配，我只是看着它踩坑、告诉它下一步可以试啥。它甚至会自己探常见代理端口，找到 7897 能通，自己配好。

测试这块也值得一提。项目里有 13 个单元测试，全过。代码是 AI 写的，测试也是 AI 写的，我一行业务代码没写。但这不代表我没做事--我做的事是：决定做什么功能、定方向、审结果、把品。

## 结尾：人的角色变了

做完这个项目，我最深的感受是：人的角色变了。

以前写代码，时间花在"怎么实现"上；现在时间花在"做什么"和"为什么这样做"上。从写代码变成描述意图、审查、把方向。

人的核心变成三件事：产品判断（做什么）、品味（好不好用）、迭代方向（往哪走）。我不写代码，但我得懂产品、懂用户、懂什么算好。

代码是 AI 生成的，但这个插件是我的--因为每个决定都是我做的。插件开源在 `github.com/shdwaker/bookmark-chrome`，欢迎去看。

AI Coding 把编程的门槛降低了。具体技术栈不再是墙--Vue、Vite、Chrome 扩展 API 这些我不熟的东西，AI 帮你填平。门槛降低之后，剩下的空间留给真正有想法的人。

全程零代码，做了一个 Chrome 插件。这不是未来，是现在就能做的事。
