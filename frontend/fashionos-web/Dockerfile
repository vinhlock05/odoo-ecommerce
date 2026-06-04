# --- dev stage (used by docker-compose.yml) ---
FROM node:20-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# --- builder stage ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
ARG NEXT_PUBLIC_ODOO_URL=http://localhost:8069
ENV NEXT_PUBLIC_ODOO_URL=$NEXT_PUBLIC_ODOO_URL
RUN npm run build

# --- production stage ---
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
