#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

if [ ! -f .env ]; then
  echo "FATAL: .env file not found at $PROJECT_DIR/.env"
  exit 1
fi

source .env

MONGODUMP_FILE="/tmp/managr-dump-$(date +%Y%m%d-%H%M%S).archive"
trap 'rm -f "$MONGODUMP_FILE"' EXIT

echo "=========================================="
echo " Migrate: MongoDB 4.4 → 8.3 (managr DB)"
echo "=========================================="
echo ""

echo "1. Dump 'managr' database from MongoDB 4.4..."
docker compose exec -T mongo mongodump \
  -u root -p "$MONGODB_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --db managr \
  --archive > "$MONGODUMP_FILE"

DUMP_SIZE=$(stat -c%s "$MONGODUMP_FILE" 2>/dev/null || stat -f%z "$MONGODUMP_FILE" 2>/dev/null)
echo "   Dump size: $((DUMP_SIZE / 1024)) KB"

echo "2. Restore into MongoDB 8.3..."
docker compose exec -T mongo-managr mongorestore \
  -u root -p "$MONGODB_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --db managr \
  --drop \
  --archive < "$MONGODUMP_FILE"

echo "3. Verify..."
COLLECTIONS=$(docker compose exec -T mongo-managr mongosh --quiet \
  -u root -p "$MONGODB_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --eval "db.getSiblingDB('managr').getCollectionNames().length")

echo "   Collections in new managr DB: $COLLECTIONS"
echo ""
echo "=========================================="
echo " Migration complete."
echo "=========================================="
echo ""
echo "Next steps:"
echo "  docker compose up -d managr-api"
