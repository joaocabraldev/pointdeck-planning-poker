import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Room Creation and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and sign up
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/signup`);
    await page.getByPlaceholder('Enter your name').fill('Room Creator');
    await page.getByRole('button', { name: /Continue/i }).click();
    await expect(page).toHaveURL(BASE_URL + '/');
  });

  test('should show welcome page with create room button', async ({ page }) => {
    await expect(page.getByText(/Welcome.*Room Creator/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Create New Room/i })).toBeVisible();
  });

  test('should create a new room and navigate to it', async ({ page }) => {
    await page.getByRole('button', { name: /Create New Room/i }).click();

    // Should navigate to a room URL
    await expect(page).toHaveURL(/\/rooms\/.+/);

    // Should see room content
    await expect(page.getByText(/Poker Planning Room/i)).toBeVisible();
  });

  test('should show creator as room owner', async ({ page }) => {
    await page.getByRole('button', { name: /Create New Room/i }).click();

    await expect(page).toHaveURL(/\/rooms\/.+/);

    // Look for the participants section
    await expect(page.getByText(/Participants/i)).toBeVisible();

    // Creator should be in the participants list with "You" indicator
    await expect(page.getByText(/Room Creator.*\(You\)/i)).toBeVisible();

    // Owner should have crown emoji
    await expect(page.getByText(/👑/)).toBeVisible();
  });

  test('should show owner controls in created room', async ({ page }) => {
    await page.getByRole('button', { name: /Create New Room/i }).click();

    await expect(page).toHaveURL(/\/rooms\/.+/);

    // Owner should see "Owner Controls" heading
    await expect(page.getByText(/Owner Controls/i)).toBeVisible();

    // Should see Start Voting button (in IDLE state)
    await expect(page.getByRole('button', { name: /Start Voting/i })).toBeVisible();
  });

  test('should have share room button', async ({ page }) => {
    await page.getByRole('button', { name: /Create New Room/i }).click();

    await expect(page).toHaveURL(/\/rooms\/.+/);

    await expect(page.getByRole('button', { name: /Share Room/i })).toBeVisible();
  });

  test('should have home navigation button', async ({ page }) => {
    await page.getByRole('button', { name: /Create New Room/i }).click();

    await expect(page).toHaveURL(/\/rooms\/.+/);

    const homeButton = page.getByRole('button', { name: /Home/i });
    await expect(homeButton).toBeVisible();

    // Click home button
    await homeButton.click();

    // Should navigate back to home
    await expect(page).toHaveURL(BASE_URL + '/');
  });

  test('should show voting status as IDLE initially', async ({ page }) => {
    await page.getByRole('button', { name: /Create New Room/i }).click();

    await expect(page).toHaveURL(/\/rooms\/.+/);

    await expect(page.getByText(/Voting Status.*IDLE/i)).toBeVisible();
  });

  test('should show room metadata', async ({ page }) => {
    await page.getByRole('button', { name: /Create New Room/i }).click();

    await expect(page).toHaveURL(/\/rooms\/.+/);

    // Should show created by information
    await expect(page.getByText(/Created by Room Creator/i)).toBeVisible();

    // Should show Room ID
    await expect(page.getByText(/Room ID:/i)).toBeVisible();
  });

  test('should handle multiple room creations', async ({ page }) => {
    // Create first room
    await page.getByRole('button', { name: /Create New Room/i }).click();
    const firstRoomUrl = page.url();

    // Go back home
    await page.getByRole('button', { name: /Home/i }).click();

    // Create second room
    await page.getByRole('button', { name: /Create New Room/i }).click();
    const secondRoomUrl = page.url();

    // URLs should be different
    expect(firstRoomUrl).not.toBe(secondRoomUrl);
  });
});

