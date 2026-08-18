/** The single derived policy used by visibility and backend enforcement. */
import type { SolMode } from './config.ts';
import type { TaskScope } from './task-profile.ts';
import type { WorkflowPhase } from './workflow.ts';
export interface EffectivePolicyInput {
    mode: SolMode;
    scope: TaskScope;
    phase: WorkflowPhase;
}
export interface EffectivePolicy {
    mode: SolMode;
    scope: TaskScope;
    phase: WorkflowPhase;
    readOnly: boolean;
    deniedTools: string[];
    deniedCategories: string[];
    allowsImplementation: boolean;
}
/** Derive every tool and workflow permission from one mode/scope/phase tuple. */
export declare function resolveEffectivePolicy(input: EffectivePolicyInput): EffectivePolicy;
//# sourceMappingURL=effective-policy.d.ts.map