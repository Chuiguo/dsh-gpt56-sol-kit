import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isSolModel, isSolRoute, matchesAnyModel, matchesPattern, matchesProvider } from '../src/model-match.ts'

const cfg = { enabled: true, providerPattern: '', modelPatterns: ['gpt-5.6-sol', 'gpt-5.6'] }

test('1: target model matches', () => {
  assert.equal(isSolModel('gpt-5.6-sol', cfg.modelPatterns), true)
  assert.equal(isSolRoute('relay-openai', 'gpt-5.6-sol', cfg), true)
})

test('2: non-target model does not match', () => {
  assert.equal(isSolModel('deepseek-v4-pro', cfg.modelPatterns), false)
  assert.equal(isSolRoute('relay-openai', 'claude-sonnet-4-5', cfg), false)
  assert.equal(isSolRoute('relay-openai', 'gpt-4.1', cfg), false)
})

test('2b: disabled config never matches', () => {
  assert.equal(isSolRoute('relay-openai', 'gpt-5.6-sol', { ...cfg, enabled: false }), false)
})

test('3: model alias patterns match', () => {
  assert.equal(matchesPattern('gpt-5.6-sol-2026', 'gpt-5.6-sol*'), true)
  // a user-added relay alias: pattern 'sol' matches any id containing 'sol'
  assert.equal(matchesAnyModel('acme-sol-relay', ['sol', 'gpt-5.6']), true)
  // substring: gpt-5.6 also matches gpt-5.6-sol
  assert.equal(matchesAnyModel('gpt-5.6-sol', ['gpt-5.6']), true)
  // empty pattern list fails closed
  assert.equal(matchesAnyModel('gpt-5.6-sol', []), false)
})

test('provider pattern restricts the route', () => {
  assert.equal(matchesProvider('openai-relay', ''), true)
  assert.equal(matchesProvider('openai-relay', 'openai*'), true)
  assert.equal(matchesProvider('deepseek-official', 'openai*'), false)
  assert.equal(isSolRoute('deepseek-official', 'gpt-5.6-sol', { ...cfg, providerPattern: 'openai*' }), false)
})

test('matching is case-insensitive', () => {
  assert.equal(isSolModel('GPT-5.6-SOL', cfg.modelPatterns), true)
})
