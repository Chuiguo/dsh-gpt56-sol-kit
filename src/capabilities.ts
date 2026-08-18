import type { LlmResolvedModelInfo } from '@deepseek-ai/dsh-llm'

/** Read-only capabilities resolved for the exact provider/model route. */
export interface RouteCapabilities {
  protocol: string | null
  imageInput: boolean | null
  reasoningEfforts: readonly string[]
  reasoningModePro: boolean
  persistedReasoning: boolean | null
  programmaticToolCalling: boolean | null
  multiAgent: boolean | null
  toolContinuation: boolean | null
  contextWindow: number | null
  maxOutputTokens: number
  source: 'user' | 'route' | 'conservative-default'
}

/** Explicit user capability overrides; absent values never inherit from model names. */
export interface CapabilityOverrides {
  protocol?: string
  imageInput?: boolean
  reasoningEfforts?: readonly string[]
  reasoningModePro?: boolean
  persistedReasoning?: boolean
  programmaticToolCalling?: boolean
  multiAgent?: boolean
  toolContinuation?: boolean
  contextWindow?: number
  maxOutputTokens?: number
}

/** Resolve capabilities from explicit config, exact route metadata, then conservative defaults. */
export function resolveCapabilities(route: LlmResolvedModelInfo | undefined, overrides: CapabilityOverrides = {}): RouteCapabilities {
  const hasUser = Object.keys(overrides).length > 0
  const reasoningEfforts = overrides.reasoningEfforts ?? route?.reasoning?.efforts.map(e => String(e.id)) ?? []
  return {
    protocol: overrides.protocol ?? null,
    imageInput: overrides.imageInput ?? (route === undefined ? null : route.inputModalities?.includes('image') ?? false),
    reasoningEfforts,
    reasoningModePro: overrides.reasoningModePro ?? false,
    persistedReasoning: overrides.persistedReasoning ?? null,
    programmaticToolCalling: overrides.programmaticToolCalling ?? null,
    multiAgent: overrides.multiAgent ?? null,
    toolContinuation: overrides.toolContinuation ?? null,
    contextWindow: overrides.contextWindow ?? route?.context?.contextWindow ?? null,
    maxOutputTokens: overrides.maxOutputTokens ?? route?.defaultMaxTokens ?? 0,
    source: hasUser ? 'user' : route === undefined ? 'conservative-default' : 'route',
  }
}
