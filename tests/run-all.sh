#!/bin/bash

# Run All Test Suites
# Master test runner for Karaoke Jam Frontend

set -e

echo "========================================="
echo "Karaoke Jam - Full Test Suite"
echo "========================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check setup
echo ""
echo -e "${BLUE}Running setup checks...${NC}"
./setup-tests.sh

if [ $? -ne 0 ]; then
    echo -e "${RED}Setup failed. Exiting.${NC}"
    exit 1
fi

# Track results
TOTAL_SUITES=0
PASSED_SUITES=0
FAILED_SUITES=0

# Helper to run suite
run_suite() {
    local suite_name=$1
    local suite_script=$2

    TOTAL_SUITES=$((TOTAL_SUITES + 1))

    echo ""
    echo "========================================="
    echo -e "${BLUE}Running: $suite_name${NC}"
    echo "========================================="

    if bash $suite_script; then
        PASSED_SUITES=$((PASSED_SUITES + 1))
        echo -e "${GREEN}✓ $suite_name PASSED${NC}"
    else
        FAILED_SUITES=$((FAILED_SUITES + 1))
        echo -e "${RED}✗ $suite_name FAILED${NC}"
    fi
}

# Run test suites
echo ""
echo "========================================="
echo "Starting Test Execution"
echo "========================================="

# Public features (no auth required)
if [ -f "./public-features.sh" ]; then
    run_suite "Public Features" "./public-features.sh"
else
    echo -e "${YELLOW}Skipping Public Features (script not found)${NC}"
fi

# Internationalization
if [ -f "./i18n-tests.sh" ]; then
    run_suite "Internationalization" "./i18n-tests.sh"
else
    echo -e "${YELLOW}Skipping i18n Tests (script not found)${NC}"
fi

# Auth tests (if implemented)
if [ -f "./auth-tests.sh" ]; then
    run_suite "Authentication" "./auth-tests.sh"
else
    echo -e "${YELLOW}Skipping Auth Tests (not implemented yet)${NC}"
fi

# Host features (if implemented)
if [ -f "./host-tests.sh" ]; then
    run_suite "Host Features" "./host-tests.sh"
else
    echo -e "${YELLOW}Skipping Host Tests (not implemented yet)${NC}"
fi

# Musician features
if [ -f "./musician-tests.sh" ]; then
    run_suite "Musician Features" "./musician-tests.sh"
else
    echo -e "${YELLOW}Skipping Musician Tests (not implemented yet)${NC}"
fi

# Real-time updates
if [ -f "./realtime-tests.sh" ]; then
    run_suite "Real-Time Updates" "./realtime-tests.sh"
else
    echo -e "${YELLOW}Skipping Real-Time Tests (not implemented yet)${NC}"
fi

# Offline support
if [ -f "./offline-tests.sh" ]; then
    run_suite "Offline Support" "./offline-tests.sh"
else
    echo -e "${YELLOW}Skipping Offline Tests (not implemented yet)${NC}"
fi

# Error handling
if [ -f "./error-handling-tests.sh" ]; then
    run_suite "Error Handling" "./error-handling-tests.sh"
else
    echo -e "${YELLOW}Skipping Error Handling Tests (not implemented yet)${NC}"
fi

# Print final summary
echo ""
echo "========================================="
echo "FINAL TEST SUMMARY"
echo "========================================="
echo -e "Total suites:  $TOTAL_SUITES"
echo -e "${GREEN}Passed suites: $PASSED_SUITES${NC}"
echo -e "${RED}Failed suites: $FAILED_SUITES${NC}"
echo "========================================="

if [ $FAILED_SUITES -eq 0 ]; then
    echo -e "${GREEN}All test suites passed! 🎉${NC}"
    exit 0
else
    echo -e "${RED}Some test suites failed! ❌${NC}"
    exit 1
fi
