# Stage 1: Build Frontend
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY server.js db.js ./

RUN mkdir -p /app/data

EXPOSE 3002

ENV NODE_ENV=production
ENV PORT=3002
ENV DB_DIR=/app/data

CMD ["node", "server.js"]
