# 验证

`/sol verify` 是只读 evidence assessment 入口。它只接受当前任务起点之后的真实 session events，不执行模型请求、命令或 Git 操作，也不把模型的自我声明当作独立证据。

验收结果有四种：

- `PASS`：目标、授权文件、相关 diff、测试、构建和需要的浏览器验收都有通过证据。
- `FAIL`：必需步骤实际执行但失败，或存在未披露失败、越界修改或凭据泄漏。
- `INCOMPLETE`：必需证据没有实际产生，例如测试、构建或 diff 未检查。
- `BLOCKED`：额度不足、权限阻止或其他外部永久阻塞。

报告包含 requirements、evidence、failures、unauthorized changes、required next action 和 `Can report complete`。没有真实测试不能 PASS；Web 任务没有浏览器验收不能 PASS；声称执行但没有事件证据属于失败。

插件从 session 事件取得工具调用、按 `callId` 配对的工具结果和 Provider 请求错误，并只统计任务起点之后的事件。文件证据来自成功的文件工具调用；测试、构建、diff 和浏览器证据来自匹配的成功工具调用名称与参数。Harness 没有提供统一的退出码、Git 差异授权或浏览器验收事实时，插件保持 INCOMPLETE，不虚构 PASS。
