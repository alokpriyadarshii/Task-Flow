set -euo pipefail

open -a Docker >/dev/null 2>&1 || true
until docker info >/dev/null 2>&1; do sleep 2; done

(docker compose version >/dev/null 2>&1 && docker compose up -d db) || docker-compose up -d db

[ -f .env ] || cp .env.example .env
[ -f apps/api/.env ] || cp apps/api/.env.example apps/api/.env
[ -f apps/web/.env ] || cp apps/web/.env.example apps/web/.env

perl -pi -e 's/"pipeline":/"tasks":/' turbo.json

grep -RIl "module\.exports" apps/web | while read -r f; do mv "$f" "${f%.*}.cjs"; done

perl -pi -e 's/ADD CONSTRAINT IF NOT EXISTS/ADD CONSTRAINT/g' apps/api/prisma/migrations/*/migration.sql || true

command -v pnpm >/dev/null 2>&1 || npm i -g pnpm@9

pnpm -v
pnpm install

pnpm --filter api add fastify@^5 @fastify/cors@^11 @fastify/swagger-ui@^5 fastify-plugin >/dev/null 2>&1 || true
pnpm --filter api add -D pino-pretty >/dev/null 2>&1 || true

pnpm --filter api prisma:deploy
pnpm --filter api prisma:generate

pnpm dev
