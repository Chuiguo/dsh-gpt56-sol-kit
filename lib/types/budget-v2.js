/** Conservative V2 budget defaults. */
export const DEFAULT_WORKFLOW_BUDGET = Object.freeze({
    maxWorkflowSteps: 40,
    maxFixRounds: 2,
    maxConsecutiveToolErrors: 4,
    maxConsecutiveRequestErrors: 4,
    maxIdenticalErrorRetries: 1,
    maxWallTimeMinutes: 20,
    maxInputTokens: null,
    maxOutputTokensTotal: null,
    maxSessionCost: null,
    hardBudgetEnforcement: false,
});
/** Decide whether the workflow may continue; false only hard-stops when enabled. */
export function evaluateBudget(budget, usage) {
    const limits = [
        ['workflow steps', usage.steps >= budget.maxWorkflowSteps],
        ['fix rounds', usage.fixRounds >= budget.maxFixRounds],
        ['consecutive tool errors', usage.consecutiveToolErrors >= budget.maxConsecutiveToolErrors],
        ['wall time', usage.elapsedMinutes >= budget.maxWallTimeMinutes],
        ['input tokens', budget.maxInputTokens !== null && usage.inputTokens >= budget.maxInputTokens],
        ['output tokens', budget.maxOutputTokensTotal !== null && usage.outputTokens >= budget.maxOutputTokensTotal],
        ['session cost', budget.maxSessionCost !== null && usage.sessionCost !== null && usage.sessionCost >= budget.maxSessionCost],
    ];
    const exceeded = limits.filter(([, hit]) => hit).map(([name]) => name);
    if (exceeded.length === 0)
        return { allowed: true, hardStop: false, warnings: [], reason: null };
    const reason = `Budget limit reached: ${exceeded.join(', ')}.`;
    return {
        allowed: !budget.hardBudgetEnforcement,
        hardStop: budget.hardBudgetEnforcement,
        warnings: budget.hardBudgetEnforcement ? [] : [reason],
        reason,
    };
}
//# sourceMappingURL=budget-v2.js.map