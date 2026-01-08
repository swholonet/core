#!/bin/bash
# Complete deployment setup for Star Wars - HoloNet on production server

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Star Wars - HoloNet - Production Deployment Setup${NC}"
echo "======================================================"
echo ""

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

# Check prerequisites
echo -e "${BLUE}Schritt 1: Überprüfe Voraussetzungen${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker ist nicht installiert${NC}"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git ist nicht installiert${NC}"
    exit 1
fi

if ! command -v openssl &> /dev/null; then
    echo -e "${RED}❌ OpenSSL ist nicht installiert${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Alle Voraussetzungen erfüllt${NC}"
echo ""

# Setup directory
echo -e "${BLUE}Schritt 2: Richte Verzeichnis ein${NC}"

DEPLOY_DIR="/root/swholonet/core"

if [ ! -d "$DEPLOY_DIR" ]; then
    echo -e "${YELLOW}Verzeichnis $DEPLOY_DIR existiert nicht, erstelle es...${NC}"
    mkdir -p "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
    
    # Clone the repo
    echo "Klone Repository..."
    git clone https://github.com/swholonet/core.git .
else
    cd "$DEPLOY_DIR"
    echo -e "${GREEN}✅ Verzeichnis existiert${NC}"
fi

echo ""

# Generate .env.production
echo -e "${BLUE}Schritt 3: Generiere .env.production${NC}"

if [ -f .env.production ]; then
    echo -e "${YELLOW}⚠️  .env.production existiert bereits!${NC}"
    read -p "Möchtest du es überschreiben? (ja/nein): " -r RESPONSE
    if [ "$RESPONSE" != "ja" ]; then
        echo "Nutze bestehende .env.production"
        # Source it to get the values
        set -a
        source .env.production
        set +a
    else
        RECREATE=1
    fi
fi

if [ "$RECREATE" = "1" ] || [ ! -f .env.production ]; then
    echo ""
    echo -e "${BLUE}Bitte gib die erforderlichen Werte ein:${NC}"
    echo ""

    # PostgreSQL Password
    read -sp "PostgreSQL Password (Enter = zufällig generieren): " POSTGRES_PASSWORD
    if [ -z "$POSTGRES_PASSWORD" ]; then
        POSTGRES_PASSWORD=$(openssl rand -base64 24)
        echo ""
        echo -e "${GREEN}Generiert: ${POSTGRES_PASSWORD}${NC}"
    fi
    echo ""

    # URL encode the password
    ENCODED_PASSWORD=$(urlencode "$POSTGRES_PASSWORD")
    echo -e "${YELLOW}URL-encoded: ${ENCODED_PASSWORD}${NC}"
    echo ""

    # JWT Secret
    read -sp "JWT Secret (Enter = zufällig generieren): " JWT_SECRET
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
    fi
    echo ""

    # GHCR Token
    read -sp "GitHub Container Registry Token (GHCR_TOKEN): " GHCR_TOKEN
    if [ -z "$GHCR_TOKEN" ]; then
        echo -e "${RED}❌ GHCR_TOKEN ist erforderlich!${NC}"
        exit 1
    fi
    echo ""
    echo ""

    # Generate .env.production
    cat > .env.production << EOF
# Star Wars - HoloNet - Production Environment Variables
# Generated at: $(date)
# DO NOT COMMIT THIS FILE TO GIT!

# ============================================
# PostgreSQL Datenbank
# ============================================
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=swholo_game

# ============================================
# Backend Configuration
# ============================================
NODE_ENV=production
PORT=3000

# Database Connection String (password must be URL-encoded)
DATABASE_URL=postgresql://postgres:${ENCODED_PASSWORD}@postgres:5432/swholo_game?schema=public

# JWT Authentication
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=${CORS_ORIGIN}

# ============================================
# Frontend Configuration
# ============================================
VITE_API_URL=https://${DOMAIN_NAME}

# Asset Repository URL
VITE_ASSET_BASE_URL=https://swholonet.github.io/assets

# ============================================
# Deployment (for deploy-remote.sh)
# ============================================
GHCR_TOKEN=${GHCR_TOKEN}

# ============================================
# Game Settings (Optional)
# ============================================
TICK_INTERVAL=60000

# ============================================
# Debugging
# ============================================
DEBUG_LOGGING=false
EOF

    chmod 600 .env.production
    echo -e "${GREEN}✅ .env.production erstellt (Permissions: 600)${NC}"
    echo ""
fi

# Update repository
echo -e "${BLUE}Schritt 4: Aktualisiere Repository${NC}"
git fetch origin
git checkout main
git pull origin main
echo -e "${GREEN}✅ Repository aktualisiert${NC}"
echo ""

# Start deployment
echo -e "${BLUE}Schritt 5: Starte Deployment${NC}"
echo ""

if [ -x deploy-remote.sh ]; then
    export GHCR_TOKEN
    ./deploy-remote.sh
else
    echo -e "${RED}❌ deploy-remote.sh nicht gefunden oder nicht ausführbar${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Setup und Deployment abgeschlossen!${NC}"
echo ""
echo -e "${BLUE}Nächste Schritte:${NC}"
echo "  1. Prüfe Logs: docker compose -f docker-compose.prod.yml logs -f backend"
echo "  2. Prüfe Status: docker compose -f docker-compose.prod.yml ps"
echo "  3. Teste Health: curl http://localhost:3000/health"
echo ""
echo -e "${YELLOW}Wichtig:${NC}"
echo "  • Speichere .env.production sicher ab für zukünftige Deploys"
echo "  • .env.production wird in .gitignore ignoriert"
echo "  • Nutze den gleichen POSTGRES_PASSWORD für zukünftige Deploys!"
echo ""
