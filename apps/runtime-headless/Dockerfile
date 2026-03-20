FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY apps/runtime-headless ./apps/runtime-headless
COPY packages ./packages

EXPOSE 4002

CMD ["node", "apps/runtime-headless/server.ts"]
