/**
 * GPT-5.6-Sol plugin configuration: the plain value contract, defaults, and
 * normalization. This module is dependency-free so unit tests and the runtime
 * adapter share one source of truth. The schemastery schema (for the settings
 * namespace) lives in index.ts and is built from these same defaults.
 */
/** Valid task-mode ids. */
export const MODE_IDS = [
    'auto',
    'balanced',
    'coding',
    'frontend',
    'review',
    'deep-analysis',
    'max',
    'pro',
];
/** Narrow an unknown value to a {@link SolMode}. */
export function isSolMode(value) {
    return typeof value === 'string' && MODE_IDS.includes(value);
}
export const DEFAULT_CONFIG = Object.freeze({
    enabled: true,
    providerPattern: '',
    modelPatterns: ['gpt-5.6-sol'],
    defaultMode: 'auto',
    defaultReasoning: '',
    applyReasoningOverrides: false,
    contextSoftLimit: null,
    contextHardLimit: null,
    compactAtPercent: 85,
    warnAtPercent: 75,
    maxOutputTokens: 0,
    currency: 'USD',
    inputPricePerMillion: null,
    cachedInputPricePerMillion: null,
    outputPricePerMillion: null,
    perRequestBudget: null,
    perSessionBudget: null,
    maxRequiresConfirmation: true,
    proRequiresConfirmation: true,
    secondPass: false,
    useSubagents: false,
    maxWorkflowSteps: 40,
    maxFixRounds: 2,
    maxConsecutiveToolErrors: 4,
    maxIdenticalErrorRetries: 1,
    maxWallTimeMinutes: 20,
    maxInputTokens: null,
    maxOutputTokensTotal: null,
    maxSessionCost: null,
    hardBudgetEnforcement: false,
});
function expectBoolean(value, field) {
    if (typeof value !== 'boolean')
        throw new TypeError(`${field} must be a boolean`);
    return value;
}
function expectString(value, field) {
    if (typeof value !== 'string')
        throw new TypeError(`${field} must be a string`);
    return value;
}
function expectStringArray(value, field) {
    if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
        throw new TypeError(`${field} must be an array of strings`);
    }
    return value.map(item => String(item));
}
function expectPercent(value, field) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > 100) {
        throw new TypeError(`${field} must be a number in (0, 100]`);
    }
    return value;
}
function expectNonNegativeOrNull(value, field) {
    if (value === null || value === undefined)
        return null;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
        throw new TypeError(`${field} must be a non-negative number or null`);
    }
    return value;
}
function expectNonNegativeInt(value, field) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
        throw new TypeError(`${field} must be a non-negative integer`);
    }
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
export function normalizeConfig(input) {
    const raw = (input ?? {});
    const config = {
        enabled: raw.enabled === undefined ? DEFAULT_CONFIG.enabled : expectBoolean(raw.enabled, 'enabled'),
        providerPattern: raw.providerPattern === undefined ? DEFAULT_CONFIG.providerPattern : expectString(raw.providerPattern, 'providerPattern'),
        modelPatterns: raw.modelPatterns === undefined
            ? [...DEFAULT_CONFIG.modelPatterns]
            : expectStringArray(raw.modelPatterns, 'modelPatterns'),
        defaultMode: raw.defaultMode === undefined ? DEFAULT_CONFIG.defaultMode : (isSolMode(raw.defaultMode) ? raw.defaultMode : (() => {
            throw new TypeError(`defaultMode must be one of ${MODE_IDS.join(', ')}`);
        })()),
        defaultReasoning: raw.defaultReasoning === undefined ? DEFAULT_CONFIG.defaultReasoning : expectString(raw.defaultReasoning, 'defaultReasoning'),
        applyReasoningOverrides: raw.applyReasoningOverrides === undefined ? DEFAULT_CONFIG.applyReasoningOverrides : expectBoolean(raw.applyReasoningOverrides, 'applyReasoningOverrides'),
        contextSoftLimit: raw.contextSoftLimit === undefined ? DEFAULT_CONFIG.contextSoftLimit : expectNonNegativeOrNull(raw.contextSoftLimit, 'contextSoftLimit'),
        contextHardLimit: raw.contextHardLimit === undefined ? DEFAULT_CONFIG.contextHardLimit : expectNonNegativeOrNull(raw.contextHardLimit, 'contextHardLimit'),
        compactAtPercent: raw.compactAtPercent === undefined ? DEFAULT_CONFIG.compactAtPercent : expectPercent(raw.compactAtPercent, 'compactAtPercent'),
        warnAtPercent: raw.warnAtPercent === undefined ? DEFAULT_CONFIG.warnAtPercent : expectPercent(raw.warnAtPercent, 'warnAtPercent'),
        maxOutputTokens: raw.maxOutputTokens === undefined ? DEFAULT_CONFIG.maxOutputTokens : expectNonNegativeInt(raw.maxOutputTokens, 'maxOutputTokens'),
        currency: raw.currency === undefined ? DEFAULT_CONFIG.currency : expectString(raw.currency, 'currency'),
        inputPricePerMillion: raw.inputPricePerMillion === undefined ? DEFAULT_CONFIG.inputPricePerMillion : expectNonNegativeOrNull(raw.inputPricePerMillion, 'inputPricePerMillion'),
        cachedInputPricePerMillion: raw.cachedInputPricePerMillion === undefined ? DEFAULT_CONFIG.cachedInputPricePerMillion : expectNonNegativeOrNull(raw.cachedInputPricePerMillion, 'cachedInputPricePerMillion'),
        outputPricePerMillion: raw.outputPricePerMillion === undefined ? DEFAULT_CONFIG.outputPricePerMillion : expectNonNegativeOrNull(raw.outputPricePerMillion, 'outputPricePerMillion'),
        perRequestBudget: raw.perRequestBudget === undefined ? DEFAULT_CONFIG.perRequestBudget : expectNonNegativeOrNull(raw.perRequestBudget, 'perRequestBudget'),
        perSessionBudget: raw.perSessionBudget === undefined ? DEFAULT_CONFIG.perSessionBudget : expectNonNegativeOrNull(raw.perSessionBudget, 'perSessionBudget'),
        maxRequiresConfirmation: raw.maxRequiresConfirmation === undefined ? DEFAULT_CONFIG.maxRequiresConfirmation : expectBoolean(raw.maxRequiresConfirmation, 'maxRequiresConfirmation'),
        proRequiresConfirmation: raw.proRequiresConfirmation === undefined ? DEFAULT_CONFIG.proRequiresConfirmation : expectBoolean(raw.proRequiresConfirmation, 'proRequiresConfirmation'),
        secondPass: raw.secondPass === undefined ? DEFAULT_CONFIG.secondPass : expectBoolean(raw.secondPass, 'secondPass'),
        useSubagents: raw.useSubagents === undefined ? DEFAULT_CONFIG.useSubagents : expectBoolean(raw.useSubagents, 'useSubagents'),
        maxWorkflowSteps: raw.maxWorkflowSteps === undefined ? DEFAULT_CONFIG.maxWorkflowSteps : expectNonNegativeInt(raw.maxWorkflowSteps, 'maxWorkflowSteps'),
        maxFixRounds: raw.maxFixRounds === undefined ? DEFAULT_CONFIG.maxFixRounds : expectNonNegativeInt(raw.maxFixRounds, 'maxFixRounds'),
        maxConsecutiveToolErrors: raw.maxConsecutiveToolErrors === undefined ? DEFAULT_CONFIG.maxConsecutiveToolErrors : expectNonNegativeInt(raw.maxConsecutiveToolErrors, 'maxConsecutiveToolErrors'),
        maxIdenticalErrorRetries: raw.maxIdenticalErrorRetries === undefined ? DEFAULT_CONFIG.maxIdenticalErrorRetries : expectNonNegativeInt(raw.maxIdenticalErrorRetries, 'maxIdenticalErrorRetries'),
        maxWallTimeMinutes: raw.maxWallTimeMinutes === undefined ? DEFAULT_CONFIG.maxWallTimeMinutes : expectNonNegativeInt(raw.maxWallTimeMinutes, 'maxWallTimeMinutes'),
        maxInputTokens: raw.maxInputTokens === undefined ? DEFAULT_CONFIG.maxInputTokens : expectNonNegativeOrNull(raw.maxInputTokens, 'maxInputTokens'),
        maxOutputTokensTotal: raw.maxOutputTokensTotal === undefined ? DEFAULT_CONFIG.maxOutputTokensTotal : expectNonNegativeOrNull(raw.maxOutputTokensTotal, 'maxOutputTokensTotal'),
        maxSessionCost: raw.maxSessionCost === undefined ? DEFAULT_CONFIG.maxSessionCost : expectNonNegativeOrNull(raw.maxSessionCost, 'maxSessionCost'),
        hardBudgetEnforcement: raw.hardBudgetEnforcement === undefined ? DEFAULT_CONFIG.hardBudgetEnforcement : expectBoolean(raw.hardBudgetEnforcement, 'hardBudgetEnforcement'),
    };
    if (config.warnAtPercent >= config.compactAtPercent) {
        throw new TypeError('warnAtPercent must be strictly less than compactAtPercent');
    }
    return config;
}
//# sourceMappingURL=config.js.map