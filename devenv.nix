{ pkgs, lib, config, inputs, ... }:

{
  # https://devenv.sh/basics/
  env.GREET = "Star Wars Universe Dev Environment";

  # https://devenv.sh/packages/
  packages = [ 
    pkgs.git
    pkgs.nodejs_20
    pkgs.postgresql_15
    pkgs.python3
    pkgs.python3Packages.pillow
  ];

  # https://devenv.sh/languages/
  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_20;
    npm.enable = true;
  };

  languages.typescript.enable = true;

  # https://devenv.sh/processes/
  processes = {
    backend.exec = "cd backend && npm run dev";
    frontend.exec = "cd frontend && NODE_OPTIONS='--max-old-space-size=8192' npm run dev";
  };

  # https://devenv.sh/services/
  services.postgres = {
    enable = true;
    package = pkgs.postgresql_15;
    initialDatabases = [
      { name = "swuniverse_game"; }
    ];
    listen_addresses = "127.0.0.1";
    port = 5432;
    initialScript = ''
      CREATE USER postgres WITH PASSWORD 'postgres' SUPERUSER;
    '';
  };

  services.redis = {
    enable = true;
    port = 6379;
  };

  # https://devenv.sh/scripts/
  scripts.wait-for-db.exec = ''
    echo "Waiting for PostgreSQL to be ready..."
    max_attempts=30
    attempt=0
    
    # Try to find the socket directory
    socket_dir=""
    if [ -n "$PGHOST" ]; then
      socket_dir="$PGHOST"
    fi
    
    while [ $attempt -lt $max_attempts ]; do
      # Try connection via psql
      if psql -h localhost -p 5432 -U postgres -d swuniverse_game -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✓ PostgreSQL is ready!"
        exit 0
      fi
      attempt=$((attempt + 1))
      echo "Attempt $attempt/$max_attempts: Waiting for PostgreSQL..."
      sleep 1
    done
    echo "✗ PostgreSQL did not become ready in time"
    exit 1
  '';

  scripts.setup.exec = ''
    echo "Setting up Star Wars Universe development environment..."
    echo ""
    echo "⚠️  Make sure 'devenv up' is running in another terminal first!"
    echo "   Press Ctrl+C to cancel, or wait 5 seconds to continue..."
    sleep 5
    echo ""
    
    # Wait for PostgreSQL
    wait-for-db
    
    cd backend
    cp .env.example .env 2>/dev/null || true
    npm install
    npx prisma generate
    npx prisma migrate dev --name init
    echo "Note: Use 'reset-db' script for seeding (backend/scripts/reset-and-seed.ts)"
    cd ../frontend
    npm install
    echo ""
    echo "✨ Setup complete!"
    echo "After backend starts, run: curl -X POST http://localhost:3000/api/galaxy/initialize"
  '';

  scripts.init-galaxy.exec = ''
    echo "Initializing galaxy and start planets..."
    curl -X POST http://localhost:3000/api/galaxy/initialize
  '';

  scripts.migrate.exec = ''
    cd backend
    npx prisma migrate dev
  '';

  scripts.studio.exec = ''
    cd backend
    npx prisma studio
  '';

  scripts.reset-db.exec = ''
    cd backend
    npx tsx scripts/reset-and-seed.ts
  '';

  enterShell = ''
    echo "🚀 $GREET"
    echo ""
    echo "Available commands:"
    echo "  devenv up        - Start all services (backend, frontend, postgres, redis)"
    echo "  setup            - Initial setup (install deps, migrate) - requires 'devenv up' running!"
    echo "  wait-for-db      - Wait until PostgreSQL is ready"
    echo "  migrate          - Run database migrations"
    echo "  studio           - Open Prisma Studio"
    echo "  reset-db         - Reset & seed DB (factions, buildings, research, ships, galaxy)"
    echo ""
    echo "Services:"
    echo "  PostgreSQL:      localhost:5432 (user: postgres, pass: postgres, db: swuniverse_game)"
    echo "  Redis:           localhost:6379"
    echo "  Backend API:     http://localhost:3000"
    echo "  Frontend:        http://localhost:5173"
    echo ""
    echo "Features:"
    echo "  ✅ 8 Resource Types (Credits, Durastahl, Kristall, Energie, etc.)"
    echo "  ✅ 36 Research Technologies (4 levels, 4 categories)"
    echo "  ✅ 14 Ship Types (TIE Fighter to Mon Calamari Cruiser)"
    echo "  ✅ Building System (11 types, energy management)"
    echo "  ✅ Galaxy Map (50x50 sectors, multi-level navigation)"
    echo "  ✅ Real-time Updates (Socket.io for buildings, research, ships)"
    echo ""
  '';

  # https://devenv.sh/pre-commit-hooks/
  # pre-commit.hooks.shellcheck.enable = true;

  # See full reference at https://devenv.sh/reference/options/
}
