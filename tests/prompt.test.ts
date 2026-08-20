import { test } from 'node:test'
import assert from 'node:assert/strict'
import { solPromptSection } from '../src/prompt.ts'

test('prompt is short and mode-specific', () => {
  const coding = solPromptSection('coding')
  const review = solPromptSection('review')
  assert.ok(coding.length < 1200)
  assert.match(coding, /Run tests as you implement/)
  assert.match(review, /Read-only/)
  assert.doesNotMatch(review, /Run tests as you implement/)
})

test('prompt carries the three-scope boundary and confirmation rule', () => {
  const text = solPromptSection('balanced')
  assert.match(text, /answer|diagnose|modify/)
  assert.match(text, /Confirm before external writes/)
  assert.match(solPromptSection('deep-analysis'), /file writes and command execution remain disabled/)
})
