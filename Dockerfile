FROM node:18

ENV DEBIAN_FRONTEND=noninteractive
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN apt-get update && apt-get install -y --no-install-recommends \
  wget curl gnupg \
  libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 libxss1 \
  libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libgbm1 libgtk-3-0 libasound2 libxshmfence1 \
  libxext6 libxi6 libxtst6 libxkbcommon0 libpangocairo-1.0-0 \
  libglu1-mesa fonts-liberation chromium ffmpeg \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 4000

# KHÔNG dùng xvfb-run
CMD ["node", "--max-old-space-size=8192", "dist/main"]
