# syntax=docker/dockerfile:1.7

# ---------- builder: install deps + compile TS ----------
FROM node:20-alpine AS builder
WORKDIR /app

# openssl is required by the Prisma engine on alpine.
RUN apk add --no-cache openssl

# Pin the pnpm version to match `packageManager` in package.json. Without
# this pin, `corepack enable` would download the latest pnpm (currently
# v11.x), which uses Node 22+ builtins and crashes on this image with
# ERR_UNKNOWN_BUILTIN_MODULE.
# COREPACK_ENABLE_DOWNLOAD_PROMPT=0 silences the "is it OK to download?"
# prompt that otherwise hangs non-interactive CI builds.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

# Copy lockfiles + prisma schema first so layer cache survives code-only changes.
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# Now the source. Build emits to /app/dist.
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

# Trim to production deps for the runtime image (keeps prisma + @prisma/client).
RUN pnpm prune --prod


# ---------- runtime: minimal image, non-root ----------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    NODE_OPTIONS=--max-old-space-size=400 \
    PORT=4000

# tini reaps zombie children (multer/pdfkit spawn workers).
# wget gives us a healthcheck without curl.
# openssl is required by Prisma at runtime.
RUN apk add --no-cache tini wget openssl && \
    addgroup -S app && adduser -S app -G app && \
    mkdir -p /app/logs && chown -R app:app /app

COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/dist ./dist
COPY --from=builder --chown=app:app /app/prisma ./prisma
COPY --chown=app:app package.json ./

USER app

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/health/live || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]