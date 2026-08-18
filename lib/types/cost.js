/**
 * Cost estimation over provider-reported usage. Relay prices are independent of
 * OpenAI's official pricing and default to "unknown": when the user has not
 * filled in prices, only token counts are shown and no currency amount is ever
 * produced or implied.
 */
/**
 * Whether a complete price set is known. Cached-input falls back to the input
 * price when null, so only input and output prices are required.
 *
 * @param prices The price configuration.
 * @returns Whether a cost amount can be computed.
 */
export function pricesKnown(prices) {
    return prices.inputPricePerMillion !== null && prices.outputPricePerMillion !== null;
}
/**
 * Compute a cost amount from usage and prices, or null when prices are unknown.
 * Never falls back to any official price.
 *
 * @param usage The provider-reported usage.
 * @param prices The price configuration.
 * @returns The cost in the configured currency, or null when unknown.
 */
export function computeCost(usage, prices) {
    if (!pricesKnown(prices))
        return null;
    const inputPrice = prices.inputPricePerMillion;
    const cachedPrice = prices.cachedInputPricePerMillion ?? inputPrice;
    const outputPrice = prices.outputPricePerMillion;
    return (usage.inputTokens * inputPrice
        + usage.cachedInputTokens * cachedPrice
        + usage.outputTokens * outputPrice) / 1_000_000;
}
/** Format a cost amount with the currency label, to a fixed precision. */
export function formatCost(amount, currency) {
    return `${currency} ${amount.toFixed(4)}`;
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
export function budgetDecision(requestCost, sessionCost, requestBudget, sessionBudget) {
    const withinRequest = requestBudget === null || requestCost <= requestBudget;
    const withinSession = sessionBudget === null || sessionCost <= sessionBudget;
    return {
        withinRequest,
        withinSession,
        exceeded: !withinRequest || !withinSession,
        requestBudget,
        sessionBudget,
    };
}
//# sourceMappingURL=cost.js.map