import { expect, test } from '@playwright/test'

import { clearAppState, createScenarioViaUI } from './helpers'

/**
 * Home → create scenario (first tape) → open scenario from Library → add tape → both tapes visible in stack.
 */
test.describe('Scenario tape flow', () => {
  test('home → create scenario → open from library → add tape → listed', async ({ page, context }) => {
    await clearAppState(page, context)

    const id = Date.now().toString()
    const scenarioName = `E2E scenario ${id}`
    const firstTapeText = `alpha tape ${id}`
    const secondTapeText = `beta tape ${id}`

    await createScenarioViaUI(page, { scenarioName, firstTapeText })

    await expect(
      page.getByRole('img', { name: new RegExp(firstTapeText.toUpperCase()) }),
    ).toBeVisible()

    await page.getByRole('link', { name: 'Library' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Library' })).toBeVisible()
    await page.getByRole('tab', { name: /private/i }).click()
    await expect(page.getByRole('heading', { name: /^my scenarios$/i })).toBeVisible()

    await page.getByRole('link').filter({ hasText: scenarioName }).click()
    await expect(page.getByRole('heading', { level: 1, name: scenarioName })).toBeVisible()

    await page.getByRole('button', { name: 'Add tape' }).click()
    await page.getByLabel('New tape text').fill(secondTapeText)
    await page.getByRole('button', { name: 'Add tape' }).click()

    await expect(
      page.getByRole('img', { name: new RegExp(secondTapeText.toUpperCase()) }),
    ).toBeVisible()

    await expect(page.locator('[aria-label="Tape stack"] > li')).toHaveCount(2)
    await expect(page.getByText('2 tapes')).toBeVisible()
  })
})
