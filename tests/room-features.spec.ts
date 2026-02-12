import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Share Room Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Sign up and create a room
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/signup`);
    await page.getByPlaceholder('Enter your name').fill('Room Owner');
    await page.getByRole('button', { name: /Continue/i }).click();
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await expect(page).toHaveURL(/\/rooms\/.+/);
  });

  test('should have share button in room', async ({ page }) => {
    await expect(page.getByRole('button', { name: /📋 Share Room/i })).toBeVisible();
  });

  test('should show success message when sharing room', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Click share button
    await page.getByRole('button', { name: /📋 Share Room/i }).click();

    // Should show success message
    await expect(page.getByText(/Room link copied to clipboard/i)).toBeVisible();
  });

  test('should copy room URL to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const roomUrl = page.url();

    // Click share button
    await page.getByRole('button', { name: /📋 Share Room/i }).click();

    // Wait for clipboard operation
    await page.waitForTimeout(500);

    // Read clipboard content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

    // Should match the room URL
    expect(clipboardText).toBe(roomUrl);
  });

  test('should hide success message after 3 seconds', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Click share button
    await page.getByRole('button', { name: /📋 Share Room/i }).click();

    // Message should be visible initially
    const successMessage = page.getByText(/Room link copied to clipboard/i);
    await expect(successMessage).toBeVisible();

    // Wait for 3.5 seconds (message timeout is 3s)
    await page.waitForTimeout(3500);

    // Message should be hidden
    await expect(successMessage).not.toBeVisible();
  });
});

test.describe('Participant Management', () => {
  test('owner should see remove button for other participants', async ({ browser }) => {
    // Setup owner
    const owner = await browser.newContext();
    const ownerPage = await owner.newPage();
    await ownerPage.goto(BASE_URL);
    await ownerPage.evaluate(() => localStorage.clear());
    await ownerPage.goto(`${BASE_URL}/signup`);
    await ownerPage.getByPlaceholder('Enter your name').fill('Owner');
    await ownerPage.getByRole('button', { name: /Continue/i }).click();
    await ownerPage.getByRole('button', { name: /Create New Room/i }).click();
    const roomUrl = ownerPage.url();

    // Setup participant
    const participant = await browser.newContext();
    const participantPage = await participant.newPage();
    await participantPage.goto(BASE_URL);
    await participantPage.evaluate(() => localStorage.clear());
    await participantPage.goto(`${BASE_URL}/signup`);
    await participantPage.getByPlaceholder('Enter your name').fill('Participant');
    await participantPage.getByRole('button', { name: /Continue/i }).click();
    await participantPage.goto(roomUrl);
    await participantPage.waitForTimeout(1000);

    // Owner should see remove button next to participant
    const participantCard = ownerPage.getByText('Participant').locator('..');
    await expect(participantCard.getByRole('button', { name: /Remove/i })).toBeVisible();

    // Owner should NOT see remove button next to themselves
    const ownerCard = ownerPage.getByText(/Owner.*\(You\)/i).locator('..');
    await expect(ownerCard.getByRole('button', { name: /Remove/i })).not.toBeVisible();

    await owner.close();
    await participant.close();
  });

  test('participant should NOT see remove buttons', async ({ browser }) => {
    // Setup owner
    const owner = await browser.newContext();
    const ownerPage = await owner.newPage();
    await ownerPage.goto(BASE_URL);
    await ownerPage.evaluate(() => localStorage.clear());
    await ownerPage.goto(`${BASE_URL}/signup`);
    await ownerPage.getByPlaceholder('Enter your name').fill('Owner');
    await ownerPage.getByRole('button', { name: /Continue/i }).click();
    await ownerPage.getByRole('button', { name: /Create New Room/i }).click();
    const roomUrl = ownerPage.url();

    // Setup participant
    const participant = await browser.newContext();
    const participantPage = await participant.newPage();
    await participantPage.goto(BASE_URL);
    await participantPage.evaluate(() => localStorage.clear());
    await participantPage.goto(`${BASE_URL}/signup`);
    await participantPage.getByPlaceholder('Enter your name').fill('Participant');
    await participantPage.getByRole('button', { name: /Continue/i }).click();
    await participantPage.goto(roomUrl);
    await participantPage.waitForTimeout(1000);

    // Participant should NOT see any remove buttons
    await expect(participantPage.getByRole('button', { name: /Remove/i })).not.toBeVisible();

    await owner.close();
    await participant.close();
  });

  test('should remove participant from room', async ({ browser }) => {
    // Setup owner
    const owner = await browser.newContext();
    const ownerPage = await owner.newPage();
    await ownerPage.goto(BASE_URL);
    await ownerPage.evaluate(() => localStorage.clear());
    await ownerPage.goto(`${BASE_URL}/signup`);
    await ownerPage.getByPlaceholder('Enter your name').fill('Owner');
    await ownerPage.getByRole('button', { name: /Continue/i }).click();
    await ownerPage.getByRole('button', { name: /Create New Room/i }).click();
    const roomUrl = ownerPage.url();

    // Setup participant
    const participant = await browser.newContext();
    const participantPage = await participant.newPage();
    await participantPage.goto(BASE_URL);
    await participantPage.evaluate(() => localStorage.clear());
    await participantPage.goto(`${BASE_URL}/signup`);
    await participantPage.getByPlaceholder('Enter your name').fill('ToBeRemoved');
    await participantPage.getByRole('button', { name: /Continue/i }).click();
    await participantPage.goto(roomUrl);
    await participantPage.waitForTimeout(1000);

    // Both should see 2 participants
    await expect(ownerPage.getByText(/Participants.*2/i)).toBeVisible();

    // Owner removes participant
    const participantCard = ownerPage.getByText('ToBeRemoved').locator('..');
    await participantCard.getByRole('button', { name: /Remove/i }).click();
    await ownerPage.waitForTimeout(500);

    // Owner should now see 1 participant
    await expect(ownerPage.getByText(/Participants.*1/i)).toBeVisible();
    await expect(ownerPage.getByText('ToBeRemoved')).not.toBeVisible();

    await owner.close();
    await participant.close();
  });
});

test.describe('UI Elements and Indicators', () => {
  test('should show crown emoji for room owner', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/signup`);
    await page.getByPlaceholder('Enter your name').fill('Owner');
    await page.getByRole('button', { name: /Continue/i }).click();
    await page.getByRole('button', { name: /Create New Room/i }).click();

    // Should see crown emoji in participants list
    await expect(page.getByText(/👑/)).toBeVisible();
  });

  test('should highlight current user in participants list', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/signup`);
    await page.getByPlaceholder('Enter your name').fill('CurrentUser');
    await page.getByRole('button', { name: /Continue/i }).click();
    await page.getByRole('button', { name: /Create New Room/i }).click();

    // Should show "(You)" next to user's name
    await expect(page.getByText(/CurrentUser.*\(You\)/i)).toBeVisible();
  });

  test('should show vote duration when active', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/signup`);
    await page.getByPlaceholder('Enter your name').fill('User');
    await page.getByRole('button', { name: /Continue/i }).click();
    await page.getByRole('button', { name: /Create New Room/i }).click();

    // Start voting
    await page.getByRole('button', { name: /▶️ Start Voting/i }).click();
    await page.waitForTimeout(2000);

    // Should show duration in format mm:ss
    await expect(page.getByText(/Duration.*\d+:\d+/i)).toBeVisible();
  });

  test('should show room ID in header', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/signup`);
    await page.getByPlaceholder('Enter your name').fill('User');
    await page.getByRole('button', { name: /Continue/i }).click();
    await page.getByRole('button', { name: /Create New Room/i }).click();

    await expect(page.getByText(/Room ID:/i)).toBeVisible();
  });

  test('should show created by information', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/signup`);
    await page.getByPlaceholder('Enter your name').fill('Creator');
    await page.getByRole('button', { name: /Continue/i }).click();
    await page.getByRole('button', { name: /Create New Room/i }).click();

    await expect(page.getByText(/Created by Creator/i)).toBeVisible();
  });
});

