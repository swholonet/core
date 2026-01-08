#!/bin/sh
# Frontend Docker Entrypoint - Inject environment variables at runtime

set -e

# Default values
VITE_API_URL="${VITE_API_URL:-http://localhost:3000}"

echo "🚀 Frontend Container Starting..."
echo "📡 API URL: $VITE_API_URL"

# Create a simple inline script that will be injected into index.html
# This script runs before React loads and sets the API URL
cat > /app/dist/__env.js << EOF
window.__VITE_API_URL__ = '$VITE_API_URL';
EOF

# Inject the script into index.html - add it right after <head>
if [ -f /app/dist/index.html ]; then
    sed -i "/<head>/a\\    <script src=\"/__env.js\"><\/script>" /app/dist/index.html
    echo "✅ API URL injected into index.html"
else
    echo "⚠️  Warning: index.html not found"
fi

echo "✅ Container ready"

# Start the server
exec serve -s dist -l 3000
