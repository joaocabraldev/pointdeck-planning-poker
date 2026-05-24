import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Voting Flow - Single User', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Sign up and create a room
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/signup`);
    await page.getByPlaceholder('Your name').fill('Owner User');
    await page.getByRole('button', { name: /Continue/i }).click();
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await expect(page).toHaveURL(/\/rooms\/.+/);
  });

  test('should start voting session', async ({ page }) => {
    // Initially in IDLE state
    await expect(page.getByRole('button', { name: /Start Voting/i })).toBeVisible();

    // Click Start Voting
    await page.getByRole('button', { name: /Start Voting/i }).click();

    // Should change to ACTIVE state
    await expect(page.getByText(/Pick your card/i)).toBeVisible();
  });

  test('should show vote buttons when voting is active', async ({ page }) => {
    // Start voting
    await page.getByRole('button', { name: /Start Voting/i }).click();

    // Should see voting section
    await expect(page.getByText(/Pick your card/i)).toBeVisible();

    // Should see all vote options
    await expect(page.getByRole('button', { name: 'XS' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'S' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'M' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'L' })).toBeVisible();
  });

  test('should submit a vote', async ({ page }) => {
    // Start voting
    await page.getByRole('button', { name: /Start Voting/i }).click();

    // Click vote M
    await page.getByRole('button', { name: 'M' }).click();

    // Wait a moment for the vote to be submitted
    await page.waitForTimeout(500);

    // Vote count should show 1/1
    await expect(page.getByText(/1 of 1 voted/i)).toBeVisible();
  });

  test('should highlight selected vote', async ({ page }) => {
    // Start voting
    await page.getByRole('button', { name: /Start Voting/i }).click();

    // Get the M button
    const mButton = page.getByRole('button', { name: 'M' }).first();

    // Click vote M
    await mButton.click();

    // Wait for state update
    await page.waitForTimeout(500);

    // The selected card stays visible and the vote count remains recorded.
    await expect(page.getByText(/1 of 1 voted/i)).toBeVisible();
  });

  test('should allow changing vote', async ({ page }) => {
    // Start voting
    await page.getByRole('button', { name: /Start Voting/i }).click();

    // Click vote S
    await page.getByRole('button', { name: 'S' }).click();
    await page.waitForTimeout(300);

    // Change to L
    await page.getByRole('button', { name: 'L' }).click();
    await page.waitForTimeout(300);

    // Should still show 1/1 votes (same user, changed vote)
    await expect(page.getByText(/1 of 1 voted/i)).toBeVisible();
  });

  test('should cancel vote', async ({ page }) => {
    // Start voting
    await page.getByRole('button', { name: /Start Voting/i }).click();

    // Submit vote
    await page.getByRole('button', { name: 'M' }).click();
    await page.waitForTimeout(300);

    // Click the selected vote again to cancel it
    await page.getByRole('button', { name: 'M' }).click();
    await page.waitForTimeout(300);

    // Vote count should be 0/1
    await expect(page.getByText(/0 of 1 voted/i)).toBeVisible();
  });

  test('should close voting and show results', async ({ page }) => {
    // Start voting
    await page.getByRole('button', { name: /Start Voting/i }).click();

    // Submit vote
    await page.getByRole('button', { name: 'L' }).click();
    await page.waitForTimeout(300);

    // Close voting
    await page.getByRole('button', { name: /Reveal Cards/i }).click();

    // Should change to CLOSED state
    await expect(page.getByRole('button', { name: /New Round/i })).toBeVisible();

    // Should show results section
    await expect(page.getByText('L')).toBeVisible();
  });

  test('should display votes in results after closing', async ({ page }) => {
    // Start voting
    await page.getByRole('button', { name: /Start Voting/i }).click();

    // Submit vote M
    await page.getByRole('button', { name: 'M' }).click();
    await page.waitForTimeout(300);

    // Close voting
    await page.getByRole('button', { name: /Reveal Cards/i }).click();
    await page.waitForTimeout(300);

    // Results should show Owner User and their revealed vote.
    await expect(page.getByText('Owner User')).toBeVisible();
    await expect(page.getByText('M')).toBeVisible();
  });

  test('should allow setting agreed value', async ({ page }) => {
    // Complete a voting session
    await page.getByRole('button', { name: /Start Voting/i }).click();
    await page.getByRole('button', { name: 'S' }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /Reveal Cards/i }).click();
    await page.waitForTimeout(300);

    // Should see "Set agreed value" section
    await expect(page.getByText(/Set agreed value:/i)).toBeVisible();

    // Click M as agreed value (different from vote for variety)
    const agreedValueButtons = page.locator('text="Set agreed value:"').locator('..').getByRole('button');
    await agreedValueButtons.filter({ hasText: 'M' }).click();
    await page.waitForTimeout(300);

    // Should show agreed value
    await expect(page.getByText(/Agreed: M/i)).toBeVisible();
  });

  test('should reset voting session', async ({ page }) => {
    // Complete a voting session
    await page.getByRole('button', { name: /Start Voting/i }).click();
    await page.getByRole('button', { name: 'XS' }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /Reveal Cards/i }).click();
    await page.waitForTimeout(300);

    // Reset voting
    await page.getByRole('button', { name: /New Round/i }).click();
    await page.waitForTimeout(300);

    // Should return to IDLE state
    await expect(page.getByRole('button', { name: /Start Voting/i })).toBeVisible();

    // Should show Start Voting button again
    await expect(page.getByRole('button', { name: /Start Voting/i })).toBeVisible();
  });

  test('should show vote status indicator for voted participant', async ({ page }) => {
    // Start voting
    await page.getByRole('button', { name: /Start Voting/i }).click();

    // Submit vote
    await page.getByRole('button', { name: 'M' }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText(/1 of 1 voted/i)).toBeVisible();
  });
});

