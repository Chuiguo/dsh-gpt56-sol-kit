/** Failure classes used by Windows preflight and retry policy. */
export type FailureClass = 'executable-enoent' | 'cwd-enoent' | 'file-not-found' | 'permission-denied' | 'dependency-missing' | 'test-failure' | 'build-failure' | 'network-failure' | 'provider-protocol-failure' | 'quota' | 'unknown';
/** Facts available before retrying a failed command. */
export interface PreflightFacts {
    cwdExists: boolean;
    targetExists: boolean;
    targetRequestedToCreate: boolean;
    executablePath?: string;
    executableExists?: boolean;
    packageJsonExists: boolean;
    rulesFiles: string[];
    permissionDenied: boolean;
}
/** Classify a spawn or command failure without relying on a platform-specific message alone. */
export declare function classifyFailure(error: {
    message?: string;
    code?: string;
    status?: number;
}, context?: {
    cwdExists?: boolean;
    executableExists?: boolean;
    command?: string;
}): FailureClass;
/** Retry policy: identical errors once; quota and permanent protocol errors never retry. */
export declare function retryDecision(failure: FailureClass, identicalRetries: number, consecutiveErrors: number, maxIdenticalRetries?: number, maxConsecutiveErrors?: number): 'retry' | 'stop';
/** Check whether an edit is authorized by a preceding successful read of the same path. */
export declare function editRequiresRead(path: string, readPaths: readonly string[]): boolean;
//# sourceMappingURL=preflight.d.ts.map