/**
 * In-process test runner. `node --test tests/` spawns a child per file, which
 * the DSH sandbox denies (EPERM on piped stdio); importing the test files here
 * runs them all in the current process instead.
 */
import './config.test.ts'
import './model-match.test.ts'
import './modes.test.ts'
import './prompt.test.ts'
import './request-overrides.test.ts'
import './tool-policy.test.ts'
import './context-policy.test.ts'
import './cost.test.ts'
import './verify.test.ts'
import './commands.test.ts'
import './v2.test.ts'
import './effective-policy.test.ts'
import './session-state.test.ts'
import './composition.test.ts'
