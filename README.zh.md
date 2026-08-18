# DSH GPT-5.6-Sol Kit

[English](README.md) | 中文

这是一个面向 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的非官方社区 GPT-5.6-Sol companion plugin。它运行在已有模型路由之上：不注册 LLM provider、不发送 HTTP 请求、不处理 SSE、不读取 API key、不重实现 Responses 或 Chat Completions，也不修改 `llm-pi-ai` 或 Harness 核心源码。

> 本仓库是社区项目，不是 DeepSeek AI 官方发布包。内部包名沿用 DSH 源码仓库的解析约定，但本项目不会发布到 `@deepseek-ai` npm 组织。

只有当前 provider/model 匹配配置的 Sol 模式时才启用。其他模型不会接收 Sol 提示词、工具策略、命令状态或用量统计。

## V2 能力

| 能力 | 行为 |
|---|---|
| 统一自适应工作流 | `auto` 为每个新任务分类一次，然后进入 inspect、implement、verify、review、fix、complete 或 blocked 阶段；模式、scope 和阶段权限来自统一派生策略 |
| 任务画像 | answer、diagnose、modify、review、frontend、deep-analysis；显式 `/sol mode` 优先 |
| 后端工具策略 | 只读画像不能执行修改工具；启用硬预算后，达到限制会停止新的工具执行 |
| 真实验证状态 | `/sol verify` 根据可用证据报告 PASS、FAIL、INCOMPLETE 或 BLOCKED |
| 路由能力 | 使用精确的 `resolveModelInfo()` 元数据；未知能力保持 unknown |
| 有界恢复 | 错误分类，默认只重试一次相同错误；额度错误和永久协议错误立即停止 |
| 预算控制 | 工作流步骤、返修轮次、工具错误、墙钟时间、Token 和可选的已知费用 |

V2 改善执行可靠性、证据质量和成本控制。它不会提升模型固有智能，也不能增加当前路由不支持的能力。

## 命令

- `/sol` 或 `/sol status`：显示路由、画像、阶段、reasoning、上下文、工具、Token 和完成权限。
- `/sol mode <name>`：锁定手动画像；按配置要求时，`max` 和 `pro` 需要确认。
- `/sol phase` / `/sol workflow`：显示当前工作流状态。
- `/sol verify`：执行只读证据评估；缺少证据时返回 `INCOMPLETE`。
- `/sol budget`：显示用量以及软/硬预算状态。
- `/sol capabilities`：显示精确路由能力声明及其来源。
- `/sol review`：切换到后端强制只读审查。
- `/sol reset`：清理插件设置和工作流模式，不触碰 provider 或凭据。

## 兼容性与安全

运行时模式和工作流快照使用命名空间 session event 保存，不包含凭据、请求头、隐藏思考或原始模型响应。`applyReasoningOverrides` 默认仍为 `false`，`maxOutputTokens` 默认仍为 `0`。已有请求的 `reasoningEffort` 和 `maxTokens` 永不覆盖。插件不会读取凭据、修改中转地址、创建 provider、探测路由，也不会根据模型名称猜测能力。

## 安装

DeepSeek Harness 当前仍处于 developer preview，本插件通过 DSH 源码副本集成。请按照 [INSTALL.md](INSTALL.md) 将包复制到 `packages/extensions/gpt56-sol-kit`，登记 workspace 依赖和 TypeScript project reference，构建 DSH，并安装仓库内的 Agent 预设。

插件要求用户已经配置好能够提供 `gpt-5.6-sol` 的模型路由。它不会创建 provider，也不会保存凭据。请将预设中的 `providerPattern` 调整为自己的路由键。

## 开发

将仓库安装进 DSH 源码副本后，请从插件目录运行聚焦测试命令：

```sh
pnpm test
```

构建和仓库检查必须从 DSH monorepo 运行。测试不会调用真实模型 API。当前验证基线为 96 项聚焦测试，以及 DSH host 构建和文档/catalog 门禁。

## 文档

- [V2 迁移](V2_MIGRATION.md)
- [架构](docs/architecture.md)
- [工作流](docs/workflow.md)
- [路由能力](docs/capabilities.md)
- [验证](docs/verification.md)
- [预算](docs/budget.md)
- [命令](docs/commands.md)
- [安全](docs/security.md)

## 模型体验

### 工作流和策略

#### 模型看到的内容

按模式提供的工作流指导、当前 `phase`、任务 `scope`、工具限制、验证状态和预算提示。插件不添加 provider reasoning，也不声称当前路由不支持的能力。

#### Token 影响

稳定策略前缀和任务提示会增加输入 Token；隐藏思考和输出 Token 仍由 provider 控制。预算计数只报告已观察到的用量，不虚构价格。

#### KV Cache 影响

当路由和模式不变时，稳定策略前缀可以复用。切换模式或工作流阶段会改变动态部分，可能从变更处降低前缀复用率。

## 已知限制与延期工作

- 完整 PASS 验证需要可观察的 diff、命令退出码和浏览器证据；证据不可用时会正确返回 `INCOMPLETE`。
- 仓库已经包含真实 Cordis/AgentLoop replay 组合测试；Loader 驱动的进程级重启测试仍为延期工作。
- 生成 catalog 和 package README 的双语 pairing 记录必须通过仓库官方 i18n 工具更新。

## 社区

欢迎在本仓库提交 Issue 和 Pull Request。更广泛的插件发现使用 [`dsh-plugin`](https://github.com/topics/dsh-plugin) topic；也可以前往官方 [DeepSeek Harness Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions) 分享和反馈。
