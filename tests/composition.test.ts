import '../src/index.ts'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Context } from '@deepseek-ai/cordis'
import AgentLoop from '@deepseek-ai/dsh-agent-loop'
import AgentRegistry from '@deepseek-ai/dsh-agent'
import LlmRuntime from '@deepseek-ai/dsh-llm'
import Commands from '@deepseek-ai/dsh-commands'
import SessionStore, { SessionId } from '@deepseek-ai/dsh-session'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime, { defineContentToolFixture } from '@deepseek-ai/dsh-tools'
import { DEFAULT_CONFIG } from '../src/config.ts'
import * as SolKit from '../src/index.ts'

async function mount(): Promise<Context> {
  const ctx = new Context()
  await ctx.plugin(LlmRuntime)
  await ctx.plugin(SessionStore)
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(Commands)
  await ctx.plugin(AgentRegistry)
  await ctx.plugin(AgentLoop, { agents: [] })
  await ctx.plugin(SolKit, {
    ...DEFAULT_CONFIG,
    providerPattern: 'mock',
    modelPatterns: ['gpt-5.6-sol'],
  })
  ctx.tools.register(defineContentToolFixture({
    name: 'bash',
    description: 'test write tool',
    parameters: {},
    execute: async () => [{ type: 'text', text: 'ok' }],
  }))
  ctx.tools.register(defineContentToolFixture({
    name: 'read',
    description: 'test read tool',
    parameters: {},
    execute: async () => [{ type: 'text', text: 'ok' }],
  }))
  return ctx
}

void test('real AgentLoop composition persists and restores Sol workflow state', async () => {
  const first = await mount()
  const firstHandle = await first.agents.create({
    sessionId: SessionId('sol-composition-1'),
    agentOptions: { provider: 'mock', model: 'gpt-5.6-sol' },
  })
  const firstAgent = firstHandle.agent
  const command = await first.commands.execute(firstAgent, '/sol mode coding', new AbortController().signal)
  assert.equal(command?.result.kind, 'success')
  await new Promise<void>(resolve => queueMicrotask(resolve))
  const stateEvent = [...firstAgent.session.events].reverse().find(event => event.type === 'gpt56-sol/state')
  assert.ok(stateEvent)
  assert.equal(stateEvent.data.mode, 'coding')
  assert.equal(stateEvent.data.workflow.profile.scope, 'modify')
  const seed = firstAgent.session.events
  await first.fiber.dispose()

  const second = await mount()
  const secondHandle = await second.agents.create({
    sessionId: SessionId('sol-composition-2'),
    seed,
    agentOptions: { provider: 'mock', model: 'gpt-5.6-sol' },
  })
  const restored = [...secondHandle.agent.session.events].reverse().find(event => event.type === 'gpt56-sol/state')
  assert.ok(restored)
  assert.equal(restored.data.mode, 'coding')
  assert.equal(restored.data.workflow.profile.scope, 'modify')
  const status = await second.commands.execute(secondHandle.agent, '/sol status', new AbortController().signal)
  assert.equal(status?.result.kind, 'success')
  assert.match(status?.result.text ?? '', /Mode: coding/)
  assert.equal(second.tools.schemas(secondHandle.agent).some(tool => tool.name === 'bash'), true)
  await second.fiber.dispose()
})
