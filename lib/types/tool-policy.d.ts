/**
 * Tool-set policy per task mode. Two layers exist in the adapter:
 *
 *  1. visibility  — `agent.ctx.tools.restrict({ deny })` removes schemas from
 *     the model request (also removes their prompt/token cost);
 *  2. enforcement — a `tools` guard denies execution of the same names, so the
 *     restriction is a real backend rule, not just hidden UI.
 *
 * The category lists use the shipped `@deepseek-ai/dsh-tool-*` names from the
 * generated tool catalog. They are defaults: a deployment with renamed or extra
 * tools can extend them through the adapter config.
 */
import type { SolMode } from './config.ts';
export declare const READ_TOOLS: readonly string[];
export declare const WRITE_TOOLS: readonly string[];
export declare const SHELL_TOOLS: readonly string[];
export declare const TERMINAL_TOOLS: readonly string[];
export declare const WEB_TOOLS: readonly string[];
export declare const SUBAGENT_TOOLS: readonly string[];
export declare const GOAL_WRITE_TOOLS: readonly string[];
export declare const TODO_TOOLS: readonly string[];
export declare const JOB_CONTROL_TOOLS: readonly string[];
export declare const CORDIS_TOOLS: readonly string[];
export declare const SCHEDULE_TOOLS: readonly string[];
/** Every tool that can mutate the outside world; used by the enforcement guard. */
export declare const MUTATING_TOOLS: readonly string[];
/**
 * The deny set for a mode: tools removed from both visibility and execution.
 * `coding`, `frontend`, `max`, and `pro` deny nothing (full tool set).
 *
 * @param mode The active task mode.
 * @returns Tool names to deny.
 */
export declare function deniedToolsForMode(mode: SolMode): string[];
/**
 * Whether a tool name can mutate the outside world (used by the guard to
 * enforce read-only modes even if a tool slips past the deny list).
 *
 * @param name The tool name.
 * @returns Whether the tool is mutating.
 */
export declare function isMutatingTool(name: string): boolean;
/** Human-readable category labels, in display order. */
export declare const CATEGORY_LABELS: readonly {
    id: string;
    tools: readonly string[];
}[];
/**
 * The denied tool CATEGORIES for a mode (for `/sol status`). Empty when the
 * mode denies nothing.
 *
 * @param mode The active task mode.
 * @returns Category labels whose tools the mode denies.
 */
export declare function deniedCategoriesForMode(mode: SolMode): string[];
/**
 * Whether the guard should enforce read-only for a mode. The guard denies any
 * {@link MUTATING_TOOLS} name in these modes regardless of the visibility list.
 *
 * @param mode The active task mode.
 * @returns Whether write-capable tools must be denied.
 */
export declare function enforceReadOnly(mode: SolMode): boolean;
//# sourceMappingURL=tool-policy.d.ts.map