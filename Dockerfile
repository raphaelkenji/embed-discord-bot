FROM node:25-alpine

WORKDIR /app

RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci

COPY src/ ./src/

RUN npm run build

RUN npm prune --production

RUN mkdir -p logs

RUN addgroup -g 1001 -S nodejs && \
    adduser -S discord-bot -u 1001 -G nodejs

RUN chown -R discord-bot:nodejs /app

USER discord-bot

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "console.log('Bot is running')" || exit 1

CMD ["npm", "start"]