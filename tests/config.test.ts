import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_CONFIG, isSolMode, normalizeConfig } from '../src/config.ts'

test('19: settings dynamically update (partial merge over defaults)', () => {
  const cfg = normalizeConfig({ defaultMode: 'coding', warnAtPercent: 70, enabled: false })
  assert.equal(cfg.defaultMode, 'coding')
  assert.equal(cfg.warnAtPercent, 70)
  assert.equal(cfg.enabled, false)
  // untouched fields keep defaults
  assert.deepEqual(cfg.modelPatterns, DEFAULT_CONFIG.modelPatterns)
  assert.equal(cfg.compactAtPercent, 85)
})

test('defaults are sane', () => {
  assert.equal(DEFAULT_CONFIG.defaultMode, 'auto')
  assert.equal(DEFAULT_CONFIG.warnAtPercent, 75)
  assert.equal(DEFAULT_CONFIG.compactAtPercent, 85)
  assert.equal(DEFAULT_CONFIG.inputPricePerMillion, null)
})

test('invalid percent ordering fails loud', () => {
  assert.throws(() => normalizeConfig({ warnAtPercent: 90, compactAtPercent: 80 }), /warnAtPercent/)
})

test('invalid mode fails loud', () => {
  assert.throws(() => normalizeConfig({ defaultMode: 'turbo' }), /defaultMode/)
})

test('invalid price fails loud', () => {
  assert.throws(() => normalizeConfig({ inputPricePerMillion: -1 }), /inputPricePerMillion/)
})

test('isSolMode narrows', () => {
  assert.equal(isSolMode('max'), true)
  assert.equal(isSolMode('nope'), false)
  assert.equal(isSolMode(42), false)
})

test('1: default maxOutputTokens is 0 (compatibility-first)', () => {
  assert.equal(DEFAULT_CONFIG.maxOutputTokens, 0)
})

test('2: normalizeConfig accepts maxOutputTokens: 0', () => {
  assert.equal(normalizeConfig({ maxOutputTokens: 0 }).maxOutputTokens, 0)
})

test('3: negative, fractional, and non-number maxOutputTokens are rejected', () => {
  assert.throws(() => normalizeConfig({ maxOutputTokens: -1 }), /maxOutputTokens/)
  assert.throws(() => normalizeConfig({ maxOutputTokens: 1.5 }), /maxOutputTokens/)
  assert.throws(() => normalizeConfig({ maxOutputTokens: '8192' }), /maxOutputTokens/)
})

test('applyReasoningOverrides defaults to false (compatibility-first)', () => {
  assert.equal(DEFAULT_CONFIG.applyReasoningOverrides, false)
  assert.equal(normalizeConfig({}).applyReasoningOverrides, false)
  assert.equal(normalizeConfig({ applyReasoningOverrides: true }).applyReasoningOverrides, true)
  assert.throws(() => normalizeConfig({ applyReasoningOverrides: 'yes' }), /applyReasoningOverrides/)
})
