#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p /mnt/data/apps/invoiceme/postgres
docker compose -f docker-compose.server.yml build
docker compose -f docker-compose.server.yml up -d
