/** Resolve capabilities from explicit config, exact route metadata, then conservative defaults. */
export function resolveCapabilities(route, overrides = {}) {
    const hasUser = Object.keys(overrides).length > 0;
    const reasoningEfforts = overrides.reasoningEfforts ?? route?.reasoning?.efforts.map(e => String(e.id)) ?? [];
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
    };
}
//# sourceMappingURL=capabilities.js.map