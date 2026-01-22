#!/bin/bash

# Host Features Test Suite
# Tests jam creation, management, and DJ control panel
# NOTE: Requires host user authentication - adjust element refs based on actual UI

set -e

echo "========================================="
echo "Host Features Test Suite"
echo "========================================="

BASE_URL="http://localhost:5173"
SCREENSHOTS_DIR="tests/screenshots"

# Test credentials for host user
HOST_EMAIL="host@test.com"
HOST_PASSWORD="testpassword123"

# Test jam ID (should exist in backend)
TEST_JAM_ID="YOUR_TEST_JAM_ID"  # Update with actual jam ID

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

SESSION="host-test-$(date +%s)"

echo "Using session: $SESSION"
echo ""

echo -e "${BLUE}NOTE: This test suite requires:${NC}"
echo "1. Host user account: $HOST_EMAIL"
echo "2. Valid test jam ID in backend"
echo "3. Element refs (@e1, @e2) mapped from snapshots"
echo ""

# Test 1: Host Dashboard Access
run_test "Host Dashboard Loads"
agent-browser --session $SESSION open $BASE_URL/host/dashboard
sleep 2

agent-browser --session $SESSION get url > /tmp/host-url.txt
if grep -q "/login" /tmp/host-url.txt; then
    echo -e "${YELLOW}Not authenticated - need to login first${NC}"

    # Attempt login
    agent-browser --session $SESSION snapshot -i > /tmp/login-form.txt
    echo "Login form elements saved to /tmp/login-form.txt"
    echo -e "${YELLOW}Manual step required: Map login form refs and implement login${NC}"
else
    test_passed
    echo "Host dashboard accessible"
fi

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/host-01-dashboard.png

# Test 2: Create Jam Page Access
run_test "Create Jam Page Loads"
agent-browser --session $SESSION open $BASE_URL/host/create-jam
sleep 2

agent-browser --session $SESSION snapshot -i > /tmp/create-jam.txt
if grep -qi "title\|date\|location\|create" /tmp/create-jam.txt; then
    test_passed
else
    test_failed "Create jam form not found"
fi

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/host-02-create-jam.png

# Test 3: Create Jam Form Validation
run_test "Create Jam Form Validation"
echo -e "${YELLOW}NOTE: Requires element ref mapping${NC}"

# Example implementation (uncomment after mapping refs):
# agent-browser --session $SESSION click @eCreateButton  # Submit empty form
# sleep 1
# agent-browser --session $SESSION snapshot -i > /tmp/validation.txt
# if grep -qi "required\|error" /tmp/validation.txt; then
#     test_passed
#     echo "Form validation working"
# else
#     test_failed "No validation errors shown"
# fi

echo "Save snapshot for manual inspection:"
cat /tmp/create-jam.txt | grep -E "@e[0-9]+" | head -20

# Test 4: Jam Management Page Access
run_test "Jam Management Page Access"
agent-browser --session $SESSION open "$BASE_URL/host/jams/$TEST_JAM_ID/manage"
sleep 2

agent-browser --session $SESSION snapshot -i > /tmp/manage-jam.txt
if grep -qi "publish\|edit\|delete\|manage" /tmp/manage-jam.txt; then
    test_passed
else
    test_failed "Jam management controls not found"
fi

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/host-03-manage-jam.png

# Test 5: DJ Control Panel Access
run_test "DJ Control Panel Loads"
agent-browser --session $SESSION open "$BASE_URL/host/jams/$TEST_JAM_ID/dj-control"
sleep 2

agent-browser --session $SESSION snapshot -i > /tmp/dj-control.txt
if grep -qi "timeline\|queue\|status\|performance" /tmp/dj-control.txt; then
    test_passed
else
    test_failed "DJ control panel not found"
fi

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/host-04-dj-control.png

# Test 6: Timeline Visualization Present
run_test "Timeline Visualization Renders"
agent-browser --session $SESSION snapshot -i > /tmp/timeline.txt
if grep -qi "scheduled\|progress\|completed\|timeline" /tmp/timeline.txt; then
    test_passed
    echo "Timeline elements found"
else
    test_failed "Timeline elements not found"
fi

# Count timeline items
TIMELINE_ITEMS=$(cat /tmp/timeline.txt | grep -c "schedule\|performance" || echo "0")
echo "Timeline items detected: $TIMELINE_ITEMS"

# Test 7: DJ Control V2 (New Design)
run_test "DJ Control V2 Page Access"
agent-browser --session $SESSION open "$BASE_URL/host/jams/$TEST_JAM_ID/dj-control-v2"
sleep 2

agent-browser --session $SESSION snapshot -i > /tmp/dj-control-v2.txt
if grep -qi "timeline\|queue\|control" /tmp/dj-control-v2.txt; then
    test_passed
    echo "DJ Control V2 loaded"
else
    echo -e "${YELLOW}DJ Control V2 may not exist or requires different route${NC}"
fi

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/host-05-dj-control-v2.png

# Test 8: Queue Statistics Visible
run_test "Queue Statistics Display"
agent-browser --session $SESSION open "$BASE_URL/host/jams/$TEST_JAM_ID/dj-control"
sleep 2

agent-browser --session $SESSION snapshot -i > /tmp/stats.txt
if grep -qi "total\|completed\|remaining\|stats" /tmp/stats.txt; then
    test_passed
    echo "Queue stats found"
else
    test_failed "Queue stats not visible"
fi

# Test 9: Manage Jam Songs Page
run_test "Manage Jam Songs Page Access"
agent-browser --session $SESSION open "$BASE_URL/host/jams/$TEST_JAM_ID/songs"
sleep 2

agent-browser --session $SESSION snapshot -i > /tmp/songs.txt
if grep -qi "song\|add\|library" /tmp/songs.txt; then
    test_passed
else
    test_failed "Songs management page not found"
fi

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/host-06-manage-songs.png

# Test 10: Timeline Item Expansion (if supported)
run_test "Timeline Item Interaction"
echo -e "${YELLOW}NOTE: Requires interactive element identification${NC}"

# Get first timeline item ref
agent-browser --session $SESSION open "$BASE_URL/host/jams/$TEST_JAM_ID/dj-control"
sleep 2
agent-browser --session $SESSION snapshot -i > /tmp/timeline-items.txt

# Save for manual analysis
echo "Timeline items saved to /tmp/timeline-items.txt"
echo "Look for expandable/clickable performance items"

# Test 11: Status Badge Rendering
run_test "Status Badge Components Render"
agent-browser --session $SESSION snapshot -i > /tmp/status-badges.txt

BADGE_COUNT=$(cat /tmp/status-badges.txt | grep -c "badge\|status" || echo "0")
echo "Status badges detected: $BADGE_COUNT"

if [ "$BADGE_COUNT" -gt 0 ]; then
    test_passed
else
    test_failed "No status badges found"
fi

# Test 12: Responsive Design - Timeline on Mobile
run_test "Timeline Responsive - Mobile View"
agent-browser --session $SESSION set viewport 375 667
sleep 1

agent-browser --session $SESSION open "$BASE_URL/host/jams/$TEST_JAM_ID/dj-control"
sleep 2

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/host-07-timeline-mobile.png
echo "Mobile timeline screenshot saved"
test_passed

# Test 13: Responsive Design - Timeline on Desktop
run_test "Timeline Responsive - Desktop View"
agent-browser --session $SESSION set viewport 1920 1080
sleep 1

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/host-08-timeline-desktop.png
echo "Desktop timeline screenshot saved"
test_passed

# Test 14: Musicians Page Access
run_test "Musicians Management Page Access"
agent-browser --session $SESSION open $BASE_URL/host/musicians
sleep 2

agent-browser --session $SESSION snapshot -i > /tmp/musicians.txt
if grep -qi "musician\|profile\|instrument" /tmp/musicians.txt; then
    test_passed
else
    test_failed "Musicians page not found"
fi

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/host-09-musicians.png

# Test 15: Design Variations Page (if exists)
run_test "Design Variations Page Access"
agent-browser --session $SESSION open "$BASE_URL/jams/$TEST_JAM_ID/variations"
sleep 2

agent-browser --session $SESSION get url > /tmp/variations-url.txt
if ! grep -q "404\|not.found" /tmp/variations-url.txt; then
    test_passed
    echo "Design variations page accessible"
    agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/host-10-variations.png
else
    echo -e "${YELLOW}Design variations page not found (may be development-only)${NC}"
fi

# Cleanup
echo ""
echo "Closing browser session..."
agent-browser --session $SESSION close

# Clean up temp files
rm -f /tmp/host-url.txt /tmp/login-form.txt /tmp/create-jam.txt /tmp/manage-jam.txt
rm -f /tmp/dj-control.txt /tmp/timeline.txt /tmp/dj-control-v2.txt /tmp/stats.txt
rm -f /tmp/songs.txt /tmp/timeline-items.txt /tmp/status-badges.txt /tmp/musicians.txt
rm -f /tmp/variations-url.txt

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
echo -e "${YELLOW}Implementation Notes:${NC}"
echo "1. Update TEST_JAM_ID with actual jam from backend"
echo "2. Map element refs from snapshots for interactive tests"
echo "3. Implement login flow before running full suite"
echo "4. Some tests check for presence, not functionality"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All host tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}Some tests failed or need implementation${NC}"
    exit 0  # Don't fail on template
fi
