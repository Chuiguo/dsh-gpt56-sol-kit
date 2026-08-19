# 命令（Commands）

所有命令以 `/sol` 开头，由 `ctx.commands` 注册表分发，结果只进入 UI，不进入模型历史。

| 命令 | 作用 |
|---|---|
| `/sol`、`/sol status` | 显示路由、画像、阶段、reasoning、上下文、工具、Token 和完成权限 |
| `/sol mode <name>` | 锁定手动画像；`max`/`pro` 按配置要求 `--confirm` |
| `/sol phase` | 显示当前工作流阶段 |
| `/sol workflow` | 显示画像、阶段、步骤、返修次数和最后错误 |
| `/sol verify` | 基于已记录真实证据进行只读验收 |
| `/sol budget` | 显示步骤、返修、工具错误、运行时间、Token 和已知费用 |
| `/sol capabilities` | 显示当前精确路由能力及来源 |
| `/sol review` | 切换到后端强制只读审查 |
| `/sol reset` | 恢复默认设置并清理工作流状态，不影响 Provider 或凭据 |

`/sol verify` 的结果为 `PASS`、`FAIL`、`INCOMPLETE` 或 `BLOCKED`。命令只评估当前任务起点之后按 `callId` 配对的 session events，不执行模型、测试、构建或 Git 操作；没有实际测试、构建、diff 或 Web 浏览器证据时不会返回 PASS。命令不会显示 API Key、Authorization Header、敏感 URL、图片 base64 或隐藏思考内容。

## 预算

默认限制为 40 个工作流步骤、2 轮返修、4 个连续工具错误、1 次相同错误重试和 20 分钟。Token 与费用限制默认未配置，`hardBudgetEnforcement` 默认关闭。关闭时只预警，开启后达到限制会安全停止新的工具执行。

未配置中转价格时始终显示 Token 和 unknown，不使用官方价格猜测金额。
