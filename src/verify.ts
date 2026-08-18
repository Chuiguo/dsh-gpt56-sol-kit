/**
 * Independent verification workflow (sol_verify). Pure assessment over an
 * evidence record gathered by read-only tools; the adapter (index.ts) wires the
 * evidence from the real filesystem/diff/test/build state. The assessor never
 * reports "done" unless every check passes.
 */

export interface VerificationEvidence {
  /** Whether the declared user goal is actually completed. */
  goalCompleted: boolean
  /** Target files with existence and authorization facts. */
  files: ReadonlyArray<{ path: string; exists: boolean; authorized: boolean }>
  /** Whether the diff contains only relevant changes (true when no diff exists). */
  diffOnlyRelevant: boolean
  /** Whether a diff was inspected at all. */
  diffInspected: boolean
  /** Whether tests actually ran. */
  testsRan: boolean
  /** Whether the tests that ran passed. */
  testsPassed: boolean
  /** Whether a build actually ran. */
  buildRan: boolean
  /** Whether the build that ran passed. */
  buildPassed: boolean
  /** Whether this was a web/frontend task. */
  webTask: boolean
  /** Whether browser acceptance was performed for a web task. */
  browserAcceptance: boolean
  /** Whether the final answer overstates completion. */
  claimsExaggerated: boolean
  /** Failures that were not disclosed in the final answer. */
  unexplainedFailures: readonly string[]
  /** Whether credentials appear to have leaked in the answer/diff. */
  credentialsLeaked: boolean
}

export interface VerifyCheck {
  id: string
  label: string
  pass: boolean
  detail: string
}

export type VerificationStatus = 'PASS' | 'FAIL' | 'INCOMPLETE' | 'BLOCKED'

export interface VerificationResult {
  passed: boolean
  status: VerificationStatus
  checks: VerifyCheck[]
  summary: string
  requirements: string[]
  failures: string[]
  unauthorizedChanges: string[]
  requiredNextAction: string
  canReportComplete: boolean
}

const CREDENTIAL_PATTERN = /((api[_-]?key|authorization|secret|token|password)\s*[:=]\s*\S{8,})|(bearer\s+[a-z0-9._-]{12,})/i

/**
 * Detect likely credential leakage in a free-text surface. Conservative: it
 * only flags explicit key-like assignments, not any occurrence of the word.
 *
 * @param text The text to scan.
 * @returns Whether a credential leak is likely.
 */
export function looksLikeCredentialLeak(text: string): boolean {
  return CREDENTIAL_PATTERN.test(text)
}

/**
 * Assess a verification evidence record against the ten Sol checks.
 *
 * @param evidence The gathered evidence.
 * @returns A structured verdict; `passed` is false unless every check passes.
 */
export function assessVerification(evidence: VerificationEvidence): VerificationResult {
  const checks: VerifyCheck[] = []

  checks.push({
    id: 'goal',
    label: 'User goal completed',
    pass: evidence.goalCompleted,
    detail: evidence.goalCompleted ? 'goal reported complete' : 'goal not completed',
  })

  const missingFiles = evidence.files.filter(f => !f.exists)
  const unauthorizedFiles = evidence.files.filter(f => !f.authorized)
  checks.push({
    id: 'files',
    label: 'Target files exist and are authorized',
    pass: missingFiles.length === 0 && unauthorizedFiles.length === 0,
    detail: missingFiles.length > 0
      ? `missing: ${missingFiles.map(f => f.path).join(', ')}`
      : unauthorizedFiles.length > 0
        ? `outside authorized dir: ${unauthorizedFiles.map(f => f.path).join(', ')}`
        : 'all target files present and authorized',
  })

  checks.push({
    id: 'diff',
    label: 'Diff contains only relevant changes',
    pass: evidence.diffOnlyRelevant,
    detail: evidence.diffInspected ? (evidence.diffOnlyRelevant ? 'diff is scoped' : 'diff contains unrelated changes') : 'no diff inspected',
  })

  checks.push({
    id: 'tests',
    label: 'Tests actually ran and passed',
    pass: evidence.testsRan && evidence.testsPassed,
    detail: !evidence.testsRan ? 'tests did not run' : evidence.testsPassed ? 'tests passed' : 'tests failed',
  })

  checks.push({
    id: 'build',
    label: 'Build actually ran and passed',
    pass: evidence.buildRan && evidence.buildPassed,
    detail: !evidence.buildRan ? 'build did not run' : evidence.buildPassed ? 'build passed' : 'build failed',
  })

  checks.push({
    id: 'browser',
    label: 'Web task browser acceptance',
    pass: !evidence.webTask || evidence.browserAcceptance,
    detail: evidence.webTask ? (evidence.browserAcceptance ? 'browser acceptance done' : 'browser acceptance missing') : 'not a web task',
  })

  checks.push({
    id: 'claims',
    label: 'Completion not overstated',
    pass: !evidence.claimsExaggerated,
    detail: evidence.claimsExaggerated ? 'completion overstated' : 'completion stated accurately',
  })

  checks.push({
    id: 'failures',
    label: 'No unexplained failures',
    pass: evidence.unexplainedFailures.length === 0,
    detail: evidence.unexplainedFailures.length > 0
      ? `undisclosed: ${evidence.unexplainedFailures.join('; ')}`
      : 'no undisclosed failures',
  })

  checks.push({
    id: 'credentials',
    label: 'No credential leakage',
    pass: !evidence.credentialsLeaked,
    detail: evidence.credentialsLeaked ? 'credentials appear leaked' : 'no credentials found',
  })

  const passed = checks.every(check => check.pass)
  const failed = checks.filter(check => !check.pass)
  const failures = failed.map(check => `${check.label}: ${check.detail}`)
  const unauthorizedChanges = unauthorizedFiles.map(file => file.path)
  const blocked = evidence.unexplainedFailures.some(item => /quota|insufficient balance|credential|permission/i.test(item))
  const status = passed ? 'PASS' : blocked ? 'BLOCKED' : (!evidence.testsRan || !evidence.buildRan || !evidence.diffInspected) ? 'INCOMPLETE' : 'FAIL'
  return {
    passed,
    status,
    checks,
    summary: passed
      ? 'All checks passed.'
      : `${status}: ${failures.join('; ')}.`,
    requirements: checks.map(check => `${check.pass ? 'PASS' : 'FAIL'} ${check.label}`),
    failures,
    unauthorizedChanges,
    requiredNextAction: passed ? 'No further action.' : evidence.testsRan && !evidence.testsPassed ? 'Fix failing tests, then rerun verification.' : 'Collect the missing evidence and rerun verification.',
    canReportComplete: passed,
  }
}
