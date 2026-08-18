# Installation

English | [中文说明](#中文说明)

This plugin currently targets a DeepSeek Harness source checkout. DSH is in developer preview and may introduce breaking changes, so install against a checkout close to the version used by this repository.

## Prerequisites

- Node.js supported by the target DSH checkout.
- pnpm.
- A writable clone of `https://github.com/deepseek-ai/deepseek-harness`.
- An existing model provider route that serves `gpt-5.6-sol`.

## Source-checkout installation

1. Copy this repository into the DSH checkout at `<DSH>/packages/extensions/gpt56-sol-kit`. Exclude this repository's `.git` directory when copying.
2. Add `{ "path": "./packages/extensions/gpt56-sol-kit" }` to the `references` array in `<DSH>/tsconfig.host.json`.
3. Add `"@deepseek-ai/dsh-gpt56-sol-kit": "workspace:^"` to `<DSH>/apps/cli/package.json` dependencies.
4. Copy `profile/agent.cordis.yml` and `profile/preset.yml` to `~/.dsh/.agent-presets/gpt56-sol/`.
5. Edit `providerPattern` in the copied `agent.cordis.yml` so it matches your provider route key. Keep `modelPatterns` precise unless you intentionally want to match additional models.
6. From the DSH checkout root, run:

   ```sh
   pnpm install
   pnpm run typecheck
   pnpm run build
   pnpm run verify-cordis-config
   pnpm run verify-package-invariants
   ```

7. Restart `pnpm dsh web`, select the `GPT-5.6-Sol Enhanced` preset, start a new session on your `gpt-5.6-sol` route, and run `/sol status`.

The plugin does not read or copy credentials. Provider configuration and credentials remain owned by the DSH host.

## 中文说明

本插件当前面向 DeepSeek Harness 源码副本集成。DSH 仍处于 developer preview，可能发生破坏性变更，建议使用与本仓库验证版本相近的 DSH checkout。

1. 将本仓库复制到 `<DSH>/packages/extensions/gpt56-sol-kit`，复制时排除 `.git`。
2. 在 `<DSH>/tsconfig.host.json` 的 `references` 中增加 `{ "path": "./packages/extensions/gpt56-sol-kit" }`。
3. 在 `<DSH>/apps/cli/package.json` 的 dependencies 中增加 `"@deepseek-ai/dsh-gpt56-sol-kit": "workspace:^"`。
4. 将 `profile/agent.cordis.yml` 和 `profile/preset.yml` 复制到 `~/.dsh/.agent-presets/gpt56-sol/`。
5. 将预设里的 `providerPattern` 改成自己的 provider 路由键；除非明确需要，不要放宽 `modelPatterns`。
6. 在 DSH 根目录依次运行 `pnpm install`、`pnpm run typecheck`、`pnpm run build`、`pnpm run verify-cordis-config` 和 `pnpm run verify-package-invariants`。
7. 重启 `pnpm dsh web`，新建会话并选择 GPT-5.6-Sol 增强预设与 `gpt-5.6-sol`，执行 `/sol status`。

插件不会读取或复制凭据；provider 配置和凭据仍由 DSH 宿主管理。
