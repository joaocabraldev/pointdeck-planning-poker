import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
  });

  test('should redirect unauthenticated user to signup page', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveURL(`${BASE_URL}/signup`);
  });

  test('should show signup form with name input', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);

    await expect(page.getByRole('heading', { name: /Join Poker Planning/i })).toBeVisible();
    await expect(page.getByPlaceholder('Enter your name')).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue/i })).toBeVisible();
  });

  test('should disable submit button when name is empty', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);

    const submitButton = page.getByRole('button', { name: /Continue/i });
    await expect(submitButton).toBeDisabled();
  });

  test('should enable submit button when name is entered', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);

    await page.getByPlaceholder('Enter your name').fill('John Doe');
    const submitButton = page.getByRole('button', { name: /Continue/i });
    await expect(submitButton).toBeEnabled();
  });

  test('should successfully sign up and redirect to home', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);

    await page.getByPlaceholder('Enter your name').fill('John Doe');
    await page.getByRole('button', { name: /Continue/i }).click();

    // Wait for redirect to home page
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.getByText(/Welcome.*John Doe/i)).toBeVisible();
  });

  test('should persist session after page reload', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);

    await page.getByPlaceholder('Enter your name').fill('Jane Smith');
    await page.getByRole('button', { name: /Continue/i }).click();

    await expect(page).toHaveURL(BASE_URL + '/');

    // Reload the page
    await page.reload();

    // Should still be on home page, not redirected to signup
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.getByText(/Welcome.*Jane Smith/i)).toBeVisible();
  });

  test('should handle signup with whitespace-only name', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);

    await page.getByPlaceholder('Enter your name').fill('   ');
    const submitButton = page.getByRole('button', { name: /Continue/i });

    // Button should be disabled for whitespace-only input
    await expect(submitButton).toBeDisabled();
  });

  test('should successfully logout and redirect to signup', async ({ page }) => {
    // First sign up
    await page.goto(`${BASE_URL}/signup`);
    await page.getByPlaceholder('Enter your name').fill('Test User');
    await page.getByRole('button', { name: /Continue/i }).click();

    await expect(page).toHaveURL(BASE_URL + '/');

    // Then logout
    await page.getByRole('button', { name: /Logout/i }).click();

    // Should redirect to signup
    await expect(page).toHaveURL(`${BASE_URL}/signup`);
  });

  test('should clear session from localStorage on logout', async ({ page }) => {
    // Sign up
    await page.goto(`${BASE_URL}/signup`);
    await page.getByPlaceholder('Enter your name').fill('Test User');
    await page.getByRole('button', { name: /Continue/i }).click();

    // Verify session exists in localStorage
    const sessionBefore = await page.evaluate(() => localStorage.getItem('session'));
    expect(sessionBefore).not.toBeNull();

    // Logout
    await page.getByRole('button', { name: /Logout/i }).click();

    // Verify session is removed from localStorage
    const sessionAfter = await page.evaluate(() => localStorage.getItem('session'));
    expect(sessionAfter).toBeNull();
  });
});

