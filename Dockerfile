# ─────────────── Stage 1: build ───────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install all deps (including dev) for the build.
COPY package*.json ./
RUN npm ci

# Generate the Prisma client, then compile TypeScript → dist/.
COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Strip dev dependencies for a lean runtime layer.
RUN npm prune --omit=dev

# ─────────────── Stage 2: runtime ───────────────
FROM node:20-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

# Run as a non-root user.
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Entrypoint applies migrations + seed, then starts the server.
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 4000

ENTRYPOINT ["./docker-entrypoint.sh"]
