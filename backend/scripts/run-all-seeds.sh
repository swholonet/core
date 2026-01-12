#!/bin/sh
# Script to run all seed files automatically
# Usage: sh scripts/run-all-seeds.sh

set -e

echo "================================"
echo "Running All Seed Scripts"
echo "================================"

# Priority seeds - these run first (factions must exist before other seeds)
PRIORITY_SEEDS="scripts/seed-factions.ts"

for seed in $PRIORITY_SEEDS; do
    if [ -f "$seed" ]; then
        echo ""
        echo "🌱 Running priority seed: $seed"
        npx tsx "$seed" || echo "⚠️  $seed failed"
    fi
done

# Auto-discover and run all other seed-*.ts files in scripts/
echo ""
echo "Discovering seed scripts in scripts/..."
for seed in scripts/seed-*.ts; do
    # Skip if no matches
    [ -f "$seed" ] || continue
    # Skip priority seeds (already run)
    case "$PRIORITY_SEEDS" in
        *"$seed"*) continue ;;
    esac
    echo ""
    echo "🌱 Running: $seed"
    npx tsx "$seed" || echo "⚠️  $seed failed"
done

# Auto-discover and run all seed-*.ts files in prisma/
echo ""
echo "Discovering seed scripts in prisma/..."
for seed in prisma/seed-*.ts; do
    [ -f "$seed" ] || continue
    echo ""
    echo "🌱 Running: $seed"
    npx tsx "$seed" || echo "⚠️  $seed failed"
done

echo ""
echo "================================"
echo "✅ All seeds completed!"
echo "================================"
