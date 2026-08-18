import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deniedToolsForMode, enforceReadOnly, isMutatingTool, WRITE_TOOLS } from '../src/tool-policy.ts'

test('8: tool set switches by mode', () => {
  assert.ok(deniedToolsForMode('balanced').includes('bash'))
  assert.deepEqual(deniedToolsForMode('coding'), [])
})

test('9: review mode denies write tools', () => {
  const denied = deniedToolsForMode('review')
  for (const t of ['write', 'edit', 'str_replace_editor', 'bash', 'pwsh', 'subagent', 'workflow']) {
    assert.ok(denied.includes(t), `review should deny ${t}`)
  }
  // read-only tools remain visible
  assert.ok(!denied.includes('read'))
  assert.ok(!denied.includes('grep'))
  assert.ok(!denied.includes('glob'))
})

test('10: coding mode keeps write tools', () => {
  assert.deepEqual(deniedToolsForMode('coding'), [])
  assert.ok(!isMutatingTool('read'))
  assert.ok(isMutatingTool('write'))
})

test('read-only modes are enforced (backend, not just visibility)', () => {
  assert.equal(enforceReadOnly('review'), true)
  assert.equal(enforceReadOnly('deep-analysis'), true)
  assert.equal(enforceReadOnly('balanced'), false)
  for (const t of WRITE_TOOLS) assert.equal(isMutatingTool(t), true)
})

test('deep-analysis keeps subagents and web but denies writes', () => {
  const denied = deniedToolsForMode('deep-analysis')
  assert.ok(denied.includes('write'))
  assert.ok(denied.includes('bash'))
  assert.ok(!denied.includes('subagent'))
  assert.ok(!denied.includes('web_search'))
  assert.ok(!denied.includes('ralph'))
})
