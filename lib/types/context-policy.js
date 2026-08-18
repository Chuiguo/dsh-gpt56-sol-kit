/**
 * Context-window policy: occupancy classification and the compaction summary
 * rule (keep the goal, constraints, key decisions, file edits, and unfinished
 * tasks; drop verbose reasoning). Pure and dependency-free.
 */
/**
 * Classify context occupancy against two ceilings:
 *
 *  - warn ceiling    = softLimit ?? window * warnAtPercent/100  ("remind")
 *  - compact ceiling = hardLimit ?? window * compactAtPercent/100 ("delegate to
 *    the harness compaction")
 *
 * When the exact-model window is unknown, only an explicit limit can produce a
 * decision; otherwise the decision is 'ok' with a note that capacity is unknown
 * (a ceiling is never fabricated from the model name).
 *
 * @param input Measured tokens plus policy knobs.
 * @returns The decision.
 */
export function contextDecision(input) {
    const window = input.contextWindow;
    const warnLimit = input.softLimit ?? (window !== null ? Math.floor(window * input.warnAtPercent / 100) : null);
    const compactLimit = input.hardLimit ?? (window !== null ? Math.floor(window * input.compactAtPercent / 100) : null);
    const percent = window !== null ? Math.round(input.surfaceTokens * 100 / window) : null;
    if (compactLimit !== null && input.surfaceTokens >= compactLimit) {
        return { action: 'compact', percent, warnLimit, compactLimit, detail: 'at or above the compact ceiling; compaction required' };
    }
    if (warnLimit !== null && input.surfaceTokens >= warnLimit) {
        return { action: 'warn', percent, warnLimit, compactLimit, detail: 'at or above the warn ceiling' };
    }
    return {
        action: 'ok',
        percent,
        warnLimit,
        compactLimit,
        detail: window === null ? 'model context window unknown; only token counts are shown' : 'within limits',
    };
}
/** Kinds retained by a compaction summary. */
const KEEP_KINDS = new Set(['goal', 'constraint', 'decision', 'file', 'todo']);
/**
 * Select the items a compaction summary must keep. Reasoning and other
 * long-form text is dropped.
 *
 * @param items The context items.
 * @returns The retained items.
 */
export function keepForCompaction(items) {
    return items.filter(item => KEEP_KINDS.has(item.kind));
}
/**
 * Render a compaction summary that preserves the goal, constraints, key
 * decisions, file edits, and unfinished tasks, and never silently drops a
 * user file or critical evidence.
 *
 * @param items The context items.
 * @returns A compact summary, or '' when there is nothing to keep.
 */
export function summarizeForCompaction(items) {
    const kept = keepForCompaction(items);
    if (kept.length === 0)
        return '';
    const sections = {
        goal: [], constraint: [], decision: [], file: [], todo: [], reasoning: [], other: [],
    };
    for (const item of kept)
        sections[item.kind].push(item.text);
    const blocks = [];
    if (sections.goal.length > 0)
        blocks.push('Goal:\n' + sections.goal.map(t => `- ${t}`).join('\n'));
    if (sections.constraint.length > 0)
        blocks.push('Constraints:\n' + sections.constraint.map(t => `- ${t}`).join('\n'));
    if (sections.decision.length > 0)
        blocks.push('Key decisions:\n' + sections.decision.map(t => `- ${t}`).join('\n'));
    if (sections.file.length > 0)
        blocks.push('Files modified:\n' + sections.file.map(t => `- ${t}`).join('\n'));
    if (sections.todo.length > 0)
        blocks.push('Unfinished:\n' + sections.todo.map(t => `- ${t}`).join('\n'));
    return blocks.join('\n\n');
}
//# sourceMappingURL=context-policy.js.map