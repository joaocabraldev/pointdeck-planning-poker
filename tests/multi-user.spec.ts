import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

// Helper function to create a user session
async function createUserSession(page: Page, userName: string) {
  await page.goto(BASE_URL);
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE_URL}/signup`);
  await page.getByPlaceholder('Enter your name').fill(userName);
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

    // Both pages should show 2 participants
    await expect(ownerPage.getByText(/Participants.*2/i)).toBeVisible();
    await expect(participantPage.getByText(/Participants.*2/i)).toBeVisible();

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
    await ownerPage.getByRole('button', { name: /▶️ Start Voting/i }).click();
    await ownerPage.waitForTimeout(500);

    // Participant should see voting is active
    await expect(participantPage.getByText(/Voting Status.*ACTIVE/i)).toBeVisible();
    await expect(participantPage.getByText(/Cast Your Vote/i)).toBeVisible();

    // Owner votes
    await ownerPage.getByRole('button', { name: 'M' }).click();
    await ownerPage.waitForTimeout(500);

    // Both should see 1/2 votes
    await expect(ownerPage.getByText(/Votes:.*1\/2/i)).toBeVisible();
    await expect(participantPage.getByText(/Votes:.*1\/2/i)).toBeVisible();

    // Participant votes
    await participantPage.getByRole('button', { name: 'L' }).click();
    await participantPage.waitForTimeout(500);

    // Both should see 2/2 votes
    await expect(ownerPage.getByText(/Votes:.*2\/2/i)).toBeVisible();
    await expect(participantPage.getByText(/Votes:.*2\/2/i)).toBeVisible();

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

    // Both should see IDLE state
    await expect(ownerPage.getByText(/Voting Status.*IDLE/i)).toBeVisible();
    await expect(participantPage.getByText(/Voting Status.*IDLE/i)).toBeVisible();

    // Owner starts voting
    await ownerPage.getByRole('button', { name: /▶️ Start Voting/i }).click();
    await ownerPage.waitForTimeout(500);

    // Participant should see ACTIVE state
    await expect(participantPage.getByText(/Voting Status.*ACTIVE/i)).toBeVisible();

    // Both submit votes
    await ownerPage.getByRole('button', { name: 'S' }).click();
    await participantPage.getByRole('button', { name: 'M' }).click();
    await ownerPage.waitForTimeout(500);

    // Owner closes voting
    await ownerPage.getByRole('button', { name: /⏹️ Close Voting/i }).click();
    await ownerPage.waitForTimeout(500);

    // Both should see CLOSED state
    await expect(ownerPage.getByText(/Voting Status.*CLOSED/i)).toBeVisible();
    await expect(participantPage.getByText(/Voting Status.*CLOSED/i)).toBeVisible();

    // Both should see results
    await expect(ownerPage.getByText(/Voting Results/i)).toBeVisible();
    await expect(participantPage.getByText(/Voting Results/i)).toBeVisible();

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
    await ownerPage.getByRole('button', { name: /▶️ Start Voting/i }).click();
    await ownerPage.waitForTimeout(300);
    await ownerPage.getByRole('button', { name: 'XS' }).click();
    await participantPage.getByRole('button', { name: 'L' }).click();
    await ownerPage.waitForTimeout(500);
    await ownerPage.getByRole('button', { name: /⏹️ Close Voting/i }).click();
    await ownerPage.waitForTimeout(500);

    // Both should see voting results with participant names
    await expect(ownerPage.getByText(/Voting Results/i)).toBeVisible();
    await expect(participantPage.getByText(/Voting Results/i)).toBeVisible();

    // Check that both users can see the votes (in the results section)
    // Note: We're checking the results section contains the user names
    const ownerResults = ownerPage.locator('text="Voting Results"').locator('..');
    await expect(ownerResults.getByText('Alice')).toBeVisible();
    await expect(ownerResults.getByText('Bob')).toBeVisible();

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
    await expect(ownerPage.getByText(/Owner Controls/i)).toBeVisible();

    // Participant should NOT see controls
    await expect(participantPage.getByText(/Owner Controls/i)).not.toBeVisible();
    await expect(participantPage.getByRole('button', { name: /▶️ Start Voting/i })).not.toBeVisible();

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
    await ownerPage.getByRole('button', { name: /▶️ Start Voting/i }).click();
    await ownerPage.waitForTimeout(300);
    await ownerPage.getByRole('button', { name: 'M' }).click();
    await participantPage.getByRole('button', { name: 'L' }).click();
    await ownerPage.waitForTimeout(500);
    await ownerPage.getByRole('button', { name: /⏹️ Close Voting/i }).click();
    await ownerPage.waitForTimeout(500);

    // Owner sets agreed value
    const agreedValueButtons = ownerPage.locator('text="Set Agreed Value"').locator('..').getByRole('button');
    await agreedValueButtons.filter({ hasText: 'L' }).click();
    await ownerPage.waitForTimeout(500);

    // Both should see agreed value
    await expect(ownerPage.getByText(/Agreed Value.*L/i)).toBeVisible();
    await expect(participantPage.getByText(/Agreed Value.*L/i)).toBeVisible();

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
    await ownerPage.getByRole('button', { name: /▶️ Start Voting/i }).click();
    await ownerPage.waitForTimeout(300);
    await ownerPage.getByRole('button', { name: 'S' }).click();
    await participantPage.getByRole('button', { name: 'M' }).click();
    await ownerPage.waitForTimeout(500);
    await ownerPage.getByRole('button', { name: /⏹️ Close Voting/i }).click();
    await ownerPage.waitForTimeout(500);

    // Both should see CLOSED
    await expect(ownerPage.getByText(/Voting Status.*CLOSED/i)).toBeVisible();
    await expect(participantPage.getByText(/Voting Status.*CLOSED/i)).toBeVisible();

    // Owner resets
    await ownerPage.getByRole('button', { name: /🔄 Reset Voting/i }).click();
    await ownerPage.waitForTimeout(500);

    // Both should see IDLE
    await expect(ownerPage.getByText(/Voting Status.*IDLE/i)).toBeVisible();
    await expect(participantPage.getByText(/Voting Status.*IDLE/i)).toBeVisible();

    await owner.close();
    await participant.close();
  });
});

