import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  initialModeState,
  resetModeState,
  resolveRequestOverrides,
  selectModeState,
} from '../src/modes.ts'

const SUPPORTED = ['low', 'medium', 'high', 'xhigh', 'max']

function overrides(partial: Partial<Parameters<typeof resolveRequestOverrides>[0]> = {}) {
  return resolveRequestOverrides({
    base: {},
    mode: 'balanced',
    modeExplicitlySelected: false,
    applyReasoningOverrides: false,
    supportedEfforts: SUPPORTED,
    configuredMaxOutputTokens: 0,
    ...partial,
  })
}

test('default state does not add maxTokens', () => {
  assert.equal(overrides({ base: {}, configuredMaxOutputTokens: 0 }).maxTokens, undefined)
})

test('default state does not add reasoningEffort', () => {
  assert.equal(overrides({ base: {}, modeExplicitlySelected: false }).reasoningEffort, undefined)
})

test('an existing maxTokens is never overridden', () => {
  const r = overrides({ base: { maxTokens: 5000 }, configuredMaxOutputTokens: 8192 })
  assert.equal(r.maxTokens, 5000)
})

test('an existing reasoningEffort is never overridden', () => {
  const r = overrides({ base: { reasoningEffort: 'low' }, mode: 'coding', modeExplicitlySelected: true })
  assert.equal(r.reasoningEffort, 'low')
})

test('a positive configured cap is applied only when the base has none', () => {
  const r = overrides({ base: {}, configuredMaxOutputTokens: 8192 })
  assert.equal(r.maxTokens, 8192)
})

// ---- reasoning-override regression tests (applyReasoningOverrides) ----

test('1: provider-default coding mode produces no reasoningEffort (override disabled by default)', () => {
  const r = overrides({ base: {}, mode: 'coding', modeExplicitlySelected: true, applyReasoningOverrides: false })
  assert.equal(r.reasoningEffort, undefined)
})

test('2: tool-continuation rounds also produce no reasoningEffort (override disabled)', () => {
  const first = overrides({ base: {}, mode: 'coding', modeExplicitlySelected: true, applyReasoningOverrides: false })
  const second = overrides({
    base: { reasoningEffort: first.reasoningEffort, maxTokens: first.maxTokens },
    mode: 'coding',
    modeExplicitlySelected: true,
    applyReasoningOverrides: false,
  })
  assert.equal(first.reasoningEffort, undefined)
  assert.deepEqual(second, first)
})

test('3: a user-supplied reasoningEffort is preserved verbatim', () => {
  const r = overrides({ base: { reasoningEffort: 'low' }, mode: 'coding', modeExplicitlySelected: true, applyReasoningOverrides: true })
  assert.equal(r.reasoningEffort, 'low')
})

test('4: explicit override + supported route injects the mode effort', () => {
  const r = overrides({ base: {}, mode: 'coding', modeExplicitlySelected: true, applyReasoningOverrides: true, supportedEfforts: SUPPORTED })
  assert.equal(r.reasoningEffort, 'high')
})

test('5: explicit override + unsupported route injects nothing', () => {
  const r = overrides({ base: {}, mode: 'coding', modeExplicitlySelected: true, applyReasoningOverrides: true, supportedEfforts: [] })
  assert.equal(r.reasoningEffort, undefined)
})

test('5b: unsupported target falls back to the closest lower effort (only when enabled)', () => {
  const r = overrides({ base: {}, mode: 'deep-analysis', modeExplicitlySelected: true, applyReasoningOverrides: true, supportedEfforts: ['medium', 'high', 'max'] })
  assert.equal(r.reasoningEffort, 'high')
})

// ---- mode-state helpers ----

test('11: /sol reset clears mode + explicit flag + applied effort', () => {
  const state = initialModeState('balanced')
  selectModeState(state, 'coding')
  assert.equal(state.modeExplicitlySelected, true)
  assert.equal(state.mode, 'coding')
  resetModeState(state, 'balanced')
  assert.deepEqual(state, { mode: 'balanced', modeExplicitlySelected: false, appliedEffort: undefined })
})

test('11b: initial state is not explicitly selected', () => {
  assert.deepEqual(initialModeState('balanced'), {
    mode: 'balanced',
    modeExplicitlySelected: false,
    appliedEffort: undefined,
  })
})
