# V2 统一自适应工作流

V2 将任务画像与执行阶段分开。画像描述任务属于回答、诊断、修改、审查、前端或深度分析；阶段描述当前正在检查、实现、验证、审查、返修或完成。

## 画像

`auto` 在新任务的首个 admitted step 分类一次。分类器是无模型调用的纯函数，优先识别用户明确的审查、前端、研究、诊断和修改意图。`/sol mode <name>` 会锁定手动画像，`balanced` 也会保持锁定，不会在后续阶段被自动改写。

回答、诊断、审查和深度分析画像保持只读。修改与前端画像才允许实现阶段。删除、发布、购买、上传等外部风险动作仍需要宿主确认。

## 阶段

```text
inspect -> implement -> verify -> review -> complete
inspect -> verify -> review
verify -> fix -> verify
```

任务启动时进入 `inspect`。实现类任务在检查证据后进入 `implement`，只读任务进入 `verify`。`/sol verify` 在当前任务事件证据完整且全部通过时使用 `workflow.ts` 的合法转换依次完成 `verify -> review -> complete`；模型自然语言中的“已完成”不是证据。`maxFixRounds` 来自配置并保存在工作流状态中，达到限制后进入 `blocked`。

状态记录阶段、步骤、返修次数、证据、最后错误和开始时间。`/sol workflow` 与 `/sol phase` 只读显示这些字段。

## 工具策略

inspect 和 review 由后端 guard 禁止写入、shell、终端和其他变更性工具。implement 仅由修改或前端画像进入。verify 记录证据，但不会把未执行的测试、构建或浏览器验收当作成功。

## 限制

插件只能观察 Harness 已公开的 session、agent 和 tools 扩展点。它不会修改 agent loop，也不会自行执行测试或 Git 命令。因此没有真实命令、diff 或浏览器证据时，`/sol verify` 返回 `INCOMPLETE`。证据评估不是独立的文件系统或 Git 验证器。

状态使用 schema v2 的命名空间 session event 保存；schema v1 可在缺少新错误计数时安全迁移，其他非法状态保守忽略并回退到默认状态。
