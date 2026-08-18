/** Conservative V2 budget defaults. */
export const DEFAULT_WORKFLOW_BUDGET = Object.freeze({
  maxWorkflowSteps: 40,
  maxFixRounds: 2,
  maxConsecutiveToolErrors: 4,
  maxIdenticalErrorRetries: 1,
  maxWallTimeMinutes: 20,
  maxInputTokens: null as number | null,
  maxOutputTokensTotal: null as number | null,
  maxSessionCost: null as number | null,
  hardBudgetEnforcement: false,
})

export interface WorkflowBudget {
  maxWorkflowSteps: number
  maxFixRounds: number
  maxConsecutiveToolErrors: number
  maxIdenticalErrorRetries: number
  maxWallTimeMinutes: number
  maxInputTokens: number | null
  maxOutputTokensTotal: number | null
  maxSessionCost: number | null
  hardBudgetEnforcement: boolean
}

export interface BudgetUsage {
  steps: number
  fixRounds: number
  consecutiveToolErrors: number
  inputTokens: number
  outputTokens: number
  sessionCost: number | null
  elapsedMinutes: number
}

export interface BudgetDecision {
  allowed: boolean
  hardStop: boolean
  warnings: string[]
  reason: string | null
}

/** Decide whether the workflow may continue; false only hard-stops when enabled. */
export function evaluateBudget(budget: WorkflowBudget, usage: BudgetUsage): BudgetDecision {
  const limits: Array<[string, boolean]> = [
    ['workflow steps', usage.steps >= budget.maxWorkflowSteps],
    ['fix rounds', usage.fixRounds >= budget.maxFixRounds],
    ['consecutive tool errors', usage.consecutiveToolErrors >= budget.maxConsecutiveToolErrors],
    ['wall time', usage.elapsedMinutes >= budget.maxWallTimeMinutes],
    ['input tokens', budget.maxInputTokens !== null && usage.inputTokens >= budget.maxInputTokens],
    ['output tokens', budget.maxOutputTokensTotal !== null && usage.outputTokens >= budget.maxOutputTokensTotal],
    ['session cost', budget.maxSessionCost !== null && usage.sessionCost !== null && usage.sessionCost >= budget.maxSessionCost],
  ]
  const exceeded = limits.filter(([, hit]) => hit).map(([name]) => name)
  if (exceeded.length === 0) return { allowed: true, hardStop: false, warnings: [], reason: null }
  const reason = `Budget limit reached: ${exceeded.join(', ')}.`
  return {
    allowed: !budget.hardBudgetEnforcement,
    hardStop: budget.hardBudgetEnforcement,
    warnings: budget.hardBudgetEnforcement ? [] : [reason],
    reason,
  }
}
