import { test } from '@playwright/test'

/** Loaded only when Playwright config has no E2E auth credentials. */
test.skip('Set E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD in web/.env to run browser E2E', () => {})
