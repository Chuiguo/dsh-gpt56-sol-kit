# 预算与熔断

V2 预算默认保守但不强制停止：

| 配置 | 默认值 |
|---|---:|
| `maxWorkflowSteps` | `40` |
| `maxFixRounds` | `2` |
| `maxConsecutiveToolErrors` | `4` |
| `maxIdenticalErrorRetries` | `1` |
| `maxWallTimeMinutes` | `20` |
| `maxInputTokens` | `null` |
| `maxOutputTokensTotal` | `null` |
| `maxSessionCost` | `null` |
| `hardBudgetEnforcement` | `false` |

关闭硬限制时，`/sol budget` 只显示统计和预警。开启后达到任一限制会在工具后端 guard 停止新的工具执行，并保留当前工作流与错误证据。额度不足、认证失败和永久协议错误不进入普通重试。

预算统计包括步骤、返修次数、连续工具错误、运行时间、输入/缓存输入/输出 Token 和已知费用。价格没有配置时只显示 Token 与 unknown，不猜测金额。
