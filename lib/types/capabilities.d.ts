import type { LlmResolvedModelInfo } from '@deepseek-ai/dsh-llm';
/** Read-only capabilities resolved for the exact provider/model route. */
export interface RouteCapabilities {
    protocol: string | null;
    imageInput: boolean | null;
    reasoningEfforts: readonly string[];
    reasoningModePro: boolean;
    persistedReasoning: boolean | null;
    programmaticToolCalling: boolean | null;
    multiAgent: boolean | null;
    toolContinuation: boolean | null;
    contextWindow: number | null;
    maxOutputTokens: number;
    source: 'user' | 'route' | 'conservative-default';
}
/** Explicit user capability overrides; absent values never inherit from model names. */
export interface CapabilityOverrides {
    protocol?: string;
    imageInput?: boolean;
    reasoningEfforts?: readonly string[];
    reasoningModePro?: boolean;
    persistedReasoning?: boolean;
    programmaticToolCalling?: boolean;
    multiAgent?: boolean;
    toolContinuation?: boolean;
    contextWindow?: number;
    maxOutputTokens?: number;
}
/** Resolve capabilities from explicit config, exact route metadata, then conservative defaults. */
export declare function resolveCapabilities(route: LlmResolvedModelInfo | undefined, overrides?: CapabilityOverrides): RouteCapabilities;
//# sourceMappingURL=capabilities.d.ts.map