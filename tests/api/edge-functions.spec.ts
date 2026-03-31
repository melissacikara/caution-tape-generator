import { randomUUID } from 'node:crypto'
import { describe, expect, test } from 'vitest'

import {
  authHeaders,
  fnUrl,
  getSupabaseEnv,
  readJson,
  type ApiErrorBody,
} from './helpers'

const { url, anon, configured } = getSupabaseEnv()

describe.skipIf(!configured)(
  'Supabase Edge Functions — scenarios / tapes (integration)',
  () => {
    const base = url

    test('create-scenario → get-scenario-by-slug → list-scenarios → add-tape → update-tape → delete-tape', async () => {
      const stamp = `${Date.now()}-${randomUUID().slice(0, 8)}`
      const scenarioName = `API test ${stamp}`

      const createRes = await fetch(fnUrl(base, 'create-scenario'), {
        method: 'POST',
        headers: authHeaders(anon),
        body: JSON.stringify({
          name: scenarioName,
          firstTape: { tapeText: `first ${stamp}`, color: '#FFD000' },
        }),
      })
      expect(createRes.status).toBe(200)
      const created = await readJson<{
        scenario: { id: string; name: string; publicSlug: string; createdAt: string }
        tapes: { id: string; scenarioId: string; tapeText: string; color: string; createdAt: string }[]
      }>(createRes)
      expect(created.scenario.name).toBe(scenarioName)
      expect(created.tapes).toHaveLength(1)
      const slug = created.scenario.publicSlug

      const getRes = await fetch(
        `${fnUrl(base, 'get-scenario-by-slug')}?slug=${encodeURIComponent(slug)}`,
        { method: 'GET', headers: authHeaders(anon, false) },
      )
      expect(getRes.status).toBe(200)
      const got = await readJson<typeof created>(getRes)
      expect(got.scenario.publicSlug).toBe(slug)
      expect(got.tapes).toHaveLength(1)

      const listRes = await fetch(fnUrl(base, 'list-scenarios'), {
        method: 'POST',
        headers: authHeaders(anon),
        body: JSON.stringify({ slugs: [slug] }),
      })
      expect(listRes.status).toBe(200)
      const listed = await readJson<{
        scenarios: { scenario: { publicSlug: string }; tapeCount: number }[]
      }>(listRes)
      expect(listed.scenarios.length).toBeGreaterThanOrEqual(1)
      const row = listed.scenarios.find((s) => s.scenario.publicSlug === slug)
      expect(row?.tapeCount).toBe(1)

      const idem = randomUUID()
      const addRes = await fetch(fnUrl(base, 'add-tape'), {
        method: 'POST',
        headers: authHeaders(anon),
        body: JSON.stringify({
          scenarioSlug: slug,
          tapeText: `second ${stamp}`,
          color: '#00FF00',
          idempotencyKey: idem,
        }),
      })
      expect(addRes.status).toBe(200)
      const added = await readJson<{
        tape: { id: string; tapeText: string }
        idempotent: boolean
      }>(addRes)
      expect(added.idempotent).toBe(false)
      const secondTapeId = added.tape.id

      const addAgain = await fetch(fnUrl(base, 'add-tape'), {
        method: 'POST',
        headers: authHeaders(anon),
        body: JSON.stringify({
          scenarioSlug: slug,
          tapeText: `second ${stamp}`,
          color: '#00FF00',
          idempotencyKey: idem,
        }),
      })
      expect(addAgain.status).toBe(200)
      const again = await readJson<{ tape: { id: string }; idempotent: boolean }>(addAgain)
      expect(again.idempotent).toBe(true)
      expect(again.tape.id).toBe(secondTapeId)

      const afterAdd = await fetch(
        `${fnUrl(base, 'get-scenario-by-slug')}?slug=${encodeURIComponent(slug)}`,
        { method: 'GET', headers: authHeaders(anon, false) },
      )
      const afterData = await readJson<typeof created>(afterAdd)
      expect(afterData.tapes).toHaveLength(2)

      const updRes = await fetch(fnUrl(base, 'update-tape'), {
        method: 'POST',
        headers: authHeaders(anon),
        body: JSON.stringify({
          scenarioSlug: slug,
          tapeId: secondTapeId,
          tapeText: `updated ${stamp}`,
          color: '#0000FF',
        }),
      })
      expect(updRes.status).toBe(200)
      const updated = await readJson<{ tape: { tapeText: string } }>(updRes)
      expect(updated.tape.tapeText).toBe(`updated ${stamp}`)

      const delRes = await fetch(fnUrl(base, 'delete-tape'), {
        method: 'POST',
        headers: authHeaders(anon),
        body: JSON.stringify({
          scenarioSlug: slug,
          tapeId: secondTapeId,
        }),
      })
      expect(delRes.status).toBe(200)
      const delBody = await readJson<{ ok: boolean }>(delRes)
      expect(delBody.ok).toBe(true)

      const finalGet = await fetch(
        `${fnUrl(base, 'get-scenario-by-slug')}?slug=${encodeURIComponent(slug)}`,
        { method: 'GET', headers: authHeaders(anon, false) },
      )
      const finalData = await readJson<typeof created>(finalGet)
      expect(finalData.tapes).toHaveLength(1)
    })

    test('create-scenario: 400 when name is empty', async () => {
      const res = await fetch(fnUrl(base, 'create-scenario'), {
        method: 'POST',
        headers: authHeaders(anon),
        body: JSON.stringify({ name: '' }),
      })
      expect(res.status).toBe(400)
      const body = await readJson<ApiErrorBody>(res)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    test('get-scenario-by-slug: 400 without slug query', async () => {
      const res = await fetch(fnUrl(base, 'get-scenario-by-slug'), {
        method: 'GET',
        headers: authHeaders(anon, false),
      })
      expect(res.status).toBe(400)
      const body = await readJson<ApiErrorBody>(res)
      expect(body.error.code).toBe('BAD_REQUEST')
    })

    test('get-scenario-by-slug: 404 for unknown slug', async () => {
      const res = await fetch(
        `${fnUrl(base, 'get-scenario-by-slug')}?slug=${encodeURIComponent(`no-such-${randomUUID()}`)}`,
        { method: 'GET', headers: authHeaders(anon, false) },
      )
      expect(res.status).toBe(404)
      const body = await readJson<ApiErrorBody>(res)
      expect(body.error.code).toBe('NOT_FOUND')
    })

    test('add-tape: 404 when scenario does not exist', async () => {
      const res = await fetch(fnUrl(base, 'add-tape'), {
        method: 'POST',
        headers: authHeaders(anon),
        body: JSON.stringify({
          scenarioSlug: `missing-${randomUUID()}`,
          tapeText: 'x',
          color: '#FFD000',
        }),
      })
      expect(res.status).toBe(404)
      const body = await readJson<ApiErrorBody>(res)
      expect(body.error.code).toBe('NOT_FOUND')
    })

    test('list-scenarios: empty slugs returns empty list', async () => {
      const res = await fetch(fnUrl(base, 'list-scenarios'), {
        method: 'POST',
        headers: authHeaders(anon),
        body: JSON.stringify({ slugs: [] }),
      })
      expect(res.status).toBe(200)
      const body = await readJson<{ scenarios: unknown[] }>(res)
      expect(body.scenarios).toEqual([])
    })

    test('update-tape: 400 when tapeId is not a UUID', async () => {
      const res = await fetch(fnUrl(base, 'update-tape'), {
        method: 'POST',
        headers: authHeaders(anon),
        body: JSON.stringify({
          scenarioSlug: 'any-slug',
          tapeId: 'not-a-uuid',
          tapeText: 't',
          color: '#FFD000',
        }),
      })
      expect(res.status).toBe(400)
      const body = await readJson<ApiErrorBody>(res)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    test('delete-tape: 400 when tapeId is not a UUID', async () => {
      const res = await fetch(fnUrl(base, 'delete-tape'), {
        method: 'POST',
        headers: authHeaders(anon),
        body: JSON.stringify({
          scenarioSlug: 'any-slug',
          tapeId: 'not-a-uuid',
        }),
      })
      expect(res.status).toBe(400)
      const body = await readJson<ApiErrorBody>(res)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })
  },
)

describe('Supabase Edge Functions — configuration', () => {
  test('integration suite is skipped unless web/.env has Supabase URL and anon key', () => {
    if (configured) {
      expect(url).toMatch(/^https?:\/\//)
      expect(anon.length).toBeGreaterThan(10)
    } else {
      expect(getSupabaseEnv().configured).toBe(false)
    }
  })
})
