# Karaoke Jam Frontend - Test Suite

Automated browser testing using **agent-browser** for simple, fast test execution.

## Quick Start

### 1. Install agent-browser

```bash
npm install -g @cloudflare/agent-browser
```

### 2. Start Services

Make sure both backend and frontend are running:

```bash
# Terminal 1 - Backend
cd ../karaoke-jam-backend
npm run start:dev

# Terminal 2 - Frontend
cd ../karaoke-jam-frontend
npm run dev
```

### 3. Run Tests

```bash
# Run all tests
./tests/run-all.sh

# Or run specific test suites
./tests/public-features.sh
./tests/i18n-tests.sh
```

## Available Test Suites

### ✅ Fully Implemented

- **setup-tests.sh** - Environment setup and validation
- **public-features.sh** - Browse jams, language switching, responsive design (8 tests)
- **i18n-tests.sh** - Internationalization (en/es/pt) and missing key detection (9 tests)
- **run-all.sh** - Master test runner for all suites

### ✅ Implemented (Needs Configuration)

These test suites are complete but require test data setup and element ref mapping:

- **auth-tests.sh** - Login, signup, onboarding, logout (8 tests) - *Needs element refs*
- **host-tests.sh** - Create jam, manage jam, DJ control, manage songs (15 tests) - *Needs TEST_JAM_ID*
- **musician-tests.sh** - Register for performances, suggest songs, profile (17 tests) - *Needs TEST_JAM_ID*
- **realtime-tests.sh** - Polling mechanisms, live updates (15 tests) - *Needs TEST_JAM_ID*
- **offline-tests.sh** - Offline queue, reconnection handling (16 tests)
- **error-handling-tests.sh** - API errors, validation, edge cases (20 tests)

**Total: 108 automated test scenarios**

## Test Output

### Screenshots

All test screenshots are saved to `tests/screenshots/`:

```
tests/screenshots/
├── 01-browse-jams.png
├── 02-spanish-language.png
├── 03-portuguese-language.png
├── 04-home-page.png
├── 05-mobile-view.png
├── 06-tablet-view.png
├── 07-desktop-view.png
└── ...
```

### Console Output

Tests provide colored output:
- 🟢 Green - Passed tests
- 🔴 Red - Failed tests
- 🟡 Yellow - Test execution info

## Writing New Tests

### Template

```bash
#!/bin/bash

set -e

SESSION="my-test-$(date +%s)"
BASE_URL="http://localhost:5173"

# Your test steps
agent-browser --session $SESSION open $BASE_URL/page
agent-browser --session $SESSION snapshot -i
agent-browser --session $SESSION click @e1
agent-browser --session $SESSION screenshot tests/screenshots/my-test.png

# Cleanup
agent-browser --session $SESSION close
```

### Best Practices

1. **Use unique sessions** - `SESSION="test-name-$(date +%s)"`
2. **Add delays after navigation** - `sleep 2` after page loads
3. **Save snapshots for assertions** - `snapshot -i > /tmp/output.txt`
4. **Take screenshots** - Visual regression reference
5. **Clean up temp files** - Remove `/tmp/*` files at end
6. **Clean up sessions** - Always `close` at the end

### Useful Commands

```bash
# Navigate
agent-browser --session $SESSION open http://localhost:5173/jams

# Get interactive elements
agent-browser --session $SESSION snapshot -i

# Click element by ref
agent-browser --session $SESSION click @e2

# Fill form field
agent-browser --session $SESSION fill @e5 "test@example.com"

# Execute JavaScript
agent-browser --session $SESSION eval "localStorage.getItem('auth_token')"

# Take screenshot
agent-browser --session $SESSION screenshot tests/screenshots/test.png

# Set viewport for responsive testing
agent-browser --session $SESSION set viewport 375 667  # Mobile
agent-browser --session $SESSION set viewport 768 1024  # Tablet
agent-browser --session $SESSION set viewport 1920 1080  # Desktop

# Get text content
agent-browser --session $SESSION get text @e1

# Check element state
agent-browser --session $SESSION is visible @e1

# Network requests
agent-browser --session $SESSION network requests
```

## Troubleshooting

### Tests Fail with "Connection Refused"

Make sure services are running:
```bash
# Check frontend
curl http://localhost:5173

# Check backend
curl http://localhost:3000/health
```

### agent-browser Not Found

Install globally:
```bash
npm install -g @cloudflare/agent-browser
```

### Snapshots Don't Match Expected Content

The page might not be fully loaded. Add delays:
```bash
agent-browser --session $SESSION open http://localhost:5173/jams
sleep 2  # Wait for page to fully render
agent-browser --session $SESSION snapshot -i
```

### Screenshots Are Blank

Increase viewport size or check if element is in view:
```bash
agent-browser --session $SESSION scrollintoview @e5
agent-browser --session $SESSION screenshot tests/screenshots/test.png
```

### Element References (@e1, @e2) Change

Snapshots generate dynamic refs. Update tests after UI changes:
```bash
# Get fresh snapshot
agent-browser --session $SESSION snapshot -i

# Find new element refs and update test scripts
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Install agent-browser
        run: npm install -g @cloudflare/agent-browser

      - name: Start backend
        run: |
          cd ../karaoke-jam-backend
          npm install
          npm run start:dev &
          sleep 10

      - name: Start frontend
        run: |
          npm run dev &
          sleep 10

      - name: Run tests
        run: ./tests/run-all.sh

      - name: Upload screenshots
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-screenshots
          path: tests/screenshots/
```

## Advanced Testing

### Using Playwright (for complex scenarios)

If agent-browser is insufficient, fall back to Playwright:

```bash
# Install Playwright
npm install -D @playwright/test

# Create Playwright config
npx playwright install
```

Example Playwright test:
```javascript
// tests/playwright/example.spec.js
import { test, expect } from '@playwright/test'

test('browse jams', async ({ page }) => {
  await page.goto('http://localhost:5173/jams')
  await expect(page).toHaveTitle(/Karaoke Jam/)
})
```

### Performance Testing

Check page load times:
```bash
agent-browser --session $SESSION open http://localhost:5173/jams
agent-browser --session $SESSION eval "performance.timing.loadEventEnd - performance.timing.navigationStart"
```

### Network Monitoring

Monitor API calls:
```bash
agent-browser --session $SESSION network requests
agent-browser --session $SESSION network requests --filter "/api/"
```

## References

- [agent-browser Documentation](https://github.com/cloudflare/agent-browser)
- [Test Plan](../TEST_PLAN.md) - Comprehensive test scenarios
- [Project Documentation](../CLAUDE.md) - Application architecture

## Contributing

When adding new features, also add corresponding tests:

1. Review [TEST_PLAN.md](../TEST_PLAN.md) for test scenarios
2. Create test script in `tests/` directory
3. Add to `run-all.sh` test runner
4. Update this README with new test suite info
5. Commit tests alongside feature code
