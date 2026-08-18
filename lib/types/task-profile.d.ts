import type { SolMode } from './config.ts';
/** The operation scope inferred from one user task. */
export type TaskScope = 'answer' | 'diagnose' | 'modify' | 'review' | 'frontend' | 'deep-analysis';
/** Stable task profile selected at task start. */
export interface TaskProfile {
    scope: TaskScope;
    mode: SolMode;
    explicit: boolean;
    reason: string;
    requiresConfirmation: boolean;
}
/**
 * Classify a task without model calls. Explicit mode always wins over auto.
 * @param request Current user request.
 * @param explicitMode User-selected mode, when locked for this task.
 * @returns A stable profile suitable for workflow initialization.
 */
export declare function classifyTask(request: string, explicitMode?: SolMode): TaskProfile;
/** Whether a task scope may enter the implementation stage. */
export declare function allowsImplementation(scope: TaskScope): boolean;
/** Whether a mode must remain backend read-only. */
export declare function isProfileReadOnly(scope: TaskScope): boolean;
//# sourceMappingURL=task-profile.d.ts.map