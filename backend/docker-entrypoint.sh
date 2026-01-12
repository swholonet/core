#!/bin/sh
# Entrypoint script for backend container
# Constructs DATABASE_URL from POSTGRES_PASSWORD to ensure synchronization

set -e

echo "================================"
echo "🚀 Backend Entrypoint"
echo "================================"

# Debug: Show environment variables
echo ""
echo "Environment Variables:"
echo "  NODE_ENV: $NODE_ENV"
echo "  PORT: $PORT"
echo "  DATABASE_URL: ${DATABASE_URL:-(not set)}"
echo "  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:+(set)}"
echo "  POSTGRES_HOST: ${POSTGRES_HOST:-postgres}"
echo ""

# If DATABASE_URL is already set, use it (prefer explicit over constructed)
if [ -n "$DATABASE_URL" ]; then
    echo "✅ Using provided DATABASE_URL"
else
    # Try to construct from POSTGRES_PASSWORD
    if [ -n "$POSTGRES_PASSWORD" ]; then
        # Use environment variables for host/port or defaults
        POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
        POSTGRES_PORT="${POSTGRES_PORT:-5432}"
        
        # Use Node.js to properly URL-encode the password (sh-compatible)
        ENCODED_PASSWORD=$(node -e "console.log(encodeURIComponent('$POSTGRES_PASSWORD'))")
        
        export DATABASE_URL="postgresql://postgres:${ENCODED_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/swholo_game?schema=public"
        echo "✅ DATABASE_URL constructed from POSTGRES_PASSWORD"
        echo "   postgresql://postgres:***@${POSTGRES_HOST}:${POSTGRES_PORT}/swholo_game?schema=public"
    else
        echo "❌ ERROR: Neither DATABASE_URL nor POSTGRES_PASSWORD is set!"
        echo ""
        echo "Please ensure .env.production is properly loaded with:"
        echo "  - DATABASE_URL or"
        echo "  - POSTGRES_PASSWORD"
        exit 1
    fi
fi

echo ""
echo "================================"
echo "Applying Migrations"
echo "================================"

# Run migrations
if npx prisma migrate deploy; then
    echo "✅ Migrations applied successfully"
else
    echo "⚠️  Migrations failed or already applied"
fi

# Check if seeding is requested (set RUN_SEEDS=true in environment)
if [ "$RUN_SEEDS" = "true" ]; then
    echo ""
    echo "================================"
    echo "Running Seed Scripts"
    echo "================================"

    # Priority seeds - these run first in order (factions must exist before other seeds)
    PRIORITY_SEEDS="scripts/seed-factions.ts"

    for seed in $PRIORITY_SEEDS; do
        if [ -f "$seed" ]; then
            echo "🌱 Running priority seed: $seed"
            npx tsx "$seed" || echo "⚠️  $seed failed"
        fi
    done

    # Auto-discover and run all other seed-*.ts files in scripts/
    echo ""
    echo "Discovering seed scripts in scripts/..."
    for seed in scripts/seed-*.ts; do
        # Skip if no matches (glob returns literal pattern)
        [ -f "$seed" ] || continue
        # Skip priority seeds (already run)
        case "$PRIORITY_SEEDS" in
            *"$seed"*) continue ;;
        esac
        echo "🌱 Running: $seed"
        npx tsx "$seed" || echo "⚠️  $seed failed"
    done

    # Auto-discover and run all seed-*.ts files in prisma/
    echo ""
    echo "Discovering seed scripts in prisma/..."
    for seed in prisma/seed-*.ts; do
        [ -f "$seed" ] || continue
        echo "🌱 Running: $seed"
        npx tsx "$seed" || echo "⚠️  $seed failed"
    done

    echo ""
    echo "✅ Seeding complete"
fi

echo ""
echo "================================"
echo "Starting Backend Server"
echo "================================"

exec node dist/index.js
