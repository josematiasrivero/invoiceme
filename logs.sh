#!/usr/bin/env bash
set -euo pipefail

docker compose -f docker-compose.server.yml logs -f "$@"
