/** The single derived policy used by visibility and backend enforcement. */
import type { SolMode } from './config.ts'
import type { TaskScope } from './task-profile.ts'
import type { WorkflowPhase } from './workflow.ts'
import { deniedCategoriesForMode, deniedToolsForMode } from './tool-policy.ts'

export interface EffectivePolicyInput {
  mode: SolMode
  scope: TaskScope
  phase: WorkflowPhase
}

export interface EffectivePolicy {
  mode: SolMode
  scope: TaskScope
  phase: WorkflowPhase
  readOnly: boolean
  deniedTools: string[]
  deniedCategories: string[]
  allowsImplementation: boolean
}

const READ_ONLY_SCOPES: ReadonlySet<TaskScope> = new Set(['answer', 'diagnose', 'review', 'deep-analysis'])
const IMPLEMENTATION_MODES: ReadonlySet<SolMode> = new Set(['auto', 'coding', 'frontend', 'max', 'pro'])

/** Derive every tool and workflow permission from one mode/scope/phase tuple. */
export function resolveEffectivePolicy(input: EffectivePolicyInput): EffectivePolicy {
  const readOnly = READ_ONLY_SCOPES.has(input.scope) || input.mode === 'review' || input.mode === 'deep-analysis'
  const allowsImplementation = !readOnly
    && IMPLEMENTATION_MODES.has(input.mode)
    && (input.scope === 'modify' || input.scope === 'frontend')
    && input.phase !== 'complete'
    && input.phase !== 'blocked'
  const deniedTools = readOnly ? deniedToolsForMode(input.mode === 'deep-analysis' ? 'deep-analysis' : 'review') : deniedToolsForMode(input.mode)
  return {
    ...input,
    readOnly,
    deniedTools,
    deniedCategories: deniedCategoriesForMode(readOnly ? 'review' : input.mode),
    allowsImplementation,
  }
}
