# syntax=docker/dockerfile:1.7

# ---------- stage 1: production deps only ----------
FROM node:20-alpine AS prod-deps
WORKDIR /app

RUN apk add --no-cache openssl python3 make g++
RUN npm install -g pnpm@10.15.0

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile --prod --ignore-scripts
RUN pnpm exec prisma generate


# ---------- stage 2: build TypeScript ----------
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl
RUN npm install -g pnpm@10.15.0

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN pnpm build


# ---------- stage 3: runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    NODE_OPTIONS=--max-old-space-size=400 \
    PORT=4000

RUN apk add --no-cache tini wget openssl && \
    addgroup -S app && adduser -S app -G app && \
    mkdir -p /app/logs && chown -R app:app /app

COPY --from=prod-deps --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/dist ./dist
COPY --from=builder --chown=app:app /app/prisma ./prisma
COPY --chown=app:app package.json ./

USER app

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/health/live || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
