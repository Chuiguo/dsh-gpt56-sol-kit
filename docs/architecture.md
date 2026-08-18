# 架构说明（Architecture）

## 目标

在**已有**的 GPT-5.6-Sol 中转路由之上，提供纯公开扩展点实现的能力：提示词策略、任务模式、工具集优化、上下文/费用保护、命令、设置与验证。绝不注册 Provider、不发 HTTP、不读密钥、不改协议层。

## 分模块设计

插件分为三层：

- **纯策略引擎**（`config.ts`、`model-match.ts`、`modes.ts`、`task-profile.ts`、`workflow.ts`、`preflight.ts`、`capabilities.ts`、`budget-v2.ts`、`prompt.ts`、`tool-policy.ts`、`context-policy.ts`、`cost.ts`、`verify.ts`、`commands.ts`）：纯函数，可独立单测（`pnpm test`）。
- **证据与状态层**：保留每个 Sol session 的任务画像、工作流阶段、预算用量和路由能力快照；缺少真实证据时验收结果为 `INCOMPLETE`。
- **Harness 适配层**（`index.ts`）：把纯引擎接到 Cordis 公开扩展点上。`client.ts` 为可选的浏览器侧占位（设置 UI 由 settings namespace 的 schema 表单提供）。

## 扩展点映射（全部为公开接口）

| 需求 | 机制 | 关键 API |
|---|---|---|
| 提示词片段 | 注册有序段，按模型条件返回空串 | `ctx.systemPrompt.section({ name, order, text })` |
| 推理档位默认值 | 请求级 waterfall，替换 `LlmCallConfig` | `agent/request` + `ctx.llm.resolveModelInfo()` |
| 工具可见性 | 按 agent 作用域掩码 | `agent.ctx.tools.restrict({ deny })` |
| 工具后端强制 | 单调守卫 | `ctx.tools.guard(execution => reason\|undefined)` |
| 命令 | 命令注册表 | `ctx.commands.register({ name, description, handler })` |
| 配置 | 设置命名空间（schema 驱动 UI） | `ctx.settings.register(ns, schema, { base })` |
| 用量/费用 | 会话事件里的 provider-reported usage | `session/event` → `assistant/message.usage` |
| 上下文占用 | 可选计量 + 模型容量 | `ctx.tokenMeter.measure(session)` + `resolveModelInfo().context` |

## 模型识别

`isSolRoute(provider, model, config)` = `enabled && matchesProvider(provider, providerPattern) && matchesAnyModel(model, modelPatterns)`。

- `providerPattern` 空或 `*` 匹配任意 provider；支持 `*` 通配，否则大小写不敏感的子串/精确匹配。
- `modelPatterns` 默认为 `['gpt-5.6-sol', 'gpt-5.6']`；`gpt-5.6` 作为子串也匹配 `gpt-5.6-sol`；用户可加中转别名。
- **不硬编码官方端点**：模型 ID 与路由完全来自配置；容量、推理档位、输出上限只从 `resolveModelInfo()` 读取。

## 推理档位规则

- 模式只提供默认值：`balanced→medium`、`coding/frontend/review→high`、`deep-analysis→xhigh`、`max→max`、`pro→无`。
- `decideReasoning()` 决定：无传入值，或传入值等于插件上次注入的默认值时，应用模式默认；传入值不同（用户显式选择）时保留用户值。
- 目标档位不在模型支持集内时，回退到最近的更低档位，再回退到适配器默认。

## 工具集策略

- 可见性：`deniedToolsForMode(mode)` 返回按模式要隐藏的工具名（用 `@deepseek-ai/dsh-tool-*` 真实名字）。
- 强制：`ctx.tools.guard` 在 review/deep-analysis 只读模式下拒绝 `MUTATING_TOOLS`。
- 只隐藏 UI 不是目标；两个层面都遵循同一份 deny 集。

## 上下文与费用

- 上下文：`contextDecision()` 计算 warn/compact 两档天花板（显式 limit 优先，否则由模型窗口按百分比推导；窗口未知时**不**伪造上限）。
- 费用：只累加 `session/event` 里的 `assistant/message.usage`，标注为 provider-reported；价格未知时只显示 token，绝不使用 OpenAI 官方价。

## V2 阶段与验证

`auto` 在新任务开始时通过纯函数分类一次。修改/前端画像经过 `inspect → implement → verify → review`，回答/诊断/审查/深度分析画像保持只读并直接进入验证路径。验证失败最多进入两轮 `fix → verify`，再失败进入 `blocked`。只有带通过证据的 review 才能进入 complete。

`/sol verify` 读取会话和插件已记录的证据，输出 PASS、FAIL、INCOMPLETE 或 BLOCKED；它不会执行测试或构建，也不会把自然语言完成声明当成证据。`/sol budget` 统计步骤、返修、错误、耗时、Token 和已知费用；启用 `hardBudgetEnforcement` 后，达到限制由工具 guard 停止新工具执行。

## 已知限制（不绕过核心）

1. **`@deepseek-ai/dsh-*` 为 `private: true` 私有包**：独立 npm 包无法解析 peer 依赖，必须作为 monorepo 叶子包或经 Profile 机制构建。
2. **review 模式无「只读 Shell / Git diff」工具**：Harness 未提供只读 Shell 工具；review 模式因此拒绝全部 shell 工具（`bash`/`pwsh`/`terminal_*`），只保留 `read`/`grep`/`glob`/session 只读等。真正的只读 Shell 需另立能力。
3. **frontend 模式无内置浏览器验收工具**：目录中无浏览器验收/截图工具；frontend 模式 = coding 工具 + 提示词引导浏览器验收（用现有 shell/web 能力），浏览器验收工具需另行提供。
4. **上下文压缩由 Harness 现有压缩能力处理**：本插件只做提醒，不实现压缩（`dsh-compaction-basic` 直接读 `tokenMeter.measure`）。
5. **`tools.restrict` 是可见性组合，非权限边界**（官方语义）：因此额外用 `ctx.tools.guard` 做后端强制。
6. **`pro` 档位**：pi-ai 公开档位集合为 `off/minimal/low/medium/high/xhigh/max`，不含 `pro`；pro 模式不推断、默认禁用，仅当路由真正暴露 `pro` 档位且用户显式确认才启用（与 effort 独立配置）。
7. **模型切换的提示词及时性**：提示词段在组装时读取 `agent.options`，会话中途切换模型可能有一个请求的延迟；推理档位在每次 `agent/request` 重新判定。
8. **Second Pass**：优先用 `ctx.subagents` 同模型新子代理复核（`useSubagents` 开启时）；否则退化为同会话只读验证阶段。基线实现提供 `/sol verify` 纯评估 + `/sol review` 只读复核模式，子代理复核的注册需按目标部署的 subagent provider 接入。
