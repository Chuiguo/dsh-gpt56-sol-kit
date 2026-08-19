# 安全边界（Security）

## 不做什么

- **不注册 LLM Provider**、不发 HTTP、不处理 SSE、不读写 API Key。
- **不读取/显示/打印** 中转站密钥、`Authorization`、`api-key` 或 base URL 敏感查询参数。
- **不修改** Harness 核心、`llm-pi-ai` 协议实现、中转提供方、现有 API Key、Web Profile。
- **不伪造**中转站上下文容量或官方价格。

## 做什么（只通过公开扩展点）

- 提示词段、工具 guard、命令、设置命名空间——全部是 Cordis effect，随调用 fiber 自动 dispose；插件卸载后不留任何提示词、工具、命令或设置。
- 模型识别只比较 provider/model 字符串与配置模式，不访问凭据。
- 费用只累加 `session/event` 的 provider-reported usage，并明确标注「与账单不完全一致」。

## 后端强制（不只是隐藏 UI）

- 只读模式（review/deep-analysis）用 `ctx.tools.guard` 拒绝 `MUTATING_TOOLS`（write/edit/bash/pwsh/terminal_*/subagent/workflow/ralph/goal-write/todo/job-control/cordis/schedule）。
- 可见性用 `agent.ctx.tools.restrict({ deny })` 同时移除 schema。

## 凭据泄漏检测

`verify.ts` 的 `looksLikeCredentialLeak()` 保守检测 `api_key=…`、`Authorization: Bearer …`、`x-api-key: …` 等形式，供 evidence assessment 检查工具参数和错误字段中的疑似泄漏。它不是凭据扫描器，也不替代宿主凭据保护。

## V2 状态与证据

工作流状态只保留任务画像、阶段、步骤、返修、错误和验证证据，不保存凭据、隐藏思考或敏感请求头。`/sol verify` 没有命令退出码、测试结果或浏览器验收事件时返回 INCOMPLETE。预算硬熔断由工具 guard 在执行处拒绝新调用；额度不足和永久协议错误不自动重试。

## 已知边界

- `tools.restrict` 官方语义是「可见性组合，非权限边界」；真正的权限由 guard 与宿主 sandbox/approval 独立保证（宿主层，本插件不触碰）。
- 命令输出由本插件完全控制（只拼接状态字段），不转发任何请求/响应原始数据。
