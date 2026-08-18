# V2 迁移

V2 将默认任务模式设为 `auto`。自动画像只在新任务开始时分类一次；所有旧模式名称仍可通过 `/sol mode <name>` 使用，显式模式优先于自动分类。

V1 的 reasoning 兼容规则保留：`applyReasoningOverrides` 默认 `false`，`maxOutputTokens` 默认 `0`，已有请求参数永不覆盖。非 Sol 路由没有提示词、工具限制或费用状态残留。

新增 `/sol phase`、`/sol workflow`、`/sol capabilities`。`/sol verify` 不再返回静态说明，而是基于可用证据返回 PASS、FAIL、INCOMPLETE 或 BLOCKED；证据不足时需要在宿主环境执行缺少的测试、构建或浏览器验收。

新增工作流和预算配置。默认 `hardBudgetEnforcement=false`，因此升级不会突然中断已有会话。需要硬熔断时，在插件配置中显式启用并设置限制。

## 回退到 V1 行为

将插件配置中的 `defaultMode` 设为 `balanced`，保持 `applyReasoningOverrides=false`、`maxOutputTokens=0`，并关闭 `hardBudgetEnforcement`、`secondPass` 和 `useSubagents`。这保留 V1 的兼容性与手动模式体验，但不会移除 V2 的命令和纯策略代码。

V2 不支持通过提示词伪造 Responses、PTC、Multi-agent、Pro 或图片能力。能力必须由当前路由声明或用户明确配置提供。
