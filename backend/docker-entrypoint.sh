#!/bin/sh
# Entrypoint script for backend container
# Constructs DATABASE_URL from POSTGRES_PASSWORD to ensure synchronization

set -e

# URL encode function
urlencode() {
    local string="$1"
    local encoded=""
    local i
    
    for i in $(seq 0 $((${#string} - 1))); do
        local c="${string:$i:1}"
        case "$c" in
            [-_.~a-zA-Z0-9]) echo -n "$c" ;;
            *) printf "%%%02x" "'$c" ;;
        esac
    done
}

# If DATABASE_URL is not set, construct it from POSTGRES_PASSWORD
if [ -z "$DATABASE_URL" ]; then
    if [ -z "$POSTGRES_PASSWORD" ]; then
        echo "ERROR: Either DATABASE_URL or POSTGRES_PASSWORD must be set"
        exit 1
    fi
    
    ENCODED_PASSWORD=$(urlencode "$POSTGRES_PASSWORD")
    export DATABASE_URL="postgresql://postgres:${ENCODED_PASSWORD}@postgres:5432/swholo_game?schema=public"
    
    echo "ℹ️  DATABASE_URL constructed from POSTGRES_PASSWORD"
    echo "ℹ️  DATABASE_URL: postgresql://postgres:***@postgres:5432/swholo_game?schema=public"
fi

# Run migrations and start the app
echo "ℹ️  Applying database migrations..."
npx prisma migrate deploy || {
    echo "⚠️  Migrations failed or already applied"
}

echo "ℹ️  Starting backend server..."
exec node dist/index.js
