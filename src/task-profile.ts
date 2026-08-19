import type { SolMode } from './config.ts'

/** The operation scope inferred from one user task. */
export type TaskScope = 'answer' | 'diagnose' | 'modify' | 'review' | 'frontend' | 'deep-analysis'

/** Stable task profile selected at task start. */
export interface TaskProfile {
  scope: TaskScope
  mode: SolMode
  explicit: boolean
  reason: string
  requiresConfirmation: boolean
}

const MODIFY_WORDS = /\b(add|build|change|create|edit|fix|implement|modify|refactor|remove|update|write|修复|实现|修改|创建|添加|删除|重构|更新|编写)\b/i
const DIAGNOSE_WORDS = /\b(analy[sz]e|check|diagnos[ei]s|find out|investigate|inspect|why|检查|诊断|排查|分析原因|报告问题)\b/i
const REVIEW_WORDS = /(?:\b(?:code review|review|review the diff)\b|审查|评审)/i
const FRONTEND_WORDS = /(?:\b(?:frontend|front-end|web page|website|UI|UX|CSS|HTML|React|Vite)\b|网页|前端|页面|界面)/i
const DEEP_WORDS = /\b(novel|research|architecture|architectural|complex design|论文|小说|研究|架构|复杂方案)\b/i
const EXTERNAL_RISK = /\b(delete|publish|deploy|buy|purchase|send|upload|release|删除|发布|部署|购买|上传)\b/i
const READ_ONLY_INTENT = /(?:只\s*(?:检查|审查|分析|报告)|不要\s*(?:修改|改|写)|不(?:要|需)\s*(?:修改|改|写)|without\s+(?:changing|editing|writing)|do\s+not\s+(?:change|edit|write)|read[- ]only)/i
const STRONG_MODIFY = /(?:修复|实现|创建|修改|删除|重构|更新|添加|编写|\b(?:fix|implement|create|modify|refactor|remove|update|add|write)\b)/i

/**
 * Classify a task without model calls. Explicit mode always wins over auto.
 * @param request Current user request.
 * @param explicitMode User-selected mode, when locked for this task.
 * @returns A stable profile suitable for workflow initialization.
 */
export function classifyTask(request: string, explicitMode?: SolMode): TaskProfile {
  if (explicitMode !== undefined && explicitMode !== 'auto') {
    const scope = explicitMode === 'review' ? 'review' : explicitMode === 'frontend' ? 'frontend' : explicitMode === 'deep-analysis' ? 'deep-analysis' : explicitMode === 'coding' || explicitMode === 'max' || explicitMode === 'pro' ? 'modify' : 'answer'
    return { scope, mode: explicitMode, explicit: true, reason: 'user-selected mode', requiresConfirmation: EXTERNAL_RISK.test(request) }
  }
  const trimmed = request.trim()
  const readOnly = READ_ONLY_INTENT.test(trimmed)
  const diagnostic = DIAGNOSE_WORDS.test(trimmed)
  const modifying = STRONG_MODIFY.test(trimmed) || MODIFY_WORDS.test(trimmed)
  const scope: TaskScope = readOnly && REVIEW_WORDS.test(trimmed)
    ? 'review'
    : readOnly
      ? 'diagnose'
      : REVIEW_WORDS.test(trimmed)
        ? 'review'
        : FRONTEND_WORDS.test(trimmed) && modifying
          ? 'frontend'
          : DEEP_WORDS.test(trimmed)
            ? 'deep-analysis'
            : modifying && (!diagnostic || STRONG_MODIFY.test(trimmed))
              ? 'modify'
              : diagnostic
                ? 'diagnose'
                : 'answer'
  const mode: SolMode = scope === 'frontend' ? 'frontend' : scope === 'review' ? 'review' : scope === 'deep-analysis' ? 'deep-analysis' : scope === 'modify' ? 'coding' : 'balanced'
  return { scope, mode, explicit: false, reason: `matched ${scope} task signals`, requiresConfirmation: EXTERNAL_RISK.test(trimmed) }
}

/** Whether a task scope may enter the implementation stage. */
export function allowsImplementation(scope: TaskScope): boolean {
  return scope === 'modify' || scope === 'frontend'
}

/** Whether a mode must remain backend read-only. */
export function isProfileReadOnly(scope: TaskScope): boolean {
  return scope === 'review' || scope === 'deep-analysis' || scope === 'diagnose' || scope === 'answer'
}
