FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/dashboard/package.json apps/dashboard/package.json
RUN pnpm install --frozen-lockfile --filter @aegis/dashboard...

FROM base AS builder
COPY --from=dependencies /repo/node_modules ./node_modules
COPY --from=dependencies /repo/apps/dashboard/node_modules ./apps/dashboard/node_modules
COPY . .
RUN pnpm --filter @aegis/dashboard build

FROM node:22-alpine AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
WORKDIR /app
COPY --from=builder --chown=nextjs:nodejs /repo/apps/dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/dashboard/.next/static ./apps/dashboard/.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "apps/dashboard/server.js"]

