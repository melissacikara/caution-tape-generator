import type { BrowserContext, Page } from '@playwright/test'

export async function clearAppState(page: Page, context: BrowserContext): Promise<void> {
  await context.clearCookies()
  await page.addInitScript(() => {
    localStorage.clear()
  })
}

/**
 * Home flow: lock tape → create scenario → lands on `/s/:slug`.
 */
export async function createScenarioViaUI(
  page: Page,
  opts: { scenarioName: string; firstTapeText: string },
): Promise<{ slug: string }> {
  await page.goto('/')
  await page.getByLabel('Caution tape warning text').fill(opts.firstTapeText)
  await page.getByRole('button', { name: 'Generate' }).click()
  await page.getByLabel('Scenario name').fill(opts.scenarioName)
  await page.getByRole('button', { name: 'Create scenario & open' }).click()
  await page.waitForURL(/\/s\/[a-z0-9-]+/i)
  const m = page.url().match(/\/s\/([^/?#]+)/i)
  const slug = m?.[1] ?? ''
  if (!slug) throw new Error('Expected /s/:slug after create')
  return { slug }
}
