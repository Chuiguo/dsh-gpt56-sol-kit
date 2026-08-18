/**
 * Context-window policy: occupancy classification and the compaction summary
 * rule (keep the goal, constraints, key decisions, file edits, and unfinished
 * tasks; drop verbose reasoning). Pure and dependency-free.
 */
/** A label on a context item to keep or drop during compaction. */
export type CompactionKind = 'goal' | 'constraint' | 'decision' | 'file' | 'todo' | 'reasoning' | 'other';
export interface CompactionItem {
    kind: CompactionKind;
    text: string;
}
export interface ContextPolicyInput {
    /** Current projected surface tokens. */
    surfaceTokens: number;
    /** Exact-model context window in tokens, or null when unknown. */
    contextWindow: number | null;
    /** Explicit soft limit, or null to derive from contextWindow * warnAtPercent. */
    softLimit: number | null;
    /** Explicit hard limit, or null to derive from contextWindow * compactAtPercent. */
    hardLimit: number | null;
    warnAtPercent: number;
    compactAtPercent: number;
}
export type ContextAction = 'ok' | 'warn' | 'compact';
export interface ContextDecision {
    action: ContextAction;
    /** Occupancy percent against the best-known window, or null when unknown. */
    percent: number | null;
    /** The effective warn ceiling, or null when unknown. */
    warnLimit: number | null;
    /** The effective compact ceiling, or null when unknown. */
    compactLimit: number | null;
    detail: string;
}
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
export declare function contextDecision(input: ContextPolicyInput): ContextDecision;
/**
 * Select the items a compaction summary must keep. Reasoning and other
 * long-form text is dropped.
 *
 * @param items The context items.
 * @returns The retained items.
 */
export declare function keepForCompaction(items: readonly CompactionItem[]): CompactionItem[];
/**
 * Render a compaction summary that preserves the goal, constraints, key
 * decisions, file edits, and unfinished tasks, and never silently drops a
 * user file or critical evidence.
 *
 * @param items The context items.
 * @returns A compact summary, or '' when there is nothing to keep.
 */
export declare function summarizeForCompaction(items: readonly CompactionItem[]): string;
//# sourceMappingURL=context-policy.d.ts.map