set -euo pipefail
cd "/Users/alok/Desktop/Task Flow"

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install 20.20.0 >/dev/null
nvm use 20.20.0 >/dev/null
hash -r

corepack enable >/dev/null 2>&1 || true
corepack prepare pnpm@9.15.9 --activate >/dev/null 2>&1 || true
hash -r

pnpm install

docker rm -f taskflow_db >/dev/null 2>&1 || true
docker compose up -d db

pnpm --filter api prisma:deploy
pnpm --filter api prisma:generate

pnpm lint
pnpm typecheck
pnpm test
pnpm build

pnpm --filter api dev & API_PID=$!
pnpm --filter web dev & WEB_PID=$!

trap 'kill $API_PID $WEB_PID 2>/dev/null || true' INT TERM EXIT
wait
