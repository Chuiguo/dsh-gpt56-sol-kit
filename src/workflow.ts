import type { TaskProfile, TaskScope } from './task-profile.ts'

/** V2 workflow phases. */
export type WorkflowPhase = 'idle' | 'inspect' | 'implement' | 'verify' | 'review' | 'fix' | 'complete' | 'blocked'

/** Evidence that permits a phase transition. */
export interface WorkflowEvidence {
  kind: 'inspection' | 'implementation' | 'verification' | 'review' | 'failure' | 'blocked'
  detail: string
  passed?: boolean
}

/** Serializable workflow state retained for status and verification. */
export interface WorkflowState {
  profile: TaskProfile
  phase: WorkflowPhase
  steps: number
  fixRounds: number
  /** Maximum fix rounds for this workflow, resolved from plugin configuration. */
  maxFixRounds: number
  evidence: WorkflowEvidence[]
  lastError: string | null
}

const TRANSITIONS: Readonly<Record<WorkflowPhase, readonly WorkflowPhase[]>> = {
  idle: ['inspect'],
  inspect: ['implement', 'verify', 'blocked'],
  implement: ['verify', 'blocked'],
  verify: ['review', 'fix', 'blocked'],
  review: ['complete', 'fix', 'blocked'],
  fix: ['verify', 'blocked'],
  complete: [],
  blocked: [],
}

/** Create the initial state; auto profiles always begin at inspect. */
export function createWorkflow(profile: TaskProfile, maxFixRounds = 2): WorkflowState {
  if (!Number.isInteger(maxFixRounds) || maxFixRounds < 0) throw new TypeError('maxFixRounds must be a non-negative integer')
  return { profile, phase: 'inspect', steps: 0, fixRounds: 0, maxFixRounds, evidence: [], lastError: null }
}

/** Return whether a transition is structurally allowed and evidence-backed. */
export function canTransition(state: WorkflowState, next: WorkflowPhase, evidence?: WorkflowEvidence): boolean {
  if (!TRANSITIONS[state.phase].includes(next)) return false
  if (next === 'implement' && (state.profile.scope !== 'modify' && state.profile.scope !== 'frontend')) return false
  if (next === 'complete' && (evidence?.kind !== 'review' || evidence.passed !== true)) return false
  if (next === 'fix' && state.fixRounds >= state.maxFixRounds) return false
  if (next === 'verify' && state.phase === 'fix' && state.fixRounds >= state.maxFixRounds) return false
  return evidence !== undefined
}

/** Apply one validated transition and append its reason to the evidence log. */
export function transition(state: WorkflowState, next: WorkflowPhase, evidence: WorkflowEvidence): WorkflowState {
  if (!canTransition(state, next, evidence)) throw new Error(`Invalid workflow transition ${state.phase} -> ${next}.`)
  const fixRounds = next === 'fix' ? state.fixRounds + 1 : state.fixRounds
  return {
    ...state,
    phase: next,
    steps: state.steps + 1,
    fixRounds,
    lastError: evidence.passed === false ? evidence.detail : state.lastError,
    evidence: [...state.evidence, evidence],
  }
}

/** Convert a failure into the next legal action without hiding it. */
export function failureTransition(state: WorkflowState, detail: string): { next: 'fix' | 'blocked'; evidence: WorkflowEvidence } {
  if (state.phase === 'verify' && state.fixRounds < state.maxFixRounds) return { next: 'fix', evidence: { kind: 'failure', detail, passed: false } }
  return { next: 'blocked', evidence: { kind: 'blocked', detail, passed: false } }
}

/** Return whether a profile is allowed to request implementation. */
export function isImplementationProfile(scope: TaskScope): boolean {
  return scope === 'modify' || scope === 'frontend'
}
