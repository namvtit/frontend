# ──────────────────────────────────────────────
# Stage 1: Install dependencies
# ──────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

FROM deps AS production-deps
RUN npm prune --omit=dev --ignore-scripts

# ──────────────────────────────────────────────
# Stage 2: Build the application
# ──────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ──────────────────────────────────────────────
# Stage 3: Production runner (minimal image)
# ──────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone server + static assets from build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Include dependencies for the separately executed migration script.
COPY --from=production-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/scripts/migrate.mjs ./scripts/migrate.mjs
COPY --from=builder --chown=nextjs:nodejs /app/lib/db/config.mjs ./lib/db/config.mjs
COPY --from=builder --chown=nextjs:nodejs /app/migrations ./migrations

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "node scripts/migrate.mjs && exec node server.js"]
