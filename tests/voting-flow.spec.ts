import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Voting Flow - Single User', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Sign up and create a room
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/signup`);
    await page.getByPlaceholder('Enter your name').fill('Owner User');
    await page.getByRole('button', { name: /Continue/i }).click();
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await expect(page).toHaveURL(/\/rooms\/.+/);
  });

  test('should start voting session', async ({ page }) => {
    // Initially in IDLE state
    await expect(page.getByText(/Voting Status.*IDLE/i)).toBeVisible();

    // Click Start Voting
    await page.getByRole('button', { name: /▶️ Start Voting/i }).click();

    // Should change to ACTIVE state
    await expect(page.getByText(/Voting Status.*ACTIVE/i)).toBeVisible();
  });

  test('should show vote buttons when voting is active', async ({ page }) => {
    // Start voting
    await page.getByRole('button', { name: /▶️ Start Voting/i }).click();

    // Should see voting section
    await expect(page.getByText(/Cast Your Vote/i)).toBeVisible();

    // Should see all vote options
    await expect(page.getByRole('button', { name: 'XS' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'S' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'M' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'L' })).toBeVisible();
  });

  test('should submit a vote', async ({ page }) => {
    // Start voting
    await page.getByRole('button', { name: /▶️ Start Voting/i }).click();

    // Click vote M
    await page.getByRole('button', { name: 'M' }).click();

    // Wait a moment for the vote to be submitted
    await page.waitForTimeout(500);

    // Vote count should show 1/1
    await expect(page.getByText(/Votes:.*1\/1/i)).toBeVisible();
  });

  test('should highlight selected vote', async ({ page }) => {
    // Start voting
    await page.getByRole('button', { name: /▶️ Start Voting/i }).click();

    // Get the M button
    const mButton = page.getByRole('button', { name: 'M' }).first();

    // Click vote M
    await mButton.click();

    // Wait for state update
    await page.waitForTimeout(500);

    // The button should have different styling (background color changes to #007bff)
    // We can check if "Cancel My Vote" button appears
    await expect(page.getByRole('button', { name: /Cancel My Vote/i })).toBeVisible();
  });

  test('should allow changing vote', async ({ page }) => {
    // Start voting
    await page.getByRole('button', { name: /▶️ Start Voting/i }).click();

    // Click vote S
    await page.getByRole('button', { name: 'S' }).click();
    await page.waitForTimeout(300);

    // Change to L
    await page.getByRole('button', { name: 'L' }).click();
    await page.waitForTimeout(300);

    // Should still show 1/1 votes (same user, changed vote)
    await expect(page.getByText(/Votes:.*1\/1/i)).toBeVisible();
  });

  test('should cancel vote', async ({ page }) => {
    // Start voting
    await page.getByRole('button', { name: /▶️ Start Voting/i }).click();

    // Submit vote
    await page.getByRole('button', { name: 'M' }).click();
    await page.waitForTimeout(300);

    // Cancel vote button should appear
    const cancelButton = page.getByRole('button', { name: /Cancel My Vote/i });
    await expect(cancelButton).toBeVisible();

    // Click cancel
    await cancelButton.click();
    await page.waitForTimeout(300);

    // Vote count should be 0/1
    await expect(page.getByText(/Votes:.*0\/1/i)).toBeVisible();
  });

  test('should close voting and show results', async ({ page }) => {
    // Start voting
    await page.getByRole('button', { name: /▶️ Start Voting/i }).click();

    // Submit vote
    await page.getByRole('button', { name: 'L' }).click();
    await page.waitForTimeout(300);

    // Close voting
    await page.getByRole('button', { name: /⏹️ Close Voting/i }).click();

    // Should change to CLOSED state
    await expect(page.getByText(/Voting Status.*CLOSED/i)).toBeVisible();

    // Should show results section
    await expect(page.getByText(/Voting Results/i)).toBeVisible();
  });

  test('should display votes in results after closing', async ({ page }) => {
    // Start voting
    await page.getByRole('button', { name: /▶️ Start Voting/i }).click();

    // Submit vote M
    await page.getByRole('button', { name: 'M' }).click();
    await page.waitForTimeout(300);

    // Close voting
    await page.getByRole('button', { name: /⏹️ Close Voting/i }).click();
    await page.waitForTimeout(300);

    // Should see the vote 'M' in results
    await expect(page.getByText(/Voting Results/i)).toBeVisible();

    // Results should show Owner User with vote M
    const resultsSection = page.locator('text="Voting Results"').locator('..');
    await expect(resultsSection.getByText('Owner User')).toBeVisible();
  });

  test('should allow setting agreed value', async ({ page }) => {
    // Complete a voting session
    await page.getByRole('button', { name: /▶️ Start Voting/i }).click();
    await page.getByRole('button', { name: 'S' }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /⏹️ Close Voting/i }).click();
    await page.waitForTimeout(300);

    // Should see "Set Agreed Value" section
    await expect(page.getByText(/Set Agreed Value/i)).toBeVisible();

    // Click M as agreed value (different from vote for variety)
    const agreedValueButtons = page.locator('text="Set Agreed Value"').locator('..').getByRole('button');
    await agreedValueButtons.filter({ hasText: 'M' }).click();
    await page.waitForTimeout(300);

    // Should show agreed value
    await expect(page.getByText(/Agreed Value.*M/i)).toBeVisible();
  });

  test('should reset voting session', async ({ page }) => {
    // Complete a voting session
    await page.getByRole('button', { name: /▶️ Start Voting/i }).click();
    await page.getByRole('button', { name: 'XS' }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /⏹️ Close Voting/i }).click();
    await page.waitForTimeout(300);

    // Reset voting
    await page.getByRole('button', { name: /🔄 Reset Voting/i }).click();
    await page.waitForTimeout(300);

    // Should return to IDLE state
    await expect(page.getByText(/Voting Status.*IDLE/i)).toBeVisible();

    // Should show Start Voting button again
    await expect(page.getByRole('button', { name: /▶️ Start Voting/i })).toBeVisible();
  });

  test('should show vote status indicator for voted participant', async ({ page }) => {
    // Start voting
    await page.getByRole('button', { name: /▶️ Start Voting/i }).click();

    // Submit vote
    await page.getByRole('button', { name: 'M' }).click();
    await page.waitForTimeout(500);

    // Look for "✓ Voted" indicator in participants list
    await expect(page.getByText(/✓ Voted/i)).toBeVisible();
  });
});

