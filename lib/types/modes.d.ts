/**
 * Task-mode definitions and reasoning-effort selection. Modes only supply
 * defaults: a user's explicit reasoning selection always wins (the adapter
 * applies that override in index.ts).
 */
import type { SolMode } from './config.ts';
export interface ModeDefinition {
    id: SolMode;
    label: string;
    /** Reasoning effort target for this mode, or null to leave the provider default. */
    reasoningTarget: string | null;
    /** Whether entering this mode requires explicit user confirmation. */
    requiresConfirmation: boolean;
    description: string;
}
export declare const MODES: Record<SolMode, ModeDefinition>;
/** Ordered reasoning-effort ids, low to high (matches the pi-ai effort set). */
export declare const REASONING_ORDER: readonly string[];
/** The reasoning target for a mode, or null when the mode leaves it unset. */
export declare function reasoningTargetFor(mode: SolMode): string | null;
/** Whether a mode requires explicit user confirmation before it applies. */
export declare function requiresConfirmation(mode: SolMode): boolean;
/** Whether a mode is read-only (diagnosis/review oriented). */
export declare function isReadOnlyMode(mode: SolMode): boolean;
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
export declare function availableReasoningEffort(target: string | null, supported: readonly string[], defaultEffort?: string): string | undefined;
export interface RequestOverrideInput {
    /** The request config the loop proposed (before plugin overrides). */
    base: {
        reasoningEffort?: string | undefined;
        maxTokens?: number | undefined;
    };
    /** The active task mode. */
    mode: SolMode;
    /** Whether the user explicitly selected the mode via `/sol mode …`. */
    modeExplicitlySelected: boolean;
    /** Whether the user opted in to mode-derived reasoning injection (config). */
    applyReasoningOverrides: boolean;
    /** Reasoning efforts the exact model supports (empty = none published). */
    supportedEfforts: readonly string[];
    /** Configured output-token cap; 0 disables the plugin's maxTokens injection. */
    configuredMaxOutputTokens: number;
}
export interface RequestOverrideResult {
    /** The reasoning effort to place on the request, or undefined to leave it unset. */
    reasoningEffort: string | undefined;
    /** The output-token cap to place on the request, or undefined to leave it unset. */
    maxTokens: number | undefined;
    /** The reasoning effort the plugin now regards as in effect (for `/sol status`). */
    appliedEffort: string | undefined;
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
export declare function resolveRequestOverrides(input: RequestOverrideInput): RequestOverrideResult;
/** The policy fields of one agent's mode state (a subset of the adapter's `AgentState`). */
export interface ModeState {
    mode: SolMode;
    modeExplicitlySelected: boolean;
    appliedEffort: string | undefined;
}
/** The initial policy state for a fresh agent. */
export declare function initialModeState(defaultMode: SolMode): ModeState;
/** Mark a mode as explicitly selected by the user; clears any tracked effort. */
export declare function selectModeState(state: ModeState, mode: SolMode): void;
/** Restore the default (not-explicitly-selected) policy state. */
export declare function resetModeState(state: ModeState, defaultMode: SolMode): void;
//# sourceMappingURL=modes.d.ts.map