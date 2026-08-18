# 验证

`/sol verify` 是只读验收入口。它只接受本轮真实事件和证据，不执行模型请求，不把模型的自我声明当作独立证据。

验收结果有四种：

- `PASS`：目标、授权文件、相关 diff、测试、构建和需要的浏览器验收都有通过证据。
- `FAIL`：必需步骤实际执行但失败，或存在未披露失败、越界修改或凭据泄漏。
- `INCOMPLETE`：必需证据没有实际产生，例如测试、构建或 diff 未检查。
- `BLOCKED`：额度不足、权限阻止或其他外部永久阻塞。

报告包含 requirements、evidence、failures、unauthorized changes、required next action 和 `Can report complete`。没有真实测试不能 PASS；Web 任务没有浏览器验收不能 PASS；声称执行但没有事件证据属于失败。

插件可以从 session 事件取得用户消息、助手消息、工具调用、工具结果和 provider usage。Harness 没有提供统一的测试、构建或 Git 证据服务时，插件保持 INCOMPLETE，不虚构命令退出码。
