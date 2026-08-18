/**
 * Task-mode definitions and reasoning-effort selection. Modes only supply
 * defaults: a user's explicit reasoning selection always wins (the adapter
 * applies that override in index.ts).
 */

import type { SolMode } from './config.ts'

export interface ModeDefinition {
  id: SolMode
  label: string
  /** Reasoning effort target for this mode, or null to leave the provider default. */
  reasoningTarget: string | null
  /** Whether entering this mode requires explicit user confirmation. */
  requiresConfirmation: boolean
  description: string
}

export const MODES: Record<SolMode, ModeDefinition> = {
  auto: {
    id: 'auto',
    label: 'Auto',
    reasoningTarget: null,
    requiresConfirmation: false,
    description: 'Classify each new task once, then execute through workflow phases.',
  },
  balanced: {
    id: 'balanced',
    label: 'Balanced',
    reasoningTarget: 'medium',
    requiresConfirmation: false,
    description: 'Default mode: ordinary Q&A and small edits, lower latency.',
  },
  coding: {
    id: 'coding',
    label: 'Coding',
    reasoningTarget: 'high',
    requiresConfirmation: false,
    description: 'Check project rules, edit with file tools, run tests, review diff and results.',
  },
  frontend: {
    id: 'frontend',
    label: 'Frontend',
    reasoningTarget: 'high',
    requiresConfirmation: false,
    description: 'Visual hierarchy, responsive layout, interaction, accessibility, browser acceptance.',
  },
  review: {
    id: 'review',
    label: 'Review',
    reasoningTarget: 'high',
    requiresConfirmation: false,
    description: 'Read-only: report issues with file/line, separate confirmed/possible/false-positive.',
  },
  'deep-analysis': {
    id: 'deep-analysis',
    label: 'Deep Analysis',
    reasoningTarget: 'xhigh',
    requiresConfirmation: false,
    description: 'Novels, architecture, research, complex plans; parallel sub-agents; fact/inference/advice split.',
  },
  max: {
    id: 'max',
    label: 'Max',
    reasoningTarget: 'max',
    requiresConfirmation: true,
    description: 'Maximum reasoning; latency/token/cost risk; explicit user choice only.',
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    reasoningTarget: null,
    requiresConfirmation: true,
    description: 'Only when the relay route exposes a pro reasoning mode; independently configured.',
  },
}

/** Ordered reasoning-effort ids, low to high (matches the pi-ai effort set). */
export const REASONING_ORDER: readonly string[] = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']

/** The reasoning target for a mode, or null when the mode leaves it unset. */
export function reasoningTargetFor(mode: SolMode): string | null {
  return MODES[mode].reasoningTarget
}

/** Whether a mode requires explicit user confirmation before it applies. */
export function requiresConfirmation(mode: SolMode): boolean {
  return MODES[mode].requiresConfirmation
}

/** Whether a mode is read-only (diagnosis/review oriented). */
export function isReadOnlyMode(mode: SolMode): boolean {
  return mode === 'review' || mode === 'deep-analysis'
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
export function availableReasoningEffort(
  target: string | null,
  supported: readonly string[],
  defaultEffort?: string,
): string | undefined {
  if (target === null) return defaultEffort
  if (supported.includes(target)) return target
  const index = REASONING_ORDER.indexOf(target)
  if (index >= 0) {
    for (let i = index - 1; i >= 0; i--) {
      const candidate = REASONING_ORDER[i]
      if (candidate !== undefined && supported.includes(candidate)) return candidate
    }
  }
  return defaultEffort
}

export interface RequestOverrideInput {
  /** The request config the loop proposed (before plugin overrides). */
  base: { reasoningEffort?: string | undefined; maxTokens?: number | undefined }
  /** The active task mode. */
  mode: SolMode
  /** Whether the user explicitly selected the mode via `/sol mode …`. */
  modeExplicitlySelected: boolean
  /** Whether the user opted in to mode-derived reasoning injection (config). */
  applyReasoningOverrides: boolean
  /** Reasoning efforts the exact model supports (empty = none published). */
  supportedEfforts: readonly string[]
  /** Configured output-token cap; 0 disables the plugin's maxTokens injection. */
  configuredMaxOutputTokens: number
}

export interface RequestOverrideResult {
  /** The reasoning effort to place on the request, or undefined to leave it unset. */
  reasoningEffort: string | undefined
  /** The output-token cap to place on the request, or undefined to leave it unset. */
  maxTokens: number | undefined
  /** The reasoning effort the plugin now regards as in effect (for `/sol status`). */
  appliedEffort: string | undefined
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
export function resolveRequestOverrides(input: RequestOverrideInput): RequestOverrideResult {
  const { base, mode, modeExplicitlySelected, applyReasoningOverrides, supportedEfforts, configuredMaxOutputTokens } = input

  let reasoningEffort = base.reasoningEffort
  let appliedEffort: string | undefined = base.reasoningEffort
  if (applyReasoningOverrides && modeExplicitlySelected && base.reasoningEffort === undefined) {
    const target = reasoningTargetFor(mode)
    if (target !== null) {
      const chosen = availableReasoningEffort(target, supportedEfforts)
      reasoningEffort = chosen
      appliedEffort = chosen
    }
  }

  let maxTokens = base.maxTokens
  if (configuredMaxOutputTokens > 0 && base.maxTokens === undefined) {
    maxTokens = configuredMaxOutputTokens
  }

  return { reasoningEffort, maxTokens, appliedEffort }
}

/** The policy fields of one agent's mode state (a subset of the adapter's `AgentState`). */
export interface ModeState {
  mode: SolMode
  modeExplicitlySelected: boolean
  appliedEffort: string | undefined
}

/** The initial policy state for a fresh agent. */
export function initialModeState(defaultMode: SolMode): ModeState {
  return { mode: defaultMode, modeExplicitlySelected: false, appliedEffort: undefined }
}

/** Mark a mode as explicitly selected by the user; clears any tracked effort. */
export function selectModeState(state: ModeState, mode: SolMode): void {
  state.mode = mode
  state.modeExplicitlySelected = true
  state.appliedEffort = undefined
}

/** Restore the default (not-explicitly-selected) policy state. */
export function resetModeState(state: ModeState, defaultMode: SolMode): void {
  state.mode = defaultMode
  state.modeExplicitlySelected = false
  state.appliedEffort = undefined
}
