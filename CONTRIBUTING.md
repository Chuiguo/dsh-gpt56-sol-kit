# Contributing

Issues and pull requests are welcome.

Before submitting a change:

1. Install the plugin into a compatible DeepSeek Harness source checkout.
2. Run `pnpm test` from the plugin directory.
3. Run the DSH host typecheck, build, config catalog, persistence catalog, Cordis catalog, Cordis config, invariant, and documentation gates affected by the change.
4. Do not include API keys, relay credentials, local session logs, or machine-specific paths.

Changes to model-visible behavior should include focused tests and an assembled Cordis/AgentLoop test when applicable.
