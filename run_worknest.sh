set -euo pipefail

if [[ -d WorkNest && ! -f package.json ]]; then
  cd WorkNest
fi

node -v
docker -v

corepack enable
corepack prepare pnpm@9.0.0 --activate
pnpm -v

[ -f .env ] || cp .env.example .env
[ -f apps/api/.env ] || cp apps/api/.env.example apps/api/.env
[ -f apps/web/.env ] || cp apps/web/.env.example apps/web/.env

(docker compose version >/dev/null 2>&1 && docker compose up -d db) || docker-compose up -d db

pnpm install
pnpm --filter api prisma:deploy
pnpm --filter api prisma:generate
pnpm dev
