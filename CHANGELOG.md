# Changelog

## 0.1.0-rc.6

- Completed the evidence-backed `verify -> review -> complete` workflow path.
- Scoped `/sol verify` evidence to the current task and paired tool calls/results by call ID.
- Added schema v2 state validation with safe schema v1 migration.
- Split provider request errors from tool errors and wired bounded identical-error retries.
- Unified configurable fix-round limits, Pro confirmation, effective-policy status, and mixed-intent task classification.
- Removed the unused `secondPass` and `useSubagents` public settings.
- Expanded the focused suite from 96 to 100 tests.

## 0.1.0-rc.5

- Added the V2 adaptive task workflow and unified tool policy.
- Added replayable `gpt56-sol/state` session snapshots.
- Added bounded workflow, error classification, budget controls, and `/sol` commands.
- Added conservative evidence-based verification.
- Added Cordis/AgentLoop replay composition coverage and 96 focused tests.
- Preserved provider defaults by leaving reasoning and output-token overrides disabled unless explicitly configured.
