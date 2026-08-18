# 任务模式（Modes）

模式只提供默认值；用户在当前任务显式选择的 reasoning 档位优先。

| 模式 | reasoning | 说明 |
|---|---|---|
| `auto` | provider default | 默认模式：新任务分类一次，再由工作流阶段决定工具与验证。 |
| `balanced` | medium | 手动模式：普通问答与小型修改，低延迟。 |
| `coding` | high | 先查项目规则，直接用文件工具修改，边实现边跑测试，完成前看 diff 与测试结果；禁止先整段输出代码。 |
| `frontend` | high | 强调视觉层级、响应式、交互、可访问性；完成后本地启动页面做浏览器验收（控制台错误、常见分辨率）。 |
| `review` | high | 默认只读；先报问题不改；每个结论给文件与行号；区分确认/可能/误报。 |
| `deep-analysis` | xhigh | 小说/架构/研究/复杂方案；允许并行子代理；区分事实/推断/建议；禁止无证据结论。 |
| `max` | max | 默认禁用；只能用户显式选择；使用前提示延迟/token/费用风险；插件绝不自动切到 max。 |
| `pro` | 无（独立配置） | 仅当路由真正支持 `pro` 档位时显示；默认禁用；不能仅凭模型名推断；与 effort 独立配置。 |

## 切换

```
/sol mode <name>            # 切换到指定模式
/sol mode max               # 需确认：/sol mode max --confirm
/sol review                 # 快捷进入只读审查
```

切换会注入一条会话可见提示，并即时更新：提示词段、工具 deny 集（可见性 + guard 强制）、下次请求的 reasoning 默认值。

`auto` 不叠加所有模式提示词；它只选择一个任务画像，阶段负责当前工具策略。显式手动模式会锁定画像，`balanced` 也不会被自动重分类。

## 工具集（按模式）

- `balanced`：拒绝 shell/terminal/subagent/workflow/ralph/cordis/schedule/目标写入/任务控制；保留 read/grep/glob/write/edit/web。
- `coding` / `frontend` / `max` / `pro`：完整工具集（不拒绝）。
- `review`：拒绝写入、shell、subagent、目标写入、todo、任务控制、cordis、schedule；保留只读。
- `deep-analysis`：拒绝写入、shell、目标写入、todo、cordis、schedule；保留 subagent/web/read。

原则：不做「仅隐藏 UI」；用户显式要求的工具不能被模式静默禁用——因此用 deny 集（而非 allow 集）只移除模式明确禁止的工具，其余全保留。
