import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@supabase/supabase-js'
import { expect, test as setup } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const authDir = path.join(__dirname, '.auth')
const authFile = path.join(authDir, 'user.json')

/**
 * Writes Playwright storage state with a Supabase session (password grant).
 * Enable the Email provider’s password option in Supabase and create a dedicated test user.
 * Vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, E2E_LOGIN_EMAIL, E2E_LOGIN_PASSWORD (e.g. web/.env)
 */
setup('authenticate', async ({ page, context }) => {
  const url = process.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, '')
  const anon = process.env.VITE_SUPABASE_ANON_KEY?.trim()
  const email = process.env.E2E_LOGIN_EMAIL?.trim()
  const password = process.env.E2E_LOGIN_PASSWORD?.trim()

  if (!url || !anon || !email || !password) {
    throw new Error(
      'E2E auth: set VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, E2E_LOGIN_EMAIL, E2E_LOGIN_PASSWORD (recommended: web/.env, loaded by playwright.config).',
    )
  }

  const sb = createClient(url, anon)
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  expect(error, error?.message ?? 'signInWithPassword').toBeNull()
  expect(data.session, 'session after password sign-in').toBeTruthy()

  const session = JSON.parse(JSON.stringify(data.session)) as NonNullable<typeof data.session>
  const projectRef = new URL(url).hostname.split('.')[0]
  const storageKey = `sb-${projectRef}-auth-token`

  await page.goto('/create')
  await page.evaluate(
    ({ key, sess }) => {
      localStorage.setItem(key, JSON.stringify(sess))
    },
    { key: storageKey, sess: session },
  )
  await page.reload({ waitUntil: 'networkidle' })
  await expect(page.getByRole('button', { name: /issue a warning/i })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()

  await mkdir(authDir, { recursive: true })
  await context.storageState({ path: authFile })
})
