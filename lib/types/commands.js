/**
 * `/sol` command parsing and status/budget rendering. Pure, dependency-free;
 * the adapter (index.ts) registers the actual command and feeds it live state.
 */
import { MODES } from "./modes.js";
/**
 * Parse a `/sol` raw input into a structured command.
 *
 * @param rawInput The bytes after `/sol`.
 * @returns The parsed command.
 */
export function parseSolCommand(rawInput) {
    const tokens = rawInput.trim().split(/\s+/).filter(t => t.length > 0);
    if (tokens.length === 0)
        return { action: 'status' };
    const [verb, arg, flag] = tokens;
    switch (verb) {
        case 'status':
            return { action: 'status' };
        case 'mode': {
            const name = arg;
            const confirm = arg === '--confirm' || flag === '--confirm';
            const selectedName = name === '--confirm' ? undefined : name;
            return {
                action: 'mode',
                confirm,
                ...(selectedName === undefined ? {} : { name: selectedName }),
            };
        }
        case 'phase':
            return { action: 'phase' };
        case 'workflow':
            return { action: 'workflow', reset: arg === 'reset' };
        case 'capabilities':
            return { action: 'capabilities' };
        case 'budget':
            return { action: 'budget' };
        case 'verify':
            return { action: 'verify' };
        case 'review':
            return { action: 'review' };
        case 'reset':
            return { action: 'reset' };
        default:
            return { action: 'unknown', text: rawInput.trim() };
    }
}
/** Render workflow state without exposing request secrets. */
export function renderWorkflow(w) {
    return [`Phase: ${w.phase}`, `Task scope: ${w.scope}`, `Workflow steps: ${w.steps}`, `Fix rounds: ${w.fixRounds}`, `Last error: ${w.lastError ?? 'none'}`].join('\n');
}
/** Render exact route capabilities; unknown values remain unknown. */
export function renderCapabilities(c) {
    return [`Source: ${c.source}`, `Protocol: ${c.protocol ?? 'unknown'}`, `Image input: ${c.imageInput === null ? 'unknown' : c.imageInput ? 'yes' : 'no'}`, `Reasoning efforts: ${c.reasoningEfforts.length === 0 ? 'none declared' : c.reasoningEfforts.join(', ')}`, `Context window: ${c.contextWindow ?? 'unknown'}`, `Max output tokens: ${c.maxOutputTokens || 'provider default'}`].join('\n');
}
const BALANCED_HINT = '当前 balanced 模式禁用了终端执行；如需完整编码工作流，请执行 /sol mode coding。';
/** Render the `/sol status` body. Never includes keys or request headers. */
export function renderStatus(s) {
    if (!s.enabled)
        return 'Sol plugin is disabled.';
    if (!s.isSol)
        return `Sol plugin is enabled but inactive: current model "${s.model}" does not match the configured Sol model patterns.`;
    const modeLine = s.modeExplicitlySelected
        ? `Mode: ${s.mode} (${MODES[s.mode].label}, explicitly selected)`
        : `Mode: ${s.mode} (${MODES[s.mode].label}, default)`;
    const lines = [
        `Provider: ${s.provider}`,
        `Model: ${s.model}`,
        modeLine,
        `Reasoning: ${s.reasoning || '(provider default)'}`,
        `Reasoning overrides: ${s.reasoningOverridesEnabled ? 'enabled' : 'disabled'}`,
        ...(s.scope === undefined ? [] : [`Task scope: ${s.scope}`, `Phase: ${s.phase ?? 'unknown'}`, `Read-only: ${s.readOnly ? 'yes' : 'no'}`, `Allows implementation: ${s.allowsImplementation ? 'yes' : 'no'}`, `Can report complete: ${s.canReportComplete ? 'yes' : 'no'}`]),
        `Context soft limit: ${s.contextSoftLimit === null ? 'derived' : s.contextSoftLimit}`,
        `Context hard limit: ${s.contextHardLimit === null ? 'derived' : s.contextHardLimit}`,
        `Session surface tokens: ${s.surfaceTokens}`,
        `Session cost: ${s.pricesKnown ? String(s.sessionCost) : 'unknown (prices not configured)'}`,
        `Denied tool categories: ${s.deniedCategories.length === 0 ? 'none' : s.deniedCategories.join(', ')}`,
        `Denied tools: ${s.deniedTools.length === 0 ? 'none' : s.deniedTools.join(', ')}`,
    ];
    if (s.mode === 'balanced')
        lines.push(BALANCED_HINT);
    return lines.join('\n');
}
/** Render the `/sol budget` body. Shows tokens always, currency only if priced. */
export function renderBudget(b) {
    if (!b.isSol)
        return 'Sol plugin is inactive for the current model; no budget is tracked.';
    const lines = [
        ...(b.workflowSteps === undefined ? [] : [`Workflow steps: ${b.workflowSteps}`, `Fix rounds: ${b.fixRounds ?? 0}/${b.maxFixRounds ?? '?'}`, `Tool errors: ${b.toolErrors ?? 0}`, `Request errors: ${b.requestErrors ?? 0}`, `Elapsed minutes: ${b.elapsedMinutes ?? 0}`]),
        `Input tokens: ${b.inputTokens}`,
        `Cached input tokens: ${b.cachedInputTokens}`,
        `Output tokens: ${b.outputTokens}`,
    ];
    if (!b.pricesKnown) {
        lines.push('Cost: unknown — relay prices are not configured; refer to your relay billing for amounts.');
    }
    else {
        lines.push(`Request cost: ${String(b.requestCost)}`);
        lines.push(`Session cost: ${String(b.sessionCost)}`);
        lines.push(`Per-request budget: ${b.requestBudget === null ? 'unlimited' : String(b.requestBudget)} (${b.withinRequest ? 'ok' : 'exceeded'})`);
        lines.push(`Per-session budget: ${b.sessionBudget === null ? 'unlimited' : String(b.sessionBudget)} (${b.withinSession ? 'ok' : 'exceeded'})`);
    }
    return lines.join('\n');
}
//# sourceMappingURL=commands.js.map