# 🏗️ Stage 1: Build
FROM node:18-slim AS builder

# Cài đặt dependencies cho Puppeteer (Chromium headless)
RUN apt-get update && apt-get install -y \
  wget curl gnupg libnss3 libatk1.0-0 libcups2 libxcomposite1 libxrandr2 libxdamage1 libxi6 \
  libxtst6 libpangocairo-1.0-0 libx11-xcb1 libxss1 libxkbcommon0 libgbm1 libgtk-3-0 libasound2 \
  chromium && \
  apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Cài đặt NestJS CLI toàn cục để chạy lệnh `nest build`
RUN npm install -g @nestjs/cli

# Sao chép package.json để cài đặt dependencies
COPY package*.json ./

# Cài đặt dependencies production
RUN npm install --only=production --no-cache

# Sao chép mã nguồn vào Docker container
COPY . .

# Chạy build với NestJS
RUN nest build

# 🏗️ Stage 2: Runtime
FROM node:18-slim

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

# Định nghĩa biến môi trường cho Puppeteer sử dụng Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 4000

CMD ["node", "--max-old-space-size=8192", "dist/main"]
