/** Classify a spawn or command failure without relying on a platform-specific message alone. */
export function classifyFailure(error, context = {}) {
    const text = `${error.code ?? ''} ${error.message ?? ''}`.toLowerCase();
    if (/quota|insufficient balance|billing|credit/.test(text))
        return 'quota';
    const spawnEnoent = /executable.*enoent|spawn .*enoent/.test(text);
    if (context.executableExists === false || (spawnEnoent && context.cwdExists !== false))
        return 'executable-enoent';
    const cwdEnoent = /cwd.*enoent|working directory|no such file or directory/.test(text);
    if (context.cwdExists === false || (cwdEnoent && context.executableExists === true))
        return 'cwd-enoent';
    if (/permission denied|eacces|eperm|access is denied/.test(text))
        return 'permission-denied';
    if (/module not found|cannot find package|dependency/.test(text))
        return 'dependency-missing';
    if (/test|vitest|jest/.test(`${context.command ?? ''} ${text}`) && !/build/.test(context.command ?? ''))
        return 'test-failure';
    if (/build|tsc|compile/.test(`${context.command ?? ''} ${text}`))
        return 'build-failure';
    if (/network|timeout|econn|fetch/.test(text) || (error.status !== undefined && error.status >= 500))
        return 'network-failure';
    if (/protocol|invalid response|unsupported request/.test(text))
        return 'provider-protocol-failure';
    if (/enoent|not found/.test(text))
        return 'file-not-found';
    return 'unknown';
}
/** Retry policy: identical errors once; quota and permanent protocol errors never retry. */
export function retryDecision(failure, identicalRetries, consecutiveErrors, maxIdenticalRetries = 1, maxConsecutiveErrors = 4) {
    if (failure === 'quota' || failure === 'provider-protocol-failure' || failure === 'permission-denied')
        return 'stop';
    if (identicalRetries >= maxIdenticalRetries || consecutiveErrors >= maxConsecutiveErrors)
        return 'stop';
    return 'retry';
}
/** Check whether an edit is authorized by a preceding successful read of the same path. */
export function editRequiresRead(path, readPaths) {
    return readPaths.includes(path);
}
//# sourceMappingURL=preflight.js.map