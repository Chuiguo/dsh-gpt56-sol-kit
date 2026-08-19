# DSH GPT-5.6-Sol Kit

English | [中文](README.zh.md)

An unofficial community GPT-5.6-Sol companion plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). It operates on the existing model route: it registers no LLM provider, makes no HTTP request, handles no SSE, reads no API key, reimplements no Responses or Chat Completions, and modifies neither `llm-pi-ai` nor Harness core source.

> This repository is a community project and is not an official DeepSeek AI package. The internal package identifier follows the DSH source-checkout resolver convention; the project is not published under the `@deepseek-ai` npm organization.

Sol behavior activates only when the current provider/model matches configured Sol patterns. Other models receive no Sol prompt, tool policy, command state, or usage tracking.

## V2 capabilities

| Capability | Behavior |
|---|---|
| Unified adaptive workflow | `auto` classifies each new task once, then uses inspect, implement, verify, review, fix, complete or blocked phases; mode, scope and phase permissions come from one derived policy |
| Task profiles | answer, diagnose, modify, review, frontend, deep-analysis; explicit `/sol mode` wins |
| Backend tool policy | read-only profiles cannot execute mutating tools; hard budget stops new tool execution when enabled |
| Evidence assessment | `/sol verify` reports PASS, FAIL, INCOMPLETE, or BLOCKED from current-task session evidence; it never executes commands |
| Route capabilities | exact `resolveModelInfo()` metadata; unknown capabilities stay unknown |
| Bounded recovery | error classes, one identical retry by default, quota and permanent protocol errors stop immediately |
| Budget controls | workflow steps, configured fix rounds, tool/request errors, wall time, tokens and optional known cost |

V2 improves execution reliability, evidence quality, and cost control. It does not increase the model's inherent intelligence and cannot add capabilities unsupported by the current route.

## Commands

- `/sol` or `/sol status` — route, profile, phase, reasoning, context, tools, tokens and completion permission.
- `/sol mode <name>` — lock a manual profile; `max` and `pro` require confirmation where configured.
- `/sol phase` / `/sol workflow` — show the current workflow state.
- `/sol verify` — perform read-only evidence assessment; missing evidence is `INCOMPLETE`.
- `/sol budget` — show usage and soft/hard budget state.
- `/sol capabilities` — show exact route capability declarations and their source.
- `/sol review` — switch to backend-enforced read-only review.
- `/sol reset` — clear plugin settings and workflow mode without touching provider or credentials.

## Compatibility and safety

Runtime mode and workflow snapshots are namespaced session events and do not contain credentials, headers, hidden reasoning, or raw model responses. `applyReasoningOverrides` remains `false` by default. `maxOutputTokens` remains `0`. Existing request `reasoningEffort` and `maxTokens` are preserved. The plugin never reads credentials, changes a relay URL, creates a provider, probes a route, or guesses capability from a model name.

## Installation

DeepSeek Harness is currently a developer preview, and this plugin integrates with a source checkout. Follow [INSTALL.md](INSTALL.md) to copy the package into `packages/extensions/gpt56-sol-kit`, register the workspace dependency and TypeScript project reference, build DSH, and install the included agent preset.

The plugin expects an existing provider route serving `gpt-5.6-sol`. It does not create a provider or store credentials. Adjust `providerPattern` in the preset to match your own route key.

## Development

After installing the repository into a DSH source checkout, run the focused test command from the package directory:

```sh
pnpm test
```

Build and repository checks must run from the DSH monorepo. The tests do not call a real model API. The validated baseline is 100 focused tests plus the DSH host build and documentation/catalog gates.

## Documentation

- [V2 migration](V2_MIGRATION.md)
- [Architecture](docs/architecture.md)
- [Workflow](docs/workflow.md)
- [Capabilities](docs/capabilities.md)
- [Verification](docs/verification.md)
- [Budget](docs/budget.md)
- [Commands](docs/commands.md)
- [Security](docs/security.md)

## Model Experience

### Task workflow and policy

#### What the model sees

Mode-specific workflow guidance, current `phase`, task `scope`, tool restrictions, verification status, and budget notices. The plugin does not add provider reasoning or claim unsupported route capabilities.

#### Token effect

The stable policy prefix and task-specific notices add input tokens; hidden reasoning and output tokens remain provider-controlled. Budget counters report observed usage without inventing prices.

#### KV Cache effect

The stable policy prefix is reusable while the route and mode remain unchanged. Switching mode or workflow phase changes the dynamic section and may reduce prefix reuse from that point onward.

## Known Limitations and Deferred Work

- PASS is an evidence assessment over session events, not an independent Git or filesystem verifier. Missing observable diff, command result, or browser evidence correctly produces `INCOMPLETE`.
- The state event uses schema v2 and safely migrates complete schema v1 snapshots; malformed snapshots are ignored.
- `secondPass` and `useSubagents` are not public settings because no reliable subagent review consumer is mounted.
- The repository includes a real Cordis/AgentLoop replay composition test; a Loader-backed process restart test remains deferred.
- Bilingual pairing records for generated catalogs and package README must be updated through the repository's official i18n tooling.

## Community

Issues and pull requests are welcome in this repository. For the wider ecosystem, use the [`dsh-plugin`](https://github.com/topics/dsh-plugin) topic and the official [DeepSeek Harness Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions).
