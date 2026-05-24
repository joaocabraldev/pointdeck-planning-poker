import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

// Helper function to create a user session
async function createUserSession(page: Page, userName: string) {
  await page.goto(BASE_URL);
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE_URL}/signup`);
  await page.getByPlaceholder('Your name').fill(userName);
  await page.getByRole('button', { name: /Continue/i }).click();
  await expect(page).toHaveURL(BASE_URL + '/');
}

// Helper function to create a room
async function createRoom(page: Page) {
  await page.getByRole('button', { name: /Create New Room/i }).click();
  await expect(page).toHaveURL(/\/rooms\/.+/);
  return page.url();
}

test.describe('Multi-User Voting', () => {
  test('should show both participants in the room', async ({ browser }) => {
    // Create first user (owner)
    const owner = await browser.newContext();
    const ownerPage = await owner.newPage();
    await createUserSession(ownerPage, 'Owner User');
    const roomUrl = await createRoom(ownerPage);

    // Create second user (participant)
    const participant = await browser.newContext();
    const participantPage = await participant.newPage();
    await createUserSession(participantPage, 'Participant User');

    // Join the same room
    await participantPage.goto(roomUrl);
    await participantPage.waitForTimeout(1000);

    // Owner page should show both users
    await expect(ownerPage.getByText('Owner User')).toBeVisible();
    await expect(ownerPage.getByText('Participant User')).toBeVisible();

    // Participant page should show both users
    await expect(participantPage.getByText('Owner User')).toBeVisible();
    await expect(participantPage.getByText('Participant User')).toBeVisible();

    await owner.close();
    await participant.close();
  });

  test('should update vote count in real-time for all users', async ({ browser }) => {
    // Setup owner
    const owner = await browser.newContext();
    const ownerPage = await owner.newPage();
    await createUserSession(ownerPage, 'Owner');
    const roomUrl = await createRoom(ownerPage);

    // Setup participant
    const participant = await browser.newContext();
    const participantPage = await participant.newPage();
    await createUserSession(participantPage, 'Participant');
    await participantPage.goto(roomUrl);
    await participantPage.waitForTimeout(1000);

    // Owner starts voting
    await ownerPage.getByRole('button', { name: /Start Voting/i }).click();
    await ownerPage.waitForTimeout(500);

    // Participant should see voting is active
    await expect(participantPage.getByText(/Pick your card/i)).toBeVisible();

    // Owner votes
    await ownerPage.getByRole('button', { name: 'M' }).click();
    await ownerPage.waitForTimeout(500);

    // Both should see 1 of 2 votes
    await expect(ownerPage.getByText(/1 of 2 voted/i)).toBeVisible();
    await expect(participantPage.getByText(/1 of 2 voted/i)).toBeVisible();

    // Participant votes
    await participantPage.getByRole('button', { name: 'L' }).click();
    await participantPage.waitForTimeout(500);

    // Both should see 2 of 2 votes
    await expect(ownerPage.getByText(/2 of 2 voted/i)).toBeVisible();
    await expect(participantPage.getByText(/2 of 2 voted/i)).toBeVisible();

    await owner.close();
    await participant.close();
  });

  test('should sync voting state changes to all users', async ({ browser }) => {
    // Setup owner
    const owner = await browser.newContext();
    const ownerPage = await owner.newPage();
    await createUserSession(ownerPage, 'Owner');
    const roomUrl = await createRoom(ownerPage);

    // Setup participant
    const participant = await browser.newContext();
    const participantPage = await participant.newPage();
    await createUserSession(participantPage, 'Participant');
    await participantPage.goto(roomUrl);
    await participantPage.waitForTimeout(1000);

    // Owner can start from the idle state while participant waits.
    await expect(ownerPage.getByRole('button', { name: /Start Voting/i })).toBeVisible();
    await expect(participantPage.getByText(/Waiting for the host/i)).toBeVisible();

    // Owner starts voting
    await ownerPage.getByRole('button', { name: /Start Voting/i }).click();
    await ownerPage.waitForTimeout(500);

    // Participant should see ACTIVE state
    await expect(participantPage.getByText(/Pick your card/i)).toBeVisible();

    // Both submit votes
    await ownerPage.getByRole('button', { name: 'S' }).click();
    await participantPage.getByRole('button', { name: 'M' }).click();
    await ownerPage.waitForTimeout(500);

    // Owner closes voting
    await ownerPage.getByRole('button', { name: /Reveal Cards/i }).click();
    await ownerPage.waitForTimeout(500);

    // Both should see revealed voting values
    await expect(ownerPage.getByText('S')).toBeVisible();
    await expect(ownerPage.getByText('M')).toBeVisible();
    await expect(participantPage.getByText('S')).toBeVisible();
    await expect(participantPage.getByText('M')).toBeVisible();

    await owner.close();
    await participant.close();
  });

  test('should show results to all users after voting closes', async ({ browser }) => {
    // Setup users
    const owner = await browser.newContext();
    const ownerPage = await owner.newPage();
    await createUserSession(ownerPage, 'Alice');
    const roomUrl = await createRoom(ownerPage);

    const participant = await browser.newContext();
    const participantPage = await participant.newPage();
    await createUserSession(participantPage, 'Bob');
    await participantPage.goto(roomUrl);
    await participantPage.waitForTimeout(1000);

    // Complete voting session
    await ownerPage.getByRole('button', { name: /Start Voting/i }).click();
    await ownerPage.waitForTimeout(300);
    await ownerPage.getByRole('button', { name: 'XS' }).click();
    await participantPage.getByRole('button', { name: 'L' }).click();
    await ownerPage.waitForTimeout(500);
    await ownerPage.getByRole('button', { name: /Reveal Cards/i }).click();
    await ownerPage.waitForTimeout(500);

    // Both users should see the revealed votes and participant names.
    await expect(ownerPage.getByText('Alice')).toBeVisible();
    await expect(ownerPage.getByText('Bob')).toBeVisible();
    await expect(ownerPage.getByText('XS')).toBeVisible();
    await expect(ownerPage.getByText('L')).toBeVisible();
    await expect(participantPage.getByText('Alice')).toBeVisible();
    await expect(participantPage.getByText('Bob')).toBeVisible();
    await expect(participantPage.getByText('XS')).toBeVisible();
    await expect(participantPage.getByText('L')).toBeVisible();

    await owner.close();
    await participant.close();
  });

  test('participant should NOT see owner controls', async ({ browser }) => {
    // Setup owner
    const owner = await browser.newContext();
    const ownerPage = await owner.newPage();
    await createUserSession(ownerPage, 'Owner');
    const roomUrl = await createRoom(ownerPage);

    // Setup participant
    const participant = await browser.newContext();
    const participantPage = await participant.newPage();
    await createUserSession(participantPage, 'Participant');
    await participantPage.goto(roomUrl);
    await participantPage.waitForTimeout(1000);

    // Owner should see controls
    await expect(ownerPage.getByRole('button', { name: /Start Voting/i })).toBeVisible();

    // Participant should NOT see controls
    await expect(participantPage.getByRole('button', { name: /Start Voting/i })).not.toBeVisible();

    await owner.close();
    await participant.close();
  });

  test('should sync agreed value to all users', async ({ browser }) => {
    // Setup users
    const owner = await browser.newContext();
    const ownerPage = await owner.newPage();
    await createUserSession(ownerPage, 'Owner');
    const roomUrl = await createRoom(ownerPage);

    const participant = await browser.newContext();
    const participantPage = await participant.newPage();
    await createUserSession(participantPage, 'Participant');
    await participantPage.goto(roomUrl);
    await participantPage.waitForTimeout(1000);

    // Complete voting
    await ownerPage.getByRole('button', { name: /Start Voting/i }).click();
    await ownerPage.waitForTimeout(300);
    await ownerPage.getByRole('button', { name: 'M' }).click();
    await participantPage.getByRole('button', { name: 'L' }).click();
    await ownerPage.waitForTimeout(500);
    await ownerPage.getByRole('button', { name: /Reveal Cards/i }).click();
    await ownerPage.waitForTimeout(500);

    // Owner sets agreed value
    const agreedValueButtons = ownerPage.locator('text="Set agreed value:"').locator('..').getByRole('button');
    await agreedValueButtons.filter({ hasText: 'L' }).click();
    await ownerPage.waitForTimeout(500);

    // Both should see agreed value
    await expect(ownerPage.getByText(/Agreed: L/i)).toBeVisible();
    await expect(participantPage.getByText(/Agreed: L/i)).toBeVisible();

    await owner.close();
    await participant.close();
  });

  test('should sync reset to all users', async ({ browser }) => {
    // Setup users
    const owner = await browser.newContext();
    const ownerPage = await owner.newPage();
    await createUserSession(ownerPage, 'Owner');
    const roomUrl = await createRoom(ownerPage);

    const participant = await browser.newContext();
    const participantPage = await participant.newPage();
    await createUserSession(participantPage, 'Participant');
    await participantPage.goto(roomUrl);
    await participantPage.waitForTimeout(1000);

    // Complete voting
    await ownerPage.getByRole('button', { name: /Start Voting/i }).click();
    await ownerPage.waitForTimeout(300);
    await ownerPage.getByRole('button', { name: 'S' }).click();
    await participantPage.getByRole('button', { name: 'M' }).click();
    await ownerPage.waitForTimeout(500);
    await ownerPage.getByRole('button', { name: /Reveal Cards/i }).click();
    await ownerPage.waitForTimeout(500);

    // Owner should see the new-round control once cards are revealed.
    await expect(ownerPage.getByRole('button', { name: /New Round/i })).toBeVisible();

    // Owner resets
    await ownerPage.getByRole('button', { name: /New Round/i }).click();
    await ownerPage.waitForTimeout(500);

    // Both should return to idle
    await expect(ownerPage.getByRole('button', { name: /Start Voting/i })).toBeVisible();
    await expect(participantPage.getByText(/Waiting for the host/i)).toBeVisible();

    await owner.close();
    await participant.close();
  });
});

