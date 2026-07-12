# ─── Stage 1: build the static bundle ───────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Install deps first for better layer caching.
COPY package*.json ./
RUN npm ci

COPY . .
# API base is relative (/api/v1) so nginx can proxy it — see nginx.conf.
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ─── Stage 2: serve with nginx ──────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# nginx template is env-substituted at container start (API_UPSTREAM).
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# Backend service to proxy /api to; overridable via compose/env.
ENV API_UPSTREAM=http://api:4000

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/ >/dev/null 2>&1 || exit 1
