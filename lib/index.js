import z from "@deepseek-ai/schemastery";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import { ReasoningEffortId, createUserMessage } from "@deepseek-ai/dsh-llm";
//#region lib/types/config.js
/**
* GPT-5.6-Sol plugin configuration: the plain value contract, defaults, and
* normalization. This module is dependency-free so unit tests and the runtime
* adapter share one source of truth. The schemastery schema (for the settings
* namespace) lives in index.ts and is built from these same defaults.
*/
/** Valid task-mode ids. */
const MODE_IDS = [
	"auto",
	"balanced",
	"coding",
	"frontend",
	"review",
	"deep-analysis",
	"max",
	"pro"
];
/** Narrow an unknown value to a {@link SolMode}. */
function isSolMode(value) {
	return typeof value === "string" && MODE_IDS.includes(value);
}
const DEFAULT_CONFIG = Object.freeze({
	enabled: true,
	providerPattern: "",
	modelPatterns: ["gpt-5.6-sol"],
	defaultMode: "auto",
	defaultReasoning: "",
	applyReasoningOverrides: false,
	contextSoftLimit: null,
	contextHardLimit: null,
	compactAtPercent: 85,
	warnAtPercent: 75,
	maxOutputTokens: 0,
	currency: "USD",
	inputPricePerMillion: null,
	cachedInputPricePerMillion: null,
	outputPricePerMillion: null,
	perRequestBudget: null,
	perSessionBudget: null,
	maxRequiresConfirmation: true,
	proRequiresConfirmation: true,
	maxWorkflowSteps: 40,
	maxFixRounds: 2,
	maxConsecutiveToolErrors: 4,
	maxConsecutiveRequestErrors: 4,
	maxIdenticalErrorRetries: 1,
	maxWallTimeMinutes: 20,
	maxInputTokens: null,
	maxOutputTokensTotal: null,
	maxSessionCost: null,
	hardBudgetEnforcement: false
});
function expectBoolean(value, field) {
	if (typeof value !== "boolean") throw new TypeError(`${field} must be a boolean`);
	return value;
}
function expectString(value, field) {
	if (typeof value !== "string") throw new TypeError(`${field} must be a string`);
	return value;
}
function expectStringArray(value, field) {
	if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) throw new TypeError(`${field} must be an array of strings`);
	return value.map((item) => String(item));
}
function expectPercent(value, field) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > 100) throw new TypeError(`${field} must be a number in (0, 100]`);
	return value;
}
function expectNonNegativeOrNull(value, field) {
	if (value === null || value === void 0) return null;
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new TypeError(`${field} must be a non-negative number or null`);
	return value;
}
function expectNonNegativeInt(value, field) {
	if (typeof value !== "number" || !Number.isInteger(value) || value < 0) throw new TypeError(`${field} must be a non-negative integer`);
	return value;
}
/**
* Merge partial configuration over the defaults and validate it. Throws with a
* descriptive message on a malformed value so misconfiguration fails loud at
* load rather than silently skipping a guardrail.
*
* @param input Raw configuration, typically the plugin entry config merged with
*   any user-settings layer.
* @returns A detached, validated configuration.
*/
function normalizeConfig(input) {
	const raw = input ?? {};
	const config = {
		enabled: raw.enabled === void 0 ? DEFAULT_CONFIG.enabled : expectBoolean(raw.enabled, "enabled"),
		providerPattern: raw.providerPattern === void 0 ? DEFAULT_CONFIG.providerPattern : expectString(raw.providerPattern, "providerPattern"),
		modelPatterns: raw.modelPatterns === void 0 ? [...DEFAULT_CONFIG.modelPatterns] : expectStringArray(raw.modelPatterns, "modelPatterns"),
		defaultMode: raw.defaultMode === void 0 ? DEFAULT_CONFIG.defaultMode : isSolMode(raw.defaultMode) ? raw.defaultMode : (() => {
			throw new TypeError(`defaultMode must be one of ${MODE_IDS.join(", ")}`);
		})(),
		defaultReasoning: raw.defaultReasoning === void 0 ? DEFAULT_CONFIG.defaultReasoning : expectString(raw.defaultReasoning, "defaultReasoning"),
		applyReasoningOverrides: raw.applyReasoningOverrides === void 0 ? DEFAULT_CONFIG.applyReasoningOverrides : expectBoolean(raw.applyReasoningOverrides, "applyReasoningOverrides"),
		contextSoftLimit: raw.contextSoftLimit === void 0 ? DEFAULT_CONFIG.contextSoftLimit : expectNonNegativeOrNull(raw.contextSoftLimit, "contextSoftLimit"),
		contextHardLimit: raw.contextHardLimit === void 0 ? DEFAULT_CONFIG.contextHardLimit : expectNonNegativeOrNull(raw.contextHardLimit, "contextHardLimit"),
		compactAtPercent: raw.compactAtPercent === void 0 ? DEFAULT_CONFIG.compactAtPercent : expectPercent(raw.compactAtPercent, "compactAtPercent"),
		warnAtPercent: raw.warnAtPercent === void 0 ? DEFAULT_CONFIG.warnAtPercent : expectPercent(raw.warnAtPercent, "warnAtPercent"),
		maxOutputTokens: raw.maxOutputTokens === void 0 ? DEFAULT_CONFIG.maxOutputTokens : expectNonNegativeInt(raw.maxOutputTokens, "maxOutputTokens"),
		currency: raw.currency === void 0 ? DEFAULT_CONFIG.currency : expectString(raw.currency, "currency"),
		inputPricePerMillion: raw.inputPricePerMillion === void 0 ? DEFAULT_CONFIG.inputPricePerMillion : expectNonNegativeOrNull(raw.inputPricePerMillion, "inputPricePerMillion"),
		cachedInputPricePerMillion: raw.cachedInputPricePerMillion === void 0 ? DEFAULT_CONFIG.cachedInputPricePerMillion : expectNonNegativeOrNull(raw.cachedInputPricePerMillion, "cachedInputPricePerMillion"),
		outputPricePerMillion: raw.outputPricePerMillion === void 0 ? DEFAULT_CONFIG.outputPricePerMillion : expectNonNegativeOrNull(raw.outputPricePerMillion, "outputPricePerMillion"),
		perRequestBudget: raw.perRequestBudget === void 0 ? DEFAULT_CONFIG.perRequestBudget : expectNonNegativeOrNull(raw.perRequestBudget, "perRequestBudget"),
		perSessionBudget: raw.perSessionBudget === void 0 ? DEFAULT_CONFIG.perSessionBudget : expectNonNegativeOrNull(raw.perSessionBudget, "perSessionBudget"),
		maxRequiresConfirmation: raw.maxRequiresConfirmation === void 0 ? DEFAULT_CONFIG.maxRequiresConfirmation : expectBoolean(raw.maxRequiresConfirmation, "maxRequiresConfirmation"),
		proRequiresConfirmation: raw.proRequiresConfirmation === void 0 ? DEFAULT_CONFIG.proRequiresConfirmation : expectBoolean(raw.proRequiresConfirmation, "proRequiresConfirmation"),
		maxWorkflowSteps: raw.maxWorkflowSteps === void 0 ? DEFAULT_CONFIG.maxWorkflowSteps : expectNonNegativeInt(raw.maxWorkflowSteps, "maxWorkflowSteps"),
		maxFixRounds: raw.maxFixRounds === void 0 ? DEFAULT_CONFIG.maxFixRounds : expectNonNegativeInt(raw.maxFixRounds, "maxFixRounds"),
		maxConsecutiveToolErrors: raw.maxConsecutiveToolErrors === void 0 ? DEFAULT_CONFIG.maxConsecutiveToolErrors : expectNonNegativeInt(raw.maxConsecutiveToolErrors, "maxConsecutiveToolErrors"),
		maxConsecutiveRequestErrors: raw.maxConsecutiveRequestErrors === void 0 ? DEFAULT_CONFIG.maxConsecutiveRequestErrors : expectNonNegativeInt(raw.maxConsecutiveRequestErrors, "maxConsecutiveRequestErrors"),
		maxIdenticalErrorRetries: raw.maxIdenticalErrorRetries === void 0 ? DEFAULT_CONFIG.maxIdenticalErrorRetries : expectNonNegativeInt(raw.maxIdenticalErrorRetries, "maxIdenticalErrorRetries"),
		maxWallTimeMinutes: raw.maxWallTimeMinutes === void 0 ? DEFAULT_CONFIG.maxWallTimeMinutes : expectNonNegativeInt(raw.maxWallTimeMinutes, "maxWallTimeMinutes"),
		maxInputTokens: raw.maxInputTokens === void 0 ? DEFAULT_CONFIG.maxInputTokens : expectNonNegativeOrNull(raw.maxInputTokens, "maxInputTokens"),
		maxOutputTokensTotal: raw.maxOutputTokensTotal === void 0 ? DEFAULT_CONFIG.maxOutputTokensTotal : expectNonNegativeOrNull(raw.maxOutputTokensTotal, "maxOutputTokensTotal"),
		maxSessionCost: raw.maxSessionCost === void 0 ? DEFAULT_CONFIG.maxSessionCost : expectNonNegativeOrNull(raw.maxSessionCost, "maxSessionCost"),
		hardBudgetEnforcement: raw.hardBudgetEnforcement === void 0 ? DEFAULT_CONFIG.hardBudgetEnforcement : expectBoolean(raw.hardBudgetEnforcement, "hardBudgetEnforcement")
	};
	if (config.warnAtPercent >= config.compactAtPercent) throw new TypeError("warnAtPercent must be strictly less than compactAtPercent");
	return config;
}
//#endregion
//#region lib/types/model-match.js
/**
* Provider/model route matching. The plugin only activates Sol behavior when
* the current route matches the configured provider and model patterns; any
* other model (DeepSeek, Claude, another GPT) is left untouched.
*/
/**
* Compile a glob-ish pattern to a case-insensitive anchored RegExp. Only `*`
* is treated as a wildcard; all other characters are literal.
*
* @param pattern Raw pattern.
* @returns An anchored case-insensitive RegExp.
*/
function globToRegExp(pattern) {
	const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
	return new RegExp(`^(?:${escaped})$`, "i");
}
/**
* Match one value against one pattern. Empty or `*` matches anything; a `*`
* wildcard is expanded; otherwise the match is case-insensitive exact or
* substring (so `gpt-5.6` also matches `gpt-5.6-sol`).
*
* @param value The concrete value (provider route or model id).
* @param pattern The configured pattern.
* @returns Whether the value matches.
*/
function matchesPattern(value, pattern) {
	const p = pattern.trim();
	if (p === "" || p === "*") return true;
	const v = value.trim().toLowerCase();
	const needle = p.toLowerCase();
	if (p.includes("*")) return globToRegExp(p).test(v);
	return v === needle || v.includes(needle);
}
/**
* Whether a model id matches any configured model pattern. An empty pattern
* list matches nothing (fail closed).
*
* @param model The model id to test.
* @param patterns The configured model patterns.
* @returns Whether the model matches.
*/
function matchesAnyModel(model, patterns) {
	if (patterns.length === 0) return false;
	return patterns.some((pattern) => matchesPattern(model, pattern));
}
/**
* Whether a provider route matches the configured provider pattern.
*
* @param provider The provider route key.
* @param providerPattern The configured provider pattern.
* @returns Whether the provider matches.
*/
function matchesProvider(provider, providerPattern) {
	return matchesPattern(provider, providerPattern);
}
/**
* Whether the current (provider, model) route is a Sol route under the given
* configuration. This is the single gate for every Sol-specific behavior.
*
* @param provider The provider route key.
* @param model The model id.
* @param config The resolved configuration.
* @returns Whether the route is a Sol route.
*/
function isSolRoute(provider, model, config) {
	if (!config.enabled) return false;
	if (!matchesProvider(provider, config.providerPattern)) return false;
	return matchesAnyModel(model, config.modelPatterns);
}
//#endregion
//#region lib/types/modes.js
/**
* Task-mode definitions and reasoning-effort selection. Modes only supply
* defaults: a user's explicit reasoning selection always wins (the adapter
* applies that override in index.ts).
*/
const MODES = {
	auto: {
		id: "auto",
		label: "Auto",
		reasoningTarget: null,
		requiresConfirmation: false,
		description: "Classify each new task once, then execute through workflow phases."
	},
	balanced: {
		id: "balanced",
		label: "Balanced",
		reasoningTarget: "medium",
		requiresConfirmation: false,
		description: "Default mode: ordinary Q&A and small edits, lower latency."
	},
	coding: {
		id: "coding",
		label: "Coding",
		reasoningTarget: "high",
		requiresConfirmation: false,
		description: "Check project rules, edit with file tools, run tests, review diff and results."
	},
	frontend: {
		id: "frontend",
		label: "Frontend",
		reasoningTarget: "high",
		requiresConfirmation: false,
		description: "Visual hierarchy, responsive layout, interaction, accessibility, browser acceptance."
	},
	review: {
		id: "review",
		label: "Review",
		reasoningTarget: "high",
		requiresConfirmation: false,
		description: "Read-only: report issues with file/line, separate confirmed/possible/false-positive."
	},
	"deep-analysis": {
		id: "deep-analysis",
		label: "Deep Analysis",
		reasoningTarget: "xhigh",
		requiresConfirmation: false,
		description: "Novels, architecture, research, complex plans; parallel sub-agents; fact/inference/advice split."
	},
	max: {
		id: "max",
		label: "Max",
		reasoningTarget: "max",
		requiresConfirmation: true,
		description: "Maximum reasoning; latency/token/cost risk; explicit user choice only."
	},
	pro: {
		id: "pro",
		label: "Pro",
		reasoningTarget: null,
		requiresConfirmation: true,
		description: "Only when the relay route exposes a pro reasoning mode; independently configured."
	}
};
/** Ordered reasoning-effort ids, low to high (matches the pi-ai effort set). */
const REASONING_ORDER = [
	"off",
	"minimal",
	"low",
	"medium",
	"high",
	"xhigh",
	"max"
];
/** The reasoning target for a mode, or null when the mode leaves it unset. */
function reasoningTargetFor(mode) {
	return MODES[mode].reasoningTarget;
}
/** Whether a mode requires explicit user confirmation before it applies. */
function requiresConfirmation(mode) {
	return MODES[mode].requiresConfirmation;
}
/**
* Resolve a target effort against the exact-model supported set, falling back
* to the closest lower supported effort, then to the adapter default. Returns
* undefined only when no effort should be sent at all.
*
* @param target The mode's desired effort, or null for "no override".
* @param supported The exact-model supported effort ids.
* @param defaultEffort The adapter-configured default effort, when any.
* @returns The effort to apply, or undefined to leave the provider default.
*/
function availableReasoningEffort(target, supported, defaultEffort) {
	if (target === null) return defaultEffort;
	if (supported.includes(target)) return target;
	const index = REASONING_ORDER.indexOf(target);
	if (index >= 0) for (let i = index - 1; i >= 0; i--) {
		const candidate = REASONING_ORDER[i];
		if (candidate !== void 0 && supported.includes(candidate)) return candidate;
	}
	return defaultEffort;
}
/**
* Resolve the `agent/request` overrides for one request, purely.
*
* Compatibility-first rules:
*
*  - Reasoning is only written when ALL of: (a) the user opted in via the
*    `applyReasoningOverrides` config, (b) the user explicitly selected a mode,
*    and (c) the base request carries no reasoning effort. Once any reasoning
*    value exists it is never overridden, so first requests, tool-continuation
*    rounds, and user overrides stay byte-stable. A catalog model id is never
*    treated as proof that a custom relay honors reasoning_effort: opt-in is
*    explicit, and the route must still declare the target effort.
*  - `maxTokens` is only written when the user configured a positive cap AND the
*    base request has none. An existing cap (from the harness or the user) is
*    never overridden.
*
* @param input The request, mode, and policy inputs.
* @returns The overrides to apply.
*/
function resolveRequestOverrides(input) {
	const { base, mode, modeExplicitlySelected, applyReasoningOverrides, supportedEfforts, configuredMaxOutputTokens } = input;
	let reasoningEffort = base.reasoningEffort;
	let appliedEffort = base.reasoningEffort;
	if (applyReasoningOverrides && modeExplicitlySelected && base.reasoningEffort === void 0) {
		const target = reasoningTargetFor(mode);
		if (target !== null) {
			const chosen = availableReasoningEffort(target, supportedEfforts);
			reasoningEffort = chosen;
			appliedEffort = chosen;
		}
	}
	let maxTokens = base.maxTokens;
	if (configuredMaxOutputTokens > 0 && base.maxTokens === void 0) maxTokens = configuredMaxOutputTokens;
	return {
		reasoningEffort,
		maxTokens,
		appliedEffort
	};
}
/** The initial policy state for a fresh agent. */
function initialModeState(defaultMode) {
	return {
		mode: defaultMode,
		modeExplicitlySelected: false,
		appliedEffort: void 0
	};
}
/** Mark a mode as explicitly selected by the user; clears any tracked effort. */
function selectModeState(state, mode) {
	state.mode = mode;
	state.modeExplicitlySelected = true;
	state.appliedEffort = void 0;
}
/** Restore the default (not-explicitly-selected) policy state. */
function resetModeState(state, defaultMode) {
	state.mode = defaultMode;
	state.modeExplicitlySelected = false;
	state.appliedEffort = void 0;
}
//#endregion
//#region lib/types/prompt.js
/**
* Sol-specific system-prompt section text. Deliberately short: it restates the
* Sol operating policy in terse directives and adds one or two mode lines. It
* never copies OpenAI's official documentation at length.
*/
const COMMON_DIRECTIVES = [
	"Follow each instruction exactly once; do not restate or repeat directives.",
	"Expose and use only tools relevant to the current task.",
	"Keep three scopes distinct: answer (explain only), diagnose (investigate and report, change nothing), modify (implement and verify).",
	"Modification tasks implement directly and verify; diagnosis tasks never modify files.",
	"Confirm before external writes, deletion, publishing, or high-cost actions.",
	"Ask for concrete success criteria instead of \"as detailed as possible\".",
	"Do not print a full implementation draft before starting; write and verify each phase as you go.",
	"Do not repeat a tool call that already succeeded.",
	"On failure, diagnose the cause before retrying; never blindly retry.",
	"Make the final answer match the actual files, diffs, and test results."
];
const MODE_DIRECTIVES = {
	auto: ["Classify the new task once, then follow inspect, implement, verify, review, fix, and complete or blocked phases.", "Only verification evidence may authorize completion; never treat a natural-language completion claim as evidence."],
	balanced: ["Prefer low-latency, concise work for ordinary questions and small edits."],
	coding: ["Check project rules first, then edit files directly with file tools.", "Run tests as you implement; review the diff and test results before finishing."],
	frontend: ["Prioritize visual hierarchy, responsive layout, interaction, and accessibility.", "After changes, start the local page and perform browser acceptance: check console errors and common resolutions."],
	review: [
		"Read-only by default: report issues first; do not modify files.",
		"Give a file path and line number for every finding.",
		"Separate confirmed problems, possible problems, and false positives."
	],
	"deep-analysis": [
		"For novels, architecture, research, and complex plans; parallel sub-agents are allowed, but file writes and command execution remain disabled.",
		"Separate fact, inference, and recommendation.",
		"Never reach a conclusion without evidence."
	],
	max: ["Maximum-effort reasoning is active; prioritize correctness and completeness over latency."],
	pro: ["Professional-effort reasoning is active."]
};
/**
* Render the Sol policy prompt section for a mode. Returned text is stable for
* a given mode (prefix-cache friendly).
*
* @param mode The active task mode.
* @returns The short policy text.
*/
function solPromptSection(mode) {
	return "GPT-5.6-Sol operating policy:\n" + [...COMMON_DIRECTIVES, ...MODE_DIRECTIVES[mode]].map((line) => `- ${line}`).join("\n");
}
//#endregion
//#region lib/types/tool-policy.js
const WRITE_TOOLS = [
	"write",
	"edit",
	"str_replace_editor"
];
const SHELL_TOOLS = ["bash", "pwsh"];
const TERMINAL_TOOLS = [
	"terminal_open",
	"terminal_send",
	"terminal_signal",
	"terminal_close",
	"terminal_read",
	"terminal_list"
];
const SUBAGENT_TOOLS = [
	"subagent",
	"interrupt_agent",
	"send_message",
	"report",
	"ralph",
	"workflow"
];
const GOAL_WRITE_TOOLS = ["create_goal", "update_goal"];
const TODO_TOOLS = ["todo_write"];
const JOB_CONTROL_TOOLS = ["job_kill", "job_output"];
const CORDIS_TOOLS = [
	"cordis_define",
	"cordis_inspect_list",
	"cordis_inspect_query",
	"cordis_inspect_self",
	"cordis_run",
	"cordis_stop",
	"cordis_undefine"
];
const SCHEDULE_TOOLS = [
	"schedule_create",
	"schedule_delete",
	"schedule_list"
];
/** Every tool that can mutate the outside world; used by the enforcement guard. */
const MUTATING_TOOLS = [
	...WRITE_TOOLS,
	...SHELL_TOOLS,
	...TERMINAL_TOOLS,
	...SUBAGENT_TOOLS,
	...GOAL_WRITE_TOOLS,
	...TODO_TOOLS,
	...JOB_CONTROL_TOOLS,
	...CORDIS_TOOLS,
	...SCHEDULE_TOOLS
];
/**
* The deny set for a mode: tools removed from both visibility and execution.
* `coding`, `frontend`, `max`, and `pro` deny nothing (full tool set).
*
* @param mode The active task mode.
* @returns Tool names to deny.
*/
function deniedToolsForMode(mode) {
	switch (mode) {
		case "balanced": return [
			...SHELL_TOOLS,
			...TERMINAL_TOOLS,
			...SUBAGENT_TOOLS,
			...GOAL_WRITE_TOOLS,
			...JOB_CONTROL_TOOLS,
			...CORDIS_TOOLS,
			...SCHEDULE_TOOLS
		];
		case "review": return [
			...WRITE_TOOLS,
			...SHELL_TOOLS,
			...TERMINAL_TOOLS,
			...SUBAGENT_TOOLS,
			...GOAL_WRITE_TOOLS,
			...TODO_TOOLS,
			...JOB_CONTROL_TOOLS,
			...CORDIS_TOOLS,
			...SCHEDULE_TOOLS
		];
		case "deep-analysis": return [
			...WRITE_TOOLS,
			...SHELL_TOOLS,
			...TERMINAL_TOOLS,
			...GOAL_WRITE_TOOLS,
			...TODO_TOOLS,
			...JOB_CONTROL_TOOLS,
			...CORDIS_TOOLS,
			...SCHEDULE_TOOLS
		];
		case "coding":
		case "frontend":
		case "max":
		case "pro": return [];
		default: return [];
	}
}
/**
* Whether a tool name can mutate the outside world (used by the guard to
* enforce read-only modes even if a tool slips past the deny list).
*
* @param name The tool name.
* @returns Whether the tool is mutating.
*/
function isMutatingTool(name) {
	return MUTATING_TOOLS.includes(name);
}
/** Human-readable category labels, in display order. */
const CATEGORY_LABELS = [
	{
		id: "write",
		tools: WRITE_TOOLS
	},
	{
		id: "shell",
		tools: SHELL_TOOLS
	},
	{
		id: "terminal",
		tools: TERMINAL_TOOLS
	},
	{
		id: "subagent/workflow",
		tools: SUBAGENT_TOOLS
	},
	{
		id: "goal",
		tools: GOAL_WRITE_TOOLS
	},
	{
		id: "todo",
		tools: TODO_TOOLS
	},
	{
		id: "job control",
		tools: JOB_CONTROL_TOOLS
	},
	{
		id: "cordis",
		tools: CORDIS_TOOLS
	},
	{
		id: "schedule",
		tools: SCHEDULE_TOOLS
	}
];
/**
* The denied tool CATEGORIES for a mode (for `/sol status`). Empty when the
* mode denies nothing.
*
* @param mode The active task mode.
* @returns Category labels whose tools the mode denies.
*/
function deniedCategoriesForMode(mode) {
	const denied = deniedToolsForMode(mode);
	if (denied.length === 0) return [];
	return CATEGORY_LABELS.filter((category) => category.tools.some((tool) => denied.includes(tool))).map((category) => category.id);
}
//#endregion
//#region lib/types/context-policy.js
/**
* Context-window policy: occupancy classification and the compaction summary
* rule (keep the goal, constraints, key decisions, file edits, and unfinished
* tasks; drop verbose reasoning). Pure and dependency-free.
*/
/**
* Classify context occupancy against two ceilings:
*
*  - warn ceiling    = softLimit ?? window * warnAtPercent/100  ("remind")
*  - compact ceiling = hardLimit ?? window * compactAtPercent/100 ("delegate to
*    the harness compaction")
*
* When the exact-model window is unknown, only an explicit limit can produce a
* decision; otherwise the decision is 'ok' with a note that capacity is unknown
* (a ceiling is never fabricated from the model name).
*
* @param input Measured tokens plus policy knobs.
* @returns The decision.
*/
function contextDecision(input) {
	const window = input.contextWindow;
	const warnLimit = input.softLimit ?? (window !== null ? Math.floor(window * input.warnAtPercent / 100) : null);
	const compactLimit = input.hardLimit ?? (window !== null ? Math.floor(window * input.compactAtPercent / 100) : null);
	const percent = window !== null ? Math.round(input.surfaceTokens * 100 / window) : null;
	if (compactLimit !== null && input.surfaceTokens >= compactLimit) return {
		action: "compact",
		percent,
		warnLimit,
		compactLimit,
		detail: "at or above the compact ceiling; compaction required"
	};
	if (warnLimit !== null && input.surfaceTokens >= warnLimit) return {
		action: "warn",
		percent,
		warnLimit,
		compactLimit,
		detail: "at or above the warn ceiling"
	};
	return {
		action: "ok",
		percent,
		warnLimit,
		compactLimit,
		detail: window === null ? "model context window unknown; only token counts are shown" : "within limits"
	};
}
//#endregion
//#region lib/types/cost.js
/**
* Cost estimation over provider-reported usage. Relay prices are independent of
* OpenAI's official pricing and default to "unknown": when the user has not
* filled in prices, only token counts are shown and no currency amount is ever
* produced or implied.
*/
/**
* Whether a complete price set is known. Cached-input falls back to the input
* price when null, so only input and output prices are required.
*
* @param prices The price configuration.
* @returns Whether a cost amount can be computed.
*/
function pricesKnown(prices) {
	return prices.inputPricePerMillion !== null && prices.outputPricePerMillion !== null;
}
/**
* Compute a cost amount from usage and prices, or null when prices are unknown.
* Never falls back to any official price.
*
* @param usage The provider-reported usage.
* @param prices The price configuration.
* @returns The cost in the configured currency, or null when unknown.
*/
function computeCost(usage, prices) {
	if (!pricesKnown(prices)) return null;
	const inputPrice = prices.inputPricePerMillion;
	const cachedPrice = prices.cachedInputPricePerMillion ?? inputPrice;
	const outputPrice = prices.outputPricePerMillion;
	return (usage.inputTokens * inputPrice + usage.cachedInputTokens * cachedPrice + usage.outputTokens * outputPrice) / 1e6;
}
/**
* Compare a cost against the per-request and per-session budgets. A null budget
* is unlimited. A zero or negative accumulated value is treated as zero.
*
* @param requestCost The cost accumulated for the current request.
* @param sessionCost The cost accumulated for the whole session.
* @param requestBudget The per-request budget, or null.
* @param sessionBudget The per-session budget, or null.
* @returns The budget decision.
*/
function budgetDecision(requestCost, sessionCost, requestBudget, sessionBudget) {
	const withinRequest = requestBudget === null || requestCost <= requestBudget;
	const withinSession = sessionBudget === null || sessionCost <= sessionBudget;
	return {
		withinRequest,
		withinSession,
		exceeded: !withinRequest || !withinSession,
		requestBudget,
		sessionBudget
	};
}
//#endregion
//#region lib/types/commands.js
/**
* `/sol` command parsing and status/budget rendering. Pure, dependency-free;
* the adapter (index.ts) registers the actual command and feeds it live state.
*/
/**
* Parse a `/sol` raw input into a structured command.
*
* @param rawInput The bytes after `/sol`.
* @returns The parsed command.
*/
function parseSolCommand(rawInput) {
	const tokens = rawInput.trim().split(/\s+/).filter((t) => t.length > 0);
	if (tokens.length === 0) return { action: "status" };
	const [verb, arg, flag] = tokens;
	switch (verb) {
		case "status": return { action: "status" };
		case "mode": {
			const name = arg;
			const confirm = arg === "--confirm" || flag === "--confirm";
			const selectedName = name === "--confirm" ? void 0 : name;
			return {
				action: "mode",
				confirm,
				...selectedName === void 0 ? {} : { name: selectedName }
			};
		}
		case "phase": return { action: "phase" };
		case "workflow": return {
			action: "workflow",
			reset: arg === "reset"
		};
		case "capabilities": return { action: "capabilities" };
		case "budget": return { action: "budget" };
		case "verify": return { action: "verify" };
		case "review": return { action: "review" };
		case "reset": return { action: "reset" };
		case "confirm": return { action: "confirm" };
		default: return {
			action: "unknown",
			text: rawInput.trim()
		};
	}
}
/** Render workflow state without exposing request secrets. */
function renderWorkflow(w) {
	return [
		`Phase: ${w.phase}`,
		`Task scope: ${w.scope}`,
		`Workflow steps: ${w.steps}`,
		`Fix rounds: ${w.fixRounds}`,
		`Last error: ${w.lastError ?? "none"}`
	].join("\n");
}
/** Render exact route capabilities; unknown values remain unknown. */
function renderCapabilities(c) {
	return [
		`Source: ${c.source}`,
		`Protocol: ${c.protocol ?? "unknown"}`,
		`Image input: ${c.imageInput === null ? "unknown" : c.imageInput ? "yes" : "no"}`,
		`Reasoning efforts: ${c.reasoningEfforts.length === 0 ? "none declared" : c.reasoningEfforts.join(", ")}`,
		`Context window: ${c.contextWindow ?? "unknown"}`,
		`Max output tokens: ${c.maxOutputTokens || "provider default"}`
	].join("\n");
}
const BALANCED_HINT = "当前 balanced 模式禁用了终端执行；如需完整编码工作流，请执行 /sol mode coding。";
/** Render the `/sol status` body. Never includes keys or request headers. */
function renderStatus(s) {
	if (!s.enabled) return "Sol plugin is disabled.";
	if (!s.isSol) return `Sol plugin is enabled but inactive: current model "${s.model}" does not match the configured Sol model patterns.`;
	const modeLine = s.modeExplicitlySelected ? `Mode: ${s.mode} (${MODES[s.mode].label}, explicitly selected)` : `Mode: ${s.mode} (${MODES[s.mode].label}, default)`;
	const lines = [
		`Provider: ${s.provider}`,
		`Model: ${s.model}`,
		modeLine,
		`Reasoning: ${s.reasoning || "(provider default)"}`,
		`Reasoning overrides: ${s.reasoningOverridesEnabled ? "enabled" : "disabled"}`,
		...s.scope === void 0 ? [] : [
			`Task scope: ${s.scope}`,
			`Phase: ${s.phase ?? "unknown"}`,
			`Read-only: ${s.readOnly ? "yes" : "no"}`,
			`Allows implementation: ${s.allowsImplementation ? "yes" : "no"}`,
			`Can report complete: ${s.canReportComplete ? "yes" : "no"}`
		],
		`Context soft limit: ${s.contextSoftLimit === null ? "derived" : s.contextSoftLimit}`,
		`Context hard limit: ${s.contextHardLimit === null ? "derived" : s.contextHardLimit}`,
		`Session surface tokens: ${s.surfaceTokens}`,
		`Session cost: ${s.pricesKnown ? String(s.sessionCost) : "unknown (prices not configured)"}`,
		`Denied tool categories: ${s.deniedCategories.length === 0 ? "none" : s.deniedCategories.join(", ")}`,
		`Denied tools: ${s.deniedTools.length === 0 ? "none" : s.deniedTools.join(", ")}`
	];
	if (s.mode === "balanced") lines.push(BALANCED_HINT);
	return lines.join("\n");
}
/** Render the `/sol budget` body. Shows tokens always, currency only if priced. */
function renderBudget(b) {
	if (!b.isSol) return "Sol plugin is inactive for the current model; no budget is tracked.";
	const lines = [
		...b.workflowSteps === void 0 ? [] : [
			`Workflow steps: ${b.workflowSteps}`,
			`Fix rounds: ${b.fixRounds ?? 0}/${b.maxFixRounds ?? "?"}`,
			`Tool errors: ${b.toolErrors ?? 0}`,
			`Request errors: ${b.requestErrors ?? 0}`,
			`Elapsed minutes: ${b.elapsedMinutes ?? 0}`
		],
		`Input tokens: ${b.inputTokens}`,
		`Cached input tokens: ${b.cachedInputTokens}`,
		`Output tokens: ${b.outputTokens}`
	];
	if (!b.pricesKnown) lines.push("Cost: unknown — relay prices are not configured; refer to your relay billing for amounts.");
	else {
		lines.push(`Request cost: ${String(b.requestCost)}`);
		lines.push(`Session cost: ${String(b.sessionCost)}`);
		lines.push(`Per-request budget: ${b.requestBudget === null ? "unlimited" : String(b.requestBudget)} (${b.withinRequest ? "ok" : "exceeded"})`);
		lines.push(`Per-session budget: ${b.sessionBudget === null ? "unlimited" : String(b.sessionBudget)} (${b.withinSession ? "ok" : "exceeded"})`);
	}
	return lines.join("\n");
}
//#endregion
//#region lib/types/task-profile.js
const MODIFY_WORDS = /\b(add|build|change|create|edit|fix|implement|modify|refactor|remove|update|write|修复|实现|修改|创建|添加|删除|重构|更新|编写)\b/i;
const DIAGNOSE_WORDS = /\b(analy[sz]e|check|diagnos[ei]s|find out|investigate|inspect|why|检查|诊断|排查|分析原因|报告问题)\b/i;
const REVIEW_WORDS = /(?:\b(?:code review|review|review the diff)\b|审查|评审)/i;
const FRONTEND_WORDS = /(?:\b(?:frontend|front-end|web page|website|UI|UX|CSS|HTML|React|Vite)\b|网页|前端|页面|界面)/i;
const DEEP_WORDS = /\b(novel|research|architecture|architectural|complex design|论文|小说|研究|架构|复杂方案)\b/i;
const EXTERNAL_RISK = /\b(delete|publish|deploy|buy|purchase|send|upload|release|删除|发布|部署|购买|上传)\b/i;
const READ_ONLY_INTENT = /(?:只\s*(?:检查|审查|分析|报告)|不要\s*(?:修改|改|写)|不(?:要|需)\s*(?:修改|改|写)|without\s+(?:changing|editing|writing)|do\s+not\s+(?:change|edit|write)|read[- ]only)/i;
const STRONG_MODIFY = /(?:修复|实现|创建|修改|删除|重构|更新|添加|编写|\b(?:fix|implement|create|modify|refactor|remove|update|add|write)\b)/i;
/**
* Classify a task without model calls. Explicit mode always wins over auto.
* @param request Current user request.
* @param explicitMode User-selected mode, when locked for this task.
* @returns A stable profile suitable for workflow initialization.
*/
function classifyTask(request, explicitMode) {
	if (explicitMode !== void 0 && explicitMode !== "auto") return {
		scope: explicitMode === "review" ? "review" : explicitMode === "frontend" ? "frontend" : explicitMode === "deep-analysis" ? "deep-analysis" : explicitMode === "coding" || explicitMode === "max" || explicitMode === "pro" ? "modify" : "answer",
		mode: explicitMode,
		explicit: true,
		reason: "user-selected mode",
		requiresConfirmation: EXTERNAL_RISK.test(request)
	};
	const trimmed = request.trim();
	const readOnly = READ_ONLY_INTENT.test(trimmed);
	const diagnostic = DIAGNOSE_WORDS.test(trimmed);
	const modifying = STRONG_MODIFY.test(trimmed) || MODIFY_WORDS.test(trimmed);
	const scope = readOnly && REVIEW_WORDS.test(trimmed) ? "review" : readOnly ? "diagnose" : STRONG_MODIFY.test(trimmed) ? FRONTEND_WORDS.test(trimmed) ? "frontend" : "modify" : REVIEW_WORDS.test(trimmed) ? "review" : FRONTEND_WORDS.test(trimmed) && modifying ? "frontend" : DEEP_WORDS.test(trimmed) ? "deep-analysis" : modifying && !diagnostic ? "modify" : diagnostic ? "diagnose" : "answer";
	return {
		scope,
		mode: scope === "frontend" ? "frontend" : scope === "review" ? "review" : scope === "deep-analysis" ? "deep-analysis" : scope === "modify" ? "coding" : "balanced",
		explicit: false,
		reason: `matched ${scope} task signals`,
		requiresConfirmation: EXTERNAL_RISK.test(trimmed)
	};
}
//#endregion
//#region lib/types/workflow.js
const TRANSITIONS = {
	idle: ["inspect"],
	inspect: [
		"implement",
		"verify",
		"blocked"
	],
	implement: ["verify", "blocked"],
	verify: [
		"review",
		"fix",
		"blocked"
	],
	review: [
		"complete",
		"fix",
		"blocked"
	],
	fix: ["verify", "blocked"],
	complete: [],
	blocked: []
};
/** Create the initial state; auto profiles always begin at inspect. */
function createWorkflow(profile, maxFixRounds = 2) {
	if (!Number.isInteger(maxFixRounds) || maxFixRounds < 0) throw new TypeError("maxFixRounds must be a non-negative integer");
	return {
		profile,
		phase: "inspect",
		steps: 0,
		fixRounds: 0,
		maxFixRounds,
		evidence: [],
		lastError: null
	};
}
/** Return whether a transition is structurally allowed and evidence-backed. */
function canTransition(state, next, evidence) {
	if (!TRANSITIONS[state.phase].includes(next)) return false;
	if (next === "implement" && state.profile.scope !== "modify" && state.profile.scope !== "frontend") return false;
	if (next === "complete" && (evidence?.kind !== "review" || evidence.passed !== true)) return false;
	if (next === "fix" && state.fixRounds >= state.maxFixRounds) return false;
	if (next === "verify" && state.phase === "fix" && state.fixRounds >= state.maxFixRounds) return false;
	return evidence !== void 0;
}
/** Apply one validated transition and append its reason to the evidence log. */
function transition(state, next, evidence) {
	if (!canTransition(state, next, evidence)) throw new Error(`Invalid workflow transition ${state.phase} -> ${next}.`);
	const fixRounds = next === "fix" ? state.fixRounds + 1 : state.fixRounds;
	return {
		...state,
		phase: next,
		steps: state.steps + 1,
		fixRounds,
		lastError: evidence.passed === false ? evidence.detail : state.lastError,
		evidence: [...state.evidence, evidence]
	};
}
/** Convert a failure into the next legal action without hiding it. */
function failureTransition(state, detail) {
	if (state.phase === "verify" && state.fixRounds < state.maxFixRounds) return {
		next: "fix",
		evidence: {
			kind: "failure",
			detail,
			passed: false
		}
	};
	return {
		next: "blocked",
		evidence: {
			kind: "blocked",
			detail,
			passed: false
		}
	};
}
//#endregion
//#region lib/types/capabilities.js
/** Resolve capabilities from explicit config, exact route metadata, then conservative defaults. */
function resolveCapabilities(route, overrides = {}) {
	const hasUser = Object.keys(overrides).length > 0;
	const reasoningEfforts = overrides.reasoningEfforts ?? route?.reasoning?.efforts.map((e) => String(e.id)) ?? [];
	return {
		protocol: overrides.protocol ?? null,
		imageInput: overrides.imageInput ?? (route === void 0 ? null : route.inputModalities?.includes("image") ?? false),
		reasoningEfforts,
		reasoningModePro: overrides.reasoningModePro ?? false,
		persistedReasoning: overrides.persistedReasoning ?? null,
		programmaticToolCalling: overrides.programmaticToolCalling ?? null,
		multiAgent: overrides.multiAgent ?? null,
		toolContinuation: overrides.toolContinuation ?? null,
		contextWindow: overrides.contextWindow ?? route?.context?.contextWindow ?? null,
		maxOutputTokens: overrides.maxOutputTokens ?? route?.defaultMaxTokens ?? 0,
		source: hasUser ? "user" : route === void 0 ? "conservative-default" : "route"
	};
}
Object.freeze({
	maxWorkflowSteps: 40,
	maxFixRounds: 2,
	maxConsecutiveToolErrors: 4,
	maxConsecutiveRequestErrors: 4,
	maxIdenticalErrorRetries: 1,
	maxWallTimeMinutes: 20,
	maxInputTokens: null,
	maxOutputTokensTotal: null,
	maxSessionCost: null,
	hardBudgetEnforcement: false
});
/** Decide whether the workflow may continue; false only hard-stops when enabled. */
function evaluateBudget(budget, usage) {
	const exceeded = [
		["workflow steps", usage.steps >= budget.maxWorkflowSteps],
		["fix rounds", usage.fixRounds >= budget.maxFixRounds],
		["consecutive tool errors", usage.consecutiveToolErrors >= budget.maxConsecutiveToolErrors],
		["wall time", usage.elapsedMinutes >= budget.maxWallTimeMinutes],
		["input tokens", budget.maxInputTokens !== null && usage.inputTokens >= budget.maxInputTokens],
		["output tokens", budget.maxOutputTokensTotal !== null && usage.outputTokens >= budget.maxOutputTokensTotal],
		["session cost", budget.maxSessionCost !== null && usage.sessionCost !== null && usage.sessionCost >= budget.maxSessionCost]
	].filter(([, hit]) => hit).map(([name]) => name);
	if (exceeded.length === 0) return {
		allowed: true,
		hardStop: false,
		warnings: [],
		reason: null
	};
	const reason = `Budget limit reached: ${exceeded.join(", ")}.`;
	return {
		allowed: !budget.hardBudgetEnforcement,
		hardStop: budget.hardBudgetEnforcement,
		warnings: budget.hardBudgetEnforcement ? [] : [reason],
		reason
	};
}
//#endregion
//#region lib/types/effective-policy.js
const READ_ONLY_SCOPES = new Set([
	"answer",
	"diagnose",
	"review",
	"deep-analysis"
]);
const IMPLEMENTATION_MODES = new Set([
	"auto",
	"coding",
	"frontend",
	"max",
	"pro"
]);
/** Derive every tool and workflow permission from one mode/scope/phase tuple. */
function resolveEffectivePolicy(input) {
	const readOnly = READ_ONLY_SCOPES.has(input.scope) || input.mode === "review" || input.mode === "deep-analysis";
	const allowsImplementation = !readOnly && IMPLEMENTATION_MODES.has(input.mode) && (input.scope === "modify" || input.scope === "frontend") && input.phase !== "complete" && input.phase !== "blocked";
	const deniedTools = readOnly ? deniedToolsForMode(input.mode === "deep-analysis" ? "deep-analysis" : "review") : deniedToolsForMode(input.mode);
	return {
		...input,
		readOnly,
		deniedTools,
		deniedCategories: deniedCategoriesForMode(readOnly ? "review" : input.mode),
		allowsImplementation
	};
}
//#endregion
//#region lib/types/verify.js
/**
* Independent verification workflow (sol_verify). Pure assessment over an
* evidence record gathered by read-only tools; the adapter (index.ts) wires the
* evidence from the real filesystem/diff/test/build state. The assessor never
* reports "done" unless every check passes.
*/
/** Collect conservative verification facts from paired, post-task tool events. */
function collectVerificationEvidence(input) {
	const results = new Map(input.results.map((result) => [result.callId, result]));
	const paired = input.calls.filter((call) => results.has(call.callId));
	const successful = paired.filter((call) => results.get(call.callId)?.errorCode === void 0);
	const failed = input.results.filter((result) => result.errorCode !== void 0).map((result) => result.errorCode ?? "tool failure");
	const names = (call) => `${call.name} ${call.arguments}`.toLowerCase();
	const testCalls = paired.filter((call) => /test|vitest|jest/.test(names(call)));
	const buildCalls = paired.filter((call) => /build|tsc|typecheck|lint|compile/.test(names(call)));
	const diffCalls = paired.filter((call) => /git diff|diff|status/.test(names(call)));
	const browserCalls = successful.filter((call) => /browser|playwright|screenshot/.test(names(call)));
	const testResults = testCalls.map((call) => results.get(call.callId));
	const buildResults = buildCalls.map((call) => results.get(call.callId));
	const diffResults = diffCalls.map((call) => results.get(call.callId));
	const browserResults = browserCalls.map((call) => results.get(call.callId));
	const fileCalls = successful.filter((call) => /^(read|read_image|write|edit|str_replace_editor)$/.test(call.name));
	const files = fileCalls.map((call) => {
		let args = {};
		try {
			args = JSON.parse(call.arguments);
		} catch {}
		const path = typeof args.file_path === "string" ? args.file_path : typeof args.path === "string" ? args.path : call.name;
		const result = results.get(call.callId);
		return {
			path,
			exists: result?.meta?.exists === true,
			authorized: result?.meta?.authorized === true
		};
	});
	const diffInspected = diffCalls.length > 0;
	const testsRan = testCalls.length > 0;
	const buildRan = buildCalls.length > 0;
	const authorizationKnown = fileCalls.every((call) => {
		const meta = results.get(call.callId)?.meta;
		return typeof meta?.exists === "boolean" && typeof meta.authorized === "boolean";
	});
	const commandResultsKnown = [...testResults, ...buildResults].every((result) => typeof result?.meta?.exitCode === "number");
	const testsPassed = testsRan && testResults.every((result) => result?.meta?.exitCode === 0);
	const buildPassed = buildRan && buildResults.every((result) => result?.meta?.exitCode === 0);
	const diffOnlyRelevant = diffInspected && diffResults.every((result) => result?.meta?.diffOnlyRelevant === true);
	const browserAcceptance = browserCalls.length > 0 && browserResults.every((result) => result?.meta?.browserAccepted === true);
	const unexplainedFailures = [...failed, ...input.providerFailures ?? []];
	return {
		goalCompleted: false,
		files,
		diffOnlyRelevant,
		authorizationKnown,
		commandResultsKnown,
		diffInspected,
		testsRan,
		testsPassed,
		buildRan,
		buildPassed,
		webTask: input.webTask,
		browserAcceptance,
		claimsExaggerated: false,
		unexplainedFailures,
		credentialsLeaked: input.calls.some((call) => looksLikeCredentialLeak(call.arguments)) || input.results.some((result) => looksLikeCredentialLeak(result.errorCode ?? ""))
	};
}
const CREDENTIAL_PATTERN = /((api[_-]?key|authorization|secret|token|password)\s*[:=]\s*\S{8,})|(bearer\s+[a-z0-9._-]{12,})/i;
/**
* Detect likely credential leakage in a free-text surface. Conservative: it
* only flags explicit key-like assignments, not any occurrence of the word.
*
* @param text The text to scan.
* @returns Whether a credential leak is likely.
*/
function looksLikeCredentialLeak(text) {
	return CREDENTIAL_PATTERN.test(text);
}
/**
* Assess a verification evidence record against the ten Sol checks.
*
* @param evidence The gathered evidence.
* @returns A structured verdict; `passed` is false unless every check passes.
*/
function assessVerification(evidence) {
	const checks = [];
	checks.push({
		id: "goal",
		label: "User goal completed",
		pass: evidence.goalCompleted,
		detail: evidence.goalCompleted ? "goal reported complete" : "goal not completed"
	});
	const missingFiles = evidence.files.filter((f) => !f.exists);
	const unauthorizedFiles = evidence.files.filter((f) => !f.authorized);
	checks.push({
		id: "files",
		label: "Target files exist and are authorized",
		pass: missingFiles.length === 0 && unauthorizedFiles.length === 0,
		detail: missingFiles.length > 0 ? `missing: ${missingFiles.map((f) => f.path).join(", ")}` : unauthorizedFiles.length > 0 ? `outside authorized dir: ${unauthorizedFiles.map((f) => f.path).join(", ")}` : "all target files present and authorized"
	});
	checks.push({
		id: "diff",
		label: "Diff contains only relevant changes",
		pass: evidence.diffOnlyRelevant,
		detail: evidence.diffInspected ? evidence.diffOnlyRelevant ? "diff is scoped" : "diff contains unrelated changes" : "no diff inspected"
	});
	checks.push({
		id: "tests",
		label: "Tests actually ran and passed",
		pass: evidence.testsRan && evidence.testsPassed,
		detail: !evidence.testsRan ? "tests did not run" : evidence.testsPassed ? "tests passed" : "tests failed"
	});
	checks.push({
		id: "build",
		label: "Build actually ran and passed",
		pass: evidence.buildRan && evidence.buildPassed,
		detail: !evidence.buildRan ? "build did not run" : evidence.buildPassed ? "build passed" : "build failed"
	});
	checks.push({
		id: "browser",
		label: "Web task browser acceptance",
		pass: !evidence.webTask || evidence.browserAcceptance,
		detail: evidence.webTask ? evidence.browserAcceptance ? "browser acceptance done" : "browser acceptance missing" : "not a web task"
	});
	checks.push({
		id: "claims",
		label: "Completion not overstated",
		pass: !evidence.claimsExaggerated,
		detail: evidence.claimsExaggerated ? "completion overstated" : "completion stated accurately"
	});
	checks.push({
		id: "failures",
		label: "No unexplained failures",
		pass: evidence.unexplainedFailures.length === 0,
		detail: evidence.unexplainedFailures.length > 0 ? `undisclosed: ${evidence.unexplainedFailures.join("; ")}` : "no undisclosed failures"
	});
	checks.push({
		id: "credentials",
		label: "No credential leakage",
		pass: !evidence.credentialsLeaked,
		detail: evidence.credentialsLeaked ? "credentials appear leaked" : "no credentials found"
	});
	checks.push({
		id: "authorization-evidence",
		label: "Authorization facts are known",
		pass: evidence.authorizationKnown === true,
		detail: evidence.authorizationKnown === true ? "authorization facts supplied by host" : "host did not supply authorization facts"
	});
	checks.push({
		id: "command-evidence",
		label: "Command results are structured",
		pass: evidence.commandResultsKnown === true,
		detail: evidence.commandResultsKnown === true ? "structured exit results supplied" : "structured exit results unavailable"
	});
	const passed = checks.every((check) => check.pass);
	const failures = checks.filter((check) => !check.pass).map((check) => `${check.label}: ${check.detail}`);
	const unauthorizedChanges = unauthorizedFiles.map((file) => file.path);
	const blocked = evidence.unexplainedFailures.some((item) => /quota|insufficient balance|credential|permission/i.test(item));
	const status = passed ? "PASS" : blocked ? "BLOCKED" : !evidence.testsRan || !evidence.buildRan || !evidence.diffInspected ? "INCOMPLETE" : "FAIL";
	return {
		passed,
		status,
		checks,
		summary: passed ? "All checks passed." : `${status}: ${failures.join("; ")}.`,
		requirements: checks.map((check) => `${check.pass ? "PASS" : "FAIL"} ${check.label}`),
		failures,
		unauthorizedChanges,
		requiredNextAction: passed ? "No further action." : evidence.testsRan && !evidence.testsPassed ? "Fix failing tests, then rerun verification." : "Collect the missing evidence and rerun verification.",
		canReportComplete: passed
	};
}
//#endregion
//#region lib/types/preflight.js
/** Classify a spawn or command failure without relying on a platform-specific message alone. */
function classifyFailure(error, context = {}) {
	const text = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
	if (/quota|insufficient balance|billing|credit/.test(text)) return "quota";
	const spawnEnoent = /executable.*enoent|spawn .*enoent/.test(text);
	if (context.executableExists === false || spawnEnoent && context.cwdExists !== false) return "executable-enoent";
	const cwdEnoent = /cwd.*enoent|working directory|no such file or directory/.test(text);
	if (context.cwdExists === false || cwdEnoent && context.executableExists === true) return "cwd-enoent";
	if (/permission denied|eacces|eperm|access is denied/.test(text)) return "permission-denied";
	if (/module not found|cannot find package|dependency/.test(text)) return "dependency-missing";
	if (/test|vitest|jest/.test(`${context.command ?? ""} ${text}`) && !/build/.test(context.command ?? "")) return "test-failure";
	if (/build|tsc|compile/.test(`${context.command ?? ""} ${text}`)) return "build-failure";
	if (/network|timeout|econn|fetch/.test(text) || error.status !== void 0 && error.status >= 500) return "network-failure";
	if (/protocol|invalid response|unsupported request/.test(text)) return "provider-protocol-failure";
	if (/enoent|not found/.test(text)) return "file-not-found";
	return "unknown";
}
/** Retry policy: identical errors once; quota and permanent protocol errors never retry. */
function retryDecision(failure, identicalRetries, consecutiveErrors, maxIdenticalRetries = 1, maxConsecutiveErrors = 4) {
	if (failure === "quota" || failure === "provider-protocol-failure" || failure === "permission-denied") return "stop";
	if (identicalRetries >= maxIdenticalRetries || consecutiveErrors >= maxConsecutiveErrors) return "stop";
	return "retry";
}
//#endregion
//#region lib/types/index.js
/**
* GPT-5.6-Sol companion plugin — harness adapter.
*
* Every behavior rides a public extension point and nothing else:
*   - Sol prompt policy      -> `ctx.systemPrompt.section()` (conditional)
*   - reasoning/max-token    -> `agent/request` waterfall
*   - tool-set policy        -> `agent.ctx.tools.restrict()` (visibility) +
*                              `ctx.tools.guard()` (backend enforcement)
*   - task modes + commands  -> `ctx.commands.register()` (`/sol …`)
*   - configuration          -> `ctx.settings.register()` (schema-driven UI)
*   - context/cost tracking  -> `session/event` usage + optional `ctx.tokenMeter`
*
* The plugin never registers a provider, makes no HTTP request, and never reads
* an API key. It only inspects the route the relay provider already serves.
*/
const name = "gpt56-sol-kit";
/** Core services every agent composition provides; nothing optional here. */
const inject = ["systemPrompt", "tools"];
/** Settings namespace id (lowercase kebab). */
const SETTINGS_NS = settingsNamespace("gpt56-sol-kit");
/** Prompt section order: after persona (0), before tool guidance (100–199). */
const SECTION_ORDER = 40;
/** Resolve the exact-model reasoning/context metadata, cached per route. */
function routeKey(provider, model) {
	return `${provider}\u0000${model}`;
}
const WORKFLOW_PHASES = new Set([
	"idle",
	"inspect",
	"implement",
	"verify",
	"review",
	"fix",
	"complete",
	"blocked"
]);
const TASK_SCOPES = new Set([
	"answer",
	"diagnose",
	"modify",
	"review",
	"frontend",
	"deep-analysis"
]);
const EVIDENCE_KINDS = new Set([
	"inspection",
	"implementation",
	"verification",
	"review",
	"failure",
	"blocked"
]);
function finiteNonNegative(value) {
	return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
function isValidPersistedState(value) {
	const workflow = value.workflow;
	const profile = workflow?.profile;
	const evidence = workflow?.evidence;
	const validEvidence = Array.isArray(evidence) && evidence.every((item) => {
		const record = item;
		return record !== null && EVIDENCE_KINDS.has(String(record.kind)) && typeof record.detail === "string" && (record.passed === void 0 || typeof record.passed === "boolean");
	});
	return value.schemaVersion === 2 && isSolMode(value.mode) && typeof value.modeExplicitlySelected === "boolean" && workflow !== void 0 && WORKFLOW_PHASES.has(String(workflow.phase)) && profile !== void 0 && TASK_SCOPES.has(String(profile.scope)) && isSolMode(profile.mode) && typeof profile.explicit === "boolean" && typeof profile.reason === "string" && typeof profile.requiresConfirmation === "boolean" && finiteNonNegative(workflow.steps) && Number.isInteger(workflow.steps) && finiteNonNegative(workflow.fixRounds) && Number.isInteger(workflow.fixRounds) && finiteNonNegative(workflow.maxFixRounds) && Number.isInteger(workflow.maxFixRounds) && workflow.fixRounds <= workflow.maxFixRounds && validEvidence && (workflow.lastError === null || typeof workflow.lastError === "string") && finiteNonNegative(value.inputTokens) && finiteNonNegative(value.cachedInputTokens) && finiteNonNegative(value.outputTokens) && finiteNonNegative(value.startedAt) && value.startedAt > 0 && finiteNonNegative(value.consecutiveToolErrors) && Number.isInteger(value.consecutiveToolErrors) && finiteNonNegative(value.consecutiveRequestErrors) && Number.isInteger(value.consecutiveRequestErrors) && finiteNonNegative(value.identicalRequestRetries) && Number.isInteger(value.identicalRequestRetries) && (value.lastRequestFailureFingerprint === void 0 || typeof value.lastRequestFailureFingerprint === "string") && finiteNonNegative(value.taskStartedAtSeq) && Number.isInteger(value.taskStartedAtSeq) && Array.isArray(value.providerFailures) && value.providerFailures.every((item) => typeof item === "string") && (value.confirmedRiskTask === void 0 || typeof value.confirmedRiskTask === "boolean") && (value.classifiedTurn === void 0 || finiteNonNegative(value.classifiedTurn) && Number.isInteger(value.classifiedTurn));
}
/** The settings schema (schemastery) driving the built-in configuration form. */
const SolConfigSchema = z.object({
	enabled: z.boolean().default(DEFAULT_CONFIG.enabled),
	providerPattern: z.string().default(DEFAULT_CONFIG.providerPattern),
	modelPatterns: z.array(z.string()).default([...DEFAULT_CONFIG.modelPatterns]),
	defaultMode: z.union(MODE_IDS).default(DEFAULT_CONFIG.defaultMode),
	defaultReasoning: z.string().default(DEFAULT_CONFIG.defaultReasoning),
	applyReasoningOverrides: z.boolean().default(DEFAULT_CONFIG.applyReasoningOverrides),
	contextSoftLimit: z.union([z.natural(), z.const(null)]).default(DEFAULT_CONFIG.contextSoftLimit),
	contextHardLimit: z.union([z.natural(), z.const(null)]).default(DEFAULT_CONFIG.contextHardLimit),
	compactAtPercent: z.number().min(1).max(100).default(DEFAULT_CONFIG.compactAtPercent),
	warnAtPercent: z.number().min(1).max(100).default(DEFAULT_CONFIG.warnAtPercent),
	maxOutputTokens: z.number().step(1).min(0).default(DEFAULT_CONFIG.maxOutputTokens),
	currency: z.string().default(DEFAULT_CONFIG.currency),
	inputPricePerMillion: z.union([z.number().min(0), z.const(null)]).default(null),
	cachedInputPricePerMillion: z.union([z.number().min(0), z.const(null)]).default(null),
	outputPricePerMillion: z.union([z.number().min(0), z.const(null)]).default(null),
	perRequestBudget: z.union([z.number().min(0), z.const(null)]).default(null),
	perSessionBudget: z.union([z.number().min(0), z.const(null)]).default(null),
	maxRequiresConfirmation: z.boolean().default(DEFAULT_CONFIG.maxRequiresConfirmation),
	proRequiresConfirmation: z.boolean().default(DEFAULT_CONFIG.proRequiresConfirmation),
	maxWorkflowSteps: z.number().step(1).min(0).default(DEFAULT_CONFIG.maxWorkflowSteps),
	maxFixRounds: z.number().step(1).min(0).default(DEFAULT_CONFIG.maxFixRounds),
	maxConsecutiveToolErrors: z.number().step(1).min(0).default(DEFAULT_CONFIG.maxConsecutiveToolErrors),
	maxConsecutiveRequestErrors: z.number().step(1).min(0).default(DEFAULT_CONFIG.maxConsecutiveRequestErrors),
	maxIdenticalErrorRetries: z.number().step(1).min(0).default(DEFAULT_CONFIG.maxIdenticalErrorRetries),
	maxWallTimeMinutes: z.number().step(1).min(0).default(DEFAULT_CONFIG.maxWallTimeMinutes),
	maxInputTokens: z.union([z.natural(), z.const(null)]).default(null),
	maxOutputTokensTotal: z.union([z.natural(), z.const(null)]).default(null),
	maxSessionCost: z.union([z.number().min(0), z.const(null)]).default(null),
	hardBudgetEnforcement: z.boolean().default(DEFAULT_CONFIG.hardBudgetEnforcement)
});
function apply(ctx, config) {
	const entryConfig = normalizeConfig(config);
	let runtimeConfig = entryConfig;
	const states = /* @__PURE__ */ new WeakMap();
	const routeInfos = /* @__PURE__ */ new Map();
	const pendingPersistence = /* @__PURE__ */ new WeakSet();
	const STATE_EVENT = "gpt56-sol/state";
	/** Read the exact-model metadata for a route, or undefined on failure. */
	async function resolveRouteInfo(provider, model, signal) {
		const key = routeKey(provider, model);
		const cached = routeInfos.get(key);
		if (cached !== void 0) return cached;
		const llm = ctx.get("llm");
		if (llm === void 0) return void 0;
		let info;
		try {
			const resolved = await llm.resolveModelInfo(provider, model, signal);
			const defaultEffort = resolved.reasoning?.defaultEffort;
			const capabilities = resolveCapabilities(resolved);
			info = {
				supported: capabilities.reasoningEfforts,
				...defaultEffort === void 0 ? {} : { defaultEffort: String(defaultEffort) },
				contextWindow: capabilities.contextWindow,
				capabilities
			};
		} catch {
			info = void 0;
		}
		routeInfos.set(key, info);
		return info;
	}
	function routeFor(agent) {
		const { provider, model } = agent.options;
		if (typeof provider !== "string" || provider === "" || typeof model !== "string" || model === "") return void 0;
		return {
			provider,
			model
		};
	}
	function isSolAgent(agent) {
		const route = routeFor(agent);
		return route !== void 0 && isSolRoute(route.provider, route.model, runtimeConfig);
	}
	function stateFor(agent) {
		let state = states.get(agent.session);
		if (state === void 0) {
			state = {
				...initialModeState(runtimeConfig.defaultMode),
				restricted: false,
				restrictDisposer: void 0,
				inputTokens: 0,
				cachedInputTokens: 0,
				outputTokens: 0,
				warned: false,
				workflow: createWorkflow(classifyTask("", runtimeConfig.defaultMode), runtimeConfig.maxFixRounds),
				startedAt: Date.now(),
				consecutiveToolErrors: 0,
				consecutiveRequestErrors: 0,
				lastRequestFailureFingerprint: void 0,
				identicalRequestRetries: 0,
				taskStartedAtSeq: agent.session.events.length,
				providerFailures: [],
				confirmedRiskTask: false,
				classifiedTurn: void 0
			};
			states.set(agent.session, state);
		}
		return state;
	}
	function snapshotState(state) {
		return {
			schemaVersion: 2,
			mode: state.mode,
			modeExplicitlySelected: state.modeExplicitlySelected,
			workflow: state.workflow,
			inputTokens: state.inputTokens,
			cachedInputTokens: state.cachedInputTokens,
			outputTokens: state.outputTokens,
			startedAt: state.startedAt,
			consecutiveToolErrors: state.consecutiveToolErrors,
			consecutiveRequestErrors: state.consecutiveRequestErrors,
			...state.lastRequestFailureFingerprint === void 0 ? {} : { lastRequestFailureFingerprint: state.lastRequestFailureFingerprint },
			identicalRequestRetries: state.identicalRequestRetries,
			taskStartedAtSeq: state.taskStartedAtSeq,
			providerFailures: [...state.providerFailures],
			...state.confirmedRiskTask ? { confirmedRiskTask: true } : {},
			...state.classifiedTurn === void 0 ? {} : { classifiedTurn: state.classifiedTurn }
		};
	}
	function persistState(agent, state) {
		agent.session.append(STATE_EVENT, snapshotState(state));
	}
	function restoreState(agent, state) {
		const event = [...agent.session.events].reverse().find((item) => item.type === STATE_EVENT);
		if (event === void 0) return;
		const saved = event.data;
		const migrated = saved.schemaVersion === 1 ? {
			...saved,
			schemaVersion: 2,
			consecutiveRequestErrors: 0,
			identicalRequestRetries: 0,
			taskStartedAtSeq: 0,
			providerFailures: [],
			workflow: {
				...saved.workflow,
				maxFixRounds: runtimeConfig.maxFixRounds
			}
		} : saved;
		if (!isValidPersistedState(migrated)) {
			ctx.logger.warn("gpt56-sol-kit: ignoring invalid persisted state");
			return;
		}
		const valid = migrated;
		state.mode = valid.mode;
		state.modeExplicitlySelected = valid.modeExplicitlySelected;
		state.workflow = valid.workflow;
		state.inputTokens = valid.inputTokens;
		state.cachedInputTokens = valid.cachedInputTokens;
		state.outputTokens = valid.outputTokens;
		state.startedAt = valid.startedAt;
		state.consecutiveToolErrors = valid.consecutiveToolErrors;
		state.consecutiveRequestErrors = valid.consecutiveRequestErrors;
		state.lastRequestFailureFingerprint = valid.lastRequestFailureFingerprint;
		state.identicalRequestRetries = valid.identicalRequestRetries;
		state.taskStartedAtSeq = valid.taskStartedAtSeq;
		state.providerFailures = [...valid.providerFailures];
		state.confirmedRiskTask = valid.confirmedRiskTask === true;
		state.classifiedTurn = valid.classifiedTurn;
		applyRestriction(agent, state);
	}
	function resetWorkflow(agent, state) {
		resetModeState(state, entryConfig.defaultMode);
		state.workflow = createWorkflow(classifyTask("", entryConfig.defaultMode), runtimeConfig.maxFixRounds);
		state.warned = false;
		state.consecutiveToolErrors = 0;
		state.consecutiveRequestErrors = 0;
		state.lastRequestFailureFingerprint = void 0;
		state.identicalRequestRetries = 0;
		state.taskStartedAtSeq = agent.session.events.length;
		state.providerFailures = [];
		state.confirmedRiskTask = false;
		state.classifiedTurn = void 0;
		applyRestriction(agent, state);
		persistState(agent, state);
	}
	function effectivePolicy(state) {
		return resolveEffectivePolicy({
			mode: state.mode,
			scope: state.workflow.profile.scope,
			phase: state.workflow.phase
		});
	}
	/** Apply (or replace) the agent-scoped tool restriction from the effective policy. */
	function applyRestriction(agent, state) {
		const denied = effectivePolicy(state).deniedTools;
		if (state.restrictDisposer !== void 0) {
			state.restrictDisposer();
			state.restrictDisposer = void 0;
		}
		state.restricted = false;
		if (denied.length === 0) return;
		const known = denied.filter((name) => ctx.tools.get(name) !== void 0);
		if (known.length === 0) return;
		state.restrictDisposer = agent.ctx.tools.restrict({ deny: known });
		state.restricted = true;
	}
	/** Switch an agent's mode and re-apply everything the mode changes. */
	function switchMode(agent, state, mode) {
		selectModeState(state, mode);
		state.workflow = createWorkflow(classifyTask("", mode), runtimeConfig.maxFixRounds);
		state.warned = false;
		applyRestriction(agent, state);
		persistState(agent, state);
		agent.inject(createUserMessage({
			content: [{
				type: "text",
				text: `The user switched this session to the ${mode} Sol mode (${MODES[mode].label}).`
			}],
			source: {
				kind: "plugin",
				plugin: name,
				form: "notice",
				summary: `Sol mode set to ${mode}`
			}
		}));
	}
	ctx.inject(["settings"], (settingsCtx) => {
		const scope = settingsCtx.settings.register(SETTINGS_NS, SolConfigSchema, { base: entryConfig });
		const applyResolved = (value) => {
			try {
				runtimeConfig = normalizeConfig(value);
			} catch (error) {
				ctx.logger.warn("gpt56-sol-kit: invalid settings ignored: %o", error);
			}
		};
		try {
			applyResolved(scope.get());
		} catch {}
		scope.watch((next) => {
			applyResolved(next);
		});
	});
	ctx.on("agent/session-start", ({ agent }) => {
		if (!isSolAgent(agent)) return;
		restoreState(agent, stateFor(agent));
	});
	ctx.on("agent/request-error", async ({ agent, failure }, next) => {
		if (!isSolAgent(agent)) return next();
		const state = stateFor(agent);
		const text = JSON.stringify(failure);
		state.providerFailures.push(text);
		const failureClass = classifyFailure({ message: text }, { command: "provider request" });
		const fingerprint = `${failureClass}:${failure.code ?? ""}:${failure.message ?? ""}`;
		state.consecutiveRequestErrors += 1;
		state.identicalRequestRetries = state.lastRequestFailureFingerprint === fingerprint ? state.identicalRequestRetries + 1 : 0;
		state.lastRequestFailureFingerprint = fingerprint;
		if (retryDecision(failureClass, state.identicalRequestRetries, state.consecutiveRequestErrors, runtimeConfig.maxIdenticalErrorRetries, runtimeConfig.maxConsecutiveRequestErrors) === "retry") {
			persistState(agent, state);
			return { kind: "retry" };
		}
		if (state.workflow.phase !== "complete" && state.workflow.phase !== "blocked") state.workflow = transition(state.workflow, "blocked", {
			kind: "blocked",
			detail: `${failureClass}: provider request failed`,
			passed: false
		});
		persistState(agent, state);
		return next();
	});
	ctx.systemPrompt.section({
		name: "gpt56-sol:policy",
		order: SECTION_ORDER,
		text: (context) => {
			const agent = context.agent;
			if (agent === void 0 || !isSolAgent(agent)) return "";
			return solPromptSection(stateFor(agent).mode);
		}
	});
	ctx.on("agent/pre-step", async ({ agent, messages, turn }, next) => {
		if (!isSolAgent(agent)) return next();
		const state = stateFor(agent);
		if (state.mode === "auto" && state.classifiedTurn !== turn) {
			state.confirmedRiskTask = false;
			const directUser = [...messages].reverse().find((message) => message.source.kind === "user");
			const profile = classifyTask(directUser === void 0 ? "" : directUser.content.filter((block) => block.type === "text").map((block) => block.text).join(" "));
			state.workflow = createWorkflow(profile, runtimeConfig.maxFixRounds);
			state.classifiedTurn = turn;
			applyRestriction(agent, state);
			const evidence = {
				kind: "inspection",
				detail: `classified ${profile.scope} task`
			};
			const nextPhase = effectivePolicy(state).allowsImplementation ? "implement" : "verify";
			state.workflow = transition(state.workflow, nextPhase, evidence);
			persistState(agent, state);
		}
		return next();
	});
	ctx.tools.guard((execution) => {
		const agent = execution.agent;
		if (agent === void 0) return void 0;
		const state = states.get(agent.session);
		if (state === void 0) return void 0;
		const policy = effectivePolicy(state);
		const deepAnalysisSubagent = state.workflow.profile.scope === "deep-analysis" && SUBAGENT_TOOLS.includes(execution.name);
		if (policy.readOnly && isMutatingTool(execution.name) && !deepAnalysisSubagent) return `tool "${execution.name}" is disabled in ${policy.scope} scope`;
		if (state.workflow.profile.requiresConfirmation && !state.confirmedRiskTask && isMutatingTool(execution.name)) return `tool "${execution.name}" requires confirmation for this task; confirm with /sol confirm`;
		const info = evaluateBudget(runtimeConfig, {
			steps: state.workflow.steps,
			fixRounds: state.workflow.fixRounds,
			consecutiveToolErrors: state.consecutiveToolErrors,
			inputTokens: state.inputTokens,
			outputTokens: state.outputTokens,
			sessionCost: computeCost({
				inputTokens: state.inputTokens,
				cachedInputTokens: state.cachedInputTokens,
				outputTokens: state.outputTokens
			}, runtimeConfig),
			elapsedMinutes: (Date.now() - state.startedAt) / 6e4
		});
		if (info.hardStop) return info.reason ?? "V2 hard budget limit reached.";
	});
	ctx.on("agent/request", async (payload, next) => {
		const base = await next();
		const agent = payload.agent;
		if (!isSolAgent(agent)) return base;
		const state = stateFor(agent);
		const route = routeFor(agent);
		const nextConfig = { ...base };
		if (route !== void 0) {
			const info = await resolveRouteInfo(route.provider, route.model, payload.signal);
			const overrides = resolveRequestOverrides({
				base: {
					reasoningEffort: nextConfig.reasoningEffort,
					maxTokens: nextConfig.maxTokens
				},
				mode: state.mode,
				modeExplicitlySelected: state.modeExplicitlySelected,
				applyReasoningOverrides: runtimeConfig.applyReasoningOverrides,
				supportedEfforts: info?.supported ?? [],
				configuredMaxOutputTokens: runtimeConfig.maxOutputTokens
			});
			if (overrides.reasoningEffort === void 0) delete nextConfig.reasoningEffort;
			else nextConfig.reasoningEffort = ReasoningEffortId(overrides.reasoningEffort);
			if (overrides.maxTokens === void 0) delete nextConfig.maxTokens;
			else nextConfig.maxTokens = overrides.maxTokens;
			state.appliedEffort = overrides.appliedEffort;
			const tokenMeter = ctx.get("tokenMeter");
			const contextPressure = contextDecision({
				surfaceTokens: tokenMeter === void 0 ? estimateSurfaceTokens(agent) : tokenMeter.measure(agent.session).surfaceTokens,
				contextWindow: info?.contextWindow ?? null,
				softLimit: runtimeConfig.contextSoftLimit,
				hardLimit: runtimeConfig.contextHardLimit,
				warnAtPercent: runtimeConfig.warnAtPercent,
				compactAtPercent: runtimeConfig.compactAtPercent
			});
			if (contextPressure.action !== "ok" && !state.warned) {
				state.warned = true;
				agent.inject(createUserMessage({
					content: [{
						type: "text",
						text: `Context pressure notice: ${contextPressure.detail}.`
					}],
					source: {
						kind: "plugin",
						plugin: name,
						form: "notice",
						summary: "context pressure"
					}
				}));
			}
		}
		return nextConfig;
	});
	ctx.on("agent/created", (payload) => {
		const agent = payload.agent;
		if (!isSolAgent(agent)) return;
		applyRestriction(agent, stateFor(agent));
	});
	ctx.on("agent/disposed", (payload) => {
		const state = states.get(payload.agent.session);
		if (state === void 0) return;
		if (state.restrictDisposer !== void 0) state.restrictDisposer();
		states.delete(payload.agent.session);
	});
	ctx.on("session/event", (session, event) => {
		const state = states.get(session);
		if (state === void 0) return;
		if (event.type === STATE_EVENT) return;
		if (event.type === "assistant/message") {
			state.consecutiveRequestErrors = 0;
			state.lastRequestFailureFingerprint = void 0;
			state.identicalRequestRetries = 0;
			state.providerFailures = [];
			const usage = event.data.usage;
			if (usage !== void 0) {
				state.inputTokens += usage.inputTokens;
				state.cachedInputTokens += (usage.cacheReadTokens ?? 0) + (usage.cacheWriteTokens ?? 0);
				state.outputTokens += usage.outputTokens;
			}
			persistStateForSession(session, state);
			return;
		}
		if (event.type === "tool/result") {
			if (event.data.error !== void 0) state.consecutiveToolErrors += 1;
			else state.consecutiveToolErrors = 0;
			const failureClass = event.data.error === void 0 ? void 0 : classifyFailure({
				message: event.data.error.code,
				code: event.data.error.code
			}, { command: event.data.message.source.callId });
			const evidence = event.data.error === void 0 ? {
				kind: "implementation",
				detail: `tool ${event.data.message.source.callId} completed`,
				passed: true
			} : {
				kind: "failure",
				detail: `${failureClass}: ${event.data.error.code}`,
				passed: false
			};
			const implementationCall = [...session.events].reverse().find((candidate) => candidate.type === "tool/call" && candidate.data.callId === event.data.message.source.callId);
			const implementationTool = implementationCall?.type === "tool/call" && /^(write|edit|str_replace_editor)$/.test(implementationCall.data.name);
			if (state.workflow.phase === "implement" && event.data.error === void 0 && implementationTool) state.workflow = transition(state.workflow, "verify", evidence);
			else if (state.workflow.phase === "verify" && event.data.error !== void 0) {
				const next = failureTransition(state.workflow, evidence.detail).next;
				state.workflow = transition(state.workflow, next, evidence);
			}
			persistStateForSession(session, state);
		}
	});
	function persistStateForSession(session, state) {
		if (pendingPersistence.has(session)) return;
		pendingPersistence.add(session);
		queueMicrotask(() => {
			pendingPersistence.delete(session);
			session.append(STATE_EVENT, {
				...snapshotState(state),
				modeExplicitlySelected: state.modeExplicitlySelected,
				workflow: state.workflow,
				inputTokens: state.inputTokens,
				cachedInputTokens: state.cachedInputTokens,
				outputTokens: state.outputTokens,
				startedAt: state.startedAt,
				consecutiveToolErrors: state.consecutiveToolErrors,
				...state.classifiedTurn === void 0 ? {} : { classifiedTurn: state.classifiedTurn }
			});
		});
	}
	ctx.inject(["commands"], (commandCtx) => {
		commandCtx.commands.register({
			name: "sol",
			description: "Show or control the GPT-5.6-Sol companion plugin",
			input: { hint: "[status|mode <name> [--confirm]|budget|verify|review|reset]" },
			recordInput: false,
			handler: (invocation) => handleSolCommand(invocation)
		});
	});
	function handleSolCommand(invocation) {
		const { agent, rawInput } = invocation;
		const route = routeFor(agent);
		const isSol = route !== void 0 && isSolRoute(route.provider, route.model, runtimeConfig);
		const state = isSol ? stateFor(agent) : void 0;
		const command = parseSolCommand(rawInput);
		switch (command.action) {
			case "status": return {
				kind: "success",
				text: renderStatus(buildStatus(agent, route, state))
			};
			case "phase":
				if (!isSol || state === void 0) return {
					kind: "error",
					text: "Sol mode is inactive for the current model."
				};
				return {
					kind: "success",
					text: renderWorkflow({
						phase: state.workflow.phase,
						scope: state.workflow.profile.scope,
						steps: state.workflow.steps,
						fixRounds: state.workflow.fixRounds,
						lastError: state.workflow.lastError
					})
				};
			case "workflow":
				if (!isSol || state === void 0) return {
					kind: "error",
					text: "Sol mode is inactive for the current model."
				};
				if (command.reset) {
					resetWorkflow(agent, state);
					return {
						kind: "success",
						text: "Sol workflow reset; provider, model, and credentials were preserved."
					};
				}
				return {
					kind: "success",
					text: renderWorkflow({
						phase: state.workflow.phase,
						scope: state.workflow.profile.scope,
						steps: state.workflow.steps,
						fixRounds: state.workflow.fixRounds,
						lastError: state.workflow.lastError
					})
				};
			case "capabilities": {
				if (!isSol) return {
					kind: "error",
					text: "Sol mode is inactive for the current model."
				};
				const info = routeInfos.get(routeKey(route.provider, route.model));
				return {
					kind: "success",
					text: renderCapabilities(info === void 0 ? resolveCapabilities(void 0) : info.capabilities)
				};
			}
			case "budget": return {
				kind: "success",
				text: renderBudget(buildBudget(agent, state))
			};
			case "review":
				if (!isSol || state === void 0) return {
					kind: "error",
					text: "Sol mode is inactive for the current model."
				};
				switchMode(agent, state, "review");
				return {
					kind: "success",
					text: "Switched to review mode (read-only). Use /sol mode <name> to change."
				};
			case "confirm":
				if (!isSol || state === void 0) return {
					kind: "error",
					text: "Sol mode is inactive for the current model."
				};
				state.confirmedRiskTask = true;
				persistState(agent, state);
				return {
					kind: "success",
					text: "Confirmed the current task risk; mutating tools are enabled subject to the active policy."
				};
			case "reset": {
				const settings = ctx.get("settings");
				if (settings === void 0) return {
					kind: "error",
					text: "No settings provider is mounted; reset is unavailable."
				};
				settings.replace(SETTINGS_NS, {}).catch((error) => {
					ctx.logger.warn("gpt56-sol-kit: reset failed: %o", error);
				});
				if (state !== void 0) resetWorkflow(agent, state);
				return {
					kind: "success",
					text: "Sol plugin settings reset to defaults (provider, model, and API key untouched)."
				};
			}
			case "verify": {
				if (!isSol || state === void 0) return {
					kind: "error",
					text: "Sol mode is inactive for the current model."
				};
				const liveEvents = agent.session.events.filter((event) => event.seq >= state.taskStartedAtSeq);
				const toolCalls = liveEvents.filter((event) => event.type === "tool/call").map((event) => ({
					callId: String(event.data.callId),
					name: event.data.name,
					arguments: event.data.arguments
				}));
				const toolResults = liveEvents.filter((event) => event.type === "tool/result").map((event) => {
					const result = { callId: String(event.data.message.source.callId) };
					if (event.data.error !== void 0) result.errorCode = event.data.error.code;
					if (event.data.meta !== void 0 && typeof event.data.meta === "object" && event.data.meta !== null) result.meta = event.data.meta;
					return result;
				});
				const result = assessVerification(collectVerificationEvidence({
					calls: toolCalls,
					results: toolResults,
					providerFailures: state.providerFailures,
					webTask: state.workflow.profile.scope === "frontend"
				}));
				if (result.status === "PASS") {
					if (state.workflow.phase === "verify") state.workflow = transition(state.workflow, "review", {
						kind: "verification",
						detail: "evidence assessment passed",
						passed: true
					});
					if (state.workflow.phase === "review") state.workflow = transition(state.workflow, "complete", {
						kind: "review",
						detail: "read-only evidence review passed",
						passed: true
					});
					persistState(agent, state);
					applyRestriction(agent, state);
				} else if (result.status === "BLOCKED" && state.workflow.phase !== "blocked" && state.workflow.phase !== "complete") {
					state.workflow = transition(state.workflow, "blocked", {
						kind: "blocked",
						detail: result.summary,
						passed: false
					});
					persistState(agent, state);
					applyRestriction(agent, state);
				} else if (result.status === "FAIL" && state.workflow.phase === "verify") {
					const next = failureTransition(state.workflow, result.summary).next;
					state.workflow = transition(state.workflow, next, {
						kind: "failure",
						detail: result.summary,
						passed: false
					});
					persistState(agent, state);
					applyRestriction(agent, state);
				}
				return {
					kind: "success",
					text: [
						renderWorkflow({
							phase: state.workflow.phase,
							scope: state.workflow.profile.scope,
							steps: state.workflow.steps,
							fixRounds: state.workflow.fixRounds,
							lastError: state.workflow.lastError
						}),
						"",
						`Result: ${result.status}`,
						"Requirements:",
						...result.requirements,
						"Evidence:",
						`Tool calls: ${toolCalls.length}`,
						`Tool results: ${toolResults.length}`,
						"Failures:",
						...result.failures,
						"Unauthorized changes:",
						...result.unauthorizedChanges,
						`Required next action: ${result.requiredNextAction}`,
						`Can report complete: ${result.canReportComplete ? "yes" : "no"}`
					].join("\\n")
				};
			}
			case "mode": {
				if (!isSol || state === void 0) return {
					kind: "error",
					text: "Sol mode is inactive for the current model."
				};
				if (command.name === void 0) return {
					kind: "success",
					text: `Current mode: ${state.mode}. Available: ${MODE_IDS.join(", ")}`
				};
				if (!isSolMode(command.name)) return {
					kind: "error",
					text: `Unknown mode "${command.name}". Available: ${MODE_IDS.join(", ")}`
				};
				if (command.name === "pro") {
					if ((route === void 0 ? void 0 : routeInfos.get(routeKey(route.provider, route.model)))?.supported.includes("pro") !== true) return {
						kind: "error",
						text: "pro mode requires the relay route to expose a `pro` reasoning effort; it is never inferred from the model name."
					};
				}
				const needsConfirmation = requiresConfirmation(command.name);
				const confirmFlag = command.name === "pro" ? runtimeConfig.proRequiresConfirmation : runtimeConfig.maxRequiresConfirmation;
				if (needsConfirmation && confirmFlag && !command.confirm) return {
					kind: "error",
					text: `"${command.name}" mode carries latency, token, and cost risk. Confirm with /sol mode ${command.name} --confirm.`
				};
				switchMode(agent, state, command.name);
				return {
					kind: "success",
					text: `Switched to ${command.name} mode (${MODES[command.name].label}).`
				};
			}
			case "unknown": return {
				kind: "error",
				text: `Unknown /sol subcommand "${command.text}". Try: status, mode, phase, workflow, budget, capabilities, verify, review, reset.`
			};
			default: return {
				kind: "error",
				text: "Unrecognized /sol command."
			};
		}
	}
	function buildStatus(agent, route, state) {
		const tokenMeter = ctx.get("tokenMeter");
		const mode = state?.mode ?? runtimeConfig.defaultMode;
		const policy = state === void 0 ? resolveEffectivePolicy({
			mode,
			scope: "answer",
			phase: "idle"
		}) : effectivePolicy(state);
		return {
			enabled: runtimeConfig.enabled,
			isSol: state !== void 0,
			provider: route?.provider ?? "",
			model: route?.model ?? "",
			mode,
			modeExplicitlySelected: state?.modeExplicitlySelected ?? false,
			reasoningOverridesEnabled: runtimeConfig.applyReasoningOverrides,
			reasoning: state?.appliedEffort ?? runtimeConfig.defaultReasoning,
			contextSoftLimit: runtimeConfig.contextSoftLimit,
			contextHardLimit: runtimeConfig.contextHardLimit,
			surfaceTokens: tokenMeter === void 0 ? estimateSurfaceTokens(agent) : tokenMeter.measure(agent.session).surfaceTokens,
			sessionCost: state === void 0 ? null : computeCost({
				inputTokens: state.inputTokens,
				cachedInputTokens: state.cachedInputTokens,
				outputTokens: state.outputTokens
			}, runtimeConfig),
			deniedTools: policy.deniedTools,
			deniedCategories: policy.deniedCategories,
			scope: policy.scope,
			phase: policy.phase,
			readOnly: policy.readOnly,
			allowsImplementation: policy.allowsImplementation,
			pricesKnown: pricesKnown(runtimeConfig),
			workflowPhase: state?.workflow.phase ?? "idle",
			workflowSteps: state?.workflow.steps ?? 0,
			fixRounds: state?.workflow.fixRounds ?? 0,
			maxFixRounds: state?.workflow.maxFixRounds ?? runtimeConfig.maxFixRounds,
			lastError: state?.workflow.lastError ?? null,
			canReportComplete: state?.workflow.phase === "complete"
		};
	}
	function buildBudget(_agent, state) {
		const usage = {
			inputTokens: state?.inputTokens ?? 0,
			cachedInputTokens: state?.cachedInputTokens ?? 0,
			outputTokens: state?.outputTokens ?? 0
		};
		const requestCost = computeCost(usage, runtimeConfig);
		const sessionCost = requestCost;
		const decision = budgetDecision(requestCost ?? 0, sessionCost ?? 0, runtimeConfig.perRequestBudget, runtimeConfig.perSessionBudget);
		return {
			isSol: state !== void 0,
			pricesKnown: pricesKnown(runtimeConfig),
			requestCost,
			sessionCost,
			requestBudget: runtimeConfig.perRequestBudget,
			sessionBudget: runtimeConfig.perSessionBudget,
			inputTokens: usage.inputTokens,
			cachedInputTokens: usage.cachedInputTokens,
			outputTokens: usage.outputTokens,
			workflowSteps: state?.workflow.steps ?? 0,
			fixRounds: state?.workflow.fixRounds ?? 0,
			toolErrors: state?.consecutiveToolErrors ?? 0,
			requestErrors: state?.consecutiveRequestErrors ?? 0,
			maxFixRounds: state?.workflow.maxFixRounds ?? runtimeConfig.maxFixRounds,
			elapsedMinutes: state === void 0 ? 0 : Math.round((Date.now() - state.startedAt) / 6e4 * 10) / 10,
			hardBudgetEnforcement: runtimeConfig.hardBudgetEnforcement,
			withinRequest: decision.withinRequest,
			withinSession: decision.withinSession
		};
	}
}
/** Coarse surface-token estimate when the token meter is not composed. */
function estimateSurfaceTokens(agent) {
	let chars = 0;
	for (const event of agent.session.events) if (event.type === "user/message" || event.type === "assistant/message") {
		const data = event.data;
		chars += JSON.stringify(data.content ?? "").length;
	}
	return Math.ceil(chars / 4);
}
//#endregion
export { apply, inject, name };
