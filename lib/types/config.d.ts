/**
 * GPT-5.6-Sol plugin configuration: the plain value contract, defaults, and
 * normalization. This module is dependency-free so unit tests and the runtime
 * adapter share one source of truth. The schemastery schema (for the settings
 * namespace) lives in index.ts and is built from these same defaults.
 */
/** Valid task-mode ids. */
export declare const MODE_IDS: readonly ["auto", "balanced", "coding", "frontend", "review", "deep-analysis", "max", "pro"];
export type SolMode = (typeof MODE_IDS)[number];
/** Narrow an unknown value to a {@link SolMode}. */
export declare function isSolMode(value: unknown): value is SolMode;
/** Fully-resolved runtime configuration. */
export interface Config {
    /** Master switch: when false the plugin contributes nothing. */
    enabled: boolean;
    /**
     * Provider-route match. '' or '*' matches any provider. A glob `*` is
     * supported; otherwise the value is a case-insensitive exact or substring
     * match (see model-match.ts).
     */
    providerPattern: string;
    /** Model-id patterns; case-insensitive glob or substring. Empty matches nothing. */
    modelPatterns: string[];
    /** Task mode used when the user has not chosen one. */
    defaultMode: SolMode;
    /** Optional default reasoning effort id; '' leaves the adapter/provider default. */
    defaultReasoning: string;
    /**
     * Whether the plugin may inject a mode-derived reasoning effort. Defaults to
     * false (compatibility-first): a custom relay can expose a catalog model id
     * whose reasoning_effort it cannot actually honor, so the plugin never
     * rewrites reasoning unless the user opts in AND the route declares the effort.
     */
    applyReasoningOverrides: boolean;
    /** Soft context ceiling in tokens, or null to derive from the model + warnAtPercent. */
    contextSoftLimit: number | null;
    /** Hard context ceiling in tokens, or null to derive from the model + compactAtPercent. */
    contextHardLimit: number | null;
    /** Context occupancy percent at which compaction should run (derived ceiling). */
    compactAtPercent: number;
    /** Context occupancy percent at which a warning is surfaced (derived ceiling). */
    warnAtPercent: number;
    /**
     * Per-request output-token cap the plugin injects, in tokens. `0` (the
     * default) means the plugin NEVER touches `LlmCallConfig.maxTokens`; only a
     * positive value opts in, and only when the base request has no cap yet.
     */
    maxOutputTokens: number;
    /** Billing currency label (display only). */
    currency: string;
    /** Relay input price per million tokens; null = unknown. */
    inputPricePerMillion: number | null;
    /** Relay cached-input price per million tokens; null = unknown. */
    cachedInputPricePerMillion: number | null;
    /** Relay output price per million tokens; null = unknown. */
    outputPricePerMillion: number | null;
    /** Per-request cost budget in the configured currency; null = disabled. */
    perRequestBudget: number | null;
    /** Per-session cost budget in the configured currency; null = disabled. */
    perSessionBudget: number | null;
    /** Whether `max` mode requires an explicit user confirmation before it applies. */
    maxRequiresConfirmation: boolean;
    /** Whether `pro` mode requires an explicit user confirmation before it applies. */
    proRequiresConfirmation: boolean;
    /** Maximum number of workflow phase/tool-result steps before the budget is reached. */
    maxWorkflowSteps: number;
    /** Maximum number of verify-to-fix rounds. */
    maxFixRounds: number;
    /** Maximum consecutive tool failures before stopping or blocking. */
    maxConsecutiveToolErrors: number;
    /** Maximum consecutive Provider request failures before blocking. */
    maxConsecutiveRequestErrors: number;
    /** Maximum retries for one identical classified error. */
    maxIdenticalErrorRetries: number;
    /** Maximum elapsed workflow time in minutes. */
    maxWallTimeMinutes: number;
    /** Optional hard input-token ceiling. */
    maxInputTokens: number | null;
    /** Optional hard total output-token ceiling. */
    maxOutputTokensTotal: number | null;
    /** Optional hard session-cost ceiling when prices are known. */
    maxSessionCost: number | null;
    /** Whether exceeded workflow limits stop new tool execution immediately. */
    hardBudgetEnforcement: boolean;
}
export type SolConfig = Config;
export declare const DEFAULT_CONFIG: Readonly<Config>;
/**
 * Merge partial configuration over the defaults and validate it. Throws with a
 * descriptive message on a malformed value so misconfiguration fails loud at
 * load rather than silently skipping a guardrail.
 *
 * @param input Raw configuration, typically the plugin entry config merged with
 *   any user-settings layer.
 * @returns A detached, validated configuration.
 */
export declare function normalizeConfig(input: unknown): SolConfig;
//# sourceMappingURL=config.d.ts.map