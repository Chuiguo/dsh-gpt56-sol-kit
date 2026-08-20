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
import type { Context } from '@deepseek-ai/cordis';
import type { Config, SolMode } from './config.ts';
import type { WorkflowState } from './workflow.ts';
export declare const name = "gpt56-sol-kit";
interface SolPersistedState {
    schemaVersion: 2;
    mode: SolMode;
    modeExplicitlySelected: boolean;
    workflow: WorkflowState;
    inputTokens: number;
    cachedInputTokens: number;
    outputTokens: number;
    startedAt: number;
    consecutiveToolErrors: number;
    consecutiveRequestErrors: number;
    lastRequestFailureFingerprint?: string;
    identicalRequestRetries: number;
    classifiedTurn?: number;
    taskStartedAtSeq: number;
    providerFailures: string[];
    confirmedRiskTask?: boolean;
}
declare module '@deepseek-ai/dsh-session/types' {
    interface SessionEventMap {
        /** Latest replayable Sol mode, workflow, budget counters, and verification progress snapshot. */
        'gpt56-sol/state': SolPersistedState;
    }
}
/** Core services every agent composition provides; nothing optional here. */
export declare const inject: string[];
export declare function apply(ctx: Context, config?: Config): void;
export {};
//# sourceMappingURL=index.d.ts.map