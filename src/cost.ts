/**
 * Cost estimation over provider-reported usage. Relay prices are independent of
 * OpenAI's official pricing and default to "unknown": when the user has not
 * filled in prices, only token counts are shown and no currency amount is ever
 * produced or implied.
 */

export interface PriceConfig {
  currency: string
  inputPricePerMillion: number | null
  cachedInputPricePerMillion: number | null
  outputPricePerMillion: number | null
}

/** Disjoint usage buckets as reported by the provider (cached = cache read + write). */
export interface Usage {
  inputTokens: number
  cachedInputTokens: number
  outputTokens: number
}

/**
 * Whether a complete price set is known. Cached-input falls back to the input
 * price when null, so only input and output prices are required.
 *
 * @param prices The price configuration.
 * @returns Whether a cost amount can be computed.
 */
export function pricesKnown(prices: PriceConfig): boolean {
  return prices.inputPricePerMillion !== null && prices.outputPricePerMillion !== null
}

/**
 * Compute a cost amount from usage and prices, or null when prices are unknown.
 * Never falls back to any official price.
 *
 * @param usage The provider-reported usage.
 * @param prices The price configuration.
 * @returns The cost in the configured currency, or null when unknown.
 */
export function computeCost(usage: Usage, prices: PriceConfig): number | null {
  if (!pricesKnown(prices)) return null
  const inputPrice = prices.inputPricePerMillion as number
  const cachedPrice = prices.cachedInputPricePerMillion ?? inputPrice
  const outputPrice = prices.outputPricePerMillion as number
  return (
    usage.inputTokens * inputPrice
    + usage.cachedInputTokens * cachedPrice
    + usage.outputTokens * outputPrice
  ) / 1_000_000
}

/** Format a cost amount with the currency label, to a fixed precision. */
export function formatCost(amount: number, currency: string): string {
  return `${currency} ${amount.toFixed(4)}`
}

export interface BudgetDecision {
  /** Whether the cost is within the per-request budget (null budget = no limit). */
  withinRequest: boolean
  /** Whether the cost is within the per-session budget (null budget = no limit). */
  withinSession: boolean
  /** Whether either budget is exceeded. */
  exceeded: boolean
  requestBudget: number | null
  sessionBudget: number | null
}

/**
 * Compare a cost against the per-request and per-session budgets. A null budget
 * is unlimited. A zero or negative accumulated value is treated as zero.
 *
 * @param requestCost The cost accumulated for the current request.
 * @param sessionCost The cost accumulated for the whole session.
 * @param requestBudget The per-request budget, or null.
 * @param sessionBudget The per-session budget, or null.
 * @returns The budget decision.
 */
export function budgetDecision(
  requestCost: number,
  sessionCost: number,
  requestBudget: number | null,
  sessionBudget: number | null,
): BudgetDecision {
  const withinRequest = requestBudget === null || requestCost <= requestBudget
  const withinSession = sessionBudget === null || sessionCost <= sessionBudget
  return {
    withinRequest,
    withinSession,
    exceeded: !withinRequest || !withinSession,
    requestBudget,
    sessionBudget,
  }
}
