FROM node:20-alpine AS base
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile=false

COPY packages/shared packages/shared
COPY apps/web apps/web

RUN pnpm --filter web build

EXPOSE 3000
CMD ["pnpm", "--filter", "web", "start"]
