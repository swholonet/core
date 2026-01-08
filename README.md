# Star Wars - HoloNet

Ein tick-basiertes Strategie-Browserspiel im Star Wars Universum.

🌐 **Live:** https://swholo.net

## Überblick

- **Fraktionen**: Galaktisches Imperium & Rebellenallianz
- **Planeten**: Kolonisierung und Ressourcenmanagement
- **Gebäude**: 11 Typen mit Echtzeit-Konstruktion
- **Schiffe**: 14 Schiffstypen, Navigation und Flotten
- **Forschung**: Tech-Tree System
- **Comnet**: Galaxieweites RP-Forum
- **Tick-System**: Ressourcenproduktion zu festen Uhrzeiten (12:00, 15:00, 18:00, 21:00, 00:00)

## 🚀 Development

### Schnellstart
1. **Repository klonen**
2. **Services starten:** `devenv up`
3. **Datenbank initialisieren:** `cd backend && npm run db:reset`
4. **Admin-Code generieren:** `npm run seed:admin`
5. **Spiel öffnen:** http://localhost:5173

**Voraussetzungen:** [Nix](https://nixos.org/download.html) + [devenv](https://devenv.sh/)

## 🐳 Production Deployment

```bash
# 1. Build Docker images
./deploy.sh

# 2. Configure environment
cp .env.production.example .env.production
# Edit .env.production with your secrets

# 3. Start containers
docker compose -f docker-compose.prod.yml up -d
```

**Detaillierte Anleitung:** [DEPLOYMENT.md](DEPLOYMENT.md)

## Tech Stack

- **Backend:** Node.js + TypeScript + PostgreSQL + Redis + Socket.io
- **Frontend:** React + TypeScript + Tailwind + Zustand
- **Dev:** devenv (Nix) + Docker

## License

MIT
