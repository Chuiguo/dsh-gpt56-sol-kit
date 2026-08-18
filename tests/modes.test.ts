import { test } from 'node:test'
import assert from 'node:assert/strict'
import { availableReasoningEffort, isReadOnlyMode, MODES, reasoningTargetFor, requiresConfirmation } from '../src/modes.ts'

test('4: mode reasoning targets', () => {
  assert.equal(reasoningTargetFor('balanced'), 'medium')
  assert.equal(reasoningTargetFor('coding'), 'high')
  assert.equal(reasoningTargetFor('frontend'), 'high')
  assert.equal(reasoningTargetFor('review'), 'high')
  assert.equal(reasoningTargetFor('deep-analysis'), 'xhigh')
  assert.equal(reasoningTargetFor('max'), 'max')
})

test('5b: unsupported target falls back to the closest lower effort', () => {
  assert.equal(availableReasoningEffort('xhigh', ['medium', 'high', 'max']), 'high')
  assert.equal(availableReasoningEffort('max', ['medium', 'high']), 'high')
  assert.equal(availableReasoningEffort('high', ['low'], 'low'), 'low')
  assert.equal(availableReasoningEffort('high', []), undefined)
})

test('6: max requires confirmation', () => {
  assert.equal(requiresConfirmation('max'), true)
  assert.equal(requiresConfirmation('balanced'), false)
})

test('7: pro imposes no effort and is confirmed separately', () => {
  assert.equal(reasoningTargetFor('pro'), null)
  assert.equal(requiresConfirmation('pro'), true)
  // pro is never inferred from the model name: it has no reasoning target
  assert.equal(MODES.pro.reasoningTarget, null)
})

test('read-only mode classification', () => {
  assert.equal(isReadOnlyMode('review'), true)
  assert.equal(isReadOnlyMode('deep-analysis'), true)
  assert.equal(isReadOnlyMode('coding'), false)
})
