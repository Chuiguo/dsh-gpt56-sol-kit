import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveEffectivePolicy } from '../src/effective-policy.ts'

test('manual coding mode exposes modify policy immediately', () => {
  const policy = resolveEffectivePolicy({ mode: 'coding', scope: 'modify', phase: 'implement' })
  assert.equal(policy.readOnly, false)
  assert.equal(policy.allowsImplementation, true)
  assert.equal(policy.deniedTools.length, 0)
})

test('answer scope remains read-only even when mode is coding', () => {
  const policy = resolveEffectivePolicy({ mode: 'coding', scope: 'answer', phase: 'verify' })
  assert.equal(policy.readOnly, true)
  assert.equal(policy.allowsImplementation, false)
  assert.ok(policy.deniedTools.includes('write'))
})

test('complete and blocked phases cannot request implementation', () => {
  assert.equal(resolveEffectivePolicy({ mode: 'coding', scope: 'modify', phase: 'complete' }).allowsImplementation, false)
  assert.equal(resolveEffectivePolicy({ mode: 'coding', scope: 'modify', phase: 'blocked' }).allowsImplementation, false)
})
