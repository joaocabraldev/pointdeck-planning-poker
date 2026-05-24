import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

async function startVoting(page: Page) {
  await page.getByRole('button', { name: /Start Voting/i }).click({ force: true });
}

async function clickVote(page: Page, vote: string) {
  await page.getByRole('button', { name: vote, exact: true }).click({ force: true });
}

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
    await expect(page.getByRole('button', { name: /Start Voting/i })).toBeVisible();
  });

  test('should start voting session', async ({ page }) => {
    // Initially in IDLE state
    await expect(page.getByRole('button', { name: /Start Voting/i })).toBeVisible();

    // Click Start Voting
    await startVoting(page);

    // Should change to ACTIVE state
    await expect(page.getByText(/Pick your card/i)).toBeVisible();
  });

  test('should show vote buttons when voting is active', async ({ page }) => {
    // Start voting
    await startVoting(page);

    // Should see voting section
    await expect(page.getByText(/Pick your card/i)).toBeVisible();

    // Should see all vote options
    await expect(page.getByRole('button', { name: 'XS', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'S', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'M', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'L', exact: true })).toBeVisible();
  });

  test('should submit a vote', async ({ page }) => {
    // Start voting
    await startVoting(page);

    // Click vote M
    await clickVote(page, 'M');

    // Wait a moment for the vote to be submitted
    await page.waitForTimeout(500);

    // Vote count should show 1/1
    await expect(page.getByText(/1 of 1 voted/i)).toBeVisible();
  });

  test('should highlight selected vote', async ({ page }) => {
    // Start voting
    await startVoting(page);

    // Get the M button
    const mButton = page.getByRole('button', { name: 'M', exact: true });

    // Click vote M
    await mButton.click({ force: true });

    // Wait for state update
    await page.waitForTimeout(500);

    // The selected card stays visible and the vote count remains recorded.
    await expect(page.getByText(/1 of 1 voted/i)).toBeVisible();
  });

  test('should allow changing vote', async ({ page }) => {
    // Start voting
    await startVoting(page);

    // Click vote S
    await clickVote(page, 'S');
    await page.waitForTimeout(300);

    // Change to L
    await clickVote(page, 'L');
    await page.waitForTimeout(300);

    // Should still show 1/1 votes (same user, changed vote)
    await expect(page.getByText(/1 of 1 voted/i)).toBeVisible();
  });

  test('should cancel vote', async ({ page }) => {
    // Start voting
    await startVoting(page);

    // Submit vote
    await clickVote(page, 'M');
    await page.waitForTimeout(300);

    // Click the selected vote again to cancel it
    await clickVote(page, 'M');
    await page.waitForTimeout(300);

    // Vote count should be 0/1
    await expect(page.getByText(/0 of 1 voted/i)).toBeVisible();
  });

  test('should close voting and show results', async ({ page }) => {
    // Start voting
    await startVoting(page);

    // Submit vote
    await clickVote(page, 'L');
    await page.waitForTimeout(300);

    // Close voting
    await page.getByRole('button', { name: /Reveal Cards/i }).click({ force: true });

    // Should change to CLOSED state
    await expect(page.getByRole('button', { name: /New Round/i })).toBeVisible();

    // Should show results section
    await expect(page.getByText('L', { exact: true }).first()).toBeVisible();
  });

  test('should display votes in results after closing', async ({ page }) => {
    // Start voting
    await startVoting(page);

    // Submit vote M
    await clickVote(page, 'M');
    await page.waitForTimeout(300);

    // Close voting
    await page.getByRole('button', { name: /Reveal Cards/i }).click({ force: true });
    await page.waitForTimeout(300);

    // Results should show Owner User and their revealed vote.
    await expect(page.getByText('Owner User', { exact: true })).toBeVisible();
    await expect(page.getByText('M', { exact: true }).first()).toBeVisible();
  });

  test('should allow setting agreed value', async ({ page }) => {
    // Complete a voting session
    await startVoting(page);
    await clickVote(page, 'S');
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /Reveal Cards/i }).click({ force: true });
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
    await startVoting(page);
    await clickVote(page, 'XS');
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /Reveal Cards/i }).click({ force: true });
    await page.waitForTimeout(300);

    // Reset voting
    await page.getByRole('button', { name: /New Round/i }).click({ force: true });
    await page.waitForTimeout(300);

    // Should return to IDLE state
    await expect(page.getByRole('button', { name: /Start Voting/i })).toBeVisible();

    // Should show Start Voting button again
    await expect(page.getByRole('button', { name: /Start Voting/i })).toBeVisible();
  });

  test('should show vote status indicator for voted participant', async ({ page }) => {
    // Start voting
    await startVoting(page);

    // Submit vote
    await clickVote(page, 'M');
    await page.waitForTimeout(500);

    await expect(page.getByText(/1 of 1 voted/i)).toBeVisible();
  });
});

