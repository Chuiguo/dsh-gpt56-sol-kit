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
export function globToRegExp(pattern) {
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(`^(?:${escaped})$`, 'i');
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
export function matchesPattern(value, pattern) {
    const p = pattern.trim();
    if (p === '' || p === '*')
        return true;
    const v = value.trim().toLowerCase();
    const needle = p.toLowerCase();
    if (p.includes('*'))
        return globToRegExp(p).test(v);
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
export function matchesAnyModel(model, patterns) {
    if (patterns.length === 0)
        return false;
    return patterns.some(pattern => matchesPattern(model, pattern));
}
/**
 * Whether a provider route matches the configured provider pattern.
 *
 * @param provider The provider route key.
 * @param providerPattern The configured provider pattern.
 * @returns Whether the provider matches.
 */
export function matchesProvider(provider, providerPattern) {
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
export function isSolRoute(provider, model, config) {
    if (!config.enabled)
        return false;
    if (!matchesProvider(provider, config.providerPattern))
        return false;
    return matchesAnyModel(model, config.modelPatterns);
}
/**
 * Whether a model id matches at all (provider-independent). Useful for a quick
 * model-only check in status output.
 *
 * @param model The model id to test.
 * @param patterns The configured model patterns.
 * @returns Whether the model matches.
 */
export function isSolModel(model, patterns) {
    return matchesAnyModel(model, patterns);
}
//# sourceMappingURL=model-match.js.map