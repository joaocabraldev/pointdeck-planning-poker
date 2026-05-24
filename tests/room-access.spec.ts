import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Room Access and Authentication', () => {
  test('should redirect to signup when accessing room without authentication', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());

    // Try to access a room directly
    await page.goto(`${BASE_URL}/rooms/test-room-id-123`);

    // Should redirect to signup
    await expect(page).toHaveURL(`${BASE_URL}/signup`);
  });

  test('should redirect to intended room after signup', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());

    // Try to access a specific room
    const roomId = 'test-room-id-456';
    await page.goto(`${BASE_URL}/rooms/${roomId}`);

    // Should be on signup page
    await expect(page).toHaveURL(`${BASE_URL}/signup`);

    // Sign up
    await page.getByPlaceholder('Your name').fill('Test User');
    await page.getByRole('button', { name: /Continue/i }).click();

    // Should redirect to the intended room
    await expect(page).toHaveURL(`${BASE_URL}/rooms/${roomId}`);
  });

  test('should allow authenticated user to access room directly', async ({ page }) => {
    // First authenticate
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/signup`);
    await page.getByPlaceholder('Your name').fill('Authenticated User');
    await page.getByRole('button', { name: /Continue/i }).click();

    // Create a room to get a valid room ID
    await page.getByRole('button', { name: /Create New Room/i }).click();
    const roomUrl = page.url();
    const roomId = roomUrl.split('/rooms/')[1];

    // Navigate away
    await page.goto(BASE_URL + '/');

    // Access the room directly
    await page.goto(`${BASE_URL}/rooms/${roomId}`);

    // Should be on the room page, not redirected
    await expect(page).toHaveURL(`${BASE_URL}/rooms/${roomId}`);
    await expect(page.getByRole('heading', { name: /Planning Room/i })).toBeVisible();
  });

  test('should preserve authentication across page reloads in room', async ({ page }) => {
    // Authenticate and create room
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/signup`);
    await page.getByPlaceholder('Your name').fill('Reload Test User');
    await page.getByRole('button', { name: /Continue/i }).click();
    await page.getByRole('button', { name: /Create New Room/i }).click();

    const roomUrl = page.url();

    // Reload the page
    await page.reload();

    // Should still be on the room page
    await expect(page).toHaveURL(roomUrl);
    await expect(page.getByRole('heading', { name: /Planning Room/i })).toBeVisible();
  });
});

