#!/usr/bin/env bash
set -euo pipefail

# Ensure the postgres data directory exists
mkdir -p /mnt/data/apps/invoiceme/postgres

# Build and start the environment
docker compose up --build -d

