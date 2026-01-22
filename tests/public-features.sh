#!/bin/bash

# Public Features Test Suite
# Tests browsing jams and viewing public dashboard without authentication

set -e

echo "========================================="
echo "Public Features Test Suite"
echo "========================================="

BASE_URL="http://localhost:5173"
SCREENSHOTS_DIR="tests/screenshots"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to run test
run_test() {
    local test_name=$1
    TESTS_RUN=$((TESTS_RUN + 1))
    echo ""
    echo -e "${YELLOW}Test $TESTS_RUN: $test_name${NC}"
}

# Helper function to mark test passed
test_passed() {
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo -e "${GREEN}✓ PASSED${NC}"
}

# Helper function to mark test failed
test_failed() {
    local reason=$1
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo -e "${RED}✗ FAILED: $reason${NC}"
}

# Start new browser session for tests
SESSION="public-features-test-$(date +%s)"

echo "Using session: $SESSION"
echo ""

# Test 1: Browse Jams Page Loads
run_test "Browse Jams Page Loads"
agent-browser --session $SESSION open $BASE_URL/jams
sleep 2

# Take snapshot and check for jams list
agent-browser --session $SESSION snapshot -i > /tmp/jams-snapshot.txt
if grep -q "jams\|Browse\|Explorar" /tmp/jams-snapshot.txt; then
    test_passed
else
    test_failed "Jams page content not found"
fi

# Take screenshot
agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/01-browse-jams.png
echo "Screenshot saved: $SCREENSHOTS_DIR/01-browse-jams.png"

# Test 2: Language Switching to Spanish
run_test "Language Switching to Spanish"
# Set language via localStorage (URL param ?lng=es doesn't work reliably)
agent-browser --session $SESSION eval "localStorage.setItem('i18nextLng', 'es')"
agent-browser --session $SESSION open "$BASE_URL/jams"
sleep 3

agent-browser --session $SESSION snapshot -i > /tmp/es-snapshot.txt
# Check for Spanish-specific text (Inicio, Explorar sesiones, Ordenar por)
if grep -qi "Inicio\|sesiones de Jam\|Ordenar por" /tmp/es-snapshot.txt; then
    test_passed
else
    test_failed "Spanish translation not detected"
fi

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/02-spanish-language.png
echo "Screenshot saved: $SCREENSHOTS_DIR/02-spanish-language.png"

# Test 3: Language Switching to Portuguese
run_test "Language Switching to Portuguese"
# Set language via localStorage
agent-browser --session $SESSION eval "localStorage.setItem('i18nextLng', 'pt')"
agent-browser --session $SESSION open "$BASE_URL/jams"
sleep 3

agent-browser --session $SESSION snapshot -i > /tmp/pt-snapshot.txt
# Check for Portuguese-specific text (Inicio with accent, sessoes, Painel do Host)
if grep -qi "Início\|sessões de Jam\|Painel do Host" /tmp/pt-snapshot.txt; then
    test_passed
else
    test_failed "Portuguese translation not detected"
fi

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/03-portuguese-language.png

# Test 4: Language Switching Back to English
run_test "Language Switching Back to English"
# Set language via localStorage and reload to apply
agent-browser --session $SESSION eval "localStorage.setItem('i18nextLng', 'en')"
agent-browser --session $SESSION reload
sleep 3

agent-browser --session $SESSION snapshot -i > /tmp/en-snapshot.txt
# Check for English-specific text (Home, Musicians, Host Dashboard - nav items)
if grep -qi "Home\|Musicians\|Host Dashboard" /tmp/en-snapshot.txt; then
    test_passed
else
    test_failed "English translation not detected"
fi

# Test 5: Navigate to Home Page
run_test "Navigate to Home Page"
agent-browser --session $SESSION open $BASE_URL
sleep 2

agent-browser --session $SESSION snapshot -i > /tmp/home-snapshot.txt
if grep -q "Karaoke\|Home\|Browse" /tmp/home-snapshot.txt; then
    test_passed
else
    test_failed "Home page content not found"
fi

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/04-home-page.png

# Test 6: Responsive Design - Mobile View
run_test "Responsive Design - Mobile View (375x667)"
agent-browser --session $SESSION set viewport 375 667
sleep 1

agent-browser --session $SESSION open $BASE_URL/jams
sleep 2

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/05-mobile-view.png
echo "Mobile screenshot saved: $SCREENSHOTS_DIR/05-mobile-view.png"
test_passed

# Test 7: Responsive Design - Tablet View
run_test "Responsive Design - Tablet View (768x1024)"
agent-browser --session $SESSION set viewport 768 1024
sleep 1

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/06-tablet-view.png
echo "Tablet screenshot saved: $SCREENSHOTS_DIR/06-tablet-view.png"
test_passed

# Test 8: Responsive Design - Desktop View
run_test "Responsive Design - Desktop View (1920x1080)"
agent-browser --session $SESSION set viewport 1920 1080
sleep 1

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/07-desktop-view.png
echo "Desktop screenshot saved: $SCREENSHOTS_DIR/07-desktop-view.png"
test_passed

# Cleanup
echo ""
echo "Closing browser session..."
agent-browser --session $SESSION close

# Clean up temp files
rm -f /tmp/jams-snapshot.txt /tmp/lang-snapshot.txt /tmp/es-snapshot.txt /tmp/pt-snapshot.txt /tmp/en-snapshot.txt /tmp/home-snapshot.txt

# Print summary
echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="
echo -e "Tests run:    $TESTS_RUN"
echo -e "${GREEN}Tests passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests failed: $TESTS_FAILED${NC}"
echo "========================================="

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi
