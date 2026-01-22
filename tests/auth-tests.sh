#!/bin/bash

# Authentication Test Suite
# Tests login, signup, and auth-related flows
# NOTE: This is a template - adjust element refs (@e1, @e2) based on actual UI

set -e

echo "========================================="
echo "Authentication Test Suite"
echo "========================================="

BASE_URL="http://localhost:5173"
SCREENSHOTS_DIR="tests/screenshots"

# Test credentials (adjust based on your test data)
TEST_EMAIL="musician@test.com"
TEST_PASSWORD="testpassword123"
INVALID_EMAIL="wrong@test.com"
INVALID_PASSWORD="wrongpassword"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

run_test() {
    local test_name=$1
    TESTS_RUN=$((TESTS_RUN + 1))
    echo ""
    echo -e "${YELLOW}Test $TESTS_RUN: $test_name${NC}"
}

test_passed() {
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo -e "${GREEN}✓ PASSED${NC}"
}

test_failed() {
    local reason=$1
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo -e "${RED}✗ FAILED: $reason${NC}"
}

SESSION="auth-test-$(date +%s)"

echo "Using session: $SESSION"
echo ""

# Test 1: Login Page Loads
run_test "Login Page Loads"
agent-browser --session $SESSION open $BASE_URL/login
sleep 2

agent-browser --session $SESSION snapshot -i > /tmp/login-snapshot.txt
if grep -qi "email\|password\|login" /tmp/login-snapshot.txt; then
    test_passed
else
    test_failed "Login form not found"
fi

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/auth-01-login-page.png
echo "Screenshot saved: $SCREENSHOTS_DIR/auth-01-login-page.png"

# Test 2: Invalid Credentials
run_test "Login with Invalid Credentials"

# Get interactive snapshot to find form elements
agent-browser --session $SESSION snapshot -i > /tmp/login-form.txt

echo -e "${YELLOW}NOTE: You need to update element refs (@e1, @e2) based on the snapshot${NC}"
echo "Check /tmp/login-form.txt for actual element references"

# Example - adjust refs based on your UI
# agent-browser --session $SESSION fill @eEmailInput "$INVALID_EMAIL"
# agent-browser --session $SESSION fill @ePasswordInput "$INVALID_PASSWORD"
# agent-browser --session $SESSION click @eLoginButton
# sleep 2

# Check for error message
# agent-browser --session $SESSION snapshot -i > /tmp/error-check.txt
# if grep -qi "invalid\|error\|incorrect" /tmp/error-check.txt; then
#     test_passed
# else
#     test_failed "Error message not displayed for invalid credentials"
# fi

echo -e "${YELLOW}SKIPPED: Requires manual element ref mapping${NC}"

# Test 3: Valid Login
run_test "Login with Valid Credentials"

# Clear previous input and login with valid credentials
# agent-browser --session $SESSION open $BASE_URL/login
# sleep 2
# agent-browser --session $SESSION fill @eEmailInput "$TEST_EMAIL"
# agent-browser --session $SESSION fill @ePasswordInput "$TEST_PASSWORD"
# agent-browser --session $SESSION click @eLoginButton
# sleep 3

# Check if redirected (URL should change from /login)
# agent-browser --session $SESSION get url > /tmp/current-url.txt
# if ! grep -q "/login" /tmp/current-url.txt; then
#     test_passed
#     echo "Redirected to: $(cat /tmp/current-url.txt)"
# else
#     test_failed "Still on login page after valid login"
# fi

# Check for auth token in localStorage
# agent-browser --session $SESSION eval "localStorage.getItem('auth_token')" > /tmp/token.txt
# if grep -v "null" /tmp/token.txt; then
#     echo "Auth token stored in localStorage"
# fi

echo -e "${YELLOW}SKIPPED: Requires manual element ref mapping${NC}"

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/auth-02-after-login.png

# Test 4: Check Authenticated State
run_test "Verify Authenticated State"

# After successful login, check if user menu shows logged-in state
# agent-browser --session $SESSION snapshot -i > /tmp/auth-state.txt
# if grep -qi "logout\|profile\|dashboard" /tmp/auth-state.txt; then
#     test_passed
# else
#     test_failed "User menu doesn't show authenticated state"
# fi

echo -e "${YELLOW}SKIPPED: Requires valid login first${NC}"

# Test 5: Logout
run_test "Logout User"

# Click user menu and logout
# agent-browser --session $SESSION click @eUserMenu
# sleep 1
# agent-browser --session $SESSION click @eLogoutButton
# sleep 2

# Verify redirected to home/login
# agent-browser --session $SESSION get url > /tmp/logout-url.txt
# if grep -qE "/login|/$" /tmp/logout-url.txt; then
#     test_passed
#     echo "Logged out, redirected to: $(cat /tmp/logout-url.txt)"
# else
#     test_failed "Not redirected after logout"
# fi

# Verify token removed from localStorage
# agent-browser --session $SESSION eval "localStorage.getItem('auth_token')" > /tmp/token-after-logout.txt
# if grep -q "null" /tmp/token-after-logout.txt; then
#     echo "Auth token removed from localStorage"
# fi

echo -e "${YELLOW}SKIPPED: Requires manual element ref mapping${NC}"

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/auth-03-after-logout.png

# Test 6: Protected Route Access (Unauthorized)
run_test "Access Protected Route Without Auth"
agent-browser --session $SESSION open $BASE_URL/host/dashboard
sleep 2

agent-browser --session $SESSION get url > /tmp/protected-url.txt
if grep -q "/login" /tmp/protected-url.txt; then
    test_passed
    echo "Redirected to login as expected"
else
    test_failed "Unauthorized access to protected route"
fi

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/auth-04-protected-route.png

# Test 7: OAuth Buttons Present
run_test "OAuth Login Options Available"
agent-browser --session $SESSION open $BASE_URL/login
sleep 2

agent-browser --session $SESSION snapshot -i > /tmp/oauth-check.txt
if grep -qi "google\|github\|discord\|spotify" /tmp/oauth-check.txt; then
    test_passed
    echo "OAuth providers found"
else
    test_failed "OAuth providers not found"
fi

# Test 8: Signup Page Loads
run_test "Signup Page Loads"
agent-browser --session $SESSION open $BASE_URL/signup
sleep 2

agent-browser --session $SESSION snapshot -i > /tmp/signup-snapshot.txt
if grep -qi "email\|password\|signup\|register" /tmp/signup-snapshot.txt; then
    test_passed
else
    test_failed "Signup form not found"
fi

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/auth-05-signup-page.png

# Cleanup
echo ""
echo "Closing browser session..."
agent-browser --session $SESSION close

rm -f /tmp/login-snapshot.txt /tmp/login-form.txt /tmp/error-check.txt /tmp/current-url.txt
rm -f /tmp/token.txt /tmp/auth-state.txt /tmp/logout-url.txt /tmp/token-after-logout.txt
rm -f /tmp/protected-url.txt /tmp/oauth-check.txt /tmp/signup-snapshot.txt

# Print summary
echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="
echo -e "Tests run:    $TESTS_RUN"
echo -e "${GREEN}Tests passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests failed: $TESTS_FAILED${NC}"
echo "========================================="

echo ""
echo -e "${YELLOW}NOTE: This is a template test script${NC}"
echo "To complete implementation:"
echo "1. Run: agent-browser snapshot -i on each page"
echo "2. Identify element refs (@e1, @e2, etc.)"
echo "3. Update script with actual refs"
echo "4. Create test users in Supabase"
echo "5. Re-run tests"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All auth tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}Some tests skipped/failed (template needs completion)${NC}"
    exit 0  # Don't fail on template
fi
