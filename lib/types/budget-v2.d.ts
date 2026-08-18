/** Conservative V2 budget defaults. */
export declare const DEFAULT_WORKFLOW_BUDGET: Readonly<{
    maxWorkflowSteps: 40;
    maxFixRounds: 2;
    maxConsecutiveToolErrors: 4;
    maxIdenticalErrorRetries: 1;
    maxWallTimeMinutes: 20;
    maxInputTokens: number | null;
    maxOutputTokensTotal: number | null;
    maxSessionCost: number | null;
    hardBudgetEnforcement: false;
}>;
export interface WorkflowBudget {
    maxWorkflowSteps: number;
    maxFixRounds: number;
    maxConsecutiveToolErrors: number;
    maxIdenticalErrorRetries: number;
    maxWallTimeMinutes: number;
    maxInputTokens: number | null;
    maxOutputTokensTotal: number | null;
    maxSessionCost: number | null;
    hardBudgetEnforcement: boolean;
}
export interface BudgetUsage {
    steps: number;
    fixRounds: number;
    consecutiveToolErrors: number;
    inputTokens: number;
    outputTokens: number;
    sessionCost: number | null;
    elapsedMinutes: number;
}
export interface BudgetDecision {
    allowed: boolean;
    hardStop: boolean;
    warnings: string[];
    reason: string | null;
}
/** Decide whether the workflow may continue; false only hard-stops when enabled. */
export declare function evaluateBudget(budget: WorkflowBudget, usage: BudgetUsage): BudgetDecision;
//# sourceMappingURL=budget-v2.d.ts.map