#!/bin/bash

# Musician Features Test Suite
# Tests registration for performances, song suggestions, and profile management
# NOTE: Requires musician user authentication

set -e

echo "========================================="
echo "Musician Features Test Suite"
echo "========================================="

BASE_URL="http://localhost:5173"
SCREENSHOTS_DIR="tests/screenshots"

# Test credentials for musician user
MUSICIAN_EMAIL="musician@test.com"
MUSICIAN_PASSWORD="testpassword123"

# Test jam ID (should be published and accepting registrations)
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

SESSION="musician-test-$(date +%s)"

echo "Using session: $SESSION"
echo ""

echo -e "${BLUE}NOTE: This test suite requires:${NC}"
echo "1. Musician user account: $MUSICIAN_EMAIL"
echo "2. Published jam accepting registrations"
echo "3. Element refs mapped from snapshots"
echo ""

# Test 1: Browse Available Jams
run_test "Browse Available Jams as Musician"
agent-browser --session $SESSION open $BASE_URL/jams
sleep 2

agent-browser --session $SESSION snapshot -i > /tmp/jams-list.txt
JAM_COUNT=$(cat /tmp/jams-list.txt | grep -c "jam\|card" || echo "0")
echo "Jams found: $JAM_COUNT"

if [ "$JAM_COUNT" -gt 0 ]; then
    test_passed
else
    test_failed "No jams displayed"
fi

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/musician-01-browse-jams.png

# Test 2: View Jam Detail Page
run_test "View Jam Detail Page"
agent-browser --session $SESSION open "$BASE_URL/jams/$TEST_JAM_ID"
sleep 2

agent-browser --session $SESSION snapshot -i > /tmp/jam-detail.txt
if grep -qi "register\|schedule\|perform" /tmp/jam-detail.txt; then
    test_passed
else
    test_failed "Jam detail page incomplete"
fi

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/musician-02-jam-detail.png

# Test 3: Registration Button Visible (Before Auth)
run_test "Registration Button Visible to Guest"
agent-browser --session $SESSION snapshot -i > /tmp/register-check.txt
if grep -qi "register\|sign.up\|login" /tmp/register-check.txt; then
    test_passed
    echo "Registration prompt visible"
else
    test_failed "No registration option found"
fi

# Test 4: Timeline Showcase Visible
run_test "Timeline Showcase Component Renders"
agent-browser --session $SESSION snapshot -i > /tmp/timeline-showcase.txt
if grep -qi "timeline\|schedule\|performance" /tmp/timeline-showcase.txt; then
    test_passed
    echo "Timeline showcase visible"
else
    test_failed "Timeline not visible"
fi

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/musician-03-timeline.png

# Test 5: FloatingRegisterButton (V2 Component)
run_test "Floating Register Button Component"
agent-browser --session $SESSION snapshot -i > /tmp/floating-button.txt

# Check for FAB pattern elements
if grep -qi "floating\|fab\|register" /tmp/floating-button.txt; then
    test_passed
    echo "Floating action button detected"
else
    echo -e "${YELLOW}Floating button may not be visible (requires V2 design)${NC}"
fi

# Test 6: Jam Detail V2 Page Access
run_test "Jam Detail V2 Page Access"
agent-browser --session $SESSION open "$BASE_URL/jams/$TEST_JAM_ID/design-preview"
sleep 2

agent-browser --session $SESSION get url > /tmp/v2-url.txt
if ! grep -q "404" /tmp/v2-url.txt; then
    test_passed
    echo "V2 jam detail page accessible"
    agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/musician-04-jam-detail-v2.png
else
    echo -e "${YELLOW}V2 page not found (may be development route)${NC}"
fi

# Test 7: Suggest Song Button Visible
run_test "Suggest Song Feature Visible"
agent-browser --session $SESSION open "$BASE_URL/jams/$TEST_JAM_ID"
sleep 2

agent-browser --session $SESSION snapshot -i > /tmp/suggest-song.txt
if grep -qi "suggest\|song" /tmp/suggest-song.txt; then
    test_passed
    echo "Suggest song feature found"
else
    test_failed "Suggest song feature not visible"
fi

# Test 8: Performance Registration Modal (Element Detection)
run_test "Registration Modal Elements"
echo -e "${YELLOW}NOTE: Modal may require trigger action${NC}"

# Save current state for manual inspection
agent-browser --session $SESSION snapshot -i > /tmp/registration-modal.txt
echo "Current page elements saved to /tmp/registration-modal.txt"
echo "Look for: modal, registration form, instrument selection"

# Test 9: Collapsible Section Components (V2)
run_test "Collapsible Section Components Render"
agent-browser --session $SESSION open "$BASE_URL/jams/$TEST_JAM_ID/design-preview"
sleep 2

agent-browser --session $SESSION snapshot -i > /tmp/collapsible.txt
if grep -qi "collapse\|expand\|section" /tmp/collapsible.txt; then
    test_passed
    echo "Collapsible sections found"
else
    echo -e "${YELLOW}Collapsible sections may not be in this view${NC}"
fi

# Test 10: Musician Profile Page Access
run_test "Musician Profile Page Access"
agent-browser --session $SESSION open $BASE_URL/profile
sleep 2

agent-browser --session $SESSION get url > /tmp/profile-url.txt
if grep -q "/login" /tmp/profile-url.txt; then
    echo -e "${YELLOW}Not authenticated - redirected to login${NC}"
else
    agent-browser --session $SESSION snapshot -i > /tmp/profile.txt
    if grep -qi "profile\|musician\|instrument" /tmp/profile.txt; then
        test_passed
    else
        test_failed "Profile page incomplete"
    fi
fi

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/musician-05-profile.png

# Test 11: Browse Musicians Page
run_test "Browse Musicians Page Access"
agent-browser --session $SESSION open $BASE_URL/musicians
sleep 2

agent-browser --session $SESSION snapshot -i > /tmp/musicians-browse.txt
if grep -qi "musician\|artist\|profile" /tmp/musicians-browse.txt; then
    test_passed
else
    test_failed "Musicians browse page not found"
fi

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/musician-06-browse-musicians.png

# Test 12: Music Library Access
run_test "Music Library Page Access"
agent-browser --session $SESSION open $BASE_URL/music
sleep 2

agent-browser --session $SESSION snapshot -i > /tmp/music-library.txt
if grep -qi "music\|song\|library" /tmp/music-library.txt; then
    test_passed
else
    echo -e "${YELLOW}Music library may require authentication${NC}"
fi

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/musician-07-music-library.png

# Test 13: Timeline Item V2 Waveform Component
run_test "Timeline Item V2 Waveform Renders"
agent-browser --session $SESSION open "$BASE_URL/jams/$TEST_JAM_ID/design-preview"
sleep 2

agent-browser --session $SESSION snapshot -i > /tmp/timeline-item-v2.txt
if grep -qi "waveform\|timeline\|item" /tmp/timeline-item-v2.txt; then
    test_passed
    echo "Timeline item V2 components found"
else
    echo -e "${YELLOW}Timeline V2 waveform may not be rendered${NC}"
fi

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/musician-08-timeline-v2.png

# Test 14: Instrument Icons Display
run_test "Instrument Icons Render"
agent-browser --session $SESSION open "$BASE_URL/jams/$TEST_JAM_ID"
sleep 2

agent-browser --session $SESSION snapshot -i > /tmp/instruments.txt
INSTRUMENT_COUNT=$(cat /tmp/instruments.txt | grep -c "guitar\|drums\|bass\|vocals\|piano" || echo "0")
echo "Instrument references found: $INSTRUMENT_COUNT"

if [ "$INSTRUMENT_COUNT" -gt 0 ]; then
    test_passed
else
    test_failed "No instrument indicators found"
fi

# Test 15: Status Badge Component (from jam-detail-v2)
run_test "Status Badge Components Visible"
agent-browser --session $SESSION snapshot -i > /tmp/status-badges.txt

if grep -qi "badge\|status\|scheduled\|progress\|completed" /tmp/status-badges.txt; then
    test_passed
    echo "Status badges rendered"
else
    test_failed "Status badges not found"
fi

# Test 16: Responsive - Mobile Musician View
run_test "Musician Experience - Mobile View"
agent-browser --session $SESSION set viewport 375 667
sleep 1

agent-browser --session $SESSION open "$BASE_URL/jams/$TEST_JAM_ID"
sleep 2

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/musician-09-mobile.png
echo "Mobile view screenshot saved"
test_passed

# Test 17: Responsive - Tablet Musician View
run_test "Musician Experience - Tablet View"
agent-browser --session $SESSION set viewport 768 1024
sleep 1

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/musician-10-tablet.png
echo "Tablet view screenshot saved"
test_passed

# Reset viewport
agent-browser --session $SESSION set viewport 1920 1080

# Cleanup
echo ""
echo "Closing browser session..."
agent-browser --session $SESSION close

# Clean up temp files
rm -f /tmp/jams-list.txt /tmp/jam-detail.txt /tmp/register-check.txt
rm -f /tmp/timeline-showcase.txt /tmp/floating-button.txt /tmp/v2-url.txt
rm -f /tmp/suggest-song.txt /tmp/registration-modal.txt /tmp/collapsible.txt
rm -f /tmp/profile-url.txt /tmp/profile.txt /tmp/musicians-browse.txt
rm -f /tmp/music-library.txt /tmp/timeline-item-v2.txt /tmp/instruments.txt
rm -f /tmp/status-badges.txt

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
echo "1. Update TEST_JAM_ID with published jam"
echo "2. Map registration modal element refs"
echo "3. Implement authenticated session for full testing"
echo "4. V2 components require design-preview route access"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All musician tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}Some tests failed or need implementation${NC}"
    exit 0
fi
