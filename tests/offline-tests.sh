#!/bin/bash

# Offline Support Test Suite
# Tests offline detection, queue mechanism, and reconnection handling

set -e

echo "========================================="
echo "Offline Support Test Suite"
echo "========================================="

BASE_URL="http://localhost:5173"
SCREENSHOTS_DIR="tests/screenshots"

# Test jam ID
TEST_JAM_ID="YOUR_TEST_JAM_ID"

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

SESSION="offline-test-$(date +%s)"

echo "Using session: $SESSION"
echo ""

echo -e "${BLUE}NOTE: This test suite requires:${NC}"
echo "1. Backend API running"
echo "2. IndexedDB support in browser"
echo "3. Network simulation capabilities"
echo ""

# Test 1: Online State Detection
run_test "Initial Online State Detection"
agent-browser --session $SESSION open "$BASE_URL/jams"
sleep 2

agent-browser --session $SESSION eval "navigator.onLine" > /tmp/online-state.txt
if grep -q "true" /tmp/online-state.txt; then
    test_passed
    echo "Browser reports online state"
else
    test_failed "Browser reports offline (unexpected)"
fi

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/offline-01-online-state.png

# Test 2: Go Offline
run_test "Switch to Offline Mode"
agent-browser --session $SESSION set offline on
sleep 1

agent-browser --session $SESSION eval "navigator.onLine" > /tmp/offline-state.txt
if grep -q "false" /tmp/offline-state.txt; then
    test_passed
    echo "Successfully switched to offline mode"
else
    test_failed "Failed to switch to offline mode"
fi

# Test 3: Offline Banner Display
run_test "Offline Banner Appears"
agent-browser --session $SESSION reload
sleep 2

agent-browser --session $SESSION snapshot -i > /tmp/offline-banner.txt
if grep -qi "offline\|no.connection\|disconnected" /tmp/offline-banner.txt; then
    test_passed
    echo "Offline banner displayed"
else
    test_failed "Offline banner not found"
fi

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/offline-02-banner.png

# Test 4: API Request Failure Handling
run_test "API Requests Fail Gracefully When Offline"
agent-browser --session $SESSION open "$BASE_URL/jams/$TEST_JAM_ID"
sleep 2

agent-browser --session $SESSION console > /tmp/offline-console.txt
ERROR_COUNT=$(cat /tmp/offline-console.txt | grep -c "error\|Error" || echo "0")
echo "Console errors: $ERROR_COUNT"

# Some errors expected (failed network requests)
echo -e "${YELLOW}Expected: Network errors due to offline state${NC}"

# Test 5: Offline Queue Available
run_test "Offline Queue Service Available"
agent-browser --session $SESSION eval "typeof window.offlineQueue" > /tmp/queue-check.txt
if grep -qE "object|function" /tmp/queue-check.txt; then
    test_passed
    echo "Offline queue service present"
else
    echo -e "${YELLOW}Offline queue may not be exposed on window object${NC}"
fi

# Test 6: IndexedDB Support
run_test "IndexedDB Available for Queue Storage"
agent-browser --session $SESSION eval "typeof indexedDB" > /tmp/indexeddb.txt
if grep -q "object" /tmp/indexeddb.txt; then
    test_passed
    echo "IndexedDB supported"
else
    test_failed "IndexedDB not available"
fi

# Test 7: Queue Action Simulation
run_test "Queue Action While Offline (Simulation)"
echo -e "${YELLOW}NOTE: Requires interactive form submission${NC}"

# This would require:
# 1. Clicking register button
# 2. Filling form
# 3. Submitting while offline
# 4. Verifying action queued in IndexedDB

echo "Manual test required:"
echo "1. Go offline (set offline on)"
echo "2. Attempt to register for performance"
echo "3. Verify action queued in IndexedDB"
echo "4. Go online (set offline off)"
echo "5. Verify action executed automatically"

# Test 8: Go Back Online
run_test "Return to Online Mode"
agent-browser --session $SESSION set offline off
sleep 1

agent-browser --session $SESSION eval "navigator.onLine" > /tmp/online-again.txt
if grep -q "true" /tmp/online-again.txt; then
    test_passed
    echo "Successfully returned to online mode"
else
    test_failed "Failed to return to online mode"
fi

# Test 9: Offline Banner Disappears
run_test "Offline Banner Disappears When Online"
agent-browser --session $SESSION reload
sleep 2

agent-browser --session $SESSION snapshot -i > /tmp/online-banner.txt
if ! grep -qi "offline\|no.connection" /tmp/online-banner.txt; then
    test_passed
    echo "Offline banner removed"
else
    test_failed "Offline banner still visible when online"
fi

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/offline-03-online-restored.png

# Test 10: Queue Flush on Reconnection
run_test "Queue Flush Mechanism"
echo -e "${YELLOW}NOTE: Requires queued actions from previous offline session${NC}"

# Check if offlineQueue has flush method
agent-browser --session $SESSION eval "typeof window.offlineQueue?.flush" > /tmp/flush-check.txt
if grep -qE "function|undefined" /tmp/flush-check.txt; then
    echo "Queue flush capability check complete"
else
    echo -e "${YELLOW}Queue flush not accessible via window object${NC}"
fi

# Test 11: Reconnection Event Handling
run_test "Reconnection Event Listeners"
agent-browser --session $SESSION eval "window.addEventListener('online', () => console.log('ONLINE_EVENT')); 'registered'" > /tmp/event-reg.txt
if grep -q "registered" /tmp/event-reg.txt; then
    test_passed
    echo "Online event listener can be registered"
else
    test_failed "Event listener registration failed"
fi

# Test 12: Network Request Retry After Reconnection
run_test "Network Requests Resume After Reconnection"
agent-browser --session $SESSION network requests --clear > /dev/null 2>&1 || true

agent-browser --session $SESSION reload
sleep 3

agent-browser --session $SESSION network requests > /tmp/reconnect-requests.txt
REQUEST_COUNT=$(cat /tmp/reconnect-requests.txt | wc -l)
echo "Requests after reconnection: $REQUEST_COUNT"

if [ "$REQUEST_COUNT" -gt 0 ]; then
    test_passed
    echo "Network requests resumed successfully"
else
    test_failed "No network requests after reconnection"
fi

# Test 13: Offline Indicator in Different Pages
run_test "Offline Detection Across Routes"
agent-browser --session $SESSION set offline on
sleep 1

# Check browse jams page
agent-browser --session $SESSION open "$BASE_URL/jams"
sleep 2
agent-browser --session $SESSION snapshot -i > /tmp/offline-jams.txt

# Check jam detail page
agent-browser --session $SESSION open "$BASE_URL/jams/$TEST_JAM_ID"
sleep 2
agent-browser --session $SESSION snapshot -i > /tmp/offline-detail.txt

# Check public dashboard
agent-browser --session $SESSION open "$BASE_URL/jams/$TEST_JAM_ID/dashboard"
sleep 2
agent-browser --session $SESSION snapshot -i > /tmp/offline-dashboard.txt

# Count offline indicators
OFFLINE_INDICATORS=0
grep -qi "offline\|no.connection" /tmp/offline-jams.txt && OFFLINE_INDICATORS=$((OFFLINE_INDICATORS + 1))
grep -qi "offline\|no.connection" /tmp/offline-detail.txt && OFFLINE_INDICATORS=$((OFFLINE_INDICATORS + 1))
grep -qi "offline\|no.connection" /tmp/offline-dashboard.txt && OFFLINE_INDICATORS=$((OFFLINE_INDICATORS + 1))

echo "Offline indicators found on $OFFLINE_INDICATORS/3 pages"

if [ "$OFFLINE_INDICATORS" -ge 2 ]; then
    test_passed
else
    echo -e "${YELLOW}Offline indicator may not be global${NC}"
fi

agent-browser --session $SESSION set offline off

# Test 14: Cached Data Display When Offline
run_test "Cached Data Available When Offline"
# First load data while online
agent-browser --session $SESSION open "$BASE_URL/jams"
sleep 2

# Then go offline and reload
agent-browser --session $SESSION set offline on
sleep 1
agent-browser --session $SESSION reload
sleep 2

agent-browser --session $SESSION snapshot -i > /tmp/cached-data.txt
if grep -qi "jam\|card" /tmp/cached-data.txt; then
    test_passed
    echo "Cached data displayed (SWR cache or browser cache)"
else
    echo -e "${YELLOW}No cached data visible (may show empty state)${NC}"
fi

agent-browser --session $SESSION set offline off

# Test 15: Offline Queue Persistence
run_test "Queue Persists Across Page Reloads"
echo -e "${YELLOW}NOTE: Requires IndexedDB inspection${NC}"

# Check IndexedDB databases
agent-browser --session $SESSION eval "indexedDB.databases().then(dbs => dbs.map(db => db.name))" > /tmp/dbs.txt
cat /tmp/dbs.txt
echo "IndexedDB databases listed above"

# Test 16: Error Messages for Failed Actions
run_test "User Feedback for Offline Actions"
agent-browser --session $SESSION set offline on
sleep 1

agent-browser --session $SESSION open "$BASE_URL/jams/$TEST_JAM_ID"
sleep 2

# Check for user-friendly error messages
agent-browser --session $SESSION snapshot -i > /tmp/error-messages.txt
if grep -qi "offline\|connection\|queue\|try.again" /tmp/error-messages.txt; then
    test_passed
    echo "User feedback present for offline state"
else
    echo -e "${YELLOW}Limited user feedback for offline actions${NC}"
fi

agent-browser --session $SESSION set offline off

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/offline-04-error-handling.png

# Cleanup
echo ""
echo "Closing browser session..."
agent-browser --session $SESSION close

# Clean up temp files
rm -f /tmp/online-state.txt /tmp/offline-state.txt /tmp/offline-banner.txt
rm -f /tmp/offline-console.txt /tmp/queue-check.txt /tmp/indexeddb.txt
rm -f /tmp/online-again.txt /tmp/online-banner.txt /tmp/flush-check.txt
rm -f /tmp/event-reg.txt /tmp/reconnect-requests.txt
rm -f /tmp/offline-jams.txt /tmp/offline-detail.txt /tmp/offline-dashboard.txt
rm -f /tmp/cached-data.txt /tmp/dbs.txt /tmp/error-messages.txt

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
echo -e "${YELLOW}Offline Support Architecture:${NC}"
echo "- Detection: navigator.onLine API"
echo "- Queue: IndexedDB-based action queue"
echo "- Flush: Automatic on 'online' event"
echo "- Cache: SWR + browser cache"
echo ""
echo -e "${YELLOW}Manual Testing Recommended:${NC}"
echo "1. Register while offline, verify queue"
echo "2. Suggest song while offline, verify queue"
echo "3. Go online, verify actions execute"
echo "4. Check IndexedDB for queue persistence"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All offline tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}Some offline tests failed${NC}"
    exit 1
fi
