# Multi-stage build for production-ready Docker image

# Stage 1: Dependencies and Build
FROM node:20-alpine AS builder

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (skip postinstall since Prisma schema isn't copied yet)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client (manually run since we skipped postinstall)
RUN pnpm prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm build

# Stage 2: Production Runtime
FROM node:20-alpine AS production

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
# Skip postinstall script since we're copying generated Prisma client from builder
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Copy Prisma schema and generated client from builder
COPY --from=builder /app/prisma ./prisma
# Copy Prisma client - need both @prisma directory and .pnpm structure for pnpm
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
# Copy pnpm store for Prisma packages (pnpm requires this structure)
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port (default 5000, can be overridden via env)
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/server.js"]