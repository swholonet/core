# Star Wars Universe - Strategy Browser Game

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A tick-based strategy browser game set in the Star Wars Universe, inspired by [Star Trek Universe (STU)](https://stuniverse.de).

## 🌟 Features

### ✅ Implemented
- **Authentication**: Invite-code based registration, JWT login
- **Faction System**: Galactic Empire & Rebel Alliance
- **Resource Management**: Credits, Metal, Crystal, Energy with production rates
- **Planet Management**: STU-style 10x10 grid with 3 layers
  - Layer 1 (ORBIT): Rows 0-1, SPACE fields for space stations
  - Layer 2 (SURFACE): Rows 2-7, LAND/WATER/MOUNTAIN fields for buildings
  - Layer 3 (UNDERGROUND): Rows 8-9, ROCK/CRYSTAL/METAL fields for mines
- **Building System**: 11 building types with real-time construction
  - Basic: Command Center, Solar Plant, Metal Mine, Crystal Harvester, Warehouse, Trade Hub
  - Advanced: Shipyard, Research Lab, Defense Grid, Refinery, Hangar
  - Categorized build menu (Infrastructure, Resources, Production, Military, Research)
  - Energy-dependent activation with auto-deactivation
  - 50% refund on demolish/cancel
- **Research System**: Tech tree with prerequisites
  - Level 0: Resource-based research (no labs required)
  - Level 1+: Research Points-based (requires Research Labs)
  - Unlocks buildings and ship types
- **Ship Construction**: 14 ship types across 7 classes
  - Fighter, Bomber, Frigate, Cruiser, Battlecruiser, Battleship, Dreadnought
  - Build queue in Shipyard with progress tracking
  - TIE Fighters to Mon Calamari Cruisers
- **Ship Navigation**: STU-style real-time movement system
  - Dual energy system (weapons + drive)
  - Real-time movement processing (1s interval)
  - Sensor-based fog of war (sensorRange determines visibility)
  - Drive efficiency affects energy consumption
  - Ships can strand when energy runs out
  - Status tracking: DOCKED, IN_FLIGHT, STRANDED
- **Galaxy Map**: Multi-level hierarchical navigation
  - 6x6 sectors (36 total)
  - 20x20 fields per sector (120x120 galaxy)
  - System layer between sector and planet
  - ~450 systems with ~1360 planets
  - System types: SINGLE_STAR (90%), BINARY_STAR (8%), NEUTRON_STAR (1.5%), BLACK_HOLE (0.5%)
  - Orbital planet visualization
- **Real-time Updates**: Socket.io events
  - Building completion
  - Resource updates
  - Research progress
  - Ship construction
  - Ship movement and arrival
- **Storage System**: Capacity limits, expandable with Warehouses
- **Tick System**: 60-second intervals for resource production
- **Background Services**:
  - Building Completion (10s check)
  - Research Progress (10s check)
  - Ship Building (10s check)
  - Ship Movement (1s real-time processing)
- **Settings**: Username/password change, invite code generation

### 🚧 Planned
- Building upgrades (levels 2-10)
- Fleet grouping and formations
- Combat system
- Trading system
- Alliances

## 🚀 Quick Start

This project uses **devenv** (Nix-based development environment) to manage all services.

### Prerequisites
- [Nix package manager](https://nixos.org/download.html) installed
- [devenv](https://devenv.sh/) installed

### Installation

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd swu
```

2. **Start all services with devenv:**
```bash
devenv up
```

This single command starts:
- PostgreSQL 15 (port 5432)
- Redis 7 (port 6379)
- Backend API (port 3000)
- Frontend dev server (port 5173)

All services run with auto-reload enabled. Code changes are picked up automatically.

3. **Initialize the database** (first time only, in a new terminal):
```bash
cd backend
npm run db:reset
```

This creates the schema, runs migrations, seeds factions/buildings/research types, and generates the galaxy.

4. **Generate an admin invite code:**
```bash
cd backend
npm run seed:admin
```

5. **Open the game:**
- Navigate to http://localhost:5173
- Register with the invite code
- Generate more invite codes in Settings

### Important Notes
- **DO NOT** manually start backend/frontend with npm/node commands
- **DO NOT** try to kill or restart processes manually
- `devenv up` handles all hot-reloading automatically
- Stop all services with Ctrl+C on the `devenv up` process
- Restart `devenv up` only for fundamental config changes (schema.prisma, devenv.nix)

## 🛠 Tech Stack

**Backend:**
- Node.js 20 + TypeScript + Express
- PostgreSQL 15 + Prisma ORM
- Redis 7 (caching)
- Socket.io (real-time)
- JWT authentication (bcrypt)

**Frontend:**
- React 18 + TypeScript + Vite 6
- Tailwind CSS
- Zustand (state management)
- Socket.io Client

**Development:**
- devenv (Nix-based unified dev environment)
- Prisma Migrate

## 📁 Project Structure

```
backend/
  src/
    index.ts              # Express server + Socket.io + service initialization
    routes/               # API endpoints (auth, planet, galaxy, ship, etc.)
    services/             # Business logic
      ├── tickSystem.ts            # Resource production (60s)
      ├── buildingCompletionService.ts  # Building checks (10s)
      ├── researchService.ts       # Research progress (10s)
      ├── shipMovementService.ts   # Real-time ship movement (1s)
      └── galaxyService.ts         # Galaxy/planet generation
    middleware/           # Auth middleware
    socket/               # Socket.io event handlers
  prisma/
    schema.prisma         # Database schema
    migrations/           # Database migrations
  scripts/
    reset-and-seed.ts     # Complete DB reset + seed

frontend/
  src/
    pages/                # React pages (Dashboard, Planet, Galaxy, Ship, Fleet, etc.)
    components/           # Reusable components (BuildMenu, Layout, etc.)
    stores/               # Zustand state management (gameStore)
    lib/                  # API client (Axios + Socket.io)
```

## 🔧 Available Commands

### Database Management (from backend/)
```bash
npm run db:reset      # Complete reset: migrations + seed factions/buildings/research + init galaxy
npm run db:migrate    # Run Prisma migrations only
npm run seed:admin    # Generate admin invite code
```

### Development
```bash
devenv up             # Start all services (PostgreSQL, Redis, backend, frontend)
# Press Ctrl+C to stop all services
```

**Note:** Do not use `npm run dev` manually. `devenv up` handles everything.

## ⚙️ Game Mechanics

### Dual Time System

1. **Tick System** (`tickSystem.ts`): Runs every 60 seconds
   - Processes resource production (credits, metal, crystal)
   - Checks energy balance and auto-deactivates buildings if negative
   - NOT used for building completion

2. **Building Completion Service** (`buildingCompletionService.ts`): Runs every 10 seconds
   - Checks `constructionStartedAt + buildTime` (in MINUTES)
   - Real-time completion detection
   - Emits Socket.io `building:completed` event

3. **Ship Movement Service** (`shipMovementService.ts`): Runs every 1 second
   - Real-time ship movement processing
   - Energy consumption based on drive efficiency
   - Ships strand when energy depleted
   - Emits `ship:moved`, `ship:arrived`, `ship:stranded` events

### Resources & Economy

- **Credits**: Main currency, from Command Center (100/tick) and Trade Hub (50/tick)
- **Metal**: From Metal Mine (30/tick), costs 10 energy
- **Crystal**: From Crystal Harvester (20/tick), costs 15 energy
- **Energy**: From Solar Plant (50 production), consumed by active buildings
- **Storage**: Base 1000, +500 per Warehouse

### Planet Layout (STU-Style)

- 10 columns × 10 rows
- 3 distinct layers with visual separation:
  - **ORBIT** (rows 0-1): Space stations, orbital facilities (SPACE fields)
  - **SURFACE** (rows 2-7): Main buildings (LAND/WATER/MOUNTAIN fields)
  - **UNDERGROUND** (rows 8-9): Resource mines (ROCK/CRYSTAL/METAL fields)

### Building System

- `buildTime` in schema is in **MINUTES** (real-time, not ticks)
- Construction starts on placement, calculates completion via timestamp
- Frontend displays countdown timers in minutes/seconds
- 50% refund on demolish/cancel
- Energy-dependent activation with auto-deactivation when energy negative

### Building Times (Minutes)

- Command Center: 0 (instant, starter building)
- Solar Plant, Warehouse: 5
- Metal Mine: 10
- Crystal Harvester, Trade Hub, Defense Grid: 15
- Refinery: 18
- Shipyard: 20
- Research Lab: 25
- Hangar: 12

### Ship Navigation System

- **Dual Energy System**:
  - `energyWeapons`: For combat (not yet implemented)
  - `energyDrive`: For movement, consumed based on distance and efficiency
- **Movement**:
  - Real-time processing every 1 second
  - Energy cost: `distance / driveEfficiency` per step
  - Ships move 1 field/second toward destination
  - Status: DOCKED (at planet), IN_FLIGHT (moving), STRANDED (no energy)
- **Sensor View**:
  - Fog of war based on `sensorRange`
  - Grid size: `(sensorRange * 2 + 1) × (sensorRange * 2 + 1)`
  - Shows visible sectors, systems, ships within range
- **Energy Management**:
  - Charge at docked planet (costs planet resources)
  - Max capacity: `maxEnergyDrive` and `maxEnergyWeapons` per ship type

## 🌌 Galaxy System

### Hierarchy

1. **Galaxy**: 6×6 sectors (36 total)
2. **Sector**: 20×20 fields each (120×120 galaxy grid)
3. **System**: Between sector and planet (~8-16 per sector, ~450 total)
4. **Planet**: 1-5 per system (~1360 total)

### System Types

- **SINGLE_STAR**: 90% (single star)
- **BINARY_STAR**: 8% (binary system)
- **NEUTRON_STAR**: 1.5% (neutron star)
- **BLACK_HOLE**: 0.5% (black hole)

### Planet Generation

- Orbital positions with `orbitRadius` and `orbitAngle`
- 6 start planets (3 per faction) with Command Center pre-built
- System type influences planet count and properties

### Navigation

- Galaxy → Sector → System → Planet
- System view shows orbital planets around central star(s)
- Click planet → Planet detail view (10×10 grid)

## 🔬 Research System

### Level 0 (Starter Research)

- No Research Labs required
- Resource-based: `requiredMetalTotal`, `requiredCrystalTotal`, `requiredCreditsTotal`
- Automatic progress via tick system
- Unlocks basic buildings

### Level 1-3 (Advanced Research)

- Requires Research Labs
- Research Points-based: `requiredResearchPoints`
- Prerequisites: Dependencies on other research
- Unlocks advanced buildings and ships

### Categories

- **Military**: Weapons, shields, ship technologies
- **Economy**: Resource efficiency, trade
- **Energy**: Power plants, energy storage
- **Science**: Research speed, new technologies

## 🔌 Socket.io Events

### Client → Server

- `join:planet` - Join planet room
- `leave:planet` - Leave planet room

### Server → Client

- `building:completed` - Building construction finished
- `resource:updated` - Resources changed (tick processing)
- `energy:depleted` - Energy ran out
- `tick:update` - Tick processed
- `research:progress` - Research progress updated
- `ship:built` - Ship construction completed
- `ship:moved` - Ship position changed
- `ship:arrived` - Ship reached destination
- `ship:stranded` - Ship ran out of energy

## 📝 Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=3000

# Database (automatically managed by devenv)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/swu_game?schema=public"

# Redis (automatically managed by devenv)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Game Settings
TICK_INTERVAL=60000  # 60 seconds in milliseconds
```

## 🗄 Database Schema

### Main Models

- **User & Player**: JWT auth, invite system, player profile with resources
- **Faction**: Empire & Rebel Alliance
- **Galaxy, Sector, System, Planet**: Hierarchical structure
  - 6×6 sectors (36 total)
  - 8-16 systems per sector (~450 total)
  - 1-5 planets per system (~1360 total)
  - Planets with `orbitRadius` and `orbitAngle`
- **PlanetField**: 10×10 grid with 3 layers (ORBIT/SURFACE/UNDERGROUND)
- **BuildingType & Building**: 11 building types with real-time construction progress
- **ResearchType & PlayerResearch**:
  - Level 0: Resource-based research (`requiredMetalTotal`, etc.)
  - Level 1+: Research Points-based with prerequisites
  - Unlocks buildings and ships
- **Fleet, Ship, ShipType**: Fleet system with real-time navigation
  - Dual energy system (weapons + drive)
  - Status tracking (DOCKED/IN_FLIGHT/STRANDED)
  - Sensor range and drive efficiency
- **InviteCode**: Invite-based registration with creator tracking

### Key Features

- **System**: Between Sector and Planet, with `systemType` (SINGLE_STAR, BINARY_STAR, etc.)
- **Planet**: Has `systemId` instead of direct `sectorId`, with orbital parameters
- **fieldLayer**: ORBIT, SURFACE, UNDERGROUND
- **fieldType**: SPACE (orbit), LAND/WATER/MOUNTAIN (surface), ROCK/CRYSTAL/METAL (underground)
- **constructionStartedAt**: Timestamp for real-time building progress
- **storageCapacity**: Resource limit, expandable with Warehouse
- **Ship navigation**: `currentGalaxyX/Y`, `currentSystemX/Y`, `destinationGalaxyX/Y`, energy systems

## 📝 License

MIT

## 👥 Author

Developed with ❤️ for Star Wars fans
