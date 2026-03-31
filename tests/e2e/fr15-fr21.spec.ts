import { expect, test } from '@playwright/test'

import { clearAppState, createScenarioViaUI } from './helpers'

/**
 * Coverage for epics.md functional requirements FR15–FR21 (scenario library + shareable scenario access).
 * @see web/src/pages/HomePage.tsx, web/src/components/ScenarioLibrary.tsx, web/src/pages/ScenarioPage.tsx
 */
test.describe('FR15–FR21 scenario library and share URL', () => {
  test('FR15, FR16, FR17: library lists scenarios; cards show name and provocative tape line; card opens scenario', async ({
    page,
    context,
  }) => {
    await clearAppState(page, context)
    const id = Date.now().toString()
    const scenarioName = `E2E FR15 ${id}`
    await createScenarioViaUI(page, {
      scenarioName,
      firstTapeText: `seed tape ${id}`,
    })

    await page.getByRole('link', { name: 'Library' }).click()
    await expect(page.getByRole('heading', { name: 'Your scenarios' })).toBeVisible()
    await expect(page.getByRole('list', { name: 'Scenario library' })).toBeVisible()

    const card = page.getByRole('link').filter({ hasText: scenarioName })
    await expect(card).toBeVisible()
    await expect(card.getByText('1 tape on the board. Room for chaos.')).toBeVisible()

    await card.click()
    await expect(page.getByRole('heading', { level: 1, name: scenarioName })).toBeVisible()
    await expect(page).toHaveURL(/\/s\/[a-z0-9-]+/i)
  })

  test('FR18: start new scenario from library via New scenario', async ({ page, context }) => {
    await clearAppState(page, context)
    const id = Date.now().toString()
    await createScenarioViaUI(page, {
      scenarioName: `E2E FR18 seed ${id}`,
      firstTapeText: `seed ${id}`,
    })

    await page.getByRole('link', { name: 'Library' }).click()
    await expect(page.getByRole('heading', { name: 'Your scenarios' })).toBeVisible()

    await page.getByRole('button', { name: 'New scenario' }).click()
    await expect(page.getByRole('heading', { name: 'Warning Text' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Your scenarios' })).not.toBeVisible()
  })

  test('FR19: Share URL field shows unique /s/:slug link for the scenario', async ({ page, context }) => {
    await clearAppState(page, context)
    const id = Date.now().toString()
    const scenarioName = `E2E FR19 ${id}`
    const { slug } = await createScenarioViaUI(page, {
      scenarioName,
      firstTapeText: `share ${id}`,
    })

    const shareInput = page.getByLabel('Share URL')
    await expect(shareInput).toBeVisible()
    await expect(shareInput).toHaveValue(new RegExp(`/s/${slug}$`))
  })

  test('FR20, FR21: deep link to /s/:slug in a fresh session loads scenario; contributor can add a tape', async ({
    page,
    context,
    browser,
  }) => {
    await clearAppState(page, context)
    const id = Date.now().toString()
    const scenarioName = `E2E FR20 ${id}`
    const { slug } = await createScenarioViaUI(page, {
      scenarioName,
      firstTapeText: `initial ${id}`,
    })

    const guest = await browser.newContext()
    const guestPage = await guest.newPage()
    await guestPage.goto(`/s/${slug}`)

    await expect(guestPage.getByRole('heading', { level: 1, name: scenarioName })).toBeVisible()

    const added = `guest tape ${id}`
    await guestPage.getByRole('button', { name: 'Add tape' }).click()
    await guestPage.getByLabel('New tape text').fill(added)
    await guestPage.getByRole('button', { name: 'Add tape' }).click()

    await expect(
      guestPage.getByRole('img', { name: new RegExp(added.toUpperCase()) }),
    ).toBeVisible()
    await expect(guestPage.locator('[aria-label="Tape stack"] > li')).toHaveCount(2)

    await guest.close()
  })
})
