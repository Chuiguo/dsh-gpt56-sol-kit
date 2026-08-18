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

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import type { Session, SessionEvent } from '@deepseek-ai/dsh-session'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { LlmCallConfig, TokenUsage } from '@deepseek-ai/dsh-llm'
import { createUserMessage, ReasoningEffortId } from '@deepseek-ai/dsh-llm'
import type { CommandInvocation, CommandResult } from '@deepseek-ai/dsh-commands'
// Type-only edges: resolve ctx.systemPrompt / ctx.tools / ctx.tokenMeter.
import type {} from '@deepseek-ai/dsh-system-prompt'
import type {} from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-token-meter'

import { DEFAULT_CONFIG, MODE_IDS, isSolMode, normalizeConfig } from './config.ts'
import type { Config, SolMode } from './config.ts'
import { isSolRoute } from './model-match.ts'
import { MODES, initialModeState, requiresConfirmation, resetModeState, resolveRequestOverrides, selectModeState } from './modes.ts'
import { solPromptSection } from './prompt.ts'
import { deniedCategoriesForMode, deniedToolsForMode, isMutatingTool } from './tool-policy.ts'
import { contextDecision } from './context-policy.ts'
import { budgetDecision, computeCost, pricesKnown } from './cost.ts'
import { parseSolCommand, renderBudget, renderCapabilities, renderStatus, renderWorkflow } from './commands.ts'
import { classifyTask } from './task-profile.ts'
import { createWorkflow, transition } from './workflow.ts'
import type { WorkflowState } from './workflow.ts'
import { resolveCapabilities } from './capabilities.ts'
import { evaluateBudget } from './budget-v2.ts'
import { resolveEffectivePolicy } from './effective-policy.ts'
import { assessVerification, looksLikeCredentialLeak } from './verify.ts'
import { classifyFailure } from './preflight.ts'

export const name = 'gpt56-sol-kit'

interface SolPersistedState {
  schemaVersion: 1
  mode: SolMode
  modeExplicitlySelected: boolean
  workflow: WorkflowState
  inputTokens: number
  cachedInputTokens: number
  outputTokens: number
  startedAt: number
  consecutiveToolErrors: number
  classifiedTurn?: number
}

declare module '@deepseek-ai/dsh-session/types' {
  interface SessionEventMap {
    /** Latest replayable Sol mode, workflow, budget counters, and verification progress snapshot. */
    'gpt56-sol/state': SolPersistedState
  }
}

/** Core services every agent composition provides; nothing optional here. */
export const inject = ['systemPrompt', 'tools']

/** Settings namespace id (lowercase kebab). */
const SETTINGS_NS = settingsNamespace('gpt56-sol-kit')

/** Prompt section order: after persona (0), before tool guidance (100–199). */
const SECTION_ORDER = 40

interface RouteInfo {
  supported: readonly string[]
  defaultEffort?: string
  contextWindow: number | null
  capabilities: ReturnType<typeof resolveCapabilities>
}

/** Per-agent runtime state, keyed by the agent's session. */
interface AgentState {
  mode: SolMode
  /** Whether the user explicitly selected the mode via `/sol mode …`. */
  modeExplicitlySelected: boolean
  appliedEffort: string | undefined
  restricted: boolean
  restrictDisposer: (() => void) | undefined
  inputTokens: number
  cachedInputTokens: number
  outputTokens: number
  warned: boolean
  workflow: WorkflowState
  startedAt: number
  consecutiveToolErrors: number
  classifiedTurn: number | undefined
}

/** Resolve the exact-model reasoning/context metadata, cached per route. */
function routeKey(provider: string, model: string): string {
  return `${provider}\u0000${model}`
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
  secondPass: z.boolean().default(DEFAULT_CONFIG.secondPass),
  useSubagents: z.boolean().default(DEFAULT_CONFIG.useSubagents),
  maxWorkflowSteps: z.number().step(1).min(0).default(DEFAULT_CONFIG.maxWorkflowSteps),
  maxFixRounds: z.number().step(1).min(0).default(DEFAULT_CONFIG.maxFixRounds),
  maxConsecutiveToolErrors: z.number().step(1).min(0).default(DEFAULT_CONFIG.maxConsecutiveToolErrors),
  maxIdenticalErrorRetries: z.number().step(1).min(0).default(DEFAULT_CONFIG.maxIdenticalErrorRetries),
  maxWallTimeMinutes: z.number().step(1).min(0).default(DEFAULT_CONFIG.maxWallTimeMinutes),
  maxInputTokens: z.union([z.natural(), z.const(null)]).default(null),
  maxOutputTokensTotal: z.union([z.natural(), z.const(null)]).default(null),
  maxSessionCost: z.union([z.number().min(0), z.const(null)]).default(null),
  hardBudgetEnforcement: z.boolean().default(DEFAULT_CONFIG.hardBudgetEnforcement),
})

export function apply(ctx: Context, config?: Config): void {
  const entryConfig = normalizeConfig(config)
  let runtimeConfig = entryConfig
  const states = new WeakMap<Session, AgentState>()
  const routeInfos = new Map<string, RouteInfo | undefined>()
  const pendingPersistence = new WeakSet<Session>()

  const STATE_EVENT = 'gpt56-sol/state' as const


  /** Read the exact-model metadata for a route, or undefined on failure. */
  async function resolveRouteInfo(provider: string, model: string, signal?: AbortSignal): Promise<RouteInfo | undefined> {
    const key = routeKey(provider, model)
    const cached = routeInfos.get(key)
    if (cached !== undefined) return cached
    const llm = ctx.get('llm')
    if (llm === undefined) return undefined
    let info: RouteInfo | undefined
    try {
      const resolved = await llm.resolveModelInfo(provider, model, signal)
      const defaultEffort = resolved.reasoning?.defaultEffort
      const capabilities = resolveCapabilities(resolved)
      info = {
        supported: capabilities.reasoningEfforts,
        ...(defaultEffort === undefined ? {} : { defaultEffort: String(defaultEffort) }),
        contextWindow: capabilities.contextWindow,
        capabilities,
      }
    } catch {
      info = undefined
    }
    routeInfos.set(key, info)
    return info
  }

  function routeFor(agent: Agent): { provider: string; model: string } | undefined {
    const { provider, model } = agent.options
    if (typeof provider !== 'string' || provider === '' || typeof model !== 'string' || model === '') return undefined
    return { provider, model }
  }

  function isSolAgent(agent: Agent): boolean {
    const route = routeFor(agent)
    return route !== undefined && isSolRoute(route.provider, route.model, runtimeConfig)
  }

  function stateFor(agent: Agent): AgentState {
    let state = states.get(agent.session)
    if (state === undefined) {
      state = {
        ...initialModeState(runtimeConfig.defaultMode),
        restricted: false,
        restrictDisposer: undefined,
        inputTokens: 0,
        cachedInputTokens: 0,
        outputTokens: 0,
        warned: false,
        workflow: createWorkflow(classifyTask('', runtimeConfig.defaultMode)),
        startedAt: Date.now(),
        consecutiveToolErrors: 0,
        classifiedTurn: undefined,
      }
      states.set(agent.session, state)
    }
    return state
  }

  function persistState(agent: Agent, state: AgentState): void {
    agent.session.append(STATE_EVENT, {
      schemaVersion: 1,
      mode: state.mode,
      modeExplicitlySelected: state.modeExplicitlySelected,
      workflow: state.workflow,
      inputTokens: state.inputTokens,
      cachedInputTokens: state.cachedInputTokens,
      outputTokens: state.outputTokens,
      startedAt: state.startedAt,
      consecutiveToolErrors: state.consecutiveToolErrors,
      ...(state.classifiedTurn === undefined ? {} : { classifiedTurn: state.classifiedTurn }),
    })
  }

  function restoreState(agent: Agent, state: AgentState): void {
    const event = [...agent.session.events].reverse().find(item => item.type === STATE_EVENT)
    if (event === undefined) return
    const saved = event.data as unknown as Partial<SolPersistedState> & { schemaVersion?: unknown }
    if (saved.schemaVersion !== 1 || !isSolMode(saved.mode) || saved.workflow === undefined || typeof saved.workflow.phase !== 'string') {
      ctx.logger.warn('gpt56-sol-kit: ignoring invalid persisted state')
      return
    }
    const valid = saved as SolPersistedState
    state.mode = valid.mode
    state.modeExplicitlySelected = valid.modeExplicitlySelected
    state.workflow = valid.workflow
    state.inputTokens = valid.inputTokens
    state.cachedInputTokens = valid.cachedInputTokens
    state.outputTokens = valid.outputTokens
    state.startedAt = valid.startedAt
    state.consecutiveToolErrors = valid.consecutiveToolErrors
    state.classifiedTurn = valid.classifiedTurn
    applyRestriction(agent, state)
  }

  function resetWorkflow(agent: Agent, state: AgentState): void {
    resetModeState(state, entryConfig.defaultMode)
    state.workflow = createWorkflow(classifyTask('', entryConfig.defaultMode))
    state.warned = false
    state.consecutiveToolErrors = 0
    state.classifiedTurn = undefined
    applyRestriction(agent, state)
    persistState(agent, state)
  }

  function effectivePolicy(state: AgentState) {
    return resolveEffectivePolicy({
      mode: state.mode,
      scope: state.workflow.profile.scope,
      phase: state.workflow.phase,
    })
  }

  /** Apply (or replace) the agent-scoped tool restriction from the effective policy. */
  function applyRestriction(agent: Agent, state: AgentState): void {
    const denied = effectivePolicy(state).deniedTools
    if (state.restrictDisposer !== undefined) {
      state.restrictDisposer()
      state.restrictDisposer = undefined
    }
    state.restricted = false
    if (denied.length === 0) return
    // restrict() rejects unknown tool names, so only deny tools this
    // deployment actually mounted; the guard still enforces read-only modes.
    const known = denied.filter(name => ctx.tools.get(name) !== undefined)
    if (known.length === 0) return
    state.restrictDisposer = agent.ctx.tools.restrict({ deny: known })
    state.restricted = true
  }

  /** Switch an agent's mode and re-apply everything the mode changes. */
  function switchMode(agent: Agent, state: AgentState, mode: SolMode): void {
    selectModeState(state, mode)
    const profile = classifyTask('', mode)
    state.workflow = createWorkflow(profile)
    state.warned = false
    applyRestriction(agent, state)
    persistState(agent, state)
    agent.inject(createUserMessage({
      content: [{ type: 'text', text: `The user switched this session to the ${mode} Sol mode (${MODES[mode].label}).` }],
      source: { kind: 'plugin', plugin: name, form: 'notice', summary: `Sol mode set to ${mode}` },
    }))
  }

  // ---- Settings namespace (optional seam) ---------------------------------
  ctx.inject(['settings'], (settingsCtx) => {
    const scope = settingsCtx.settings.register(SETTINGS_NS, SolConfigSchema, { base: entryConfig })
    const applyResolved = (value: unknown) => {
      try {
        runtimeConfig = normalizeConfig(value)
      } catch (error) {
        ctx.logger.warn('gpt56-sol-kit: invalid settings ignored: %o', error)
      }
    }
    try {
      applyResolved(scope.get())
    } catch {
      // Base layer already validated at load; a stored section failure keeps the last good value.
    }
    scope.watch((next) => {
      applyResolved(next)
    })
  })

  // ---- Restore durable plugin state before the first resumed request --------
  ctx.on('agent/session-start', ({ agent }) => {
    if (!isSolAgent(agent)) return
    restoreState(agent, stateFor(agent))
  })

  ctx.on('agent/request-error', async ({ agent, failure }, next) => {
    if (!isSolAgent(agent)) return next()
    const state = stateFor(agent)
    const text = JSON.stringify(failure)
    const failureClass = classifyFailure({ message: text }, { command: 'provider request' })
    state.consecutiveToolErrors += 1
    if (state.workflow.phase !== 'complete' && state.workflow.phase !== 'blocked') {
      state.workflow = transition(state.workflow, 'blocked', { kind: 'blocked', detail: `${failureClass}: provider request failed`, passed: false })
    }
    persistState(agent, state)
    return next()
  })

  // ---- Sol prompt section (conditional on the current route) --------------
  ctx.systemPrompt.section({
    name: 'gpt56-sol:policy',
    order: SECTION_ORDER,
    text: (context) => {
      const agent = (context as { agent?: Agent }).agent
      if (agent === undefined || !isSolAgent(agent)) return ''
      return solPromptSection(stateFor(agent).mode)
    },
  })

  // ---- Task profiling and phase initialization ----------------------------
  ctx.on('agent/pre-step', async ({ agent, messages, turn }, next) => {
    if (!isSolAgent(agent)) return next()
    const state = stateFor(agent)
    if (state.mode === 'auto' && state.classifiedTurn !== turn) {
      const directUser = [...messages].reverse().find(message => message.source.kind === 'user')
      const request = directUser === undefined
        ? ''
        : directUser.content.filter(block => block.type === 'text').map(block => block.text).join(' ')
      const profile = classifyTask(request)
      state.workflow = createWorkflow(profile)
      state.classifiedTurn = turn
      applyRestriction(agent, state)
      const evidence = { kind: 'inspection' as const, detail: `classified ${profile.scope} task` }
      const nextPhase = effectivePolicy(state).allowsImplementation ? 'implement' as const : 'verify' as const
      state.workflow = transition(state.workflow, nextPhase, evidence)
      persistState(agent, state)
    }
    return next()
  })

  // ---- Backend enforcement: read-only modes and hard budget ---------------
  ctx.tools.guard((execution) => {
    const agent = execution.agent
    if (agent === undefined) return undefined
    const state = states.get(agent.session)
    if (state === undefined) return undefined
    const policy = effectivePolicy(state)
    if (policy.readOnly && isMutatingTool(execution.name)) {
      return `tool "${execution.name}" is disabled in ${policy.scope} scope`
    }
    const info = evaluateBudget(runtimeConfig, {
      steps: state.workflow.steps,
      fixRounds: state.workflow.fixRounds,
      consecutiveToolErrors: state.consecutiveToolErrors,
      inputTokens: state.inputTokens,
      outputTokens: state.outputTokens,
      sessionCost: computeCost({
        inputTokens: state.inputTokens,
        cachedInputTokens: state.cachedInputTokens,
        outputTokens: state.outputTokens,
      }, runtimeConfig),
      elapsedMinutes: (Date.now() - state.startedAt) / 60000,
    })
    if (info.hardStop) return info.reason ?? 'V2 hard budget limit reached.'
    return undefined
  })

  // ---- Reasoning + output cap + context warning at each request ----------
  ctx.on('agent/request', async (payload, next): Promise<LlmCallConfig> => {
    const base = await next()
    const agent = payload.agent
    if (!isSolAgent(agent)) return base
    const state = stateFor(agent)
    const route = routeFor(agent)
    const nextConfig: LlmCallConfig = { ...base }

    if (route !== undefined) {
      const info = await resolveRouteInfo(route.provider, route.model, payload.signal)

      // Compatibility-first overrides: never rewrite reasoning in the default
      // state, never override an existing effort or output cap. A value that is
      // already present is always left alone, so tool-continuation rounds and
      // user overrides stay byte-stable. See resolveRequestOverrides().
      const overrides = resolveRequestOverrides({
        base: { reasoningEffort: nextConfig.reasoningEffort, maxTokens: nextConfig.maxTokens },
        mode: state.mode,
        modeExplicitlySelected: state.modeExplicitlySelected,
        applyReasoningOverrides: runtimeConfig.applyReasoningOverrides,
        supportedEfforts: info?.supported ?? [],
        configuredMaxOutputTokens: runtimeConfig.maxOutputTokens,
      })
      if (overrides.reasoningEffort === undefined) delete nextConfig.reasoningEffort
      else nextConfig.reasoningEffort = ReasoningEffortId(overrides.reasoningEffort)
      if (overrides.maxTokens === undefined) delete nextConfig.maxTokens
      else nextConfig.maxTokens = overrides.maxTokens
      state.appliedEffort = overrides.appliedEffort

      // Context warning (advisory only; the harness compaction owns the fix).
      const tokenMeter = ctx.get('tokenMeter')
      const surfaceTokens = tokenMeter === undefined
        ? estimateSurfaceTokens(agent)
        : tokenMeter.measure(agent.session).surfaceTokens
      const contextPressure = contextDecision({
        surfaceTokens,
        contextWindow: info?.contextWindow ?? null,
        softLimit: runtimeConfig.contextSoftLimit,
        hardLimit: runtimeConfig.contextHardLimit,
        warnAtPercent: runtimeConfig.warnAtPercent,
        compactAtPercent: runtimeConfig.compactAtPercent,
      })
      if (contextPressure.action !== 'ok' && !state.warned) {
        state.warned = true
        agent.inject(createUserMessage({
          content: [{ type: 'text', text: `Context pressure notice: ${contextPressure.detail}.` }],
          source: { kind: 'plugin', plugin: name, form: 'notice', summary: 'context pressure' },
        }))
      }
    }

    return nextConfig
  })

  // ---- Per-agent restriction at publication ------------------------------
  ctx.on('agent/created', (payload) => {
    const agent = payload.agent
    if (!isSolAgent(agent)) return
    const state = stateFor(agent)
    applyRestriction(agent, state)
  })

  // ---- Cleanup on disposal -----------------------------------------------
  ctx.on('agent/disposed', (payload) => {
    const state = states.get(payload.agent.session)
    if (state === undefined) return
    if (state.restrictDisposer !== undefined) state.restrictDisposer()
    states.delete(payload.agent.session)
  })

  // ---- Provider-reported usage tracking ----------------------------------
  ctx.on('session/event', (session: Session, event: SessionEvent) => {
    const state = states.get(session)
    if (state === undefined) return
    if (event.type === STATE_EVENT) return
    if (event.type === 'assistant/message') {
      const usage: TokenUsage | undefined = event.data.usage
      if (usage !== undefined) {
        state.inputTokens += usage.inputTokens
        state.cachedInputTokens += (usage.cacheReadTokens ?? 0) + (usage.cacheWriteTokens ?? 0)
        state.outputTokens += usage.outputTokens
      }
      persistStateForSession(session, state)
      return
    }
    if (event.type === 'tool/result') {
      if (event.data.error !== undefined) state.consecutiveToolErrors += 1
      else state.consecutiveToolErrors = 0
      const failureClass = event.data.error === undefined
        ? undefined
        : classifyFailure({ message: event.data.error.code, code: event.data.error.code }, { command: event.data.message.source.callId })
      const evidence = event.data.error === undefined
        ? { kind: 'implementation' as const, detail: `tool ${event.data.message.source.callId} completed`, passed: true }
        : { kind: 'failure' as const, detail: `${failureClass}: ${event.data.error.code}`, passed: false }
      if (state.workflow.phase === 'implement' && event.data.error === undefined) {
        state.workflow = transition(state.workflow, 'verify', evidence)
      } else if (state.workflow.phase === 'verify' && event.data.error !== undefined) {
        const next = state.workflow.fixRounds < runtimeConfig.maxFixRounds ? 'fix' as const : 'blocked' as const
        state.workflow = transition(state.workflow, next, evidence)
      }
      persistStateForSession(session, state)
    }
  })

  function persistStateForSession(session: Session, state: AgentState): void {
    if (pendingPersistence.has(session)) return
    pendingPersistence.add(session)
    queueMicrotask(() => {
      pendingPersistence.delete(session)
      session.append(STATE_EVENT, {
        schemaVersion: 1,
        mode: state.mode,
        modeExplicitlySelected: state.modeExplicitlySelected,
        workflow: state.workflow,
        inputTokens: state.inputTokens,
        cachedInputTokens: state.cachedInputTokens,
        outputTokens: state.outputTokens,
        startedAt: state.startedAt,
        consecutiveToolErrors: state.consecutiveToolErrors,
        ...(state.classifiedTurn === undefined ? {} : { classifiedTurn: state.classifiedTurn }),
      })
    })
  }

  // ---- `/sol` command (optional seam) -------------------------------------
  ctx.inject(['commands'], (commandCtx) => {
    commandCtx.commands.register({
      name: 'sol',
      description: 'Show or control the GPT-5.6-Sol companion plugin',
      input: { hint: '[status|mode <name> [--confirm]|budget|verify|review|reset]' },
      recordInput: false,
      handler: (invocation: CommandInvocation) => handleSolCommand(invocation),
    })
  })

  function handleSolCommand(invocation: CommandInvocation): CommandResult {
    const { agent, rawInput } = invocation
    const route = routeFor(agent)
    const isSol = route !== undefined && isSolRoute(route.provider, route.model, runtimeConfig)
    const state = isSol ? stateFor(agent) : undefined
    const command = parseSolCommand(rawInput)

    switch (command.action) {
      case 'status':
        return {
          kind: 'success',
          text: renderStatus(buildStatus(agent, route, state)),
        }
      case 'phase':
        if (!isSol || state === undefined) return { kind: 'error', text: 'Sol mode is inactive for the current model.' }
        return {
          kind: 'success',
          text: renderWorkflow({
            phase: state.workflow.phase,
            scope: state.workflow.profile.scope,
            steps: state.workflow.steps,
            fixRounds: state.workflow.fixRounds,
            lastError: state.workflow.lastError,
          }),
        }
      case 'workflow':
        if (!isSol || state === undefined) return { kind: 'error', text: 'Sol mode is inactive for the current model.' }
        if (command.reset) {
          resetWorkflow(agent, state)
          return { kind: 'success', text: 'Sol workflow reset; provider, model, and credentials were preserved.' }
        }
        return {
          kind: 'success',
          text: renderWorkflow({
            phase: state.workflow.phase,
            scope: state.workflow.profile.scope,
            steps: state.workflow.steps,
            fixRounds: state.workflow.fixRounds,
            lastError: state.workflow.lastError,
          }),
        }
      case 'capabilities': {
        if (!isSol) return { kind: 'error', text: 'Sol mode is inactive for the current model.' }
        const info = routeInfos.get(routeKey(route.provider, route.model))
        return {
          kind: 'success',
          text: renderCapabilities(info === undefined ? resolveCapabilities(undefined) : info.capabilities),
        }
      }
      case 'budget':
        return {
          kind: 'success',
          text: renderBudget(buildBudget(agent, state)),
        }
      case 'review':
        if (!isSol || state === undefined) return { kind: 'error', text: 'Sol mode is inactive for the current model.' }
        switchMode(agent, state, 'review')
        return { kind: 'success', text: 'Switched to review mode (read-only). Use /sol mode <name> to change.' }
      case 'reset': {
        const settings = ctx.get('settings')
        if (settings === undefined) return { kind: 'error', text: 'No settings provider is mounted; reset is unavailable.' }
        void settings.replace(SETTINGS_NS, {}).catch((error: unknown) => {
          ctx.logger.warn('gpt56-sol-kit: reset failed: %o', error)
        })
        if (state !== undefined) {
          resetWorkflow(agent, state)
        }
        return { kind: 'success', text: 'Sol plugin settings reset to defaults (provider, model, and API key untouched).' }
      }
      case 'verify': {
        if (!isSol || state === undefined) return { kind: 'error', text: 'Sol mode is inactive for the current model.' }
        const toolCalls = agent.session.events.filter(event => event.type === 'tool/call')
        const toolResults = agent.session.events.filter(event => event.type === 'tool/result')
        const failures = toolResults.filter(event => event.data.error !== undefined)
        const successfulResultIds = new Set(toolResults
          .filter(event => event.data.error === undefined)
          .map(event => event.data.message.source.callId))
        const testCalls = toolCalls.filter(event => /test|vitest|jest/.test(event.data.name + ' ' + event.data.arguments))
        const buildCalls = toolCalls.filter(event => /build|tsc|compile/.test(event.data.name + ' ' + event.data.arguments))
        const browserCalls = toolCalls.filter(event => /browser|playwright/.test(event.data.name + ' ' + event.data.arguments))
        const resultForCall = (call: typeof toolCalls[number]) => successfulResultIds.has(call.data.callId)
        const result = assessVerification({
          goalCompleted: state.workflow.phase === 'complete',
          files: [],
          diffOnlyRelevant: false,
          diffInspected: false,
          testsRan: testCalls.length > 0,
          testsPassed: testCalls.length > 0 && testCalls.every(resultForCall),
          buildRan: buildCalls.length > 0,
          buildPassed: buildCalls.length > 0 && buildCalls.every(resultForCall),
          webTask: state.workflow.profile.scope === 'frontend',
          browserAcceptance: browserCalls.length > 0 && browserCalls.every(resultForCall),
          claimsExaggerated: false,
          unexplainedFailures: failures.map(event => event.data.error?.code ?? 'tool failure'),
          credentialsLeaked: agent.session.events.some(event => looksLikeCredentialLeak(JSON.stringify(event.data))),
        })
        const lines = [renderWorkflow({ phase: state.workflow.phase, scope: state.workflow.profile.scope, steps: state.workflow.steps, fixRounds: state.workflow.fixRounds, lastError: state.workflow.lastError }), '', `Result: ${result.status}`, 'Requirements:', ...result.requirements, 'Evidence:', `Tool calls: ${toolCalls.length}`, `Tool results: ${toolResults.length}`, 'Failures:', ...result.failures, 'Unauthorized changes:', ...result.unauthorizedChanges, `Required next action: ${result.requiredNextAction}`, `Can report complete: ${result.canReportComplete ? 'yes' : 'no'}`]
        return { kind: 'success', text: lines.join('\\n') }
      }
      case 'mode': {
        if (!isSol || state === undefined) return { kind: 'error', text: 'Sol mode is inactive for the current model.' }
        if (command.name === undefined) {
          return { kind: 'success', text: `Current mode: ${state.mode}. Available: ${MODE_IDS.join(', ')}` }
        }
        if (!isSolMode(command.name)) {
          return { kind: 'error', text: `Unknown mode "${command.name}". Available: ${MODE_IDS.join(', ')}` }
        }
        if (command.name === 'pro') {
          return { kind: 'error', text: 'pro mode requires the relay route to expose a `pro` reasoning effort; it is never inferred from the model name.' }
        }
        const needsConfirmation = requiresConfirmation(command.name)
        const confirmFlag = runtimeConfig.maxRequiresConfirmation
        if (needsConfirmation && confirmFlag && !command.confirm) {
          return {
            kind: 'error',
            text: `"${command.name}" mode carries latency, token, and cost risk. Confirm with /sol mode ${command.name} --confirm.`,
          }
        }
        switchMode(agent, state, command.name)
        return { kind: 'success', text: `Switched to ${command.name} mode (${MODES[command.name].label}).` }
      }
      case 'unknown':
        return { kind: 'error', text: `Unknown /sol subcommand "${command.text}". Try: status, mode, phase, workflow, budget, capabilities, verify, review, reset.` }
      default:
        return { kind: 'error', text: 'Unrecognized /sol command.' }
    }
  }

  function buildStatus(agent: Agent, route: { provider: string; model: string } | undefined, state: AgentState | undefined) {
    const tokenMeter = ctx.get('tokenMeter')
    const mode = state?.mode ?? runtimeConfig.defaultMode
    return {
      enabled: runtimeConfig.enabled,
      isSol: state !== undefined,
      provider: route?.provider ?? '',
      model: route?.model ?? '',
      mode,
      modeExplicitlySelected: state?.modeExplicitlySelected ?? false,
      reasoningOverridesEnabled: runtimeConfig.applyReasoningOverrides,
      reasoning: state?.appliedEffort ?? runtimeConfig.defaultReasoning,
      contextSoftLimit: runtimeConfig.contextSoftLimit,
      contextHardLimit: runtimeConfig.contextHardLimit,
      surfaceTokens: tokenMeter === undefined ? estimateSurfaceTokens(agent) : tokenMeter.measure(agent.session).surfaceTokens,
      sessionCost: state === undefined ? null : computeCost(
        { inputTokens: state.inputTokens, cachedInputTokens: state.cachedInputTokens, outputTokens: state.outputTokens },
        runtimeConfig,
      ),
      deniedTools: deniedToolsForMode(mode),
      deniedCategories: deniedCategoriesForMode(mode),
      pricesKnown: pricesKnown(runtimeConfig),
      workflowPhase: state?.workflow.phase ?? 'idle',
      workflowSteps: state?.workflow.steps ?? 0,
      fixRounds: state?.workflow.fixRounds ?? 0,
      lastError: state?.workflow.lastError ?? null,
      canReportComplete: state?.workflow.phase === 'complete',
    }
  }

  function buildBudget(_agent: Agent, state: AgentState | undefined) {
    const usage = {
      inputTokens: state?.inputTokens ?? 0,
      cachedInputTokens: state?.cachedInputTokens ?? 0,
      outputTokens: state?.outputTokens ?? 0,
    }
    const requestCost = computeCost(usage, runtimeConfig)
    const sessionCost = requestCost
    const decision = budgetDecision(requestCost ?? 0, sessionCost ?? 0, runtimeConfig.perRequestBudget, runtimeConfig.perSessionBudget)
    return {
      isSol: state !== undefined,
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
      elapsedMinutes: state === undefined ? 0 : Math.round((Date.now() - state.startedAt) / 60000 * 10) / 10,
      hardBudgetEnforcement: runtimeConfig.hardBudgetEnforcement,
      withinRequest: decision.withinRequest,
      withinSession: decision.withinSession,
    }
  }
}

/** Coarse surface-token estimate when the token meter is not composed. */
function estimateSurfaceTokens(agent: Agent): number {
  let chars = 0
  for (const event of agent.session.events) {
    if (event.type === 'user/message' || event.type === 'assistant/message') {
      const data = event.data as { content?: unknown }
      chars += JSON.stringify(data.content ?? '').length
    }
  }
  return Math.ceil(chars / 4)
}
