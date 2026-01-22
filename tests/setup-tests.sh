#!/bin/bash

# Test setup script for Karaoke Jam Frontend
# This script starts the necessary services for testing

set -e

echo "========================================="
echo "Karaoke Jam - Test Environment Setup"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if frontend dev server is already running
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}Frontend dev server already running on port 5173${NC}"
else
    echo -e "${YELLOW}Frontend dev server not running. Please start it with:${NC}"
    echo "  npm run dev"
    echo ""
    echo -e "${YELLOW}Waiting for frontend to start...${NC}"

    # Wait for frontend to become available
    timeout=60
    elapsed=0
    while ! curl -s http://localhost:5173 > /dev/null 2>&1; do
        if [ $elapsed -ge $timeout ]; then
            echo -e "${RED}Timeout waiting for frontend to start${NC}"
            exit 1
        fi
        sleep 1
        elapsed=$((elapsed + 1))
        echo -n "."
    done
    echo ""
fi

# Check if backend API is running
echo ""
echo "Checking backend API..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}Backend API is running on port 3000${NC}"
else
    echo -e "${RED}Backend API is not running!${NC}"
    echo -e "${YELLOW}Please start the backend with:${NC}"
    echo "  cd ../karaoke-jam-backend"
    echo "  npm run start:dev"
    exit 1
fi

# Create screenshots directory
mkdir -p tests/screenshots
echo -e "${GREEN}Screenshots directory: tests/screenshots${NC}"

# Check if agent-browser is installed
if ! command -v agent-browser &> /dev/null; then
    echo -e "${RED}agent-browser not found!${NC}"
    echo -e "${YELLOW}Install with: npm install -g @cloudflare/agent-browser${NC}"
    exit 1
else
    echo -e "${GREEN}agent-browser is installed${NC}"
fi

echo ""
echo "========================================="
echo -e "${GREEN}Test environment ready!${NC}"
echo "========================================="
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:3000"
echo ""
echo "Run tests with:"
echo "  ./tests/public-features.sh"
echo "  ./tests/i18n-tests.sh"
echo ""
