#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
container="ll-rank-private-$$"
cleanup() { docker stop "$container" >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker run --rm -d --name "$container" -e POSTGRES_PASSWORD=localtest postgres:17-alpine >/dev/null
for attempt in {1..30}; do
  if docker exec "$container" pg_isready -U postgres >/dev/null 2>&1; then break; fi
  sleep 1
done
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres < "$repo_root/scripts/fixtures/ranking-internacional-schema.sql"
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres < "$repo_root/docs/sql/carreira-internacional-rank-colunas-proposta.sql"
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres < "$repo_root/scripts/fixtures/ranking-internacional-checks.sql"
