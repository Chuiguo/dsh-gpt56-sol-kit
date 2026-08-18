import { test } from 'node:test'
import assert from 'node:assert/strict'
import { contextDecision, keepForCompaction, summarizeForCompaction } from '../src/context-policy.ts'
import type { CompactionItem } from '../src/context-policy.ts'

test('11: context warning at the warn threshold', () => {
  // window 100000, warnAt 75% -> warn ceiling ~75000
  const d = contextDecision({ surfaceTokens: 76000, contextWindow: 100000, softLimit: null, hardLimit: null, warnAtPercent: 75, compactAtPercent: 85 })
  assert.equal(d.action, 'warn')
  assert.ok(d.warnLimit !== null && d.warnLimit >= 75000)
})

test('11b: compact ceiling and explicit hard limit', () => {
  const compact = contextDecision({ surfaceTokens: 86000, contextWindow: 100000, softLimit: null, hardLimit: null, warnAtPercent: 75, compactAtPercent: 85 })
  assert.equal(compact.action, 'compact')
  // explicit hardLimit overrides the derived compact ceiling
  const hard = contextDecision({ surfaceTokens: 95000, contextWindow: 100000, softLimit: null, hardLimit: 90000, warnAtPercent: 75, compactAtPercent: 85 })
  assert.equal(hard.action, 'compact')
  assert.equal(hard.compactLimit, 90000)
})

test('11c: unknown window never fabricates a ceiling', () => {
  const d = contextDecision({ surfaceTokens: 200000, contextWindow: null, softLimit: null, hardLimit: null, warnAtPercent: 75, compactAtPercent: 85 })
  assert.equal(d.action, 'ok')
  assert.equal(d.warnLimit, null)
  assert.equal(d.compactLimit, null)
})

test('12: compaction summary keeps goal and constraints, drops reasoning', () => {
  const items: CompactionItem[] = [
    { kind: 'goal', text: 'Ship the login flow' },
    { kind: 'constraint', text: 'No external writes without confirmation' },
    { kind: 'reasoning', text: 'I first considered using a monorepo but then ...' },
    { kind: 'decision', text: 'Use sqlite for local sessions' },
    { kind: 'file', text: 'src/auth.ts' },
    { kind: 'todo', text: 'Write the token refresh test' },
  ]
  const kept = keepForCompaction(items)
  assert.equal(kept.length, 5)
  assert.ok(kept.every(i => i.kind !== 'reasoning'))
  const summary = summarizeForCompaction(items)
  assert.match(summary, /Ship the login flow/)
  assert.match(summary, /No external writes/)
  assert.doesNotMatch(summary, /monorepo but then/)
})

test('12b: empty summary when nothing to keep', () => {
  assert.equal(summarizeForCompaction([{ kind: 'reasoning', text: 'verbose' }]), '')
})
