import { expect, test } from '@playwright/test'

// ci-diet S2.3 mutation (a): a deliberately failing api test must turn `gate` red. Scratch PR, closed after.
test('gate mutation (a): this fails on purpose', () => {
  expect(1).toBe(2)
})
