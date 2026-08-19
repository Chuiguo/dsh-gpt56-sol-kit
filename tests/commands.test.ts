import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseSolCommand, renderBudget, renderStatus } from '../src/commands.ts'

test('parse: bare /sol is status', () => {
  assert.deepEqual(parseSolCommand(''), { action: 'status' })
  assert.deepEqual(parseSolCommand('  '), { action: 'status' })
})

test('parse: /sol mode with and without confirm', () => {
  assert.deepEqual(parseSolCommand('mode coding'), { action: 'mode', name: 'coding', confirm: false })
  assert.deepEqual(parseSolCommand('mode max --confirm'), { action: 'mode', name: 'max', confirm: true })
})

test('parse: budget/verify/review/reset', () => {
  assert.deepEqual(parseSolCommand('budget'), { action: 'budget' })
  assert.deepEqual(parseSolCommand('workflow'), { action: 'workflow', reset: false })
  assert.deepEqual(parseSolCommand('workflow reset'), { action: 'workflow', reset: true })
  assert.deepEqual(parseSolCommand('verify'), { action: 'verify' })
  assert.deepEqual(parseSolCommand('review'), { action: 'review' })
  assert.deepEqual(parseSolCommand('reset'), { action: 'reset' })
})

test('parse: unknown verb', () => {
  assert.deepEqual(parseSolCommand('frobnicate'), { action: 'unknown', text: 'frobnicate' })
})

test('status hides keys and reports the route', () => {
  const text = renderStatus({
    enabled: true, isSol: true, provider: 'openai-relay', model: 'gpt-5.6-sol', mode: 'coding',
    modeExplicitlySelected: true, reasoningOverridesEnabled: false, reasoning: 'high',
    contextSoftLimit: null, contextHardLimit: null,
    surfaceTokens: 12000, sessionCost: null, deniedTools: [], deniedCategories: [], pricesKnown: false, scope: 'modify', phase: 'verify', readOnly: false, allowsImplementation: true, canReportComplete: false,
  })
  assert.match(text, /Model: gpt-5.6-sol/)
  assert.match(text, /Mode: coding/)
  assert.match(text, /explicitly selected/)
  assert.match(text, /Reasoning overrides: disabled/)
  assert.match(text, /Can report complete/)
  assert.match(text, /Denied tool categories/)
  assert.doesNotMatch(text, /api[_-]?key|authorization|bearer/i)
})

test('status for a non-Sol model says inactive', () => {
  const text = renderStatus({
    enabled: true, isSol: false, provider: 'relay', model: 'deepseek-v4-pro', mode: 'balanced',
    modeExplicitlySelected: false, reasoningOverridesEnabled: false, reasoning: '',
    contextSoftLimit: null, contextHardLimit: null,
    surfaceTokens: 0, sessionCost: null, deniedTools: [], deniedCategories: [], pricesKnown: false,
  })
  assert.match(text, /inactive/)
})

test('balanced status shows the coding-mode hint and denied categories', () => {
  const text = renderStatus({
    enabled: true, isSol: true, provider: 'gpt', model: 'gpt-5.6-sol', mode: 'balanced',
    modeExplicitlySelected: false, reasoningOverridesEnabled: false, reasoning: '',
    contextSoftLimit: null, contextHardLimit: null,
    surfaceTokens: 0, sessionCost: null, deniedTools: ['bash'], deniedCategories: ['shell', 'subagent/workflow'],
    pricesKnown: false,
  })
  assert.match(text, /default/)
  assert.match(text, /shell, subagent\/workflow/)
  assert.match(text, /\/sol mode coding/)
})

test('budget hides currency amounts when prices are unknown', () => {
  const text = renderBudget({
    isSol: true, pricesKnown: false, requestCost: null, sessionCost: null,
    requestBudget: null, sessionBudget: null, inputTokens: 100, cachedInputTokens: 0, outputTokens: 50,
    withinRequest: true, withinSession: true,
  })
  assert.match(text, /Input tokens: 100/)
  assert.match(text, /unknown/)
  assert.doesNotMatch(text, /USD|€|¥/)
})
