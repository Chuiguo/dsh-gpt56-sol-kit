/**
 * `/sol` command parsing and status/budget rendering. Pure, dependency-free;
 * the adapter (index.ts) registers the actual command and feeds it live state.
 */
import type { SolMode } from './config.ts';
export type SolCommand = {
    action: 'status';
} | {
    action: 'mode';
    name?: string;
    confirm: boolean;
} | {
    action: 'phase';
} | {
    action: 'workflow';
    reset: boolean;
} | {
    action: 'capabilities';
} | {
    action: 'budget';
} | {
    action: 'verify';
} | {
    action: 'review';
} | {
    action: 'reset';
} | {
    action: 'unknown';
    text: string;
};
/**
 * Parse a `/sol` raw input into a structured command.
 *
 * @param rawInput The bytes after `/sol`.
 * @returns The parsed command.
 */
export declare function parseSolCommand(rawInput: string): SolCommand;
export interface WorkflowSnapshot {
    phase: string;
    scope: string;
    steps: number;
    fixRounds: number;
    lastError: string | null;
}
/** Render workflow state without exposing request secrets. */
export declare function renderWorkflow(w: WorkflowSnapshot): string;
export interface CapabilitySnapshot {
    source: string;
    protocol: string | null;
    imageInput: boolean | null;
    reasoningEfforts: readonly string[];
    contextWindow: number | null;
    maxOutputTokens: number;
}
/** Render exact route capabilities; unknown values remain unknown. */
export declare function renderCapabilities(c: CapabilitySnapshot): string;
export interface StatusSnapshot {
    enabled: boolean;
    isSol: boolean;
    provider: string;
    model: string;
    mode: SolMode;
    /** Whether the user explicitly chose the mode via `/sol mode …`. */
    modeExplicitlySelected: boolean;
    /** Whether mode-derived reasoning injection is enabled (config). */
    reasoningOverridesEnabled: boolean;
    reasoning: string;
    contextSoftLimit: number | null;
    contextHardLimit: number | null;
    surfaceTokens: number;
    sessionCost: number | null;
    deniedTools: readonly string[];
    deniedCategories: readonly string[];
    pricesKnown: boolean;
    scope?: string;
    phase?: string;
    readOnly?: boolean;
    allowsImplementation?: boolean;
    canReportComplete?: boolean;
}
/** Render the `/sol status` body. Never includes keys or request headers. */
export declare function renderStatus(s: StatusSnapshot): string;
export interface BudgetSnapshot {
    isSol: boolean;
    workflowSteps?: number;
    fixRounds?: number;
    toolErrors?: number;
    requestErrors?: number;
    maxFixRounds?: number;
    elapsedMinutes?: number;
    hardBudgetEnforcement?: boolean;
    pricesKnown: boolean;
    requestCost: number | null;
    sessionCost: number | null;
    requestBudget: number | null;
    sessionBudget: number | null;
    inputTokens: number;
    cachedInputTokens: number;
    outputTokens: number;
    withinRequest: boolean;
    withinSession: boolean;
}
/** Render the `/sol budget` body. Shows tokens always, currency only if priced. */
export declare function renderBudget(b: BudgetSnapshot): string;
//# sourceMappingURL=commands.d.ts.map