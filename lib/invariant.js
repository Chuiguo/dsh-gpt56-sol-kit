//#region lib/types/invariant.js
/**
* Package-owned invariant companion for `@deepseek-ai/dsh-gpt56-sol-kit`.
* @module @deepseek-ai/dsh-gpt56-sol-kit/invariant
*/
const PACKAGE_NAME = "@deepseek-ai/dsh-gpt56-sol-kit";
/** GPT-5.6-Sol companion invariant plugin name. */
const name = "gpt56-sol-kit-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/**
* No runtime invariant: this companion contributes only effect-owned prompt,
* command, tool-policy, settings, and event registrations; their authoritative
* services own the observable lifecycle relations.
*/
const install = () => {};
/**
* Register this package's invariant companion.
* @param ctx - Cordis context carrying the invariant service.
* @returns the installed registration's disposer after setup succeeds.
*/
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
