import type { TaskProfile, TaskScope } from './task-profile.ts';
/** V2 workflow phases. */
export type WorkflowPhase = 'idle' | 'inspect' | 'implement' | 'verify' | 'review' | 'fix' | 'complete' | 'blocked';
/** Evidence that permits a phase transition. */
export interface WorkflowEvidence {
    kind: 'inspection' | 'implementation' | 'verification' | 'review' | 'failure' | 'blocked';
    detail: string;
    passed?: boolean;
}
/** Serializable workflow state retained for status and verification. */
export interface WorkflowState {
    profile: TaskProfile;
    phase: WorkflowPhase;
    steps: number;
    fixRounds: number;
    evidence: WorkflowEvidence[];
    lastError: string | null;
}
/** Create the initial state; auto profiles always begin at inspect. */
export declare function createWorkflow(profile: TaskProfile): WorkflowState;
/** Return whether a transition is structurally allowed and evidence-backed. */
export declare function canTransition(state: WorkflowState, next: WorkflowPhase, evidence?: WorkflowEvidence): boolean;
/** Apply one validated transition and append its reason to the evidence log. */
export declare function transition(state: WorkflowState, next: WorkflowPhase, evidence: WorkflowEvidence): WorkflowState;
/** Convert a failure into the next legal action without hiding it. */
export declare function failureTransition(state: WorkflowState, detail: string): {
    next: 'fix' | 'blocked';
    evidence: WorkflowEvidence;
};
/** Return whether a profile is allowed to request implementation. */
export declare function isImplementationProfile(scope: TaskScope): boolean;
//# sourceMappingURL=workflow.d.ts.map