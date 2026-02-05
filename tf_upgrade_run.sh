set -euo pipefail

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install 20.20.0 >/dev/null
nvm use 20.20.0 >/dev/null
hash -r

corepack enable >/dev/null 2>&1 || true
corepack prepare pnpm@9.15.9 --activate >/dev/null 2>&1 || true
hash -r

node - <<'NODE'
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const exists = (p) => fs.existsSync(path.join(root, p));
if (!exists('package.json') || !exists('pnpm-workspace.yaml')) {
  console.error('Run this from the monorepo root (Task Flow).');
  process.exit(1);
}

const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });
const readJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJSON = (p, obj) => fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');

fs.writeFileSync('.nvmrc', '20.20.0\n');

fs.writeFileSync('.editorconfig', [
  'root = true',
  '',
  '[*]',
  'end_of_line = lf',
  'insert_final_newline = true',
  'charset = utf-8',
  'indent_style = space',
  'indent_size = 2',
  'trim_trailing_whitespace = true',
  '',
  '[*.md]',
  'trim_trailing_whitespace = false',
  ''
].join('\n'));

fs.writeFileSync('.gitignore', [
  'node_modules',
  '.pnpm-store',
  '.DS_Store',
  '.env',
  '.env.*',
  '!.env.example',
  'dist',
  '.next',
  '.turbo',
  'coverage',
  '*.log',
  ''
].join('\n'));

{
  const p = 'package.json';
  const pkg = readJSON(p);
  pkg.scripts ||= {};
  pkg.devDependencies ||= {};
  pkg.scripts.format ||= 'prettier -w .';
  pkg.scripts.check ||= 'pnpm lint && pnpm typecheck && pnpm test && pnpm build';
  pkg.scripts.seed ||= 'pnpm --filter api prisma:seed';
  pkg.scripts['dev:all'] ||= 'docker compose up -d db && pnpm --filter api prisma:deploy && pnpm --filter api prisma:generate && turbo dev --parallel';
  pkg.scripts.prepare ||= 'husky install';
  pkg.scripts['db:up'] ||= 'docker compose up -d db';
  pkg.scripts['db:down'] ||= 'docker compose down';
  pkg.scripts['db:reset'] ||= 'docker compose down -v && docker compose up -d db';
  pkg.devDependencies.husky ||= '^9.0.11';
  pkg.devDependencies['lint-staged'] ||= '^15.2.7';
  pkg['lint-staged'] ||= {
    '*.{js,jsx,ts,tsx,json,md,yml,yaml}': ['prettier --write'],
    '*.{js,jsx,ts,tsx}': ['eslint --fix']
  };
  writeJSON(p, pkg);
}

{
  const p = 'turbo.json';
  if (fs.existsSync(p)) {
    const t = readJSON(p);
    t.tasks ||= {};
    t.tasks.test ||= {};
    t.tasks.test.cache = false;
    t.tasks.test.outputs = [];
    writeJSON(p, t);
  }
}

{
  const p = path.join('apps', 'api', 'package.json');
  if (fs.existsSync(p)) {
    const pkg = readJSON(p);
    pkg.scripts ||= {};
    pkg.scripts['prisma:seed'] ||= 'tsx prisma/seed.ts';
    pkg.prisma ||= {};
    pkg.prisma.seed ||= 'tsx prisma/seed.ts';
    writeJSON(p, pkg);
  }
}

{
  const seedPath = path.join('apps', 'api', 'prisma', 'seed.ts');
  if (!fs.existsSync(seedPath)) {
    ensureDir(path.dirname(seedPath));
    fs.writeFileSync(seedPath, [
      "import { PrismaClient } from '@prisma/client';",
      "import bcrypt from 'bcryptjs';",
      '',
      'const prisma = new PrismaClient();',
      '',
      'async function main() {',
      "  const email = 'admin@taskflow.dev';",
      "  const password = 'admin1234';",
      '  const passwordHash = await bcrypt.hash(password, 10);',
      '',
      '  const user = await prisma.user.upsert({',
      '    where: { email },',
      '    update: { name: \'Admin\', passwordHash, role: \'ADMIN\' },',
      '    create: { name: \'Admin\', email, passwordHash, role: \'ADMIN\' },',
      '  });',
      '',
      '  const project = await prisma.project.upsert({',
      "    where: { id: 'demo-project' },",
      '    update: { name: \'Demo Project\' },',
      '    create: {',
      "      id: 'demo-project',",
      '      name: \'Demo Project\',',
      '      memberships: { create: { userId: user.id, role: \'OWNER\' } },',
      '    },',
      '  });',
      '',
      '  await prisma.task.createMany({',
      '    data: [',
      '      { projectId: project.id, title: \'Welcome to TaskFlow\', status: \'TODO\' },',
      '      { projectId: project.id, title: \'Create your first project\', status: \'IN_PROGRESS\' },',
      '      { projectId: project.id, title: \'Ship something\', status: \'DONE\' },',
      '    ],',
      '    skipDuplicates: true,',
      '  });',
      '',
      '  console.log(\'Seeded:\', { email, password });',
      '}',
      '',
      'main()',
      '  .catch((e) => {',
      '    console.error(e);',
      '    process.exit(1);',
      '  })',
      '  .finally(async () => {',
      '    await prisma.$disconnect();',
      '  });',
      ''
    ].join('\n'));
  }
}

{
  const p = path.join('apps', 'api', 'src', 'server.ts');
  if (fs.existsSync(p)) {
    let s = fs.readFileSync(p, 'utf8');
    if (!s.includes("app.get('/',")) {
      const anchor = "app.get('/health', async () => ({ ok: true }));";
      if (s.includes(anchor)) {
        s = s.replace(anchor, [
          "app.get('/', async () => ({ ok: true, name: 'TaskFlow API', docs: '/docs' }));",
          anchor
        ].join('\n\n'));
      }
    }
    fs.writeFileSync(p, s);
  }
}

{
  const p = 'docker-compose.yml';
  if (fs.existsSync(p)) {
    let s = fs.readFileSync(p, 'utf8');
    if (!s.includes('healthcheck:')) {
      const marker = '    volumes:\n      - taskflow_pgdata:/var/lib/postgresql/data\n';
      if (s.includes(marker)) {
        s = s.replace(marker, marker + [
          '    healthcheck:',
          '      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-taskflow} -d ${POSTGRES_DB:-taskflow}"]',
          '      interval: 2s',
          '      timeout: 3s',
          '      retries: 30',
          ''
        ].join('\n'));
      }
    }
    fs.writeFileSync(p, s);
  }
}

{
  const p = path.join('apps', 'web', 'src', 'lib', 'api.ts');
  if (fs.existsSync(p)) {
    let s = fs.readFileSync(p, 'utf8');
    s = s.replace(/const API_URL\s*=\s*process\.env\.NEXT_PUBLIC_API_URL\s*\|\|\s*'http:\/\/localhost:4000';/g, "const API_URL = env.NEXT_PUBLIC_API_URL;");
    fs.writeFileSync(p, s);
  }
}

console.log('✅ upgraded: hygiene + turbo test cache + docker healthcheck + api root + seed + web env usage');
NODE

pnpm install

if [ -d .git ]; then
  pnpm -w exec husky install >/dev/null 2>&1 || true
  mkdir -p .husky
  if [ ! -f .husky/pre-commit ]; then
    cat > .husky/pre-commit <<'HUSKY'
pnpm -w exec lint-staged
HUSKY
    chmod +x .husky/pre-commit
  fi
fi

docker rm -f taskflow_db >/dev/null 2>&1 || true
docker compose up -d db

for i in $(seq 1 30); do
  if docker inspect --format='{{.State.Health.Status}}' taskflow_db 2>/dev/null | grep -q healthy; then break; fi
  if [ "$i" -eq 30 ]; then break; fi
  sleep 1
done

pnpm --filter api prisma:deploy
pnpm --filter api prisma:generate
pnpm --filter api prisma:seed || true

pnpm lint
pnpm typecheck
pnpm test
pnpm build

pnpm --filter api dev & API_PID=$!
pnpm --filter web dev & WEB_PID=$!

trap 'kill $API_PID $WEB_PID 2>/dev/null || true' INT TERM EXIT
wait
