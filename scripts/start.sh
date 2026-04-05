#!/usr/bin/env bash
# VizardFree – Quick Start Script
# Usage: bash scripts/start.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "  ██╗   ██╗██╗███████╗ █████╗ ██████╗ ██████╗ ███████╗██████╗ ███████╗███████╗"
echo "  ██║   ██║██║╚══███╔╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔════╝██╔════╝"
echo "  ██║   ██║██║  ███╔╝ ███████║██████╔╝██║  ██║█████╗  ██████╔╝█████╗  █████╗  "
echo "  ╚██╗ ██╔╝██║ ███╔╝  ██╔══██║██╔══██╗██║  ██║██╔══╝  ██╔══██╗██╔══╝  ██╔══╝  "
echo "   ╚████╔╝ ██║███████╗██║  ██║██║  ██║██████╔╝██║     ██║  ██║███████╗███████╗"
echo "    ╚═══╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝"
echo -e "${NC}"
echo -e "${GREEN}  Open-source Vizard.ai clone for Indian creators 🇮🇳🔥${NC}"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker first.${NC}"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
    echo -e "${RED}❌ Docker Compose not found.${NC}"
    exit 1
fi

echo -e "${YELLOW}► Checking for .env file…${NC}"
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo -e "${GREEN}  ✓ Created backend/.env from example${NC}"
else
    echo -e "${GREEN}  ✓ backend/.env exists${NC}"
fi

echo ""
echo -e "${YELLOW}► Building and starting containers…${NC}"
echo "  (First run may take 5-10 minutes to download base images)"
echo ""

docker compose up -d --build

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ VizardFree is running!${NC}"
echo ""
echo -e "  🌐 Open in browser:  ${CYAN}http://localhost${NC}"
echo -e "  📡 API Docs:         ${CYAN}http://localhost:8000/docs${NC}"
echo ""
echo -e "${YELLOW}  ℹ️  On first video upload, Whisper model will auto-download (~3GB)${NC}"
echo -e "${YELLOW}  ℹ️  For GPU acceleration: docker compose -f docker-compose.yml -f docker-compose.gpu.yml up -d${NC}"
echo ""
echo -e "  📖 Full guide: ${CYAN}SETUP.md${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
