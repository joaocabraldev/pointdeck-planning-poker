# Playwright E2E Tests - Poker Planning

This directory contains end-to-end tests for the Poker Planning application using Playwright.

## Running Tests via MCP

These tests are designed to run through MCP (Model Context Protocol) without requiring Playwright to be installed in the project.

## Test Structure

```
tests/
├── auth.spec.ts              # Authentication and session tests
├── room-creation.spec.ts     # Room creation and navigation tests
├── room-access.spec.ts       # Room access and redirect flow tests
├── voting-flow.spec.ts       # Single-user voting functionality tests
├── multi-user.spec.ts        # Multi-user real-time collaboration tests
└── room-features.spec.ts     # Share, participant management, UI tests
```

## Test Coverage

### 🔐 Authentication (auth.spec.ts)
- ✅ Redirect unauthenticated users to signup
- ✅ Signup form validation
- ✅ Successful signup and redirect
- ✅ Session persistence after reload
- ✅ Logout functionality
- ✅ LocalStorage session management

**Tests:** 9

### 🏠 Room Creation (room-creation.spec.ts)
- ✅ Welcome page with create button
- ✅ Room creation and navigation
- ✅ Creator shown as owner
- ✅ Owner controls visibility
- ✅ Share button presence
- ✅ Home navigation
- ✅ Initial voting status (IDLE)
- ✅ Room metadata display
- ✅ Multiple room creation

**Tests:** 9

### 🚪 Room Access (room-access.spec.ts)
- ✅ Redirect to signup for unauthenticated access
- ✅ Redirect to intended room after signup
- ✅ Direct room access when authenticated
- ✅ Session persistence in rooms

**Tests:** 4

### 🗳️ Voting Flow (voting-flow.spec.ts)
- ✅ Start voting session
- ✅ Vote button visibility
- ✅ Submit votes (XS, S, M, L)
- ✅ Highlight selected vote
- ✅ Change vote
- ✅ Cancel vote
- ✅ Close voting and reveal results
- ✅ Display results after closing
- ✅ Set agreed value
- ✅ Reset voting session
- ✅ Vote status indicators

**Tests:** 11

### 👥 Multi-User Collaboration (multi-user.spec.ts)
- ✅ Show both participants in room
- ✅ Real-time vote count updates
- ✅ Sync voting state changes
- ✅ Show results to all users
- ✅ Hide owner controls from participants
- ✅ Sync agreed value
- ✅ Sync voting reset

**Tests:** 7

### ⚙️ Room Features (room-features.spec.ts)
- ✅ Share room button
- ✅ Copy link to clipboard
- ✅ Share success message
- ✅ Remove participant (owner only)
- ✅ No remove buttons for participants
- ✅ Crown emoji for owner
- ✅ Highlight current user
- ✅ Vote duration display
- ✅ Room ID display
- ✅ Creator information

**Tests:** 13

## Total Test Count

**53 end-to-end tests** covering all major user flows and features.

## Test Scenarios

### User Journeys Tested

1. **New User Flow**
   - Land on homepage → Redirected to signup
   - Enter name → Redirected to home
   - Create room → Navigate to room
   - Share link with team

2. **Room Join Flow**
   - Receive room link
   - Click link (unauthenticated)
   - Sign up
   - Auto-redirect to room
   - See room participants

3. **Owner Voting Session**
   - Start voting
   - Cast vote
   - See vote count update
   - Close voting
   - View results
   - Set agreed value
   - Reset for next round

4. **Participant Voting**
   - Wait for owner to start
   - Cast vote
   - Change vote
   - Cancel vote
   - View results when closed

5. **Multi-User Real-Time**
   - Multiple users join room
   - All see live participant list
   - Votes update in real-time
   - State changes sync instantly
   - Results visible to all

## Key Features Tested

### Real-Time Synchronization
- ✅ WebSocket connection
- ✅ Room updates broadcast
- ✅ Vote count updates
- ✅ Status changes
- ✅ Participant joins/leaves

### Authentication & Authorization
- ✅ JWT token management
- ✅ Session persistence
- ✅ Protected routes
- ✅ Owner-only controls
- ✅ Participant permissions

### Voting Mechanics
- ✅ All vote options (XS, S, M, L)
- ✅ Vote submission
- ✅ Vote changes
- ✅ Vote cancellation
- ✅ Results revelation
- ✅ Agreed value setting

### User Experience
- ✅ Loading states
- ✅ Error handling
- ✅ Success messages
- ✅ Visual indicators
- ✅ Responsive UI

## Running Individual Test Suites

```bash
# Run authentication tests
npx playwright test auth.spec.ts

# Run room creation tests
npx playwright test room-creation.spec.ts

# Run voting tests
npx playwright test voting-flow.spec.ts

# Run multi-user tests
npx playwright test multi-user.spec.ts

# Run all tests
npx playwright test
```

## Test Configuration

The tests use the following configuration:
- **Base URL:** `http://localhost:5173`
- **Backend URL:** `http://localhost:3000`
- **Browser:** Chromium (Chrome)
- **Workers:** 1 (sequential execution for real-time tests)
- **Retries:** 0 (local), 2 (CI)
- **Timeout:** 30s per test

## Prerequisites

To run these tests, ensure:
1. Backend server is running on port 3000
2. Frontend dev server is running on port 5173
3. Both servers are accessible

The Playwright config includes `webServer` settings that will automatically start both servers if they're not running.

## Test Patterns

### Common Test Setup
```typescript
test.beforeEach(async ({ page }) => {
  await page.goto(BASE_URL);
  await page.evaluate(() => localStorage.clear());
  // Additional setup...
});
```

### Multi-User Tests
```typescript
const owner = await browser.newContext();
const ownerPage = await owner.newPage();
// Setup owner...

const participant = await browser.newContext();
const participantPage = await participant.newPage();
// Setup participant...
```

### Waiting for Real-Time Updates
```typescript
await page.waitForTimeout(500); // After state-changing actions
```

## Debugging Tests

### View Test Report
```bash
npx playwright show-report
```

### Run in UI Mode
```bash
npx playwright test --ui
```

### Run with Headed Browser
```bash
npx playwright test --headed
```

### Debug Specific Test
```bash
npx playwright test --debug auth.spec.ts
```

## Test Maintenance

When adding new features:
1. Add corresponding test file in `/tests`
2. Follow existing naming convention: `feature-name.spec.ts`
3. Include test descriptions that explain user stories
4. Use helper functions for common actions
5. Clean up context/pages in multi-user tests

## CI/CD Integration

These tests are ready for CI/CD pipelines:
- Automatic server startup
- Retry logic for flaky tests
- Screenshots on failure
- Videos on failure
- HTML report generation

## Known Limitations

1. **Real-Time Delays:** Tests use `waitForTimeout()` to allow WebSocket propagation
2. **Sequential Execution:** Multi-user tests must run sequentially to avoid conflicts
3. **Clipboard Tests:** Require browser permissions (granted in tests)
4. **Local Storage:** Cleared between tests to ensure clean state

## Future Test Additions

- [ ] Mobile viewport tests
- [ ] Accessibility tests (a11y)
- [ ] Performance tests
- [ ] Error recovery tests
- [ ] Network failure simulation
- [ ] Concurrent user stress tests (10+ users)
- [ ] Cross-browser testing (Firefox, Safari)

---

**Total Coverage:** 53 tests across 6 test suites
**Execution Time:** ~2-3 minutes for full suite
**Maintained By:** Development Team

