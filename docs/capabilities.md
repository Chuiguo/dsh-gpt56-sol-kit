# 路由能力

插件只读取当前 provider/model 路由的 `resolveModelInfo()` 结果，不根据模型名称猜测能力，也不发送探测请求。

能力字段包括：

- `protocol`
- `imageInput`
- `reasoningEfforts`
- `reasoningModePro`
- `persistedReasoning`
- `programmaticToolCalling`
- `multiAgent`
- `toolContinuation`
- `contextWindow`
- `maxOutputTokens`
- `source`

`source` 为 `user` 时表示明确配置覆盖，为 `route` 时表示来自精确路由，为 `conservative-default` 时表示未知能力。未知能力保持 `null`、空集合或零，不从官方同名模型继承。

`applyReasoningOverrides` 默认关闭，`maxOutputTokens` 默认零。插件永远保留请求已经携带的 `reasoningEffort` 与 `maxTokens`。插件不注册 Provider、不包装 Chat Completions 或 Responses、不读取 API Key。

`/sol capabilities` 显示当前已解析结果。能力不足时必须显示 unknown，提示词不能伪造 Responses、PTC、Multi-agent、Pro 或图片输入支持。
