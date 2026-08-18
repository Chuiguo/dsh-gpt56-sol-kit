import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyTask, allowsImplementation } from '../src/task-profile.ts'
import { createWorkflow, transition, failureTransition } from '../src/workflow.ts'
import { classifyFailure, retryDecision, editRequiresRead } from '../src/preflight.ts'
import { resolveCapabilities } from '../src/capabilities.ts'
import { DEFAULT_WORKFLOW_BUDGET, evaluateBudget } from '../src/budget-v2.ts'
import { assessVerification } from '../src/verify.ts'
import { parseSolCommand, renderCapabilities, renderWorkflow } from '../src/commands.ts'

const good = {
  goalCompleted: true, files: [{ path: 'src/a.ts', exists: true, authorized: true }], diffOnlyRelevant: true,
  diffInspected: true, testsRan: true, testsPassed: true, buildRan: true, buildPassed: true,
  webTask: false, browserAcceptance: false, claimsExaggerated: false, unexplainedFailures: [], credentialsLeaked: false,
}

test('auto classifies answer, diagnose, modify, review, frontend, and deep-analysis', () => {
  assert.equal(classifyTask('Explain this error').scope, 'answer')
  assert.equal(classifyTask('Diagnose why tests fail without changing files').scope, 'diagnose')
  assert.equal(classifyTask('Implement a TypeScript CLI').scope, 'modify')
  assert.equal(classifyTask('Review this diff').scope, 'review')
  assert.equal(classifyTask('Build a responsive frontend page').scope, 'frontend')
  assert.equal(classifyTask('Research the architecture').scope, 'deep-analysis')
})

test('explicit mode overrides auto and locks the profile', () => {
  const profile = classifyTask('Explain this coding task', 'coding')
  assert.equal(profile.mode, 'coding')
  assert.equal(profile.explicit, true)
  assert.equal(classifyTask('Explain this', 'balanced').mode, 'balanced')
  assert.equal(allowsImplementation(profile.scope), true)
})

test('workflow allows inspect to implement then verify and caps fixes at two', () => {
  let state = createWorkflow(classifyTask('Implement a CLI'))
  state = transition(state, 'implement', { kind: 'inspection', detail: 'authorized' })
  state = transition(state, 'verify', { kind: 'implementation', detail: 'files changed' })
  state = transition(state, 'fix', { kind: 'failure', detail: 'test failure', passed: false })
  state = transition(state, 'verify', { kind: 'implementation', detail: 'fixed' })
  state = transition(state, 'fix', { kind: 'failure', detail: 'second failure', passed: false })
  assert.equal(state.fixRounds, 2)
  assert.throws(() => transition(state, 'verify', { kind: 'implementation', detail: 'third attempt' }))
  assert.equal(failureTransition(state, 'third failure').next, 'blocked')
})

test('answer and review profiles cannot enter implement', () => {
  assert.throws(() => transition(createWorkflow(classifyTask('Explain this')), 'implement', { kind: 'inspection', detail: 'no' }))
  assert.throws(() => transition(createWorkflow(classifyTask('Review code')), 'implement', { kind: 'inspection', detail: 'no' }))
})

test('cwd ENOENT differs from executable ENOENT', () => {
  assert.equal(classifyFailure({ message: 'spawn node ENOENT' }, { executableExists: false, cwdExists: true }), 'executable-enoent')
  assert.equal(classifyFailure({ message: 'spawn node ENOENT' }, { executableExists: true, cwdExists: false }), 'cwd-enoent')
})

test('read-before-edit and retry policy are bounded', () => {
  assert.equal(editRequiresRead('src/a.ts', []), false)
  assert.equal(editRequiresRead('src/a.ts', ['src/a.ts']), true)
  assert.equal(retryDecision('test-failure', 0, 0), 'retry')
  assert.equal(retryDecision('test-failure', 1, 0), 'stop')
  assert.equal(retryDecision('quota', 0, 0), 'stop')
})

test('hard budget stops while disabled budget only warns', () => {
  const usage = { steps: 40, fixRounds: 0, consecutiveToolErrors: 0, inputTokens: 0, outputTokens: 0, sessionCost: null, elapsedMinutes: 0 }
  assert.equal(evaluateBudget({ ...DEFAULT_WORKFLOW_BUDGET, hardBudgetEnforcement: false }, usage).allowed, true)
  assert.equal(evaluateBudget({ ...DEFAULT_WORKFLOW_BUDGET, hardBudgetEnforcement: true }, usage).hardStop, true)
})

test('route capabilities never infer risky features from model name', () => {
  const caps = resolveCapabilities(undefined)
  assert.equal(caps.source, 'conservative-default')
  assert.equal(caps.imageInput, null)
  assert.equal(caps.reasoningModePro, false)
  assert.equal(caps.maxOutputTokens, 0)
})

test('verification requires real tests, build, and browser evidence', () => {
  assert.equal(assessVerification({ ...good, testsRan: false }).status, 'INCOMPLETE')
  assert.equal(assessVerification({ ...good, testsPassed: false }).status, 'FAIL')
  assert.equal(assessVerification({ ...good, webTask: true, browserAcceptance: false }).canReportComplete, false)
  assert.equal(assessVerification(good).status, 'PASS')
})

test('commands expose workflow and capabilities without secrets', () => {
  assert.deepEqual(parseSolCommand('phase'), { action: 'phase' })
  assert.match(renderWorkflow({ phase: 'verify', scope: 'modify', steps: 3, fixRounds: 1, lastError: null }), /Phase: verify/)
  assert.match(renderCapabilities({ source: 'route', protocol: null, imageInput: null, reasoningEfforts: [], contextWindow: null, maxOutputTokens: 0 }), /unknown/)
})

const scenarios = [
  ['ordinary answer', 'Explain this function'],
  ['diagnose only', 'Diagnose the failure and report it without changes'],
  ['TypeScript CLI', 'Implement a TypeScript CLI'],
  ['frontend page', 'Build a responsive web UI'],
  ['read-only review', 'Review this code for bugs'],
  ['missing target directory', 'Create the new target directory and project'],
  ['edit without read', 'Edit the file'],
  ['failed tests', 'Fix the failing tests'],
  ['failed build', 'Fix the build'],
  ['repeated tool error', 'Retry the command'],
  ['quota', 'Continue after insufficient balance'],
  ['non-Sol model', 'Explain this on another model'],
] as const
for (const [name, request] of scenarios) test(`simulation: ${name}`, () => assert.equal(typeof classifyTask(request).scope, 'string'))
