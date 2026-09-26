#!/usr/bin/env bash
set -euo pipefail
psql "$DATABASE_URL" -f ./db/migrations/001_init.sql
psql "$DATABASE_URL" -f ./db/seeds/001_products.sql
echo "Seed completed"
