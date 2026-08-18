import { test } from 'node:test'
import assert from 'node:assert/strict'
import '../src/index.ts'
import { Session, SessionId } from '@deepseek-ai/dsh-session'
import { createWorkflow } from '../src/workflow.ts'
import { classifyTask } from '../src/task-profile.ts'

test('Sol state event survives Session snapshot and restore', () => {
  const session = Session.create(SessionId('sol-state-test'))
  session.append('gpt56-sol/state', {
    schemaVersion: 1,
    mode: 'coding',
    modeExplicitlySelected: true,
    workflow: createWorkflow(classifyTask('Implement a CLI', 'coding')),
    inputTokens: 12,
    cachedInputTokens: 3,
    outputTokens: 9,
    startedAt: 100,
    consecutiveToolErrors: 0,
  })
  const restored = Session.create(SessionId('sol-state-test-restored'), session.events)
  const event = restored.events.find(candidate => candidate.type === 'gpt56-sol/state')
  assert.ok(event)
  assert.equal(event.data.mode, 'coding')
  assert.equal(event.data.modeExplicitlySelected, true)
  assert.equal(event.data.workflow.profile.scope, 'modify')
})
