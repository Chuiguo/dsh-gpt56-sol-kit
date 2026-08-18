import { test } from 'node:test'
import assert from 'node:assert/strict'
import { budgetDecision, computeCost, formatCost, pricesKnown } from '../src/cost.ts'

const known = { currency: 'USD', inputPricePerMillion: 2, cachedInputPricePerMillion: 0.5, outputPricePerMillion: 8 }
const unknown = { currency: 'USD', inputPricePerMillion: null, cachedInputPricePerMillion: null, outputPricePerMillion: null }

test('13: unknown prices show no amount', () => {
  assert.equal(pricesKnown(unknown), false)
  assert.equal(computeCost({ inputTokens: 1000, cachedInputTokens: 500, outputTokens: 200 }, unknown), null)
})

test('14: cost computation', () => {
  const cost = computeCost({ inputTokens: 1_000_000, cachedInputTokens: 2_000_000, outputTokens: 1_000_000 }, known)
  // 1M*2 + 2M*0.5 + 1M*8 = 2 + 1 + 8 = 11
  assert.equal(cost, 11)
})

test('14b: cached price falls back to input price', () => {
  const prices = { currency: 'USD', inputPricePerMillion: 2, cachedInputPricePerMillion: null, outputPricePerMillion: 8 }
  const cost = computeCost({ inputTokens: 1_000_000, cachedInputTokens: 1_000_000, outputTokens: 0 }, prices)
  assert.equal(cost, 4)
})

test('15: per-request budget', () => {
  const d = budgetDecision(12, 12, 10, null)
  assert.equal(d.withinRequest, false)
  assert.equal(d.exceeded, true)
})

test('16: per-session budget', () => {
  const d = budgetDecision(5, 120, null, 100)
  assert.equal(d.withinRequest, true)
  assert.equal(d.withinSession, false)
  assert.equal(d.exceeded, true)
})

test('16b: null budgets are unlimited', () => {
  const d = budgetDecision(9999, 99999, null, null)
  assert.equal(d.exceeded, false)
})

test('formatCost renders currency', () => {
  assert.equal(formatCost(11, 'USD'), 'USD 11.0000')
})
