/**
 * Sol-specific system-prompt section text. Deliberately short: it restates the
 * Sol operating policy in terse directives and adds one or two mode lines. It
 * never copies OpenAI's official documentation at length.
 */
const COMMON_DIRECTIVES = [
    'Follow each instruction exactly once; do not restate or repeat directives.',
    'Expose and use only tools relevant to the current task.',
    'Keep three scopes distinct: answer (explain only), diagnose (investigate and report, change nothing), modify (implement and verify).',
    'Modification tasks implement directly and verify; diagnosis tasks never modify files.',
    'Confirm before external writes, deletion, publishing, or high-cost actions.',
    'Ask for concrete success criteria instead of "as detailed as possible".',
    'Do not print a full implementation draft before starting; write and verify each phase as you go.',
    'Do not repeat a tool call that already succeeded.',
    'On failure, diagnose the cause before retrying; never blindly retry.',
    'Make the final answer match the actual files, diffs, and test results.',
];
const MODE_DIRECTIVES = {
    auto: [
        'Classify the new task once, then follow inspect, implement, verify, review, fix, and complete or blocked phases.',
        'Only verification evidence may authorize completion; never treat a natural-language completion claim as evidence.',
    ],
    balanced: [
        'Prefer low-latency, concise work for ordinary questions and small edits.',
    ],
    coding: [
        'Check project rules first, then edit files directly with file tools.',
        'Run tests as you implement; review the diff and test results before finishing.',
    ],
    frontend: [
        'Prioritize visual hierarchy, responsive layout, interaction, and accessibility.',
        'After changes, start the local page and perform browser acceptance: check console errors and common resolutions.',
    ],
    review: [
        'Read-only by default: report issues first; do not modify files.',
        'Give a file path and line number for every finding.',
        'Separate confirmed problems, possible problems, and false positives.',
    ],
    'deep-analysis': [
        'For novels, architecture, research, and complex plans; parallel sub-agents are allowed, but file writes and command execution remain disabled.',
        'Separate fact, inference, and recommendation.',
        'Never reach a conclusion without evidence.',
    ],
    max: [
        'Maximum-effort reasoning is active; prioritize correctness and completeness over latency.',
    ],
    pro: [
        'Professional-effort reasoning is active.',
    ],
};
/**
 * Render the Sol policy prompt section for a mode. Returned text is stable for
 * a given mode (prefix-cache friendly).
 *
 * @param mode The active task mode.
 * @returns The short policy text.
 */
export function solPromptSection(mode) {
    const lines = [...COMMON_DIRECTIVES, ...MODE_DIRECTIVES[mode]];
    return 'GPT-5.6-Sol operating policy:\n' + lines.map(line => `- ${line}`).join('\n');
}
//# sourceMappingURL=prompt.js.map