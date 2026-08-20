import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assessVerification, collectVerificationEvidence, looksLikeCredentialLeak } from '../src/verify.ts'

const good = {
  goalCompleted: true,
  files: [{ path: 'src/a.ts', exists: true, authorized: true }],
  diffOnlyRelevant: true,
  authorizationKnown: true,
  commandResultsKnown: true,
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

test('event evidence pairs results by callId and ignores unmatched calls', () => {
  const evidence = collectVerificationEvidence({
    calls: [
      { callId: 'read-1', name: 'read', arguments: '{"file_path":"src/a.ts"}' },
      { callId: 'test-1', name: 'pwsh', arguments: 'pnpm test' },
      { callId: 'diff-1', name: 'pwsh', arguments: 'git diff --check' },
      { callId: 'orphan', name: 'pwsh', arguments: 'pnpm test' },
    ],
    results: [
      { callId: 'read-1' }, { callId: 'test-1' }, { callId: 'diff-1' },
    ],
    webTask: false,
  })
  assert.equal(evidence.testsRan, true)
  assert.equal(evidence.diffInspected, true)
  assert.equal(evidence.files.length, 1)
  assert.equal(evidence.goalCompleted, false)
})

test('event evidence reports missing diff as incomplete', () => {
  const evidence = collectVerificationEvidence({ calls: [{ callId: 't', name: 'pwsh', arguments: 'pnpm test' }], results: [{ callId: 't' }], webTask: false })
  assert.equal(assessVerification(evidence).status, 'INCOMPLETE')
})

test('event evidence propagates failed results and web acceptance requirement', () => {
  const evidence = collectVerificationEvidence({
    calls: [
      { callId: 't', name: 'pwsh', arguments: 'pnpm test' },
      { callId: 'b', name: 'pwsh', arguments: 'pnpm build' },
      { callId: 'd', name: 'pwsh', arguments: 'git diff' },
      { callId: 'w', name: 'browser', arguments: 'playwright acceptance' },
    ],
    results: [{ callId: 't', errorCode: 'test-failure' }, { callId: 'b' }, { callId: 'd' }, { callId: 'w' }],
    webTask: true,
  })
  const result = assessVerification(evidence)
  assert.equal(result.status, 'FAIL')
  assert.equal(result.canReportComplete, false)
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
  assert.equal(looksLikeCredentialLeak('Authorization: Bearer sk-abcdef12345678'), true)
  assert.equal(looksLikeCredentialLeak('api_key=sk-1234567890'), true)
  assert.equal(looksLikeCredentialLeak('x-api-key: 1234567890abcdef'), true)
  assert.equal(looksLikeCredentialLeak('set the API key in settings'), false)
})
