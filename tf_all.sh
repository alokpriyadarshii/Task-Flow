set -euo pipefail

cd "/Users/alok/Desktop/Task Flow"

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install 20.20.0 >/dev/null
nvm use 20.20.0 >/dev/null
hash -r

corepack enable >/dev/null 2>&1 || true
corepack prepare pnpm@9.15.9 --activate >/dev/null
hash -r

echo "✅ node=$(node -v) pnpm=$(pnpm -v)"

node <<'NODE'
const fs = require('fs');

function patchJson(path, mutate) {
  const j = JSON.parse(fs.readFileSync(path, 'utf8'));
  const before = JSON.stringify(j);
  mutate(j);
  const afterObj = JSON.stringify(j);
  if (before !== afterObj) {
    fs.writeFileSync(path, JSON.stringify(j, null, 2) + '\n');
    console.log('patched', path);
  } else {
    console.log('ok', path);
  }
}

patchJson('package.json', (j) => {
  j.packageManager = 'pnpm@9.15.9';
});

patchJson('apps/api/package.json', (j) => {
  j.dependencies ||= {};
  j.dependencies.zod = '^4.3.6';
});

patchJson('apps/web/package.json', (j) => {
  j.dependencies ||= {};
  j.dependencies.zod = '^4.3.6';
});
NODE

pnpm install

docker rm -f taskflow_db >/dev/null 2>&1 || true
docker compose up -d db

ok=0
for i in $(seq 1 20); do
  if pnpm --filter api prisma:deploy; then ok=1; break; fi
  echo "⏳ prisma:deploy failed (attempt $i/20). Waiting 2s..."
  sleep 2
done
if [ "$ok" -ne 1 ]; then
  echo "❌ prisma:deploy never succeeded. Run: docker logs taskflow_db"
  exit 1
fi

pnpm --filter api prisma:generate

pnpm lint
pnpm typecheck
pnpm test
pnpm build

echo "✅ OK: db + prisma + lint + typecheck + test + build all passed"
