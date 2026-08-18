/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-gpt56-sol-kit`.
 * @module @deepseek-ai/dsh-gpt56-sol-kit/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-gpt56-sol-kit'

/** GPT-5.6-Sol companion invariant plugin name. */
export const name = 'gpt56-sol-kit-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: this companion contributes only effect-owned prompt,
 * command, tool-policy, settings, and event registrations; their authoritative
 * services own the observable lifecycle relations.
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
