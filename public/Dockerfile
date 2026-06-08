FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_BASE=/api
ARG NEXT_PUBLIC_ASSET_BASE=
ARG INTERNAL_API_BASE=http://siak_backend:8080/api
ARG INTERNAL_BACKEND_ORIGIN=http://siak_backend:8080

ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}
ENV NEXT_PUBLIC_ASSET_BASE=${NEXT_PUBLIC_ASSET_BASE}
ENV INTERNAL_API_BASE=${INTERNAL_API_BASE}
ENV INTERNAL_BACKEND_ORIGIN=${INTERNAL_BACKEND_ORIGIN}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/next-env.d.ts ./next-env.d.ts

EXPOSE 3000

CMD ["npm", "run", "start"]