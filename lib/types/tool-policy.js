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
export const READ_TOOLS = [
    'read', 'read_image', 'glob', 'grep', 'lsp',
    'session_event_read', 'session_event_search', 'session_event_trace',
    'session_search', 'session_trace', 'list_agents', 'job_list', 'get_goal', 'skill',
];
export const WRITE_TOOLS = ['write', 'edit', 'str_replace_editor'];
export const SHELL_TOOLS = ['bash', 'pwsh'];
export const TERMINAL_TOOLS = [
    'terminal_open', 'terminal_send', 'terminal_signal', 'terminal_close', 'terminal_read', 'terminal_list',
];
export const WEB_TOOLS = ['web_search', 'web_fetch'];
export const SUBAGENT_TOOLS = [
    'subagent', 'interrupt_agent', 'send_message', 'report', 'ralph', 'workflow',
];
export const GOAL_WRITE_TOOLS = ['create_goal', 'update_goal'];
export const TODO_TOOLS = ['todo_write'];
export const JOB_CONTROL_TOOLS = ['job_kill', 'job_output'];
export const CORDIS_TOOLS = [
    'cordis_define', 'cordis_inspect_list', 'cordis_inspect_query', 'cordis_inspect_self',
    'cordis_run', 'cordis_stop', 'cordis_undefine',
];
export const SCHEDULE_TOOLS = ['schedule_create', 'schedule_delete', 'schedule_list'];
/** Every tool that can mutate the outside world; used by the enforcement guard. */
export const MUTATING_TOOLS = [
    ...WRITE_TOOLS,
    ...SHELL_TOOLS,
    ...TERMINAL_TOOLS,
    ...SUBAGENT_TOOLS,
    ...GOAL_WRITE_TOOLS,
    ...TODO_TOOLS,
    ...JOB_CONTROL_TOOLS,
    ...CORDIS_TOOLS,
    ...SCHEDULE_TOOLS,
];
/**
 * The deny set for a mode: tools removed from both visibility and execution.
 * `coding`, `frontend`, `max`, and `pro` deny nothing (full tool set).
 *
 * @param mode The active task mode.
 * @returns Tool names to deny.
 */
export function deniedToolsForMode(mode) {
    switch (mode) {
        case 'balanced':
            return [
                ...SHELL_TOOLS, ...TERMINAL_TOOLS, ...SUBAGENT_TOOLS, ...GOAL_WRITE_TOOLS,
                ...JOB_CONTROL_TOOLS, ...CORDIS_TOOLS, ...SCHEDULE_TOOLS,
            ];
        case 'review':
            return [
                ...WRITE_TOOLS, ...SHELL_TOOLS, ...TERMINAL_TOOLS, ...SUBAGENT_TOOLS,
                ...GOAL_WRITE_TOOLS, ...TODO_TOOLS, ...JOB_CONTROL_TOOLS, ...CORDIS_TOOLS, ...SCHEDULE_TOOLS,
            ];
        case 'deep-analysis':
            return [
                ...WRITE_TOOLS, ...SHELL_TOOLS, ...TERMINAL_TOOLS, ...GOAL_WRITE_TOOLS,
                ...TODO_TOOLS, ...CORDIS_TOOLS, ...SCHEDULE_TOOLS,
            ];
        case 'coding':
        case 'frontend':
        case 'max':
        case 'pro':
            return [];
        default:
            return [];
    }
}
/**
 * Whether a tool name can mutate the outside world (used by the guard to
 * enforce read-only modes even if a tool slips past the deny list).
 *
 * @param name The tool name.
 * @returns Whether the tool is mutating.
 */
export function isMutatingTool(name) {
    return MUTATING_TOOLS.includes(name);
}
/** Human-readable category labels, in display order. */
export const CATEGORY_LABELS = [
    { id: 'write', tools: WRITE_TOOLS },
    { id: 'shell', tools: SHELL_TOOLS },
    { id: 'terminal', tools: TERMINAL_TOOLS },
    { id: 'subagent/workflow', tools: SUBAGENT_TOOLS },
    { id: 'goal', tools: GOAL_WRITE_TOOLS },
    { id: 'todo', tools: TODO_TOOLS },
    { id: 'job control', tools: JOB_CONTROL_TOOLS },
    { id: 'cordis', tools: CORDIS_TOOLS },
    { id: 'schedule', tools: SCHEDULE_TOOLS },
];
/**
 * The denied tool CATEGORIES for a mode (for `/sol status`). Empty when the
 * mode denies nothing.
 *
 * @param mode The active task mode.
 * @returns Category labels whose tools the mode denies.
 */
export function deniedCategoriesForMode(mode) {
    const denied = deniedToolsForMode(mode);
    if (denied.length === 0)
        return [];
    return CATEGORY_LABELS
        .filter(category => category.tools.some(tool => denied.includes(tool)))
        .map(category => category.id);
}
/**
 * Whether the guard should enforce read-only for a mode. The guard denies any
 * {@link MUTATING_TOOLS} name in these modes regardless of the visibility list.
 *
 * @param mode The active task mode.
 * @returns Whether write-capable tools must be denied.
 */
export function enforceReadOnly(mode) {
    return mode === 'review' || mode === 'deep-analysis';
}
//# sourceMappingURL=tool-policy.js.map