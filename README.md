# Task Flow

A modern full-stack task management starter built with **Next.js + Fastify + PostgreSQL + Prisma**.  
Includes auth (access + refresh), projects, and a kanban-style task board.

---

## Tech Stack
- Web: Next.js (App Router), Tailwind CSS
- API: Fastify
- DB: PostgreSQL (Docker)
- ORM: Prisma
- Monorepo: pnpm workspaces

---

## Prerequisites
- **Node.js 20.x** (recommended via `nvm`)
- **pnpm** (via `corepack`)
- **Docker Desktop** (for PostgreSQL)

---

# Quick Start (One Bash)

Run this from your terminal (macOS/Linux):

```bash
bash -lc '
set -euo pipefail

REPO="$HOME/Task-Flow"
[ -f "$REPO/package.json" ] || REPO="$HOME/Desktop/Task-Flow"
cd "$REPO"

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install 20.20.0 >/dev/null 2>&1 || true
nvm use 20.20.0 >/dev/null

corepack enable >/dev/null 2>&1 || true
corepack prepare pnpm@9.15.9 --activate >/dev/null 2>&1 || true

[ -f .env ] || [ ! -f .env.example ] || cp .env.example .env
[ -f apps/api/.env ] || [ ! -f apps/api/.env.example ] || cp apps/api/.env.example apps/api/.env
printf "NEXT_PUBLIC_API_URL=http://localhost:4000\n" > apps/web/.env

docker compose up -d db >/dev/null 2>&1 || true
for i in $(seq 1 60); do docker inspect --format="{{.State.Health.Status}}" taskflow_db 2>/dev/null | grep -q healthy && break; sleep 1; done

pnpm install
pnpm --filter api prisma:deploy
pnpm --filter api prisma:generate
pnpm --filter api prisma:seed || true

for port in 3000 4000; do
  pid=$(lsof -ti :$port 2>/dev/null || true)
  [ -n "$pid" ] && kill -9 $pid 2>/dev/null || true
done

pnpm --filter api dev > /tmp/taskflow_api.log 2>&1 & API_PID=$!
pnpm --filter web dev > /tmp/taskflow_web.log 2>&1 & WEB_PID=$!

for i in $(seq 1 120); do curl -sf http://localhost:4000/health >/dev/null && break; sleep 0.25; done
for i in $(seq 1 120); do curl -sf http://localhost:3000 >/dev/null && break; sleep 0.25; done

echo "Web:  http://localhost:3000"
echo "API:  http://localhost:4000"
echo "Docs: http://localhost:4000/docs"
echo "Login: admin@taskflow.local / admin123"
echo "Logs: tail -n 200 /tmp/taskflow_api.log && tail -n 200 /tmp/taskflow_web.log"

trap "kill $API_PID $WEB_PID 2>/dev/null || true" INT TERM EXIT
wait
'
