import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assessVerification, looksLikeCredentialLeak } from '../src/verify.ts'

const good = {
  goalCompleted: true,
  files: [{ path: 'src/a.ts', exists: true, authorized: true }],
  diffOnlyRelevant: true,
  diffInspected: true,
  testsRan: true,
  testsPassed: true,
  buildRan: true,
  buildPassed: true,
  webTask: false,
  browserAcceptance: false,
  claimsExaggerated: false,
  unexplainedFailures: [],
  credentialsLeaked: false,
}

test('17: verification detects a false "done"', () => {
  const r = assessVerification({ ...good, goalCompleted: true, testsPassed: false })
  assert.equal(r.passed, false)
  assert.ok(r.checks.find(c => c.id === 'tests')?.pass === false)
})

test('18: failed tests never report completion', () => {
  const r = assessVerification({ ...good, testsRan: true, testsPassed: false })
  assert.equal(r.passed, false)
  assert.match(r.summary, /FAIL|Failed/)
})

test('18b: tests that did not run also fail', () => {
  const r = assessVerification({ ...good, testsRan: false })
  assert.equal(r.passed, false)
})

test('18c: web task without browser acceptance fails', () => {
  const r = assessVerification({ ...good, webTask: true, browserAcceptance: false })
  assert.equal(r.passed, false)
  assert.ok(r.checks.find(c => c.id === 'browser')?.pass === false)
})

test('all checks pass only when nothing is missing', () => {
  const r = assessVerification(good)
  assert.equal(r.passed, true)
  assert.match(r.summary, /All checks passed/)
})

test('undisclosed failures and overstated claims fail', () => {
  const r = assessVerification({ ...good, claimsExaggerated: true, unexplainedFailures: ['lint'] })
  assert.equal(r.passed, false)
})

test('unauthorized file path fails', () => {
  const r = assessVerification({ ...good, files: [{ path: '/etc/passwd', exists: true, authorized: false }] })
  assert.equal(r.passed, false)
  assert.ok(r.checks.find(c => c.id === 'files')?.pass === false)
})

test('21: credential leakage is detected', () => {
  assert.equal(looksLikeCredentialLeak('Authorization: Bearer test-token-abcdef12345678'), true)
  assert.equal(looksLikeCredentialLeak('api_key=test-secret-1234567890'), true)
  assert.equal(looksLikeCredentialLeak('x-api-key: 1234567890abcdef'), true)
  assert.equal(looksLikeCredentialLeak('set the API key in settings'), false)
})
