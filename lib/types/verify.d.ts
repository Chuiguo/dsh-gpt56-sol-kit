/**
 * Independent verification workflow (sol_verify). Pure assessment over an
 * evidence record gathered by read-only tools; the adapter (index.ts) wires the
 * evidence from the real filesystem/diff/test/build state. The assessor never
 * reports "done" unless every check passes.
 */
export interface VerificationEvidence {
    /** Whether the declared user goal is actually completed. */
    goalCompleted: boolean;
    /** Target files with existence and authorization facts. */
    files: ReadonlyArray<{
        path: string;
        exists: boolean;
        authorized: boolean;
    }>;
    /** Whether the diff contains only relevant changes (true when no diff exists). */
    diffOnlyRelevant: boolean;
    /** Whether a diff was inspected at all. */
    diffInspected: boolean;
    /** Whether tests actually ran. */
    testsRan: boolean;
    /** Whether the tests that ran passed. */
    testsPassed: boolean;
    /** Whether a build actually ran. */
    buildRan: boolean;
    /** Whether the build that ran passed. */
    buildPassed: boolean;
    /** Whether this was a web/frontend task. */
    webTask: boolean;
    /** Whether browser acceptance was performed for a web task. */
    browserAcceptance: boolean;
    /** Whether the final answer overstates completion. */
    claimsExaggerated: boolean;
    /** Failures that were not disclosed in the final answer. */
    unexplainedFailures: readonly string[];
    /** Whether credentials appear to have leaked in the answer/diff. */
    credentialsLeaked: boolean;
}
export interface VerifyCheck {
    id: string;
    label: string;
    pass: boolean;
    detail: string;
}
export type VerificationStatus = 'PASS' | 'FAIL' | 'INCOMPLETE' | 'BLOCKED';
export interface VerificationResult {
    passed: boolean;
    status: VerificationStatus;
    checks: VerifyCheck[];
    summary: string;
    requirements: string[];
    failures: string[];
    unauthorizedChanges: string[];
    requiredNextAction: string;
    canReportComplete: boolean;
}
/**
 * Detect likely credential leakage in a free-text surface. Conservative: it
 * only flags explicit key-like assignments, not any occurrence of the word.
 *
 * @param text The text to scan.
 * @returns Whether a credential leak is likely.
 */
export declare function looksLikeCredentialLeak(text: string): boolean;
/**
 * Assess a verification evidence record against the ten Sol checks.
 *
 * @param evidence The gathered evidence.
 * @returns A structured verdict; `passed` is false unless every check passes.
 */
export declare function assessVerification(evidence: VerificationEvidence): VerificationResult;
//# sourceMappingURL=verify.d.ts.map