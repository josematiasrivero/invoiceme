#!/usr/bin/env bash
set -euo pipefail

# Ensure the postgres data directory exists
mkdir -p /mnt/data/apps/invoiceme/postgres

# Build and start the environment
docker compose up --build -d

echo ""
echo "InvoiceMe is starting..."
echo "  App:      http://localhost:6000"
echo "  pgweb:    http://localhost:6011"
echo "  Postgres: localhost:5432"
echo ""
echo "To seed the database, run:"
echo "  docker compose exec app npx prisma db seed"
echo ""
echo "To view logs:"
echo "  docker compose logs -f"
