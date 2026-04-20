import path from 'node:path'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'
import { defineConfig, devices } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, 'web', '.env') })
dotenv.config({ path: path.join(__dirname, '.env') })

/** Fixed port so Vite does not hop to 5174+ while Playwright waits on a stale URL. */
const E2E_PORT = 5199

const authFile = path.join(__dirname, 'tests', 'e2e', '.auth', 'user.json')

const hasE2EAuth = Boolean(
  process.env.VITE_SUPABASE_URL?.trim() &&
    process.env.VITE_SUPABASE_ANON_KEY?.trim() &&
    process.env.E2E_LOGIN_EMAIL?.trim() &&
    process.env.E2E_LOGIN_PASSWORD?.trim(),
)

if (!hasE2EAuth) {
  console.warn(
    '[playwright] E2E_LOGIN_EMAIL / E2E_LOGIN_PASSWORD not set with Supabase vars — browser E2E specs are skipped. Add them to web/.env (see web/.env.example).',
  )
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    trace: 'on-first-retry',
  },
  projects: hasE2EAuth
    ? [
        { name: 'setup', testMatch: /auth\.setup\.ts$/ },
        {
          name: 'chromium',
          dependencies: ['setup'],
          testMatch: /.*\.spec\.ts$/,
          use: {
            ...devices['Desktop Chrome'],
            storageState: authFile,
          },
        },
      ]
    : [
        {
          name: 'chromium',
          testMatch: /e2e-needs-env\.placeholder\.ts$/,
          use: { ...devices['Desktop Chrome'] },
        },
      ],
  webServer: hasE2EAuth
    ? {
        command: `npx vite --port ${E2E_PORT} --strictPort`,
        cwd: './web',
        url: `http://localhost:${E2E_PORT}`,
        reuseExistingServer: !process.env.CI,
        stdout: 'pipe',
        stderr: 'pipe',
      }
    : undefined,
})
