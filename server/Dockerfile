# ProjectHub API image. Build from the server/ directory:
#   docker build -t projecthub-api .
# In Coolify: base directory "/server", Dockerfile location "/Dockerfile".
# On start the container applies pending database migrations, then starts the server.

FROM node:22-alpine AS base
# Prisma's engines need OpenSSL on Alpine.
RUN apk add --no-cache openssl
WORKDIR /app

# 1. Install dependencies (cached until the lockfile or schema changes).
#    The Prisma CLI is a dev dependency but is needed at runtime for `migrate deploy`, so keep it.
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --include=dev

# 2. Generate the Prisma client and compile TypeScript.
FROM deps AS build
COPY tsconfig.json prisma.config.ts ./
COPY src ./src
RUN npx prisma generate && npm run build

# 3. Runtime image, run as a non-root user.
FROM base AS runtime
ENV NODE_ENV=production PORT=5000 HOST=0.0.0.0 TRUST_PROXY_HOPS=1
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json prisma.config.ts ./
COPY --chown=node:node prisma ./prisma
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/v1/health" > /dev/null || exit 1
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && exec node dist/server.js"]
