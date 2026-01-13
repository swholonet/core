#!/bin/bash
set -e

echo "🚀 Star Wars Universe - Remote Deployment"
echo "=========================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Prüfe ob GHCR_TOKEN gesetzt ist
if [ -z "$GHCR_TOKEN" ]; then
    echo -e "${RED}❌ Fehler: GHCR_TOKEN Umgebungsvariable nicht gesetzt${NC}"
    exit 1
fi

# Validiere dass .env.production existiert
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Fehler: .env.production Datei nicht gefunden${NC}"
    exit 1
fi

echo -e "${BLUE}Schritt 1: Login zu GitHub Container Registry${NC}"
echo "$GHCR_TOKEN" | docker login ghcr.io -u swuniverse --password-stdin
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ GHCR Login erfolgreich${NC}"
else
    echo -e "${RED}❌ GHCR Login fehlgeschlagen${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}Schritt 2: Neue Images von GHCR pullen${NC}"
docker compose -f docker-compose.prod.yml pull
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Images erfolgreich gepullt${NC}"
else
    echo -e "${RED}❌ Image Pull fehlgeschlagen${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}Schritt 3: Container neu starten${NC}"
docker compose -f docker-compose.prod.yml up -d
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Container erfolgreich gestartet${NC}"
else
    echo -e "${RED}❌ Container Start fehlgeschlagen${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}Schritt 4: Warten auf Backend-Start (max 60s)${NC}"
for i in {1..60}; do
    if docker compose -f docker-compose.prod.yml exec -T backend curl -f http://localhost:3000/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend ist bereit (${i}s)${NC}"
        echo -e "${GREEN}✅ Datenbank-Migrationen wurden automatisch angewendet${NC}"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "${YELLOW}⚠️  Backend-Health-Check Timeout, aber Container läuft weiter${NC}"
        echo "    Logs prüfen mit: docker compose -f docker-compose.prod.yml logs -f backend"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

echo -e "${BLUE}Schritt 5: Alte Images aufräumen${NC}"
docker image prune -f
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Alte Images entfernt${NC}"
else
    echo -e "${YELLOW}⚠️  Cleanup übersprungen${NC}"
fi
echo ""

echo -e "${BLUE}Schritt 6: Docker-Logout von GHCR${NC}"
docker logout ghcr.io
echo -e "${GREEN}✅ Logout erfolgreich${NC}"
echo ""

echo -e "${GREEN}✅ Deployment erfolgreich abgeschlossen!${NC}"
echo ""
echo "Container Status:"
docker compose -f docker-compose.prod.yml ps
echo ""
echo -e "${BLUE}Logs anzeigen:${NC}"
echo "  docker compose -f docker-compose.prod.yml logs -f backend"
echo "  docker compose -f docker-compose.prod.yml logs -f frontend"
echo ""
echo -e "${YELLOW}=== SEEDS AUSFUEHREN (nur nach Schema-Aenderungen!) ===${NC}"
echo ""
echo "  Alle Seeds automatisch ausfuehren (erkennt alle seed-*.ts Dateien):"
echo "  docker compose -f docker-compose.prod.yml exec backend sh scripts/run-all-seeds.sh"
echo ""
echo "  Einzelne Seeds manuell:"
echo "  docker compose -f docker-compose.prod.yml exec backend npx tsx scripts/seed-factions.ts"
echo "  docker compose -f docker-compose.prod.yml exec backend npx tsx scripts/seed-building-types.ts"
echo "  docker compose -f docker-compose.prod.yml exec backend npx tsx scripts/seed-research-types.ts"
echo "  docker compose -f docker-compose.prod.yml exec backend npx tsx prisma/seed-modules.ts"
