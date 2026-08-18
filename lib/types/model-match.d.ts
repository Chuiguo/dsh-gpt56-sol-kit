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
export declare function globToRegExp(pattern: string): RegExp;
/**
 * Match one value against one pattern. Empty or `*` matches anything; a `*`
 * wildcard is expanded; otherwise the match is case-insensitive exact or
 * substring (so `gpt-5.6` also matches `gpt-5.6-sol`).
 *
 * @param value The concrete value (provider route or model id).
 * @param pattern The configured pattern.
 * @returns Whether the value matches.
 */
export declare function matchesPattern(value: string, pattern: string): boolean;
/**
 * Whether a model id matches any configured model pattern. An empty pattern
 * list matches nothing (fail closed).
 *
 * @param model The model id to test.
 * @param patterns The configured model patterns.
 * @returns Whether the model matches.
 */
export declare function matchesAnyModel(model: string, patterns: readonly string[]): boolean;
/**
 * Whether a provider route matches the configured provider pattern.
 *
 * @param provider The provider route key.
 * @param providerPattern The configured provider pattern.
 * @returns Whether the provider matches.
 */
export declare function matchesProvider(provider: string, providerPattern: string): boolean;
/**
 * Whether the current (provider, model) route is a Sol route under the given
 * configuration. This is the single gate for every Sol-specific behavior.
 *
 * @param provider The provider route key.
 * @param model The model id.
 * @param config The resolved configuration.
 * @returns Whether the route is a Sol route.
 */
export declare function isSolRoute(provider: string, model: string, config: {
    enabled: boolean;
    providerPattern: string;
    modelPatterns: readonly string[];
}): boolean;
/**
 * Whether a model id matches at all (provider-independent). Useful for a quick
 * model-only check in status output.
 *
 * @param model The model id to test.
 * @param patterns The configured model patterns.
 * @returns Whether the model matches.
 */
export declare function isSolModel(model: string, patterns: readonly string[]): boolean;
//# sourceMappingURL=model-match.d.ts.map