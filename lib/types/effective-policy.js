import { deniedCategoriesForMode, deniedToolsForMode } from "./tool-policy.js";
const READ_ONLY_SCOPES = new Set(['answer', 'diagnose', 'review', 'deep-analysis']);
const IMPLEMENTATION_MODES = new Set(['auto', 'coding', 'frontend', 'max', 'pro']);
/** Derive every tool and workflow permission from one mode/scope/phase tuple. */
export function resolveEffectivePolicy(input) {
    const readOnly = READ_ONLY_SCOPES.has(input.scope) || input.mode === 'review' || input.mode === 'deep-analysis';
    const allowsImplementation = !readOnly
        && IMPLEMENTATION_MODES.has(input.mode)
        && (input.scope === 'modify' || input.scope === 'frontend')
        && input.phase !== 'complete'
        && input.phase !== 'blocked';
    const deniedTools = readOnly ? deniedToolsForMode('review') : deniedToolsForMode(input.mode);
    return {
        ...input,
        readOnly,
        deniedTools,
        deniedCategories: deniedCategoriesForMode(readOnly ? 'review' : input.mode),
        allowsImplementation,
    };
}
//# sourceMappingURL=effective-policy.js.map