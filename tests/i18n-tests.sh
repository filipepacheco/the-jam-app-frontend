#!/bin/bash

# Internationalization Test Suite
# Tests language switching and translation coverage

set -e

echo "========================================="
echo "Internationalization (i18n) Test Suite"
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

SESSION="i18n-test-$(date +%s)"

echo "Using session: $SESSION"
echo ""

# Test 1: English (default)
run_test "Default Language (English)"
agent-browser --session $SESSION open "$BASE_URL/jams"
sleep 2

agent-browser --session $SESSION eval "localStorage.getItem('i18nextLng')" > /tmp/lang.txt
LANG=$(cat /tmp/lang.txt | tr -d '"' | tr -d '\n')
echo "Detected language: $LANG"

# Check for English text in page
agent-browser --session $SESSION get title > /tmp/title.txt
if grep -qi "Karaoke\|Jam" /tmp/title.txt; then
    test_passed
else
    test_failed "English title not found"
fi

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/i18n-01-english.png

# Test 2: Switch to Spanish
run_test "Switch to Spanish (es)"
# Set language via localStorage (URL param ?lng=es doesn't work reliably)
agent-browser --session $SESSION eval "localStorage.setItem('i18nextLng', 'es')"
agent-browser --session $SESSION open "$BASE_URL/jams"
sleep 3

agent-browser --session $SESSION eval "localStorage.getItem('i18nextLng')" > /tmp/lang.txt
LANG=$(cat /tmp/lang.txt | tr -d '"' | tr -d '\n')

if [[ "$LANG" == "es"* ]]; then
    test_passed
    echo "Language set to: $LANG"
else
    test_failed "Language not set to Spanish (got: $LANG)"
fi

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/i18n-02-spanish.png

# Test 3: Spanish Translation Coverage
run_test "Spanish Translation Coverage"
agent-browser --session $SESSION snapshot -i > /tmp/es-content.txt

# Look for Spanish-specific words (Inicio, Panel de Control, Explorar sesiones)
if grep -qi "Inicio\|Panel de Control\|sesiones de Jam" /tmp/es-content.txt; then
    test_passed
else
    test_failed "Spanish translations not found in content"
fi

# Test 4: Switch to Portuguese
run_test "Switch to Portuguese (pt)"
# Set language via localStorage
agent-browser --session $SESSION eval "localStorage.setItem('i18nextLng', 'pt')"
agent-browser --session $SESSION open "$BASE_URL/jams"
sleep 3

agent-browser --session $SESSION eval "localStorage.getItem('i18nextLng')" > /tmp/lang.txt
LANG=$(cat /tmp/lang.txt | tr -d '"' | tr -d '\n')

if [[ "$LANG" == "pt"* ]]; then
    test_passed
    echo "Language set to: $LANG"
else
    test_failed "Language not set to Portuguese (got: $LANG)"
fi

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/i18n-03-portuguese.png

# Test 5: Portuguese Translation Coverage
run_test "Portuguese Translation Coverage"
agent-browser --session $SESSION snapshot -i > /tmp/pt-content.txt

# Look for Portuguese-specific words (Inicio with accent, Painel do Host, sessoes)
if grep -qi "Início\|Painel do Host\|sessões de Jam" /tmp/pt-content.txt; then
    test_passed
else
    test_failed "Portuguese translations not found in content"
fi

# Test 6: Language Persistence After Reload
run_test "Language Persistence After Reload"
agent-browser --session $SESSION reload
sleep 2

agent-browser --session $SESSION eval "localStorage.getItem('i18nextLng')" > /tmp/lang.txt
LANG=$(cat /tmp/lang.txt | tr -d '"' | tr -d '\n')

if [[ "$LANG" == "pt"* ]]; then
    test_passed
    echo "Language persisted: $LANG"
else
    test_failed "Language not persisted after reload (got: $LANG)"
fi

# Test 7: Check for Missing i18n Keys
run_test "Check for Missing i18n Keys"
agent-browser --session $SESSION eval "window.__MISSING_I18N_KEYS__ || []" > /tmp/missing-keys.txt

if grep -q "\[\]" /tmp/missing-keys.txt; then
    test_passed
    echo "No missing i18n keys detected"
else
    echo -e "${YELLOW}Warning: Missing i18n keys found:${NC}"
    cat /tmp/missing-keys.txt
    test_failed "Missing i18n keys detected"
fi

# Test 8: Switch Back to English
run_test "Switch Back to English"
# Set language via localStorage and reload to apply
agent-browser --session $SESSION eval "localStorage.setItem('i18nextLng', 'en')"
agent-browser --session $SESSION reload
sleep 3

agent-browser --session $SESSION eval "localStorage.getItem('i18nextLng')" > /tmp/lang.txt
LANG=$(cat /tmp/lang.txt | tr -d '"' | tr -d '\n')

if [[ "$LANG" == "en"* ]]; then
    test_passed
    echo "Language set to: $LANG"
else
    test_failed "Language not set to English (got: $LANG)"
fi

# Test 9: Test Different Pages with Spanish
run_test "Spanish Translation on Login Page"
# Set language via localStorage
agent-browser --session $SESSION eval "localStorage.setItem('i18nextLng', 'es')"
agent-browser --session $SESSION open "$BASE_URL/login"
sleep 3

agent-browser --session $SESSION snapshot -i > /tmp/login-es.txt
if grep -qi "Iniciar\|Entrar\|Correo" /tmp/login-es.txt; then
    test_passed
else
    test_failed "Spanish translations not found on login page"
fi

agent-browser --session $SESSION screenshot $SCREENSHOTS_DIR/i18n-04-login-spanish.png

# Cleanup
echo ""
echo "Closing browser session..."
agent-browser --session $SESSION close

rm -f /tmp/lang.txt /tmp/title.txt /tmp/es-content.txt /tmp/pt-content.txt /tmp/missing-keys.txt /tmp/login-es.txt

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
    echo -e "${GREEN}All i18n tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some i18n tests failed!${NC}"
    exit 1
fi
