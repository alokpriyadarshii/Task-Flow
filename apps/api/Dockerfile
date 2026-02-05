FROM node:20-alpine AS base
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile=false

COPY packages/shared packages/shared
COPY apps/api apps/api

RUN pnpm --filter api build
RUN pnpm --filter api prisma:generate

EXPOSE 4000
CMD ["pnpm", "--filter", "api", "start"]
