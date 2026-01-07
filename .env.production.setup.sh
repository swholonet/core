#!/bin/bash
# Setup script to generate .env.production with proper URL encoding

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Star Wars - HoloNet - Environment Setup${NC}"
echo "=========================================="
echo ""

# Check if .env.production already exists
if [ -f .env.production ]; then
    echo -e "${YELLOW}⚠️  .env.production already exists!${NC}"
    read -p "Do you want to overwrite it? (yes/no): " -r RESPONSE
    if [ "$RESPONSE" != "yes" ]; then
        echo "Aborted."
        exit 0
    fi
fi

# Function to URL encode a string
urlencode() {
    local string="${1}"
    local strlen=${#string}
    local encoded=""
    local pos c o

    for (( pos=0 ; pos<strlen ; pos++ )); do
        c=${string:$pos:1}
        case "$c" in
            [-_.~a-zA-Z0-9] ) o="${c}" ;;
            * ) printf -v o '%%%02x' "'$c"
        esac
        encoded+="${o}"
    done
    echo "${encoded}"
}

echo -e "${BLUE}Bitte gib die erforderlichen Werte ein:${NC}"
echo ""

# PostgreSQL Password
read -sp "PostgreSQL Password (oder Enter für: openssl rand -base64 24): " POSTGRES_PASSWORD
if [ -z "$POSTGRES_PASSWORD" ]; then
    POSTGRES_PASSWORD=$(openssl rand -base64 24)
    echo ""
    echo -e "${GREEN}Generiert: ${POSTGRES_PASSWORD}${NC}"
fi
echo ""

# PostgreSQL Host
read -p "PostgreSQL Host (Standard: postgres): " POSTGRES_HOST
if [ -z "$POSTGRES_HOST" ]; then
    POSTGRES_HOST="postgres"
fi
echo ""

# PostgreSQL Port
read -p "PostgreSQL Port (Standard: 5432): " POSTGRES_PORT
if [ -z "$POSTGRES_PORT" ]; then
    POSTGRES_PORT="5432"
fi
echo ""

# Redis Host
read -p "Redis Host (Standard: redis): " REDIS_HOST
if [ -z "$REDIS_HOST" ]; then
    REDIS_HOST="redis"
fi
echo ""

# Redis Port
read -p "Redis Port (Standard: 6379): " REDIS_PORT
if [ -z "$REDIS_PORT" ]; then
    REDIS_PORT="6379"
fi
echo ""

# URL encode the password
ENCODED_PASSWORD=$(urlencode "$POSTGRES_PASSWORD")

# JWT Secret
read -sp "JWT Secret (oder Enter für: openssl rand -base64 32): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo ""
    echo -e "${GREEN}Generiert: ${JWT_SECRET}${NC}"
fi
echo ""

# CORS Origin
read -p "CORS Origin (z.B. https://swholo.net): " CORS_ORIGIN
if [ -z "$CORS_ORIGIN" ]; then
    CORS_ORIGIN="https://swholo.net"
    echo "Standard: $CORS_ORIGIN"
fi
echo ""

# Generate .env.production
cat > .env.production << EOF
# Star Wars - HoloNet - Production Environment Variables
# Generated at: $(date)

# ============================================
# PostgreSQL Datenbank
# ============================================
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=swholo_game
POSTGRES_HOST=${POSTGRES_HOST}
POSTGRES_PORT=${POSTGRES_PORT}

# ============================================
# Backend Configuration
# ============================================
NODE_ENV=production
PORT=3000

# Database Connection String wird automatisch vom entrypoint.sh aus POSTGRES_PASSWORD konstruiert!

# JWT Authentication
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=${CORS_ORIGIN}

# Redis Connection
REDIS_HOST=${REDIS_HOST}
REDIS_PORT=${REDIS_PORT}
REDIS_URL=redis://${REDIS_HOST}:${REDIS_PORT}

# Asset Repository URL
VITE_ASSET_BASE_URL=https://swholonet.github.io/assets

# ============================================
# Game Settings (Optional)
# ============================================
TICK_INTERVAL=60000

# ============================================
# Debugging (Production: false)
# ============================================
DEBUG_LOGGING=false
EOF

echo -e "${GREEN}✅ .env.production erfolgreich erstellt!${NC}"
echo ""
echo -e "${BLUE}Beachte:${NC}"
echo "  • Speichere diese Werte sicher ab (besonders POSTGRES_PASSWORD und JWT_SECRET)"
echo "  • .env.production wird in .gitignore ignoriert"
echo "  • Verwende beim nächsten Deploy: ./deploy-remote.sh"
echo ""
echo -e "${YELLOW}Deine Werte:${NC}"
echo "  POSTGRES_PASSWORD: $POSTGRES_PASSWORD"
echo "  POSTGRES_HOST: $POSTGRES_HOST"
echo "  POSTGRES_PORT: $POSTGRES_PORT"
echo "  REDIS_HOST: $REDIS_HOST"
echo "  REDIS_PORT: $REDIS_PORT"
echo "  JWT_SECRET: $JWT_SECRET"
echo "  CORS_ORIGIN: $CORS_ORIGIN"
echo ""
