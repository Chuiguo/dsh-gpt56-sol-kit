/**
 * Optional client half of the GPT-5.6-Sol kit.
 *
 * The primary Web settings surface for this plugin is the schema-driven form
 * produced by the `gpt56-sol-kit` settings namespace — no client code is
 * required to edit enabled/provider/model/prices/budgets there. Status and
 * budget are available in-chat via `/sol status` and `/sol budget`.
 *
 * A custom settings-section panel would register into the `settings.section`
 * slot; it is intentionally omitted from this baseline so we never ship an
 * unverified React registration or a Host RPC that could surface keys. Enable
 * a client build only when the target deployment's Slot and React setup has
 * been verified against that deployment.
 */
export declare const name = "gpt56-sol-kit-client";
export declare function apply(_ctx: unknown): void;
//# sourceMappingURL=client.d.ts.map