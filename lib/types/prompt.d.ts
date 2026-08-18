/**
 * Sol-specific system-prompt section text. Deliberately short: it restates the
 * Sol operating policy in terse directives and adds one or two mode lines. It
 * never copies OpenAI's official documentation at length.
 */
import type { SolMode } from './config.ts';
/**
 * Render the Sol policy prompt section for a mode. Returned text is stable for
 * a given mode (prefix-cache friendly).
 *
 * @param mode The active task mode.
 * @returns The short policy text.
 */
export declare function solPromptSection(mode: SolMode): string;
//# sourceMappingURL=prompt.d.ts.map