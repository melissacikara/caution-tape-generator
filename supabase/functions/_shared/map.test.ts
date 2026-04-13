import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts'
import { mapScenario, mapTape } from './map.ts'

Deno.test('mapScenario: maps all fields including isPublic', () => {
  const result = mapScenario({
    id: 'test-id',
    name: 'Test Scenario',
    public_slug: 'test-slug',
    owner_id: 'owner-uuid',
    is_public: false,
    created_at: '2026-04-12T00:00:00Z',
    updated_at: '2026-04-12T01:00:00Z',
  })
  assertEquals(result.id, 'test-id')
  assertEquals(result.name, 'Test Scenario')
  assertEquals(result.publicSlug, 'test-slug')
  assertEquals(result.ownerId, 'owner-uuid')
  assertEquals(result.isPublic, false)
  assertEquals(result.createdAt, '2026-04-12T00:00:00Z')
  assertEquals(result.updatedAt, '2026-04-12T01:00:00Z')
})

Deno.test('mapScenario: isPublic true is mapped correctly', () => {
  const result = mapScenario({
    id: 'test-id',
    name: 'Test',
    public_slug: 'slug',
    is_public: true,
    created_at: '2026-04-12T00:00:00Z',
  })
  assertEquals(result.isPublic, true)
})

Deno.test('mapScenario: optional fields are undefined when absent', () => {
  const result = mapScenario({
    id: 'test-id',
    name: 'Test',
    public_slug: 'slug',
    is_public: false,
    created_at: '2026-04-12T00:00:00Z',
  })
  assertEquals(result.ownerId, undefined)
  assertEquals(result.updatedAt, undefined)
})

Deno.test('mapTape: maps all fields including authorId', () => {
  const result = mapTape({
    id: 'tape-id',
    scenario_id: 'scenario-id',
    tape_text: 'hello world',
    color: '#ff0000',
    author_id: 'author-uuid',
    created_at: '2026-04-12T00:00:00Z',
    updated_at: '2026-04-12T02:00:00Z',
  })
  assertEquals(result.id, 'tape-id')
  assertEquals(result.scenarioId, 'scenario-id')
  assertEquals(result.tapeText, 'hello world')
  assertEquals(result.color, '#ff0000')
  assertEquals(result.authorId, 'author-uuid')
  assertEquals(result.updatedAt, '2026-04-12T02:00:00Z')
})

Deno.test('mapTape: optional authorId is undefined when absent', () => {
  const result = mapTape({
    id: 'tape-id',
    scenario_id: 'scenario-id',
    tape_text: 'hello',
    color: '#fff',
    created_at: '2026-04-12T00:00:00Z',
  })
  assertEquals(result.authorId, undefined)
})
