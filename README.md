# Star Wars Universe

Ein tick-basiertes Strategie-Browserspiel im Star Wars Universum.

🌐 **Live:** https://swuniverse.net

## Überblick

- **Fraktionen**: Galaktisches Imperium & Rebellenallianz
- **Gameplay**: Planeten kolonisieren, Gebäude errichten, Schiffe bauen, Forschung betreiben
- **Comnet**: Galaxieweites RP-Forum

## 🚀 Development

### Schnellstart
1. **Repository klonen**
2. **Services starten:** `devenv up`
3. **Datenbank initialisieren:** `cd backend && npm run db:reset`
4. **Admin-Code generieren:** `npm run seed:admin`
5. **Spiel öffnen:** http://localhost:5173

**Voraussetzungen:** [Nix](https://nixos.org/download.html) + [devenv](https://devenv.sh/)

### Nützliche Befehle
- **Database reset:** `cd backend && npm run db:reset`
- **Admin Code:** `npm run seed:admin`

## 🚀 Production

### Voraussetzungen
- **Docker & Docker Compose** installiert
- **Git** für Repository-Kloning
- **Domain** mit DNS-Konfiguration auf Server-IP
- **GitHub Container Registry Zugang** (GHCR_TOKEN)

### Erster Rollout
1. **Repository setup:** `git clone https://github.com/swuniverse/core.git && cd core`
2. **Environment konfigurieren:** `bash .env.production.setup.sh`
3. **Vollständiges Deployment:** `bash setup-production.sh`
4. **Domain im Caddyfile anpassen:** Domain in `Caddyfile` ändern
5. **SSL-Setup:** Reverse proxy setup siehe [CADDY.md](CADDY.md)

### Datenbank Seeding
```bash
# Vollständiges DB Reset + Seeding (nur bei Erstinstallation)
docker compose -f docker-compose.prod.yml exec backend npm run db:reset

# Einzelne Seeding-Optionen
docker compose -f docker-compose.prod.yml exec backend npm run seed:factions
docker compose -f docker-compose.prod.yml exec backend npm run seed:buildings
docker compose -f docker-compose.prod.yml exec backend npm run seed:research
```

### Wichtige Befehle
- **Services starten:** `docker compose -f docker-compose.prod.yml up -d`
- **Services stoppen:** `docker compose -f docker-compose.prod.yml down`
- **Logs verfolgen:** `docker compose -f docker-compose.prod.yml logs -f backend`
- **Health Check:** `curl http://localhost:3000/health`
- **Updates deployen:** `./deploy-remote.sh`

### Troubleshooting
- **Container Status:** `docker compose -f docker-compose.prod.yml ps`
- **Logs:** `docker compose -f docker-compose.prod.yml logs [service]`
- **Database Verbindung:** `.env.production` Einstellungen prüfen
- **SSL/Domain:** [CADDY.md](CADDY.md) Konfiguration prüfen

## Tech Stack

**Backend:** Node.js + TypeScript + PostgreSQL + Redis + Socket.io
**Frontend:** React + TypeScript + Tailwind + Zustand

## License

MIT