#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
DATABASE_URL="postgresql://invoiceme:invoiceme@localhost:6010/invoiceme" npx tsx scripts/manage-users.ts
