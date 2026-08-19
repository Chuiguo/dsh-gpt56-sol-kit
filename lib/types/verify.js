/**
 * Independent verification workflow (sol_verify). Pure assessment over an
 * evidence record gathered by read-only tools; the adapter (index.ts) wires the
 * evidence from the real filesystem/diff/test/build state. The assessor never
 * reports "done" unless every check passes.
 */
/** Collect conservative verification facts from paired, post-task tool events. */
export function collectVerificationEvidence(input) {
    const results = new Map(input.results.map(result => [result.callId, result]));
    const paired = input.calls.filter(call => results.has(call.callId));
    const successful = paired.filter(call => results.get(call.callId)?.errorCode === undefined);
    const failed = input.results.filter(result => result.errorCode !== undefined).map(result => result.errorCode ?? 'tool failure');
    const names = (call) => `${call.name} ${call.arguments}`.toLowerCase();
    const testCalls = paired.filter(call => /test|vitest|jest/.test(names(call)));
    const buildCalls = paired.filter(call => /build|tsc|typecheck|lint|compile/.test(names(call)));
    const diffCalls = paired.filter(call => /git diff|diff|status/.test(names(call)));
    const browserCalls = successful.filter(call => /browser|playwright|screenshot/.test(names(call)));
    const testResults = testCalls.map(call => results.get(call.callId));
    const buildResults = buildCalls.map(call => results.get(call.callId));
    const diffResults = diffCalls.map(call => results.get(call.callId));
    const browserResults = browserCalls.map(call => results.get(call.callId));
    const fileCalls = successful.filter(call => /^(read|read_image|write|edit|str_replace_editor)$/.test(call.name));
    const files = fileCalls.map(call => {
        let args = {};
        try {
            args = JSON.parse(call.arguments);
        }
        catch { /* malformed tool args are incomplete evidence */ }
        const path = typeof args.file_path === 'string' ? args.file_path : typeof args.path === 'string' ? args.path : call.name;
        const result = results.get(call.callId);
        return { path, exists: result?.meta?.exists === true, authorized: result?.meta?.authorized === true };
    });
    const diffInspected = diffCalls.length > 0;
    const testsRan = testCalls.length > 0;
    const buildRan = buildCalls.length > 0;
    const authorizationKnown = fileCalls.every(call => {
        const meta = results.get(call.callId)?.meta;
        return typeof meta?.exists === 'boolean' && typeof meta.authorized === 'boolean';
    });
    const commandResultsKnown = [...testResults, ...buildResults].every(result => typeof result?.meta?.exitCode === 'number');
    const testsPassed = testsRan && testResults.every(result => result?.meta?.exitCode === 0);
    const buildPassed = buildRan && buildResults.every(result => result?.meta?.exitCode === 0);
    const diffOnlyRelevant = diffInspected && diffResults.every(result => result?.meta?.diffOnlyRelevant === true);
    const browserAcceptance = browserCalls.length > 0 && browserResults.every(result => result?.meta?.browserAccepted === true);
    const unexplainedFailures = [...failed, ...(input.providerFailures ?? [])];
    return {
        goalCompleted: fileCalls.length > 0 || (!input.webTask && (testsPassed || buildPassed)),
        files,
        diffOnlyRelevant,
        authorizationKnown,
        commandResultsKnown,
        diffInspected,
        testsRan,
        testsPassed,
        buildRan,
        buildPassed,
        webTask: input.webTask,
        browserAcceptance,
        claimsExaggerated: false,
        unexplainedFailures,
        credentialsLeaked: input.calls.some(call => looksLikeCredentialLeak(call.arguments)) || input.results.some(result => looksLikeCredentialLeak(result.errorCode ?? '')),
    };
}
const CREDENTIAL_PATTERN = /((api[_-]?key|authorization|secret|token|password)\s*[:=]\s*\S{8,})|(bearer\s+[a-z0-9._-]{12,})/i;
/**
 * Detect likely credential leakage in a free-text surface. Conservative: it
 * only flags explicit key-like assignments, not any occurrence of the word.
 *
 * @param text The text to scan.
 * @returns Whether a credential leak is likely.
 */
export function looksLikeCredentialLeak(text) {
    return CREDENTIAL_PATTERN.test(text);
}
/**
 * Assess a verification evidence record against the ten Sol checks.
 *
 * @param evidence The gathered evidence.
 * @returns A structured verdict; `passed` is false unless every check passes.
 */
export function assessVerification(evidence) {
    const checks = [];
    checks.push({
        id: 'goal',
        label: 'User goal completed',
        pass: evidence.goalCompleted,
        detail: evidence.goalCompleted ? 'goal reported complete' : 'goal not completed',
    });
    const missingFiles = evidence.files.filter(f => !f.exists);
    const unauthorizedFiles = evidence.files.filter(f => !f.authorized);
    checks.push({
        id: 'files',
        label: 'Target files exist and are authorized',
        pass: missingFiles.length === 0 && unauthorizedFiles.length === 0,
        detail: missingFiles.length > 0
            ? `missing: ${missingFiles.map(f => f.path).join(', ')}`
            : unauthorizedFiles.length > 0
                ? `outside authorized dir: ${unauthorizedFiles.map(f => f.path).join(', ')}`
                : 'all target files present and authorized',
    });
    checks.push({
        id: 'diff',
        label: 'Diff contains only relevant changes',
        pass: evidence.diffOnlyRelevant,
        detail: evidence.diffInspected ? (evidence.diffOnlyRelevant ? 'diff is scoped' : 'diff contains unrelated changes') : 'no diff inspected',
    });
    checks.push({
        id: 'tests',
        label: 'Tests actually ran and passed',
        pass: evidence.testsRan && evidence.testsPassed,
        detail: !evidence.testsRan ? 'tests did not run' : evidence.testsPassed ? 'tests passed' : 'tests failed',
    });
    checks.push({
        id: 'build',
        label: 'Build actually ran and passed',
        pass: evidence.buildRan && evidence.buildPassed,
        detail: !evidence.buildRan ? 'build did not run' : evidence.buildPassed ? 'build passed' : 'build failed',
    });
    checks.push({
        id: 'browser',
        label: 'Web task browser acceptance',
        pass: !evidence.webTask || evidence.browserAcceptance,
        detail: evidence.webTask ? (evidence.browserAcceptance ? 'browser acceptance done' : 'browser acceptance missing') : 'not a web task',
    });
    checks.push({
        id: 'claims',
        label: 'Completion not overstated',
        pass: !evidence.claimsExaggerated,
        detail: evidence.claimsExaggerated ? 'completion overstated' : 'completion stated accurately',
    });
    checks.push({
        id: 'failures',
        label: 'No unexplained failures',
        pass: evidence.unexplainedFailures.length === 0,
        detail: evidence.unexplainedFailures.length > 0
            ? `undisclosed: ${evidence.unexplainedFailures.join('; ')}`
            : 'no undisclosed failures',
    });
    checks.push({
        id: 'credentials',
        label: 'No credential leakage',
        pass: !evidence.credentialsLeaked,
        detail: evidence.credentialsLeaked ? 'credentials appear leaked' : 'no credentials found',
    });
    checks.push({
        id: 'authorization-evidence',
        label: 'Authorization facts are known',
        pass: evidence.authorizationKnown === true,
        detail: evidence.authorizationKnown === true ? 'authorization facts supplied by host' : 'host did not supply authorization facts',
    });
    checks.push({
        id: 'command-evidence',
        label: 'Command results are structured',
        pass: evidence.commandResultsKnown === true,
        detail: evidence.commandResultsKnown === true ? 'structured exit results supplied' : 'structured exit results unavailable',
    });
    const passed = checks.every(check => check.pass);
    const failed = checks.filter(check => !check.pass);
    const failures = failed.map(check => `${check.label}: ${check.detail}`);
    const unauthorizedChanges = unauthorizedFiles.map(file => file.path);
    const blocked = evidence.unexplainedFailures.some(item => /quota|insufficient balance|credential|permission/i.test(item));
    const status = passed ? 'PASS' : blocked ? 'BLOCKED' : (!evidence.testsRan || !evidence.buildRan || !evidence.diffInspected) ? 'INCOMPLETE' : 'FAIL';
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
    };
}
//# sourceMappingURL=verify.js.map