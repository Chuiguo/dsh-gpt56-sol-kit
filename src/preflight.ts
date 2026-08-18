/** Failure classes used by Windows preflight and retry policy. */
export type FailureClass =
  | 'executable-enoent'
  | 'cwd-enoent'
  | 'file-not-found'
  | 'permission-denied'
  | 'dependency-missing'
  | 'test-failure'
  | 'build-failure'
  | 'network-failure'
  | 'provider-protocol-failure'
  | 'quota'
  | 'unknown'

/** Facts available before retrying a failed command. */
export interface PreflightFacts {
  cwdExists: boolean
  targetExists: boolean
  targetRequestedToCreate: boolean
  executablePath?: string
  executableExists?: boolean
  packageJsonExists: boolean
  rulesFiles: string[]
  permissionDenied: boolean
}

/** Classify a spawn or command failure without relying on a platform-specific message alone. */
export function classifyFailure(
  error: { message?: string; code?: string; status?: number },
  context: { cwdExists?: boolean; executableExists?: boolean; command?: string } = {},
): FailureClass {
  const text = `${error.code ?? ''} ${error.message ?? ''}`.toLowerCase()
  if (/quota|insufficient balance|billing|credit/.test(text)) return 'quota'
  const spawnEnoent = /executable.*enoent|spawn .*enoent/.test(text)
  if (context.executableExists === false || (spawnEnoent && context.cwdExists !== false)) return 'executable-enoent'
  const cwdEnoent = /cwd.*enoent|working directory|no such file or directory/.test(text)
  if (context.cwdExists === false || (cwdEnoent && context.executableExists === true)) return 'cwd-enoent'
  if (/permission denied|eacces|eperm|access is denied/.test(text)) return 'permission-denied'
  if (/module not found|cannot find package|dependency/.test(text)) return 'dependency-missing'
  if (/test|vitest|jest/.test(`${context.command ?? ''} ${text}`) && !/build/.test(context.command ?? '')) return 'test-failure'
  if (/build|tsc|compile/.test(`${context.command ?? ''} ${text}`)) return 'build-failure'
  if (/network|timeout|econn|fetch/.test(text) || (error.status !== undefined && error.status >= 500)) return 'network-failure'
  if (/protocol|invalid response|unsupported request/.test(text)) return 'provider-protocol-failure'
  if (/enoent|not found/.test(text)) return 'file-not-found'
  return 'unknown'
}

/** Retry policy: identical errors once; quota and permanent protocol errors never retry. */
export function retryDecision(failure: FailureClass, identicalRetries: number, consecutiveErrors: number, maxIdenticalRetries = 1, maxConsecutiveErrors = 4): 'retry' | 'stop' {
  if (failure === 'quota' || failure === 'provider-protocol-failure' || failure === 'permission-denied') return 'stop'
  if (identicalRetries >= maxIdenticalRetries || consecutiveErrors >= maxConsecutiveErrors) return 'stop'
  return 'retry'
}

/** Check whether an edit is authorized by a preceding successful read of the same path. */
export function editRequiresRead(path: string, readPaths: readonly string[]): boolean {
  return readPaths.includes(path)
}
