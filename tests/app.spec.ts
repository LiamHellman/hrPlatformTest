import { test, expect, type Page } from '@playwright/test'

async function navigate(page: Page, view: string) {
  const toggle = page.getByRole('button', {
    name: 'Open navigation',
    exact: true,
  })
  if (await toggle.isVisible()) await toggle.click()
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('button', { name: view })
    .click()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('directory searches, filters, paginates, and changes layout', async ({
  page,
}) => {
  await expect(
    page.getByRole('heading', { name: 'Your people, together.' }),
  ).toBeVisible()
  await expect(page.locator('tbody tr')).toHaveCount(8)
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.locator('tbody tr')).toHaveCount(4)
  await expect(
    page.getByRole('button', {
      name: 'Kate Morrison kate.morrison@people.example',
    }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Previous', exact: true }).click()
  await page.getByRole('searchbox', { name: 'Search people' }).fill('Toronto')
  await expect(page.locator('tbody tr')).toHaveCount(4)
  await page
    .getByRole('combobox', { name: 'Filter by department' })
    .selectOption('People')
  await expect(page.locator('tbody tr')).toHaveCount(2)
  await page
    .getByRole('button', { name: 'Onboarding', exact: false })
    .filter({ hasText: 'Onboarding' })
    .click()
  await expect(page.locator('tbody tr')).toHaveCount(1)
  await page.getByRole('button', { name: 'Grid view', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Sienna Hewitt' }),
  ).toBeVisible()
  await page
    .getByRole('searchbox', { name: 'Search people' })
    .fill('nobody-matches-this')
  await expect(
    page.getByRole('heading', { name: 'No people found' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page.locator('.person-card')).toHaveCount(8)
})

test('adds and edits a person, rejects duplicate emails, and persists after reload', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Add person', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Full name').fill('Taylor Chen')
  await dialog.getByLabel('Work email').fill('olivia.rhye@people.example')
  await dialog.getByLabel('Job title').fill('Product Designer')
  await dialog.getByLabel('Location', { exact: true }).fill('Toronto, CA')
  await dialog.getByRole('button', { name: 'Add person', exact: true }).click()
  await expect(dialog.getByRole('alert')).toHaveText(
    'A person with this email address already exists.',
  )
  await dialog.getByLabel('Work email').fill('taylor@company.example')
  await dialog.getByRole('button', { name: 'Add person', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  await page.getByRole('searchbox').fill('Taylor Chen')
  await page
    .getByRole('button', { name: 'Taylor Chen taylor@company.example' })
    .click()
  await page.getByRole('button', { name: 'Edit profile' }).click()
  await page
    .getByRole('dialog')
    .getByLabel('Job title')
    .fill('Lead Product Designer')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await page.reload()
  await page.getByRole('searchbox').fill('Taylor Chen')
  await expect(
    page.getByText('Lead Product Designer', { exact: true }),
  ).toBeVisible()
  await expect(page.locator('.stat-value').first()).toHaveText('13')
})

test('removes a person and their associated requests only after confirmation', async ({
  page,
}) => {
  await page
    .getByRole('button', { name: 'View Olivia Rhye', exact: true })
    .click()
  await page.getByRole('button', { name: 'Remove person', exact: true }).click()
  await expect(
    page.getByText('Remove Olivia Rhye and their time-off requests?'),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Keep person', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Edit profile' })).toBeVisible()
  await page.getByRole('button', { name: 'Remove person', exact: true }).click()
  await page
    .getByRole('button', { name: 'Yes, remove person', exact: true })
    .click()
  await navigate(page, 'Time off')
  await expect(page.locator('tbody tr')).toHaveCount(2)
  await expect(page.getByText('Olivia Rhye', { exact: true })).toHaveCount(0)
  await page.reload()
  await page.getByRole('searchbox').fill('Olivia Rhye')
  await expect(
    page.getByRole('heading', { name: 'No people found' }),
  ).toBeVisible()
})

test('validates time-off dates and persists approval and decline decisions', async ({
  page,
}) => {
  await navigate(page, 'Time off')
  await page.getByRole('button', { name: 'Request time off' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Start date').fill('2027-02-10')
  await dialog.getByLabel('End date').fill('2027-02-09')
  await dialog.getByRole('button', { name: 'Submit request' }).click()
  await expect(dialog.getByRole('alert')).toHaveText(
    'End date must be on or after the start date.',
  )
  await dialog.getByLabel('End date').fill('2027-02-12')
  await dialog.getByRole('button', { name: 'Submit request' }).click()
  await expect(page.locator('tbody tr')).toHaveCount(4)
  await page
    .getByRole('button', { name: "Approve Olivia Rhye's request" })
    .first()
    .click()
  await page
    .getByRole('button', { name: "Decline Drew Cano's request" })
    .click()
  await page
    .getByRole('combobox', { name: 'Filter time-off requests' })
    .selectOption('Approved')
  await expect(page.locator('tbody tr')).toHaveCount(2)
  await page.reload()
  await navigate(page, 'Time off')
  await page
    .getByRole('combobox', { name: 'Filter time-off requests' })
    .selectOption('Declined')
  await expect(page.locator('tbody tr')).toHaveCount(1)
  await expect(page.getByText('Drew Cano', { exact: true })).toBeVisible()
})

test('overview reflects team data and opens the onboarding directory', async ({
  page,
}) => {
  await navigate(page, 'Overview')
  await expect(
    page.getByRole('heading', { name: 'Good things start with people.' }),
  ).toBeVisible()
  await expect(page.locator('.department-bars>div')).toHaveCount(5)
  await expect(page.locator('.review-number')).toHaveText('02')
  await page.getByRole('button', { name: 'Meet your new starters' }).click()
  await expect(page.locator('tbody tr')).toHaveCount(2)
  await expect(page.getByText('Andi Lane', { exact: true })).toBeVisible()
  await expect(page.getByText('Sienna Hewitt', { exact: true })).toBeVisible()
})

test('exports the filtered directory as CSV', async ({ page }) => {
  await page.getByRole('searchbox').fill('Olivia')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('people-directory.csv')
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  const csv = Buffer.concat(chunks).toString('utf8')
  expect(csv).toContain('Olivia Rhye')
  expect(csv).not.toContain('Phoenix Baker')
  expect(csv.trim().split('\r\n')).toHaveLength(2)
})

test('dialog supports Escape and the page fits the viewport', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Add person', exact: true }).click()
  await expect(page.getByLabel('Full name')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Add person', exact: true }),
  ).toBeFocused()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test('invalid stored data is handled without silently overwriting it', async ({
  page,
}) => {
  await page.evaluate(() =>
    localStorage.setItem('people-and-co.v1', '{invalid'),
  )
  await page.reload()
  await expect(page.getByRole('alert')).toContainText(
    'Saved data could not be loaded',
  )
  await expect(page.locator('tbody tr')).toHaveCount(8)
  expect(
    await page.evaluate(() => localStorage.getItem('people-and-co.v1')),
  ).toBe('{invalid')
})

test('application has no browser errors and captures the interface', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
  await expect(
    page.getByRole('heading', { name: 'Your people, together.' }),
  ).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('directory.png'),
    fullPage: true,
  })
  expect(errors).toEqual([])
})
