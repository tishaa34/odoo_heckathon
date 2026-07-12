# ─────────────── Stage 1: build ───────────────
FROM node:20-slim AS builder

WORKDIR /app

# OpenSSL is required by the Prisma engines.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

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
FROM node:20-slim AS runner

ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Run as a non-root user.
RUN groupadd -r nodejs && useradd -r -g nodejs -m nodejs

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Entrypoint applies the schema + seed, then starts the server.
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 4000

ENTRYPOINT ["./docker-entrypoint.sh"]
