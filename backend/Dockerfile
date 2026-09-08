FROM node:24.16.0-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY shared/package.json shared/package.json
RUN npm ci
COPY shared shared
COPY scripts scripts
COPY .env.example .env.example
COPY backend backend
COPY database database
RUN npm run build -w backend
WORKDIR /app/backend
EXPOSE 3000
CMD ["node", "dist/server.js"]
