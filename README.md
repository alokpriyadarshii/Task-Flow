# TaskFlow

---

`set -euo pipefail`

## 1) Go to project folder (adjust if you're already there)

---

`cd "Task Flow"`

## 2) Use the right Node + pnpm (nvm + corepack)

---

`export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; nvm install 20.20.0 >/dev/null; nvm use 20.20.0 >/dev/null; corepack enable >/dev/null 2>&1 || true; corepack prepare pnpm@9.15.9 --activate >/dev/null 2>&1 || true`

## 3) Install deps

---

`pnpm install`

## 4) Start DB + Prisma (migrate + generate + seed)

---

`docker rm -f taskflow_db >/dev/null 2>&1 || true; docker compose up -d db; for i in $(seq 1 60); do docker inspect --format='{{.State.Health.Status}}' taskflow_db 2>/dev/null | grep -q healthy && break; sleep 1; done; pnpm --filter api prisma:deploy; pnpm --filter api prisma:generate; pnpm --filter api prisma:seed`

## 5) Run checks

---

`pnpm lint && pnpm typecheck && pnpm test && pnpm build`

## 6) Start servers in background

---

`pnpm --filter api dev > /tmp/taskflow_api.log 2>&1 & API_PID=$!; pnpm --filter web dev > /tmp/taskflow_web.log 2>&1 & WEB_PID=$!; trap 'kill $API_PID $WEB_PID 2>/dev/null || true' EXIT INT TERM`

## 7) Wait until ready + quick demo

---

`until curl -sf http://127.0.0.1:4000/health >/dev/null; do sleep 0.2; done; until curl -sf http://127.0.0.1:3000 >/dev/null; do sleep 0.2; done; echo "== api health =="; curl -s http://127.0.0.1:4000/health; echo; echo "== api root =="; curl -s http://127.0.0.1:4000/; echo; echo "== docs =="; curl -s http://127.0.0.1:4000/docs 2>/dev/null | head; echo; echo "Web:  http://localhost:3000"; echo "API:  http://localhost:4000"; echo "Docs: http://localhost:4000/docs"`
